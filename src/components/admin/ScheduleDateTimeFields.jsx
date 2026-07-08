import { useEffect, useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Button, Label } from '@imriva/framework';
import { Calendar } from '@/components/ui/calendar';
import { LangText } from '@/components/ui/LangText';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { CalendarDays, Clock3 } from 'lucide-react';

/** Stored when an event schedule is not confirmed; public UI hides the real clock date. */
export const UNCONFIRMED_EVENT_START_PLACEHOLDER_ISO = '2100-01-01T12:00:00.000Z';

/** @param {string | undefined} iso */
export function isPlaceholderScheduleStartUtc(iso) {
  if (!iso) {
    return true;
  }
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) {
    return true;
  }
  return d.getUTCFullYear() >= 2100;
}

/** @param {string | undefined} iso */
export function isoToDatetimeLocal(iso) {
  if (!iso) {
    return '';
  }
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** @param {string} local */
export function datetimeLocalToIsoUtc(local) {
  if (!local) {
    return null;
  }
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

/** @param {string} local */
export function localStringToParts(local) {
  if (!local) {
    return { date: '', time: '09:00' };
  }
  const [d, t] = local.split('T');
  return {
    date: d || '',
    time: t && t.length >= 5 ? t.slice(0, 5) : '09:00',
  };
}

/**
 * Start of the given calendar day in the browser's local timezone, as an ISO UTC string.
 * Matches legacy ads saved as local midnight (e.g. CEST) instead of treating yyyy-MM-dd as UTC midnight.
 * @param {string} date
 */
export function dateOnlyToUtcStartIso(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const [y, m, d] = date.split('-').map(Number);
  const localStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(localStart.getTime())) {
    return null;
  }
  return localStart.toISOString();
}

/**
 * End of the given calendar day in the browser's local timezone, as an ISO UTC string.
 * @param {string} date
 */
export function dateOnlyToUtcEndIso(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const [y, m, d] = date.split('-').map(Number);
  const localEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  if (Number.isNaN(localEnd.getTime())) {
    return null;
  }
  return localEnd.toISOString();
}

/**
 * yyyy-MM-dd for the calendar day of this instant in the browser's local timezone.
 * Using local (not UTC) getters preserves legacy ads stored as local-day starts encoded as UTC offsets.
 * @param {string | undefined} iso
 */
export function isoUtcToDateOnlyString(iso) {
  if (!iso) {
    return '';
  }
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** @param {string} date @param {string} time */
export function partsToLocalString(date, time) {
  if (!date) {
    return '';
  }
  const tm = time && time.length >= 4 ? time : '00:00';
  return `${date}T${tm}`;
}

const TIME_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const TIME_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * Hour/minute pickers with explicit Done — avoids native time UI that commits on outside click.
 * @param {{ id: string; value: string; onChange: (next: string) => void; required?: boolean; disabled?: boolean }} props
 */
export function TimePickerPopover({ id, value, onChange, required, disabled }) {
  const [open, setOpen] = useState(false);
  const [draftH, setDraftH] = useState('09');
  const [draftM, setDraftM] = useState('00');

  useEffect(() => {
    if (!open) {
      return;
    }
    const parts = String(value || '09:00').split(':');
    setDraftH((parts[0] || '09').padStart(2, '0').slice(0, 2));
    setDraftM((parts[1] || '00').padStart(2, '0').slice(0, 2));
  }, [open, value]);

  const hm = typeof value === 'string' ? value.trim().match(/^(\d{1,2}):(\d{2})$/) : null;
  const displayLabel = hm ? `${hm[1].padStart(2, '0')}:${hm[2]}` : null;

  const apply = () => {
    onChange(`${draftH}:${draftM}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-required={required}
          disabled={disabled}
          className={cn(
            'h-11 w-full min-w-[10rem] justify-start gap-2 rounded-lg border-border bg-background font-normal tabular-nums',
            !displayLabel && 'text-muted-foreground',
          )}
        >
          <Clock3 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {displayLabel ?? <LangText path="admin.select_time"  />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(calc(100vw-2rem),20rem)] p-3 sm:w-80"
        align="start"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor={`${id}-h`} className="text-xs text-muted-foreground">
              <LangText path="admin.hour"  />
            </label>
            <select
              id={`${id}-h`}
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={draftH}
              onChange={(e) => setDraftH(e.target.value)}
            >
              {TIME_HOURS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          <span className="select-none pb-2 text-lg font-medium text-muted-foreground" aria-hidden>
            :
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor={`${id}-m`} className="text-xs text-muted-foreground">
              <LangText path="admin.minute"  />
            </label>
            <select
              id={`${id}-m`}
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={draftM}
              onChange={(e) => setDraftM(e.target.value)}
            >
              {TIME_MINUTES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            <LangText path="common.cancel"  />
          </Button>
          <Button type="button" size="sm" className="bg-primary text-primary-foreground hover:bg-secondary" onClick={apply}>
            <LangText path="admin.done"  />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Calendar + optional time pickers (popover calendar + explicit time Done).
 * @param {{ id: string; label: React.ReactNode; dateValue: string; timeValue: string; onDateChange: (s: string) => void; onTimeChange: (s: string) => void; required?: boolean; disabled?: boolean; showClear?: boolean; onClear?: () => void; showTimeField?: boolean; minimumCalendarDate?: Date }} props
 */
export function ScheduleDateTimeBlock({
  id,
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  required,
  disabled,
  showClear,
  onClear,
  showTimeField = true,
  minimumCalendarDate,
}) {
  const { language } = useLanguage();
  const locale = language === 'DE' ? de : enUS;
  const [open, setOpen] = useState(false);
  const parsedDay =
    dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? parse(dateValue, 'yyyy-MM-dd', new Date()) : undefined;
  const dayOk = parsedDay && isValid(parsedDay);
  const displayDate = dayOk ? format(parsedDay, 'PPP', { locale }) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[hsl(var(--heading))] flex items-center gap-1 flex-wrap">
          {label}
          {required ? (
            <span className="text-destructive font-semibold" aria-hidden="true">
              *
            </span>
          ) : null}
        </p>
        {showClear && onClear ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} className="h-8 shrink-0 px-2 text-xs text-[hsl(var(--heading))]" onClick={onClear}>
            <LangText path="admin.clear"  />
          </Button>
        ) : null}
      </div>
      <div className={cn('grid gap-4', showTimeField ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
        <div className="space-y-2">
          <Label htmlFor={`${id}-date-btn`} className="text-foreground">
            <LangText path="admin.date"  />
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`${id}-date-btn`}
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  'h-11 w-full justify-start gap-2 rounded-lg border-border bg-background font-normal text-left',
                  !dayOk && 'text-muted-foreground',
                )}
              >
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate">
                  {displayDate ?? <LangText path="admin.select_date"  />}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dayOk ? parsedDay : undefined}
                onSelect={(d) => {
                  onDateChange(d ? format(d, 'yyyy-MM-dd') : '');
                  setOpen(false);
                }}
                initialFocus
                {...(minimumCalendarDate ? { fromDate: minimumCalendarDate } : {})}
              />
            </PopoverContent>
          </Popover>
        </div>
        {showTimeField ? (
          <div className="space-y-2">
            <Label htmlFor={`${id}-time`} className="text-foreground">
              <LangText path="admin.time"  />
            </Label>
            <TimePickerPopover id={`${id}-time`} value={timeValue} onChange={onTimeChange} required={required} disabled={disabled} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
