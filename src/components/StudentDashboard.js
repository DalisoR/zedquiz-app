import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FiAward, FiShoppingBag, FiDollarSign, FiStar, FiClock, FiCheckCircle } from 'react-icons/fi';
import ChildConnectionRequests from './ChildConnectionRequests';
import { UsageSummaryWidget } from './UsageLimitGuard';

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
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Welcome, {currentUser.full_name || 'Student'}</h2>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setPage('leaderboard')}
            style={{ marginRight: '10px' }}
          >
            🏆 Leaderboard
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setPage('browse-teachers')}
            style={{ marginRight: '10px' }}
          >
            👨‍🏫 Browse Tutors
          </button>
          <button className="btn btn-outline" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </header>
            <div className="content-body">
        <ChildConnectionRequests user={currentUser} />
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
              <div className="subscription-status">
                <strong>Subscription:</strong> 
                <span className={`tier-badge ${currentUser.subscription_tier}`}>
                  {currentUser.subscription_tier}
                  {currentUser.subscription_tier === 'premium' && <FiStar className="premium-icon" />}
                </span>
                <button 
                  className="btn-upgrade"
                  onClick={() => setPage('subscriptions')}
                >
                  {currentUser.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage'}
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-item">
                  <FiAward className="stat-icon" />
                  <div>
                    <div className="stat-value">
                      {currentUser.points_balance || 0}
                    </div>
                    <div className="stat-label">Points</div>
                  </div>
                </div>
                <div className="stat-item">
                  <FiClock className="stat-icon" />
                  <div>
                    <div className="stat-value">
                      {dailyQuizLimit - (currentUser.subscription_tier === 'free' ? quizzesToday : 0)}/{dailyQuizLimit}
                    </div>
                    <div className="stat-label">Quizzes Left</div>
                  </div>
                </div>
              </div>
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

        {/* Usage Summary Widget */}
        <UsageSummaryWidget currentUser={currentUser} setPage={setPage} />

        <div className="dashboard-grid">
          {/* Lessons Card */}
          <div className="card manage-lessons-card">
            <h3><FiClock className="card-icon" /> My Lessons</h3>
            <p>View your upcoming lessons or find a new teacher.</p>
            <div className="dashboard-buttons">
              <button className="my-lessons-btn" onClick={() => setPage('student-bookings')}>My Lessons</button>
              <button className="browse-teachers-btn" onClick={() => setPage('browse-teachers')}>Find a Teacher</button>
              <button className="certificates-btn" onClick={() => setPage('student-certificates')}>My Certificates</button>
            </div>
          </div>

          {/* Premium Features Card */}
          <div className="card premium-features">
            <h3><FiStar className="card-icon" /> Premium Features</h3>
            <ul className="premium-list">
              <li><FiCheckCircle /> Unlimited daily quizzes</li>
              <li><FiCheckCircle /> Advanced analytics</li>
              <li><FiCheckCircle /> Priority support</li>
              <li><FiCheckCircle /> Ad-free experience</li>
            </ul>
            <button 
              className="btn-premium"
              onClick={() => setPage('subscriptions')}
            >
              {currentUser.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage Subscription'}
            </button>
          </div>

          {/* Payment Management Card */}
          <div className="card payment-card">
            <h3><FiDollarSign className="card-icon" /> Payment & Billing</h3>
            <p>Manage your subscription, view payment history, and update billing information.</p>
            <div className="payment-buttons">
              <button 
                className="btn-payment"
                onClick={() => setPage('subscription-management')}
              >
                Manage Subscription
              </button>
              <button 
                className="btn-payment-history"
                onClick={() => setPage('payment-history')}
              >
                Payment History
              </button>
            </div>
          </div>

          {/* Premium Shop Card */}
          <div className="card shop-card">
            <h3><FiShoppingBag className="card-icon" /> Premium Shop</h3>
            <p>Purchase premium content, study guides, and exam prep materials.</p>
            <button 
              className="btn-shop"
              onClick={() => setPage('shop')}
            >
              Visit Shop
            </button>
          </div>
        </div>
        
        <div className="card quiz-history">
            <div className="card-header">
              <h3>My Recent Quizzes</h3>
              <button 
                className="btn-text"
                onClick={() => setPage('select-subject')}
                disabled={!canTakeQuiz}
              >
                Take New Quiz
              </button>
            </div>
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