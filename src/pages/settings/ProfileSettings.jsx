import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { store } from '@/store/store.js';
import { setUser, fetchUserProfile } from '@/store/slices/userSlice';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Camera, Upload, Loader2, ChevronDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE, DEFAULT_AVATAR } from '@/lib/config';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams } from '@/i18n';
import { LangText } from '@/components/ui/LangText';
import { normalizeCountryCode, getHomeCountryCode, setHomeCountryCode } from '@/lib/activeCountry.js';
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox.jsx';
import { putUserHomeCountry } from '@/services/profileService.js';
import { apiRequest, apiGet, apiPost } from '@/services';
import { ImageCropper } from '@/components/ImageCropper';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { validateCoverImage, validateAvatarImage, IMAGE_CONSTRAINTS } from '@/utils/imageValidation';
import { prepareMediaFileForUpload, DEFAULT_HARD_MAX_INPUT_BYTES } from '@/lib/mediaOptimize.js';
import { croppedBlobToImageFile } from '@/lib/imageCropPresets';
import { buildCoverCropMetadata, getImageDisplayMetadataFromFile } from '@/lib/imageCropMetadata';
import { COVER_BANNER_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { FramedImage } from '@/components/media/FramedImage';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { jobTitleLabel, jobTitleMatchesQuery } from '@/lib/displayLabels';
const MediaType = {
  Avatar: 0,
  Banner: 1,
  PostMedia: 2,
};

const emptyForm = {
  name: '',
  handle: '',
  bio: '',
  company: '',
  role: '',
  designationId: null,
  customRole: '',
  location: '',
  contactEmail: '',
  linkedInProfileUrl: '',
  description: '',
  website: '',
  avatarUrl: '',
  coverImageUrl: '',
};

/** @param {Record<string, unknown> | null | undefined} data */
const mapApiToForm = (data) => {
  const root = data && typeof data === 'object' ? data : {};
  const desigRaw = root.designationId ?? root.DesignationId;
  let designationId = null;
  if (desigRaw !== null && desigRaw !== undefined && desigRaw !== '') {
    const n = Number(desigRaw);
    designationId = Number.isFinite(n) ? n : null;
  }
  return {
    name: String(root.displayName ?? root.DisplayName ?? ''),
    handle: String(root.handle ?? root.Handle ?? ''),
    bio: String(root.bio ?? root.Bio ?? ''),
    company: String(root.company ?? root.Company ?? ''),
    role: String(root.role ?? root.Role ?? ''),
    designationId,
    customRole: String(root.customRole ?? root.CustomRole ?? ''),
    location: String(root.location ?? root.Location ?? ''),
    contactEmail: String(root.contactEmail ?? root.ContactEmail ?? ''),
    linkedInProfileUrl: String(root.linkedInProfileUrl ?? root.LinkedInProfileUrl ?? ''),
    description: String(root.description ?? root.Description ?? ''),
    website: String(root.website ?? root.Website ?? ''),
    avatarUrl: String(root.avatarUrl ?? root.AvatarUrl ?? ''),
    coverImageUrl: String(root.coverImageUrl ?? root.CoverImageUrl ?? ''),
  };
};

/** @param {unknown} row */
function normalizeDesignationRow(row) {
  const o = row && typeof row === 'object' ? /** @type {Record<string, unknown>} */ (row) : {};
  const rawId = o.id ?? o.Id;
  const name = String(o.name ?? o.Name ?? '').trim();
  let id = rawId;
  if (rawId !== null && rawId !== undefined && rawId !== '') {
    const n = Number(rawId);
    if (Number.isFinite(n)) {
      id = n;
    }
  }
  return { id, name };
}

/** @param {Array<{ id?: unknown, Id?: unknown, name?: string, Name?: string }>} list @param {unknown} id */
function designationById(list, id) {
  if (id === null || id === undefined) {
    return undefined;
  }
  const want = String(id);
  return list.find((x) => String(x.id ?? x.Id) === want);
}


/** Merges API user response into current auth user for setUser. Preserves userId to avoid corrupting session. */
function mergeUserWithUpdated(currentUser, updated, userId) {
  return {
    ...currentUser,
    userId: userId ?? currentUser?.userId,
    avatarUrl: updated.avatarUrl || DEFAULT_AVATAR,
    coverImageUrl: 'coverImageUrl' in updated ? updated.coverImageUrl : currentUser.coverImageUrl,
    displayName: 'displayName' in updated ? updated.displayName : currentUser.displayName,
    handle: 'handle' in updated ? updated.handle : currentUser.handle,
    bio: 'bio' in updated ? updated.bio : currentUser.bio,
    company: updated.company ?? updated.Company ?? currentUser.company,
    role: updated.role ?? updated.Role ?? currentUser.role,
    location: 'location' in updated ? updated.location : currentUser.location,
    contactEmail: 'contactEmail' in updated ? updated.contactEmail : currentUser.contactEmail,
    description: 'description' in updated ? updated.description : currentUser.description,
    linkedInProfileUrl: 'linkedInProfileUrl' in updated ? updated.linkedInProfileUrl : currentUser.linkedInProfileUrl,
  };
}

const ProfileSettings = () => {
  const { language } = useLanguage();
  const t = useT();
  const tr = useTParams();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.userId ?? state.user.user?.userId);
  const currentUser = useAppSelector((state) => state.user.user);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(DEFAULT_AVATAR);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const lastLoadedRef = useRef(null);
  const designationFieldDirtyRef = useRef(false);

  // File input refs
  const avatarFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  // Pending file uploads (stored until form submit)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperType, setCropperType] = useState(null); // 'avatar' or 'cover'

  // Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [homeCountryInput, setHomeCountryInput] = useState('');
  const [isHomeCountryLocked, setIsHomeCountryLocked] = useState(false);
  const initialHomeCountryRef = useRef('');

  // Designations (job titles) for dropdown
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(true);
  /** Current text in the title/designation field (search + free text). */
  const [designationInput, setDesignationInput] = useState('');
  /** When user picks a row from suggestions, we store its id until they edit the text. */
  const [designationPickedId, setDesignationPickedId] = useState(null);
  const [designationSuggestionsOpen, setDesignationSuggestionsOpen] = useState(false);
  const [addingDesignation, setAddingDesignation] = useState(false);

  // Fetch designations from API on mount
  useEffect(() => {
    setDesignationsLoading(true);
    apiGet(`${API_BASE}/api/designations`, { showLoader: false })
      .then((res) => {
        if (!res.ok) {throw new Error('Failed to load designations');}
        return res.json();
      })
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        setDesignations(raw.map((r) => normalizeDesignationRow(r)));
      })
      .catch((err) => {
        console.error('Error fetching designations:', err);
      })
      .finally(() => {
        setDesignationsLoading(false);
      });
  }, []);

  // Cleanup avatar preview URL when it changes or on unmount (separate effect to avoid revoking cover URL)
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // Cleanup cover preview URL when it changes or on unmount (separate effect to avoid revoking avatar URL)
  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    if (currentUser?.isHomeCountryLocked || currentUser?.homeCountryCode) {
      setIsHomeCountryLocked(Boolean(currentUser.isHomeCountryLocked ?? currentUser.homeCountryCode));
    }
  }, [currentUser?.isHomeCountryLocked, currentUser?.homeCountryCode]);

  // Fetch user profile data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiRequest(
      `${API_BASE}/api/Users/${encodeURIComponent(userId)}`,
      { method: 'GET' },
      false,
      false,
    )
      .then((res) => {
        if (res.status === 404) {
          lastLoadedRef.current = null;
          designationFieldDirtyRef.current = false;
          // Pre-fill from auth user so signup name/username show (Identity stores signup username as displayName)
          setFormData({
            ...emptyForm,
            name: currentUser?.displayName ?? '',
            handle: currentUser?.handle ?? currentUser?.displayName ?? '',
          });
          setProfileAvatar(DEFAULT_AVATAR);
          setCoverImageUrl('');
          const hcInit = String(getHomeCountryCode() ?? currentUser?.homeCountryCode ?? '').trim();
          setHomeCountryInput(hcInit);
          initialHomeCountryRef.current = hcInit;
          return null;
        }
        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          const mapped = mapApiToForm(data);
          lastLoadedRef.current = mapped;
          designationFieldDirtyRef.current = false;
          setFormData((_prev) => ({ ...emptyForm, ...mapped }));
          setProfileAvatar(data.avatarUrl || DEFAULT_AVATAR);
          setCoverImageUrl(data.coverImageUrl || '');
          const hc = data.homeCountryCode ?? data.HomeCountryCode ?? null;
          const hcStr = String(hc ?? getHomeCountryCode() ?? '').trim();
          setHomeCountryInput(hcStr);
          initialHomeCountryRef.current = hcStr;
          setIsHomeCountryLocked(Boolean(data.isHomeCountryLocked ?? data.IsHomeCountryLocked ?? hc));
          dispatch(setUser(mergeUserWithUpdated(currentUser ?? { loggedIn: true, userId }, data, userId)));
          // Set role selection based on loaded data
          const loadedRole = data.role ?? '';
          if (loadedRole) {
            setFormData(prev => ({ ...prev, role: loadedRole }));
          }
        }
      })
      .catch(() => toast.error(t('settings.failed_to_load_profile')))
      .finally(() => setLoading(false));
    // Omit full currentUser so unrelated Redux user updates do not reload the profile form.
  }, [userId, language, currentUser?.displayName, currentUser?.handle, currentUser?.homeCountryCode, dispatch, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize designation field from API (designationId + customRole, or legacy role string)
  useEffect(() => {
    if (designations.length === 0 || designationFieldDirtyRef.current) {return;}
    if (formData.designationId !== null && formData.designationId !== undefined) {
      const d = designationById(designations, formData.designationId);
      if (d) {
        if (d.name === 'Other') {
          setDesignationInput(formData.customRole || formData.role || '');
          setDesignationPickedId(d.id);
        } else {
          setDesignationInput(jobTitleLabel(d.name, language));
          setDesignationPickedId(d.id);
        }
        return;
      }
      // Saved designation id is not in the client list (id shape mismatch, or list stale): still show label from API.
      const fallbackLabel = (formData.customRole || '').trim() || (formData.role || '').trim();
      if (fallbackLabel) {
        setDesignationInput(jobTitleLabel(fallbackLabel, language) || fallbackLabel);
        setDesignationPickedId(formData.designationId);
        return;
      }
    }
    if (formData.role) {
      const matching = designations.find((r) => r.name === formData.role);
      if (matching) {
        if (matching.name === 'Other') {
          setDesignationInput(formData.customRole || formData.role || '');
          setDesignationPickedId(matching.id);
        } else {
          setDesignationInput(jobTitleLabel(matching.name, language));
          setDesignationPickedId(matching.id);
        }
      } else {
        setDesignationInput(jobTitleLabel(formData.role, language) || formData.role);
        setDesignationPickedId(null);
      }
    } else {
      setDesignationInput('');
      setDesignationPickedId(null);
    }
  }, [designations, formData.designationId, formData.role, formData.customRole, language]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  /** Maps combobox text + optional pick to API designation fields. */
  const buildDesignationPayload = () => {
    const trimmed = designationInput.trim();
    if (!trimmed) {
      // Empty string marks an explicit clear; null would skip designation update on the API.
      return { designationId: null, customRole: '' };
    }

    const otherRow = designations.find((d) => d.name === 'Other');

    const picked = designationPickedId !== null && designationPickedId !== undefined
      ? designationById(designations, designationPickedId)
      : null;

    // Explicit pick id from combobox / "add to catalog" — use it even if the row is not in `designations`
    // yet (React batching) or names differ only by casing from the API.
    if (!picked && designationPickedId !== null && designationPickedId !== undefined) {
      const idNum = Number(designationPickedId);
      if (Number.isFinite(idNum)) {
        const isOtherPick = otherRow && String(otherRow.id) === String(designationPickedId);
        return isOtherPick
          ? { designationId: idNum, customRole: trimmed }
          : { designationId: idNum, customRole: null };
      }
    }

    if (picked) {
      if (picked.name === 'Other') {
        return { designationId: picked.id, customRole: trimmed };
      }
      if (picked.name.trim().toLowerCase() === trimmed.toLowerCase()) {
        return { designationId: picked.id, customRole: null };
      }
    }

    const exact = designations.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exact) {
      if (exact.name === 'Other') {
        return { designationId: exact.id, customRole: trimmed };
      }
      return { designationId: exact.id, customRole: null };
    }

    // Free-text title not in the list: same as choosing "Other" (keeps FK + customRole consistent).
    if (otherRow) {
      return { designationId: otherRow.id, customRole: trimmed };
    }
    return { designationId: null, customRole: trimmed };
  };

  const mergeDesignationIntoList = (item) => {
    const row = normalizeDesignationRow(item);
    setDesignations((prev) => {
      if (prev.some((d) => String(d.id) === String(row.id))) {
        return prev;
      }
      const next = [...prev, row];
      next.sort((a, b) => {
        const ao = a.name === 'Other' ? 1 : 0;
        const bo = b.name === 'Other' ? 1 : 0;
        if (ao !== bo) {
          return ao - bo;
        }
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
      });
      return next;
    });
  };

  /** Persists a new title to the catalog (or returns existing by name) and selects it for the profile. */
  const addNewDesignationToCatalog = async (rawName) => {
    const trimmed = (rawName || '').trim();
    if (!trimmed || addingDesignation) {
      return;
    }
    setAddingDesignation(true);
    try {
      const res = await apiPost(`${API_BASE}/api/designations`, { name: trimmed }, { showLoader: false });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg = data.message || data.Message || t('settings.could_not_add_this_title');
        toast.error(msg);
        return;
      }
      const id = data.id ?? data.Id;
      const nm = data.name ?? data.Name ?? trimmed;
      if (id === null || id === undefined) {
        toast.error(t('settings.invalid_response_from_server'));
        return;
      }
      const idNum = typeof id === 'number' ? id : Number(id);
      const stableId = Number.isFinite(idNum) ? idNum : id;
      // Apply pick + list updates synchronously so "Save changes" immediately after uses the right designation id.
      flushSync(() => {
        mergeDesignationIntoList({ id, name: nm });
        setDesignationInput(nm);
        setDesignationPickedId(stableId);
        setFormData((prev) => ({
          ...prev,
          designationId: stableId,
          role: nm,
          customRole: '',
        }));
        designationFieldDirtyRef.current = true;
      });
      setDesignationSuggestionsOpen(false);
      toast.success(t('settings.title_added_and_selected'));
    } catch (e) {
      console.error(e);
      toast.error(t('settings.could_not_add_this_title'));
    } finally {
      setAddingDesignation(false);
    }
  };

  const handleSave = async () => {
    const otherDesignation = designations.find((d) => d.name === 'Other');
    if (
      otherDesignation !== null && otherDesignation !== undefined
      && designationPickedId === otherDesignation.id
      && !designationInput.trim()
    ) {
      toast.error(t('settings.please_enter_your_custom_designation'));
      return;
    }

    const homeVc = validateHomeCountryInput();
    if (!homeVc.ok) {
      return;
    }
    const homeCountryNormalized = homeVc.normalized;
    const skipHomeCountrySave = homeVc.skipSave === true;

    const isCreate = lastLoadedRef.current === null;
    if (isCreate) {
      const handle = (formData.handle || '').trim();
      if (handle.length < 3 || handle.length > 30) {
        toast.error(t('settings.handle_must_be_between_3_and_30_characters'));
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
        toast.error(t('settings.handle_can_only_contain_letters_numbers_underscores_and_hyph'));
        return;
      }
    }

    setSaving(true);

    if (isCreate) {
      try {
        const des = buildDesignationPayload();
        const createBody = {
          handle: (formData.handle || '').trim(),
          contactEmail: formData.contactEmail || null,
          bio: formData.bio || null,
          company: formData.company || null,
          location: formData.location || null,
          designationId: des.designationId,
          customRole: des.customRole,
        };
        const res = await apiPost(`${API_BASE}/api/Users`, createBody);
        if (res.status === 401) {
          throw new Error('Sign in required to create profile. Your session may have expired — try signing in again.');
        }
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || err.message || err.title || 'Create failed');
        }
        const created = await res.json();
        if (!created) {
          setSaving(false);
          return;
        }

        const mapped = mapApiToForm(created);
        lastLoadedRef.current = mapped;
        designationFieldDirtyRef.current = false;
        setFormData(mapped);
        setProfileAvatar(created.avatarUrl || DEFAULT_AVATAR);
        setCoverImageUrl(created.coverImageUrl || '');
        if (userId) {
          await dispatch(fetchUserProfile(userId));
        }

        // Upload pending avatar/cover from create flow so they are not discarded
        let avatarUrl = created.avatarUrl?.trim() || null;
        let coverImageUrlToSave = created.coverImageUrl?.trim() || null;

        if (pendingAvatarFile) {
          setUploadingAvatar(true);
          try {
            avatarUrl = await uploadImageToS3(pendingAvatarFile, MediaType.Avatar);
          } catch (error) {
            toast.error(tr('toasts.failedUploadAvatar', { message: error.message }));
            throw error;
          } finally {
            setUploadingAvatar(false);
          }
        }

        if (pendingCoverFile) {
          setUploadingCover(true);
          try {
            coverImageUrlToSave = await uploadImageToS3(pendingCoverFile, MediaType.Banner);
          } catch (error) {
            toast.error(tr('toasts.failedUploadCover', { message: error.message }));
            throw error;
          } finally {
            setUploadingCover(false);
          }
        }

        // If we uploaded any images, update the new profile with their URLs
        if (avatarUrl !== (created.avatarUrl?.trim() || null) || coverImageUrlToSave !== (created.coverImageUrl?.trim() || null)) {
          const desPut = buildDesignationPayload();
          const body = {
            handle: mapped.handle || undefined,
            bio: mapped.bio || undefined,
            designationId: desPut.designationId,
            customRole: desPut.customRole,
            company: mapped.company || undefined,
            location: mapped.location || undefined,
            displayName: mapped.name || undefined,
            contactEmail: mapped.contactEmail || undefined,
            linkedInProfileUrl: mapped.linkedInProfileUrl || undefined,
            description: mapped.description || undefined,
            website: mapped.website?.trim() || null,
            avatarUrl,
            coverImageUrl: coverImageUrlToSave,
          };
          const headers = { 'Content-Type': 'application/json' };
          if (import.meta.env.DEV && userId) {
            headers['X-Test-User-Id'] = userId;
          }
          const putRes = await apiRequest(
            `${API_BASE}/api/Users`,
            { method: 'PUT', headers, body: JSON.stringify(body) },
            false,
            false,
          );
          if (putRes.status === 401) {
            throw new Error('Sign in required to update profile. Your session may have expired — try signing in again.');
          }
          if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.detail || err.message || 'Update failed');
          }
          const updated = await putRes.json();
          if (updated) {
            const updatedMapped = mapApiToForm(updated);
            lastLoadedRef.current = updatedMapped;
            designationFieldDirtyRef.current = false;
            setFormData(updatedMapped);
            setProfileAvatar(updated.avatarUrl || DEFAULT_AVATAR);
            setCoverImageUrl(updated.coverImageUrl || '');
            if (currentUser) {
              dispatch(setUser(mergeUserWithUpdated(currentUser, updated, userId)));
            }
          }
        }

        setPendingAvatarFile(null);
        setPendingCoverFile(null);
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
          setAvatarPreviewUrl(null);
        }
        if (coverPreviewUrl) {
          URL.revokeObjectURL(coverPreviewUrl);
          setCoverPreviewUrl(null);
        }
        if (userId) {dispatch(fetchUserProfile(userId));}

        const homeCountrySaved = await applyHomeCountryAfterProfileSave(homeCountryNormalized, skipHomeCountrySave);
        if (homeCountrySaved) {
          toast.success(t('settings.profile_created_successfully_you_can_edit_it_here_anytime'));
        }
      } catch (err) {
        toast.error(err.message || (t('settings.failed_to_create_profile')));
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      let avatarUrl = formData.avatarUrl?.trim() || null;
      let coverImageUrlToSave = formData.coverImageUrl?.trim() || null;

      if (pendingAvatarFile) {
        setUploadingAvatar(true);
        try {
          avatarUrl = await uploadImageToS3(pendingAvatarFile, MediaType.Avatar);
        } catch (error) {
          toast.error(tr('toasts.failedUploadAvatar', { message: error.message }));
          throw error;
        } finally {
          setUploadingAvatar(false);
        }
      }

      if (pendingCoverFile) {
        setUploadingCover(true);
        try {
          coverImageUrlToSave = await uploadImageToS3(pendingCoverFile, MediaType.Banner);
        } catch (error) {
          toast.error(tr('toasts.failedUploadCover', { message: error.message }));
          throw error;
        } finally {
          setUploadingCover(false);
        }
      }

      const des = buildDesignationPayload();
      const body = {
        handle: formData.handle || undefined,
        bio: formData.bio || undefined,
        designationId: des.designationId,
        customRole: des.customRole,
        company: formData.company || undefined,
        location: formData.location || undefined,
        displayName: formData.name || undefined,
        contactEmail: formData.contactEmail || undefined,
        linkedInProfileUrl: formData.linkedInProfileUrl || undefined,
        description: formData.description || undefined,
        website: formData.website?.trim() || null,
        avatarUrl,
        coverImageUrl: coverImageUrlToSave,
      };

      const headers = { 'Content-Type': 'application/json' };
      if (import.meta.env.DEV && userId) {
        headers['X-Test-User-Id'] = userId;
      }

      const res = await apiRequest(
        `${API_BASE}/api/Users`,
        { method: 'PUT', headers, body: JSON.stringify(body) },
        false,
        false,
      );

      if (res.status === 401) {
        throw new Error('Sign in required to update profile. Your session may have expired — try signing in again.');
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Update failed');
      }

      const updated = await res.json();
      if (updated) {
        const mapped = mapApiToForm(updated);
        lastLoadedRef.current = mapped;
        designationFieldDirtyRef.current = false;
        setFormData(mapped);
        setProfileAvatar(updated.avatarUrl || DEFAULT_AVATAR);
        setCoverImageUrl(updated.coverImageUrl || '');

        if (currentUser) {
          dispatch(setUser(mergeUserWithUpdated(currentUser, updated, userId)));
        }

        setPendingAvatarFile(null);
        setPendingCoverFile(null);
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
          setAvatarPreviewUrl(null);
        }
        if (coverPreviewUrl) {
          URL.revokeObjectURL(coverPreviewUrl);
          setCoverPreviewUrl(null);
        }

        const homeCountrySaved = await applyHomeCountryAfterProfileSave(homeCountryNormalized, skipHomeCountrySave);
        if (homeCountrySaved) {
          toast.success(t('settings.profile_updated_successfully'));
        }
      }
    } catch (err) {
      toast.error(err.message || (t('settings.failed_to_update_profile')));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (lastLoadedRef.current) {
      designationFieldDirtyRef.current = false;
      const restored = lastLoadedRef.current;
      setFormData((prev) => ({ ...prev, ...restored }));
      setProfileAvatar(restored.avatarUrl || DEFAULT_AVATAR);
      setCoverImageUrl(restored.coverImageUrl || '');
      
      // Clear pending files and preview URLs
      setPendingAvatarFile(null);
      setPendingCoverFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
        setCoverPreviewUrl(null);
      }
      
      // Restore designation combobox from restored form (same rules as init effect)
      if (designations.length === 0) {
        setDesignationInput('');
        setDesignationPickedId(null);
      } else if (restored.designationId !== null && restored.designationId !== undefined) {
        const d = designationById(designations, restored.designationId);
        if (d) {
          if (d.name === 'Other') {
            setDesignationInput(restored.customRole || restored.role || '');
            setDesignationPickedId(d.id);
          } else {
            setDesignationInput(d.name);
            setDesignationPickedId(d.id);
          }
        } else {
          const fb = (restored.customRole || '').trim() || (restored.role || '').trim();
          if (fb) {
            setDesignationInput(fb);
            setDesignationPickedId(restored.designationId);
          } else {
            setDesignationInput(restored.role || '');
            setDesignationPickedId(null);
          }
        }
      } else if (restored.role) {
        const matchingRole = designations.find((r) => r.name === restored.role);
        if (matchingRole) {
          if (matchingRole.name === 'Other') {
            setDesignationInput(restored.customRole || restored.role || '');
            setDesignationPickedId(matchingRole.id);
          } else {
            setDesignationInput(matchingRole.name);
            setDesignationPickedId(matchingRole.id);
          }
        } else {
          setDesignationInput(restored.role);
          setDesignationPickedId(null);
        }
      } else {
        setDesignationInput('');
        setDesignationPickedId(null);
      }
      setDesignationSuggestionsOpen(false);
    }
    setHomeCountryInput(initialHomeCountryRef.current);
  };

  // Image upload function (returns public URL without updating profile)
  const uploadImageToS3 = async (file, mediaType) => {
    try {
      // 1. Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > DEFAULT_HARD_MAX_INPUT_BYTES) {
        throw new Error(
          tr('settings.image_too_large', { n: DEFAULT_HARD_MAX_INPUT_BYTES / (1024 * 1024) }),
        );
      }

      const prepared = await prepareMediaFileForUpload(file, {
        maxOutputBytes: IMAGE_CONSTRAINTS.MAX_FILE_SIZE,
      });

      // 2. Request presigned upload URL
      const presignedHeaders = { 'Content-Type': 'application/json' };
      if (import.meta.env.DEV && userId) {
        presignedHeaders['X-Test-User-Id'] = userId;
      }

      const presignedResponse = await apiRequest(
        `${API_BASE}/api/Media/presigned-url/upload`,
        {
          method: 'POST',
          headers: presignedHeaders,
          body: JSON.stringify({
            mediaType,
            contentType: prepared.type || 'image/jpeg',
          }),
        },
        false,
        false,
      );

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const presignedData = await presignedResponse.json();
      const presignedUploadUrl = presignedData?.presignedUploadUrl;
      const objectKey = presignedData?.objectKey;
      if (typeof presignedUploadUrl !== 'string' || !presignedUploadUrl.trim()) {
        throw new Error('Invalid presigned URL response: missing or invalid presignedUploadUrl');
      }
      if (typeof objectKey !== 'string' || !objectKey.trim()) {
        throw new Error('Invalid presigned URL response: missing or invalid objectKey');
      }

      // 3. Upload file directly to S3
      const uploadResponse = await fetch(presignedUploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': prepared.type || 'image/jpeg',
        },
        body: prepared,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('S3 upload failed:', errorText);
        throw new Error(`Failed to upload file to storage: ${uploadResponse.status} ${errorText}`);
      }

      // 4. Complete upload and get public URL
      const completeHeaders = { 'Content-Type': 'application/json' };
      if (import.meta.env.DEV && userId) {
        completeHeaders['X-Test-User-Id'] = userId;
      }

      const completeResponse = await apiRequest(
        `${API_BASE}/api/Media/complete-upload`,
        {
          method: 'POST',
          headers: completeHeaders,
          body: JSON.stringify({
            objectKey,
            contentType: prepared.type || 'image/jpeg',
            fileSize: prepared.size,
            imageDisplay: getImageDisplayMetadataFromFile(file) ?? undefined,
          }),
        },
        false,
        false,
      );

      if (!completeResponse.ok) {
        throw new Error('Failed to finalize upload');
      }

      const completeData = await completeResponse.json();
      const publicUrl = completeData?.publicUrl;
      if (typeof publicUrl !== 'string' || !publicUrl.trim()) {
        throw new Error('Invalid complete-upload response: missing or invalid publicUrl');
      }

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleAvatarUpload = () => {
    avatarFileInputRef.current?.click();
  };

  const handleCoverUpload = () => {
    coverFileInputRef.current?.click();
  };

  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = await validateAvatarImage(file);
      if (!validation.valid) {
        toast.error(validation.error);
        if (avatarFileInputRef.current) {
          avatarFileInputRef.current.value = '';
        }
        return;
      }
      if (validation.warning) {
        toast.warning(validation.warning);
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result);
        setCropperType('avatar');
        setCropperOpen(true);
      };
      reader.onerror = () => {
        console.error('Avatar file read error:', reader.error);
        toast.error(t('settings.could_not_read_the_image_file_try_another_file_or_format'));
        if (avatarFileInputRef.current) {
          avatarFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = '';
    }
  };

  const onCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = await validateCoverImage(file);
      if (!validation.valid) {
        toast.error(validation.error);
        if (coverFileInputRef.current) {
          coverFileInputRef.current.value = '';
        }
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
        console.error('Cover file read error:', reader.error);
        toast.error(t('settings.could_not_read_the_image_file_try_another_file_or_format'));
        if (coverFileInputRef.current) {
          coverFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedBlob, cropMeta) => {
    const isAvatar = cropperType === 'avatar';
    const aspectRatio = isAvatar ? 1 : COVER_BANNER_ASPECT_RATIO;
    const displayMeta = buildCoverCropMetadata(cropMeta?.aspectRatio ?? aspectRatio);
    const file = croppedBlobToImageFile(
      croppedBlob,
      isAvatar ? 'avatar.jpg' : 'cover.jpg',
      isAvatar ? 'avatar' : 'cover',
      displayMeta,
    );

    if (isAvatar) {
      setPendingAvatarFile(file);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);
      setProfileAvatar(previewUrl);
      setFormData((prev) => ({ ...prev, avatarUrl: previewUrl }));
    } else {
      setPendingCoverFile(file);
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setCoverPreviewUrl(previewUrl);
      setCoverImageUrl(previewUrl);
      setFormData((prev) => ({ ...prev, coverImageUrl: previewUrl }));
    }
  };

  /** @returns {{ ok: false } | { ok: true, normalized: string | null }} */
  const validateHomeCountryInput = () => {
    const raw = homeCountryInput.trim();
    const normalized = raw === '' ? null : normalizeCountryCode(raw);
    if (isHomeCountryLocked) {
      const initial = initialHomeCountryRef.current.trim();
      const initialNormalized = initial === '' ? null : normalizeCountryCode(initial);
      if (normalized !== initialNormalized) {
        toast.error(t('settings.home_country_locked'));
        return { ok: false };
      }
      return { ok: true, normalized: initialNormalized, skipSave: true };
    }
    if (raw !== '' && !normalized) {
      toast.error(t('settings.please_choose_a_valid_country'));
      return { ok: false };
    }
    if (raw === '') {
      toast.error(t('settings.country_is_required'));
      return { ok: false };
    }
    return { ok: true, normalized, skipSave: false };
  };

  const applyHomeCountryAfterProfileSave = async (normalized, skipSave = false) => {
    if (skipSave) {
      return true;
    }
    const initial = initialHomeCountryRef.current.trim();
    const initialNormalized = initial === '' ? null : normalizeCountryCode(initial);
    if (normalized === initialNormalized && isHomeCountryLocked) {
      return true;
    }
    try {
      await putUserHomeCountry(normalized);
      setHomeCountryCode(normalized);
      initialHomeCountryRef.current = normalized ?? '';
      setHomeCountryInput(normalized ?? '');
      setIsHomeCountryLocked(normalized !== null && normalized !== undefined);
      const prev = store.getState().user.user;
      if (prev) {
        dispatch(setUser({ ...prev, homeCountryCode: normalized, isHomeCountryLocked: normalized !== null && normalized !== undefined }));
      }
      return true;
    } catch (e) {
      const locked = e?.code === 'HOME_COUNTRY_LOCKED';
      if (locked) {
        setIsHomeCountryLocked(true);
      }
      setHomeCountryInput(initialHomeCountryRef.current);
      toast.error(e?.message || t('settings.home_country_update_failed'));
      return false;
    }
  };

  if (!userId && !loading) {
    return (
      <SettingsLayout title={t('profileSettings.title')} description={t('profileSettings.description')}>
        <p className="text-muted-foreground"><LangText path="settings.loading_your_account"  /></p>
      </SettingsLayout>
    );
  }

  if (loading && !lastLoadedRef.current) {
    return (
      <SettingsLayout title={t('profileSettings.title')} description={t('profileSettings.description')}>
        <div className="space-y-6 animate-pulse">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted rounded" />
            </div>
          </div>
          <Separator />
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title={t('profileSettings.title')}
      description={t('profileSettings.description')}
    >
      <div className="space-y-6" data-testid="edit-profile-page">
        {/* Hidden file inputs */}
        <input
          ref={avatarFileInputRef}
          type="file"
          accept="image/*"
          aria-label={t('profileSettings.uploadProfilePicture')}
          onChange={onAvatarFileChange}
          style={{ display: 'none' }}
          data-testid="edit-profile-avatar-input"
        />
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/*"
          aria-label={t('profileSettings.changeCoverImage')}
          onChange={onCoverFileChange}
          style={{ display: 'none' }}
          data-testid="edit-profile-cover-input"
        />

        {/* Cover Image */}
        <div className="space-y-2">
          <Label><LangText path="settings.cover_image"  /></Label>
          <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg overflow-hidden">
            {coverImageUrl ? (
              <FramedImage
                src={coverImageUrl}
                imageDisplay={getImageDisplayMetadataFromFile(pendingCoverFile)}
                alt="Cover"
                className="absolute inset-0 h-full w-full"
                frameClassName="absolute inset-0 h-full w-full"
                frameAspectRatio={COVER_BANNER_ASPECT_RATIO}
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 gap-2">
              {formData.coverImageUrl?.trim() ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={handleCoverUpload}
                    disabled={uploadingCover || uploadingAvatar}
                  >
                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingCover ? (t('settings.uploading')) : <LangText path="messages.change"  />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, coverImageUrl: '' }));
                      setCoverImageUrl('');
                      setPendingCoverFile(null);
                      if (coverPreviewUrl) {
                        URL.revokeObjectURL(coverPreviewUrl);
                        setCoverPreviewUrl(null);
                      }
                    }}
                    disabled={uploadingCover || uploadingAvatar}
                  >
                    <LangText path="posts.remove"  />
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={handleCoverUpload}
                  disabled={uploadingCover || uploadingAvatar}
                >
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingCover ? (t('settings.uploading')) : <LangText path="profileSettings.changeCoverImage"  />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profileAvatar} alt={formData.name} />
              <AvatarFallback>{(formData.name || 'U').slice(0, 2)}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarUpload}
              disabled={uploadingAvatar || uploadingCover}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-medium text-foreground"><LangText path="profileSettings.profilePicture"  /></p>
            <div className="flex gap-2">
              {formData.avatarUrl?.trim() ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar || uploadingCover}
                  >
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {uploadingAvatar ? (t('settings.uploading')) : <LangText path="messages.change"  />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, avatarUrl: '' }));
                      setProfileAvatar(DEFAULT_AVATAR);
                      setPendingAvatarFile(null);
                      if (avatarPreviewUrl) {
                        URL.revokeObjectURL(avatarPreviewUrl);
                        setAvatarPreviewUrl(null);
                      }
                    }}
                    disabled={uploadingAvatar || uploadingCover}
                  >
                    <LangText path="posts.remove"  />
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar || uploadingCover}
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {uploadingAvatar ? (t('settings.uploading')) : <LangText path="profileSettings.uploadProfilePicture"  />}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="grid gap-2 max-w-md">
            <Label htmlFor="home-country-settings">
              <LangText path="common.country"  />
            </Label>
            {isHomeCountryLocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full max-w-md cursor-not-allowed">
                    <CountryMarketCombobox
                      id="home-country-settings"
                      source="supported"
                      language={language === 'DE' ? 'DE' : 'EN'}
                      value={homeCountryInput}
                      onChange={() => {}}
                      disabled={loading || saving || isHomeCountryLocked}
                      allowEmpty={false}
                      showFooterHint={false}
                      inputClassName={cn('h-10', 'cursor-not-allowed opacity-80')}
                      aria-label={t('profile.home_country')}
                      aria-readonly
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <LangText path="settings.home_country_locked_tooltip" />
                </TooltipContent>
              </Tooltip>
            ) : (
              <CountryMarketCombobox
                id="home-country-settings"
                source="supported"
                language={language === 'DE' ? 'DE' : 'EN'}
                value={homeCountryInput}
                onChange={(code) => setHomeCountryInput(code)}
                disabled={loading || saving}
                allowEmpty={false}
                showFooterHint={false}
                inputClassName="h-10"
                aria-label={t('profile.home_country')}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Form Fields */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name"><LangText path="settings.display_name"  /></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('settings.your_display_name')}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="handle"><LangText path="settings.username"  /></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="handle"
                value={formData.handle}
                onChange={handleChange}
                className="pl-8"
                placeholder={t('settings.username_2')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio"><LangText path="profileSettings.shortBio"  /></Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder={t('settings.tell_people_about_yourself')}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-start">
            <div className="grid gap-2">
              <Label htmlFor="company" className="min-h-10 flex items-end leading-tight">
                <LangText path="profileSettings.companyOrganization"  />
              </Label>
              <div className="relative">
                <Input
                  id="company"
                  name="company"
                  className={cn((formData.company || '').trim() && 'pr-10')}
                  value={formData.company}
                  onChange={handleChange}
                  autoComplete="organization"
                  placeholder={t('profileSettings.companyPlaceholder')}
                  disabled={loading}
                  maxLength={100}
                />
                {(formData.company || '').trim() ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setFormData((prev) => ({ ...prev, company: '' }))}
                    disabled={loading}
                    aria-label={t('settings.clear_company')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designation-input" className="min-h-10 flex items-end leading-tight">
                <LangText path="profileSettings.titlePosition"  />
              </Label>
              {designationsLoading ? (
                <div className="flex items-center justify-center h-10 border rounded-md bg-muted/50" aria-busy="true">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-hidden />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Input
                      id="designation-input"
                      value={designationInput}
                      onChange={(e) => {
                        designationFieldDirtyRef.current = true;
                        setDesignationInput(e.target.value);
                        setDesignationPickedId(null);
                      }}
                      onFocus={() => setDesignationSuggestionsOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setDesignationSuggestionsOpen(false), 200);
                      }}
                      maxLength={100}
                      disabled={loading}
                      autoComplete="off"
                      placeholder={t('profileSettings.titlePositionPlaceholder')}
                      aria-autocomplete="list"
                      aria-expanded={designationSuggestionsOpen}
                      aria-controls="designation-suggestions"
                      className={cn('h-10', (designationInput || designationPickedId !== null) ? 'pr-16' : 'pr-9')}
                    />
                    {(designationInput || designationPickedId !== null) && (
                      <button
                        type="button"
                        className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          designationFieldDirtyRef.current = true;
                          setDesignationInput('');
                          setDesignationPickedId(null);
                          setDesignationSuggestionsOpen(false);
                        }}
                        disabled={loading}
                        aria-label={t('settings.remove_designation')}
                        title={t('settings.remove_designation')}
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    {designationSuggestionsOpen && !designationsLoading
                      && (designations.length > 0 || designationInput.trim().length > 0) && (
                      <ul
                        id="designation-suggestions"
                        className="absolute z-20 top-full mt-1 left-0 right-0 max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
                        role="listbox"
                      >
                        {(() => {
                          const q = designationInput.trim().toLowerCase();
                          const filtered = designations.filter((d) => {
                            if (d.name === 'Other') {
                              if (!q) {return true;}
                              const o = 'other';
                              return o.startsWith(q) || q.startsWith(o) || o.includes(q);
                            }
                            if (!q) {return true;}
                            return jobTitleMatchesQuery(d.name, q, language);
                          });
                          const ordered = [
                            ...filtered.filter((d) => d.name !== 'Other'),
                            ...filtered.filter((d) => d.name === 'Other'),
                          ];
                          const rows = ordered.slice(0, 25).map((d) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  designationFieldDirtyRef.current = true;
                                  if (d.name === 'Other') {
                                    setDesignationInput('');
                                    setDesignationPickedId(d.id);
                                  } else {
                                    setDesignationInput(jobTitleLabel(d.name, language));
                                    setDesignationPickedId(d.id);
                                  }
                                  setDesignationSuggestionsOpen(false);
                                }}
                              >
                                {d.name === 'Other'
                                  ? (t('settings.other_custom_title'))
                                  : jobTitleLabel(d.name, language)}
                              </button>
                            </li>
                          ));
                          const trimmed = designationInput.trim();
                          const hasExact = trimmed.length > 0
                            && designations.some(
                              (d) =>
                                (d.name || '').toLowerCase() === trimmed.toLowerCase()
                                || jobTitleLabel(d.name, language).toLowerCase() === trimmed.toLowerCase(),
                            );
                          const showAddNew = trimmed.length > 0 && !hasExact && trimmed.length <= 100;
                          if (showAddNew) {
                            rows.push(
                              <li key="__add_new_designation__" className="border-t border-border">
                                <button
                                  type="button"
                                  disabled={addingDesignation}
                                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center gap-2 text-primary disabled:opacity-60"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    addNewDesignationToCatalog(trimmed);
                                  }}
                                >
                                  {addingDesignation ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                                  ) : (
                                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                                  )}
                                  <span>
                                    {tr('settings.add_new_title', { name: trimmed })}
                                  </span>
                                </button>
                              </li>,
                            );
                          }
                          return rows;
                        })()}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location"><LangText path="partners.location"  /></Label>
            <LocationPicker
              value={formData.location}
              onChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              placeholder={t('profileSettings.locationPlaceholder')}
              disabled={loading}
              showMapsButton
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contactEmail"><LangText path="profileSettings.contactEmail"  /></Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="linkedInProfileUrl"><LangText path="profileSettings.linkedInProfile"  /></Label>
            <Input
              id="linkedInProfileUrl"
              type="url"
              value={formData.linkedInProfileUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourprofile"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description"><LangText path="profileSettings.aboutMe"  /></Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder={t('profileSettings.aboutPlaceholder')}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website"><LangText path="profileSettings.website"  /></Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              disabled={loading}
            />
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={saving || loading} onClick={handleCancel}>
            <LangText path="common.cancel"  />
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} data-testid="edit-profile-save">
            {saving ? (t('common.saving')) : (t('common.saveChanges'))}
          </Button>
        </div>

        {/* Image Cropper Modal */}
        <ImageCropper
          open={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          isCircular={cropperType === 'avatar'}
          aspectRatio={cropperType === 'avatar' ? 1 : IMAGE_CONSTRAINTS.COVER.COVER_CROP_ASPECT_RATIO}
          aspectLabel={cropperType === 'avatar' ? '1:1' : '4:1'}
        />
      </div>
    </SettingsLayout>
  );
};

export default ProfileSettings;
