import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FiAward, FiShoppingBag, FiDollarSign, FiStar, FiClock, FiCheckCircle } from 'react-icons/fi';
import ChildConnectionRequests from '../parent/ChildConnectionRequests';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, LoadingSpinner, Table } from '../ui';

function StudentDashboard() {
  const navigate = useNavigate();
  const { profile: currentUser } = useAuth();
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
          <Button 
            variant="secondary" 
            onClick={() => navigate('/leaderboard')}
            className="mr-2"
          >
            🏆 Leaderboard
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/teachers')}
            className="mr-2"
          >
            👨‍🏫 Browse Tutors
          </Button>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </header>
            <div className="content-body">
        <ChildConnectionRequests user={currentUser} />
        {applicationStatus && (
            <Card className="tutor-application-card">
                <Card.Header>
                    <h3>Teacher Application Status</h3>
                </Card.Header>
                <Card.Body>
                    <p>Your application to become a teacher is currently: <strong>{applicationStatus}</strong></p>
                </Card.Body>
            </Card>
        )}

        <div className="dashboard-grid">
          <Card className="profile-info">
              <Card.Header>
                <h3>My Profile</h3>
              </Card.Header>
              <Card.Body>
                <p><strong>School:</strong> {currentUser.school_name || 'Not set'}</p>
                <p><strong>Grade:</strong> {currentUser.grade_level || 'Not set'}</p>
                <div className="subscription-status">
                  <strong>Subscription:</strong> 
                  <span className={`tier-badge ${currentUser.subscription_tier}`}>
                    {currentUser.subscription_tier}
                    {currentUser.subscription_tier === 'premium' && <FiStar className="premium-icon" />}
                  </span>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/subscriptions')}
                  >
                    {currentUser.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
              
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
          <Card className="start-quiz">
              <Card.Header>
                <h3>Ready to test your knowledge?</h3>
              </Card.Header>
              <Card.Body>
                {loadingQuizzesToday ? (
                  <LoadingSpinner size="sm" />
                ) : canTakeQuiz ? (
                  <>
                    <p>You have <strong>{dailyQuizLimit - quizzesToday}</strong> free quizzes left today.</p>
                    <Button variant="primary" size="lg" onClick={() => navigate('/subjects')}>
                        Start New Quiz
                    </Button>
                  </>
                ) : (
                  <div className="limit-reached">
                      <p>You've used all your free quizzes for today!</p>
                      <Button variant="primary" onClick={() => navigate('/upgrade')}>Upgrade to Premium</Button>
                  </div>
                )}
                <Button variant="secondary" onClick={() => navigate('/leaderboard')} className="mt-4">
                    View Leaderboard
                </Button>
              </Card.Body>
          </Card>
        </div>

        {/* Usage Summary Widget */}
        <UsageSummaryWidget currentUser={currentUser} setPage={setPage} />

        // ... existing code ...
        </div>

        <div className="dashboard-grid">
          {/* Lessons Card */}
          <div className="card manage-lessons-card">
// ... existing code ...

          {/* Premium Features Card */}
          <Card className="premium-features">
            <Card.Header>
              <h3><FiStar className="card-icon" /> Premium Features</h3>
            </Card.Header>
            <Card.Body>
              <ul className="premium-list">
                <li><FiCheckCircle /> Unlimited daily quizzes</li>
                <li><FiCheckCircle /> Advanced analytics</li>
                <li><FiCheckCircle /> Priority support</li>
                <li><FiCheckCircle /> Ad-free experience</li>
              </ul>
              <Button 
                variant="primary"
                onClick={() => navigate('/subscriptions')}
              >
                {currentUser.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage Subscription'}
              </Button>
            </Card.Body>
          </Card>

          {/* Payment Management Card */}
          <Card className="payment-card">
            <Card.Header>
              <h3><FiDollarSign className="card-icon" /> Payment & Billing</h3>
            </Card.Header>
            <Card.Body>
              <p>Manage your subscription, view payment history, and update billing information.</p>
              <div className="payment-buttons">
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/subscription/manage')}
                  className="mr-2"
                >
                  Manage Subscription
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/payment/history')}
                >
                  Payment History
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Premium Shop Card */}
          <Card className="shop-card">
            <Card.Header>
              <h3><FiShoppingBag className="card-icon" /> Premium Shop</h3>
            </Card.Header>
            <Card.Body>
              <p>Purchase premium content, study guides, and exam prep materials.</p>
              <Button 
                variant="primary"
                onClick={() => navigate('/shop')}
              >
                Visit Shop
              </Button>
            </Card.Body>
          </Card>
        </div>
        
        <Card className="quiz-history">
            <Card.Header className="flex justify-between items-center">
              <h3>My Recent Quizzes</h3>
              <Button 
                variant="text"
                onClick={() => navigate('/subjects')}
                disabled={!canTakeQuiz}
              >
                Take New Quiz
              </Button>
            </Card.Header>
            {loadingHistory ? (
                <LoadingSpinner />
            ) : quizHistory.length > 0 ? (
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Subject</Table.HeaderCell>
                            <Table.HeaderCell>Date</Table.HeaderCell>
                            <Table.HeaderCell>Score</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {quizHistory.map(item => (
                            <Table.Row key={item.id}>
                                <Table.Cell>{item.subject}</Table.Cell>
                                <Table.Cell>{new Date(item.created_at).toLocaleDateString()}</Table.Cell>
                                <Table.Cell><strong>{item.score}/{item.total_questions}</strong></Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ) : (
                <p>You haven't completed any quizzes yet.</p>
            )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;