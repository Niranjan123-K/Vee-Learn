import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './stores/authStore';
import useThemeStore from './stores/themeStore';
import { ToastProvider } from './components/ToastContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LearningAnimation from './components/LearningAnimation';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const MatchPageLegacy = lazy(() => import('./pages/MatchPageLegacy'));
const MyLearningPage = lazy(() => import('./pages/MyLearningPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BookSessionPage = lazy(() => import('./pages/BookSessionPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));

function App() {
  const fetchUser = useAuthStore(state => state.fetchUser);
  const isLoading = useAuthStore(state => state.isLoading);
  const theme = useThemeStore(state => state.theme);
  const location = useLocation();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isLoading) {
    return <LearningAnimation />;
  }

  return (
    <ToastProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Suspense fallback={<LearningAnimation />}><LandingPage /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<LearningAnimation />}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<LearningAnimation />}><RegisterPage /></Suspense>} />

          {/* Protected Routes for Onboarding (No Layout) */}
          <Route path="/onboarding" element={<ProtectedRoute requireProfile={false}><Suspense fallback={<LearningAnimation />}><OnboardingWizard /></Suspense></ProtectedRoute>} />

          {/* Protected Routes inside Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Suspense fallback={<LearningAnimation />}><DashboardPage /></Suspense>} />
            <Route path="/explore" element={<Suspense fallback={<LearningAnimation />}><ExplorePage /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<LearningAnimation />}><AboutPage /></Suspense>} />
            <Route path="/learning" element={<Suspense fallback={<LearningAnimation />}><MyLearningPage /></Suspense>} />
            <Route path="/match/legacy/:skillId" element={<Suspense fallback={<LearningAnimation />}><MatchPageLegacy /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<LearningAnimation />}><ProfilePage /></Suspense>} />
            <Route path="/profile/:userId" element={<Suspense fallback={<LearningAnimation />}><ProfilePage /></Suspense>} />
            <Route path="/book/:teacherId" element={<Suspense fallback={<LearningAnimation />}><BookSessionPage /></Suspense>} />
            <Route path="/book/:teacherId/:skillId" element={<Suspense fallback={<LearningAnimation />}><BookSessionPage /></Suspense>} />
            <Route path="/sessions" element={<Suspense fallback={<LearningAnimation />}><SessionsPage /></Suspense>} />
            <Route path="/ledger" element={<Suspense fallback={<LearningAnimation />}><LedgerPage /></Suspense>} />
            <Route path="/messages" element={<Suspense fallback={<LearningAnimation />}><MessagesPage /></Suspense>} />
            <Route path="/messages/:userId" element={<Suspense fallback={<LearningAnimation />}><MessagesPage /></Suspense>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </ToastProvider>
  );
}

export default App;
