import { MainLayout } from '@/components/layout/MainLayout';
import { Avatar, AvatarImage, AvatarFallback, Input, Button } from '@imriva/framework';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { Edit, Phone, Video, MoreVertical, Smile, Paperclip, Send, FileEdit, X, Reply, User, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, getInitials } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { NewMessageModal } from '@/components/messages/NewMessageModal';
import { ForwardMessageModal } from '@/components/messages/ForwardMessageModal';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';
import {
  getDrafts,
  setDraft,
  clearDraft,
  getConversations,
  upsertConversation,
  persistConversationList,
  conversationEntryFromDisplay,
} from '@/lib/messageStorage';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { getConversations as fetchConversations, getMessages, getMessagesUnreadCount, getLastSeen, sendMessage, markConversationAsRead, editMessage, deleteMessage, addReaction, removeReaction } from '@/services/messageService';
import * as signalR from '@microsoft/signalr';
import { MESSAGES_HUB_EVENTS } from '@/contexts/messagesHubEvents';
import {
  getMessagesHubConnection,
  getOnlineUsers,
  joinConversation,
  leaveConversation,
  notifyTyping,
  notifyStoppedTyping,
} from '@/services/messagesHub';
import { formatConversationTime, formatLastSeen, formatMessageSectionDate } from '@/lib/messageTimeUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { EXTENDED_REACTION_EMOJIS } from '@/services/messageService';
import { messagesPath, messagesListPath, profilePath } from '@/lib/appRoutes';
import { ModerationAlert } from '@/components/common/ModerationAlert';
import { getModerationErrorMessage, isModerationError } from '@/utils/moderationError';
import {
  deriveConversationMetaFromMessages,
  patchConversationAtTop,
  previewFromMessageRow,
  sortConversationsByRecent,
} from '@/lib/conversationListUtils';

const DRAFT_DEBOUNCE_MS = 100;
const TYPING_DEBOUNCE_MS = 100;
const TYPING_TIMEOUT_MS = 3000; // Stop typing after 3s of no input
const MESSAGE_MODERATION_FALLBACK = 'This message couldn’t be sent because it may violate platform rules. Please edit it and try again.';
const MESSAGE_EDIT_MODERATION_FALLBACK = 'This message couldn’t be updated because it may violate platform rules. Please edit it and try again.';
/** Returns true if we have valid lastSeen data (user is away, not online). */
function hasLastSeen(lastSeenAt) {
  if (!lastSeenAt) {return false;}
  const d = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
  return !Number.isNaN(d.getTime());
}

/** Normalize user ID for consistent presence matching across all identity sources. */
function normalizeUserId(userId) {
  if (userId === null || userId === undefined) { return ''; }
  return String(userId).trim().toLowerCase();
}

/** Returns true if userId is in onlineUsers (logged in and using the app). Works for all users regardless of ID format. */
function isUserOnline(onlineUsers, userId) {
  const id = normalizeUserId(userId);
  if (!id) { return false; }
  return [...onlineUsers].some((u) => normalizeUserId(u) === id);
}

/** Normalize API conversation to display format (userId, displayName, etc.) */
function toDisplayConv(api) {
  return {
    id: api.id,
    conversationId: api.id,
    userId: api.otherUserId,
    displayName: api.otherDisplayName,
    handle: api.otherHandle,
    avatarUrl: api.otherAvatarUrl,
    lastMessageAt: api.lastMessageAt,
    lastMessagePreview: api.lastMessagePreview,
    unreadCount: api.unreadCount ?? 0,
    otherLastSeenAt: api.otherLastSeenAt ?? null,
  };
}

/** Preview line for conversation list from hub/API message shape (camelCase or PascalCase). */
function previewFromInboundMessage(message) {
  return previewFromMessageRow(message);
}

/** Map persisted row to list display shape (skeleton before API load). */
function storageEntryToDisplay(entry) {
  if (!entry?.userId) { return null; }
  const cid = entry.conversationId;
  return {
    id: cid ?? entry.userId,
    conversationId: cid,
    userId: entry.userId,
    displayName: entry.displayName,
    handle: entry.handle,
    avatarUrl: entry.avatarUrl,
    lastMessageAt: entry.lastMessageAt ?? 0,
    lastMessagePreview: entry.lastMessagePreview,
    unreadCount: 0,
    otherLastSeenAt: null,
  };
}

/**
 * Storage rows that still have a conversationId are treated as snapshots of server state.
 * After a DB wipe (or any time the API omits that conversation), they must not be merged back — only true local-only rows (no conversationId yet) are kept.
 * @param {Array<{ userId?: string, conversationId?: string }>} fromStorage
 * @param {Set<string>} seenUserIds
 */
function localOnlyExtrasFromStorage(fromStorage, seenUserIds) {
  return fromStorage
    .filter((c) => {
      if (!c.userId || seenUserIds.has(c.userId)) { return false; }
      if (c.conversationId) { return false; }
      return true;
    })
    .map(storageEntryToDisplay)
    .filter(Boolean);
}

const Messages = () => {
  const { language } = useLanguage();
  const t = useT();
  const tr = useTParams();
  const { user: authUser } = useAuth();
  const { audioVideoCallEnabled } = useFeatureFlags();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId: urlSegment } = useParams();
  const state = location.state || {};

  const [conversations, setConversationsState] = useState(() => {
    try {
      return localOnlyExtrasFromStorage(getConversations(), new Set());
    } catch {
      return [];
    }
  });
  const [, setConversationsLoading] = useState(true);
  const [drafts, setDraftsState] = useState({});
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [openUserInfo, setOpenUserInfo] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [, setSignalrConnected] = useState(false);
  const [signalrReconnecting, setSignalrReconnecting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [typingUserId, setTypingUserId] = useState(null);
  const [lastSeenForOpenUser, setLastSeenForOpenUser] = useState(null);
  const [lastSeenByUserId, setLastSeenByUserId] = useState(() => ({}));
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraftsByMessageId, setEditDraftsByMessageId] = useState({});
  const [messageModerationErrorsByUserId, setMessageModerationErrorsByUserId] = useState({});
  const [editModerationErrorsByMessageId, setEditModerationErrorsByMessageId] = useState({});
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [replyToByUserId, setReplyToByUserId] = useState({});
  const [forwardMessage, setForwardMessage] = useState(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [selectedFilesByUserId, setSelectedFilesByUserId] = useState({});
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState(null);
  const messageInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const messageInputWrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const selectedConversationIdRef = useRef(null);
  const selectedUserIdRef = useRef(selectedUserId);
  const typingTimeoutRef = useRef(null);
  const messagesScrollRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollAnchorRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const skipScrollToBottomRef = useRef(false);
  const scrollBeforeLoadOlderRef = useRef(null);
  const { handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, handleBlur: handleMentionBlur, MentionDropdown } = useMentionSuggestions({
    content: newMessageText,
    setContent: setNewMessageText,
    inputRef: messageInputRef,
    positionRef: messageInputWrapperRef, // Wrapper ref for portal positioning (Input may not forward ref)
    currentUserId: authUser?.userId,
    usePortal: true, // Messages layout has overflow-hidden; portal avoids clipping
  });
  const messageModerationError = selectedUserId ? messageModerationErrorsByUserId[selectedUserId] ?? '' : '';
  const replyTo = selectedUserId ? replyToByUserId[selectedUserId] ?? null : null;
  const selectedFiles = selectedUserId ? selectedFilesByUserId[selectedUserId] ?? [] : [];

  const clearMessageModerationErrorForUser = useCallback((userId) => {
    if (!userId) {return;}
    setMessageModerationErrorsByUserId((prev) => {
      if (!prev[userId]) {return prev;}
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const setMessageModerationErrorForUser = useCallback((userId, message) => {
    if (!userId) {return;}
    setMessageModerationErrorsByUserId((prev) => ({
      ...prev,
      [userId]: message,
    }));
  }, []);

  const clearEditModerationErrorForMessage = useCallback((messageId) => {
    if (!messageId) {return;}
    setEditModerationErrorsByMessageId((prev) => {
      if (!prev[messageId]) {return prev;}
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  }, []);

  const setEditModerationErrorForMessage = useCallback((messageId, message) => {
    if (!messageId) {return;}
    setEditModerationErrorsByMessageId((prev) => ({
      ...prev,
      [messageId]: message,
    }));
  }, []);

  const clearEditDraftForMessage = useCallback((messageId) => {
    if (!messageId) {return;}
    setEditDraftsByMessageId((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, messageId)) {return prev;}
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  }, []);

  const setEditDraftForMessage = useCallback((messageId, content) => {
    if (!messageId) {return;}
    setEditDraftsByMessageId((prev) => ({
      ...prev,
      [messageId]: content,
    }));
  }, []);

  const setReplyToForUser = useCallback((userId, message) => {
    if (!userId) {return;}
    setReplyToByUserId((prev) => {
      const next = { ...prev };
      if (message) {
        next[userId] = message;
      } else {
        delete next[userId];
      }
      return next;
    });
  }, []);

  const setSelectedFilesForUser = useCallback((userId, valueOrUpdater) => {
    if (!userId) {return;}
    setSelectedFilesByUserId((prev) => {
      const current = prev[userId] ?? [];
      const nextFiles = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(current)
        : valueOrUpdater;
      const next = { ...prev };
      if (nextFiles.length > 0) {
        next[userId] = nextFiles;
      } else {
        delete next[userId];
      }
      return next;
    });
  }, []);

  const clearSelectedFilesForUser = useCallback((userId) => {
    setSelectedFilesForUser(userId, []);
  }, [setSelectedFilesForUser]);

  const loadFromApi = useCallback(async (silent = false) => {
    if (!authUser?.userId) {
      setConversationsLoading(false);
      return;
    }
    if (!silent) {setConversationsLoading(true);}
    try {
      const apiConvs = await fetchConversations();
      const fromApi = apiConvs.map(toDisplayConv);
      const fromStorage = getConversations();
      const seen = new Set(fromApi.map((c) => c.userId));
      const extra = localOnlyExtrasFromStorage(fromStorage, seen);
      const merged = sortConversationsByRecent([...fromApi, ...extra]);
      setConversationsState(merged);
      persistConversationList(merged.map(conversationEntryFromDisplay));
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversationsState((prev) => {
        const fallback = getConversations().map(storageEntryToDisplay).filter(Boolean);
        return fallback.length ? fallback : prev;
      });
    } finally {
      if (!silent) {setConversationsLoading(false);}
    }
  }, [authUser?.userId]);

  const syncDraftsOnly = useCallback(() => {
    setDraftsState(getDrafts());
  }, []);

  /** Merge local-only / storage rows into current list without clobbering API-backed rows. */
  const mergeConversationsFromStorage = useCallback(() => {
    if (!authUser?.userId) { return; }
    setConversationsState((prev) => {
      const fromStorage = getConversations();
      const serverRows = prev.filter((c) => (c.conversationId ?? c.id));
      const pendingLocal = prev.filter((c) => c.userId && !(c.conversationId ?? c.id));
      const seen = new Set([...serverRows, ...pendingLocal].map((c) => c.userId));
      const extra = localOnlyExtrasFromStorage(fromStorage, seen);
      if (serverRows.length || pendingLocal.length) {
        return [...serverRows, ...pendingLocal, ...extra];
      }
      if (extra.length) {
        return extra;
      }
      return prev;
    });
  }, [authUser?.userId]);

  const PAGE_SIZE = 50;

  const fetchMessages = useCallback(async (convId, options = {}) => {
    if (!convId) {return;}
    const { silent = false, page = 1, append = false } = options;
    if (append) {
      setLoadingOlder(true);
    } else if (!silent) {
      setMessagesLoading(true);
    }
    try {
      const msgs = await getMessages(convId, page, PAGE_SIZE);
      if (append) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = (Array.isArray(msgs) ? msgs : []).filter((m) => !existingIds.has(m.id));
          if (newMsgs.length === 0) { return prev; }
          const merged = [...prev, ...newMsgs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return merged;
        });
        setHasMoreOlder((msgs?.length ?? 0) >= PAGE_SIZE);
        setMessagesPage(page);
      } else {
        // API returns newest first; keep newest-first in state so display (reversed) shows oldest at top, newest at bottom
        const list = Array.isArray(msgs) ? msgs : [];
        const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessages(sorted);
        setMessagesPage(1);
        setHasMoreOlder((msgs?.length ?? 0) >= PAGE_SIZE);
      }
      if (!append) {
        const hasMessages = (Array.isArray(msgs) ? msgs : []).length > 0;
        if (hasMessages) {
          await markConversationAsRead(convId);
        }
        setConversationsState((prev) =>
          prev.map((c) => {
            const match =
              String(c.conversationId) === String(convId) || String(c.id) === String(convId);
            if (!match) { return c; }
            return {
              ...c,
              unreadCount: 0,
              ...(hasMessages
                ? {}
                : { lastMessagePreview: '', lastMessageAt: 0 }),
            };
          }),
        );
      }
    } catch (err) {
      if (!silent && !append) {console.error('Failed to fetch messages:', err);}
      if (!append) { setMessages([]); }
    } finally {
      if (append) {
        setLoadingOlder(false);
      } else if (!silent) {
        setMessagesLoading(false);
      }
    }
  }, []);

  const loadOlderMessages = useCallback(() => {
    const convId = selectedConversationIdRef.current;
    if (!convId || loadingOlder || !hasMoreOlder) { return; }
    const el = messagesScrollRef.current;
    if (el) {
      scrollBeforeLoadOlderRef.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight };
    }
    skipScrollToBottomRef.current = true;
    fetchMessages(convId, { silent: true, page: messagesPage + 1, append: true });
  }, [fetchMessages, loadingOlder, hasMoreOlder, messagesPage]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  // Listen for SignalR hub events (hub is connected globally by MessagesHubProvider when user is authenticated)
  useEffect(() => {
    if (!authUser?.userId) {return;}
    let mounted = true;

    // Hub may already be connected when Messages page mounts (e.g. user was on another page)
    const conn = getMessagesHubConnection();
    if (conn?.state === signalR.HubConnectionState.Connected) {
      setSignalrConnected(true);
      getOnlineUsers().then((ids) => {
        if (mounted && Array.isArray(ids)) {
          const normalized = ids.map((u) => normalizeUserId(u)).filter(Boolean);
          setOnlineUsers(new Set(normalized));
        }
      });
    }

    const onReceiveMessage = (e) => {
      if (!mounted) {return;}
      const detail = e.detail || {};
      const conversationId = detail.conversationId ?? detail.ConversationId;
      const message = detail.message ?? detail.Message;
      const senderDisplayName = detail.senderDisplayName ?? detail.SenderDisplayName;
      if (!conversationId || !message) {return;}
      const convIdStr = String(conversationId);
      const senderId = message.senderId ?? message.SenderId;
      const createdAtRaw = message.createdAt ?? message.CreatedAt;
      const sentAt = createdAtRaw
        ? (typeof createdAtRaw === 'string' ? createdAtRaw : (createdAtRaw?.toISOString?.() ?? new Date().toISOString()))
        : new Date().toISOString();
      const preview = previewFromInboundMessage(message);
      const ts = new Date(sentAt).getTime();
      const isOpen = String(selectedConversationIdRef.current) === convIdStr;

      if (isOpen) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {return prev;}
          const merged = [...prev, { ...message, createdAt: sentAt, isRead: message.isRead ?? false }];
          return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        setConversationsState((prev) => {
          const existing = prev.find(
            (c) => String(c.conversationId) === convIdStr || String(c.id) === convIdStr,
          );
          const next = patchConversationAtTop(prev, convIdStr, {
            lastMessageAt: ts,
            lastMessagePreview: preview || existing?.lastMessagePreview,
            unreadCount: 0,
          });
          persistConversationList(next.map(conversationEntryFromDisplay));
          return next;
        });
        if (senderId !== authUser?.userId) {
          markConversationAsRead(convIdStr)
            .then(() => {
              fetchMessages(convIdStr, { silent: true });
            })
            .catch(() => {});
        }
      } else {
        setConversationsState((prev) => {
          const idx = prev.findIndex(
            (c) => String(c.conversationId) === convIdStr || String(c.id) === convIdStr || String(c.userId) === String(senderId),
          );
          if (idx >= 0) {
            const c = prev[idx];
            const next = patchConversationAtTop(prev, convIdStr, {
              lastMessageAt: ts,
              lastMessagePreview: preview || c.lastMessagePreview,
              unreadCount: (c.unreadCount ?? 0) + 1,
            }, String(senderId));
            persistConversationList(next.map(conversationEntryFromDisplay));
            return next;
          }
          const row = {
            id: convIdStr,
            conversationId: convIdStr,
            userId: senderId,
            displayName: senderDisplayName || 'User',
            handle: '',
            avatarUrl: null,
            lastMessageAt: ts,
            lastMessagePreview: preview,
            unreadCount: 1,
          };
          const next = sortConversationsByRecent([row, ...prev]);
          persistConversationList(next.map(conversationEntryFromDisplay));
          return next;
        });
      }
    };
    const onUserOnline = (e) => {
      if (!mounted || !e.detail) {return;}
      const id = normalizeUserId(e.detail);
      if (!id) {return;}
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        const existing = [...next].find((u) => normalizeUserId(u) === id);
        if (existing) { return prev; }
        next.add(id);
        return next;
      });
    };
    const onUserOffline = (e) => {
      if (!mounted || !e.detail) {return;}
      const userId = e.detail;
      const id = normalizeUserId(userId);
      if (!id) {return;}
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        const toRemove = [...next].find((u) => normalizeUserId(u) === id);
        if (toRemove) { next.delete(toRemove); }
        return next;
      });
      // Optimistically set lastSeen to "just now" so UI shows immediately without API call
      setLastSeenByUserId((prev) => ({ ...prev, [userId]: new Date() }));
      if (selectedUserIdRef.current === userId) {
        setLastSeenForOpenUser(new Date());
      }
    };
    const onOnlineUsers = (e) => {
      if (!mounted || !Array.isArray(e.detail)) {return;}
      const normalized = e.detail.map((u) => normalizeUserId(u)).filter(Boolean);
      setOnlineUsers(new Set(normalized));
    };
    const onUserTyping = (e) => {
      if (!mounted) {return;}
      const { conversationId, userId } = e.detail || {};
      if (selectedConversationIdRef.current === conversationId) {setTypingUserId(userId);}
    };
    const onUserStoppedTyping = (e) => {
      if (!mounted) {return;}
      const { conversationId } = e.detail || {};
      if (selectedConversationIdRef.current === conversationId) {setTypingUserId(null);}
    };
    const onReadReceipt = (e) => {
      if (!mounted) {return;}
      const convId = e.detail;
      if (selectedConversationIdRef.current === convId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === authUser?.userId ? { ...m, isRead: true } : m)),
        );
        fetchMessages(convId, { silent: true }); // Refetch to get actual readAt from backend
      }
    };
    const onMessageEdited = (e) => {
      if (!mounted) {return;}
      const { conversationId, message } = e.detail || {};
      if (!conversationId || !message) {return;}
      const convIdStr = String(conversationId);
      const preview = previewFromInboundMessage(message);
      if (String(selectedConversationIdRef.current) === convIdStr) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? { ...m, content: message.content, isEdited: message.isEdited ?? true, editedAt: message.editedAt }
              : m,
          ),
        );
      }
      if (preview) {
        setConversationsState((prev) => {
          const next = patchConversationAtTop(prev, convIdStr, { lastMessagePreview: preview });
          persistConversationList(next.map(conversationEntryFromDisplay));
          return next;
        });
      }
    };
    const onMessageDeleted = (e) => {
      if (!mounted) {return;}
      const detail = e.detail || {};
      const conversationId = detail.conversationId ?? detail.ConversationId;
      const messageId = detail.messageId ?? detail.MessageId;
      if (!conversationId || !messageId) {return;}
      const convIdStr = String(conversationId);
      const msgIdStr = String(messageId);
      const isOpen = String(selectedConversationIdRef.current) === convIdStr;

      if (isOpen) {
        setMessages((prev) => {
          const remaining = prev.filter((m) => String(m.id) !== msgIdStr);
          const { preview, at } = deriveConversationMetaFromMessages(remaining);
          setConversationsState((prevC) => {
            const next = patchConversationAtTop(prevC, convIdStr, {
              lastMessagePreview: preview,
              lastMessageAt: at,
            });
            persistConversationList(next.map(conversationEntryFromDisplay));
            return next;
          });
          return remaining;
        });
      } else {
        void loadFromApi(true);
      }
    };
    const onConnected = () => {
      if (!mounted) { return; }
      setSignalrConnected(true);
      loadFromApi(true);
    };
    const onDisconnected = () => {
      if (mounted) {
        setSignalrConnected(false);
        setSignalrReconnecting(false);
        setOnlineUsers(new Set());
        setTypingUserId(null);
      }
    };
    const onReconnecting = () => mounted && setSignalrReconnecting(true);
    const onReconnected = async () => {
      if (!mounted) { return; }
      setSignalrReconnecting(false);
      const convId = selectedConversationIdRef.current;
      if (convId) {
        await joinConversation(convId);
      }
      const ids = await getOnlineUsers();
      if (mounted && Array.isArray(ids)) {
        const normalized = ids.map((u) => normalizeUserId(u)).filter(Boolean);
        setOnlineUsers(new Set(normalized));
      }
      await loadFromApi(true);
      try {
        const unread = await getMessagesUnreadCount();
        const n = typeof unread === 'number' ? unread : 0;
        dispatchRealtime(REALTIME.messages.UNREAD_COUNT, { totalUnread: Math.max(0, Math.floor(n)) });
      } catch {
        /* ignore */
      }
      const convIdAfter = selectedConversationIdRef.current;
      if (convIdAfter) {
        await fetchMessages(convIdAfter, { silent: true });
      }
    };

    window.addEventListener(MESSAGES_HUB_EVENTS.RECEIVE_MESSAGE, onReceiveMessage);
    window.addEventListener(MESSAGES_HUB_EVENTS.USER_ONLINE, onUserOnline);
    window.addEventListener(MESSAGES_HUB_EVENTS.USER_OFFLINE, onUserOffline);
    window.addEventListener(MESSAGES_HUB_EVENTS.ONLINE_USERS, onOnlineUsers);
    window.addEventListener(MESSAGES_HUB_EVENTS.USER_TYPING, onUserTyping);
    window.addEventListener(MESSAGES_HUB_EVENTS.USER_STOPPED_TYPING, onUserStoppedTyping);
    window.addEventListener(MESSAGES_HUB_EVENTS.READ_RECEIPT, onReadReceipt);
    window.addEventListener(MESSAGES_HUB_EVENTS.MESSAGE_EDITED, onMessageEdited);
    window.addEventListener(MESSAGES_HUB_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    window.addEventListener(MESSAGES_HUB_EVENTS.CONNECTED, onConnected);
    window.addEventListener(MESSAGES_HUB_EVENTS.DISCONNECTED, onDisconnected);
    window.addEventListener(MESSAGES_HUB_EVENTS.RECONNECTING, onReconnecting);
    window.addEventListener(MESSAGES_HUB_EVENTS.RECONNECTED, onReconnected);

    return () => {
      mounted = false;
      window.removeEventListener(MESSAGES_HUB_EVENTS.RECEIVE_MESSAGE, onReceiveMessage);
      window.removeEventListener(MESSAGES_HUB_EVENTS.USER_ONLINE, onUserOnline);
      window.removeEventListener(MESSAGES_HUB_EVENTS.USER_OFFLINE, onUserOffline);
      window.removeEventListener(MESSAGES_HUB_EVENTS.ONLINE_USERS, onOnlineUsers);
      window.removeEventListener(MESSAGES_HUB_EVENTS.USER_TYPING, onUserTyping);
      window.removeEventListener(MESSAGES_HUB_EVENTS.USER_STOPPED_TYPING, onUserStoppedTyping);
      window.removeEventListener(MESSAGES_HUB_EVENTS.READ_RECEIPT, onReadReceipt);
      window.removeEventListener(MESSAGES_HUB_EVENTS.MESSAGE_EDITED, onMessageEdited);
      window.removeEventListener(MESSAGES_HUB_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      window.removeEventListener(MESSAGES_HUB_EVENTS.CONNECTED, onConnected);
      window.removeEventListener(MESSAGES_HUB_EVENTS.DISCONNECTED, onDisconnected);
      window.removeEventListener(MESSAGES_HUB_EVENTS.RECONNECTING, onReconnecting);
      window.removeEventListener(MESSAGES_HUB_EVENTS.RECONNECTED, onReconnected);
      setSignalrConnected(false);
      setOnlineUsers(new Set());
      setTypingUserId(null);
    };
  }, [authUser?.userId, loadFromApi, fetchMessages]);

  // Refresh presence when tab becomes visible (e.g. after switching back from another tab)
  useEffect(() => {
    if (!authUser?.userId) { return; }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getOnlineUsers().then((ids) => {
          if (Array.isArray(ids)) {
            const normalized = ids.map((u) => normalizeUserId(u)).filter(Boolean);
            setOnlineUsers(new Set(normalized));
          }
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [authUser?.userId]);

  useEffect(() => {
    syncDraftsOnly();
  }, [authUser?.userId, syncDraftsOnly]);

  // No segment in URL → show conversation list only (desktop + mobile back)
  useEffect(() => {
    if (!urlSegment && !state.openUserId) {
      setSelectedUserId(null);
      setOpenUserInfo(null);
    }
  }, [urlSegment, state.openUserId]);

  // Sync URL /messages/:conversationId with selection (conversation id or other-user id; canonicalize to conversation id when known)
  useEffect(() => {
    const segment = urlSegment || state.openUserId;
    if (!segment) {
      return;
    }

    const matchConv = conversations.find(
      (c) => String(c.conversationId ?? c.id) === String(segment),
    );
    if (matchConv) {
      setOpenUserInfo(null);
      setSelectedUserId(matchConv.userId);
      setNewMessageText(getDrafts()[matchConv.userId] || '');
      setLastSeenForOpenUser(null);
      return;
    }

    const matchUser = conversations.find((c) => c.userId === segment);
    const canonical = matchUser?.conversationId ?? matchUser?.id;
    if (matchUser && canonical) {
      setOpenUserInfo(null);
      setSelectedUserId(matchUser.userId);
      setNewMessageText(getDrafts()[matchUser.userId] || '');
      setLastSeenForOpenUser(null);
      if (String(segment) !== String(canonical)) {
        navigate(messagesPath(String(canonical)), { replace: true });
      }
      return;
    }

    const uid = segment;
    const { displayName, avatarUrl, handle } = state;
    if (displayName !== undefined || avatarUrl !== undefined || handle !== undefined || state.openUserId) {
      setOpenUserInfo({
        userId: uid,
        displayName: displayName || 'User',
        avatarUrl: avatarUrl || null,
        handle: handle || '',
      });
    }
    setSelectedUserId(uid);
    setNewMessageText(getDrafts()[uid] || '');
    setLastSeenForOpenUser(null);
    if (state.openUserId && !urlSegment) {
      navigate(messagesPath(uid), { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- URL + list sync
  }, [urlSegment, state.openUserId, conversations]);

  // Fetch last seen for users in the list who don't have otherLastSeenAt (e.g. from storage, or API returned null).
  // This enables the yellow "away" dot for conversations like Sravanthi's.
  useEffect(() => {
    if (!authUser?.userId) {return;}
    const toFetch = conversations.filter(
      (c) => c.userId && !isUserOnline(onlineUsers, c.userId) && (c.otherLastSeenAt === null || c.otherLastSeenAt === undefined) && lastSeenByUserId[c.userId] === undefined,
    );
    toFetch.forEach((conv) => {
      getLastSeen(conv.userId).then(({ lastSeenAt }) => {
        setLastSeenByUserId((prev) => ({ ...prev, [conv.userId]: lastSeenAt }));
      });
    });
  }, [authUser?.userId, conversations, onlineUsers, lastSeenByUserId]);

  // Also fetch for selected user when opening from profile (openUserInfo)
  useEffect(() => {
    if (!selectedUserId || !openUserInfo || selectedUserId !== openUserInfo.userId) {return;}
    if (isUserOnline(onlineUsers, selectedUserId)) {return;}
    const conv = conversations.find((c) => c.userId === selectedUserId);
    if (conv?.otherLastSeenAt !== null && conv?.otherLastSeenAt !== undefined) {return;}
    if (lastSeenByUserId[selectedUserId] !== undefined) {return;}

    getLastSeen(selectedUserId).then(({ lastSeenAt }) => {
      setLastSeenByUserId((prev) => ({ ...prev, [selectedUserId]: lastSeenAt }));
      setLastSeenForOpenUser(lastSeenAt);
    });
  }, [selectedUserId, openUserInfo, conversations, onlineUsers, lastSeenByUserId]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = conversations.filter((c) => {
      const name = (c.displayName || c.handle || '').toLowerCase();
      return !q || name.includes(q) || (c.handle || '').toLowerCase().includes(q);
    });
    return sortConversationsByRecent(filtered);
  }, [conversations, searchQuery]);

  const selectedConv = selectedUserId
    ? conversations.find((c) => c.userId === selectedUserId)
    : null;
  const displayInfo = selectedConv || (openUserInfo?.userId === selectedUserId ? openUserInfo : null);

  const selectedDisplayName = displayInfo?.displayName || displayInfo?.handle || 'User';
  const selectedAvatar = displayInfo?.avatarUrl;
  // When user is on the list (no conversation selected), keep conversation id null so new messages show as unread
  const selectedConversationId = (selectedUserId !== null && selectedUserId !== undefined)
    ? (selectedConv?.conversationId ?? selectedConv?.id ?? pendingConversationId)
    : null;
  selectedConversationIdRef.current = selectedConversationId;

  useEffect(() => {
    if (!selectedUserId) {return;}
    const t = setTimeout(() => {
      if (newMessageText.trim()) {
        setDraft(selectedUserId, newMessageText);
        setDraftsState(getDrafts());
        const info = selectedConv || (openUserInfo?.userId === selectedUserId ? openUserInfo : null);
        if (info) {
          upsertConversation({
            userId: selectedUserId,
            displayName: info.displayName,
            avatarUrl: info.avatarUrl,
            handle: info.handle,
            lastMessageAt: Date.now(),
          });
          mergeConversationsFromStorage();
        }
      } else {
        clearDraft(selectedUserId);
        setDraftsState(getDrafts());
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [newMessageText, selectedUserId, selectedConv, openUserInfo, mergeConversationsFromStorage]);

  useEffect(() => {
    if (selectedUserId) {
      setNewMessageText(getDrafts()[selectedUserId] || '');
    }
  }, [selectedUserId]);

  // Typing indicator: debounced notifyTyping, timeout for notifyStoppedTyping
  useEffect(() => {
    if (!selectedConversationId || !newMessageText.trim()) {
      if (selectedConversationId) {notifyStoppedTyping(selectedConversationId);}
      return;
    }
    const t = setTimeout(() => {
      notifyTyping(selectedConversationId);
      typingTimeoutRef.current = setTimeout(() => {
        notifyStoppedTyping(selectedConversationId);
      }, TYPING_TIMEOUT_MS);
    }, TYPING_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [newMessageText, selectedConversationId]);

  const prevConversationIdRef = useRef(null);
  useEffect(() => {
    if (selectedConversationId) {
      const prevId = prevConversationIdRef.current;
      prevConversationIdRef.current = selectedConversationId;
      if (prevId !== selectedConversationId) {
        if (prevId) {
          setMessages([]);
          setHasMoreOlder(true);
          setMessagesPage(1);
        }
        fetchMessages(selectedConversationId);
      }
      joinConversation(selectedConversationId);
      return () => leaveConversation(selectedConversationId);
    } else {
      prevConversationIdRef.current = null;
      setPendingConversationId(null);
      setMessages([]);
      setTypingUserId(null);
    }
  }, [selectedConversationId, fetchMessages]);

  // Restore scroll position after loading older messages (content added at top)
  useEffect(() => {
    if (!loadingOlder && scrollBeforeLoadOlderRef.current) {
      const el = messagesScrollRef.current;
      const saved = scrollBeforeLoadOlderRef.current;
      scrollBeforeLoadOlderRef.current = null;
      if (el && saved) {
        requestAnimationFrame(() => {
          const delta = el.scrollHeight - saved.scrollHeight;
          el.scrollTop = saved.scrollTop + delta;
        });
      }
    }
  }, [loadingOlder]);

  // Scroll to bottom (latest message) when messages load or new message arrives
  // When conversation is opened and messages load: show newest at bottom and scroll to bottom so latest messages are visible. Scroll up to load older.
  useEffect(() => {
    if (skipScrollToBottomRef.current) {
      skipScrollToBottomRef.current = false;
      return;
    }
    if (!messagesLoading && messages.length > 0) {
      const scrollToLatest = () => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        const el = messagesScrollRef.current;
        if (el) { el.scrollTop = el.scrollHeight; }
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToLatest();
          setTimeout(scrollToLatest, 100);
          setTimeout(scrollToLatest, 350);
        });
      });
    }
  }, [messages, messagesLoading]);

  const handleSelectConversation = (userId) => {
    setPendingConversationId(null);
    setSelectedUserId(userId);
    setOpenUserInfo(null);
    setLastSeenForOpenUser(null);
    const conv = conversations.find((c) => c.userId === userId);
    if (conv) {
      setNewMessageText(drafts[userId] || '');
    }
    const pathSegment = conv?.conversationId ?? conv?.id ?? userId;
    navigate(messagesPath(String(pathSegment)));
  };

  const handleMediaClick = () => {
    if (sending) {return;}
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (sending) {return;}
    clearMessageModerationErrorForUser(selectedUserId);
    const files = e.target.files ? Array.from(e.target.files) : [];
    const next = [...selectedFiles, ...files].slice(0, 5); // Max 5 attachments
    setSelectedFilesForUser(selectedUserId, next);
    const input = e.target;
    if (input) {input.value = '';}
  };

  const removeFile = (index) => {
    if (sending) {return;}
    clearMessageModerationErrorForUser(selectedUserId);
    setSelectedFilesForUser(selectedUserId, (prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    const submittedDraft = newMessageText;
    const content = submittedDraft.trim();
    const filesToSend = selectedFiles;
    const submittedUserId = selectedUserId;
    const submittedDisplayInfo = displayInfo;
    const submittedReplyToId = replyTo?.id ?? null;
    const submittedConversationId = selectedConversationId;
    const hasContent = Boolean(content);
    const hasFiles = filesToSend.length > 0;
    if (!submittedUserId || (!hasContent && !hasFiles) || sending) {return;}
    if (submittedConversationId) {notifyStoppedTyping(submittedConversationId);}
    setSending(true);
    clearMessageModerationErrorForUser(submittedUserId);
    const optimisticId = `temp-${Date.now()}`;
    try {
      const res = await sendMessage(submittedUserId, content, filesToSend, submittedReplyToId);
      clearDraft(submittedUserId);
      setDraftsState(getDrafts());
      const submittedConversationStillOpen = selectedUserIdRef.current === submittedUserId;
      clearSelectedFilesForUser(submittedUserId);
      setReplyToForUser(submittedUserId, null);
      if (submittedConversationStillOpen) {
        setNewMessageText('');
        const attachments = filesToSend.map((f) => ({
          mediaFileId: null,
          url: URL.createObjectURL(f),
          fileName: f.name,
          contentType: f.type,
          fileSize: f.size,
        }));
        setMessages((prev) => {
          if (selectedUserIdRef.current !== submittedUserId) {
            return prev;
          }

          return [
            {
              id: optimisticId,
              senderId: authUser?.userId,
              content,
              attachments: attachments.length ? attachments : undefined,
              createdAt: new Date().toISOString(),
              isRead: false,
              reactions: [],
              replyToMessageId: submittedReplyToId ?? undefined,
            },
            ...prev,
          ];
        });
      }
      const msgId = res.messageId ?? res.MessageId;
      const serverCreatedAt = res.createdAt ?? res.CreatedAt;
      const createdAtIso = serverCreatedAt
        ? (typeof serverCreatedAt === 'string' ? serverCreatedAt : (serverCreatedAt?.toISOString?.() ?? new Date().toISOString()))
        : null;
      // Replace temp ID and createdAt with server values (sent time for consistent ordering)
      if (submittedConversationStillOpen && (msgId || createdAtIso)) {
        setMessages((prev) => {
          if (selectedUserIdRef.current !== submittedUserId) {
            return prev;
          }

          const updated = prev.map((m) =>
            m.id === optimisticId
              ? { ...m, ...(msgId && { id: String(msgId) }), ...(createdAtIso && { createdAt: createdAtIso }) }
              : m,
          );
          return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
      }
      const preview = hasContent ? content.slice(0, 50) : (hasFiles ? `📎 ${filesToSend.length} file(s)` : '');
      const newConvId = res.conversationId ?? res.ConversationId ? String(res.conversationId ?? res.ConversationId) : null;
      const sentTs = createdAtIso ? new Date(createdAtIso).getTime() : Date.now();
      upsertConversation({
        userId: submittedUserId,
        conversationId: newConvId,
        id: newConvId,
        displayName: submittedDisplayInfo?.displayName,
        avatarUrl: submittedDisplayInfo?.avatarUrl,
        handle: submittedDisplayInfo?.handle,
        lastMessageAt: sentTs,
        lastMessagePreview: preview,
      });
      setConversationsState((prev) => {
        const patch = {
          userId: submittedUserId,
          conversationId: newConvId,
          id: newConvId,
          displayName: submittedDisplayInfo?.displayName,
          avatarUrl: submittedDisplayInfo?.avatarUrl,
          handle: submittedDisplayInfo?.handle,
          lastMessageAt: sentTs,
          lastMessagePreview: preview,
          unreadCount: 0,
        };
        const next = patchConversationAtTop(
          prev,
          newConvId ?? '',
          patch,
          submittedUserId,
        );
        persistConversationList(next.map(conversationEntryFromDisplay));
        return next;
      });
      if (submittedConversationStillOpen && newConvId) {
        setPendingConversationId(newConvId);
        joinConversation(newConvId);
        navigate(messagesPath(newConvId), { replace: true });
      }
      mergeConversationsFromStorage();
    } catch (err) {
      if (isModerationError(err)) {
        setMessageModerationErrorForUser(
          submittedUserId,
          getModerationErrorMessage(err, MESSAGE_MODERATION_FALLBACK),
        );
        return;
      }
      console.error('Send message error:', err);
      toast.error(err?.message || (t('messages.failed_to_send_message')));
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    if (!messageId || !newContent.trim() || editingSubmitting) {return;}
    const submittedConversationId = selectedConversationIdRef.current;
    const submittedContent = newContent.trim();
    setEditingSubmitting(true);
    clearEditModerationErrorForMessage(messageId);
    setEditDraftForMessage(messageId, newContent);
    try {
      const updated = await editMessage(messageId, submittedContent);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)),
      );
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
      }
      clearEditDraftForMessage(messageId);
      clearEditModerationErrorForMessage(messageId);
      const convId = submittedConversationId;
      if (convId) {
        const line = submittedContent.length > 50 ? `${submittedContent.slice(0, 50)}…` : submittedContent;
        setConversationsState((prev) => {
          const next = patchConversationAtTop(prev, String(convId), { lastMessagePreview: line });
          persistConversationList(next.map(conversationEntryFromDisplay));
          return next;
        });
      }
    } catch (err) {
      if (isModerationError(err)) {
        setEditDraftForMessage(messageId, newContent);
        setEditModerationErrorForMessage(messageId, getModerationErrorMessage(err, MESSAGE_EDIT_MODERATION_FALLBACK));
        return;
      }
      console.error('Edit message error:', err);
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || deletingMessageId) {return;}
    const deletedMsg = messages.find((m) => m.id === messageId);
    setDeletingMessageId(messageId);
    // Optimistic update: remove from UI immediately
    setMessages((prev) => {
      const remaining = prev.filter((m) => m.id !== messageId);
      const convId = selectedConversationIdRef.current;
      if (convId) {
        const { preview, at } = deriveConversationMetaFromMessages(remaining);
        setConversationsState((p) => {
          const next = patchConversationAtTop(p, String(convId), {
            lastMessagePreview: preview,
            lastMessageAt: at,
          });
          persistConversationList(next.map(conversationEntryFromDisplay));
          return next;
        });
      }
      return remaining;
    });
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
    }
    clearEditDraftForMessage(messageId);
    clearEditModerationErrorForMessage(messageId);
    setReplyToByUserId((prev) => {
      const next = {};
      for (const [userId, reply] of Object.entries(prev)) {
        if (reply?.id !== messageId) {
          next[userId] = reply;
        }
      }
      return next;
    });
    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Delete message error:', err);
      if (deletedMsg) {
        setMessages((prev) => [...prev, deletedMsg].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
      toast.error(err?.message || (t('messages.failed_to_delete_message')));
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      const updated = await addReaction(messageId, emoji);
      const reactions = updated?.reactions ?? updated?.Reactions ?? null;
      if (reactions !== null && reactions !== undefined) {
        const msgId = String(messageId ?? '');
        setMessages((prev) =>
          prev.map((m) => (String(m?.id ?? '') === msgId ? { ...m, reactions } : m)),
        );
      }
    } catch (err) {
      console.error('Add reaction error:', err);
      toast.error(err?.message ?? (t('messages.could_not_add_reaction')));
    }
  };

  const handleRemoveReaction = async (messageId) => {
    try {
      const updated = await removeReaction(messageId);
      const reactions = updated?.reactions ?? updated?.Reactions ?? null;
      if (reactions !== null && reactions !== undefined) {
        const msgId = String(messageId ?? '');
        setMessages((prev) =>
          prev.map((m) => (String(m?.id ?? '') === msgId ? { ...m, reactions } : m)),
        );
      }
    } catch (err) {
      console.error('Remove reaction error:', err);
      toast.error(err?.message ?? (t('messages.could_not_remove_reaction')));
    }
  };

  const handleShare = (msg) => {
    const text = msg.content || '';
    if (!text) {
      toast.info(t('messages.nothing_to_share'));
      return;
    }
    if (navigator.share) {
      navigator.share({
        text,
        title: t('messages.message_from_vdpconnect'),
      }).then(() => {
        toast.success(t('messages.shared_successfully'), { duration: 1500 });
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(text).then(() => {
            toast.success(t('messages.copied_to_clipboard'), { duration: 1500 });
          }).catch(() => toast.error(t('messages.share_failed')));
        }
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(t('messages.copied_to_clipboard'), { duration: 1500 });
      }).catch(() => toast.error(t('messages.copy_failed')));
    }
  };

  const handleForward = (msg) => {
    setForwardMessage(msg);
    setIsForwardModalOpen(true);
  };

  const handleInsertEmoji = (emoji) => {
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? newMessageText.length;
    const end = input?.selectionEnd ?? newMessageText.length;
    const before = newMessageText.slice(0, start);
    const after = newMessageText.slice(end);
    setNewMessageText(before + emoji + after);
    setEmojiPickerOpen(false);
    setTimeout(() => {
      if (input) {
        input.focus();
        const newPos = start + emoji.length;
        input.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleForwarded = () => {
    toast.success(t('messages.message_forwarded'), { duration: 1500 });
    loadFromApi(true);
  };

  const handleNewMessageSelect = (user, sendResult, messageContent) => {
    if (!user?.userId) {return;}
    const info = { userId: user.userId, displayName: user.name || user.displayName, avatarUrl: user.avatar || null, handle: user.handle || '' };
    setOpenUserInfo(info);
    setSelectedUserId(user.userId);
    setNewMessageText(drafts[user.userId] || '');
    setIsNewMessageOpen(false);
    navigate(messagesPath(user.userId));
    if (!sendResult) {
      syncDraftsOnly();
      mergeConversationsFromStorage();
      return;
    }
    const convId = sendResult?.conversationId ?? sendResult?.ConversationId;
    const msgId = sendResult?.messageId ?? sendResult?.MessageId;
    const preview = messageContent ? messageContent.slice(0, 50) : (t('messages.message_sent'));
    const newConv = {
      ...info,
      conversationId: convId ? String(convId) : undefined,
      id: convId ? String(convId) : undefined,
      lastMessageAt: Date.now(),
      lastMessagePreview: preview,
    };
    upsertConversation(newConv);
    setConversationsState((prev) => {
      const idx = prev.findIndex((c) => c.userId === user.userId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newConv };
        return next;
      }
      return [newConv, ...prev];
    });
    if (convId && msgId) {
      setPendingConversationId(String(convId));
      const serverCreatedAt = sendResult?.createdAt ?? sendResult?.CreatedAt;
      const createdAtIso = serverCreatedAt
        ? (typeof serverCreatedAt === 'string' ? serverCreatedAt : (serverCreatedAt?.toISOString?.() ?? new Date().toISOString()))
        : new Date().toISOString();
      setMessages([{
        id: String(msgId),
        senderId: authUser?.userId,
        content: messageContent || '',
        createdAt: createdAtIso,
        isRead: false,
        reactions: [],
      }]);
      joinConversation(String(convId));
    }
    mergeConversationsFromStorage();
    if (convId) {
      navigate(messagesPath(String(convId)), { replace: true });
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto h-[calc(100dvh-7.5rem)] min-h-[300px]">
        <div className="bg-card rounded-xl border border-border overflow-hidden h-full flex flex-col">
          {signalrReconnecting && (
            <div className="flex-shrink-0 px-4 py-2 bg-amber-500/20 text-amber-800 dark:text-amber-200 text-sm font-medium text-center">
              <LangText path="messages.reconnecting"  />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-0 flex-1">
            {/* Conversations List - hidden on mobile when chat is open */}
            <div className={cn(
              'border-r border-border flex flex-col min-h-0',
              selectedUserId && 'hidden md:flex',
            )}>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-foreground">
                    <LangText path="messages.title"  />
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsNewMessageOpen(true)}
                    title={t('messages.newMessage')}
                    aria-label={t('messages.newMessage')}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <ClearableSearchInput
                  placeholder={t('messages.searchConversations')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  inputClassName="bg-card"
                  clearAriaLabel={t('common.clearSearch')}
                  dataTestId="messages-conversation-search"
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => {
                    const isOnline = isUserOnline(onlineUsers, conv.userId);
                    const isDraft = Boolean(drafts[conv.userId]);
                    const preview = isDraft
                      ? (t('messages.draft')) + (drafts[conv.userId] || '').slice(0, 30)
                      : conv.lastMessagePreview || (t('messages.no_messages_yet'));
                    const time = conv.lastMessageAt
                      ? formatConversationTime(conv.lastMessageAt, { language })
                      : '';
                    const hasUnread = (conv.unreadCount ?? 0) > 0;
                    return (
                      <div
                        key={conv.userId}
                        className={cn(
                          'flex items-start gap-3 p-4 cursor-pointer border-b border-border transition-colors',
                          'hover:bg-accent/50',
                          selectedUserId === conv.userId && 'bg-accent',
                          hasUnread && 'bg-primary/5',
                        )}
                        onClick={() => handleSelectConversation(conv.userId)}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            {conv.avatarUrl ? (
                              <AvatarImage src={conv.avatarUrl} alt={conv.displayName} />
                            ) : null}
                            <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                              {getInitials(conv.displayName || conv.handle)}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 min-w-[10px] min-h-[10px] shrink-0 bg-green-500 border-2 border-background rounded-full" title={t('messages.active_now')} aria-hidden="true" />
                          )}
                          {hasUnread && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground truncate">
                              {conv.displayName || conv.handle || 'User'}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
                          </div>
                          <p className={cn(
                            'text-sm truncate mt-0.5 flex items-center gap-1',
                            isDraft ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground',
                            hasUnread && !isDraft && 'font-medium text-foreground',
                          )}>
                            {isDraft && <FileEdit className="w-3.5 h-3.5 flex-shrink-0" />}
                            {preview}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <LangText path="messages.no_conversations_yet"  />
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area - full width on mobile when conversation selected */}
            <div className={cn(
              'col-span-2 flex flex-col min-h-0 min-w-0 overflow-hidden',
              selectedUserId ? 'flex' : 'hidden md:flex',
            )}>
              {selectedUserId ? (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden flex-shrink-0"
                        onClick={() => {
                          setSelectedUserId(null);
                          setPendingConversationId(null);
                          navigate(messagesListPath, { replace: true, state: {} });
                        }}
                        aria-label={t('messages.back_to_conversations')}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          {selectedAvatar ? (
                            <AvatarImage src={selectedAvatar} alt={selectedDisplayName} />
                          ) : null}
                          <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                            {getInitials(selectedDisplayName)}
                          </AvatarFallback>
                        </Avatar>
                        {isUserOnline(onlineUsers, selectedUserId) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 min-w-[10px] min-h-[10px] shrink-0 bg-green-500 border-2 border-background rounded-full" title={t('messages.active_now')} aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{selectedDisplayName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {typingUserId === selectedUserId
                            ? (
                              <>
                                <span className="inline-flex gap-0.5">
                                  <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                  <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                  <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                </span>
                                {t('messages.typing')}
                              </>
                            )
                            : isUserOnline(onlineUsers, selectedUserId)
                              ? (t('messages.active_now'))
                              : (() => {
                                const lastSeen = selectedConv?.otherLastSeenAt ?? lastSeenByUserId[selectedUserId] ?? lastSeenForOpenUser;
                                if (lastSeen && hasLastSeen(lastSeen)) {
                                  return formatLastSeen(lastSeen, { language });
                                }
                                return t('messages.last_seen');
                              })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {audioVideoCallEnabled && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t('messages.start_voice_call')}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t('messages.start_video_call')}
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t('messages.conversation_actions')}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const slug = displayInfo?.handle ?? displayInfo?.userId;
                              if (slug) {navigate(profilePath(slug));}
                            }}
                            disabled={!displayInfo?.handle && !displayInfo?.userId}
                          >
                            <User className="w-3.5 h-3.5 mr-2" />
                            <LangText path="admin.view_profile_2"  />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div
                    ref={messagesScrollRef}
                    className="flex-1 min-h-0 min-w-0 p-4 overflow-y-auto overflow-x-hidden bg-muted/30"
                    aria-label={t('messages.message_thread')}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      if (el.scrollTop < 80 && hasMoreOlder && !loadingOlder && messages.length > 0) {
                        loadOlderMessages();
                      }
                    }}
                  >
                    {messages.length > 0 ? (
                      <div className="space-y-3 min-w-0 max-w-full">
                        {hasMoreOlder && (
                          <div className="flex justify-center py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground text-xs"
                              disabled={loadingOlder}
                              onClick={loadOlderMessages}
                            >
                              {loadingOlder ? (
                                <LangText path="layout.loading"  />
                              ) : (
                                <LangText path="messages.load_older_messages"  />
                              )}
                            </Button>
                          </div>
                        )}
                        {(() => {
                          const reversed = [...messages].reverse();
                          const msgById = Object.fromEntries(messages.map((m) => [m.id, m]));
                          const groups = [];
                          let currentDateKey = null;
                          for (const msg of reversed) {
                            const d = new Date(msg.createdAt);
                            const dateKey = d.toDateString();
                            if (dateKey !== currentDateKey) {
                              currentDateKey = dateKey;
                              groups.push({ type: 'section', date: msg.createdAt });
                            }
                            groups.push({ type: 'message', msg });
                          }
                          return groups.map((item, idx) =>
                            item.type === 'section' ? (
                              <div key={`section-${idx}`} className="flex justify-center py-2">
                                <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                  {formatMessageSectionDate(item.date, { language })}
                                </span>
                              </div>
                            ) : (
                              <MessageBubble
                                key={item.msg.id}
                                msg={item.msg}
                                replyToMessage={item.msg.replyToMessageId ? msgById[item.msg.replyToMessageId] : null}
                                isMe={item.msg.senderId === authUser?.userId}
                                isUnread={item.msg.senderId !== authUser?.userId && !item.msg.isRead}
                                isEditing={editingMessageId === item.msg.id || Boolean(editModerationErrorsByMessageId[item.msg.id])}
                                editContent={editDraftsByMessageId[item.msg.id] ?? item.msg.content ?? ''}
                                setEditContent={(value) => {
                                  clearEditModerationErrorForMessage(item.msg.id);
                                  setEditDraftForMessage(item.msg.id, value);
                                }}
                                editErrorMessage={editModerationErrorsByMessageId[item.msg.id] ?? ''}
                                onDismissEditError={() => clearEditModerationErrorForMessage(item.msg.id)}
                                editingSubmitting={editingSubmitting}
                                isDeleting={deletingMessageId === item.msg.id}
                                onEdit={(m) => {
                                  setEditDraftForMessage(m.id, m.content || '');
                                  clearEditModerationErrorForMessage(m.id);
                                  setEditingMessageId(m.id);
                                }}
                                onSaveEdit={handleEditMessage}
                                onCancelEdit={() => {
                                  setEditingMessageId(null);
                                  clearEditDraftForMessage(item.msg.id);
                                  clearEditModerationErrorForMessage(item.msg.id);
                                }}
                                onDelete={handleDeleteMessage}
                                onReact={handleAddReaction}
                                onRemoveReaction={handleRemoveReaction}
                                onReply={(m) => setReplyToForUser(selectedUserId, m)}
                                onCopy={() => toast.success(t('messages.copied_to_clipboard'), { duration: 1500 })}
                                onForward={handleForward}
                                onShare={handleShare}
                              />
                            ),
                          );
                        })()}
                        {typingUserId === selectedUserId && (
                          <TypingIndicator displayName={selectedDisplayName} className="mt-2" />
                        )}
                        <div ref={scrollAnchorRef} className="h-0 w-full shrink-0" aria-hidden="true" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        {typingUserId === selectedUserId ? (
                          <TypingIndicator displayName={selectedDisplayName} />
                        ) : (
                          <p className="text-sm">
                            <LangText path="messages.no_messages_in_this_conversation_yet"  />
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 p-4 border-t border-border bg-card">
                    {replyTo && (
                      <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                        <Reply className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            <LangText path="messages.replying_to"  /> {replyTo.senderId === authUser?.userId ? (t('messages.yourself')) : displayInfo?.displayName ?? ''}
                          </p>
                          <p className="text-sm truncate text-foreground">{replyTo.content?.slice(0, 80)}{(replyTo.content?.length ?? 0) > 80 ? '...' : ''}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setReplyToForUser(selectedUserId, null)}
                          disabled={sending}
                          aria-label={t('messages.cancel_reply')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,audio/*,application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,text/plain,.txt,application/zip,.zip,application/x-zip-compressed,.rar,application/vnd.ms-powerpoint,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx"
                      multiple
                      className="hidden"
                      aria-label={t('messages.attach_files_to_message')}
                      onChange={handleFileChange}
                      disabled={sending}
                    />
                    {messageModerationError && (
                      <div className="mb-2">
                        <ModerationAlert
                          title="Message not sent"
                          message={messageModerationError}
                          onDismiss={() => clearMessageModerationErrorForUser(selectedUserId)}
                        />
                      </div>
                    )}
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="relative inline-block">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="h-16 w-16 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                                {file.name}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              disabled={sending}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                              aria-label={tr('time.removeFile', { name: file.name })}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={handleMediaClick}
                        disabled={sending}
                        title={t('messages.attach_file')}
                        aria-label={t('messages.attach_file')}
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <div ref={messageInputWrapperRef} className="relative flex-1">
                        <Input
                          ref={messageInputRef}
                          placeholder={t('messages.type_a_message')}
                          aria-label={t('messages.message')}
                          value={newMessageText}
                          onChange={(e) => {
                            clearMessageModerationErrorForUser(selectedUserId);
                            handleMentionChange(e);
                          }}
                          onKeyDown={(e) => {
                            handleMentionKeyDown(e);
                            if (!e.defaultPrevented && e.key === 'Enter' && !e.shiftKey) {handleSendMessage();}
                          }}
                          onBlur={(e) => {
                            handleMentionBlur(e);
                            if (selectedConversationId) {notifyStoppedTyping(selectedConversationId);}
                          }}
                          disabled={sending}
                          className="w-full bg-card"
                        />
                        {MentionDropdown()}
                      </div>
                      <Popover open={emojiPickerOpen} onOpenChange={(open) => {
                        if (!sending) {setEmojiPickerOpen(open);}
                      }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            disabled={sending}
                            title={t('messages.insert_emoji')}
                            aria-label={t('messages.insert_emoji')}
                          >
                            <Smile className="w-5 h-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <div className="max-h-[200px] overflow-y-auto grid grid-cols-8 gap-0.5">
                            {EXTENDED_REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-base transition-colors"
                                onClick={() => handleInsertEmoji(emoji)}
                                disabled={sending}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        onClick={handleSendMessage}
                        disabled={(!newMessageText.trim() && selectedFiles.length === 0) || sending}
                        size={sending ? 'sm' : 'icon'}
                        className={sending ? 'gap-2 whitespace-nowrap' : ''}
                        aria-label={t('messages.send_message')}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t('messages.checking_and_sending')}</span>
                          </>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Edit className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    <LangText path="messages.emptyTitle"  />
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    <LangText path="messages.emptySubtitle"
                    />
                  </p>
                  <Button onClick={() => setIsNewMessageOpen(true)}>
                    <LangText path="messages.newMessage"  />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NewMessageModal
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
        onConversationStart={handleNewMessageSelect}
        existingConversationUserIds={conversations.map((c) => c.userId)}
      />
      <ForwardMessageModal
        open={isForwardModalOpen}
        onOpenChange={(open) => {
          setIsForwardModalOpen(open);
          if (!open) {setForwardMessage(null);}
        }}
        messageToForward={forwardMessage}
        excludeUserId={selectedUserId}
        onForwarded={handleForwarded}
      />
    </MainLayout>
  );
};

export default Messages;
