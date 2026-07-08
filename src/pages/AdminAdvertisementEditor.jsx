import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { isValid, max as maxDate, parse as parseDate, startOfDay } from 'date-fns';
import { isNavigationReload } from '@/lib/navigationReload';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Label, Textarea } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { toast } from 'sonner';
import {
  adminGetAdvertisement,
  adminCreateAdvertisement,
  adminUpdateAdvertisement,
} from '@/services/adminAdvertisementService';
import { adminListPartners } from '@/services/partnerService';
import { uploadPostMediaFile } from '@/services/mediaService';
import { ImageCropFlow } from '@/components/ImageCropFlow';
import { useImageCropQueue } from '@/hooks/useImageCropQueue';
import { getImageCropConfig } from '@/lib/imageCropPresets';
import { validateAvatarImage } from '@/utils/imageValidation';
import { ArrowLeft, ImageIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { sortPartnersActiveFirst } from '@/lib/partnerSort';
import {
  dateOnlyToUtcEndIso,
  dateOnlyToUtcStartIso,
  isoUtcToDateOnlyString,
  ScheduleDateTimeBlock,
} from '@/components/admin/ScheduleDateTimeFields';
import { EventCoverMedia } from '@/components/event/EventCoverMedia';
import { FieldError } from '@/components/ui/FieldError';
import { AdminMarketCountryField } from '@/components/admin/AdminMarketCountryField';
import { useAdminScopeCountryField } from '@/hooks/useAdminScopeCountryField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PLACEMENT_FEED = 0;
const PLACEMENT_SIDEBAR = 1;

/** Sentinel: no partner linked for advertiser. */
const PARTNER_NONE_VALUE = '__none__';

function looksLikeGuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ''));
}

function isVideoContentType(ct) {
  return typeof ct === 'string' && ct.toLowerCase().startsWith('video/');
}

/** @param {unknown} p */
function normalizePlacement(p) {
  if (p === 'Sidebar' || p === 'sidebar') {
    return PLACEMENT_SIDEBAR;
  }
  if (p === 'Feed' || p === 'feed') {
    return PLACEMENT_FEED;
  }
  const n = typeof p === 'number' ? p : Number(p);
  return n === PLACEMENT_SIDEBAR ? PLACEMENT_SIDEBAR : PLACEMENT_FEED;
}

/** @param {Record<string, unknown>} p */
function partnerName(p) {
  return String(p?.name ?? p?.Name ?? '').trim();
}

/** @param {Record<string, unknown>} p */
function partnerHandle(p) {
  return String(p?.handle ?? p?.Handle ?? '').trim();
}

/** @param {Record<string, unknown>} p */
function partnerId(p) {
  return String(p?.id ?? p?.Id ?? '');
}

const AdminAdvertisementEditor = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const isCreate = !adId;

  const [dataReady, setDataReady] = useState(isCreate);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  /** @type {[string, import('react').Dispatch<string>]} */
  const [advertiserPartnerOrgId, setAdvertiserPartnerOrgId] = useState(PARTNER_NONE_VALUE);
  /** @type {[Array<Record<string, unknown>>, import('react').Dispatch<import('react').SetStateAction<Array<Record<string, unknown>>>>]} */
  const [partnerPicklist, setPartnerPicklist] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [advertiserSuggestionsOpen, setAdvertiserSuggestionsOpen] = useState(false);
  const [placement, setPlacement] = useState(PLACEMENT_FEED);
  const [targetUrl, setTargetUrl] = useState('');
  const { countryCode, setCountryCode, setCountryCodeFromApi } = useAdminScopeCountryField({ isCreate });
  /** Optional total campaign spend for CPM (same currency over time). */
  const [campaignCost, setCampaignCost] = useState('');
  const [imageMediaFileId, setImageMediaFileId] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [bannerContentType, setBannerContentType] = useState('');
  const [advertiserLogoMediaFileId, setAdvertiserLogoMediaFileId] = useState('');
  const [advertiserLogoPreview, setAdvertiserLogoPreview] = useState('');
  const [uploadingAdvertiserLogo, setUploadingAdvertiserLogo] = useState(false);
  const [validFromDate, setValidFromDate] = useState('');
  const [validToDate, setValidToDate] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const { cropper, enqueue: enqueueImageCrop } = useImageCropQueue();
  const fileRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const advertiserLogoFileRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const advertiserComboRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  /** @type {[Record<string, string>, import('react').Dispatch<import('react').SetStateAction<Record<string, string>>>]} */
  const [fieldErrors, setFieldErrors] = useState({});

  const validFromMinimumCalendarDate = useMemo(() => startOfDay(new Date()), []);

  const validToMinimumCalendarDate = useMemo(() => {
    const today = startOfDay(new Date());
    if (validFromDate && /^\d{4}-\d{2}-\d{2}$/.test(validFromDate)) {
      const sd = startOfDay(parseDate(validFromDate, 'yyyy-MM-dd', new Date()));
      if (!isValid(sd)) {
        return today;
      }
      return maxDate([today, sd]);
    }
    return today;
  }, [validFromDate]);

  const hasPartner =
    Boolean(advertiserPartnerOrgId) && advertiserPartnerOrgId !== PARTNER_NONE_VALUE && looksLikeGuid(advertiserPartnerOrgId);

  const filteredPartners = useMemo(() => {
    const list = Array.isArray(partnerPicklist) ? partnerPicklist : [];
    const raw = advertiserName.trim().toLowerCase();
    const q = raw.startsWith('@') ? raw.slice(1) : raw;
    if (!q) {
      return list.slice(0, 25);
    }
    return list
      .filter((p) => {
        const row = /** @type {Record<string, unknown>} */ (p);
        const n = partnerName(row).toLowerCase();
        const h = partnerHandle(row).toLowerCase();
        return n.includes(q) || h.includes(q);
      })
      .slice(0, 50);
  }, [partnerPicklist, advertiserName]);

  const load = useCallback(async () => {
    if (!adId || !looksLikeGuid(adId)) {
      setDataReady(true);
      return;
    }
    try {
      const ad = await adminGetAdvertisement(adId);
      if (!ad) {
        toast.error(t('toasts.advertisementNotFound'));
        navigate('/admin/ads', { replace: true });
        return;
      }
      setTitle(String(ad.title ?? ad.Title ?? ''));
      setBody(String(ad.body ?? ad.Body ?? ''));
      setAdvertiserName(String(ad.advertiserName ?? ad.AdvertiserName ?? ''));
      const apid = ad.advertiserPartnerOrganizationId ?? ad.AdvertiserPartnerOrganizationId;
      setAdvertiserPartnerOrgId(apid ? String(apid) : PARTNER_NONE_VALUE);
      const alid = ad.advertiserLogoMediaFileId ?? ad.AdvertiserLogoMediaFileId;
      setAdvertiserLogoMediaFileId(alid ? String(alid) : '');
      const alurl = ad.advertiserLogoPublicUrl ?? ad.AdvertiserLogoPublicUrl;
      setAdvertiserLogoPreview(alurl ? String(alurl) : '');
      setPlacement(normalizePlacement(ad.placement ?? ad.Placement));
      setTargetUrl(String(ad.targetUrl ?? ad.TargetUrl ?? ''));
      const mkt = ad.countryCode ?? ad.CountryCode;
      setCountryCodeFromApi(mkt ? String(mkt) : '');
      const cc = ad.campaignCost ?? ad.CampaignCost;
      setCampaignCost(cc !== null && cc !== undefined && cc !== '' ? String(cc) : '');
      const imgId = ad.imageMediaFileId ?? ad.ImageMediaFileId;
      setImageMediaFileId(imgId ? String(imgId) : '');
      const pub = ad.imagePublicUrl ?? ad.ImagePublicUrl;
      setImagePreview(pub ? String(pub) : '');
      const ct = ad.imageContentType ?? ad.ImageContentType;
      setBannerContentType(ct ? String(ct) : '');
      setValidFromDate(isoUtcToDateOnlyString(ad.validFromUtc ?? ad.ValidFromUtc));
      setValidToDate(isoUtcToDateOnlyString(ad.validToUtc ?? ad.ValidToUtc));
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoad'));
    } finally {
      setDataReady(true);
    }
  }, [adId, navigate, setCountryCodeFromApi]);

  useEffect(() => {
    if (isCreate) {
      setDataReady(true);
      return;
    }
    setDataReady(false);
  }, [adId, isCreate]);

  useEffect(() => {
    let cancelled = false;
    setPartnersLoading(true);
    adminListPartners(1, 500, true, true)
      .then((res) => {
        if (cancelled) {
          return;
        }
        const raw = res?.data ?? res?.Data ?? res?.items ?? [];
        setPartnerPicklist(sortPartnersActiveFirst(Array.isArray(raw) ? raw : []));
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
    if (isCreate) {
      return;
    }
    void load();
  }, [isCreate, load]);

  useEffect(() => {
    function handlePointerDown(/** @type {MouseEvent} */ e) {
      const el = advertiserComboRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setAdvertiserSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const clearFieldError = (/** @type {string} */ key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const syncPartnerFromInput = (/** @type {string} */ nextName) => {
    if (advertiserPartnerOrgId === PARTNER_NONE_VALUE) {
      return;
    }
    const row = partnerPicklist.find((p) => partnerId(/** @type {Record<string, unknown>} */ (p)) === advertiserPartnerOrgId);
    if (!row) {
      setAdvertiserPartnerOrgId(PARTNER_NONE_VALUE);
      return;
    }
    const name = partnerName(row).toLowerCase();
    const next = nextName.trim().toLowerCase();
    if (name !== next) {
      setAdvertiserPartnerOrgId(PARTNER_NONE_VALUE);
    }
  };

  const selectPartnerRow = (/** @type {Record<string, unknown>} */ p) => {
    const id = partnerId(p);
    const name = partnerName(p);
    if (!id || !looksLikeGuid(id)) {
      return;
    }
    setAdvertiserPartnerOrgId(id);
    setAdvertiserName(name);
    setAdvertiserLogoMediaFileId('');
    setAdvertiserLogoPreview('');
    setAdvertiserSuggestionsOpen(false);
  };

  const isPastCalendarDate = (/** @type {string} */ dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }
    const day = startOfDay(parseDate(dateStr, 'yyyy-MM-dd', new Date()));
    if (!isValid(day)) {
      return false;
    }
    return day < startOfDay(new Date());
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    /** @type {Record<string, string>} */
    const err = {};
    if (!title.trim()) {
      err.title = t('admin.adTitleRequired');
    }
    if (!validFromDate) {
      err.validFrom = t('admin.startDateRequired');
    }
    if (!validToDate) {
      err.validTo = t('admin.endDateRequired');
    }
    const ccNorm = countryCode.trim().toUpperCase();
    if (!ccNorm || ccNorm.length !== 2) {
      err.countryCode = t('admin.marketCountryRequired');
    }
    if (validFromDate && validToDate) {
      const from = parseDate(validFromDate, 'yyyy-MM-dd', new Date());
      const to = parseDate(validToDate, 'yyyy-MM-dd', new Date());
      if (isValid(from) && isValid(to) && to < from) {
        err.validTo = t('admin.endDateAfterStart');
      }
      if (isCreate && isPastCalendarDate(validFromDate)) {
        err.validFrom = t('admin.startDateNotPast');
      }
      if (!err.validTo && isPastCalendarDate(validToDate)) {
        err.validTo = t('admin.endDateNotPast');
      }
    }
    if (!imageMediaFileId.trim()) {
      err.banner = t('admin.uploadBannerRequired');
    }
    if (!targetUrl.trim()) {
      err.targetUrl = t('admin.targetUrlRequired');
    }
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const ccNorm = countryCode.trim().toUpperCase();
      if (ccNorm.length > 0 && ccNorm.length !== 2) {
        toast.error(t('admin.countryCodeTwoLetters'));
        setSaving(false);
        return;
      }
      const vf = dateOnlyToUtcStartIso(validFromDate);
      const vt = dateOnlyToUtcEndIso(validToDate);
      const partnerPayload = hasPartner ? advertiserPartnerOrgId : null;
      const logoPayload = hasPartner ? null : advertiserLogoMediaFileId.trim() || null;
      const costTrim = campaignCost.trim();
      const costNum = costTrim === '' ? null : Number(costTrim);
      const         payload = {
        title: title.trim(),
        body: body.trim() || null,
        advertiserName: advertiserName.trim() || null,
        advertiserPartnerOrganizationId: partnerPayload,
        advertiserLogoMediaFileId: logoPayload,
        placement: normalizePlacement(placement),
        targetUrl: targetUrl.trim() || null,
        imageMediaFileId: imageMediaFileId.trim() || null,
        validFromUtc: vf,
        validToUtc: vt,
        campaignCost: costTrim === '' || costNum === null || Number.isNaN(costNum) ? null : costNum,
        countryCode: ccNorm,
      };
      if (isCreate) {
        await adminCreateAdvertisement(payload);
        toast.success(t('toasts.advertisementCreated'));
        navigate('/admin/ads', { replace: true });
      } else if (adId) {
        await adminUpdateAdvertisement(adId, payload);
        toast.success(t('toasts.saved'));
        navigate('/admin/ads', { replace: true });
      }
    } catch (apiErr) {
      toast.error(apiErr?.message || t('toasts.saveFailed'));
    } finally {
      setSaving(false);
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
      setUploadingImage(true);
      try {
        const { mediaFileId, publicUrl, contentType } = await uploadPostMediaFile(file, {
          showLoader: false,
          policyName: 'streamOnly',
        });
        setImageMediaFileId(String(mediaFileId));
        setImagePreview(String(publicUrl || ''));
        setBannerContentType(String(contentType || file.type || ''));
        clearFieldError('banner');
        toast.success(t('toasts.uploaded'));
      } catch (err) {
        toast.error(err?.message || t('admin.uploadFailed'));
      } finally {
        setUploadingImage(false);
      }
      return;
    }
    const lang = language === 'DE' ? 'DE' : 'EN';
    const cropPreset = placement === PLACEMENT_SIDEBAR ? 'adSidebar' : 'adBanner';
    enqueueImageCrop([{ file, config: getImageCropConfig(cropPreset, lang) }], (cropped) => {
      const croppedFile = cropped[0];
      if (!croppedFile) {
        return;
      }
      setUploadingImage(true);
      void uploadPostMediaFile(croppedFile, { showLoader: false, policyName: 'streamOnly' })
        .then(({ mediaFileId, publicUrl, contentType }) => {
          setImageMediaFileId(String(mediaFileId));
          setImagePreview(String(publicUrl || ''));
          setBannerContentType(String(contentType || croppedFile.type || ''));
          clearFieldError('banner');
          toast.success(t('toasts.uploaded'));
        })
        .catch((err) => toast.error(err?.message || t('admin.uploadFailed')))
        .finally(() => setUploadingImage(false));
    });
  };

  const onPickAdvertiserLogo = async (fileList) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    const ct = String(file.type || '').toLowerCase();
    if (!ct.startsWith('image/')) {
      toast.error(t('admin.chooseImageFile'));
      return;
    }
    const validation = await validateAvatarImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    if (validation.warning) {
      toast.warning(validation.warning);
    }
    const lang = language === 'DE' ? 'DE' : 'EN';
    enqueueImageCrop([{ file, config: getImageCropConfig('adLogo', lang) }], (cropped) => {
      const croppedFile = cropped[0];
      if (!croppedFile) {
        return;
      }
      setUploadingAdvertiserLogo(true);
      void uploadPostMediaFile(croppedFile, { showLoader: false })
        .then(({ mediaFileId, publicUrl }) => {
          setAdvertiserLogoMediaFileId(String(mediaFileId));
          setAdvertiserLogoPreview(String(publicUrl || ''));
          toast.success(t('toasts.logoUploaded'));
        })
        .catch((err) => toast.error(err?.message || t('admin.uploadFailed')))
        .finally(() => setUploadingAdvertiserLogo(false));
    });
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

  const req = <span className="text-destructive ml-0.5" aria-hidden>*</span>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
          <Link to="/admin/ads">
            <ArrowLeft className="w-4 h-4" />
            <LangText path="admin.back_to_ads"  />
          </Link>
        </Button>
        <h1 className="partner-admin-heading">
          {isCreate ? (
            <LangText path="admin.new_ad"  />
          ) : (
            <LangText path="admin.edit_ad"  />
          )}
        </h1>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="ad-title" className="text-foreground">
            <LangText path="admin.ad_title"  />
            {req}
          </Label>
          <Input
            id="ad-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearFieldError('title');
            }}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'ad-title-err' : undefined}
            className={cn('rounded-xl h-11', fieldErrors.title && 'border-destructive')}
          />
          <FieldError id="ad-title-err" message={fieldErrors.title} />
        </div>

        <div className="space-y-2" ref={advertiserComboRef}>
          <Label htmlFor="ad-advertiser" className="text-foreground">
            <LangText path="admin.advertiser"  />
          </Label>
          <div className="relative">
            <Input
              id="ad-advertiser"
              value={advertiserName}
              onChange={(e) => {
                const v = e.target.value;
                syncPartnerFromInput(v);
                setAdvertiserName(v);
                setAdvertiserSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (!hasPartner) {
                  setAdvertiserSuggestionsOpen(true);
                }
              }}
              placeholder={t('admin.searchPartnerAdvertiser')}
              autoComplete="off"
              className="rounded-xl h-11"
              aria-autocomplete="list"
              aria-expanded={Boolean(advertiserSuggestionsOpen && filteredPartners.length > 0 && !hasPartner)}
            />
            {advertiserSuggestionsOpen && !partnersLoading && filteredPartners.length > 0 && !hasPartner ? (
              <ul
                role="listbox"
                className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-popover py-1 text-sm shadow-md"
              >
                {filteredPartners.map((p) => {
                  const row = /** @type {Record<string, unknown>} */ (p);
                  const id = partnerId(row);
                  const name = partnerName(row);
                  return (
                    <li key={id || name} role="option">
                      <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/80"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          selectPartnerRow(row);
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
        </div>

        {!hasPartner ? (
          <div className="space-y-2">
            <Label className="text-foreground">
              <LangText path="admin.advertiser_logo"  />
            </Label>
            <input
              ref={advertiserLogoFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={t('admin.upload_advertiser_logo')}
              onChange={(e) => void onPickAdvertiserLogo(e.target.files)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={uploadingAdvertiserLogo}
                onClick={() => advertiserLogoFileRef.current?.click()}
              >
                {uploadingAdvertiserLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <LangText path={advertiserLogoPreview ? 'admin.change_logo' : 'admin.upload_logo'} />
              </Button>
              {advertiserLogoPreview ? (
                <>
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-muted">
                    <img src={advertiserLogoPreview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      setAdvertiserLogoMediaFileId('');
                      setAdvertiserLogoPreview('');
                    }}
                  >
                    <LangText path="posts.remove"  />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="ad-body" className="text-foreground">
            <LangText path="admin.description"  />
          </Label>
          <Textarea
            id="ad-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="rounded-xl min-h-[120px]"
            placeholder={t('admin.enterAdDescription')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad-placement" className="text-foreground">
            <LangText path="admin.placement"  />
            {req}
          </Label>
          <Select
            value={String(placement)}
            onValueChange={(v) => setPlacement(normalizePlacement(Number(v)))}
          >
            <SelectTrigger id="ad-placement" className="rounded-xl h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(PLACEMENT_FEED)}>
                {t('admin.placementFeedFull')}
              </SelectItem>
              <SelectItem value={String(PLACEMENT_SIDEBAR)}>
                {t('admin.placementSidebarFull')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminMarketCountryField
          id="ad-country"
          value={countryCode}
          onChange={(value) => {
            setCountryCode(value);
            clearFieldError('countryCode');
          }}
          language={language === 'DE' ? 'DE' : 'EN'}
          allowEmpty={false}
        />
        <FieldError message={fieldErrors.countryCode} />

        <div className="grid gap-6 sm:grid-cols-2">
          <ScheduleDateTimeBlock
            id="ad-vf"
            label={
              <span className="inline-flex items-center gap-1">
                <LangText path="admin.start_date"  />
              </span>
            }
            dateValue={validFromDate}
            timeValue="00:00"
            onDateChange={(d) => {
              setValidFromDate(d);
              clearFieldError('validFrom');
              clearFieldError('validTo');
            }}
            onTimeChange={() => {}}
            showTimeField={false}
            minimumCalendarDate={validFromMinimumCalendarDate}
            required
            showClear={false}
            onClear={() => {}}
          />
          <ScheduleDateTimeBlock
            id="ad-vt"
            label={
              <span className="inline-flex items-center gap-1">
                <LangText path="admin.end_date"  />
              </span>
            }
            dateValue={validToDate}
            timeValue="23:59"
            onDateChange={(d) => {
              setValidToDate(d);
              clearFieldError('validFrom');
              clearFieldError('validTo');
            }}
            onTimeChange={() => {}}
            showTimeField={false}
            minimumCalendarDate={validToMinimumCalendarDate}
            required
            showClear={false}
            onClear={() => {}}
          />
        </div>
        {(fieldErrors.validFrom || fieldErrors.validTo) && (
          <div className="-mt-4 space-y-1">
            <FieldError id="ad-vf-err" message={fieldErrors.validFrom} />
            <FieldError id="ad-vt-err" message={fieldErrors.validTo} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="ad-url" className="text-foreground">
            <LangText path="admin.target_url"  />
            {req}
          </Label>
          <Input
            id="ad-url"
            type="url"
            value={targetUrl}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              clearFieldError('targetUrl');
            }}
            aria-invalid={Boolean(fieldErrors.targetUrl)}
            aria-describedby={fieldErrors.targetUrl ? 'ad-url-err' : undefined}
            placeholder="https://"
            className={cn('rounded-xl h-11', fieldErrors.targetUrl && 'border-destructive')}
          />
          <FieldError id="ad-url-err" message={fieldErrors.targetUrl} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ad-campaign-cost" className="text-foreground">
            <LangText path="admin.campaign_budget_optional"  />
          </Label>
          <Input
            id="ad-campaign-cost"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={campaignCost}
            onChange={(e) => setCampaignCost(e.target.value)}
            placeholder={t('admin.budgetPlaceholder')}
            className="rounded-xl h-11"
            aria-describedby="ad-campaign-cost-hint"
          />
          <p id="ad-campaign-cost-hint" className="text-xs text-muted-foreground">
            <LangText path="admin.used_to_calculate_cpm_please_use_the_same_currency_for_all_a"
            />
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          aria-label={t('admin.upload_image_or_video')}
          onChange={(e) => void onPickImage(e.target.files)}
        />

        <div className="space-y-2">
          <Label className="text-foreground">
            <LangText path="admin.banner_image_video"  />
            {req}
          </Label>
          <button
            type="button"
            disabled={uploadingImage}
            onClick={() => fileRef.current?.click()}
            aria-invalid={Boolean(fieldErrors.banner)}
            aria-describedby={fieldErrors.banner ? 'ad-banner-err' : undefined}
            className={cn(
              'group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed bg-muted/20 px-4 py-10 text-center transition-colors',
              'min-h-[160px] hover:border-primary/40 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              uploadingImage && 'pointer-events-none opacity-70',
              fieldErrors.banner ? 'border-destructive' : 'border-border',
            )}
          >
            {imagePreview ? (
              isVideoContentType(bannerContentType) ? (
                <video
                  src={imagePreview}
                  controls
                  className="absolute inset-0 h-full w-full object-contain bg-black/80"
                />
              ) : (
                <EventCoverMedia
                  src={imagePreview}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )
            ) : null}
            <div
              className={cn(
                'relative z-[1] flex flex-col items-center gap-2',
                imagePreview && 'rounded-xl bg-background/90 px-4 py-3 shadow-sm backdrop-blur-sm',
              )}
            >
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <ImageIcon className={cn('h-10 w-10', imagePreview ? 'text-primary' : 'text-muted-foreground/60')} aria-hidden />
              )}
              <span className={cn('text-sm font-medium', imagePreview ? 'text-foreground' : 'text-[hsl(var(--heading))]')}>
                {imagePreview ? (
                  <LangText path="admin.change_file"  />
                ) : (
                  <LangText path="admin.upload_image_or_video"  />
                )}
              </span>
            </div>
          </button>
          <FieldError id="ad-banner-err" message={fieldErrors.banner} />
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-secondary h-11 px-8 rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isCreate ? (
            <LangText path="admin.create_ad"  />
          ) : (
            <LangText path="common.saveChanges"  />
          )}
        </Button>
      </form>
      <ImageCropFlow cropper={cropper} />
    </div>
  );
};

export default AdminAdvertisementEditor;
