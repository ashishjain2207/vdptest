import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken, hasSession } from '@/services';

/**
 * If access_token is empty or session is invalid, redirect to /login. 
 * Otherwise render children (home or protected page).
 * 
 * Note: hasSession() will trigger the logout callback when session expires,
 * which will update AuthContext and navigate to login. This component
 * provides an additional check for immediate redirect.
 */
export function ProtectedRoute({ children }) {
  const location = useLocation();
  const hasToken = Boolean(getAccessToken());
  const validSession = hasSession();

  if (!hasToken || !validSession) {
    // hasSession() already triggered logout callback if session expired
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
