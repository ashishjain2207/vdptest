import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocationAttachmentPopover } from './useLocationAttachmentPopover.js';

describe('useLocationAttachmentPopover', () => {
  it('handleLocationSelect commits full value and skips draft overwrite on close', () => {
    const setLocation = vi.fn();
    const setLocationDraft = vi.fn();
    const setShowLocationOpen = vi.fn();

    const { result, rerender } = renderHook(
      ({ location, draft }) =>
        useLocationAttachmentPopover({
          location,
          locationDraft: draft,
          setLocation,
          setLocationDraft,
          setShowLocationOpen,
        }),
      { initialProps: { location: '', draft: 'jap' } },
    );

    act(() => {
      result.current.handleLocationSelect('Japan, Asia');
    });

    expect(setLocation).toHaveBeenCalledWith('Japan, Asia');
    expect(setLocationDraft).toHaveBeenCalledWith('Japan, Asia');
    expect(setShowLocationOpen).toHaveBeenCalledWith(false);

    rerender({ location: 'Japan, Asia', draft: 'jap' });
    act(() => {
      result.current.handleLocationPopoverOpenChange(false);
    });

    expect(setLocation).toHaveBeenCalledTimes(1);
  });

  it('handleLocationPopoverOpenChange discards in-progress draft on dismiss', () => {
    const setLocation = vi.fn();
    const setLocationDraft = vi.fn();
    const setShowLocationOpen = vi.fn();

    const { result } = renderHook(() =>
      useLocationAttachmentPopover({
        location: 'Berlin, Germany',
        locationDraft: 'ber',
        setLocation,
        setLocationDraft,
        setShowLocationOpen,
      }),
    );

    act(() => {
      result.current.handleLocationPopoverOpenChange(false);
    });

    expect(setLocation).not.toHaveBeenCalled();
    expect(setLocationDraft).toHaveBeenCalledWith('Berlin, Germany');
    expect(setShowLocationOpen).toHaveBeenCalledWith(false);
  });
});
