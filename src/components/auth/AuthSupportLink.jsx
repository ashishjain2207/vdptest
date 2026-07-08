import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { supportFormPath } from '@/lib/supportRoutes';

/**
 * Bottom-right Support link on login / signup (and similar auth shells).
 * @param {{ from?: string }} props - passed as router state for back navigation from /support
 */
export function AuthSupportLink({ from = '/login' }) {
  return (
    <Link
      to={supportFormPath('support')}
      state={{ from }}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
    >
      <CircleHelp className="h-4 w-4" aria-hidden />
      <LangText path="nav.supportInbox"  />
    </Link>
  );
}
