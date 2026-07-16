import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { expect, requireEnv, test } from '../fixtures/test';

function buildUnknownEmail(existingEmail: string): string {
  const [localPart = 'user', domain = 'example.test'] = existingEmail.split('@');
  const sanitizedLocal = localPart.replace(/[^a-zA-Z0-9._-]/g, '') || 'user';
  return `${sanitizedLocal}.unknown.${Date.now()}@${domain}`;
}

test('Password reset gives a security-safe response for existing and unknown email addresses @medium', async ({ page }) => {
  const forgotPasswordPage = new ForgotPasswordPage(page);
  const existingEmail = requireEnv('E2E_USER_EMAIL');
  const unknownEmail = buildUnknownEmail(existingEmail);

  await forgotPasswordPage.open();
  await forgotPasswordPage.submitEmail(existingEmail);
  const existingAccountMessage = await forgotPasswordPage.readSuccessMessage();

  await forgotPasswordPage.open();
  await forgotPasswordPage.submitEmail(unknownEmail);
  const unknownAccountMessage = await forgotPasswordPage.readSuccessMessage();

  expect(existingAccountMessage).toBe(unknownAccountMessage);
});
