import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { parsePostContent } from '@/lib/postContent';
import {
  getColonLabelParts,
  hasExplicitBoldMarkup,
  shouldAutoBoldTitleLine,
  splitExplicitBoldSegments,
} from '@/lib/postContentFormatting';
import { cn } from '@/lib/utils';

function hrefForStoredLink(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Renders post content with URLs as clickable blue links, location (📍) as maps links,
 * hashtags in blue, and @mentions in blue (Twitter/LinkedIn style).
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const LOCATION_REGEX = /(📍\s*[^\n]+)/g;
const HASHTAG_REGEX = /(#[\w]+)/g;
const MENTION_REGEX = /(@[a-zA-Z0-9_-]+)/g;

function stripHashtagsFromText(text) {
  return text.replace(/#\w+/g, '');
}

function renderInlineText(text, { lineIndex = 0, lineCount = 1, baseKey = 0 } = {}) {
  if (!text) {
    return null;
  }

  if (shouldAutoBoldTitleLine(text, lineIndex, lineCount)) {
    return (
      <strong key={`title-${baseKey}`} className="font-semibold">
        {linkify(text, baseKey)}
      </strong>
    );
  }

  const colonLabel = !hasExplicitBoldMarkup(text) ? getColonLabelParts(text) : null;
  if (colonLabel) {
    return (
      <Fragment key={`colon-${baseKey}`}>
        <strong className="font-semibold">{linkify(colonLabel.label, `${baseKey}-label`)}</strong>
        {linkify(colonLabel.rest, `${baseKey}-rest`)}
      </Fragment>
    );
  }

  const segments = splitExplicitBoldSegments(text);
  if (segments.length === 1 && !segments[0].bold) {
    return linkify(text, baseKey);
  }

  return segments.map((segment, index) => {
    const segmentKey = `${baseKey}-${index}`;
    if (segment.bold) {
      return (
        <strong key={`bold-${segmentKey}`} className="font-semibold">
          {linkify(segment.text, segmentKey)}
        </strong>
      );
    }

    return linkify(segment.text, segmentKey);
  });
}

function renderFormattedText(text, baseKey = 0) {
  if (!text) {
    return null;
  }

  const lines = text.split('\n');
  const lineCount = lines.length;

  return lines.map((line, lineIndex) => (
    <Fragment key={`line-${baseKey}-${lineIndex}`}>
      {lineIndex > 0 ? '\n' : null}
      {renderInlineText(line, { lineIndex, lineCount, baseKey: `${baseKey}-${lineIndex}` })}
    </Fragment>
  ));
}

function linkify(text, baseKey = 0) {
  if (!text || typeof text !== 'string') {return [];}
  const parts = text.split(URL_REGEX).filter(Boolean);
  return parts.map((part, i) => {
    const isUrl = /^https?:\/\//i.test(part) || /^www\./i.test(part);
    if (isUrl) {
      const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
      return (
        <a
          key={`url-${baseKey}-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return linkifyLocation(part, `${baseKey}-${i}`);
  });
}

function linkifyLocation(text, baseKey = 0) {
  const parts = text.split(LOCATION_REGEX).filter(Boolean);
  if (parts.length === 1) {return linkifyHashtag(text, baseKey);}
  return parts.map((part, i) => {
    if (/^📍\s*.+/.test(part)) {
      const location = part.replace(/^📍\s*/, '').trim();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      return (
        <a
          key={`loc-${baseKey}-${i}`}
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit hover:bg-muted/70 hover:rounded px-0.5 -mx-0.5 cursor-pointer transition-colors"
          onClick={(e) => e.stopPropagation()}
          title={`View ${location} on maps`}
        >
          {part}
        </a>
      );
    }
    return linkifyHashtag(part, `${baseKey}-${i}`);
  });
}

/** Renders hashtags in blue, clickable (navigates to explore). */
function linkifyHashtag(text, baseKey = 0) {
  if (!text || typeof text !== 'string') {return null;}
  const parts = text.split(HASHTAG_REGEX);
  if (parts.length === 1) {return linkifyMention(text, baseKey);}
  return parts.map((part, i) => {
    if (/^#[\w]+$/.test(part)) {
      const tag = part.slice(1);
      return (
        <Link
          key={`tag-${baseKey}-${i}`}
          to={`/explore/tag/${encodeURIComponent(tag)}`}
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return linkifyMention(part, `${baseKey}-${i}`);
  });
}

/** Renders @mentions in blue, clickable (navigates to profile). */
function linkifyMention(text, baseKey = 0) {
  if (!text || typeof text !== 'string') {return text;}
  const parts = text.split(MENTION_REGEX);
  if (parts.length === 1) {return text;}
  return parts.map((part, i) => {
    if (/^@[a-zA-Z0-9_-]+$/.test(part)) {
      const handle = part.slice(1);
      return (
        <Link
          key={`mention-${baseKey}-${i}`}
          to={`/profile/${encodeURIComponent(handle)}`}
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

/**
 * When true, hashtags are stripped from the displayed content so they only appear
 * as badges (e.g. in PostCard/PostDetail badge row), not inline.
 *
 * When `linkAndLocationAbove` is true (default), the URL and 📍 location lines stored
 * at the end of the content (see buildPostContent) are shown above the main text.
 *
 * When `mainTextOnly` is true, only the parsed main text is rendered (no embedded link/location);
 * use with `PostEmbeddedLinkFromContent` / `PostEmbeddedLocationFromContent` for ordered layouts.
 */
export function PostContent({
  content,
  className = '',
  hideHashtagsInContent = false,
  linkAndLocationAbove = true,
  mainTextOnly = false,
}) {
  if (!content) {return null;}

  const textClassName = cn('whitespace-pre-wrap break-words', className);
  const parsed = parsePostContent(content);

  if (mainTextOnly) {
    let mainText = parsed.mainText;
    if (hideHashtagsInContent) {
      mainText = stripHashtagsFromText(mainText);
    }
    if (!mainText.trim()) {return null;}
    return (
      <p className={textClassName}>
        {renderFormattedText(mainText)}
      </p>
    );
  }

  const showMeta =
    linkAndLocationAbove && (Boolean(parsed.linkUrl?.trim()) || Boolean(parsed.location?.trim()));

  if (!showMeta) {
    const displayContent = hideHashtagsInContent
      ? stripHashtagsFromText(content)
      : content;
    if (!displayContent.trim()) {return null;}
    return (
      <p className={textClassName}>
        {renderFormattedText(displayContent)}
      </p>
    );
  }

  let mainText = parsed.mainText;
  if (hideHashtagsInContent) {
    mainText = stripHashtagsFromText(mainText);
  }

  if (!mainText.trim() && !parsed.linkUrl?.trim() && !parsed.location?.trim()) {
    return null;
  }

  return (
    <div className="space-y-2">
      {(parsed.linkUrl?.trim() || parsed.location?.trim()) && (
        <div className="space-y-1.5 text-sm">
          {parsed.linkUrl?.trim() ? (
            <div>
              <a
                href={hrefForStoredLink(parsed.linkUrl.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {parsed.linkUrl.trim()}
              </a>
            </div>
          ) : null}
          {parsed.location?.trim() ? (
            <div className="flex items-start gap-1.5 text-muted-foreground">
              <span className="select-none" aria-hidden>📍</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parsed.location.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-inherit hover:bg-muted/70 hover:rounded px-0.5 -mx-0.5 cursor-pointer transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={`View ${parsed.location.trim()} on maps`}
              >
                {parsed.location.trim()}
              </a>
            </div>
          ) : null}
        </div>
      )}
      {mainText.trim() ? (
        <p className={textClassName}>
          {renderFormattedText(mainText)}
        </p>
      ) : null}
    </div>
  );
}

/** Plain link line from structured post content (when no API link preview). */
export function PostEmbeddedLinkFromContent({ content, className = '' }) {
  if (!content) {return null;}
  const { linkUrl } = parsePostContent(content);
  if (!linkUrl?.trim()) {return null;}
  const u = linkUrl.trim();
  return (
    <div className={cn('text-sm', className)}>
      <a
        href={hrefForStoredLink(u)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {u}
      </a>
    </div>
  );
}

/** 📍 line from structured post content (when no API location on the post). */
export function PostEmbeddedLocationFromContent({ content, className = '' }) {
  if (!content) {return null;}
  const { location } = parsePostContent(content);
  if (!location?.trim()) {return null;}
  const loc = location.trim();
  return (
    <div className={cn('flex items-start gap-1.5 text-sm text-muted-foreground', className)}>
      <span className="select-none" aria-hidden>📍</span>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-inherit hover:bg-muted/70 hover:rounded px-0.5 -mx-0.5 cursor-pointer transition-colors"
        onClick={(e) => e.stopPropagation()}
        title={`View ${loc} on maps`}
      >
        {loc}
      </a>
    </div>
  );
}
