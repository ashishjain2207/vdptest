import { useState, useEffect } from 'react';
import { MapPin, Loader2, Navigation, X } from 'lucide-react';
import { Button, Label } from '@imriva/framework';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LocationPicker, getCurrentLocationAndAddress } from '@/components/ui/LocationPicker';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Same location UX as feed posts: current GPS + Photon search / manual apply.
 * @param {{ id: string; value: string; onChange: (next: string) => void; className?: string; hideLabel?: boolean; placeholder?: string }} props
 */
export function PartnerLocationField({ id, value, onChange, className, hideLabel = false, placeholder }) {
  const { language } = useLanguage();
  const t = useT();
  const placeholderText =
    placeholder ||
    (language === 'EN'
      ? 'Search city, address or location …'
      : 'Stadt, Adresse oder Standort suchen …');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const { address } = await getCurrentLocationAndAddress();
      onChange(address);
      setDraft(address);
      setOpen(false);
    } catch (err) {
      const code = err?.code;
      if (code === 1) {
        toast.error(t('toasts.locationDenied'), { duration: 6000 });
      } else if (code === 2) {
        toast.error(t('toasts.locationUnavailable'), { duration: 5000 });
      } else if (code === 3) {
        toast.error(t('toasts.locationTimeout'), { duration: 5000 });
      } else {
        toast.error(err?.message || t('toasts.locationGetFailed'), { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const applyDraft = () => {
    onChange(draft.trim());
    setOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {!hideLabel ? (
        <Label htmlFor={id}>
          <LangText path="partners.location"  />
        </Label>
      ) : null}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                'h-11 min-w-0 flex-1 justify-start gap-2 font-normal text-left',
                'border-border bg-card hover:bg-muted/50',
              )}
              aria-label={t('partners.choose_location')}
              aria-haspopup="dialog"
              aria-expanded={open}
              data-testid="partner-location-field-trigger"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className={cn('truncate text-sm', !value?.trim() && 'text-muted-foreground')}>
                {value?.trim() ? value.trim() : placeholderText}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-96 overflow-visible rounded-xl border-border p-4 shadow-lg"
            align="start"
            side="bottom"
            sideOffset={8}
          >
            <div className="flex items-center gap-2 pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                <LangText path="feed.addLocation"  />
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mb-3 w-full justify-start gap-2"
              onClick={handleGetCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <LangText path={loading ? 'feed.gettingLocation' : 'feed.useCurrentLocation'} />
            </Button>
            <LocationPicker
              value={draft}
              onChange={(v) => setDraft(v)}
              onSelect={(v) => {
                onChange(v);
                setDraft(v);
                setOpen(false);
              }}
              placeholder={placeholderText}
              inputAriaLabel={
                language === 'EN'
                  ? 'Search for a location'
                  : 'Nach einem Standort suchen'
              }
              clearAriaLabel={
                language === 'EN'
                  ? 'Clear location search'
                  : 'Standortsuche leeren'
              }
              mapsButtonAriaLabel={
                language === 'EN'
                  ? 'Open location in Google Maps'
                  : 'Standort in Google Maps öffnen'
              }
              showMapsButton
              showCurrentLocation={false}
              suggestionsInPortal={false}
            />
            <Button type="button" size="sm" className="mt-3 w-full rounded-lg" onClick={applyDraft}>
              <LangText path="feed.addLocation"  />
            </Button>
          </PopoverContent>
        </Popover>
        {value?.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onChange('')}
            aria-label={t('partners.clear_location')}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
