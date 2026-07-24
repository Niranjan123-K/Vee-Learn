import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import LearningAnimation from './LearningAnimation';

export default function ProtectedRoute({ children, requireProfile = true }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (isLoading) {
    return <LearningAnimation />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && user && !user.profile_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireProfile && user && user.profile_completed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
