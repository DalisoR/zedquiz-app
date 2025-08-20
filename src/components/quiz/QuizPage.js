import React, { useState, useEffect } from 'react';

import { usePoints } from '../../hooks/usePoints';
import { useToastNotification } from '../../hooks/useToastNotification';
import { supabase } from '../../supabaseClient';
import RatingForm from '../gamification/RatingForm';

function QuizPage({ currentUser, selectedSubject, setPage }) {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [tutorId, setTutorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const { awardPoints } = usePoints();
  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      // Find a PUBLISHED quiz that matches the grade and subject
      const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('id, author_id')
        .eq('grade_level', currentUser.grade_level)
        .eq('subject', selectedSubject)
        .lte('publish_date', new Date().toISOString());

      if (quizError || quizzes.length === 0) {
        console.error('Error or no published quiz found:', quizError);
        setQuizQuestions([]);
        setLoading(false);
        return;
      }

      const currentQuiz = quizzes[0];
      setQuizId(currentQuiz.id);
      setTutorId(currentQuiz.author_id);

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', currentQuiz.id);

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
        const { error } = await supabase.from('quiz_history').insert({
          user_id: currentUser.id,
          quiz_id: quizId,
          score: score,
          total_questions: quizQuestions.length,
          subject: selectedSubject,
          grade_level: currentUser.grade_level
        });
        if (error) {
          console.error('Error saving quiz history:', error);
          alert('Could not save your quiz score. Please try again later.');
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
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (!quizId) return;

    try {
      // Calculate points based on score (10 points per correct answer)
      const pointsEarned = score * 10;

      // Award points for completing the quiz
      await awardPoints(
        pointsEarned,
        'quiz_completion',
        quizId,
        quizId,
        `You earned ${pointsEarned} points for completing the quiz!`
      );

      // Award bonus points for perfect score
      if (quizQuestions.length > 0 && score === quizQuestions.length) {
        const bonusPoints = 50;
        await awardPoints(
          bonusPoints,
          'perfect_quiz',
          quizId,
          `Perfect score! Bonus ${bonusPoints} points!`
        );
      }

      // Check if this is the first attempt
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('quiz_id', quizId);

      if (!attemptsError && attempts && attempts.length === 0) {
        const firstAttemptBonus = 20;
        await awardPoints(
          firstAttemptBonus,
          'first_attempt',
          quizId,
          `First attempt bonus! +${firstAttemptBonus} points!`
        );
      }

      // Record the quiz attempt
      const { error } = await supabase.from('quiz_attempts').insert([
        {
          user_id: currentUser.id,
          quiz_id: quizId,
          score: score,
          total_questions: quizQuestions.length,
          completed_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error in handleFinishQuiz:', error);
    } finally {
      setQuizFinished(true);
    }
    setIsGrading(false);
    proceedToNextQuestion();
  };

  const handleAnswer = isCorrect => {
    if (isCorrect) setScore(score + 1);
    proceedToNextQuestion();
  };

  const handleShortAnswerSubmit = async () => {
    if (!studentAnswer.trim()) return; // Don't submit empty answers

    setIsGrading(true);

    try {
      const checkAnswer = () => {
        if (!studentAnswer.trim()) {
          showError('No Answer', 'Please enter an answer before submitting.');
          return;
        }

        const currentQuestion = quizQuestions[currentQuestionIndex];
        const userAnswer = studentAnswer.trim().toLowerCase();
        const correctAnswer = currentQuestion.answer.toLowerCase();

        // Check for exact match first
        if (userAnswer === correctAnswer) {
          handleCorrectAnswer();
          return;
        }

        // Check for partial match (if answer is a phrase)
        if (
          correctAnswer.includes(' ') &&
          (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer))
        ) {
          handlePartialMatch(correctAnswer, 0.5);
          return;
        }

        // Split into words and check for matching words
        const userWords = userAnswer.split(/\s+/);
        const correctWords = correctAnswer.split(/\s+/);
        const matchingWords = userWords.filter(word => correctWords.some(cw => cw === word));

        // If more than 50% of words match, give partial credit
        const matchRatio = matchingWords.length / correctWords.length;
        if (matchRatio > 0.5) {
          handlePartialMatch(correctAnswer, matchRatio);
        } else {
          handleIncorrectAnswer(correctAnswer);
        }
      };

      const handleCorrectAnswer = () => {
        setScore(prev => prev + 1);
        showSuccess({
          title: 'Correct!',
          message: 'Great job!'
        });
        proceedToNextQuestion();
      };

      const handlePartialMatch = (correctAnswer, scoreMultiplier) => {
        const points = Math.ceil(scoreMultiplier * 10) / 10; // Round to 1 decimal place
        setScore(prev => prev + scoreMultiplier);
        showSuccess({
          title: 'Partially Correct!',
          message: `You got ${(scoreMultiplier * 100).toFixed(
            0
          )}% credit. The full answer is: ${correctAnswer}`
        });
        proceedToNextQuestion();
      };

      const handleIncorrectAnswer = correctAnswer => {
        showError({
          title: 'Incorrect',
          message: `The correct answer is: ${correctAnswer}. Try to review this topic.`
        });
        proceedToNextQuestion();
      };

      checkAnswer();
    } catch (error) {
      console.error('Error grading short answer:', error);
      showError({
        title: 'Error',
        message: 'Error grading your answer. Please try again.'
      });
    } finally {
      setIsGrading(false);
    }
  };

  if (loading) {
    return (
      <div className='main-container'>
        <div className='content-body'>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className='main-container'>
        <header className='main-header'>
          <h2>Quiz Complete!</h2>
        </header>
        <div className='content-body'>
          <div className='card'>
            <p className='final-score'>
              Your final score is: {score} out of {quizQuestions.length}
            </p>

            {!ratingSubmitted && tutorId && (
              <RatingForm
                contentId={quizId}
                contentType='quiz'
                tutorId={tutorId}
                studentId={currentUser.id}
                onRatingSubmitted={() => {
                  showSuccess('Thanks for your feedback!');
                  setRatingSubmitted(true);
                }}
              />
            )}

            <button onClick={() => setPage('dashboard')} style={{ marginTop: '1rem' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className='main-container'>
        <header className='main-header'>
          <h2>No Quiz Found</h2>
        </header>
        <div className='content-body'>
          <div className='card'>
            <p>Sorry, no quiz could be found for {selectedSubject} in your grade level.</p>
            <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h3>
          {currentQuestion.subject}: {currentQuestion.topic}
        </h3>
        <p>
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </p>
      </header>
      <div className='content-body'>
        <div className='card'>
          {currentQuestion.image_url && (
            <div className='question-image-container'>
              <img
                src={currentQuestion.image_url}
                alt='Question illustration'
                className='question-image'
              />
            </div>
          )}
          <div className='question-text'>
            <p>{currentQuestion.question_text}</p>
          </div>
          <div className='answer-section'>
            {currentQuestion.question_type === 'Multiple-Choice' &&
              Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  className='answer-button'
                  key={key}
                  onClick={() => handleAnswer(key === currentQuestion.correct_answer)}
                >
                  {key}: {value}
                </button>
              ))}
            {currentQuestion.question_type === 'True/False' && (
              <>
                <button
                  className='answer-button'
                  onClick={() => handleAnswer('True' === currentQuestion.correct_answer)}
                >
                  True
                </button>
                <button
                  className='answer-button'
                  onClick={() => handleAnswer('False' === currentQuestion.correct_answer)}
                >
                  False
                </button>
              </>
            )}
            {currentQuestion.question_type === 'Short-Answer' && (
              <>
                <input
                  type='text'
                  className='short-answer-input'
                  placeholder='Type your answer here...'
                  value={studentAnswer}
                  onChange={e => setStudentAnswer(e.target.value)}
                  disabled={isGrading}
                />
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
