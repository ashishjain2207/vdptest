import { Repeat2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import { profilePath } from '@/lib/appRoutes';

/**
 * @param {{ reposter?: { userId?: string, name?: string, handle?: string } | null, currentUserId?: string }} props
 */
export function PostRepostAttribution({ reposter, currentUserId }) {
  const navigate = useNavigate();
  const reposterId = reposter?.userId ?? '';
  const reposterName = (reposter?.name ?? '').trim();
  const reposterHandle = (reposter?.handle ?? '').replace(/^@/, '').trim();
  const isSelf =
    Boolean(currentUserId && reposterId) &&
    String(currentUserId).toLowerCase() === String(reposterId).toLowerCase();

  const openReposterProfile = (e) => {
    e.stopPropagation();
    const key = reposterHandle || reposterId;
    if (!key) {
      return;
    }
    navigate(profilePath(key));
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 px-0.5 min-w-0">
      <Repeat2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
      {reposterName ? (
        <span className="truncate">
          {isSelf ? (
            <LangText path="posts.you_reposted"  />
          ) : (
            <>
              <button
                type="button"
                onClick={openReposterProfile}
                className="font-medium text-foreground/80 hover:underline"
              >
                {reposterName}
              </button>
              {' '}
              <LangText path="posts.reposted"  />
            </>
          )}
        </span>
      ) : (
        <span>
          <LangText path="posts.reposted_2"  />
        </span>
      )}
    </div>
  );
}
