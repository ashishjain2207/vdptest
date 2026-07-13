# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> onboarding >> Onboarding flow completes successfully with optional steps skipped
- Location: e2e/tests/onboarding.spec.ts:12:3

# Error details

```
Error: No locator matched any selector: [data-testid="onboarding-complete"], [data-testid="onboarding-finish"]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - button "DE" [ref=e5] [cursor=pointer]:
      - text: DE
      - img
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img "vdpConnect logo" [ref=e8]
        - heading "Profil vervollständigen" [level=1] [ref=e9]
        - paragraph [ref=e10]: Wählen Sie Ihr Heimatland, um Feed und marktbezogene Inhalte zu nutzen. Entdeckung und Beiträge sind auf diesen Markt beschränkt.
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Heimatland *
          - combobox "Heimatland" [disabled] [ref=e15]
        - button "Weiter" [ref=e16] [cursor=pointer]:
          - generic [ref=e17]: Weiter
```

# Test source

```ts
  1  | import { type Locator, type Page } from '@playwright/test';
  2  | 
  3  | async function exists(locator: Locator): Promise<boolean> {
  4  |   return (await locator.count()) > 0;
  5  | }
  6  | 
  7  | export async function firstExistingLocator(page: Page, selectors: string[]): Promise<Locator> {
  8  |   for (const selector of selectors) {
  9  |     const locator = page.locator(selector).first();
  10 |     if (await exists(locator)) {
  11 |       return locator;
  12 |     }
  13 |   }
  14 | 
> 15 |   throw new Error(`No locator matched any selector: ${selectors.join(', ')}`);
     |         ^ Error: No locator matched any selector: [data-testid="onboarding-complete"], [data-testid="onboarding-finish"]
  16 | }
  17 | 
  18 | export async function fillFirst(page: Page, selectors: string[], value: string): Promise<void> {
  19 |   const locator = await firstExistingLocator(page, selectors);
  20 |   await locator.fill(value);
  21 | }
  22 | 
  23 | export async function clickFirst(page: Page, selectors: string[]): Promise<void> {
  24 |   const locator = await firstExistingLocator(page, selectors);
  25 |   await locator.click();
  26 | }
  27 | 
  28 | export async function checkFirst(page: Page, selectors: string[]): Promise<void> {
  29 |   const locator = await firstExistingLocator(page, selectors);
  30 |   await locator.check();
  31 | }
  32 | 
  33 | export async function isAnyVisible(page: Page, selectors: string[]): Promise<boolean> {
  34 |   for (const selector of selectors) {
  35 |     const locator = page.locator(selector).first();
  36 |     if ((await locator.count()) > 0 && (await locator.isVisible())) {
  37 |       return true;
  38 |     }
  39 |   }
  40 |   return false;
  41 | }
  42 | 
```