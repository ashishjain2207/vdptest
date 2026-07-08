import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';

/**
 * Redirects when user-reported content moderation is disabled.
 */
export function ContentReportsFeatureRoute({ children }) {
  const { contentReportsEnabled, loading } = useFeatureFlags();

  if (loading) {
    return null;
  }

  if (!contentReportsEnabled) {
    return <Navigate to={PLATFORM_SUPPORT_INBOX_PATH} replace />;
  }

  return children;
}
