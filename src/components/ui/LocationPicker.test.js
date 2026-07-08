import { describe, it, expect } from 'vitest';
import { isLocationPickerSuggestionsTarget, pickBestLocationSuggestion } from './LocationPicker.jsx';

describe('pickBestLocationSuggestion', () => {
  it('matches partial query to a suggestion display name', () => {
    const suggestions = [{ display: 'Japan, Asia' }, { display: 'Jakarta, Indonesia' }];
    expect(pickBestLocationSuggestion('jap', suggestions)?.display).toBe('Japan, Asia');
  });

  it('matches hydera to Hyderabad suggestions', () => {
    const suggestions = [
      { display: 'Hyderabad, Telangana, India' },
      { display: 'Hyderabad, Sindh, Pakistan' },
    ];
    expect(pickBestLocationSuggestion('hydera', suggestions)?.display).toBe(
      'Hyderabad, Telangana, India',
    );
  });
});

describe('isLocationPickerSuggestionsTarget', () => {
  it('returns true for elements inside the suggestions dropdown', () => {
    const root = document.createElement('div');
    root.setAttribute('data-location-picker-suggestions', '');
    const button = document.createElement('button');
    root.appendChild(button);
    document.body.appendChild(root);

    expect(isLocationPickerSuggestionsTarget(button)).toBe(true);

    document.body.removeChild(root);
  });

  it('returns false for unrelated elements', () => {
    const el = document.createElement('span');
    expect(isLocationPickerSuggestionsTarget(el)).toBe(false);
  });
});
