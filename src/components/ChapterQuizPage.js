import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function ChapterQuizPage({ currentUser, selectedChapter, setPage }) {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [attempts, setAttempts] = useState([]);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const { showSuccess, showError, showWarning } = useToastNotification();

  useEffect(() => {
    if (selectedChapter) {
      fetchQuizData();
    }
  }, [selectedChapter]);

  useEffect(() => {
    // Timer countdown
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizStarted && !quizCompleted) {
      handleSubmitQuiz(true); // Auto-submit when time runs out
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, quizStarted, quizCompleted]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);

      // Fetch quiz with questions
      const { data: quizData, error: quizError } = await supabase
        .from('chapter_quizzes')
        .select(`
          *,
          questions:chapter_quiz_questions(*)
        `)
        .eq('chapter_id', selectedChapter.id)
        .eq('is_published', true)
        .single();

      if (quizError) {
        if (quizError.code === 'PGRST116') {
          showError('No quiz available for this chapter yet.');
          setPage('course-overview');
          return;
        }
        throw quizError;
      }

      setQuiz(quizData);
      setQuestions(quizData.questions.sort((a, b) => a.order_index - b.order_index));

      // Fetch previous attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('chapter_quiz_attempts')
        .select('*')
        .eq('student_id', currentUser.id)
        .eq('quiz_id', quizData.id)
        .order('attempt_number', { ascending: false });

      if (attemptsError) throw attemptsError;
      setAttempts(attemptsData || []);

      // Check if student has already passed
      const passedAttempt = attemptsData?.find(attempt => attempt.passed);
      if (passedAttempt) {
        setResults(passedAttempt);
        setQuizCompleted(true);
      }
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      showError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    // Check if student can still attempt
    if (attempts.length >= quiz.max_attempts) {
      showError(`You have used all ${quiz.max_attempts} attempts for this quiz.`);
      return;
    }

    setQuizStarted(true);
    startTimeRef.current = Date.now();
    
    if (quiz.time_limit) {
      setTimeLeft(quiz.time_limit * 60); // Convert minutes to seconds
    }

    // Initialize answers object
    const initialAnswers = {};
    questions.forEach(q => {
      initialAnswers[q.id] = '';
    });
    setAnswers(initialAnswers);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit) {
      // Check if all questions are answered
      const unansweredQuestions = questions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
      if (unansweredQuestions.length > 0) {
        if (!window.confirm(`You have ${unansweredQuestions.length} unanswered questions. Submit anyway?`)) {
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      questions.forEach(question => {
        totalPoints += question.points;
        const studentAnswer = answers[question.id]?.trim().toLowerCase();
        const correctAnswer = question.correct_answer?.trim().toLowerCase();
        
        if (studentAnswer === correctAnswer) {
          correctAnswers += question.points;
        }
      });
      
      const score = totalPoints > 0 ? (correctAnswers / totalPoints) * 100 : 0;
      const passed = score >= quiz.passing_score;
      const attemptNumber = attempts.length + 1;

      // Save attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('chapter_quiz_attempts')
        .insert({
          student_id: currentUser.id,
          chapter_id: selectedChapter.id,
          quiz_id: quiz.id,
          score: score,
          passed: passed,
          attempt_number: attemptNumber,
          time_taken: timeTaken,
          answers: answers
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      setResults(attemptData);
      setQuizCompleted(true);
      setQuizStarted(false);

      if (passed) {
        showSuccess(`Congratulations! You passed with ${Math.round(score)}%`);
      } else {
        showWarning(`You scored ${Math.round(score)}%. You need ${quiz.passing_score}% to pass.`);
      }

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      showError('Failed to submit quiz: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!timeLeft || !quiz.time_limit) return '#666';
    const percentage = (timeLeft / (quiz.time_limit * 60)) * 100;
    if (percentage > 50) return '#10b981';
    if (percentage > 25) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="main-container">
        <div className="card">
          <p>No quiz found for this chapter.</p>
          <button onClick={() => setPage('course-overview')}>Back to Course</button>
        </div>
      </div>
    );
  }

  // Quiz completed - show results
  if (quizCompleted && results) {
    return (
      <div className="main-container">
        <header className="main-header">
          <h2>Quiz Results: {quiz.title}</h2>
          <button className="back-button" onClick={() => setPage('course-overview')}>
            Back to Course
          </button>
        </header>

        <div className="content-body">
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: results.passed ? '#10b981' : '#ef4444',
                marginBottom: '0.5rem'
              }}>
                {Math.round(results.score)}%
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: results.passed ? '#10b981' : '#ef4444',
                marginBottom: '1rem'
              }}>
                {results.passed ? '✅ PASSED' : '❌ FAILED'}
              </div>
              <p style={{ color: '#666' }}>
                You need {quiz.passing_score}% to pass this quiz
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {results.attempt_number}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Attempt Number</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {formatTime(results.time_taken)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Time Taken</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {quiz.max_attempts - attempts.length - 1}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Attempts Left</div>
              </div>
            </div>

            {!results.passed && attempts.length < quiz.max_attempts && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setQuizCompleted(false);
                    setResults(null);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                    setTimeLeft(null);
                  }}
                  style={{ background: '#3b82f6', padding: '1rem 2rem', fontSize: '1rem' }}
                >
                  Try Again
                </button>
              </div>
            )}

            {results.passed && (
              <div style={{ textAlign: 'center', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', marginTop: '1rem' }}>
                <p style={{ margin: 0, color: '#2e7d32', fontWeight: 600 }}>
                  🎉 Great job! You can now proceed to the next chapter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz not started - show intro
  if (!quizStarted) {
    return (
      <div className="main-container">
        <header className="main-header">
          <h2>{quiz.title}</h2>
          <button className="back-button" onClick={() => setPage('course-overview')}>
            Back to Course
          </button>
        </header>

        <div className="content-body">
          <div className="card">
            <h3>Quiz Instructions</h3>
            {quiz.description && (
              <p style={{ marginBottom: '1rem' }}>{quiz.description}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>Questions</div>
                <div>{questions.length}</div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>Passing Score</div>
                <div>{quiz.passing_score}%</div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>Time Limit</div>
                <div>{quiz.time_limit ? `${quiz.time_limit} minutes` : 'No limit'}</div>
              </div>
              
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>Attempts Left</div>
                <div>{quiz.max_attempts - attempts.length}</div>
              </div>
            </div>

            {attempts.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4>Previous Attempts</h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {attempts.map((attempt, index) => (
                    <div
                      key={attempt.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: attempt.passed ? '#e8f5e9' : '#fee2e2',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>Attempt {attempt.attempt_number}</span>
                      <span>{Math.round(attempt.score)}% - {attempt.passed ? 'Passed' : 'Failed'}</span>
                      <span>{formatTime(attempt.time_taken)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleStartQuiz}
                disabled={attempts.length >= quiz.max_attempts}
                style={{
                  background: attempts.length >= quiz.max_attempts ? '#ccc' : '#4caf50',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {attempts.length >= quiz.max_attempts ? 'No Attempts Left' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>{quiz.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {timeLeft !== null && (
            <div style={{ 
              color: getTimeColor(), 
              fontWeight: 'bold',
              fontSize: '1.125rem'
            }}>
              ⏰ {formatTime(timeLeft)}
            </div>
          )}
          <div style={{ color: '#666' }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      <div className="content-body">
        <div className="card">
          {/* Progress Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                height: '100%',
                background: '#3b82f6',
                borderRadius: '4px',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Question */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              Question {currentQuestionIndex + 1} ({currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''})
            </h3>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.6' }}>
              {currentQuestion.question_text}
            </p>
          </div>

          {/* Answer Options */}
          <div style={{ marginBottom: '2rem' }}>
            {currentQuestion.question_type === 'multiple_choice' && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: answers[currentQuestion.id] === option ? '#eff6ff' : 'white',
                      borderColor: answers[currentQuestion.id] === option ? '#3b82f6' : '#e5e7eb'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: answers[currentQuestion.id] === option ? '#eff6ff' : 'white',
                      borderColor: answers[currentQuestion.id] === option ? '#3b82f6' : '#e5e7eb'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'short_answer' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Enter your answer here..."
                rows={4}
                style={{ width: '100%', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '8px' }}
              />
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              style={{
                width: 'auto',
                background: currentQuestionIndex === 0 ? '#ccc' : '#6b7280',
                padding: '0.75rem 1.5rem'
              }}
            >
              Previous
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index === currentQuestionIndex ? '#3b82f6' : 
                               answers[questions[index].id] ? '#10b981' : '#e5e7eb',
                    color: index === currentQuestionIndex || answers[questions[index].id] ? 'white' : '#666',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={() => handleSubmitQuiz()}
                disabled={submitting}
                style={{
                  width: 'auto',
                  background: '#4caf50',
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                style={{
                  width: 'auto',
                  background: '#3b82f6',
                  padding: '0.75rem 1.5rem'
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChapterQuizPage;