import { BadgeCheck, MapPin, Building } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@imriva/framework';
import { useState, useEffect } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams } from '@/i18n';
import { locationLabel } from '@/lib/displayLabels';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { apiPost, apiDelete } from '@/services/api/client';
import { API_BASE } from '@/lib/config';

function translateSuggestionReason(reason, language) {
  if (!reason || language === 'EN') {return reason;}
  let s = reason;
  s = s.replace(/^Followed by /, 'Folge ich von ');
  s = s.replace(/ and (\d+) other$/, ' und $1 weitere');
  s = s.replace(/ and (\d+) others$/, ' und $1 weitere');
  s = s.replace(/^1 mutual connection$/, '1 gemeinsamer Kontakt');
  s = s.replace(/^(\d+) mutual connections$/, '$1 gemeinsame Kontakte');
  s = s.replace(/^Popular on VdpConnect$/, 'Beliebt auf VdpConnect');
  return s;
}

export function UserCard({ user, variant = 'default', onFollowChange, hideFollowButton = false, className }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const tParams = useTParams();
  // Initialize from user.isFollowing prop if available
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowers, setLocalFollowers] = useState(user.followers ?? user.followersCount ?? 0);

  // Update state when user prop changes
  useEffect(() => {
    setIsFollowing(user.isFollowing ?? false);
    setLocalFollowers(user.followers ?? user.followersCount ?? 0);
  }, [user.isFollowing, user.followers, user.followersCount]);

  const handleFollow = async (e) => {
    e.stopPropagation();
    
    // Get userId from different possible properties
    const targetUserId = user.userId || user.id;
    
    if (followLoading) {return;}
    
    if (!targetUserId) {
      console.error('UserCard: No userId available for follow action', user);
      toast.error(t('toasts.unableToFollow'));
      return;
    }
    
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    
    try {
      if (wasFollowing) {
        // Unfollow
        const res = await apiDelete(`${API_BASE}/api/follows/${encodeURIComponent(targetUserId)}`, { showLoader: false });
        if (res.ok || res.status === 204) {
          setIsFollowing(false);
          setLocalFollowers(prev => Math.max(0, prev - 1));
          toast(tParams('toasts.unfollowed', { name: user.name }), { duration: 2000 });
          onFollowChange?.(targetUserId, false);
        } else {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error('Unfollow failed:', res.status, errorText);
          toast.error(tParams('toasts.unfollowFailed', { status: res.status }));
        }
      } else {
        // Follow
        const res = await apiPost(`${API_BASE}/api/follows/${encodeURIComponent(targetUserId)}`, null, { showLoader: false });
        if (res.ok || res.status === 204) {
          setIsFollowing(true);
          setLocalFollowers(prev => prev + 1);
          toast(tParams('toasts.nowFollowing', { name: user.name }), { duration: 2000 });
          onFollowChange?.(targetUserId, true);
        } else {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error('Follow failed:', res.status, errorText);
          toast.error(tParams('toasts.followFailed', { status: res.status }));
        }
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
      toast.error(t('toasts.followUpdateFailed'));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleClick = () => {
    navigate(`/profile/${user.profileSlug ?? user.handle ?? user.id}`);
  };

  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <Avatar className="w-10 h-10">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm text-foreground truncate">{user.name}</span>
            {user.isVerified && (
              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />
            )}
          </div>
          {user.handle && (
            <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
          )}
          {user.suggestionReason && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{translateSuggestionReason(user.suggestionReason, language)}</p>
          )}
        </div>
        {!hideFollowButton && (
          <Button 
            variant={isFollowing ? 'outline' : 'default'}
            size="sm"
            onClick={handleFollow}
            disabled={followLoading}
            className={cn(
              'flex-shrink-0',
              isFollowing && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive',
            )}
          >
            {followLoading ? '...' : isFollowing ? <LangText path="layout.following"  /> : <LangText path="people.follow"  />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn('bg-card rounded-xl border border-border p-4 hover:shadow-card transition-shadow animate-fade-in cursor-pointer', className)}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-foreground hover:underline">{user.name}</h3>
                {user.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                )}
              </div>
              {user.handle && (
                <p className="text-sm text-muted-foreground">@{user.handle}</p>
              )}
            </div>
            {!hideFollowButton && (
              <Button 
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
                className={cn(
                  isFollowing && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive',
                )}
              >
                {followLoading ? '...' : isFollowing ? <LangText path="layout.following"  /> : <LangText path="people.follow"  />}
              </Button>
            )}
          </div>

          <p className="mt-2 text-sm text-foreground line-clamp-2">{user.bio}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              {user.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {locationLabel(user.location, language)}
            </span>
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <span><strong className="text-foreground">{user.following ?? user.followingCount ?? 0}</strong> <span className="text-muted-foreground"><LangText path="layout.following"  /></span></span>
            <span><strong className="text-foreground">{localFollowers.toLocaleString()}</strong> <span className="text-muted-foreground"><LangText path="people.followers"  /></span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
