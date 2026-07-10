import { test } from '../fixtures/auth';
import { RegistrationPage } from '../pages/RegistrationPage';
import { loadTestData } from '../utils/testData';

type ValidRegistrationData = {
  fullName: string;
  usernamePrefix: string;
  emailPrefix: string;
  emailDomain: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
};

type DuplicateRegistrationData = {
  fullName: string;
  username: string;
  emailPrefix: string;
  emailDomain: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
};

const validRegistrationData = loadTestData<ValidRegistrationData>('validUserRegistrationData.json');
const duplicateRegistrationData = loadTestData<DuplicateRegistrationData>('duplicateUsernameData.json');

test.describe('registration', () => {
  test('Successful user registration with valid inputs', async ({ page, normalUserAuth }) => {
    void normalUserAuth;
    const registrationPage = new RegistrationPage(page);
    const suffix = Date.now();

    await registrationPage.goto();
    await registrationPage.fillForm({
      fullName: validRegistrationData.fullName,
      username: `${validRegistrationData.usernamePrefix}${suffix}`,
      email: `${validRegistrationData.emailPrefix}+${suffix}@${validRegistrationData.emailDomain}`,
      password: validRegistrationData.password,
      confirmPassword: validRegistrationData.confirmPassword,
      dateOfBirth: validRegistrationData.dateOfBirth,
    });
    await registrationPage.acceptTerms();
    await registrationPage.submit();

    await registrationPage.expectRegistrationSuccess();
  });

  test('Registration fails with duplicate username', async ({ page, normalUserAuth }) => {
    void normalUserAuth;
    const registrationPage = new RegistrationPage(page);
    const suffix = Date.now();

    await registrationPage.goto();
    await registrationPage.fillForm({
      fullName: duplicateRegistrationData.fullName,
      username: duplicateRegistrationData.username,
      email: `${duplicateRegistrationData.emailPrefix}+${suffix}@${duplicateRegistrationData.emailDomain}`,
      password: duplicateRegistrationData.password,
      confirmPassword: duplicateRegistrationData.confirmPassword,
      dateOfBirth: duplicateRegistrationData.dateOfBirth,
    });
    await registrationPage.acceptTerms();
    await registrationPage.submit();

    await registrationPage.expectDuplicateUsernameError();
  });
});
