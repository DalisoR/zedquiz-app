import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import {
  FiAward,
  FiShoppingBag,
  FiDollarSign,
  FiStar,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import ChildConnectionRequests from '../parent/ChildConnectionRequests';
import { Button, Card, LoadingSpinner, Table } from '../ui';

import styles from './StudentDashboard.module.css';

/**
 * @component StudentDashboard
 * @category Student Components
 *
 * @description
 * Dashboard component for student users. Displays student information,
 * quiz history, subscription status, and available features.
 *
 * @example
 * ```jsx
 * import { StudentDashboard } from './StudentDashboard';
 *
 * function App() {
 *   return (
 *     <StudentDashboard />
 *   );
 * }
 * ```
 */
export const StudentDashboard = () => {
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

      try {
        // Fetch quiz history
        const { data: historyData, error: historyError } = await supabase
          .from('quiz_history')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (historyError) throw historyError;
        setQuizHistory(historyData || []);

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
          const { data: countData, error: countError } = await supabase.rpc(
            'count_recent_quizzes',
            {
              p_user_id: currentUser.id
            }
          );

          if (countError) throw countError;
          setQuizzesToday(countData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingHistory(false);
        setLoadingQuizzesToday(false);
      }
    };

    fetchDashboardData();
  }, [currentUser.id, currentUser.subscription_tier]);

  const canTakeQuiz = currentUser.subscription_tier !== 'free' || quizzesToday < dailyQuizLimit;

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h2>Welcome, {currentUser.full_name || 'Student'}</h2>
        <div className={styles.headerActions}>
          <Button
            variant='secondary'
            onClick={() => navigate('/leaderboard')}
            className={styles.headerButton}
          >
            🏆 Leaderboard
          </Button>
          <Button
            variant='primary'
            onClick={() => navigate('/teachers')}
            className={styles.headerButton}
          >
            👨‍🏫 Browse Tutors
          </Button>
          <Button variant='outline' onClick={() => supabase.auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className={styles.contentBody}>
        <ChildConnectionRequests user={currentUser} />

        {applicationStatus && (
          <Card className={styles.tutorApplicationCard}>
            <Card.Header>
              <h3>Teacher Application Status</h3>
            </Card.Header>
            <Card.Body>
              <p>
                Your application to become a teacher is currently:{' '}
                <strong>{applicationStatus}</strong>
              </p>
            </Card.Body>
          </Card>
        )}

        <div className={styles.dashboardGrid}>
          <Card className={styles.profileInfo}>
            <Card.Header>
              <h3>My Profile</h3>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>School:</strong> {currentUser.school_name || 'Not set'}
              </p>
              <p>
                <strong>Grade:</strong> {currentUser.grade_level || 'Not set'}
              </p>
              <div className={styles.subscriptionStatus}>
                <strong>Subscription:</strong>
                <span className={`${styles.tierBadge} ${styles[currentUser.subscription_tier]}`}>
                  {currentUser.subscription_tier}
                  {currentUser.subscription_tier === 'premium' && (
                    <FiStar className={styles.premiumIcon} />
                  )}
                </span>
                <Button variant='primary' size='sm' onClick={() => navigate('/subscriptions')}>
                  {currentUser.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage'}
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div className={styles.quickStats}>
            <div className={styles.statItem}>
              <FiAward className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>{currentUser.points_balance || 0}</div>
                <div className={styles.statLabel}>Points</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <FiClock className={styles.statIcon} />
              <div>
                <div className={styles.statValue}>
                  {dailyQuizLimit - (currentUser.subscription_tier === 'free' ? quizzesToday : 0)}/
                  {dailyQuizLimit}
                </div>
                <div className={styles.statLabel}>Quizzes Left</div>
              </div>
            </div>
          </div>

          <Card className={styles.startQuiz}>
            <Card.Header>
              <h3>Ready to test your knowledge?</h3>
            </Card.Header>
            <Card.Body>
              {loadingQuizzesToday ? (
                <LoadingSpinner size='sm' />
              ) : canTakeQuiz ? (
                <>
                  <p>
                    You have <strong>{dailyQuizLimit - quizzesToday}</strong> free quizzes left
                    today.
                  </p>
                  <Button variant='primary' size='lg' onClick={() => navigate('/subjects')}>
                    Start New Quiz
                  </Button>
                </>
              ) : (
                <div className={styles.limitReached}>
                  <p>You've used all your free quizzes for today!</p>
                  <Button variant='primary' onClick={() => navigate('/upgrade')}>
                    Upgrade to Premium
                  </Button>
                </div>
              )}
              <Button
                variant='secondary'
                onClick={() => navigate('/leaderboard')}
                className={styles.leaderboardButton}
              >
                View Leaderboard
              </Button>
            </Card.Body>
          </Card>
        </div>

        <div className={styles.dashboardGrid}>
          <Card className={styles.manageLessonsCard}>
            <Card.Header>
              <h3>Manage Your Lessons</h3>
            </Card.Header>
            <Card.Body>
              <p>Schedule and manage your tutoring sessions.</p>
              <Button variant='primary' onClick={() => navigate('/lessons')}>
                View My Lessons
              </Button>
            </Card.Body>
          </Card>

          <Card className={styles.premiumFeatures}>
            <Card.Header>
              <h3>
                <FiStar className={styles.cardIcon} /> Premium Features
              </h3>
            </Card.Header>
            <Card.Body>
              <ul className={styles.premiumList}>
                <li>
                  <FiCheckCircle /> Unlimited daily quizzes
                </li>
                <li>
                  <FiCheckCircle /> Advanced analytics
                </li>
                <li>
                  <FiCheckCircle /> Priority support
                </li>
                <li>
                  <FiCheckCircle /> Ad-free experience
                </li>
              </ul>
              <Button variant='primary' onClick={() => navigate('/subscriptions')}>
                {currentUser.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage Subscription'}
              </Button>
            </Card.Body>
          </Card>

          <Card className={styles.paymentCard}>
            <Card.Header>
              <h3>
                <FiDollarSign className={styles.cardIcon} /> Payment & Billing
              </h3>
            </Card.Header>
            <Card.Body>
              <p>Manage your subscription, view payment history, and update billing information.</p>
              <div className={styles.paymentButtons}>
                <Button
                  variant='secondary'
                  onClick={() => navigate('/subscription/manage')}
                  className={styles.managementButton}
                >
                  Manage Subscription
                </Button>
                <Button variant='secondary' onClick={() => navigate('/payment/history')}>
                  Payment History
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className={styles.shopCard}>
            <Card.Header>
              <h3>
                <FiShoppingBag className={styles.cardIcon} /> Premium Shop
              </h3>
            </Card.Header>
            <Card.Body>
              <p>Purchase premium content, study guides, and exam prep materials.</p>
              <Button variant='primary' onClick={() => navigate('/shop')}>
                Visit Shop
              </Button>
            </Card.Body>
          </Card>
        </div>

        <Card className={styles.quizHistory}>
          <Card.Header>
            <div className={styles.quizHistoryHeader}>
              <h3>My Recent Quizzes</h3>
              <Button variant='text' onClick={() => navigate('/subjects')} disabled={!canTakeQuiz}>
                Take New Quiz
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
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
                      <Table.Cell>
                        <strong>
                          {item.score}/{item.total_questions}
                        </strong>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            ) : (
              <p>You haven't completed any quizzes yet.</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

StudentDashboard.propTypes = {
  // This component doesn't accept any props
};

export default StudentDashboard;
