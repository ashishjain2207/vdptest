import { Link, useLocation } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import { cn } from '@/lib/utils';
import { supportFormPath } from '@/lib/supportRoutes';

/**
 * Site-wide legal footer (Terms, Privacy, etc.). Rendered from app shells so every page shows it.
 */
export function AppFooter({ className }) {
  const location = useLocation();
  const from = location.pathname + location.search;
  const showSupportLink = location.pathname !== '/support';

  return (
    <footer
      className={cn(
        'mt-12 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col items-center',
        className,
      )}
    >
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        <Link to="/terms" state={{ from }} className="hover:underline">
          <LangText path="layout.terms_of_service"  />
        </Link>
        <Link to="/privacy" state={{ from }} className="hover:underline">
          <LangText path="layout.privacy_policy"  />
        </Link>
        <Link to="/cookie" state={{ from }} className="hover:underline">
          <LangText path="layout.cookie_policy"  />
        </Link>
        <Link to="/accessibility" state={{ from }} className="hover:underline">
          <LangText path="layout.accessibility"  />
        </Link>
        {showSupportLink ? (
          <Link to={supportFormPath('support')} state={{ from }} className="hover:underline">
            <LangText path="nav.supportInbox"  />
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-center">© 2026 vdpResearch</p>
    </footer>
  );
}
