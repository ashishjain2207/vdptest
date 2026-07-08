import { describe, expect, it } from 'vitest';
import {
  formatAuditActorDisplay,
  formatAuditAffectedUser,
  formatAuditEntitySummary,
  getAuditDetailItems,
  parseAuditDetails,
} from './auditLogPresentation';

const t = (path) => {
  const map = {
    'adminAuditLogs.unknownActor': 'Unknown user',
    'adminAuditLogs.detailFieldMaintenanceMode': 'Maintenance mode',
    'adminAuditLogs.detailFieldRoleName': 'New role',
    'adminAuditLogs.detailValueEnabled': 'Enabled',
    'adminAuditLogs.detailValueDisabled': 'Disabled',
    'adminAuditLogs.detailFieldReason': 'Reason',
    'adminAuditLogs.entityUser': 'User',
    'adminAuditLogs.entityUserAccount': 'User account',
    'moderation.statusPending': 'Pending',
    'moderation.statusResolved': 'Resolved',
  };
  return map[path] ?? path;
};

describe('parseAuditDetails', () => {
  it('parses JSON objects', () => {
    expect(parseAuditDetails('{"reason":"spam"}')).toEqual({ reason: 'spam' });
  });

  it('wraps non-json text', () => {
    expect(parseAuditDetails('plain text')).toEqual({ _raw: 'plain text' });
  });
});

describe('formatAuditActorDisplay', () => {
  it('prefers display name', () => {
    expect(formatAuditActorDisplay('Laura', t)).toBe('Laura');
  });

  it('falls back when name missing', () => {
    expect(formatAuditActorDisplay('', t)).toBe('Unknown user');
  });
});

describe('getAuditDetailItems', () => {
  it('formats known audit fields', () => {
    const items = getAuditDetailItems(
      { maintenanceMode: true, roleName: 'VdpConnect.Admin' },
      t,
      'EN',
    );
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'maintenanceMode', value: 'Enabled' }),
        expect.objectContaining({ key: 'roleName', value: 'Platform admin' }),
      ]),
    );
  });

  it('omits technical content ids from friendly rows', () => {
    const items = getAuditDetailItems(
      { contentId: 'post-guid', reason: 'spam' },
      t,
      'EN',
    );
    expect(items.some((item) => item.key === 'contentId')).toBe(false);
    expect(items.some((item) => item.key === 'reason' && item.value === 'spam')).toBe(true);
  });

  it('formats moderation status audit fields with moderation i18n keys', () => {
    const items = getAuditDetailItems(
      { previousStatus: 'Pending', newStatus: 'Resolved' },
      t,
      'EN',
    );
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'previousStatus', value: 'Pending' }),
        expect.objectContaining({ key: 'newStatus', value: 'Resolved' }),
      ]),
    );
  });
});

describe('formatAuditEntitySummary', () => {
  it('shows affected user name for User entity without exposing raw id', () => {
    expect(formatAuditEntitySummary(
      { entityType: 'User', entityDisplayName: 'Laura Smith' },
      () => 'User account',
      t,
    )).toBe('Laura Smith');
  });

  it('falls back to user account label when name missing', () => {
    expect(formatAuditEntitySummary({ entityType: 'User' }, () => 'User', t)).toBe('User account');
  });
});

describe('formatAuditAffectedUser', () => {
  it('returns affected user display name', () => {
    expect(formatAuditAffectedUser({ entityType: 'User', entityDisplayName: 'Laura Smith' }, t)).toBe('Laura Smith');
  });

  it('returns null for non-user entities', () => {
    expect(formatAuditAffectedUser({ entityType: 'PlatformSettings' }, t)).toBeNull();
  });
});
