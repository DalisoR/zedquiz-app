import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout';

// Component imports
import BookingPage from './components/BookingPage';
import LandingPage from './components/LandingPage';

// Auth Components
import LeaderboardPage from './components/LeaderboardPage';
import ApplicationReviewPage from './components/admin/ApplicationReviewPage';
import RevenueAnalyticsDashboard from './components/admin/RevenueAnalyticsDashboard';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import AuthChoicePage from './components/auth/AuthChoicePage';
import LoginPage from './components/auth/LoginPage';
import RegistrationPage from './components/auth/RegistrationPage';

// Student Components

// Teacher Components
import TeacherProfilePage from './components/teacher/TeacherProfilePage';
import TeacherAvailabilityPage from './components/teacher/TeacherAvailabilityPage';
import TeacherBookingsPage from './components/teacher/TeacherBookingsPage';
import BrowseTeachersPage from './components/teacher/BrowseTeachersPage';

// Admin Components

// Quiz Components
import QuizPage from './components/quiz/QuizPage';
import CreateQuizPage from './components/quiz/CreateQuizPage';
import ManageQuizzesPage from './components/quiz/ManageQuizzesPage';

// Course Components
import CreateCoursePage from './components/course/CreateCoursePage';
import ManageCoursesPage from './components/course/ManageCoursesPage';

// Monetization Components
import PaymentStatusPage from './components/monetization/PaymentStatusPage';
import SubscriptionPlansPage from './components/monetization/SubscriptionPlansPage';
import PaymentProcessingPage from './components/monetization/PaymentProcessingPage';
import PaymentCallbackPage from './components/monetization/PaymentCallbackPage';
import PaymentHistoryPage from './components/monetization/PaymentHistoryPage';
import SubscriptionManagementPage from './components/monetization/SubscriptionManagementPage';
import SubscriptionMetricsDashboard from './components/monetization/SubscriptionMetricsDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import SubjectSelectionPage from './components/student/SubjectSelectionPage';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherPublicProfilePage from './components/teacher/TeacherPublicProfilePage';

// Other Components
import { useAuth } from './contexts/AuthContext';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { session, profile } = useAuth();

  if (!session) {
    return <Navigate to='/login' replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return <Navigate to='/' replace />;
  }

  return children;
};

// Public Route wrapper (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { session, profile } = useAuth();

  if (session) {
    const dashboardPath = getDashboardPath(profile?.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

// Helper function to get dashboard path based on user role
const getDashboardPath = role => {
  switch (role) {
    case 'super-admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    default:
      return '/dashboard';
  }
};

const Router = () => {
  return (
    <Routes>
      {/* Public Routes - No Layout */}
      <Route
        path='/'
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path='/auth'
        element={
          <PublicRoute>
            <AuthChoicePage />
          </PublicRoute>
        }
      />
      <Route
        path='/login'
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path='/register'
        element={
          <PublicRoute>
            <RegistrationPage />
          </PublicRoute>
        }
      />

      {/* Routes with AppLayout */}
      <Route element={<AppLayout />}>
        <Route
          path='/auth'
          element={
            <PublicRoute>
              <AuthChoicePage />
            </PublicRoute>
          }
        />
        <Route
          path='/login'
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path='/register'
          element={
            <PublicRoute>
              <RegistrationPage />
            </PublicRoute>
          }
        />
        {/* Public Teacher Routes */}
        <Route path='/teachers' element={<BrowseTeachersPage />} />
        <Route path='/teachers/:id' element={<TeacherPublicProfilePage />} />
        {/* Protected Student Routes */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/subjects'
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubjectSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/quiz'
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/leaderboard'
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/book/:teacherId'
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        {/* Protected Teacher Routes */}
        <Route
          path='/teacher'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/profile'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/availability'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/bookings'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/earnings'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherEarningsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/courses/create'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CreateCoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/courses'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/quizzes/create'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CreateQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/teacher/quizzes'
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageQuizzesPage />
            </ProtectedRoute>
          }
        />{' '}
        {/* Protected Admin Routes */}
        <Route
          path='/admin'
          element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/applications/:id'
          element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <ApplicationReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/analytics/revenue'
          element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <RevenueAnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/analytics/subscriptions'
          element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <SubscriptionMetricsDashboard />
            </ProtectedRoute>
          }
        />
        {/* Subscription and Payment Routes */}
        <Route
          path='/subscriptions'
          element={
            <ProtectedRoute>
              <SubscriptionPlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/payment/process'
          element={
            <ProtectedRoute>
              <PaymentProcessingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/payment/callback'
          element={
            <ProtectedRoute>
              <PaymentCallbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/payment/history'
          element={
            <ProtectedRoute>
              <PaymentHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/subscription/manage'
          element={
            <ProtectedRoute>
              <SubscriptionManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/payment/status'
          element={
            <ProtectedRoute>
              <PaymentStatusPage />
            </ProtectedRoute>
          }
        />
        {/* Catch-all route - redirect to home or dashboard */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Route>
    </Routes>
  );
};

export default Router;
