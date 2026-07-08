import { describe, expect, it } from 'vitest';
import {
  jobTitleLabel,
  locationLabel,
  partnerCategoryLabel,
  partnerCategoryMatchesFilter,
  pollEndsInLine,
  isDummyPartner,
  isPartnerOrganizationPost,
  resolvePostPartnerTier,
  resolvePostDisplayIdentity,
} from './displayLabels';

describe('displayLabels catalogs', () => {
  it('localizes partner categories', () => {
    expect(partnerCategoryLabel('Association', 'EN')).toBe('Association');
    expect(partnerCategoryLabel('Association', 'DE')).toBe('Verband');
    expect(partnerCategoryLabel('RealEstate', 'DE')).toBe('Immobilien');
  });

  it('matches category filters across aliases', () => {
    expect(partnerCategoryMatchesFilter('Research', 'RealEstate')).toBe(true);
    expect(partnerCategoryMatchesFilter('Bank', 'Association')).toBe(false);
  });

  it('localizes job titles', () => {
    expect(jobTitleLabel('Project Manager', 'DE')).toBe('Projektmanager');
    expect(jobTitleLabel('Project manager', 'EN')).toBe('Project Manager');
    expect(jobTitleLabel('Finanzberater', 'EN')).toBe('Financial Advisor');
    expect(jobTitleLabel('Financial Adviser', 'EN')).toBe('Financial Advisor');
    expect(jobTitleLabel('Financial Adviser', 'DE')).toBe('Finanzberater');
  });

  it('localizes known locations', () => {
    expect(locationLabel('Berlin, Germany', 'DE')).toBe('Berlin, Deutschland');
    expect(locationLabel('Brussels, Belgium', 'DE')).toBe('Brüssel, Belgien');
    expect(locationLabel('Brussels-Capital, Belgium', 'EN')).toBe('Brussels, Belgium');
    expect(locationLabel('Frankfurt, Hesse, Germany', 'EN')).toBe('Frankfurt am Main, Hesse, Germany');
    expect(locationLabel('Frankfurt am Main, Hesse, Germany', 'DE')).toBe(
      'Frankfurt am Main, Hessen, Deutschland',
    );
    expect(locationLabel('Hamburg, Germany', 'DE')).toBe('Hamburg, Deutschland');
  });

  it('filters dummy partner identifiers', () => {
    expect(isDummyPartner({ name: 'sdfg' })).toBe(true);
    expect(isDummyPartner({ handle: 'xcv' })).toBe(true);
    expect(isDummyPartner({ name: 'VDP' })).toBe(false);
  });

  it('passes through unknown catalog values', () => {
    expect(partnerCategoryLabel('Custom Category', 'EN')).toBe('Custom Category');
    expect(locationLabel('Munich, Germany', 'DE')).toBe('Munich, Germany');
  });

  it('formats poll end labels without duplicate suffix for open-ended polls', () => {
    expect(pollEndsInLine('No end date', 'EN')).toBe('No end date');
    expect(pollEndsInLine('No end date remaining', 'EN')).toBe('No end date');
    expect(pollEndsInLine('No end date', 'DE')).toBe('Kein Enddatum');
    expect(pollEndsInLine('Kein Enddatum übrig', 'DE')).toBe('Kein Enddatum');
    expect(pollEndsInLine('3 days', 'EN')).toBe('3 days left');
  });

  it('shows partner tier only on organization posts', () => {
    expect(resolvePostPartnerTier({ author: { name: 'Jane' }, organizationIsPremium: true })).toBeNull();
    expect(resolvePostPartnerTier({
      organizationId: 'org-1',
      organizationIsPremium: true,
    })).toBe('Premium');
    expect(resolvePostPartnerTier({
      organizationId: 'org-1',
      organizationIsPremium: false,
    })).toBe('Standard');
  });

  it('uses organization identity for partner group posts', () => {
    expect(isPartnerOrganizationPost({ organizationId: 'org-1' })).toBe(true);
    expect(isPartnerOrganizationPost({})).toBe(false);

    const identity = resolvePostDisplayIdentity({
      organizationId: '11111111-1111-1111-1111-111111111111',
      organizationName: 'VDP Research',
      organizationHandle: 'vdp-research',
      organizationIsPremium: true,
      author: { name: 'Member User', handle: 'member', isVerified: true },
    });
    expect(identity.name).toBe('VDP Research');
    expect(identity.handle).toBe('vdp-research');
    expect(identity.showUserVerified).toBe(false);
    expect(identity.partnerTier).toBe('Premium');
    expect(identity.navigationPath).toBe('/partners/vdp-research');

    const personal = resolvePostDisplayIdentity({
      author: { name: 'Jane Doe', handle: 'jane', isVerified: true },
    });
    expect(personal.name).toBe('Jane Doe');
    expect(personal.partnerTier).toBeNull();
    expect(personal.showUserVerified).toBe(true);
    expect(personal.navigationPath).toBe('/profile/jane');
  });
});
