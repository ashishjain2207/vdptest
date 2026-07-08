import { BadgeCheck, MapPin, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Button, Badge } from '@imriva/framework';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { partnerPath } from '@/lib/appRoutes';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { joinPartner, leavePartner } from '@/services/partnerService';
import { resolvePartnerMembersCount } from '@/lib/partnerMappers';
import { toast } from 'sonner';

export function OrgCard({ org }) {
  const [joinBusy, setJoinBusy] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  const orgId = String(org.id ?? org.Id ?? '');
  const slug = org.handle || orgId;
  const isMember = org.isMember === true || org.IsMember === true;
  const membersCount = resolvePartnerMembersCount(org, 0);

  const handleCardClick = (e) => {
    if (e.target.closest('button')) {return;}
    navigate(partnerPath(slug));
  };

  const handleJoinLeave = async (e) => {
    e.stopPropagation();
    if (!orgId) {
      navigate(partnerPath(slug));
      return;
    }
    setJoinBusy(true);
    try {
      if (isMember) {
        await leavePartner(orgId);
        toast.success(t('toasts.leftPartner'));
      } else {
        await joinPartner(orgId);
        toast.success(t('toasts.joinRequestSent'));
      }
      navigate(partnerPath(slug));
    } catch (err) {
      toast.error(err?.message || t('toasts.couldNotUpdateMembership'));
      navigate(partnerPath(slug));
    } finally {
      setJoinBusy(false);
    }
  };

  return (
    <div 
      className="bg-card rounded-xl border border-border p-4 hover:shadow-card transition-shadow animate-fade-in cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 rounded-lg">
          <AvatarImage src={org.logo} alt={org.name} className="object-cover" />
          <AvatarFallback className="rounded-lg">{org.name.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-foreground hover:underline cursor-pointer">{org.name}</h3>
                {org.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{org.handle}</p>
            </div>
            <Button 
              variant={isMember ? 'outline' : 'default'}
              size="sm"
              disabled={joinBusy}
              onClick={handleJoinLeave}
              className={cn(
                isMember && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive',
              )}
            >
              {joinBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                <LangText path={isMember ? 'events.leave' : 'events.join'} />
              )}
            </Button>
          </div>

          <p className="mt-2 text-sm text-foreground line-clamp-2">{org.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {org.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {org.location}
            </span>
          </div>

          <div className="mt-3 text-sm">
            <span><strong className="text-foreground">{membersCount.toLocaleString()}</strong>{' '}
              <span className="text-muted-foreground"><LangText path="partners.members"  /></span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
