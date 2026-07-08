import { useLoading } from '@/contexts/LoadingContext';
import { PageLoader } from './loader';
import { useT } from '@/i18n';

/**
 * Global loader that shows a centered spinner when any API call is in progress
 */
export function GlobalLoader() {
  const { isLoading } = useLoading();
  const t = useT();

  if (!isLoading) {
    return null;
  }

  const loadingText = t('layout.loading');

  return (
    <PageLoader 
      text={loadingText}
      showBackdrop={true}
    />
  );
}
