import {
  parsePartnerInviteContent,
  parsePartnerJoinRequestContent,
  parsePartnerInviteAcceptedContent,
  parsePartnerInviteDeclinedContent,
  localizeNotificationContent,
} from '@/services/notificationService';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Renders notification body text with emphasis similar to connection requests:
 * bold actor name, muted connector phrase, emphasized target (org name).
 * @param {{ type?: string, content?: string }} notification
 * @param {{ className?: string, compact?: boolean }} [opts]
 */
export function NotificationMessage({ notification, className = '', compact = false }) {
  const { language } = useLanguage();
  const { type, content } = notification ?? {};
  const textCls = compact ? 'text-sm' : 'text-foreground';
  const muted = 'text-muted-foreground';

  if (type === 'partnerInvite' && content) {
    const p = parsePartnerInviteContent(content);
    if (p) {
      return (
        <p className={`${textCls} leading-snug ${className}`.trim()}>
          <span className="font-semibold text-foreground">{p.inviter}</span>
          {' '}
          <span className={muted}>invited you to join </span>
          <span className="font-medium text-foreground/95">{p.organization}</span>
          <span className={muted}>.</span>
        </p>
      );
    }
  }

  if (type === 'partnerJoinRequest' && content) {
    const p = parsePartnerJoinRequestContent(content);
    if (p) {
      return (
        <p className={`${textCls} leading-snug ${className}`.trim()}>
          <span className="font-semibold text-foreground">{p.requester}</span>
          {' '}
          <span className={muted}>requested to join </span>
          <span className="font-medium text-foreground/95">{p.organization}</span>
          <span className={muted}>.</span>
        </p>
      );
    }
  }

  if (type === 'partnerInviteAccepted' && content) {
    const p = parsePartnerInviteAcceptedContent(content);
    if (p) {
      return (
        <p className={`${textCls} leading-snug ${className}`.trim()}>
          <span className="font-semibold text-foreground">{p.invitee}</span>
          {' '}
          <span className={muted}>accepted your invitation to join </span>
          <span className="font-medium text-foreground/95">{p.organization}</span>
          <span className={muted}>.</span>
        </p>
      );
    }
  }

  if (type === 'partnerInviteDeclined' && content) {
    const p = parsePartnerInviteDeclinedContent(content);
    if (p) {
      return (
        <p className={`${textCls} leading-snug ${className}`.trim()}>
          <span className="font-semibold text-foreground">{p.invitee}</span>
          {' '}
          <span className={muted}>declined your invitation to join </span>
          <span className="font-medium text-foreground/95">{p.organization}</span>
          <span className={muted}>.</span>
        </p>
      );
    }
  }

  if (type === 'partnerMembershipUpdate' && content) {
    return (
      <p className={`${textCls} leading-snug ${className}`.trim()}>
        <span className="text-foreground">{content}</span>
      </p>
    );
  }

  const displayContent = localizeNotificationContent(content, language);

  return (
    <p className={`${textCls} ${className}`.trim()}>
      <span className="text-muted-foreground">{displayContent}</span>
    </p>
  );
}
