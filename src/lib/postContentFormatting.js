const EXPLICIT_BOLD_REGEX = /\*\*(.+?)\*\*|__(.+?)__/g;

/** @param {string} line */
export function hasExplicitBoldMarkup(line) {
  return /\*\*|__/.test(line);
}

/**
 * @param {string} line
 * @param {number} lineIndex
 * @param {number} lineCount
 */
export function shouldAutoBoldTitleLine(line, lineIndex, lineCount) {
  if (lineIndex !== 0 || lineCount < 2 || hasExplicitBoldMarkup(line)) {
    return false;
  }

  const trimmed = line.trim();
  return trimmed.length >= 2 && trimmed.length <= 120;
}

/**
 * Bold a short label before the first ": " on a line.
 * @param {string} line
 * @returns {{ label: string, rest: string } | null}
 */
export function getColonLabelParts(line) {
  const colonIndex = line.indexOf(': ');
  if (colonIndex < 2 || colonIndex > 80) {
    return null;
  }

  return {
    label: line.slice(0, colonIndex + 2),
    rest: line.slice(colonIndex + 2),
  };
}

/**
 * @param {string} text
 * @returns {Array<{ text: string, bold: boolean }>}
 */
export function splitExplicitBoldSegments(text) {
  if (!text) {
    return [{ text: '', bold: false }];
  }

  const segments = [];
  let lastIndex = 0;
  let match = EXPLICIT_BOLD_REGEX.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }

    segments.push({ text: match[1] ?? match[2] ?? '', bold: true });
    lastIndex = match.index + match[0].length;
    match = EXPLICIT_BOLD_REGEX.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}
