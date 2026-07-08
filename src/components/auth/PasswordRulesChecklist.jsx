import { CheckCircle2, XCircle } from 'lucide-react';
import { useT } from '@/i18n';
import { PASSWORD_RULE_ORDER } from '@/lib/passwordValidation';

/**
 * Live per-rule password checklist (signup, reset password, account settings).
 * @param {{ password: string, validation: { rules?: Record<string, boolean> } | null, className?: string }} props
 */
export function PasswordRulesChecklist({ password, validation, className = '' }) {
  const t = useT();

  if (!password) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 ${className}`.trim()}>
      {PASSWORD_RULE_ORDER.map((ruleId) => {
        const passed = validation?.rules?.[ruleId] ?? false;
        return (
          <p
            key={ruleId}
            className={`text-xs flex items-center gap-1.5 ${passed ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}
          >
            {passed ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
            ) : (
              <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
            )}
            {t(`passwordRules.${ruleId}`)}
          </p>
        );
      })}
    </div>
  );
}
