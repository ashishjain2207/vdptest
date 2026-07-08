import { useState, useEffect } from 'react';
import { Button, Avatar, AvatarImage, AvatarFallback } from '@imriva/framework';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Forward, Loader2 } from 'lucide-react';
import { fetchAllMyConnections } from '@/services/connectionService';
import { sendMessage } from '@/services/messageService';
import { UserListItem } from '@/components/user/UserListItem';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { toast } from 'sonner';

export const ForwardMessageModal = ({ open, onOpenChange, messageToForward, excludeUserId, onForwarded }) => {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const content = messageToForward?.content || '';
  const hasAttachments = (messageToForward?.attachments?.length ?? 0) > 0;

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
        const list = excludeUserId ? connections.filter((u) => u.userId !== excludeUserId) : connections;
        setAllConnections(list);
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
  }, [open, excludeUserId]);

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

  const handleForward = async () => {
    if (!selectedUser || !messageToForward || sending) {return;}
    setSending(true);
    try {
      const text = content || (hasAttachments ? (t('messages.attachment_s')) : '');
      await sendMessage(selectedUser.userId, text);
      onForwarded?.(selectedUser);
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('messages.failed_to_send_message');
      toast.error(message);
      console.error('Forward message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setSelectedUser(null);
      setSearchQuery('');
      setAllConnections([]);
    }
    onOpenChange?.(nextOpen);
  };

  if (!messageToForward) {return null;}

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle><LangText path="messages.forward_message"  /></DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
            {content ? (
              <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">{content.slice(0, 150)}{(content?.length ?? 0) > 150 ? '...' : ''}</p>
            ) : hasAttachments ? (
              <span className="text-muted-foreground">📎 {t('messages.attachment_s_2')}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          {!selectedUser ? (
            <>
              <ClearableSearchInput
                placeholder={t('messages.search_connections_for_new_message')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearAriaLabel={t('common.clearSearch')}
                aria-label={t('messages.search_recipient_for_forward')}
                dataTestId="forward-message-user-search"
              />

              <div className="max-h-[240px] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  users.map((user) => (
                    <UserListItem
                      key={user.userId}
                      user={user}
                      onClick={(u) => setSelectedUser(u)}
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  <LangText path="messages.change"  />
                </Button>
              </div>

              <Button onClick={handleForward} disabled={sending} className="w-full gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Forward className="w-4 h-4" />}
                <LangText path="messages.forward"  />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
