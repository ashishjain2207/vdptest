import { describe, expect, it } from 'vitest';
import {
  isDummyAdText,
  localizeAdTitle,
  localizeAdBody,
  localizeAdCta,
  localizeAdvertiserName,
  isPublicAdRenderable,
} from './adDisplay';

describe('adDisplay', () => {
  it('flags dummy keyboard mash', () => {
    expect(isDummyAdText('asdfghjkl')).toBe(true);
    expect(isDummyAdText('hfgcgvhbj')).toBe(true);
    expect(isDummyAdText('rghjkl,jmnbf campaign')).toBe(true);
    expect(isDummyAdText('wertyujhgfd')).toBe(true);
    expect(isDummyAdText('DreamHome')).toBe(false);
  });

  it('localizes known ad copy', () => {
    expect(localizeAdTitle('Modern Luxury Living at Its Finest', 'DE')).toBe(
      'Modernes Luxuswohnen auf höchstem Niveau',
    );
    expect(localizeAdvertiserName('DREAMHOME')).toBe('DreamHome');
    expect(localizeAdCta('Learn more', 'DE')).toBe('Mehr erfahren');
    expect(
      localizeAdBody(
        'Discover modern residential projects with premium amenities.',
        'EN',
      ),
    ).toContain('Discover modern residential');
  });

  it('hides dummy-only ads', () => {
    expect(
      isPublicAdRenderable({ title: 'asdfghjkl', body: 'asdfghjkl' }, 'EN'),
    ).toBe(false);
    expect(
      isPublicAdRenderable({ title: 'Valid Title', body: 'asdfghjkl' }, 'EN'),
    ).toBe(true);
  });
});
