import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get initials from a display name (e.g. "Navya Kolli" -> "NK", "Vina" -> "VI").
 * Used for avatar fallback when user has no profile picture.
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') {return 'U';}
  const trimmed = name.trim();
  if (!trimmed) {return 'U';}
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Parse an ISO date string as UTC. If the string has no timezone (no Z or +/-offset),
 * append 'Z' so it's parsed as UTC instead of local time (fixes IST vs German timezone bug).
 */
export function parseUtcIso(iso) {
  if (!iso) {return null;}
  if (typeof iso !== 'string') {return iso instanceof Date ? iso : null;}
  const s = iso.trim();
  if (!s) {return null;}
  // Already has timezone: ends with Z, or has + / - offset (e.g. +05:30, -08:00)
  if (/Z$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) {return new Date(s);}
  return new Date(`${s  }Z`);
}

/** Format a date as relative time (e.g. "1h ago", "2d ago"). Uses UTC to be timezone-independent. */
export function formatRelativeTime(dateOrIso) {
  if (!dateOrIso) {return '';}
  const date = typeof dateOrIso === 'string' ? parseUtcIso(dateOrIso) : dateOrIso;
  if (!date) {return '';}
  const diff = Date.now() - date.getTime();
  if (diff < 60000) {return 'Just now';}
  if (diff < 3600000) {return `${Math.floor(diff / 60000)}m ago`;}
  if (diff < 86400000) {return `${Math.floor(diff / 3600000)}h ago`;}
  if (diff < 604800000) {return `${Math.floor(diff / 86400000)}d ago`;}
  if (diff < 2592000000) {return `${Math.floor(diff / 604800000)}w ago`;}
  return date.toLocaleDateString();
}
