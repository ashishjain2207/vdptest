import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { sanitizeUrlForNewTab } from '@/lib/eventUi';



/**
 * Opens the organizer's external registration URL in a new tab. vdpConnect does not track
 * completion on third-party sites.
 * @param {{
 *   eventId?: string,
 *   scheduleConfirmed: boolean,
 *   externalBookingUrl?: string,
 *   isExpired?: boolean,
 *   className?: string,
 *   fullWidth?: boolean,
 * }} props
 */
export function EventRegistrationButton({
  eventId,
  scheduleConfirmed,
  externalBookingUrl = '',
  isExpired = false,
  className = '',
  fullWidth = true,
}) {
  const bookingUrl =
    typeof externalBookingUrl === 'string' && externalBookingUrl.trim()
      ? sanitizeUrlForNewTab(externalBookingUrl)
      : '';

  if (isExpired) {
    return (
      <p className={`text-center text-sm font-medium text-muted-foreground ${className}`}>
        <LangText path="events.this_event_has_ended"  />
      </p>
    );
  }

  if (!scheduleConfirmed) {
    if (!eventId) {
      return (
        <p className={`text-center text-sm font-medium text-primary ${className}`}>
          <LangText path="events.registrationComingSoon"  />
        </p>
      );
    }
    return (
      <Button
        type="button"
        variant="outline"
        className={`${fullWidth ? 'w-full' : ''} rounded-lg font-medium ${className}`}
        asChild
      >
        <Link
          to={`/event/${eventId}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <LangText path="events.viewDetails"  />
        </Link>
      </Button>
    );
  }

  if (!bookingUrl) {
    return (
      <p className={`text-center text-sm font-medium text-primary ${className}`}>
        <LangText path="events.registrationComingSoon"  />
      </p>
    );
  }

  return (
    <Button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(bookingUrl, '_blank', 'noopener,noreferrer');
      }}
      className={`${fullWidth ? 'w-full' : ''} gap-2 rounded-lg bg-primary font-medium text-primary-foreground shadow-soft hover:bg-secondary ${className}`}
    >
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      <LangText path="events.register"  />
    </Button>
  );
}
