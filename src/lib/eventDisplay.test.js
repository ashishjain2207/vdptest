import { describe, expect, it } from 'vitest';
import {
  localizeEventTitle,
  localizeEventDescription,
  eventOrganizerByLine,
  localizeEventLocation,
  isDummyEvent,
} from './eventDisplay';

describe('eventDisplay', () => {
  it('filters dummy event titles', () => {
    expect(isDummyEvent({ title: 'edfd' })).toBe(true);
    expect(isDummyEvent({ title: 'CRE Summit' })).toBe(false);
  });

  it('localizes known title', () => {
    expect(localizeEventTitle('Smart Real Estate Investment', 'DE')).toBe(
      'Intelligente Immobilieninvestitionen',
    );
    expect(localizeEventTitle('Smart Real Estate Investment', 'EN')).toBe(
      'Smart Real Estate Investing',
    );
    expect(localizeEventTitle('The modern real estate market.', 'DE')).toBe(
      'Der moderne Immobilienmarkt.',
    );
  });

  it('localizes known description', () => {
    expect(
      localizeEventDescription(
        'Learn how digital solutions are transforming real estate and creating new investment opportunities.',
        'DE',
      ),
    ).toContain('digitale Lösungen');
  });

  it('formats organizer by line', () => {
    expect(eventOrganizerByLine('European Real Estate Association', 'DE')).toBe(
      'von European Real Estate Association',
    );
    expect(eventOrganizerByLine('European Real Estate Association', 'EN')).toBe(
      'by European Real Estate Association',
    );
  });

  it('localizes virtual location', () => {
    expect(localizeEventLocation('Virtual Event', true, 'DE')).toBe('Online-Veranstaltung');
    expect(localizeEventLocation('', true, 'EN')).toBe('Online event');
  });
});
