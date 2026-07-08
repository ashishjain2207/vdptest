import { useRef, useCallback, useEffect } from 'react';

/**
 * Location popover state: commit only on explicit pick/confirm, not on dismiss.
 * @param {{
 *   location: string;
 *   locationDraft: string;
 *   setLocation: (value: string) => void;
 *   setLocationDraft: (value: string) => void;
 *   setShowLocationOpen: (open: boolean) => void;
 *   clearModerationError?: () => void;
 * }} options
 */
export function useLocationAttachmentPopover({
  location,
  locationDraft,
  setLocation,
  setLocationDraft,
  setShowLocationOpen,
  clearModerationError,
}) {
  const closingFromSelectionRef = useRef(false);
  const locationDraftRef = useRef(locationDraft);
  const locationRef = useRef(location);

  useEffect(() => {
    locationDraftRef.current = locationDraft;
  }, [locationDraft]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const handleLocationPopoverOpenChange = useCallback(
    (open) => {
      if (!open) {
        if (!closingFromSelectionRef.current) {
          // Discard in-progress search text; keep last committed location only.
          setLocationDraft(locationRef.current);
        }
        closingFromSelectionRef.current = false;
      } else {
        closingFromSelectionRef.current = false;
        setLocationDraft(locationRef.current);
      }
      setShowLocationOpen(open);
    },
    [setLocationDraft, setShowLocationOpen],
  );

  const handleLocationSelect = useCallback(
    (value) => {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) {
        return;
      }
      closingFromSelectionRef.current = true;
      locationRef.current = trimmed;
      locationDraftRef.current = trimmed;
      clearModerationError?.();
      setLocation(trimmed);
      setLocationDraft(trimmed);
      setShowLocationOpen(false);
    },
    [clearModerationError, setLocation, setLocationDraft, setShowLocationOpen],
  );

  const confirmLocationDraft = useCallback(() => {
    const trimmed = locationDraftRef.current.trim();
    if (trimmed) {
      locationRef.current = trimmed;
      setLocation(trimmed);
      setLocationDraft(trimmed);
    }
    setShowLocationOpen(false);
  }, [setLocation, setLocationDraft, setShowLocationOpen]);

  /**
   * @param {{ current?: { confirmSelection?: () => { committed: boolean, value: string } } | null }} locationPickerRef
   */
  const confirmLocationFromPicker = useCallback(
    (locationPickerRef) => {
      const picked = locationPickerRef.current?.confirmSelection?.();
      if (picked?.committed) {
        return picked.value.trim();
      }
      const trimmed = locationDraftRef.current.trim();
      if (trimmed) {
        handleLocationSelect(trimmed);
        return trimmed;
      }
      setShowLocationOpen(false);
      return '';
    },
    [handleLocationSelect, setShowLocationOpen],
  );

  return {
    handleLocationPopoverOpenChange,
    handleLocationSelect,
    confirmLocationDraft,
    confirmLocationFromPicker,
  };
}
