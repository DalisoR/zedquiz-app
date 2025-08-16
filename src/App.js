import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { initAnalytics, trackPageView, trackLogin } from './utils/analytics';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { GamificationProvider } from './contexts/GamificationContext';
import { MonetizationProvider } from './contexts/MonetizationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonCard } from './components/ui/Skeleton';
import { TopNav, BottomNav } from './components/ui/Navigation';

import './App.css';

const LandingPage = lazy(() => import('./components/LandingPage'));
const SubscriptionPlans = lazy(() => import('./components/monetization/SubscriptionPlans'));
const InAppPurchases = lazy(() => import('./components/monetization/InAppPurchases'));
const AffiliateProgram = lazy(() => import('./components/monetization/AffiliateProgram'));
const AuthChoicePage = lazy(() => import('./components/AuthChoicePage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const RegistrationPage = lazy(() => import('./components/RegistrationPage'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const SubjectSelectionPage = lazy(() => import('./components/SubjectSelectionPage'));
const QuizPage = lazy(() => import('./components/QuizPage'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const CreateQuizPage = lazy(() => import('./components/CreateQuizPage'));
const AddQuestionsPage = lazy(() => import('./components/AddQuestionsPage'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'));
const UpgradePage = lazy(() => import('./components/UpgradePage'));
const TutorApplicationPage = lazy(() => import('./components/TutorApplicationPage'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const ApplicationReviewPage = lazy(() => import('./components/ApplicationReviewPage'));
const ManageQuizzesPage = lazy(() => import('./components/ManageQuizzesPage'));
const TeacherProfilePage = lazy(() => import('./components/TeacherProfilePage'));
const BrowseTeachersPage = lazy(() => import('./components/BrowseTeachersPage'));
const TeacherPublicProfilePage = lazy(() => import('./components/TeacherPublicProfilePage'));
const TeacherAvailabilityPage = lazy(() => import('./components/TeacherAvailabilityPage'));
const BookingPage = lazy(() => import('./components/BookingPage'));
const TeacherBookingsPage = lazy(() => import('./components/TeacherBookingsPage'));
const TeacherEarningsDashboard = lazy(() => import('./components/monetization/TeacherEarningsDashboard'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const PaymentStatusPage = lazy(() => import('./components/PaymentStatusPage'));

function App() {
  const [page, setPage] = useState('landing');
  const [history, setHistory] = useState([]); // simple stack of previous pages
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Initialize analytics
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(window.location.pathname + '#' + page);
  }, [page]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        trackLogin('email');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setHistory([]);
        setPage('landing');
      } else if (_event === 'SIGNED_IN') {
        trackLogin('email');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!session?.user) throw new Error('No user on the session!');
        let { data, error, status } = await supabase
          .from('profiles')
          .select(`*`)
          .eq('id', session.user.id)
          .single();
        if (error && status !== 406) throw error;
        if (data) {
          setProfile(data);
          if (data.role === 'super-admin') navigate('super-admin');
          else if (data.role === 'teacher') navigate('teacher-dashboard');
          else navigate('dashboard');
        }
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      }
    };
    if (session) fetchProfile();
  }, [session]);

  const getHomePage = () => {
    if (profile?.role === 'super-admin') return 'super-admin';
    if (profile?.role === 'teacher') return 'teacher-dashboard';
    if (profile) return 'dashboard';
    return 'landing';
  };

  // Centralized navigation to track history for Back button
  const navigate = (nextPage) => {
    setHistory((h) => (page ? [...h, page] : h));
    setPage(nextPage);
  };

  const goBack = () => {
    setHistory((h) => {
      if (!h.length) {
        setPage(getHomePage());
        return h;
      }
      const prev = h[h.length - 1];
      setPage(prev);
      return h.slice(0, -1);
    });
  };

  const onHome = () => {
    setHistory([]);
    setPage(getHomePage());
  };

  const renderPage = () => {
    if (session && profile) {
      const currentUser = { ...session.user, ...profile };
      if (profile.role === 'super-admin') {
        switch (page) {
          case 'super-admin': return <SuperAdminDashboard setPage={navigate} setSelectedApplication={setSelectedApplication} />;
          case 'review-application': return <ApplicationReviewPage application={selectedApplication} setPage={navigate} />;
          default: return <SuperAdminDashboard setPage={navigate} setSelectedApplication={setSelectedApplication} />;
        }
      } else if (profile.role === 'teacher') {
        switch (page) {
          case 'teacher-dashboard': return <TeacherDashboard currentUser={currentUser} setPage={navigate} />;
          case 'create-quiz': return <CreateQuizPage currentUser={currentUser} setPage={navigate} setSelectedQuiz={setSelectedQuiz} />;
          case 'add-questions': return <AddQuestionsPage selectedQuiz={selectedQuiz} setPage={navigate} />;
          case 'manage-quizzes': return <ManageQuizzesPage currentUser={currentUser} setPage={navigate} setSelectedQuiz={setSelectedQuiz} />;
          case 'teacher-profile': return <TeacherProfilePage currentUser={currentUser} setPage={navigate} />;
          case 'teacher-availability': return <TeacherAvailabilityPage currentUser={currentUser} setPage={navigate} />;
          case 'teacher-bookings': return <TeacherBookingsPage currentUser={currentUser} setPage={navigate} />;
          case 'teacher-earnings-dashboard': return <TeacherEarningsDashboard currentUser={currentUser} setPage={navigate} />;
          default: return <TeacherDashboard currentUser={currentUser} setPage={navigate} />;
        }
      } else { // Student role
        switch (page) {
          case 'dashboard': return <StudentDashboard currentUser={currentUser} setPage={navigate} />;
          case 'select-subject': return <SubjectSelectionPage currentUser={currentUser} setPage={navigate} setSelectedSubject={setSelectedSubject} />;
          case 'quiz': return <QuizPage currentUser={currentUser} selectedSubject={selectedSubject} setPage={navigate} />;
          case 'leaderboard': return <LeaderboardPage currentUser={currentUser} setPage={navigate} />;
          case 'upgrade': return <UpgradePage currentUser={currentUser} setPage={navigate} />;
          case 'payment-status': return <PaymentStatusPage currentUser={currentUser} setPage={navigate} />;
          case 'subscriptions': return <SubscriptionPlans currentUser={profile} setPage={navigate} />;
          case 'shop': return <InAppPurchases currentUser={profile} setPage={navigate} />;
          case 'affiliate': return <AffiliateProgram currentUser={profile} setPage={navigate} />;
          case 'tutor-application': return <TutorApplicationPage currentUser={profile} setPage={navigate} />;
          case 'browse-teachers': return <BrowseTeachersPage setPage={navigate} setSelectedTeacher={setSelectedTeacher} />;
          case 'teacher-public-profile': return <TeacherPublicProfilePage teacher={selectedTeacher} currentUser={currentUser} setPage={navigate} />;
          case 'booking': return <BookingPage currentUser={currentUser} teacher={selectedTeacher} setPage={navigate} />;
          case 'parent-dashboard': return <ParentDashboard user={currentUser} setPage={navigate} />;
          default: return <StudentDashboard currentUser={currentUser} setPage={navigate} />;
        }
      }
    } else { // Not logged in - Public Pages
      switch (page) {
        case 'browse-teachers':
          return <BrowseTeachersPage setPage={navigate} setSelectedTeacher={setSelectedTeacher} />;
        case 'teacher-public-profile':
          return <TeacherPublicProfilePage teacher={selectedTeacher} setPage={navigate} />;
        case 'tutor-application':
          return <TutorApplicationPage setPage={navigate} />;
        case 'auth-choice':
          return <AuthChoicePage setPage={navigate} />;
        case 'login': return <LoginPage setPage={navigate} />;
        case 'register': return <RegistrationPage setPage={navigate} />;
        case 'landing': default: return <LandingPage setPage={navigate} />;
      }
    }
  };

  const appTitle = (() => {
    // Optional page title mapping for TopNav
    const map = {
      'landing': 'ZedQuiz',
      'dashboard': 'Student Dashboard',
      'teacher-dashboard': 'Teacher Dashboard',
      'super-admin': 'Admin',
      'browse-teachers': 'Browse Teachers',
      'teacher-public-profile': 'Teacher Profile',
      'booking': 'Book a Lesson',
      'leaderboard': 'Leaderboard',
      'upgrade': 'Upgrade',
      'subscriptions': 'Subscriptions',
      'shop': 'Shop',
      'affiliate': 'Affiliate',
      'tutor-application': 'Tutor Application',
      'teacher-availability': 'Availability',
      'teacher-bookings': 'Bookings',
      'teacher-earnings-dashboard': 'Earnings',
      'parent-dashboard': 'Parent Dashboard',
      'create-quiz': 'Create Quiz',
      'add-questions': 'Add Questions',
      'manage-quizzes': 'Manage Quizzes',
      'teacher-profile': 'My Profile',
      'review-application': 'Review Application'
    };
    return map[page] || 'ZedQuiz';
  })();

  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider autoClose={5000} position="top-right">
            <GamificationProvider>
              <MonetizationProvider>
                {profile ? (
                  <TopNav
                    title={appTitle}
                    canGoBack={history.length > 0}
                    onBack={goBack}
                    onHome={onHome}
                  />
                ) : null}
                <div className="app-content" style={{ paddingBottom: profile ? 84 : 0 }}>
                  <Suspense fallback={<SkeletonCard />}>
                    {renderPage()}
                  </Suspense>
                </div>
                {profile ? (
                  <BottomNav role={profile.role} navigate={navigate} />
                ) : null}
              </MonetizationProvider>
            </GamificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
