import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function StudentDashboard({ currentUser, setPage }) {
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [quizzesToday, setQuizzesToday] = useState(0);
  const [loadingQuizzesToday, setLoadingQuizzesToday] = useState(true);

  const dailyQuizLimit = 3;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingHistory(true);
      setLoadingQuizzesToday(true);

      // Fetch quiz history
      const { data: historyData, error: historyError } = await supabase
        .from('quiz_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (historyError) console.error("Error fetching quiz history:", historyError);
      else setQuizHistory(historyData || []);
      setLoadingHistory(false);

      // Check for a tutor application
      const { data: appData } = await supabase
        .from('tutor_applications')
        .select('status')
        .eq('user_id', currentUser.id)
        .single();
      
      if (appData) {
        setApplicationStatus(appData.status);
      }

      // Fetch today's quiz count if user is on the free tier
      if (currentUser.subscription_tier === 'free') {
        const { data: countData, error: countError } = await supabase.rpc('count_recent_quizzes', {
          p_user_id: currentUser.id
        });

        if (countError) console.error("Error fetching quiz count:", countError);
        else setQuizzesToday(countData);
      }
      setLoadingQuizzesToday(false);
    };

    fetchDashboardData();
  }, [currentUser.id, currentUser.subscription_tier]);

  const canTakeQuiz = currentUser.subscription_tier !== 'free' || quizzesToday < dailyQuizLimit;

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Welcome, {currentUser.full_name}!</h2>
        <button className="logout-button" onClick={() => supabase.auth.signOut()}>Log Out</button>
      </header>
      <div className="content-body">
        {applicationStatus && (
            <div className="card tutor-application-card">
                <h3>Teacher Application Status</h3>
                <p>Your application to become a teacher is currently: <strong>{applicationStatus}</strong></p>
            </div>
        )}

        <div className="dashboard-grid">
          <div className="card profile-info">
              <h3>My Profile</h3>
              <p><strong>School:</strong> {currentUser.school_name || 'Not set'}</p>
              <p><strong>Grade:</strong> {currentUser.grade_level || 'Not set'}</p>
              <p><strong>Subscription:</strong> <span className="tier-badge">{currentUser.subscription_tier}</span></p>
          </div>
          <div className="card start-quiz">
              <h3>Ready to test your knowledge?</h3>
              {loadingQuizzesToday ? (
                <p>Checking your daily limit...</p>
              ) : canTakeQuiz ? (
                <>
                  <p>You have <strong>{dailyQuizLimit - quizzesToday}</strong> free quizzes left today.</p>
                  <button className="start-button" onClick={() => setPage('select-subject')}>
                      Start New Quiz
                  </button>
                </>
              ) : (
                <div className="limit-reached">
                    <p>You've used all your free quizzes for today!</p>
                    <button className="upgrade-button" onClick={() => setPage('upgrade')}>Upgrade to Premium</button>
                </div>
              )}
              <button className="leaderboard-button" onClick={() => setPage('leaderboard')}>
                  View Leaderboard
              </button>
          </div>
        </div>

        <div className="card manage-lessons-card">
            <h3>My Lessons & Tutors</h3>
            <p>View your upcoming lessons or find a new teacher.</p>
            <div className="dashboard-buttons">
                <button className="my-lessons-btn" onClick={() => setPage('student-bookings')}>My Lessons</button>
                <button className="browse-teachers-btn" onClick={() => setPage('browse-teachers')}>Find a Teacher</button>
            </div>
        </div>
        
        <div className="card quiz-history">
            <h3>My Recent Quizzes</h3>
            {loadingHistory ? (
                <p>Loading history...</p>
            ) : quizHistory.length > 0 ? (
                <ul className="history-list">
                    {quizHistory.map(item => (
                        <li key={item.id}>
                            <span className="history-subject">{item.subject}</span>
                            <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                            <strong className="history-score">{item.score}/{item.total_questions}</strong>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You haven't completed any quizzes yet.</p>
            )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;