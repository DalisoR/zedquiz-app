import React, { useState, useEffect, Suspense, lazy } from 'react';
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
const SubscriptionPlansPage = lazy(() => import('./components/SubscriptionPlansPage'));
const PaymentProcessingPage = lazy(() => import('./components/PaymentProcessingPage'));
const PaymentCallbackPage = lazy(() => import('./components/PaymentCallbackPage'));
const PaymentHistoryPage = lazy(() => import('./components/PaymentHistoryPage'));
const SubscriptionManagementPage = lazy(() => import('./components/SubscriptionManagementPage'));
const RevenueAnalyticsDashboard = lazy(() => import('./components/RevenueAnalyticsDashboard'));
const SubscriptionMetricsDashboard = lazy(() =>
  import('./components/SubscriptionMetricsDashboard')
);
const DiscountCodeManager = lazy(() => import('./components/marketing/DiscountCodeManager'));
const ReferralProgramManager = lazy(() => import('./components/marketing/ReferralProgramManager'));
const StudentDiscountPage = lazy(() => import('./components/marketing/StudentDiscountPage'));
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
const TeacherEarningsDashboard = lazy(() =>
  import('./components/monetization/TeacherEarningsDashboard')
);
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const PaymentStatusPage = lazy(() => import('./components/PaymentStatusPage'));
const InsertSampleQuestionPage = lazy(() => import('./components/InsertSampleQuestionPage'));
const CreateCoursePage = lazy(() => import('./components/CreateCoursePage'));
const ManageCoursesPage = lazy(() => import('./components/ManageCoursesPage'));
const ManageCoursePage = lazy(() => import('./components/ManageCoursePage'));
const ManageChapterPage = lazy(() => import('./components/ManageChapterPage'));
const ManageLessonPage = lazy(() => import('./components/ManageLessonPage'));
const BrowseCoursesPage = lazy(() => import('./components/BrowseCoursesPage'));
const CourseOverviewPage = lazy(() => import('./components/CourseOverviewPage'));
const LessonViewerPage = lazy(() => import('./components/LessonViewerPage'));
const StudentCoursesPage = lazy(() => import('./components/StudentCoursesPage'));
const CreateChapterQuizPage = lazy(() => import('./components/CreateChapterQuizPage'));
const ChapterQuizPage = lazy(() => import('./components/ChapterQuizPage'));
const StudentCertificatesPage = lazy(() => import('./components/StudentCertificatesPage'));

function App() {
  const [page, setPage] = useState('landing');
  const [history, setHistory] = useState([]); // simple stack of previous pages
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

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

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Handle PesaPal callback on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderTrackingId = urlParams.get('OrderTrackingId');

    if (orderTrackingId && session && profile) {
      setPage('payment-callback');
    }
  }, [session, profile]);

  const getHomePage = () => {
    if (profile?.role === 'super-admin') return 'super-admin';
    if (profile?.role === 'teacher') return 'teacher-dashboard';
    if (profile) return 'dashboard';
    return 'landing';
  };

  // Centralized navigation to track history for Back button
  const navigate = nextPage => {
    setHistory(h => (page ? [...h, page] : h));
    setPage(nextPage);
  };

  const goBack = () => {
    setHistory(h => {
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
          case 'super-admin':
            return (
              <SuperAdminDashboard
                setPage={navigate}
                setSelectedApplication={setSelectedApplication}
              />
            );
          case 'review-application':
            return <ApplicationReviewPage application={selectedApplication} setPage={navigate} />;
          case 'revenue-analytics':
            return <RevenueAnalyticsDashboard currentUser={currentUser} setPage={navigate} />;
          case 'subscription-metrics':
            return <SubscriptionMetricsDashboard currentUser={currentUser} setPage={navigate} />;
          case 'discount-codes':
            return <DiscountCodeManager currentUser={currentUser} setPage={navigate} />;
          case 'referral-programs':
            return <ReferralProgramManager currentUser={currentUser} setPage={navigate} />;
          default:
            return (
              <SuperAdminDashboard
                setPage={navigate}
                setSelectedApplication={setSelectedApplication}
              />
            );
        }
      } else if (profile.role === 'teacher') {
        switch (page) {
          case 'teacher-dashboard':
            return <TeacherDashboard currentUser={currentUser} setPage={navigate} />;
          case 'create-quiz':
            return (
              <CreateQuizPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedQuiz={setSelectedQuiz}
              />
            );
          case 'add-questions':
            return <AddQuestionsPage selectedQuiz={selectedQuiz} setPage={navigate} />;
          case 'manage-quizzes':
            return (
              <ManageQuizzesPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedQuiz={setSelectedQuiz}
              />
            );
          case 'teacher-profile':
            return <TeacherProfilePage currentUser={currentUser} setPage={navigate} />;
          case 'teacher-availability':
            return <TeacherAvailabilityPage currentUser={currentUser} setPage={navigate} />;
          case 'teacher-bookings':
            return <TeacherBookingsPage currentUser={currentUser} setPage={navigate} />;
          case 'teacher-earnings-dashboard':
            return <TeacherEarningsDashboard currentUser={currentUser} setPage={navigate} />;
          case 'insert-sample-question':
            return <InsertSampleQuestionPage currentUser={currentUser} setPage={navigate} />;
          case 'create-course':
            return (
              <CreateCoursePage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedCourse={setSelectedCourse}
              />
            );
          case 'manage-courses':
            return (
              <ManageCoursesPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedCourse={setSelectedCourse}
              />
            );
          case 'manage-course':
            return (
              <ManageCoursePage
                currentUser={currentUser}
                selectedCourse={selectedCourse}
                setPage={navigate}
                setSelectedChapter={setSelectedChapter}
              />
            );
          case 'manage-chapter':
            return (
              <ManageChapterPage
                currentUser={currentUser}
                selectedChapter={selectedChapter}
                setPage={navigate}
                setSelectedLesson={setSelectedLesson}
              />
            );
          case 'manage-lesson':
            return (
              <ManageLessonPage
                currentUser={currentUser}
                selectedLesson={selectedLesson}
                setPage={navigate}
              />
            );
          case 'create-chapter-quiz':
            return (
              <CreateChapterQuizPage
                currentUser={currentUser}
                selectedChapter={selectedChapter}
                setPage={navigate}
                setSelectedQuiz={setSelectedQuiz}
              />
            );
          case 'subscriptions':
            return (
              <SubscriptionPlansPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedPlan={setSelectedPlan}
                setBillingCycle={setBillingCycle}
              />
            );
          case 'payment-processing':
            return (
              <PaymentProcessingPage
                currentUser={currentUser}
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
                setPage={navigate}
              />
            );
          case 'payment-callback':
            return <PaymentCallbackPage currentUser={currentUser} setPage={navigate} />;
          case 'payment-history':
            return <PaymentHistoryPage currentUser={currentUser} setPage={navigate} />;
          case 'subscription-management':
            return (
              <SubscriptionManagementPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedPlan={setSelectedPlan}
                setBillingCycle={setBillingCycle}
              />
            );
          case 'student-discount':
            return <StudentDiscountPage currentUser={currentUser} setPage={navigate} />;
          default:
            return <TeacherDashboard currentUser={currentUser} setPage={navigate} />;
        }
      } else {
        // Student role
        switch (page) {
          case 'dashboard':
            return <StudentDashboard currentUser={currentUser} setPage={navigate} />;
          case 'select-subject':
            return (
              <SubjectSelectionPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedSubject={setSelectedSubject}
              />
            );
          case 'quiz':
            return (
              <QuizPage
                currentUser={currentUser}
                selectedSubject={selectedSubject}
                setPage={navigate}
              />
            );
          case 'leaderboard':
            return <LeaderboardPage currentUser={currentUser} setPage={navigate} />;
          case 'upgrade':
            return <UpgradePage currentUser={currentUser} setPage={navigate} />;
          case 'payment-status':
            return <PaymentStatusPage currentUser={currentUser} setPage={navigate} />;
          case 'subscriptions':
            return (
              <SubscriptionPlansPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedPlan={setSelectedPlan}
                setBillingCycle={setBillingCycle}
              />
            );
          case 'payment-processing':
            return (
              <PaymentProcessingPage
                currentUser={currentUser}
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
                setPage={navigate}
              />
            );
          case 'payment-callback':
            return <PaymentCallbackPage currentUser={currentUser} setPage={navigate} />;
          case 'payment-history':
            return <PaymentHistoryPage currentUser={currentUser} setPage={navigate} />;
          case 'subscription-management':
            return (
              <SubscriptionManagementPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedPlan={setSelectedPlan}
                setBillingCycle={setBillingCycle}
              />
            );
          case 'student-discount':
            return <StudentDiscountPage currentUser={currentUser} setPage={navigate} />;
          case 'shop':
            return <InAppPurchases currentUser={profile} setPage={navigate} />;
          case 'affiliate':
            return <AffiliateProgram currentUser={profile} setPage={navigate} />;
          case 'tutor-application':
            return <TutorApplicationPage currentUser={profile} setPage={navigate} />;
          case 'browse-teachers':
            return (
              <BrowseTeachersPage setPage={navigate} setSelectedTeacher={setSelectedTeacher} />
            );
          case 'teacher-public-profile':
            return (
              <TeacherPublicProfilePage
                teacher={selectedTeacher}
                currentUser={currentUser}
                setPage={navigate}
              />
            );
          case 'booking':
            return (
              <BookingPage currentUser={currentUser} teacher={selectedTeacher} setPage={navigate} />
            );
          case 'parent-dashboard':
            return <ParentDashboard user={currentUser} setPage={navigate} />;
          case 'browse-courses':
            return (
              <BrowseCoursesPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedCourse={setSelectedCourse}
              />
            );
          case 'student-courses':
            return (
              <StudentCoursesPage
                currentUser={currentUser}
                setPage={navigate}
                setSelectedCourse={setSelectedCourse}
              />
            );
          case 'course-overview':
            return (
              <CourseOverviewPage
                currentUser={currentUser}
                selectedCourse={selectedCourse}
                setPage={navigate}
                setSelectedChapter={setSelectedChapter}
                setSelectedLesson={setSelectedLesson}
              />
            );
          case 'lesson-viewer':
            return (
              <LessonViewerPage
                currentUser={currentUser}
                selectedLesson={selectedLesson}
                selectedChapter={selectedChapter}
                setPage={navigate}
              />
            );
          case 'chapter-quiz':
            return (
              <ChapterQuizPage
                currentUser={currentUser}
                selectedChapter={selectedChapter}
                setPage={navigate}
              />
            );
          case 'student-certificates':
            return <StudentCertificatesPage currentUser={currentUser} setPage={navigate} />;
          default:
            return <StudentDashboard currentUser={currentUser} setPage={navigate} />;
        }
      }
    } else {
      // Not logged in - Public Pages
      switch (page) {
        case 'browse-teachers':
          return <BrowseTeachersPage setPage={navigate} setSelectedTeacher={setSelectedTeacher} />;
        case 'teacher-public-profile':
          return <TeacherPublicProfilePage teacher={selectedTeacher} setPage={navigate} />;
        case 'tutor-application':
          return <TutorApplicationPage setPage={navigate} />;
        case 'auth-choice':
          return <AuthChoicePage setPage={navigate} />;
        case 'login':
          return <LoginPage setPage={navigate} />;
        case 'register':
          return <RegistrationPage setPage={navigate} />;
        case 'landing':
        default:
          return <LandingPage setPage={navigate} />;
      }
    }
  };

  const appTitle = (() => {
    // Optional page title mapping for TopNav
    const map = {
      landing: 'ZedQuiz',
      dashboard: 'Student Dashboard',
      'teacher-dashboard': 'Teacher Dashboard',
      'super-admin': 'Admin',
      'browse-teachers': 'Browse Teachers',
      'teacher-public-profile': 'Teacher Profile',
      booking: 'Book a Lesson',
      leaderboard: 'Leaderboard',
      upgrade: 'Upgrade',
      subscriptions: 'Subscriptions',
      'payment-processing': 'Complete Payment',
      'payment-callback': 'Payment Status',
      'payment-history': 'Payment History',
      'subscription-management': 'Manage Subscription',
      'revenue-analytics': 'Revenue Analytics',
      'subscription-metrics': 'Subscription Metrics',
      'discount-codes': 'Discount Codes',
      'referral-programs': 'Referral Programs',
      'student-discount': 'Student Discount',
      shop: 'Shop',
      affiliate: 'Affiliate',
      'tutor-application': 'Tutor Application',
      'teacher-availability': 'Availability',
      'teacher-bookings': 'Bookings',
      'teacher-earnings-dashboard': 'Earnings',
      'parent-dashboard': 'Parent Dashboard',
      'create-quiz': 'Create Quiz',
      'add-questions': 'Add Questions',
      'manage-quizzes': 'Manage Quizzes',
      'teacher-profile': 'My Profile',
      'review-application': 'Review Application',
      'create-course': 'Create Course',
      'manage-courses': 'My Courses',
      'manage-course': 'Manage Course',
      'manage-chapter': 'Manage Chapter',
      'manage-lesson': 'Manage Lesson',
      'browse-courses': 'Browse Courses',
      'student-courses': 'My Courses',
      'course-overview': 'Course Overview',
      'lesson-viewer': 'Lesson',
      'create-chapter-quiz': 'Create Quiz',
      'chapter-quiz': 'Chapter Quiz',
      'student-certificates': 'Certificates'
    };
    return map[page] || 'ZedQuiz';
  })();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider autoClose={5000} position='top-right'>
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
              <div className='app-content' style={{ paddingBottom: profile ? 84 : 0 }}>
                <Suspense fallback={<SkeletonCard />}>{renderPage()}</Suspense>
              </div>
              {profile ? <BottomNav role={profile.role} navigate={navigate} /> : null}
            </MonetizationProvider>
          </GamificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
