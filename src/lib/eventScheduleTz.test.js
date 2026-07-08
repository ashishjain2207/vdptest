import { describe, expect, it } from 'vitest';
import { zonedLocalToUtcIso } from './eventScheduleTz.js';

describe('eventScheduleTz', () => {
  it('serializes zoned local time as an explicit UTC instant', () => {
    expect(zonedLocalToUtcIso('2026-06-01', '16:00', 'Europe/Berlin')).toBe('2026-06-01T14:00:00Z');
  });
});
