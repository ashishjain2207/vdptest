import { MainLayout } from '@/components/layout/MainLayout';
import { EventCard } from '@/components/event/EventCard';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { listPublicEvents } from '@/services/eventService';
import { mapPublicEventToCard } from '@/lib/eventUi';
import { toast } from 'sonner';
import { useStaffScopeContentRefresh } from '@/lib/platformAdminFeedScopeRefresh';

const Events = () => {
  const { language } = useLanguage();
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  /** @type {[Array<ReturnType<typeof mapPublicEventToCard>>, import('react').Dispatch<...>]} */
  const [upcomingRaw, setUpcomingRaw] = useState([]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const locale = language === 'DE' ? 'de-DE' : 'en-US';
      const lang = language === 'DE' ? 'DE' : 'EN';
      const upRes = await listPublicEvents({ scope: 'upcoming', page: 1, pageSize: 100 });
      const upItems = upRes?.data ?? upRes?.Data ?? [];
      setUpcomingRaw(
        (Array.isArray(upItems) ? upItems : []).map((row) => mapPublicEventToCard(row, { locale, language: lang })),
      );
    } catch (e) {
      toast.error(e?.message || 'Failed to load events');
      setUpcomingRaw([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useStaffScopeContentRefresh(() => {
    void loadEvents();
  });

  const applyFilters = useCallback(
    (list) =>
      list.filter((event) => (
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
      )),
    [searchQuery],
  );

  const upcomingEvents = useMemo(() => applyFilters(upcomingRaw), [upcomingRaw, applyFilters]);

  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <LangText path="nav.events"  />
            </h1>
          </div>
        </div>

        <ClearableSearchInput
          placeholder={t('events.searchPlaceholder')}
          inputClassName="bg-card"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearAriaLabel={t('common.clearSearch')}
          dataTestId="events-search"
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <LangText path="events.loading_events"  />
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="h-full">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <LangText path="events.no_active_or_upcoming_events_found"
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Events;
