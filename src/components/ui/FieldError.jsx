/**
 * Inline validation message for form fields (replaces relying on asterisks alone).
 * @param {{ id: string; message?: string }} props
 */
export function FieldError({ id, message }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} role="alert" className="text-sm text-destructive mt-1">
      {message}
    </p>
  );
}
