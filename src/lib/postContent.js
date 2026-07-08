/**
 * Parses post content into main text, link URL, and location.
 * Matches the format used by CreatePostModal: mainText + link + "📍 " + location.
 * @param {string} content - Raw post content
 * @returns {{ mainText: string, linkUrl: string, location: string }}
 */
export function parsePostContent(content) {
  if (!content || typeof content !== 'string') {
    return { mainText: '', linkUrl: '', location: '' };
  }

  const rawLines = content.split('\n');
  let endIndex = rawLines.length - 1;
  const urlPattern = /^(https?:\/\/|www\.)/i;
  let linkUrl = '';
  let location = '';

  while (endIndex >= 0 && rawLines[endIndex].trim() === '') {
    endIndex--;
  }

  if (endIndex >= 0 && rawLines[endIndex].trim().startsWith('📍 ')) {
    location = rawLines[endIndex].trim().slice(2).trim();
    endIndex--;
    while (endIndex >= 0 && rawLines[endIndex].trim() === '') {
      endIndex--;
    }
  }

  if (endIndex >= 0 && urlPattern.test(rawLines[endIndex].trim())) {
    linkUrl = rawLines[endIndex].trim();
    endIndex--;
    while (endIndex >= 0 && rawLines[endIndex].trim() === '') {
      endIndex--;
    }
  }

  const mainText = rawLines.slice(0, endIndex + 1).join('\n');

  return { mainText, linkUrl, location };
}

/**
 * Builds post content from main text, link, and location (same format as CreatePostModal).
 * @param {{ mainText: string, linkUrl: string, location: string }} parts
 * @returns {string}
 */
export function buildPostContent(parts) {
  let out = (parts.mainText ?? '').trim();
  if ((parts.linkUrl ?? '').trim()) {
    out += (out ? '\n' : '') + parts.linkUrl.trim();
  }
  if ((parts.location ?? '').trim()) {
    out += `${out ? '\n' : ''  }📍 ${parts.location.trim()}`;
  }
  return out.trim() || '';
}

/**
 * Resolves the location to persist when composing/editing a post.
 * The picker keeps a draft while searching; a suggestion may update the draft before `location` is committed.
 * @param {{ location?: string, locationDraft?: string, locationPopoverOpen?: boolean }} state
 * @returns {string}
 */
export function resolveComposerLocation(state) {
  const committed = (state.location ?? '').trim();
  const draft = (state.locationDraft ?? '').trim();
  if (state.locationPopoverOpen) {
    return draft || committed;
  }
  if (draft && committed && draft !== committed) {
    return draft.length >= committed.length ? draft : committed;
  }
  return committed || draft;
}

/**
 * Location to attach when publishing a post.
 * @param {{
 *   location?: string,
 *   locationDraft?: string,
 *   locationPopoverOpen?: boolean,
 *   confirmPickerSelection?: () => { committed?: boolean, value?: string } | null | undefined,
 * }} state
 * @returns {string}
 */
export function resolveLocationForPublish(state) {
  if (state.locationPopoverOpen && state.confirmPickerSelection) {
    const picked = state.confirmPickerSelection();
    if (picked?.committed && picked.value?.trim()) {
      return picked.value.trim();
    }
  }
  return resolveComposerLocation({
    location: state.location,
    locationDraft: state.locationDraft,
    locationPopoverOpen: state.locationPopoverOpen ?? false,
  });
}
