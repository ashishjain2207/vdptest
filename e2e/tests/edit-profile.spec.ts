import { EditProfilePage } from '../pages/EditProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { expect, loginWithDefaultUser, test } from '../fixtures/test';

test('User updates profile information and cancels an unsaved edit @medium', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const editProfilePage = new EditProfilePage(page);

  await loginWithDefaultUser(page, loginPage);
  await editProfilePage.open();

  const marker = Date.now();
  const updatedName = `E2E Updated Name ${marker}`;
  const updatedBio = `E2E updated bio ${marker}`;
  const updatedLocation = `Berlin ${marker}`;
  const updatedWebsite = `https://example.test/profile-${marker}`;

  await editProfilePage.nameInput.fill(updatedName);
  await editProfilePage.bioInput.fill(updatedBio);
  await editProfilePage.locationInput.fill(updatedLocation);
  await page.locator('#website').fill(updatedWebsite);

  const actionButtons = page.locator('div.flex.justify-end.gap-3 button');
  const cancelButton = actionButtons.nth(0);
  const saveButton = actionButtons.nth(1);

  await saveButton.click();
  await expect(editProfilePage.bioInput).toHaveValue(updatedBio);

  const profileHandle = (await editProfilePage.handleInput.inputValue()).trim();
  if (profileHandle) {
    await page.goto(`/profile/${profileHandle}`);
    await expect(page.locator('main')).toContainText(updatedBio);
  }

  await editProfilePage.open();
  const unsavedBio = `E2E unsaved bio ${marker}`;
  await editProfilePage.bioInput.fill(unsavedBio);
  await cancelButton.click();
  await expect(editProfilePage.bioInput).toHaveValue(updatedBio);
});

test('Edit Profile rejects invalid required, URL, length, and image values @medium', async () => {
  test.skip(
    true,
    'Missing selector in src/: explicit field-level validation selectors for invalid URL/length/image errors are not provided in scoped selector sources',
  );
});
