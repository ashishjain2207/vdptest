import { MainLayout } from '@/components/layout/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Avatar, AvatarFallback, AvatarImage } from '@imriva/framework';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar,
  Clock3,
  MapPin,
  Video,
  Copy,
  CalendarPlus,
  ChevronDown,
  Building2,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LangText } from '@/components/ui/LangText';
import { getPublicEvent } from '@/services/eventService';
import { mapPublicEventToCard, DEFAULT_EVENT_COVER, isLikelyHttpUrl } from '@/lib/eventUi';
import { EventRegistrationButton } from '@/components/event/EventRegistrationButton';
import { EventCoverMedia } from '@/components/event/EventCoverMedia';
import { isProbablyVideoUrl } from '@/lib/mediaUrl';
import {
  buildGoogleCalendarUrl,
  buildOutlookLiveCalendarUrl,
  buildOutlookOfficeCalendarUrl,
  resolveEventEnd,
} from '@/lib/calendarLinks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { toast } from 'sonner';



const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const [loading, setLoading] = useState(true);
  /** @type {ReturnType<typeof mapPublicEventToCard> | null} */
  const [event, setEvent] = useState(null);

  const load = useCallback(async () => {
    if (!id) {
      setEvent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await getPublicEvent(id);
      if (!raw) {
        setEvent(null);
        return;
      }
      const locale = language === 'DE' ? 'de-DE' : 'en-US';
      const lang = language === 'DE' ? 'DE' : 'EN';
      setEvent(mapPublicEventToCard(raw, { locale, language: lang }));
    } catch (e) {
      toast.error(e?.message || 'Failed to load event');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [id, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const externalBookingUrl = event?.externalBookingUrl || '';

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${encodeURIComponent(String(event?.id ?? id ?? ''))}`
    : '';

  const calendarLinks = useMemo(() => {
    if (event?.isExpired) {
      return null;
    }
    if (!event?.scheduleConfirmed || !event?._start || Number.isNaN(event._start.getTime())) {
      return null;
    }
    const start = event._start;
    const end = resolveEventEnd(start, event._end);
    const title = event.title;
    const description = event.description || '';
    const location = event.location === '—' ? '' : String(event.location || '');
    const base = { title, description, location, start, end };
    return {
      google: buildGoogleCalendarUrl(base),
      outlookPersonal: buildOutlookLiveCalendarUrl(base),
      outlookWork: buildOutlookOfficeCalendarUrl(base),
    };
  }, [event]);

  const scheduleConfirmed = Boolean(event?.scheduleConfirmed);

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('events.linkCopied'));
    } catch {
      toast.error(t('events.couldNotCopyLink'));
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <LangText path="layout.loading"  />
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground">
            <LangText path="events.event_not_found"  />
          </h1>
          <Button variant="link" onClick={() => navigate('/events')}>
            <LangText path="events.back_to_events"  />
          </Button>
        </div>
      </MainLayout>
    );
  }

  const orgInitial = (event.organizer || '?').charAt(0);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/events')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <LangText path="events.back_to_events"  />
        </Button>

        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden bg-muted">
          <EventCoverMedia
            src={event.image || DEFAULT_EVENT_COVER}
            alt={event.title}
            variantUrls={event.imageVariantUrls ?? null}
            imageDisplay={event.imageDisplay ?? null}
            responsiveSizes="(max-width: 1024px) 100vw, 896px"
            className="relative z-0 h-full w-full"
            frameAspectRatio={4}
            videoControls={Boolean(event.image && isProbablyVideoUrl(event.image))}
            videoLoop={!(event.image && isProbablyVideoUrl(event.image))}
            videoMuted
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            {event.isVirtual ? (
              <Badge className="bg-primary">
                <Video className="w-3 h-3 mr-1" />
                <LangText path="events.onlineEvent"  />
              </Badge>
            ) : null}
            {event.isExpired ? (
              <Badge variant="secondary" className="bg-black/50 text-white border-0">
                <LangText path="events.ended"  />
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{event.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>
                  <LangText path="events.hostedByThe"  /> {event.organizer || '-'}
                </span>
              </div>
            </div>

            {event.description ? (
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-semibold text-foreground">
                  <LangText path="events.about_this_event"  />
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4 sticky top-24">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {scheduleConfirmed ? (
                      event.date
                    ) : (
                      <LangText path="events.registrationComingSoon"  />
                    )}
                  </span>
                </div>
                {scheduleConfirmed && event.time && event.time !== '—' ? (
                  <div className="flex items-center gap-3 text-foreground">
                    <Clock3 className="w-5 h-5 text-primary shrink-0" aria-hidden />
                    <span className="font-medium">{event.time}</span>
                  </div>
                ) : null}
                <div className="flex items-start gap-3 text-foreground">
                  {event.isVirtual ? (
                    <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
                  )}
                  <span className="min-w-0 break-words">
                    {event.isVirtual && isLikelyHttpUrl(event.location) ? (
                      <a
                        href={String(event.location).trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-2 hover:underline break-all"
                      >
                        {String(event.location).trim()}
                      </a>
                    ) : (
                      event.location
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <EventRegistrationButton
                  scheduleConfirmed={scheduleConfirmed}
                  externalBookingUrl={externalBookingUrl}
                  isExpired={Boolean(event.isExpired)}
                />
                {calendarLinks ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full gap-2" type="button">
                        <CalendarPlus className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">
                          <LangText path="events.add_to_calendar"  />
                        </span>
                        <ChevronDown className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-card z-[100]" align="start">
                      <DropdownMenuItem asChild>
                        <a
                          href={calendarLinks.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <LangText path="events.google_calendar"  />
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={calendarLinks.outlookPersonal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <LangText path="events.outlook_com_personal"  />
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={calendarLinks.outlookWork}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <LangText path="events.outlook_work_or_school"  />
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" className="w-full gap-2" type="button" disabled title={t('events.noValidStartTime')}>
                    <CalendarPlus className="w-4 h-4" />
                    <LangText path="events.add_to_calendar"  />
                  </Button>
                )}
                <Button variant="ghost" className="w-full gap-2" type="button" onClick={() => void handleCopyLink()}>
                  <Copy className="w-4 h-4" />
                  <LangText path="events.copyEventLink"  />
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-3">
                <LangText path="admin.organizer"  />
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop" alt="" />
                  <AvatarFallback>{orgInitial}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{event.organizer || '-'}</p>
                  <p className="text-sm text-muted-foreground">
                    <LangText path="events.event_organizer"  />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetail;
