import { Calendar, MapPin, Video } from 'lucide-react';
import { Badge } from '@imriva/framework';
import { useNavigate } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { EventCoverMedia } from '@/components/event/EventCoverMedia';
import { EventRegistrationButton } from '@/components/event/EventRegistrationButton';
import { isLikelyHttpUrl } from '@/lib/eventUi';
import { eventOrganizerByLine } from '@/lib/eventDisplay';



/** @param {{ event: Record<string, unknown> }} props */
export function EventCard({ event }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language === 'DE' ? 'DE' : 'EN';

  const handleCardClick = () => {
    navigate(`/event/${event.id}`);
  };

  const descriptionText = String(event.description ?? '').trim();

  return (
    <div
      className="flex h-full flex-col bg-card rounded-xl border border-border overflow-hidden hover:shadow-card transition-shadow animate-fade-in cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="h-32 shrink-0 overflow-hidden relative bg-muted">
        <EventCoverMedia
          src={event.image}
          alt={event.title}
          variantUrls={event.imageVariantUrls ?? null}
          imageDisplay={event.imageDisplay ?? null}
          responsiveSizes="(max-width: 768px) 100vw, 420px"
          className="absolute inset-0 h-full w-full"
          frameAspectRatio={4}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {event.isVirtual ? (
            <Badge className="bg-primary">
              <Video className="w-3 h-3 mr-1" />
              <LangText path="events.online"  />
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 min-h-0">
        <h3 className="font-semibold text-foreground line-clamp-1 hover:underline shrink-0">
          {event.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1 shrink-0">
          {eventOrganizerByLine(event.organizer, lang)}
        </p>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-[2.75rem] shrink-0">
          {descriptionText || '\u00a0'}
        </p>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground shrink-0 min-h-[2.75rem]">
          <div className="flex items-center gap-2 min-h-[1.25rem]">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            {event.scheduleConfirmed ? (
              <span className="line-clamp-1">{event.date}</span>
            ) : (
              <span className="text-muted-foreground line-clamp-1">
                <LangText path="events.registrationComingSoon"  />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0 min-h-[1.25rem]">
            {event.isVirtual ? (
              <Video className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            )}
            <span className="truncate min-w-0">
              {event.isVirtual && isLikelyHttpUrl(event.location) ? (
                <a
                  href={String(event.location).trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LangText path="events.join_online"  />
                </a>
              ) : (
                event.location
              )}
            </span>
          </div>
        </div>

        <div
          className="mt-auto pt-4 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <EventRegistrationButton
            eventId={String(event.id ?? '')}
            scheduleConfirmed={event.scheduleConfirmed}
            externalBookingUrl={event.externalBookingUrl || ''}
            isExpired={Boolean(event.isExpired)}
          />
        </div>
      </div>
    </div>
  );
}
