import { useEffect, useState, useCallback, useRef, useId, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Label,
  Textarea,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
} from '@imriva/framework';
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
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox.jsx';
import { toast } from 'sonner';
import {
  adminGetPartner,
  adminUpdatePartner,
  adminDeletePartner,
} from '@/services/partnerService';
import { uploadPostMediaFile } from '@/services/mediaService';
import { croppedBlobToImageFile, COVER_BANNER_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { buildCoverCropMetadata } from '@/lib/imageCropMetadata';
import { ArrowLeft, Loader2, Star, Check, X, Upload, Crown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavigationReload } from '@/lib/navigationReload';
import { PartnerLocationField } from '@/components/partner/PartnerLocationField';
import { PartnerCategorySelect } from '@/components/partner/PartnerCategorySelect';
import { PartnerAdministratorsEditor } from '@/components/partner/PartnerAdministratorsEditor';
import { ImageCropper } from '@/components/ImageCropper';
import { validateAvatarImage, validateCoverImage, IMAGE_CONSTRAINTS } from '@/utils/imageValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { isGuidString } from '@/lib/guids';
import { partnerTierLabel } from '@/lib/displayLabels';

/** Route param sanity check (reject obvious garbage; permissive GUID forms). */
/** @param {string | undefined} s */
function looksLikeGuid(s) {
  return isGuidString(s);
}

/** @param {Record<string, unknown> | null | undefined} p */
function mapAdministratorsFromPartner(p) {
  const raw = p?.administrators ?? p?.Administrators ?? [];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((row) => ({
      userId: String(row.userId ?? row.UserId ?? ''),
      handle: String(row.handle ?? row.Handle ?? ''),
      displayName: String(row.displayName ?? row.DisplayName ?? row.handle ?? row.Handle ?? ''),
      avatarUrl: row.avatarUrl ?? row.AvatarUrl ?? null,
    }))
    .filter((u) => u.userId);
}

const AdminPartnerDetail = () => {
  const { language } = useLanguage();
  const t = useT();
  const partnerOfficeLocationId = useId();
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [dataReady, setDataReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [handleDisplay, setHandleDisplay] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [tier, setTier] = useState('Standard');
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [countryCode, setCountryCode] = useState('');

  const [logoMediaFileId, setLogoMediaFileId] = useState('');
  const [coverMediaFileId, setCoverMediaFileId] = useState('');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoFileRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const coverFileRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState(/** @type {string | null} */ (null));
  const [cropperType, setCropperType] = useState(/** @type {'logo' | 'cover' | null} */ (null));

  const orgId = partner ? String(partner.id ?? partner.Id ?? '') : '';
  const administrators = useMemo(() => mapAdministratorsFromPartner(partner), [partner]);
  const savedCountryCode = useMemo(() => {
    const cc = partner?.countryCode ?? partner?.CountryCode;
    return cc ? String(cc).toUpperCase().slice(0, 2) : '';
  }, [partner]);
  const draftCountryCode = countryCode.trim().toUpperCase().slice(0, 2);
  const countryChangePending = Boolean(
    savedCountryCode && draftCountryCode && savedCountryCode !== draftCountryCode,
  );

  /** @param {Record<string, unknown>} p */
  const applyPartnerDetailToForm = useCallback((p) => {
    setName(String(p.name ?? p.Name ?? ''));
    setHandleDisplay(String(p.handle ?? p.Handle ?? ''));
    setCategory(String(p.category ?? p.Category ?? 'General'));
    setDescription(String(p.description ?? p.Description ?? ''));
    setIndustry(String(p.industry ?? p.Industry ?? ''));
    setLocation(String(p.location ?? p.Location ?? ''));
    setTier(String(p.tier ?? p.Tier ?? 'Standard'));
    const active = p.isActive ?? p.IsActive;
    setIsActive(active !== false);
    const verified = p.isVerified ?? p.IsVerified;
    setIsVerified(verified === true);
    const ccRaw = p.countryCode ?? p.CountryCode;
    setCountryCode(ccRaw ? String(ccRaw).toUpperCase().slice(0, 2) : '');
    setLogoPreviewUrl(String(p.logoUrl ?? p.LogoUrl ?? ''));
    setCoverPreviewUrl(String(p.coverImageUrl ?? p.CoverImageUrl ?? ''));
    const lid = p.logoMediaFileId ?? p.LogoMediaFileId;
    const cid = p.coverMediaFileId ?? p.CoverMediaFileId;
    setLogoMediaFileId(lid ? String(lid) : '');
    setCoverMediaFileId(cid ? String(cid) : '');
  }, []);

  const loadPartner = useCallback(async () => {
    if (!partnerId || !looksLikeGuid(partnerId)) {
      setPartner(null);
      setDataReady(true);
      return;
    }
    try {
      const p = await adminGetPartner(partnerId);
      setPartner(p);
      if (p) {
        applyPartnerDetailToForm(p);
      }
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoad'));
      setPartner(null);
    } finally {
      setDataReady(true);
    }
  }, [partnerId, applyPartnerDetailToForm]);

  useEffect(() => {
    setDataReady(false);
    setPartner(null);
  }, [partnerId]);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgId) {
      return;
    }
    setSaving(true);
    try {
      const ccUpper = countryCode.trim().toUpperCase();
      if (ccUpper.length > 0 && ccUpper.length !== 2) {
        toast.error(t('admin.country_must_be_two_letters_or_empty'));
        setSaving(false);
        return;
      }
      /** @type {Record<string, unknown>} */
      const body = {
        name: name.trim(),
        category: category.trim() || 'General',
        description: description.trim() || null,
        industry: industry.trim() || null,
        location: location.trim() || null,
        tier,
        isActive,
        isVerified,
        countryCode: ccUpper.length === 2 ? ccUpper : null,
      };
      const lid = String(logoMediaFileId ?? '').trim();
      const cid = String(coverMediaFileId ?? '').trim();
      // Always send nullable FKs so the API can distinguish explicit clear (null) from omit (partial updates preserve).
      body.logoMediaFileId = lid && isGuidString(lid) ? lid : null;
      body.coverMediaFileId = cid && isGuidString(cid) ? cid : null;
      const updated = await adminUpdatePartner(orgId, body);
      if (updated && typeof updated === 'object') {
        setPartner(updated);
        applyPartnerDetailToForm(updated);
        if (countryChangePending) {
          toast.message(t('admin.partnerCountrySavedAdminsRemoved'));
        }
      }
      toast.success(t('toasts.saved'));
      navigate('/admin/partners', { state: { partnerListRefreshAt: Date.now() } });
    } catch (err) {
      toast.error(err?.message || t('toasts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePartner = async () => {
    if (!orgId || !partner) {
      setDeleteDialogOpen(false);
      return;
    }
    setDeleteDialogOpen(false);
    setDeleting(true);
    try {
      await adminDeletePartner(orgId);
      toast.success(t('toasts.partnerDeactivated'));
      navigate('/admin/partners', { state: { partnerListRefreshAt: Date.now() } });
    } catch (err) {
      toast.error(err?.message || t('toasts.deactivateFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const closeCropper = () => {
    setCropperOpen(false);
    setCropperImage(null);
    setCropperType(null);
  };

  const onLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (logoFileRef.current) {
      logoFileRef.current.value = '';
    }
    if (!file) {
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
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result);
      setCropperType('logo');
      setCropperOpen(true);
    };
    reader.onerror = () => {
      toast.error(t('toasts.couldNotReadImage'));
    };
    reader.readAsDataURL(file);
  };

  const onCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (coverFileRef.current) {
      coverFileRef.current.value = '';
    }
    if (!file) {
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
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result);
      setCropperType('cover');
      setCropperOpen(true);
    };
    reader.onerror = () => {
      toast.error(t('toasts.couldNotReadImage'));
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob, cropMeta) => {
    const isLogo = cropperType === 'logo';
    const aspectRatio = isLogo ? 1 : COVER_BANNER_ASPECT_RATIO;
    const displayMeta = buildCoverCropMetadata(cropMeta?.aspectRatio ?? aspectRatio);
    const file = croppedBlobToImageFile(
      croppedBlob,
      isLogo ? 'logo.jpg' : 'cover.jpg',
      isLogo ? 'logo' : 'cover',
      displayMeta,
    );
    const setBusy = isLogo ? setUploadingLogo : setUploadingCover;
    setBusy(true);
    try {
      const { mediaFileId, publicUrl } = await uploadPostMediaFile(file);
      const idStr = String(mediaFileId ?? '').trim();
      if (isLogo) {
        setLogoMediaFileId(idStr);
        setLogoPreviewUrl(publicUrl);
      } else {
        setCoverMediaFileId(idStr);
        setCoverPreviewUrl(publicUrl);
      }
    } catch (err) {
      toast.error(err?.message || t('admin.uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (!partnerId || !looksLikeGuid(partnerId)) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-destructive">
        <LangText path="admin.invalid_partner_id_open_this_page_from_the_partner_managemen"  />
      </div>
    );
  }

  if (isNavigationReload() && !dataReady) {
    return (
      <div className="max-w-3xl mx-auto flex items-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <LangText path="common.loading"  />
      </div>
    );
  }

  if (!dataReady) {
    return null;
  }

  if (!partner) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-destructive"><LangText path="admin.partner_not_found"  /></p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/admin/partners"><LangText path="layout.back"  /></Link>
        </Button>
      </div>
    );
  }

  const logoUrl = logoPreviewUrl || String(partner.logoUrl ?? '');
  const coverUrl = coverPreviewUrl || String(partner.coverImageUrl ?? partner.CoverImageUrl ?? '');
  const displayName = name.trim() || String(partner.name ?? '');
  const isPremium = tier === 'Premium';
  /** Server-saved state — do not use draft `isActive` for danger zone / status panels. */
  const savedIsActive = (partner.isActive ?? partner.IsActive) !== false;

  const primaryBtnClass =
    'rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground gap-2';
  const outlineBtnClass =
    'rounded-lg border-[hsl(var(--heading))] text-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/10 gap-2';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
          <Link to="/admin/partners">
            <ArrowLeft className="w-4 h-4" />
            <LangText path="layout.back"  />
          </Link>
        </Button>
        <h1 className="partner-admin-heading">
          <LangText path="admin.edit_partner"  />
        </h1>
      </div>

      {coverUrl ? (
        <div className="rounded-xl border border-border overflow-hidden h-32 bg-muted">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4 items-start border border-border rounded-xl p-4 bg-muted/20">
        <Avatar className="w-20 h-20 rounded-xl border border-border shrink-0">
          <AvatarImage src={logoUrl || undefined} alt={displayName} />
          <AvatarFallback className="rounded-xl text-lg">{displayName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 min-h-[28px]">
            <span className="font-semibold text-foreground">{displayName}</span>
            {!savedIsActive ? (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border bg-muted/50">
                <LangText path="admin.inactive"  />
              </Badge>
            ) : null}
            <span
              className={cn(
                isPremium ? 'partner-premium-badge' : 'partner-standard-badge',
                'text-xs inline-flex items-center gap-1',
              )}
            >
              {isPremium ? <Star className="w-3 h-3 text-amber-600" aria-hidden /> : null}
              {partnerTierLabel(isPremium ? 'Premium' : 'Standard', language)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">@{String(partner.handle ?? '')}</p>
        </div>
      </div>

      <PartnerAdministratorsEditor
        organizationId={orgId}
        administrators={administrators}
        disabled={saving || deleting}
        partnerCountryCode={savedCountryCode || draftCountryCode}
        countryChangePending={countryChangePending}
        className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm"
        onPartnerUpdated={(updated) => {
          setPartner(updated);
        }}
      />

      <form onSubmit={handleSave} className="space-y-6 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <Label htmlFor="ed-name">
              <LangText path="auth.name"  /> <span className="text-destructive">*</span>
            </Label>
            <Input id="ed-name" className="h-11 rounded-lg" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ed-handle"><LangText path="admin.partner_handle"  /></Label>
            <Input id="ed-handle" className="h-11 rounded-lg" value={handleDisplay} disabled readOnly />
          </div>
          <PartnerCategorySelect id="ed-cat" value={category} onChange={setCategory} />
          <div className="space-y-2">
            <Label htmlFor="ed-ind"><LangText path="admin.industry"  /></Label>
            <Input id="ed-ind" className="h-11 rounded-lg" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ed-desc">
            <LangText path="admin.description"  /> <span className="text-destructive">*</span>
          </Label>
          <Textarea id="ed-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="rounded-lg min-h-[120px]" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label><LangText path="admin.logo"  /></Label>
            <input
              ref={logoFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={t('admin.upload_logo_image')}
              onChange={(ev) => void onLogoFileChange(ev)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Avatar className="w-16 h-16 rounded-xl border border-border">
                <AvatarImage src={logoUrl || undefined} alt="" />
                <AvatarFallback className="rounded-xl">{displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                className={outlineBtnClass}
                disabled={uploadingLogo}
                onClick={() => logoFileRef.current?.click()}
              >
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <LangText path="admin.change_logo"  />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label><LangText path="admin.cover_image"  /></Label>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={t('admin.upload_cover_image')}
              onChange={(ev) => void onCoverFileChange(ev)}
            />
            {coverUrl ? (
              <div className="rounded-lg border border-border overflow-hidden h-20 bg-muted mb-2">
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className={cn('w-full sm:w-auto h-11 border-dashed', outlineBtnClass)}
              disabled={uploadingCover}
              onClick={() => coverFileRef.current?.click()}
            >
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <LangText path="admin.change_cover"  />
            </Button>
          </div>
        </div>

        <PartnerLocationField
          id={partnerOfficeLocationId}
          value={location}
          onChange={setLocation}
        />

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="ed-country-code">
            <LangText path="admin.primary_country_iso"  />
          </Label>
          <CountryMarketCombobox
            id="ed-country-code"
            source="available"
            language={language === 'DE' ? 'DE' : 'EN'}
            value={countryCode}
            allowEmpty={false}
            inputClassName="h-11 rounded-lg uppercase"
            onChange={setCountryCode}
          />
        </div>

        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 scroll-mt-4">
          <button
            type="button"
            role="switch"
            aria-checked={tier === 'Premium'}
            onClick={() => setTier((t) => (t === 'Premium' ? 'Standard' : 'Premium'))}
            className="flex w-full max-w-md items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--heading))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 rounded-full border border-border transition-colors',
                tier === 'Premium' ? 'bg-[hsl(var(--heading))]' : 'bg-muted',
              )}
              aria-hidden
            >
              <span
                className={cn(
                  'pointer-events-none block h-6 w-6 translate-x-0.5 translate-y-px rounded-full bg-background shadow-sm transition-transform duration-200 ease-out',
                  tier === 'Premium' && 'translate-x-[1.35rem]',
                )}
              />
            </span>
            <Crown className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="text-sm font-medium text-foreground">
              <LangText path="partner.premiumPartner"  />
            </span>
          </button>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-border" />
            <LangText path="admin.active_visible_in_discovery"  />
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} className="rounded border-border" />
            <LangText path="admin.verified_badge"  />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" className={primaryBtnClass} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <LangText path="common.saveChanges"  />
          </Button>
          <Button type="button" variant="outline" className={outlineBtnClass} asChild>
            <Link to="/admin/partners">
              <X className="w-4 h-4" />
              <LangText path="common.cancel"  />
            </Link>
          </Button>
        </div>
      </form>

      {savedIsActive ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-destructive">
            <LangText path="admin.danger_zone"  />
          </h2>
          <p className="text-sm text-muted-foreground">
            <LangText path="admin.deactivate_hides_this_partner_from_discovery_and_organizer_p"
            />
          </p>
          <Button
            type="button"
            variant="destructive"
            className="gap-2"
            disabled={deleting || saving}
            onClick={() => setDeleteDialogOpen(true)}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <LangText path="admin.deactivate_partner"  />
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/40 dark:bg-muted/30 p-6 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            <LangText path="admin.inactive_partner"  />
          </h2>
          <p className="text-sm text-muted-foreground">
            <LangText path="admin.this_organization_is_hidden_from_discovery_and_organizer_lis"
            />
          </p>
          {isActive && !savedIsActive ? (
            <p className="text-sm font-medium text-foreground pt-1">
              <LangText path="admin.save_changes_to_apply_activation"  />
            </p>
          ) : null}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <LangText path="admin.deactivate_partner_2"  />
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <LangText path="admin.the_partner_will_be_marked_inactive_memberships_are_kept_so_"
              />
              {displayName ? (
                <span className="block font-medium text-foreground pt-1">“{displayName}”</span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>
              <LangText path="common.cancel"  />
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeletePartner()}
            >
              <LangText path="admin.deactivate"  />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageCropper
        open={cropperOpen}
        onClose={closeCropper}
        imageSrc={cropperImage}
        onCropComplete={handleCropComplete}
        isCircular={cropperType === 'logo'}
        aspectRatio={cropperType === 'logo' ? 1 : IMAGE_CONSTRAINTS.COVER.COVER_CROP_ASPECT_RATIO}
        aspectLabel={cropperType === 'logo' ? '1:1' : '4:1'}
        title={cropperType === 'logo' ? t('admin.adjustLogo') : t('admin.adjustCoverImage')}
      />
    </div>
  );
};

export default AdminPartnerDetail;
