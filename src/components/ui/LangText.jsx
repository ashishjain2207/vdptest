import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

/**
 * Renders localized UI text from i18n keys (en.js / de.js).
 * @param {{ path: string, className?: string, as?: keyof JSX.IntrinsicElements }} props
 */
export function LangText({ path, className, as: Component = 'span' }) {
  const { language } = useLanguage();

  if (!path) {
    return null;
  }

  return (
    <Component className={className}>
      {t(language, path)}
    </Component>
  );
}
