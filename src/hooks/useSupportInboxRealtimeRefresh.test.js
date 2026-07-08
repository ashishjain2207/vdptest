import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSupportInboxRealtimeRefresh } from '@/hooks/useSupportInboxRealtimeRefresh';
import { REALTIME } from '@/lib/realtimeEvents';

describe('useSupportInboxRealtimeRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onRefresh when support inbox changed event fires', () => {
    const onRefresh = vi.fn();
    renderHook(() => useSupportInboxRealtimeRefresh(onRefresh));

    act(() => {
      window.dispatchEvent(
        new CustomEvent(REALTIME.supportInquiry.INBOX_CHANGED, {
          detail: { platformSupportInquiryId: '11111111-1111-1111-1111-111111111111' },
        }),
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when notifications hub reconnects', () => {
    const onRefresh = vi.fn();
    renderHook(() => useSupportInboxRealtimeRefresh(onRefresh));

    act(() => {
      window.dispatchEvent(new CustomEvent(REALTIME.notifications.HUB_RECONNECTED));
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when platform support notification is received', () => {
    const onRefresh = vi.fn();
    renderHook(() => useSupportInboxRealtimeRefresh(onRefresh));

    act(() => {
      window.dispatchEvent(
        new CustomEvent(REALTIME.notifications.ITEM_RECEIVED, {
          detail: { type: 'platformSupportInquiry', platformSupportInquiryId: '11111111-1111-1111-1111-111111111111' },
        }),
      );
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated notifications', () => {
    const onRefresh = vi.fn();
    renderHook(() => useSupportInboxRealtimeRefresh(onRefresh));

    act(() => {
      window.dispatchEvent(
        new CustomEvent(REALTIME.notifications.ITEM_RECEIVED, {
          detail: { type: 'like' },
        }),
      );
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('debounces rapid inbox change events', () => {
    const onRefresh = vi.fn();
    renderHook(() => useSupportInboxRealtimeRefresh(onRefresh));

    act(() => {
      window.dispatchEvent(new CustomEvent(REALTIME.supportInquiry.INBOX_CHANGED));
      window.dispatchEvent(new CustomEvent(REALTIME.supportInquiry.INBOX_CHANGED));
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
