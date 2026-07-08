import { useState, useRef, useId } from 'react';
import { Button, Input, Label, Textarea, Avatar, AvatarImage, AvatarFallback } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { adminCreatePartner } from '@/services/partnerService';
import { uploadPostMediaFile } from '@/services/mediaService';
import { croppedBlobToImageFile, COVER_BANNER_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { buildCoverCropMetadata } from '@/lib/imageCropMetadata';
import { ArrowLeft, Check, Loader2, Upload, X, Crown, ImageIcon } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { ImageCropper } from '@/components/ImageCropper';
import { validateAvatarImage, validateCoverImage, IMAGE_CONSTRAINTS } from '@/utils/imageValidation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { FieldError } from '@/components/ui/FieldError';
import { PartnerCategorySelect } from '@/components/partner/PartnerCategorySelect';
import { PartnerAdminUsersPicker } from '@/components/partner/PartnerAdminUsersPicker';
import { PartnerLocationField } from '@/components/partner/PartnerLocationField';
import { PartnerPrimaryCountryField } from '@/components/partner/PartnerPrimaryCountryField';
import { useAdminScopeCountryField } from '@/hooks/useAdminScopeCountryField';
import { isGuidString } from '@/lib/guids';

function derivePartnerHandle(value) {
  const base = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `partner-${Date.now()}`;
}

/** Normalize handle input to match organization slug rules (API stores lowercase). */
function normalizePartnerHandleInput(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

const AdminPartnerCreate = () => {
  const adminPickerId = useId();
  const partnerOfficeLocationId = useId();
  const adminUsersPickerRef = useRef(/** @type {{ validate: () => string | null } | null} */ (null));
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const [name, setName] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [category, setCategory] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const { countryCode, setCountryCode } = useAdminScopeCountryField({ isCreate: true });
  const [tier, setTier] = useState('Standard');
  /** @type {[Array<{ userId: string, handle: string, displayName: string, avatarUrl?: string | null }>, import('react').Dispatch<import('react').SetStateAction<Array<{ userId: string, handle: string, displayName: string, avatarUrl?: string | null }>>>]} */
  const [adminUsers, setAdminUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  /** @type {[Record<string, string>, import('react').Dispatch<import('react').SetStateAction<Record<string, string>>>]} */
  const [fieldErrors, setFieldErrors] = useState({});

  const [logoMediaFileId, setLogoMediaFileId] = useState('');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [coverMediaFileId, setCoverMediaFileId] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState(/** @type {string | null} */ (null));
  const [cropperType, setCropperType] = useState(/** @type {'logo' | 'cover' | null} */ (null));

  const primaryBtnClass =
    'rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground gap-2';
  const outlineBtnClass =
    'rounded-lg border-[hsl(var(--heading))] text-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/10 gap-2';

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

  const onSubmit = async (e) => {
    e.preventDefault();
    /** @type {Record<string, string>} */
    const err = {};
    if (!name.trim()) {
      err.name = t('admin.partnerNameRequired');
    }
    if (!description.trim()) {
      err.description = t('admin.descriptionRequired');
    }
    const normalizedHandle = normalizePartnerHandleInput(handleInput);
    const handleForApi = normalizedHandle.length >= 2 ? normalizedHandle : derivePartnerHandle(name);
    if (normalizedHandle.length > 0 && normalizedHandle.length < 2) {
      err.handle = t('admin.handleMinTwoChars');
    }
    const ccUpper = countryCode.trim().toUpperCase();
    if (ccUpper.length !== 2) {
      err.countryCode = t('admin.selectPrimaryCountry');
    }
    const adminPickerError = adminUsersPickerRef.current?.validate?.() ?? null;
    if (adminPickerError) {
      err.adminUsers = adminPickerError;
    }
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      /** @type {Record<string, unknown>} */
      const body = {
        name: name.trim(),
        handle: handleForApi,
        category: category.trim() || 'General',
        description: description.trim(),
        industry: industry.trim() || undefined,
        location: location.trim() || undefined,
        tier,
        countryCode: ccUpper,
      };
      const logoId = String(logoMediaFileId ?? '').trim();
      const coverId = String(coverMediaFileId ?? '').trim();
      if (logoId && isGuidString(logoId)) {
        body.logoMediaFileId = logoId;
      }
      if (coverId && isGuidString(coverId)) {
        body.coverMediaFileId = coverId;
      }
      body.firstAdministratorUserIds = adminUsers.map((u) => u.userId).filter(Boolean);
      await adminCreatePartner(body);
      toast.success(t('toasts.partnerCreated'));
      navigate('/admin/partners', { replace: true, state: { partnerListRefreshAt: Date.now() } });
    } catch (apiErr) {
      toast.error(apiErr?.message || t('toasts.failedCreatePartner'));
    } finally {
      setSubmitting(false);
    }
  };

  const logoUrl = logoPreviewUrl;
  const coverUrl = coverPreviewUrl;
  const nameTrim = name.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
          <Link to="/admin/partners">
            <ArrowLeft className="w-4 h-4" />
            <LangText path="admin.back_to_partner_management"  />
          </Link>
        </Button>
        <h1 className="partner-admin-heading">
          <LangText path="adminPartners.addPartner"  />
        </h1>
        <p className="text-muted-foreground mt-1">
          <LangText path="admin.add_a_new_partner_organization"  />
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-6 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <Label htmlFor="ap-name">
              <LangText path="admin.partner_name"  /> <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ap-name"
              className={cn('h-11 rounded-lg', fieldErrors.name && 'border-destructive')}
              placeholder={t('admin.partnerNamePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError('name');
              }}
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'ap-name-err' : undefined}
            />
            <FieldError id="ap-name-err" message={fieldErrors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-handle">
              <LangText path="admin.partner_short_name"  />
            </Label>
            <Input
              id="ap-handle"
              className={cn('h-11 rounded-lg', fieldErrors.handle && 'border-destructive')}
              placeholder={t('admin.partnerShortNamePlaceholder')}
              value={handleInput}
              onChange={(e) => {
                setHandleInput(e.target.value);
                clearFieldError('handle');
              }}
              aria-invalid={Boolean(fieldErrors.handle)}
              aria-describedby={fieldErrors.handle ? 'ap-handle-err' : undefined}
            />
            <FieldError id="ap-handle-err" message={fieldErrors.handle} />
          </div>
        </div>

        <PartnerAdminUsersPicker
          ref={adminUsersPickerRef}
          id={adminPickerId}
          value={adminUsers}
          required
          partnerCountryCode={countryCode}
          error={fieldErrors.adminUsers}
          onChange={(users) => {
            setAdminUsers(users);
            clearFieldError('adminUsers');
          }}
          onSearchQueryChange={() => clearFieldError('adminUsers')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <PartnerCategorySelect id="ap-cat" value={category} onChange={setCategory} />
          <div className="space-y-2">
            <Label htmlFor="ap-ind">
              <LangText path="admin.industry_optional"  />
            </Label>
            <Input id="ap-ind" className="h-11 rounded-lg" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ap-desc">
            <LangText path="admin.description"  /> <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="ap-desc"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearFieldError('description');
            }}
            rows={5}
            placeholder={t('admin.partnerDescriptionPlaceholder')}
            className={cn('rounded-lg min-h-[120px]', fieldErrors.description && 'border-destructive')}
            required
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? 'ap-desc-err' : undefined}
          />
          <FieldError id="ap-desc-err" message={fieldErrors.description} />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:gap-x-8">
          <div className="flex min-w-0 flex-col gap-3">
            <Label className="text-sm font-medium leading-none">
              <LangText path="admin.logo"  />
            </Label>
            <input
              ref={logoFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={t('admin.upload_logo_image')}
              onChange={(ev) => void onLogoFileChange(ev)}
            />
            <div className="flex min-h-[7.5rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 p-4">
              {logoUrl ? (
                <Avatar className="h-16 w-16 shrink-0 rounded-xl border border-border">
                  <AvatarImage src={logoUrl || undefined} alt="" />
                  <AvatarFallback className="rounded-xl bg-muted/60">
                    {nameTrim ? (
                      <span className="text-sm font-medium">{getInitials(nameTrim)}</span>
                    ) : (
                      <ImageIcon className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    )}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.25} aria-hidden />
              )}
              <Button
                type="button"
                variant="outline"
                className={cn('h-11', outlineBtnClass)}
                disabled={uploadingLogo}
                onClick={() => logoFileRef.current?.click()}
              >
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {logoUrl ? (
                  <LangText path="admin.change_logo"  />
                ) : (
                  <LangText path="admin.upload_logo"  />
                )}
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <Label className="text-sm font-medium leading-none">
              <LangText path="admin.cover_image"  />
            </Label>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={t('admin.upload_cover_image')}
              onChange={(ev) => void onCoverFileChange(ev)}
            />
            <div className="flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 p-4">
              {coverUrl ? (
                <div className="w-full overflow-hidden rounded-lg border border-border">
                  <img src={coverUrl} alt="" className="h-24 w-full object-cover" />
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className={cn('h-11 w-full max-w-xs border-dashed', outlineBtnClass)}
                disabled={uploadingCover}
                onClick={() => coverFileRef.current?.click()}
              >
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {coverUrl ? (
                  <LangText path="admin.change_cover"  />
                ) : (
                  <LangText path="admin.upload_cover"  />
                )}
              </Button>
            </div>
          </div>
        </div>

        <PartnerLocationField id={partnerOfficeLocationId} value={location} onChange={setLocation} />

        <PartnerPrimaryCountryField
          id="ap-country-code"
          value={countryCode}
          onChange={(code) => {
            const prev = countryCode;
            setCountryCode(code);
            clearFieldError('countryCode');
            if (prev && code && prev !== code && adminUsers.length > 0) {
              setAdminUsers([]);
              toast.message(t('admin.administratorsClearedCountryChange'));
            }
          }}
          language={language === 'DE' ? 'DE' : 'EN'}
          error={fieldErrors.countryCode}
        />

        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 scroll-mt-4">
          <button
            type="button"
            role="switch"
            aria-checked={tier === 'Premium'}
            onClick={() => setTier((x) => (x === 'Premium' ? 'Standard' : 'Premium'))}
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

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" className={primaryBtnClass} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <LangText path="adminPartners.addPartner"  />
          </Button>
          <Button type="button" variant="outline" className={outlineBtnClass} asChild>
            <Link to="/admin/partners">
              <X className="w-4 h-4" />
              <LangText path="common.cancel"  />
            </Link>
          </Button>
        </div>
      </form>

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

export default AdminPartnerCreate;
