import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './stores/authStore';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const MatchPage = lazy(() => import('./pages/MatchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BookSessionPage = lazy(() => import('./pages/BookSessionPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const SessionChatPage = lazy(() => import('./pages/SessionChatPage'));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function App() {
  const fetchUser = useAuthStore(state => state.fetchUser);
  const isLoading = useAuthStore(state => state.isLoading);
  const location = useLocation();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <div className="loading-screen">Loading Vee Learn...</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><LandingPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><RegisterPage /></Suspense>} />

        {/* Protected Routes inside Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><DashboardPage /></Suspense>} />
          <Route path="/explore" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><ExplorePage /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><AboutPage /></Suspense>} />
          <Route path="/match/:skillId" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><MatchPage /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><ProfilePage /></Suspense>} />
          <Route path="/profile/:userId" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><ProfilePage /></Suspense>} />
          <Route path="/book/:teacherId" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><BookSessionPage /></Suspense>} />
          <Route path="/sessions" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><SessionsPage /></Suspense>} />
          <Route path="/sessions/:sessionId/chat" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><SessionChatPage /></Suspense>} />
          <Route path="/ledger" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><LedgerPage /></Suspense>} />
          <Route path="/messages" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><MessagesPage /></Suspense>} />
          <Route path="/messages/:userId" element={<Suspense fallback={<div className="loading-screen">Loading...</div>}><MessagesPage /></Suspense>} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
