import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { initAnalytics, trackPageView, trackLogin } from './utils/analytics';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { GamificationProvider } from './contexts/GamificationContext';
import { MonetizationProvider } from './contexts/MonetizationContext';
import LandingPage from './components/LandingPage';
import SubscriptionPlans from './components/monetization/SubscriptionPlans';
import InAppPurchases from './components/monetization/InAppPurchases';
import AffiliateProgram from './components/monetization/AffiliateProgram';
import AuthChoicePage from './components/AuthChoicePage';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import StudentDashboard from './components/StudentDashboard';
import SubjectSelectionPage from './components/SubjectSelectionPage';
import QuizPage from './components/QuizPage';
import TeacherDashboard from './components/TeacherDashboard';
import CreateQuizPage from './components/CreateQuizPage';
import AddQuestionsPage from './components/AddQuestionsPage';
import LeaderboardPage from './components/LeaderboardPage';
import UpgradePage from './components/UpgradePage';
import TutorApplicationPage from './components/TutorApplicationPage';
import ErrorBoundary from './components/ErrorBoundary';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ApplicationReviewPage from './components/ApplicationReviewPage';
import ManageQuizzesPage from './components/ManageQuizzesPage';
import TeacherProfilePage from './components/TeacherProfilePage';
import BrowseTeachersPage from './components/BrowseTeachersPage';
import TeacherPublicProfilePage from './components/TeacherPublicProfilePage';
import TeacherAvailabilityPage from './components/TeacherAvailabilityPage';
import BookingPage from './components/BookingPage';
import TeacherBookingsPage from './components/TeacherBookingsPage'; // Import new

import './App.css';

function App() {
  const [page, setPage] = useState('landing');
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
    trackPageView(window.location.pathname);
  }, [page]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        trackLogin('email'); // Track initial login if session exists
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
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
          if (data.role === 'super-admin') setPage('super-admin');
          else if (data.role === 'teacher') setPage('teacher-dashboard');
          else setPage('dashboard');
        }
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      }
    };
    if (session) fetchProfile();
  }, [session]);

  const renderPage = () => {
    if (session && profile) {
      const currentUser = { ...session.user, ...profile };
      if (profile.role === 'super-admin') {
        switch (page) {
            case 'super-admin': return <SuperAdminDashboard setPage={setPage} setSelectedApplication={setSelectedApplication} />;
            case 'review-application': return <ApplicationReviewPage application={selectedApplication} setPage={setPage} />;
            default: return <SuperAdminDashboard setPage={setPage} setSelectedApplication={setSelectedApplication} />;
        }
      } else if (profile.role === 'teacher') {
        switch (page) {
          case 'teacher-dashboard': return <TeacherDashboard currentUser={currentUser} setPage={setPage} />;
          case 'create-quiz': return <CreateQuizPage currentUser={currentUser} setPage={setPage} setSelectedQuiz={setSelectedQuiz} />;
          case 'add-questions': return <AddQuestionsPage selectedQuiz={selectedQuiz} setPage={setPage} />;
          case 'manage-quizzes': return <ManageQuizzesPage currentUser={currentUser} setPage={setPage} setSelectedQuiz={setSelectedQuiz} />;
          case 'teacher-profile': return <TeacherProfilePage currentUser={currentUser} setPage={setPage} />;
          case 'teacher-availability': return <TeacherAvailabilityPage currentUser={currentUser} setPage={setPage} />;
          case 'teacher-bookings': return <TeacherBookingsPage currentUser={currentUser} setPage={setPage} />; // Add new route
          default: return <TeacherDashboard currentUser={currentUser} setPage={setPage} />;
        }
      } else { // Student role
        switch (page) {
          case 'dashboard': return <StudentDashboard currentUser={currentUser} setPage={setPage} />;
          case 'select-subject': return <SubjectSelectionPage currentUser={currentUser} setPage={setPage} setSelectedSubject={setSelectedSubject} />;
          case 'quiz': return <QuizPage currentUser={currentUser} selectedSubject={selectedSubject} setPage={setPage} />;
          case 'leaderboard': return <LeaderboardPage currentUser={currentUser} setPage={setPage} />;
          case 'upgrade': return <UpgradePage currentUser={profile} setPage={setPage} />;
          case 'subscriptions': return <SubscriptionPlans currentUser={profile} setPage={setPage} />;
          case 'shop': return <InAppPurchases currentUser={profile} setPage={setPage} />;
          case 'affiliate': return <AffiliateProgram currentUser={profile} setPage={setPage} />;
          case 'tutor-application': return <TutorApplicationPage currentUser={profile} setPage={setPage} />;
          case 'browse-teachers': return <BrowseTeachersPage setPage={setPage} setSelectedTeacher={setSelectedTeacher} />;
          case 'teacher-public-profile': return <TeacherPublicProfilePage teacher={selectedTeacher} currentUser={currentUser} setPage={setPage} />;
          case 'booking': return <BookingPage currentUser={currentUser} teacher={selectedTeacher} setPage={setPage} />;
          default: return <StudentDashboard currentUser={currentUser} setPage={setPage} />;
        }
      }
    } else { // Not logged in - Public Pages
      switch (page) {
        case 'browse-teachers':
          return <BrowseTeachersPage setPage={setPage} setSelectedTeacher={setSelectedTeacher} />;
        case 'teacher-public-profile':
          return <TeacherPublicProfilePage teacher={selectedTeacher} setPage={setPage} />;
        case 'tutor-application':
          return <TutorApplicationPage setPage={setPage} />;
        case 'auth-choice':
          return <AuthChoicePage setPage={setPage} />;
        case 'login': return <LoginPage setPage={setPage} />;
        case 'register': return <RegistrationPage setPage={setPage} />;
        case 'landing': default: return <LandingPage setPage={setPage} />;
      }
    }
  };

  // Move the renderPage call inside the providers
  const appContent = (
    <div className="min-h-screen bg-gray-50">
      {renderPage()}
    </div>
  );

  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider autoClose={5000} position="top-right">
            <GamificationProvider>
              <MonetizationProvider>
                {appContent}
              </MonetizationProvider>
            </GamificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;