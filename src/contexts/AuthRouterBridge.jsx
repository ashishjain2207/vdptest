import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAuthNavigate, unregisterAuthNavigate } from '@/contexts/authNavigation';

/**
 * Connects react-router navigation to AuthProvider (which sits above BrowserRouter).
 */
export function AuthRouterBridge() {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    registerAuthNavigate(navigate);
    return () => unregisterAuthNavigate();
  }, [navigate]);

  return null;
}
