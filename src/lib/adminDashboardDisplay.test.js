import { describe, expect, it } from 'vitest';
import {
  filterAdminRecentActivity,
  localizeAdminActivityMessage,
} from './adminDashboardDisplay';

describe('filterAdminRecentActivity', () => {
  it('removes rows with dummy tokens in EN or DE message', () => {
    const rows = [
      { messageEn: 'New partner sdfg registered', messageDe: 'Neuer Partner sdfg' },
      { messageEn: 'User signed up', messageDe: 'Benutzer registriert' },
      { messageEn: 'Ad updated', messageDe: 'Anzeige mit edff' },
    ];
    expect(filterAdminRecentActivity(rows)).toEqual([
      { messageEn: 'User signed up', messageDe: 'Benutzer registriert' },
    ]);
  });
});

describe('localizeAdminActivityMessage', () => {
  it('maps Advertising and Ad banner in EN', () => {
    expect(localizeAdminActivityMessage('New Advertising campaign', 'EN')).toBe(
      'New Ads campaign',
    );
    expect(localizeAdminActivityMessage('Ad banner published', 'EN')).toBe('Ad published');
  });

  it('maps Werbung and Werbebanner in DE', () => {
    expect(localizeAdminActivityMessage('Neue Werbung live', 'DE')).toBe('Neue Anzeigen live');
    expect(localizeAdminActivityMessage('Werbebanner erstellt', 'DE')).toBe('Anzeige erstellt');
  });
});
