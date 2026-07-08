import { useState, useEffect, useRef } from 'react';
import { Button, Avatar, AvatarImage, AvatarFallback, Textarea } from '@imriva/framework';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Loader2 } from 'lucide-react';
import { fetchAllMyConnections } from '@/services/connectionService';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { sendMessage } from '@/services/messageService';
import { UserListItem } from '@/components/user/UserListItem';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { useAuth } from '@/contexts/AuthContext';
import { ModerationAlert } from '@/components/common/ModerationAlert';
import { getModerationErrorMessage, isModerationError } from '@/utils/moderationError';
import { toast } from 'sonner';

const MESSAGE_MODERATION_FALLBACK = 'This message couldn’t be sent because it may violate platform rules. Please edit it and try again.';

export const NewMessageModal = ({ open, onOpenChange, onConversationStart, existingConversationUserIds = [] }) => {
  const t = useT();
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageByUserId, setMessageByUserId] = useState({});
  const [users, setUsers] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [moderationErrorsByUserId, setModerationErrorsByUserId] = useState({});
  const messageRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const selectedUserId = selectedUser?.userId ?? null;
  const message = selectedUserId ? messageByUserId[selectedUserId] ?? '' : '';
  const moderationError = selectedUserId ? moderationErrorsByUserId[selectedUserId] ?? '' : '';
  const hasConversationWith = (userId) =>
    (Array.isArray(existingConversationUserIds) && existingConversationUserIds.includes(userId)) ||
    (existingConversationUserIds instanceof Set && existingConversationUserIds.has(userId));
  const setMessageForUser = (userId, nextMessage) => {
    if (!userId) {return;}
    setMessageByUserId((prev) => {
      const next = { ...prev };
      if (nextMessage) {
        next[userId] = nextMessage;
      } else {
        delete next[userId];
      }
      return next;
    });
  };
  const clearModerationErrorForUser = (userId) => {
    if (!userId) {return;}
    setModerationErrorsByUserId((prev) => {
      if (!prev[userId]) {return prev;}
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };
  const setModerationErrorForUser = (userId, errorMessage) => {
    if (!userId) {return;}
    setModerationErrorsByUserId((prev) => ({
      ...prev,
      [userId]: errorMessage,
    }));
  };
  const { handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, handleBlur: handleMentionBlur, MentionDropdown } = useMentionSuggestions({
    content: message,
    setContent: (nextMessage) => setMessageForUser(selectedUserId, nextMessage),
    inputRef: messageRef,
    currentUserId: authUser?.userId,
  });

  useEffect(() => {
    if (!open) {return;}
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchAllMyConnections(100);
        if (cancelled) {return;}
        const connections = rows.map((u) => ({
          id: u.userId,
          userId: u.userId,
          name: u.displayName || u.handle,
          handle: u.handle,
          avatar: u.avatarUrl || null,
        }));
        setAllConnections(connections);
      } catch {
        if (!cancelled) {
          setAllConnections([]);
        }
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {return;}
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? allConnections.filter((u) =>
        (u.name || '').toLowerCase().includes(q)
        || (u.handle || '').toLowerCase().includes(q))
      : allConnections;
    setUsers(filtered);
  }, [open, searchQuery, allConnections]);

  const handleSend = async () => {
    if (!selectedUser || !message.trim() || sending) {return;}
    const submittedUser = selectedUser;
    const submittedUserId = selectedUser.userId;
    const submittedMessage = message.trim();
    setSending(true);
    clearModerationErrorForUser(submittedUserId);
    setSendError('');
    try {
      const res = await sendMessage(submittedUserId, submittedMessage);
      setMessageForUser(submittedUserId, '');
      onConversationStart?.(submittedUser, res, submittedMessage);
      onOpenChange(false);
      setSelectedUser(null);
      setSearchQuery('');
    } catch (err) {
      if (isModerationError(err)) {
        setModerationErrorForUser(submittedUserId, getModerationErrorMessage(err, MESSAGE_MODERATION_FALLBACK));
      } else {
        const errorMessage = err instanceof Error ? err.message : t('messages.failed_to_send_message');
        setSendError(errorMessage);
        toast.error(errorMessage);
        console.error('Send message error:', err);
      }
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setSelectedUser(null);
      setMessageByUserId({});
      setSearchQuery('');
      setModerationErrorsByUserId({});
      setSendError('');
      setAllConnections([]);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle><LangText path="messages.new_message"  /></DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedUser ? (
            <>
              <ClearableSearchInput
                placeholder={t('messages.search_connections_for_new_message')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearAriaLabel={t('common.clearSearch')}
                aria-label={t('messages.search_connections_for_new_message')}
                dataTestId="new-message-user-search"
              />

              <div className="max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  users.map((user) => (
                    <UserListItem
                      key={user.userId}
                      user={user}
                      onClick={(selectedUserParam) => {
                        if (hasConversationWith(selectedUserParam.userId)) {
                          onConversationStart?.(selectedUserParam);
                          onOpenChange(false);
                          setSelectedUser(null);
                          setMessageByUserId({});
                          setSearchQuery('');
                        } else {
                          setSelectedUser(selectedUserParam);
                        }
                      }}
                    />
                  ))
                )}
                {!loading && users.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    <LangText
                      path={allConnections.length === 0 ? 'messages.no_connections_to_message' : 'messages.no_connections_match_search'}
                    />
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                <Avatar className="w-10 h-10">
                  {selectedUser.avatar ? (
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  ) : null}
                  <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.handle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  disabled={sending}
                >
                  <LangText path="messages.change"  />
                </Button>
              </div>

              <div className="relative">
                <Textarea
                  ref={messageRef}
                  placeholder={t('messages.write_your_message')}
                  value={message}
                  onChange={(e) => {
                    clearModerationErrorForUser(selectedUserId);
                    handleMentionChange(e);
                  }}
                  onKeyDown={handleMentionKeyDown}
                  onBlur={handleMentionBlur}
                  rows={4}
                  disabled={sending}
                />
                {MentionDropdown()}
              </div>

              {moderationError && (
                <ModerationAlert
                  title="Message not sent"
                  message={moderationError}
                  onDismiss={() => clearModerationErrorForUser(selectedUserId)}
                />
              )}

              {sendError && !moderationError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {sendError}
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <LangText path={sending ? 'messages.checking_and_sending' : 'messages.send_message'} />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
