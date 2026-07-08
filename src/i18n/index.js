import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { en } from './en';
import { de } from './de';

const dictionaries = { EN: en, DE: de };

/**
 * @param {'EN' | 'DE'} language
 * @param {string} path Dot-separated key path, e.g. "nav.home"
 */
export function t(language, path) {
  if (!path || typeof path !== 'string') {
    return '';
  }
  const dict = dictionaries[language === 'EN' ? 'EN' : 'DE'] ?? de;
  const parts = path.split('.');
  let node = dict;
  for (const part of parts) {
    if (node === null || node === undefined || typeof node !== 'object') {
      return path;
    }
    node = node[part];
  }
  return typeof node === 'string' ? node : path;
}

/**
 * Interpolates `{name}` placeholders in i18n strings.
 * @param {'EN' | 'DE'} language
 * @param {string} path
 * @param {Record<string, string | number>} [params]
 */
export function tParams(language, path, params = {}) {
  let text = t(language, path);
  for (const [key, value] of Object.entries(params)) {
    text = text.split(`{${key}}`).join(String(value));
  }
  return text;
}

/** @returns {(path: string, params?: Record<string, string | number>) => string} */
export function useTParams() {
  const { language } = useLanguage();
  return useCallback(
    (path, params) => tParams(language, path, params),
    [language],
  );
}

/** @returns {(path: string) => string} */
export function useT() {
  const { language } = useLanguage();
  return useCallback((path) => t(language, path), [language]);
}

/**
 * Localized search placeholder.
 * @param {'EN' | 'DE'} language
 * @param {{ en?: string, de?: string }} [subject] Optional search subject (e.g. "partners" / "Partnern")
 */
export function searchPlaceholder(language, subject) {
  if (language === 'EN') {
    const s = subject?.en?.trim();
    return s ? `Search ${s}…` : en.common.search;
  }
  const s = subject?.de?.trim();
  return s ? `Nach ${s} suchen …` : de.common.search;
}

/**
 * Resolves a localized message from i18n keys or legacy EN/DE pairs.
 * @param {'EN' | 'DE'} language
 * @param {{ messageKey?: string, messageParams?: Record<string, string | number>, messageEn?: string, messageDe?: string, message?: string }} source
 */
export function resolveLocalizedMessage(language, source) {
  if (!source) {
    return '';
  }
  if (source.messageKey) {
    return tParams(language, source.messageKey, source.messageParams);
  }
  if (source.messageEn || source.messageDe) {
    return language === 'DE'
      ? (source.messageDe ?? source.messageEn ?? '')
      : (source.messageEn ?? source.messageDe ?? '');
  }
  return source.message ?? '';
}

export { en, de };
