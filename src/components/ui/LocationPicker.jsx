import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Loader2, ExternalLink, Navigation, X } from 'lucide-react';
import { Input, Button } from '@imriva/framework';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';

const PHOTON_API = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse';
const DEBOUNCE_MS = 250;

/** Marks suggestion dropdown nodes (including portaled) so parent popovers do not dismiss on pick. */
export const LOCATION_PICKER_SUGGESTIONS_SELECTOR = '[data-location-picker-suggestions]';

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
export function isLocationPickerSuggestionsTarget(target) {
  return target instanceof Element && target.closest(LOCATION_PICKER_SUGGESTIONS_SELECTOR) !== null;
}

/**
 * Pick the best suggestion for a search query (used when confirming typed text).
 * @param {string} query
 * @param {Array<{ display?: string }>} suggestions
 * @returns {{ display: string } | null}
 */
export function pickBestLocationSuggestion(query, suggestions) {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2 || !Array.isArray(suggestions) || suggestions.length === 0) {
    return null;
  }
  const normalized = suggestions.filter((s) => s?.display);
  if (normalized.length === 0) {
    return null;
  }
  const exact = normalized.find((s) => s.display.toLowerCase() === q);
  if (exact) {
    return exact;
  }
  const startsWith = normalized.find((s) => s.display.toLowerCase().startsWith(q));
  if (startsWith) {
    return startsWith;
  }
  const wordStart = normalized.find((s) =>
    s.display
      .toLowerCase()
      .split(/[\s,]+/)
      .some((word) => word.startsWith(q)),
  );
  if (wordStart) {
    return wordStart;
  }
  const contains = normalized.find((s) => s.display.toLowerCase().includes(q));
  if (contains) {
    return contains;
  }
  return normalized[0] ?? null;
}

/** Radix Popover handlers: keep popover open while interacting with portaled location suggestions. */
export function getLocationPopoverDismissHandlers() {
  const guard = (event) => {
    if (isLocationPickerSuggestionsTarget(event.target)) {
      event.preventDefault();
    }
  };
  return {
    onPointerDownOutside: guard,
    onFocusOutside: guard,
    onInteractOutside: guard,
  };
}

/**
 * Formats a Photon feature into a readable address string.
 * @param {{ properties: { name?: string, street?: string, city?: string, state?: string, country?: string, postcode?: string } }} feature
 * @returns {string}
 */
function formatPhotonResult(feature) {
  const p = feature?.properties ?? {};
  const parts = [];
  if (p.name) {parts.push(p.name);}
  if (p.street && p.street !== p.name) {parts.push(p.street);}
  if (p.city && p.city !== p.name) {parts.push(p.city);}
  if (p.state && p.state !== p.city) {parts.push(p.state);}
  if (p.country) {parts.push(p.country);}
  return [...new Set(parts)].filter(Boolean).join(', ') || 'Unknown';
}

/**
 * Fetches location suggestions from Photon (OpenStreetMap) API.
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{ display: string, lat: number, lon: number, raw: object }>>}
 */
async function searchLocations(query, signal) {
  const q = (query || '').trim();
  if (q.length < 2) {return [];}
  const url = `${PHOTON_API}?q=${encodeURIComponent(q)}&limit=8`;
  const res = await fetch(url, { signal });
  if (!res.ok) {return [];}
  const data = await res.json();
  const features = data?.features ?? [];
  return features.map((f) => ({
    display: formatPhotonResult(f),
    lat: f.geometry?.coordinates?.[1],
    lon: f.geometry?.coordinates?.[0],
    raw: f,
  }));
}

/**
 * Reverse geocode: get address from lat/lon.
 * @param {number} lat
 * @param {number} lon
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
export async function reverseGeocode(lat, lon, signal) {
  const url = `${PHOTON_REVERSE}?lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;}
  const data = await res.json();
  const feature = data?.features?.[0];
  return feature ? formatPhotonResult(feature) : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/**
 * Get current position and reverse geocode to address. Use from parent components
 * (e.g. modals) to avoid Popover unmounting when browser permission dialog appears.
 * @returns {Promise<{ address: string, lat: number, lon: number }>}
 */
export function getCurrentLocationAndAddress() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error('Location requires HTTPS'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          resolve({ address, lat: latitude, lon: longitude });
        } catch (_err) {
          resolve({
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lon: longitude,
          });
        }
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/**
 * Opens Google Maps with the given location (search query or coordinates).
 * @param {string} location
 * @param {{ lat?: number, lon?: number }} [coords]
 */
export function openInGoogleMaps(location, coords) {
  let url;
  if (coords?.lat !== null && coords?.lat !== undefined && coords?.lon !== null && coords?.lon !== undefined) {
    url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || '')}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * LocationPicker - Current location, search, or manual entry.
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   onSelect?: (value: string) => void;
 *   placeholder?: string;
 *   disabled?: boolean;
 *   className?: string;
 *   inputClassName?: string;
 *   showMapsButton?: boolean;
 *   showCurrentLocation?: boolean;
 *   suggestionsInPortal?: boolean;
 *   inputAriaLabel?: string;
 *   clearAriaLabel?: string;
 *   mapsButtonAriaLabel?: string;
 *   'data-testid'?: string;
 * }} props
 * @param {import('react').Ref<{ confirmSelection: () => { committed: boolean, value: string } }>} ref
 */
export const LocationPicker = forwardRef(function LocationPicker(
  {
    value,
    onChange,
    onSelect,
    placeholder = 'Search for a location...',
    disabled = false,
    className,
    inputClassName,
    showMapsButton = true,
    showCurrentLocation = true,
    suggestionsInPortal = false,
    inputAriaLabel = 'Search for a location',
    clearAriaLabel = 'Clear location search',
    mapsButtonAriaLabel = 'Open location in Google Maps',
    'data-testid': dataTestId,
  },
  ref,
) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const portalRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState(/** @type {{ top: number, left: number, width: number } | null} */ (null));
  /** True after the latest completed search returned zero results (so we can show “no matches” instead of hiding the panel). */
  const [lastSearchEmpty, setLastSearchEmpty] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const updateDropdownRect = useCallback(() => {
    const el = inputRef.current;
    if (!el) {return null;}
    const r = el.getBoundingClientRect();
    setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    const showPanel = suggestions.length > 0 || loading || lastSearchEmpty;
    if (!suggestionsInPortal || !open || !showPanel) {
      setDropdownRect(null);
      return;
    }
    updateDropdownRect();
    const handleScrollOrResize = () => updateDropdownRect();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [suggestionsInPortal, open, suggestions.length, loading, lastSearchEmpty, updateDropdownRect]);

  const search = useCallback(async (q) => {
    if (abortRef.current) {abortRef.current.abort();}
    abortRef.current = new AbortController();
    setLoading(true);
    setLastSearchEmpty(false);
    try {
      const results = await searchLocations(q, abortRef.current.signal);
      setSuggestions(results);
      setOpen(true);
      setLastSearchEmpty(q.trim().length >= 2 && results.length === 0);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      setSuggestions([]);
      setLastSearchEmpty(false);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(
        'Geolocation is not supported by your browser. Use search or type manually.',
        { duration: 5000 },
      );
      return;
    }
    if (!window.isSecureContext) {
      toast.error(
        'Location access requires HTTPS. Please use the app over a secure connection.',
        { duration: 5000 },
      );
      return;
    }
    setCurrentLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          setInputValue(address);
          onChange?.(address);
          onSelect?.(address);
          setSelectedCoords({ lat: latitude, lon: longitude });
          setSuggestions([]);
          setOpen(false);
        } catch (_err) {
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setInputValue(fallback);
          onChange?.(fallback);
          onSelect?.(fallback);
          setSelectedCoords({ lat: latitude, lon: longitude });
          setSuggestions([]);
          setOpen(false);
        } finally {
          setCurrentLocationLoading(false);
        }
      },
      (err) => {
        setCurrentLocationLoading(false);
        const code = err?.code;
        const msg = err?.message ?? '';
        if (code === 1) {
          toast.error(
            'Location access was denied. Please allow location permission in your browser settings and try again.',
            { duration: 6000 },
          );
        } else if (code === 2) {
          toast.error(
            'Location unavailable. Please try search or type manually.',
            { duration: 5000 },
          );
        } else if (code === 3) {
          toast.error(
            'Location request timed out. Please try again or use search.',
            { duration: 5000 },
          );
        } else {
          toast.error(
            `Could not get location: ${msg || 'Unknown error'}. Use search or type manually.`,
            { duration: 5000 },
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [onChange, onSelect]);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    onChange?.(v);
    setSelectedCoords(null);
    if (debounceRef.current) {clearTimeout(debounceRef.current);}
    if (v.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLastSearchEmpty(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(v), DEBOUNCE_MS);
  };

  const handleSelect = useCallback(
    (item) => {
      if (!item?.display) {
        return;
      }
      const display = item.display;
      setInputValue(display);
      onSelect?.(display);
      onChange?.(display);
      setSelectedCoords({ lat: item.lat, lon: item.lon });
      setSuggestions([]);
      setLastSearchEmpty(false);
      setOpen(false);
    },
    [onChange, onSelect],
  );

  /** Use typed value as-is (manual entry) without selecting from suggestions. */
  const handleUseManualEntry = useCallback(() => {
    const v = inputValue.trim();
    if (!v) {
      return;
    }
    onSelect?.(v);
    onChange?.(v);
    setSuggestions([]);
    setLastSearchEmpty(false);
    setOpen(false);
  }, [inputValue, onChange, onSelect]);

  const confirmSelection = useCallback(() => {
    const q = inputValue.trim();
    if (suggestions.length > 0 && q.length >= 2) {
      const best = pickBestLocationSuggestion(q, suggestions);
      if (best?.display) {
        handleSelect(best);
        return { committed: true, value: best.display };
      }
    }
    if (q) {
      handleUseManualEntry();
      return { committed: true, value: q };
    }
    return { committed: false, value: '' };
  }, [handleSelect, handleUseManualEntry, inputValue, suggestions]);

  useImperativeHandle(ref, () => ({ confirmSelection }), [confirmSelection]);

  const handleFocus = () => {
    if (inputValue.trim().length >= 2 && suggestions.length === 0 && !loading) {
      search(inputValue);
    } else if (suggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (inputValue.trim()) {
        handleUseManualEntry();
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    setSelectedCoords(null);
    setSuggestions([]);
    setOpen(false);
    setLastSearchEmpty(false);
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  const hasLocationSearchText = inputValue.trim().length > 0;
  const showMapsAction = showMapsButton && Boolean(inputValue || value);
  const locationFieldIconSlots = (hasLocationSearchText ? 1 : 0) + (showMapsAction ? 1 : 0);
  const locationInputPadRight =
    locationFieldIconSlots >= 2 ? 'pr-20' : locationFieldIconSlots === 1 ? 'pr-10' : '';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current?.contains(e.target)) {return;}
      if (suggestionsInPortal && portalRef.current?.contains(e.target)) {return;}
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestionsInPortal]);

  const handleOpenMaps = () => {
    openInGoogleMaps(inputValue || value, selectedCoords);
  };

  return (
    <div ref={containerRef} className={cn('relative space-y-3', className)}>
      {showCurrentLocation && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleGetCurrentLocation}
          disabled={disabled || currentLocationLoading}
        >
          {currentLocationLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <LangText
            path={currentLocationLoading ? 'common.getting_location' : 'common.use_current_location'}
          />
        </Button>
      )}

      <div ref={inputRef} className="relative flex gap-1">
        <Input
          data-testid={dataTestId}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={inputAriaLabel}
          disabled={disabled}
          className={cn(locationInputPadRight, inputClassName)}
        />
        {hasLocationSearchText ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground z-10',
              showMapsAction ? 'right-10' : 'right-1',
            )}
            onClick={handleClear}
            aria-label={clearAriaLabel}
            title={clearAriaLabel}
          >
            <X className="w-4 h-4" />
          </Button>
        ) : null}
        {showMapsAction ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary z-10"
            onClick={handleOpenMaps}
            aria-label={mapsButtonAriaLabel}
            title={mapsButtonAriaLabel}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        ) : null}
      </div>

      {inputValue.trim() && suggestions.length === 0 && !loading && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleUseManualEntry}
          disabled={disabled}
        >
          <MapPin className="w-4 h-4 mr-2" />
          <LangText path="common.use_this_location"  />
        </Button>
      )}

      {open && inputValue.trim().length >= 2 && (loading || suggestions.length > 0 || lastSearchEmpty) && (() => {
        const listBody = loading ? (
          <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              <LangText path="common.searching_places"  />
            </span>
          </div>
        ) : suggestions.length > 0 ? (
          <ul className="py-1">
            {suggestions.map((item, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-accent transition-colors text-sm"
                  aria-label={`Select location: ${item.display}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(item);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(item);
                  }}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{item.display}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            <LangText path="common.no_matching_places_keep_typing_or_try_different_words_you_ca"
            />
          </div>
        );
        const dropdownContent = (
          <div
            ref={portalRef}
            data-location-picker-suggestions
            className="z-[10060] bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={suggestionsInPortal && dropdownRect ? {
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              maxHeight: `min(240px, calc(100dvh - ${dropdownRect.top + 8}px))`,
            } : undefined}
          >
            {listBody}
          </div>
        );
        if (suggestionsInPortal && dropdownRect) {
          return createPortal(dropdownContent, document.body);
        }
        return (
          <div
            data-location-picker-suggestions
            className="absolute top-full left-0 right-0 z-[10060] mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
          >
            {listBody}
          </div>
        );
      })()}
    </div>
  );
});

LocationPicker.displayName = 'LocationPicker';
