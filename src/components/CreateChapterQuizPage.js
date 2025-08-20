import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function CreateChapterQuizPage({ currentUser, selectedChapter, setPage, setSelectedQuiz }) {
  const [loading, setLoading] = useState(false);
  const [chapter, setChapter] = useState(selectedChapter || null);
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    timeLimit: '',
    maxAttempts: 3,
    passingScore: 70
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 1
  });
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    if (selectedChapter) {
      checkExistingQuiz();
      setQuizData(prev => ({
        ...prev,
        title: `${selectedChapter.title} - Assessment`
      }));
    }
  }, [selectedChapter]);

  const checkExistingQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('chapter_quizzes')
        .select(
          `
          *,
          questions:chapter_quiz_questions(*)
        `
        )
        .eq('chapter_id', selectedChapter.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setExistingQuiz(data);
        setQuizData({
          title: data.title,
          description: data.description || '',
          timeLimit: data.time_limit || '',
          maxAttempts: data.max_attempts,
          passingScore: data.passing_score
        });
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Error checking existing quiz:', err);
    }
  };

  const handleCreateQuiz = async e => {
    e.preventDefault();

    if (questions.length === 0) {
      showError('Please add at least one question to the quiz');
      return;
    }

    try {
      setLoading(true);

      let quizId = existingQuiz?.id;

      if (!existingQuiz) {
        // Create new quiz
        const { data: newQuiz, error: quizError } = await supabase
          .from('chapter_quizzes')
          .insert({
            chapter_id: selectedChapter.id,
            title: quizData.title,
            description: quizData.description,
            time_limit: quizData.timeLimit ? parseInt(quizData.timeLimit) : null,
            max_attempts: parseInt(quizData.maxAttempts),
            passing_score: parseInt(quizData.passingScore)
          })
          .select()
          .single();

        if (quizError) throw quizError;
        quizId = newQuiz.id;
        setExistingQuiz(newQuiz);
      } else {
        // Update existing quiz
        const { error: updateError } = await supabase
          .from('chapter_quizzes')
          .update({
            title: quizData.title,
            description: quizData.description,
            time_limit: quizData.timeLimit ? parseInt(quizData.timeLimit) : null,
            max_attempts: parseInt(quizData.maxAttempts),
            passing_score: parseInt(quizData.passingScore)
          })
          .eq('id', existingQuiz.id);

        if (updateError) throw updateError;
      }

      showSuccess('Quiz saved successfully!');
      setSelectedQuiz({ id: quizId, ...quizData });
    } catch (err) {
      console.error('Error creating quiz:', err);
      showError('Failed to save quiz: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async e => {
    e.preventDefault();

    if (!existingQuiz) {
      showError('Please save the quiz first before adding questions');
      return;
    }

    try {
      const questionData = {
        quiz_id: existingQuiz.id,
        question_text: currentQuestion.questionText,
        question_type: currentQuestion.questionType,
        correct_answer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        points: parseInt(currentQuestion.points),
        order_index: questions.length + 1
      };

      // Add options for multiple choice questions
      if (currentQuestion.questionType === 'multiple_choice') {
        questionData.options = currentQuestion.options.filter(opt => opt.trim() !== '');
      } else if (currentQuestion.questionType === 'true_false') {
        questionData.options = ['True', 'False'];
      }

      const { data, error } = await supabase
        .from('chapter_quiz_questions')
        .insert(questionData)
        .select()
        .single();

      if (error) throw error;

      setQuestions(prev => [...prev, data]);
      setCurrentQuestion({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        points: 1
      });
      setShowAddQuestion(false);
      showSuccess('Question added successfully!');
    } catch (err) {
      console.error('Error adding question:', err);
      showError('Failed to add question: ' + (err.message || 'Unknown error'));
    }
  };

  const handlePublishQuiz = async () => {
    if (questions.length === 0) {
      showError('Add at least one question before publishing');
      return;
    }

    try {
      const { error } = await supabase
        .from('chapter_quizzes')
        .update({ is_published: !existingQuiz.is_published })
        .eq('id', existingQuiz.id);

      if (error) throw error;

      setExistingQuiz(prev => ({ ...prev, is_published: !prev.is_published }));
      showSuccess(existingQuiz.is_published ? 'Quiz unpublished' : 'Quiz published successfully!');
    } catch (err) {
      console.error('Error publishing quiz:', err);
      showError('Failed to update quiz status');
    }
  };

  const handleDeleteQuestion = async questionId => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('chapter_quiz_questions').delete().eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      showSuccess('Question deleted successfully');
    } catch (err) {
      console.error('Error deleting question:', err);
      showError('Failed to delete question');
    }
  };

  if (!chapter) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Chapter not found.</p>
          <button onClick={() => setPage('manage-chapter')}>Back to Chapter</button>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Create Quiz: {chapter.title}</h2>
        <button className='back-button' onClick={() => setPage('manage-chapter')}>
          Back to Chapter
        </button>
      </header>

      <div className='content-body'>
        {/* Quiz Settings */}
        <div className='card'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <h3>Quiz Settings</h3>
            {existingQuiz && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: existingQuiz.is_published ? '#e8f5e9' : '#fff3e0',
                    color: existingQuiz.is_published ? '#2e7d32' : '#ef6c00'
                  }}
                >
                  {existingQuiz.is_published ? 'Published' : 'Draft'}
                </span>
                <button
                  onClick={handlePublishQuiz}
                  style={{
                    width: 'auto',
                    background: existingQuiz.is_published ? '#f57c00' : '#4caf50',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {existingQuiz.is_published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateQuiz}>
            <div className='form-group'>
              <label>Quiz Title *</label>
              <input
                type='text'
                value={quizData.title}
                onChange={e => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className='form-group'>
              <label>Description</label>
              <textarea
                value={quizData.description}
                onChange={e => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                placeholder='Brief description of what this quiz covers...'
                rows={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className='form-group'>
                <label>Time Limit (minutes)</label>
                <input
                  type='number'
                  min='1'
                  value={quizData.timeLimit}
                  onChange={e => setQuizData(prev => ({ ...prev, timeLimit: e.target.value }))}
                  placeholder='No limit'
                />
              </div>

              <div className='form-group'>
                <label>Max Attempts</label>
                <input
                  type='number'
                  min='1'
                  max='10'
                  value={quizData.maxAttempts}
                  onChange={e => setQuizData(prev => ({ ...prev, maxAttempts: e.target.value }))}
                  required
                />
              </div>

              <div className='form-group'>
                <label>Passing Score (%)</label>
                <input
                  type='number'
                  min='1'
                  max='100'
                  value={quizData.passingScore}
                  onChange={e => setQuizData(prev => ({ ...prev, passingScore: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type='submit' disabled={loading} style={{ width: 'auto' }}>
              {loading ? 'Saving...' : existingQuiz ? 'Update Quiz' : 'Create Quiz'}
            </button>
          </form>
        </div>

        {/* Questions Section */}
        <div className='card'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <h3>Questions ({questions.length})</h3>
            <button
              onClick={() => setShowAddQuestion(true)}
              disabled={!existingQuiz}
              style={{
                width: 'auto',
                background: existingQuiz ? '#4caf50' : '#ccc',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Add Question
            </button>
          </div>

          {!existingQuiz && (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Save the quiz settings first to add questions.
            </p>
          )}

          {/* Add Question Form */}
          {showAddQuestion && (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                background: '#f9fafb'
              }}
            >
              <h4>Add New Question</h4>
              <form onSubmit={handleAddQuestion}>
                <div className='form-group'>
                  <label>Question Text *</label>
                  <textarea
                    value={currentQuestion.questionText}
                    onChange={e =>
                      setCurrentQuestion(prev => ({ ...prev, questionText: e.target.value }))
                    }
                    placeholder='Enter your question here...'
                    rows={3}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className='form-group'>
                    <label>Question Type</label>
                    <select
                      value={currentQuestion.questionType}
                      onChange={e =>
                        setCurrentQuestion(prev => ({
                          ...prev,
                          questionType: e.target.value,
                          options:
                            e.target.value === 'multiple_choice'
                              ? ['', '', '', '']
                              : ['True', 'False']
                        }))
                      }
                    >
                      <option value='multiple_choice'>Multiple Choice</option>
                      <option value='true_false'>True/False</option>
                      <option value='short_answer'>Short Answer</option>
                    </select>
                  </div>

                  <div className='form-group'>
                    <label>Points</label>
                    <input
                      type='number'
                      min='1'
                      max='10'
                      value={currentQuestion.points}
                      onChange={e =>
                        setCurrentQuestion(prev => ({ ...prev, points: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.questionType === 'multiple_choice' && (
                  <div className='form-group'>
                    <label>Answer Options</label>
                    {currentQuestion.options.map((option, index) => (
                      <input
                        key={index}
                        type='text'
                        value={option}
                        onChange={e => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                        }}
                        placeholder={`Option ${index + 1}`}
                        style={{ marginBottom: '0.5rem' }}
                        required={index < 2}
                      />
                    ))}
                  </div>
                )}

                <div className='form-group'>
                  <label>Correct Answer *</label>
                  {currentQuestion.questionType === 'multiple_choice' ? (
                    <select
                      value={currentQuestion.correctAnswer}
                      onChange={e =>
                        setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))
                      }
                      required
                    >
                      <option value=''>Select correct answer</option>
                      {currentQuestion.options
                        .filter(opt => opt.trim())
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  ) : currentQuestion.questionType === 'true_false' ? (
                    <select
                      value={currentQuestion.correctAnswer}
                      onChange={e =>
                        setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))
                      }
                      required
                    >
                      <option value=''>Select correct answer</option>
                      <option value='True'>True</option>
                      <option value='False'>False</option>
                    </select>
                  ) : (
                    <input
                      type='text'
                      value={currentQuestion.correctAnswer}
                      onChange={e =>
                        setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))
                      }
                      placeholder='Enter the correct answer'
                      required
                    />
                  )}
                </div>

                <div className='form-group'>
                  <label>Explanation (Optional)</label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={e =>
                      setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))
                    }
                    placeholder='Explain why this is the correct answer...'
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type='submit' style={{ width: 'auto' }}>
                    Add Question
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowAddQuestion(false)}
                    style={{ width: 'auto', background: '#6b7280' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Questions List */}
          {questions.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: 'white'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>
                        Question {index + 1} ({question.points} point
                        {question.points !== 1 ? 's' : ''})
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0' }}>{question.question_text}</p>

                      {question.question_type === 'multiple_choice' && question.options && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Options:</strong>
                          <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                            {question.options.map((option, optIndex) => (
                              <li
                                key={optIndex}
                                style={{
                                  color: option === question.correct_answer ? '#10b981' : 'inherit',
                                  fontWeight: option === question.correct_answer ? 'bold' : 'normal'
                                }}
                              >
                                {option} {option === question.correct_answer && '✓'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        <strong>Correct Answer:</strong> {question.correct_answer}
                      </div>

                      {question.explanation && (
                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      style={{
                        width: 'auto',
                        background: '#ef4444',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        marginLeft: '1rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            existingQuiz && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>No questions added yet. Click "Add Question" to get started!</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateChapterQuizPage;
