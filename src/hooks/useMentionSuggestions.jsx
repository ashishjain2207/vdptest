import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@imriva/framework';
import { getInitials } from '@/lib/utils';
import { searchUsers } from '@/services';
import { LangText } from '@/components/ui/LangText';

/**
 * Reusable hook for @mention autocomplete. Use with any textarea/input where users can type @handle.
 * Fetches suggestions from API (searchUsers) - empty query returns popular users.
 *
 * @param {Object} options
 * @param {string} options.content - Current text value
 * @param {function(string): void} options.setContent - Setter for content
 * @param {React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>} options.inputRef - Ref to the input/textarea (for cursor positioning after insert)
 * @param {React.RefObject<HTMLElement | null>} [options.positionRef] - Optional ref for portal positioning (e.g. wrapper div). Falls back to inputRef if not provided.
 * @param {string} [options.currentUserId] - Current user ID (excluded from suggestions)
 * @param {boolean} [options.usePortal] - When true, render dropdown in a portal with fixed position (use when parent has overflow-hidden, e.g. Messages page)
 * @returns {{ handleChange: function, handleKeyDown: function, handleBlur: function, insertMention: function, MentionDropdown: React.Component }}
 */
export function useMentionSuggestions({ content, setContent, inputRef, positionRef, currentUserId, usePortal = false }) {
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0, above: false });
  const DROPDOWN_MAX_HEIGHT = 192; // max-h-48 = 12rem
  const GAP = 4;

  // Update dropdown position for portal - smart placement: above or below based on viewport space
  useLayoutEffect(() => {
    if (!usePortal || !showMentionSuggestions) {return;}
    const el = positionRef?.current ?? inputRef?.current;
    if (!el) {return;}
    const updatePos = () => {
      const target = positionRef?.current ?? inputRef?.current;
      if (!target) {return;}
      const r = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - r.bottom;
      const spaceAbove = r.top;
      const width = Math.min(Math.max(r.width, 200), viewportWidth - 16);
      // Show above when not enough space below (e.g. input near bottom/task bar)
      const above = spaceBelow < DROPDOWN_MAX_HEIGHT + GAP && spaceAbove > spaceBelow;
      let top;
      if (above) {
        top = Math.max(8, r.top - DROPDOWN_MAX_HEIGHT - GAP);
      } else {
        top = Math.min(r.bottom + GAP, viewportHeight - DROPDOWN_MAX_HEIGHT - 8);
      }
      const left = Math.max(8, Math.min(r.left, viewportWidth - width - 8));
      setDropdownRect({ top, left, width, above });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [usePortal, showMentionSuggestions, inputRef, positionRef]);

  useEffect(() => {
    if (!showMentionSuggestions) {return;}
    const q = mentionQuery.trim().toLowerCase();
    // Fetch immediately when @ is typed (0ms for empty = popular users); slight debounce when typing
    const delay = q ? 150 : 0;
    const timer = setTimeout(async () => {
      setMentionLoading(true);
      try {
        const res = await searchUsers(q || '', 1, 8);
        const raw = res.data || [];
        const users = raw
          .filter((u) => (u.userId ?? u.UserId) !== currentUserId)
          .map((u) => ({
            userId: u.userId ?? u.UserId,
            displayName: u.displayName ?? u.DisplayName ?? u.handle ?? u.Handle,
            handle: u.handle ?? u.Handle ?? '',
            avatarUrl: u.avatarUrl ?? u.AvatarUrl,
          }))
          .filter((u) => u.handle || u.displayName);
        setMentionSuggestions(users);
        setSelectedMentionIndex(0);
      } catch {
        setMentionSuggestions([]);
      } finally {
        setMentionLoading(false);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [mentionQuery, showMentionSuggestions, currentUserId]);

  const insertMention = useCallback(
    (handle) => {
      const before = content.slice(0, mentionStartIndex);
      const after = content.slice(mentionStartIndex + mentionQuery.length + 1);
      setContent(`${before  }@${handle} ${  after}`);
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setTimeout(() => {
        const el = inputRef?.current;
        if (el) {
          el.focus();
          const newPos = mentionStartIndex + handle.length + 3;
          el.setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [content, mentionStartIndex, mentionQuery, setContent, inputRef],
  );

  const handleChange = useCallback(
    (e) => {
      const v = e.target.value;
      const pos = e.target.selectionStart ?? v.length;
      setContent(v);

      const beforeCursor = v.slice(0, pos);
      const lastAt = beforeCursor.lastIndexOf('@');
      if (lastAt === -1) {
        setShowMentionSuggestions(false);
        return;
      }
      const between = beforeCursor.slice(lastAt + 1);
      if (/[\s\n]/.test(between)) {
        setShowMentionSuggestions(false);
        return;
      }
      setShowMentionSuggestions(true);
      setMentionStartIndex(lastAt);
      setMentionQuery(between);
    },
    [setContent],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!showMentionSuggestions || mentionSuggestions.length === 0) {return;}
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && mentionSuggestions.length > 0) {
        e.preventDefault();
        const u = mentionSuggestions[selectedMentionIndex];
        if (u?.handle) {insertMention(u.handle);}
        return;
      }
      if (e.key === 'Escape') {
        setShowMentionSuggestions(false);
      }
    },
    [showMentionSuggestions, mentionSuggestions, selectedMentionIndex, insertMention],
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowMentionSuggestions(false), 150);
  }, []);

  const dropdownContent = useMemo(
    () =>
      showMentionSuggestions && (!usePortal || dropdownRect.width > 0) ? (
        <div
          className={`z-[10000] rounded-lg border border-border bg-card shadow-lg py-1 max-h-48 overflow-y-auto ${
            usePortal ? '' : 'absolute left-0 right-0 top-full mt-1'
          }`}
          style={
            usePortal
              ? {
                position: 'fixed',
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width,
                minWidth: 200,
              }
              : undefined
          }
          onClick={(e) => e.preventDefault()}
        >
          {mentionLoading ? (
            <div className="px-3 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ) : mentionSuggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              <LangText path="messages.no_users_found"  />
            </p>
          ) : (
            mentionSuggestions.map((u, i) => (
              <button
                key={u.userId}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/80 transition-colors ${
                  i === selectedMentionIndex ? 'bg-muted/80' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u.handle);
                }}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {u.avatarUrl ? (
                    <AvatarImage src={u.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-xs font-medium">
                    {getInitials(u.displayName || u.handle)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{u.displayName || u.handle}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.handle}</p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null,
    [showMentionSuggestions, usePortal, dropdownRect, mentionLoading, mentionSuggestions, selectedMentionIndex, insertMention],
  );

  const MentionDropdown = useCallback(
    () =>
      usePortal && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : dropdownContent,
    [usePortal, dropdownContent],
  );

  return { handleChange, handleKeyDown, handleBlur, insertMention, MentionDropdown };
}
