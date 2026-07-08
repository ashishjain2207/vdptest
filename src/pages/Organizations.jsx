import { MainLayout } from '@/components/layout/MainLayout';
import { OrgCard } from '@/components/organization/OrgCard';
import { organizations } from '@/data/organizations';
import { Filter } from 'lucide-react';
import { Button, Badge } from '@imriva/framework';
import { useState, useMemo } from 'react';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

const FILTER_OPTIONS = [
  { id: 'All', labelKey: 'organizationsPage.filterAll' },
  { id: 'Brokerage', labelKey: 'organizationsPage.filterBrokerage' },
  { id: 'Developer', labelKey: 'organizationsPage.filterDeveloper' },
  { id: 'Research Lab', labelKey: 'organizationsPage.filterResearchLab' },
  { id: 'Fund', labelKey: 'organizationsPage.filterFund' },
  { id: 'PropTech', labelKey: 'organizationsPage.filterPropTech' },
];

const Organizations = () => {
  const t = useT();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrganizations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return organizations.filter((org) => {
      if (activeFilter !== 'All' && org.category !== activeFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const name = String(org.name ?? '').toLowerCase();
      const desc = String(org.description ?? '').toLowerCase();
      const loc = String(org.location ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q) || loc.includes(q);
    });
  }, [activeFilter, searchQuery]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            <LangText path="common.organizations"  />
          </h1>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ClearableSearchInput
            className="flex-1"
            inputClassName="bg-card"
            placeholder={t('common.search_organizations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            clearAriaLabel={t('common.clearSearch')}
            dataTestId="organizations-search"
          />
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            <LangText path="common.filters"  />
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <Badge
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'secondary'}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => setActiveFilter(filter.id)}
            >
              {t(filter.labelKey)}
            </Badge>
          ))}
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrganizations.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center">
          <Button variant="outline">
            <LangText path="common.load_more"  />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Organizations;
