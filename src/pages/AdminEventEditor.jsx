import { useEffect, useState, useCallback, useRef, useId, useMemo } from 'react';
import { isValid, max as maxDate, parse as parseDate, startOfDay } from 'date-fns';
import { PartnerLocationField } from '@/components/partner/PartnerLocationField';
import { AdminMarketCountryField } from '@/components/admin/AdminMarketCountryField';
import { useAdminScopeCountryField } from '@/hooks/useAdminScopeCountryField';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Label, Textarea } from '@imriva/framework';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LangText } from '@/components/ui/LangText';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import {
  isPlaceholderScheduleStartUtc,
  ScheduleDateTimeBlock,
  UNCONFIRMED_EVENT_START_PLACEHOLDER_ISO,
} from '@/components/admin/ScheduleDateTimeFields';
import { getBrowserTimeZoneId, utcIsoToZonedParts, zonedLocalToUtcIso } from '@/lib/eventScheduleTz';
import { EVENT_TIMEZONE_OPTIONS } from '@/lib/eventTimeZones';
import { formatTimeZoneLabel } from '@/lib/eventUi';
import {
  adminGetEvent,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
} from '@/services/adminEventService';
import { uploadPostMediaFile } from '@/services/mediaService';
import { EventCoverMedia } from '@/components/event/EventCoverMedia';
import { ImageCropFlow } from '@/components/ImageCropFlow';
import { useImageCropQueue } from '@/hooks/useImageCropQueue';
import { getImageCropConfig } from '@/lib/imageCropPresets';
import { validateCoverImage } from '@/utils/imageValidation';
import { isProbablyVideoUrl } from '@/lib/mediaUrl';
import { ArrowLeft, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { FieldError } from '@/components/ui/FieldError';
import { isNavigationReload } from '@/lib/navigationReload';
import { adminListPartnerOrganizerOptions } from '@/services/partnerService';

/** @param {Record<string, unknown>} p */
function organizerPartnerName(p) {
  return String(p?.name ?? p?.Name ?? '').trim();
}

/**
 * @param {string | undefined} s
 * @returns {boolean}
 */
function looksLikeGuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ''));
}

function RequiredFieldMark() {
  return <span className="text-destructive font-semibold" aria-hidden="true">*</span>;
}

/** @param {Record<string, unknown>} input */
function toUpsertBody(input) {
  return {
    title: input.title,
    description: input.description,
    startDateUtc: input.startDateUtcIso,
    endDateUtc: input.endDateUtcIso,
    time: input.time,
    location: input.location,
    isVirtual: input.isVirtual,
    isScheduleConfirmed: input.isScheduleConfirmed,
    organizer: input.organizer,
    organizerPartnerOrganizationId: input.organizerPartnerOrganizationId ?? null,
    externalBookingUrl: input.externalBookingUrl,
    coverMediaFileId: input.coverMediaFileId,
    timeZoneId: input.timeZoneId,
    countryCode: input.countryCode,
  };
}

const AdminEventEditor = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const isCreate = !eventId;

  const virtualEventSwitchId = useId();
  const scheduleConfirmedSwitchId = useId();

  const [dataReady, setDataReady] = useState(isCreate);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  /** @type {[string | null, import('react').Dispatch<import('react').SetStateAction<string | null>>]} */
  const [organizerPartnerOrganizationId, setOrganizerPartnerOrganizationId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const { countryCode, setCountryCode, setCountryCodeFromApi } = useAdminScopeCountryField({ isCreate });
  const [isVirtual, setIsVirtual] = useState(false);
  const [isScheduleConfirmed, setIsScheduleConfirmed] = useState(true);
  const [timeZoneId, setTimeZoneId] = useState(getBrowserTimeZoneId);
  const [externalBookingUrl, setExternalBookingUrl] = useState('');
  const [coverMediaFileId, setCoverMediaFileId] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [coverPreviewIsVideo, setCoverPreviewIsVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { cropper, enqueue: enqueueImageCrop } = useImageCropQueue();
  const fileRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  /** @type {[Record<string, string>, import('react').Dispatch<import('react').SetStateAction<Record<string, string>>>]} */
  const [fieldErrors, setFieldErrors] = useState({});
  /** @type {[Array<Record<string, unknown>>, import('react').Dispatch<import('react').SetStateAction<Array<Record<string, unknown>>>>]} */
  const [partnerPicklist, setPartnerPicklist] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [organizerSuggestionsOpen, setOrganizerSuggestionsOpen] = useState(false);
  const organizerComboRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const timezoneSelectOptions = useMemo(() => {
    const ids = new Set(EVENT_TIMEZONE_OPTIONS.map((o) => o.value));
    const list = [...EVENT_TIMEZONE_OPTIONS];
    if (timeZoneId && !ids.has(timeZoneId)) {
      list.unshift({
        value: timeZoneId,
        en: formatTimeZoneLabel(timeZoneId, 'en-US') || timeZoneId,
        de: formatTimeZoneLabel(timeZoneId, 'de-DE') || timeZoneId,
      });
    }
    return list;
  }, [timeZoneId]);

  const filteredOrganizerPartners = useMemo(() => {
    const list = Array.isArray(partnerPicklist) ? partnerPicklist : [];
    const raw = organizer.trim().toLowerCase();
    const q = raw.startsWith('@') ? raw.slice(1) : raw;
    if (!q) {
      return list.slice(0, 25);
    }
    return list
      .filter((p) => {
        const row = /** @type {Record<string, unknown>} */ (p);
        const n = organizerPartnerName(row).toLowerCase();
        return n.includes(q);
      })
      .slice(0, 50);
  }, [partnerPicklist, organizer]);

  const load = useCallback(async () => {
    if (!eventId || !looksLikeGuid(eventId)) {
      setDataReady(true);
      return;
    }
    try {
      const ev = await adminGetEvent(eventId);
      if (!ev) {
        toast.error(t('toasts.eventNotFound'));
        navigate('/admin/events', { replace: true });
        return;
      }
      setTitle(String(ev.title ?? ev.Title ?? ''));
      setDescription(String(ev.description ?? ev.Description ?? ''));
      setOrganizer(String(ev.organizer ?? ev.Organizer ?? ''));
      const oid = ev.organizerPartnerOrganizationId ?? ev.OrganizerPartnerOrganizationId;
      setOrganizerPartnerOrganizationId(
        oid !== null && oid !== undefined && String(oid).trim() !== '' ? String(oid) : null,
      );
      setIsVirtual(Boolean(ev.isVirtual ?? ev.IsVirtual));
      setIsScheduleConfirmed(Boolean(ev.isScheduleConfirmed ?? ev.IsScheduleConfirmed ?? true));

      const tzRaw = ev.timeZoneId ?? ev.TimeZoneId;
      const effectiveTz =
        typeof tzRaw === 'string' && tzRaw.trim() ? tzRaw.trim() : getBrowserTimeZoneId();
      setTimeZoneId(effectiveTz);

      const rawStart = ev.startDateUtc ?? ev.StartDateUtc;
      if (isPlaceholderScheduleStartUtc(String(rawStart ?? ''))) {
        setStartDate('');
        setStartTime('09:00');
        setEndDate('');
        setEndTime('');
      } else {
        const s = utcIsoToZonedParts(String(rawStart), effectiveTz);
        setStartDate(s.date);
        setStartTime(s.time || '09:00');
        const endIso = ev.endDateUtc ?? ev.EndDateUtc;
        if (!endIso) {
          setEndDate('');
          setEndTime('');
        } else {
          const e = utcIsoToZonedParts(String(endIso), effectiveTz);
          setEndDate(e.date);
          setEndTime(e.date ? e.time : '');
        }
      }

      setLocation(String(ev.location ?? ev.Location ?? ''));
      const evCountry = ev.countryCode ?? ev.CountryCode;
      setCountryCodeFromApi(evCountry ? String(evCountry) : '');
      setExternalBookingUrl(String(ev.externalBookingUrl ?? ev.ExternalBookingUrl ?? ''));
      const imgId =
        ev.coverMediaFileId ?? ev.CoverMediaFileId ?? ev.imageMediaFileId ?? ev.ImageMediaFileId;
      setCoverMediaFileId(imgId ? String(imgId) : '');
      const preview = String(ev.coverImageUrl ?? ev.CoverImageUrl ?? ev.imagePublicUrl ?? ev.ImagePublicUrl ?? '');
      const coverContentType = String(ev.coverContentType ?? ev.CoverContentType ?? '');
      setImagePreview(preview);
      setCoverPreviewIsVideo(coverContentType.toLowerCase().startsWith('video/') || isProbablyVideoUrl(preview));
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoadEvent'));
    } finally {
      setDataReady(true);
    }
  }, [eventId, navigate, setCountryCodeFromApi]);

  useEffect(() => {
    if (isCreate) {
      setDataReady(true);
      return;
    }
    setDataReady(false);
  }, [eventId, isCreate]);

  useEffect(() => {
    if (isCreate) {
      return;
    }
    void load();
  }, [isCreate, load]);

  useEffect(() => {
    let cancelled = false;
    setPartnersLoading(true);
    adminListPartnerOrganizerOptions()
      .then((res) => {
        if (cancelled) {
          return;
        }
        const raw = Array.isArray(res) ? res : res?.data ?? res?.Data ?? [];
        setPartnerPicklist(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {
        if (!cancelled) {
          setPartnerPicklist([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPartnersLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(/** @type {MouseEvent} */ e) {
      const el = organizerComboRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOrganizerSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const validateAndBuildPayload = () => {
    /** @type {Record<string, string>} */
    const err = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      err.title = t('admin.eventTitleRequired');
    }
    const org = organizer.trim();
    if (!org) {
      err.organizer = t('admin.organizerRequired');
    }
    if (!location.trim()) {
      err.location = t('admin.locationRequired');
    }

    const reg = externalBookingUrl.trim();
    if (!reg) {
      err.externalBookingUrl = t('admin.registrationLinkRequired');
    }

    const parsed = isScheduleConfirmed ? zonedLocalToUtcIso(startDate, startTime, timeZoneId) : null;
    if (isScheduleConfirmed && !parsed) {
      err.start = t('admin.startRequired');
    }

    const startIso = isScheduleConfirmed ? parsed : UNCONFIRMED_EVENT_START_PLACEHOLDER_ISO;
    let endIso = null;
    if (isScheduleConfirmed && parsed) {
      if (endDate.trim()) {
        const endT = (endTime && endTime.trim()) || startTime;
        endIso = zonedLocalToUtcIso(endDate.trim(), endT, timeZoneId);
        if (!endIso) {
          err.end = t('admin.endInvalid');
        }
      }
      if (endIso && startIso && new Date(endIso) < new Date(startIso)) {
        err.end = t('admin.endBeforeStart');
      }
    }

    if (Object.keys(err).length > 0) {
      return { ok: false, errors: err };
    }

    const ccUpper = countryCode.trim().toUpperCase();
    if (ccUpper.length > 0 && ccUpper.length !== 2) {
      err.countryCode = t('admin.country_must_be_two_letters_or_empty');
      return { ok: false, errors: err };
    }

    return {
      ok: true,
      body: toUpsertBody({
        title: trimmedTitle,
        description: description.trim() || null,
        startDateUtcIso: /** @type {string} */ (startIso),
        endDateUtcIso: endIso,
        time: null,
        location: location.trim(),
        isVirtual,
        isScheduleConfirmed,
        organizer: org,
        organizerPartnerOrganizationId,
        externalBookingUrl: reg,
        coverMediaFileId: coverMediaFileId.trim() ? coverMediaFileId.trim() : null,
        timeZoneId,
        countryCode: ccUpper.length === 2 ? ccUpper : null,
      }),
    };
  };

  const startMinimumCalendarDate = useMemo(() => startOfDay(new Date()), []);

  const endMinimumCalendarDate = useMemo(() => {
    const today = startOfDay(new Date());
    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      const sd = startOfDay(parseDate(startDate, 'yyyy-MM-dd', new Date()));
      if (!isValid(sd)) {
        return today;
      }
      return maxDate([today, sd]);
    }
    return today;
  }, [startDate]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = validateAndBuildPayload();
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const { body } = result;
      if (isCreate) {
        await adminCreateEvent(body);
        toast.success(t('admin.eventCreated'));
        navigate('/admin/events', { replace: true });
      } else if (eventId) {
        await adminUpdateEvent(eventId, body);
        toast.success(t('admin.eventSaved'));
        navigate('/admin/events', { replace: true });
      }
    } catch (err) {
      toast.error(err?.message || t('toasts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const uploadCoverFile = async (file) => {
    setUploadingImage(true);
    try {
      const { mediaFileId, publicUrl } = await uploadPostMediaFile(file, { showLoader: false });
      const url = String(publicUrl || '');
      setCoverMediaFileId(String(mediaFileId));
      setImagePreview(url);
      setCoverPreviewIsVideo(file.type.startsWith('video/') || isProbablyVideoUrl(url));
      toast.success(t('admin.mediaUploaded'));
    } catch (err) {
      toast.error(err?.message || t('admin.uploadFailed'));
    } finally {
      setUploadingImage(false);
    }
  };

  const onPickImage = async (fileList) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    const ct = String(file.type || '').toLowerCase();
    if (!ct.startsWith('image/') && !ct.startsWith('video/')) {
      toast.error(t('admin.chooseImageOrVideo'));
      return;
    }
    if (ct.startsWith('video/')) {
      await uploadCoverFile(file);
      return;
    }
    const validation = await validateCoverImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    if (validation.warning) {
      toast.warning(validation.warning);
    }
    const config = getImageCropConfig('eventCover', language === 'DE' ? 'DE' : 'EN');
    enqueueImageCrop([{ file, config }], (cropped) => {
      const croppedFile = cropped[0];
      if (croppedFile) {
        void uploadCoverFile(croppedFile);
      }
    });
  };

  const confirmDeleteEvent = async () => {
    if (!eventId) {
      return;
    }
    setDeleteDialogOpen(false);
    setSaving(true);
    try {
      await adminDeleteEvent(eventId);
      toast.success(t('toasts.eventDeleted'));
      navigate('/admin/events');
    } catch (e) {
      toast.error(e?.message || t('toasts.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!isCreate && isNavigationReload() && !dataReady) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-24 justify-center max-w-6xl mx-auto">
        <Loader2 className="w-5 h-5 animate-spin" />
        <LangText path="common.loading"  />
      </div>
    );
  }

  if (!isCreate && !dataReady) {
    return null;
  }

  const primaryBtnClass =
    'gap-2 shadow-soft bg-primary text-primary-foreground hover:bg-secondary';
  const outlineBtnClass =
    'rounded-lg border-[hsl(var(--heading))] text-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/10';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 px-1">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
        <Link to="/admin/events">
          <ArrowLeft className="w-4 h-4" />
          <LangText path="admin.back_to_event_overview"  />
        </Link>
      </Button>

      <div>
        <h1 className="partner-admin-heading">
          {isCreate ? (
            <LangText path="admin.add_event"  />
          ) : (
            <LangText path="admin.edit_event"  />
          )}
        </h1>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          aria-label={t('admin.upload_event_cover_media')}
          onChange={(e) => void onPickImage(e.target.files)}
        />

        <div className="space-y-2">
          <Label className="text-foreground">
            <LangText path="admin.cover_image_video"  />
          </Label>
          <button
            type="button"
            disabled={uploadingImage}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/20 px-4 py-10 text-center transition-colors',
              'min-h-[160px] hover:border-primary/40 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              uploadingImage && 'pointer-events-none opacity-70',
            )}
          >
            {imagePreview ? (
              <EventCoverMedia
                src={imagePreview}
                alt=""
                forceVideo={coverPreviewIsVideo}
                className="absolute inset-0 h-full w-full"
                videoControls
                videoLoop={false}
                videoMuted
              />
            ) : null}
            <div
              className={cn(
                'relative z-[1] flex flex-col items-center gap-2',
                imagePreview && 'absolute bottom-3 right-3 rounded-xl bg-background/90 px-3 py-2 shadow-sm backdrop-blur-sm',
              )}
            >
              {uploadingImage ? (
                <Loader2 className={cn('animate-spin text-primary', imagePreview ? 'h-4 w-4' : 'h-8 w-8')} />
              ) : (
                <ImageIcon className={cn(imagePreview ? 'h-4 w-4 text-primary' : 'h-10 w-10 text-muted-foreground/60')} aria-hidden />
              )}
              <span className={cn('text-sm font-medium', imagePreview ? 'text-foreground' : 'text-[hsl(var(--heading))]')}>
                {imagePreview ? (
                  <LangText path="admin.change_cover_image_video"  />
                ) : (
                  <LangText path="admin.upload_image_or_video"  />
                )}
              </span>
            </div>
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ev-title" className="text-foreground inline-flex items-center gap-1 flex-wrap">
            <LangText path="admin.event_title"  />
            <RequiredFieldMark />
          </Label>
          <Input
            id="ev-title"
            value={title}
            required
            onChange={(e) => {
              setTitle(e.target.value);
              clearFieldError('title');
            }}
            placeholder={t('admin.eventTitlePlaceholder')}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'ev-title-err' : undefined}
            className={cn('h-11 rounded-lg border-border', fieldErrors.title && 'border-destructive')}
            autoComplete="off"
          />
          <FieldError id="ev-title-err" message={fieldErrors.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ev-desc" className="text-foreground">
            <LangText path="admin.description"  />
          </Label>
          <Textarea
            id="ev-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t('admin.eventDescriptionPlaceholder')}
            className="min-h-[120px] resize-y rounded-lg border-border"
          />
        </div>

        <div className="space-y-2" ref={organizerComboRef}>
          <Label htmlFor="ev-organizer" className="text-foreground inline-flex items-center gap-1 flex-wrap">
            <LangText path="admin.organizer"  />
            <RequiredFieldMark />
          </Label>
          <div className="relative">
            <Input
              id="ev-organizer"
              value={organizer}
              required
              onChange={(e) => {
                setOrganizer(e.target.value);
                setOrganizerPartnerOrganizationId(null);
                clearFieldError('organizer');
                setOrganizerSuggestionsOpen(true);
              }}
              onFocus={() => setOrganizerSuggestionsOpen(true)}
              aria-invalid={Boolean(fieldErrors.organizer)}
              aria-describedby={fieldErrors.organizer ? 'ev-organizer-err' : undefined}
              aria-autocomplete="list"
              aria-expanded={Boolean(
                organizerSuggestionsOpen && filteredOrganizerPartners.length > 0 && !partnersLoading,
              )}
              className={cn('h-11 rounded-lg border-border', fieldErrors.organizer && 'border-destructive')}
              autoComplete="off"
              placeholder={t('admin.searchPartnerOrganizer')}
            />
            {organizerSuggestionsOpen && !partnersLoading && filteredOrganizerPartners.length > 0 ? (
              <ul
                role="listbox"
                className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-popover py-1 text-sm shadow-md"
              >
                {filteredOrganizerPartners.map((p) => {
                  const row = /** @type {Record<string, unknown>} */ (p);
                  const id = String(row?.id ?? row?.Id ?? '');
                  const name = organizerPartnerName(row);
                  return (
                    <li key={id || name} role="option">
                      <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/80"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          setOrganizer(name);
                          setOrganizerPartnerOrganizationId(id || null);
                          clearFieldError('organizer');
                          setOrganizerSuggestionsOpen(false);
                        }}
                      >
                        {name || id}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <FieldError id="ev-organizer-err" message={fieldErrors.organizer} />
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <Label htmlFor={virtualEventSwitchId} className="text-sm font-medium text-foreground cursor-pointer">
            <LangText path="events.onlineEvent"  />
          </Label>
          <Switch
            id={virtualEventSwitchId}
            checked={isVirtual}
            onCheckedChange={(v) => {
              setIsVirtual(v);
              clearFieldError('location');
            }}
            className="shrink-0 data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <Label htmlFor={scheduleConfirmedSwitchId} className="text-sm font-medium text-foreground cursor-pointer">
              <LangText path="admin.date_and_time_set"  />
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              <LangText path="admin.turn_off_when_the_final_schedule_is_not_ready_yet"
              />
            </p>
          </div>
          <Switch
            id={scheduleConfirmedSwitchId}
            checked={isScheduleConfirmed}
            onCheckedChange={(v) => {
              setIsScheduleConfirmed(v);
              clearFieldError('start');
              clearFieldError('end');
            }}
            className="shrink-0 data-[state=checked]:bg-primary"
          />
        </div>

        <div
          className={cn(
            'space-y-6 rounded-xl border p-4',
            !isScheduleConfirmed && 'opacity-75',
            fieldErrors.start || fieldErrors.end ? 'border-destructive' : 'border-border',
          )}
        >
          <div className="space-y-2 pb-2 border-b border-border">
            <Label htmlFor="ev-tz" className="text-foreground inline-flex items-center gap-1 flex-wrap">
              <LangText path="admin.schedule_time_zone"  />
              {isScheduleConfirmed ? <RequiredFieldMark /> : null}
            </Label>
            <select
              id="ev-tz"
              className={cn(
                'h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
              )}
              value={timeZoneId}
              onChange={(e) => setTimeZoneId(e.target.value)}
              disabled={!isScheduleConfirmed}
            >
              {timezoneSelectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {language === 'DE' ? o.de : o.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <ScheduleDateTimeBlock
              id="ev-start"
              label={<LangText path="admin.event_start"  />}
              dateValue={startDate}
              timeValue={startTime}
              onDateChange={(v) => {
                setStartDate(v);
                clearFieldError('start');
              }}
              onTimeChange={(v) => {
                setStartTime(v);
                clearFieldError('start');
              }}
              minimumCalendarDate={startMinimumCalendarDate}
              required={isScheduleConfirmed}
              disabled={!isScheduleConfirmed}
            />
            <FieldError id="ev-start-err" message={fieldErrors.start} />
          </div>
          <div className="border-t border-border pt-6">
            <ScheduleDateTimeBlock
              id="ev-end"
              label={<LangText path="admin.end"  />}
              dateValue={endDate}
              timeValue={endTime || startTime}
              onDateChange={(v) => {
                setEndDate(v);
                if (!v) {
                  setEndTime('');
                }
                clearFieldError('end');
              }}
              onTimeChange={(v) => {
                setEndTime(v);
                clearFieldError('end');
              }}
              minimumCalendarDate={endMinimumCalendarDate}
              showTimeField={Boolean(endDate)}
              showClear={Boolean(endDate)}
              disabled={!isScheduleConfirmed}
              onClear={() => {
                setEndDate('');
                setEndTime('');
                clearFieldError('end');
              }}
            />
            <FieldError id="ev-end-err" message={fieldErrors.end} />
          </div>
        </div>

        {isVirtual ? (
          <div className="space-y-2">
            <Label htmlFor="ev-virtual-platform" className="text-foreground inline-flex items-center gap-1 flex-wrap">
              <LangText path="admin.video_platform"  />
              <RequiredFieldMark />
            </Label>
            <Input
              id="ev-virtual-platform"
              type="text"
              maxLength={200}
              value={location}
              placeholder={t('admin.videoPlatformPlaceholder')}
              required
              onChange={(e) => {
                setLocation(e.target.value);
                clearFieldError('location');
              }}
              className={cn('h-11 rounded-lg border-border', fieldErrors.location && 'border-destructive')}
              aria-invalid={Boolean(fieldErrors.location)}
              aria-describedby={fieldErrors.location ? 'ev-virtual-platform-err' : undefined}
              autoComplete="off"
            />
            <FieldError id="ev-virtual-platform-err" message={fieldErrors.location} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="ev-location" className="text-foreground inline-flex items-center gap-1 flex-wrap">
              <LangText path="partners.location"  />
              <RequiredFieldMark />
            </Label>
            <div>
              <PartnerLocationField
                hideLabel
                id="ev-location"
                value={location}
                placeholder={t('admin.eventLocationPlaceholder')}
                onChange={(v) => {
                  setLocation(v);
                  clearFieldError('location');
                }}
                className={fieldErrors.location ? '[&_button]:border-destructive' : undefined}
              />
            </div>
            <FieldError id="ev-location-err" message={fieldErrors.location} />
          </div>
        )}

        <AdminMarketCountryField
          id="ev-country-code"
          value={countryCode}
          onChange={(v) => {
            setCountryCode(v);
            clearFieldError('countryCode');
          }}
          language={language === 'DE' ? 'DE' : 'EN'}
        />
        <FieldError id="ev-country-err" message={fieldErrors.countryCode} />

        <div className="space-y-2">
          <Label htmlFor="ev-ext-url" className="text-foreground inline-flex items-center gap-1 flex-wrap">
            <LangText path="admin.registration_link"  />
            <RequiredFieldMark />
          </Label>
          <Input
            id="ev-ext-url"
            type="url"
            inputMode="url"
            value={externalBookingUrl}
            required
            onChange={(e) => {
              setExternalBookingUrl(e.target.value);
              clearFieldError('externalBookingUrl');
            }}
            aria-invalid={Boolean(fieldErrors.externalBookingUrl)}
            aria-describedby={fieldErrors.externalBookingUrl ? 'ev-ext-url-err' : undefined}
            className={cn('h-11 rounded-lg border-border', fieldErrors.externalBookingUrl && 'border-destructive')}
          />
          <FieldError id="ev-ext-url-err" message={fieldErrors.externalBookingUrl} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" className={outlineBtnClass} asChild>
            <Link to="/admin/events">
              <LangText path="common.cancel"  />
            </Link>
          </Button>
          {!isCreate ? (
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              className="gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              <LangText path="messages.delete"  />
            </Button>
          ) : null}
          <Button type="submit" disabled={saving} className={primaryBtnClass}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isCreate ? (
              <LangText path="admin.add_event"  />
            ) : (
              <LangText path="common.saveChanges"  />
            )}
          </Button>
        </div>
      </form>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <LangText path="admin.delete_event"  />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <LangText path="admin.this_permanently_removes_the_event_from_the_platform"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>
              <LangText path="common.cancel"  />
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeleteEvent()}
            >
              <LangText path="messages.delete"  />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImageCropFlow cropper={cropper} />
    </div>
  );
};

export default AdminEventEditor;
