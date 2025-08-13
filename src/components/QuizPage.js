import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function QuizPage({ currentUser, selectedSubject, setPage }) {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      // Find a PUBLISHED quiz that matches the grade and subject
      const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('grade_level', currentUser.grade_level)
        .eq('subject', selectedSubject)
        .lte('publish_date', new Date().toISOString());

      if (quizError || quizzes.length === 0) {
        console.error('Error or no published quiz found:', quizError);
        setQuizQuestions([]);
        setLoading(false);
        return;
      }

      const currentQuizId = quizzes[0].id;
      setQuizId(currentQuizId);

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', currentQuizId);

      if (error) console.error('Error fetching questions:', error);
      else setQuizQuestions(data);
      setLoading(false);
    };

    if (selectedSubject) fetchQuestions();
  }, [currentUser.grade_level, selectedSubject]);

  // This new useEffect triggers ONLY when the quiz is finished to save the result.
  useEffect(() => {
    const saveQuizResult = async () => {
      if (quizFinished && quizId) {
        const { error } = await supabase
          .from('quiz_history')
          .insert({
            user_id: currentUser.id,
            quiz_id: quizId,
            score: score,
            total_questions: quizQuestions.length,
            subject: selectedSubject,
            grade_level: currentUser.grade_level,
          });
        if (error) {
          console.error("Error saving quiz history:", error);
          alert("Could not save your quiz score. Please try again later.");
        }
      }
    };
    saveQuizResult();
  }, [quizFinished, quizId, score, quizQuestions.length, currentUser, selectedSubject]);


  const proceedToNextQuestion = () => {
      setStudentAnswer('');
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setQuizFinished(true);
      }
  }

  const handleShortAnswerSubmit = async () => {
      if (!studentAnswer.trim()) {
          alert('Please enter an answer.');
          return;
      }
      setIsGrading(true);
      const currentQuestion = quizQuestions[currentQuestionIndex];

      const { data, error } = await supabase.functions.invoke('grade-short-answer', {
          body: { studentAnswer, correctAnswer: currentQuestion.correct_answer },
      });

      if (error) {
          alert('Error grading answer: ' + error.message);
          setIsGrading(false);
          return;
      }

      if (data.evaluation === 'CORRECT') {
          setScore(score + 1);
      }
      alert(`AI Evaluation: ${data.evaluation}\n\nExplanation: ${data.explanation}`);
      setIsGrading(false);
      proceedToNextQuestion();
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) setScore(score + 1);
    proceedToNextQuestion();
  };

  if (loading) {
    return <div className="main-container"><div className="content-body"><p>Loading quiz...</p></div></div>;
  }

  if (quizFinished) {
    return (
      <div className="main-container">
        <header className="main-header"><h2>Quiz Complete!</h2></header>
        <div className="content-body">
            <div className="card">
                <p className="final-score">Your final score is: {score} out of {quizQuestions.length}</p>
                <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
            </div>
        </div>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
      return (
           <div className="main-container">
             <header className="main-header"><h2>No Quiz Found</h2></header>
            <div className="content-body">
                <div className="card">
                    <p>Sorry, no quiz could be found for {selectedSubject} in your grade level.</p>
                    <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        </div>
      )
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
     <div className="main-container">
        <header className="main-header">
             <h3>{currentQuestion.subject}: {currentQuestion.topic}</h3>
             <p>Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
        </header>
        <div className="content-body">
            <div className="card">
                {currentQuestion.image_url && (
                    <div className="question-image-container">
                        <img src={currentQuestion.image_url} alt="Question illustration" className="question-image" />
                    </div>
                )}
                <div className="question-text"><p>{currentQuestion.question_text}</p></div>
                <div className="answer-section">
                    {currentQuestion.question_type === 'Multiple-Choice' && (
                        Object.entries(currentQuestion.options).map(([key, value]) => (
                            <button className="answer-button" key={key} onClick={() => handleAnswer(key === currentQuestion.correct_answer)}>
                            {key}: {value}
                            </button>
                        ))
                    )}
                    {currentQuestion.question_type === 'True/False' && (
                    <>
                        <button className="answer-button" onClick={() => handleAnswer('True' === currentQuestion.correct_answer)}>True</button>
                        <button className="answer-button" onClick={() => handleAnswer('False' === currentQuestion.correct_answer)}>False</button>
                    </>
                    )}
                    {currentQuestion.question_type === 'Short-Answer' && (
                    <>
                        <input type="text" className="short-answer-input" placeholder="Type your answer here..." value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} disabled={isGrading} />
                        <button onClick={handleShortAnswerSubmit} disabled={isGrading}>
                            {isGrading ? 'AI is Grading...' : 'Submit Answer'}
                        </button>
                    </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

export default QuizPage;