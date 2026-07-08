import { describe, expect, it } from 'vitest';
import { mapCountriesToPickerEntries } from '@/hooks/useCountryPickerCatalog.js';

describe('mapCountriesToPickerEntries', () => {
  it('sorts by localized label and uses API names', () => {
    const entries = mapCountriesToPickerEntries(
      [
        { code: 'US', name: 'United States', clusterCode: 'NA' },
        { code: 'IN', name: 'India', clusterCode: 'APAC' },
      ],
      'EN',
    );

    expect(entries).toEqual([
      { code: 'IN', label: 'India' },
      { code: 'US', label: 'United States' },
    ]);
  });
});
