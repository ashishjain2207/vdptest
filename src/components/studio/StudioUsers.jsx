import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@imriva/framework';
import { UserPlus, MoreVertical, Shield, Ban, Mail, Loader2 } from 'lucide-react';
import { searchUsers } from '@/services';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

const StudioUsers = () => {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(searchQuery.trim(), 1, 50);
        if (!cancelled) {
          setUsers((res.data || []).map((u) => ({
            id: u.userId,
            userId: u.userId,
            name: u.displayName || u.handle,
            handle: u.handle,
            avatar: u.avatarUrl || null,
            isVerified: u.isVerified,
            followers: u.followersCount ?? 0,
            role: u.role,
            location: u.location,
          })));
        }
      } catch {
        if (!cancelled) {setUsers([]);}
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    }, searchQuery ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <ClearableSearchInput
          className="flex-1 max-w-md"
          placeholder={t('common.search_users')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearAriaLabel={t('common.clearSearch')}
          dataTestId="studio-users-search"
        />
        <Button variant="outline"><LangText path="common.filters"  /></Button>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          <LangText path="common.invite_user"  />
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">2,847</p>
            <p className="text-sm text-muted-foreground"><LangText path="adminDashboard.totalUsers"  /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">1,234</p>
            <p className="text-sm text-muted-foreground"><LangText path="common.active_today"  /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">89</p>
            <p className="text-sm text-muted-foreground"><LangText path="common.new_this_week"  /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">12</p>
            <p className="text-sm text-muted-foreground"><LangText path="common.suspended"  /></p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle><LangText path="nav.usersAndRoles"  /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8"><LangText path="messages.no_users_found"  /></p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{user.name}</p>
                        {user.isVerified && (
                          <Badge variant="secondary" className="text-xs"><LangText path="common.verified"  /></Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.handle}{user.role ? ` · ${user.role}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{user.followers.toLocaleString()} <LangText path="people.followers"  /></p>
                      {user.location && <p className="text-muted-foreground">{user.location}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title={t('common.send_email')} aria-label={t('common.send_email')}>
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={t('common.make_admin')} aria-label={t('common.make_admin')}>
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={t('common.suspend_user')} aria-label={t('common.suspend_user')}>
                        <Ban className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={t('common.user_actions')}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudioUsers;
