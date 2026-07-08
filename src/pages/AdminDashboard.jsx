import { useEffect, useState, useMemo } from 'react';
import { isNavigationReload } from '@/lib/navigationReload';
import {
  Building2,
  Calendar,
  Users,
  Megaphone,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { getAdminDashboard } from '@/services/adminDashboardService';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, resolveLocalizedMessage } from '@/i18n';
import { formatRelativeTimeAgo } from '@/lib/displayLabels';
import { formatCountryOptionLabel } from '@/lib/marketCountryCodes';
import {
  filterAdminRecentActivity,
  localizeAdminActivityMessage,
} from '@/lib/adminDashboardDisplay';
import { cn } from '@/lib/utils';

function StatCard({ icon: Icon, labelPath, value, iconClass }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <LangText path={labelPath} />
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            iconClass,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

const defaultStats = {
  totalPartners: 0,
  premiumPartners: 0,
  totalEvents: 0,
  upcomingEvents: 0,
  totalUsers: 0,
  activeUsersLast7Days: 0,
  postsLast7Days: 0,
  activeAdvertisements: 0,
};

/**
 * Platform admin home: stats and activity from GET /api/admin/dashboard.
 */
const AdminDashboard = () => {
  const { language } = useLanguage();
  const t = useT();
  const { country } = useAdminScopeCountry();
  const lang = language === 'DE' ? 'DE' : 'EN';

  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [recentActivity, setRecentActivity] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const reloadPending = !ready && isNavigationReload();

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        const data = await getAdminDashboard();
        if (cancelled) {
          return;
        }
        const s = data?.stats ?? {};
        setStats({
          totalPartners: Number(s.totalPartners) || 0,
          premiumPartners: Number(s.premiumPartners) || 0,
          totalEvents: Number(s.totalEvents) || 0,
          upcomingEvents: Number(s.upcomingEvents) || 0,
          totalUsers: Number(s.totalUsers) || 0,
          activeUsersLast7Days: Number(s.activeUsersLast7Days) || 0,
          postsLast7Days: Number(s.postsLast7Days) || 0,
          activeAdvertisements: Number(s.activeAdvertisements) || 0,
        });
        setRecentActivity(filterAdminRecentActivity(data?.recentActivity));
      } catch {
        if (!cancelled) {
          setStats(defaultStats);
          setRecentActivity([]);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const display = (n) => (reloadPending ? '…' : n);

  const overviewRows = useMemo(
    () => [
      {
        labelPath: 'adminDashboard.premiumPartners',
        value: reloadPending ? '…' : String(stats.premiumPartners),
      },
      {
        labelPath: 'adminDashboard.upcomingEvents',
        value: reloadPending ? '…' : String(stats.upcomingEvents),
      },
      {
        labelPath: 'adminDashboard.activeUsers7d',
        value: reloadPending ? '…' : String(stats.activeUsersLast7Days),
      },
      {
        labelPath: 'adminDashboard.postsThisWeek',
        value: reloadPending ? '…' : String(stats.postsLast7Days),
      },
    ],
    [reloadPending, stats],
  );

  const scopeLabel = country
    ? formatCountryOptionLabel(country, lang)
    : null;

  return (
    <div className="space-y-8 pb-8">
      <p className="text-sm text-muted-foreground -mb-4">
        {scopeLabel ? (
          `${t('admin.showing_data_for')} ${scopeLabel}.`
        ) : (
          <LangText path="admin.showing_data_for_all_markets" />
        )}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          labelPath="adminDashboard.totalPartners"
          value={display(stats.totalPartners)}
          iconClass="bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
        />
        <StatCard
          icon={Calendar}
          labelPath="adminDashboard.totalEvents"
          value={display(stats.totalEvents)}
          iconClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
        />
        <StatCard
          icon={Users}
          labelPath="adminDashboard.totalUsers"
          value={display(stats.totalUsers)}
          iconClass="bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300"
        />
        <StatCard
          icon={Megaphone}
          labelPath="adminDashboard.activeAds"
          value={display(stats.activeAdvertisements)}
          iconClass="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              <LangText path="adminDashboard.recentActivity" />
            </h2>
          </div>
          {reloadPending ? (
            <p className="text-sm text-muted-foreground">
              <LangText path="common.loading" />
            </p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <LangText path="adminDashboard.noRecentActivity" />
            </p>
          ) : (
            <ul className="space-y-4">
              {recentActivity.map((row, i) => {
                const iso = row.occurredAtUtc ?? row.OccurredAtUtc;
                const messageEn = localizeAdminActivityMessage(row.messageEn ?? row.MessageEn ?? '', 'EN');
                const messageDe = localizeAdminActivityMessage(row.messageDe ?? row.MessageDe ?? '', 'DE');
                const rel =
                  typeof iso === 'string' ? formatRelativeTimeAgo(iso, lang) : '';
                return (
                  <li key={i} className="flex flex-col gap-1 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm text-foreground">
                      {resolveLocalizedMessage(lang, { messageEn, messageDe })}
                    </p>
                    {rel ? (
                      <p className="text-xs text-muted-foreground">{rel}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-foreground">
              <LangText path="adminDashboard.platformOverview" />
            </h2>
          </div>
          <ul className="space-y-3">
            {overviewRows.map((row) => (
              <li key={row.labelPath} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  <LangText path={row.labelPath} />
                </span>
                <span className="font-medium tabular-nums text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
