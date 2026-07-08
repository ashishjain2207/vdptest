import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LangText } from '@/components/ui/LangText';
import { useAuth } from '@/contexts/AuthContext';
import { AppFooter } from '@/components/layout/AppFooter';

/**
 * Full-page layout for Terms, Privacy, etc. — no app sidebar (suitable for login/signup flows).
 */
export function LegalDocumentLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const raw = location.state?.from;
  const safeFrom =
    typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
  const fallbackHref = user ? '/posts' : '/signup';

  const backLabel =
    safeFrom === '/signup' ? (
      <LangText path="layout.back_to_sign_up"  />
    ) : safeFrom === '/login' ? (
      <LangText path="auth.backToSignIn"  />
    ) : safeFrom === '/posts' || (!safeFrom && user) ? (
      <LangText path="layout.back_to_feed"  />
    ) : !safeFrom && !user ? (
      <LangText path="layout.back_to_sign_up"  />
    ) : (
      <LangText path="layout.back"  />
    );

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            to={user ? '/posts' : '/signup'}
            className="flex items-center shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="VDPConnect home"
          >
            <img src="/vdpConnect.png" alt="vdpConnect" className="h-8 sm:h-9 w-auto" />
          </Link>
          <Link
            to={safeFrom ?? fallbackHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">{children}</main>
      <AppFooter className="px-4 pb-8 max-w-3xl mx-auto w-full" />
    </div>
  );
}
