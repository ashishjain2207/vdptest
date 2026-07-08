/**
 * Whether the user can publish a new post from the composer.
 * Any one of: text (incl. emoji / hashtags / mentions), attachments, link, location, or a complete poll draft.
 * @param {{
 *   content?: string,
 *   selectedFiles?: File[] | unknown[],
 *   linkUrl?: string,
 *   location?: string,
 *   poll?: { question?: string, optionTexts?: string[] } | null
 * }} state
 */
export function canPublishPostComposer(state) {
  const text = String(state.content ?? '').trim();
  const hasText = text.length > 0;
  const files = state.selectedFiles;
  const hasFiles = Array.isArray(files) && files.length > 0;
  const hasLink = Boolean(String(state.linkUrl ?? '').trim());
  const hasLoc = Boolean(String(state.location ?? '').trim());
  const poll = state.poll;
  const pollReady =
    poll !== null &&
    poll !== undefined &&
    Boolean(String(poll.question ?? '').trim()) &&
    (poll.optionTexts ?? []).filter((t) => String(t ?? '').trim()).length >= 2;
  return hasText || hasFiles || hasLink || hasLoc || pollReady;
}
