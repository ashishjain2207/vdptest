import { describe, it, expect } from 'vitest';
import { parsePostContent, resolveComposerLocation, resolveLocationForPublish } from './postContent.js';

describe('parsePostContent', () => {
  it('preserves line breaks and spacing in main text', () => {
    const content = '  Title line\n\nBody with spacing\nhttps://example.com';
    expect(parsePostContent(content)).toEqual({
      mainText: '  Title line\n\nBody with spacing',
      linkUrl: 'https://example.com',
      location: '',
    });
  });

  it('resolveComposerLocation prefers draft while popover is open', () => {
    expect(
      resolveComposerLocation({
        location: 'jap',
        locationDraft: 'Japan, Asia',
        locationPopoverOpen: true,
      }),
    ).toBe('Japan, Asia');
  });

  it('resolveComposerLocation falls back to draft when committed location is empty', () => {
    expect(
      resolveComposerLocation({
        location: '',
        locationDraft: 'Berlin, Germany',
        locationPopoverOpen: false,
      }),
    ).toBe('Berlin, Germany');
  });

  it('resolveComposerLocation prefers full suggestion over partial committed text when popover is closed', () => {
    expect(
      resolveComposerLocation({
        location: 'jap',
        locationDraft: 'Japan, Asia',
        locationPopoverOpen: false,
      }),
    ).toBe('Japan, Asia');
  });

  it('resolveLocationForPublish uses committed location when popover is closed', () => {
    expect(
      resolveLocationForPublish({
        location: 'Hyderabad, Telangana, India',
        locationDraft: 'hydera',
        locationPopoverOpen: false,
      }),
    ).toBe('Hyderabad, Telangana, India');
  });

  it('resolveLocationForPublish prefers open picker over committed location on publish', () => {
    const confirmPickerSelection = () => ({ committed: true, value: 'Berlin, Germany' });
    expect(
      resolveLocationForPublish({
        location: 'Hyderabad, Telangana, India',
        locationDraft: 'Berlin, Germany',
        locationPopoverOpen: true,
        confirmPickerSelection,
      }),
    ).toBe('Berlin, Germany');
  });

  it('resolveLocationForPublish falls back to draft when popover is open and picker does not commit', () => {
    expect(
      resolveLocationForPublish({
        location: 'Hyderabad, Telangana, India',
        locationDraft: 'Berlin, Germany',
        locationPopoverOpen: true,
        confirmPickerSelection: () => ({ committed: false, value: '' }),
      }),
    ).toBe('Berlin, Germany');
  });

  it('still extracts trailing location and link metadata', () => {
    const content = 'Main text\nhttps://example.com\n📍 Berlin';
    expect(parsePostContent(content)).toEqual({
      mainText: 'Main text',
      linkUrl: 'https://example.com',
      location: 'Berlin',
    });
  });
});
