import { describe, it, expect } from 'vitest';
import {
  getColonLabelParts,
  hasExplicitBoldMarkup,
  shouldAutoBoldTitleLine,
  splitExplicitBoldSegments,
} from './postContentFormatting.js';

describe('postContentFormatting', () => {
  it('detects explicit bold markup', () => {
    expect(hasExplicitBoldMarkup('plain text')).toBe(false);
    expect(hasExplicitBoldMarkup('**bold**')).toBe(true);
    expect(hasExplicitBoldMarkup('__bold__')).toBe(true);
  });

  it('auto-bolds only the first line when multiple lines are present', () => {
    expect(shouldAutoBoldTitleLine('Market update', 0, 2)).toBe(true);
    expect(shouldAutoBoldTitleLine('Market update', 1, 2)).toBe(false);
    expect(shouldAutoBoldTitleLine('Market update', 0, 1)).toBe(false);
    expect(shouldAutoBoldTitleLine('**Market update**', 0, 2)).toBe(false);
  });

  it('splits explicit bold segments without dropping surrounding text', () => {
    expect(splitExplicitBoldSegments('plain')).toEqual([{ text: 'plain', bold: false }]);
    expect(splitExplicitBoldSegments('before **bold** after')).toEqual([
      { text: 'before ', bold: false },
      { text: 'bold', bold: true },
      { text: ' after', bold: false },
    ]);
    expect(splitExplicitBoldSegments('__bold__')).toEqual([{ text: 'bold', bold: true }]);
  });

  it('splits colon labels for key phrases', () => {
    expect(getColonLabelParts('Key takeaway: values remain stable')).toEqual({
      label: 'Key takeaway: ',
      rest: 'values remain stable',
    });
    expect(getColonLabelParts('No colon here')).toBeNull();
    expect(getColonLabelParts('A: missing space')).toBeNull();
  });
});
