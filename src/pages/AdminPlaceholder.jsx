import { LangText } from '@/components/ui/LangText';

/**
 * @param {{ titlePath: string, bodyPath: string }} props
 */
export function AdminPlaceholder({ titlePath, bodyPath }) {
  return (
    <div className="max-w-2xl space-y-3 pb-12">
      <h1 className="partner-admin-heading">
        <LangText path={titlePath} />
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        <LangText path={bodyPath} />
      </p>
    </div>
  );
}
