# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comments.spec.ts >> comments >> User cannot delete another user's comment unless admin
- Location: e2e/tests/comments.spec.ts:56:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="comment-item"], [data-testid="comment-card"], article').filter({ hasText: 'Another user\'s comment should not be deletable' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="comment-item"], [data-testid="comment-card"], article').filter({ hasText: 'Another user\'s comment should not be deletable' }).first()

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- complementary:
  - link "VDPConnect home":
    - /url: /posts
    - img "vdpConnect logo"
  - navigation:
    - list:
      - listitem:
        - link "Startseite":
          - /url: /posts
          - img
          - text: Startseite
      - listitem:
        - link "Entdecken":
          - /url: /explore
          - img
          - text: Entdecken
      - listitem:
        - link "Personen":
          - /url: /people
          - img
          - text: Personen
      - listitem:
        - link "Partner":
          - /url: /partners
          - img
          - text: Partner
      - listitem:
        - link "Veranstaltungen":
          - /url: /events
          - img
          - text: Veranstaltungen
      - listitem:
        - link "Unterhaltungen":
          - /url: /messages
          - img
          - text: Unterhaltungen
      - listitem:
        - link "Benachrichtigungen":
          - /url: /notifications
          - img
          - text: Benachrichtigungen 4
      - listitem:
        - link "Gespeicherte Beiträge":
          - /url: /bookmarks
          - img
          - text: Gespeicherte Beiträge
      - listitem:
        - link "Einstellungen":
          - /url: /settings
          - img
          - text: Einstellungen
- banner:
  - textbox "Nach Beiträgen und Personen suchen …"
  - button "Beitrag erstellen":
    - img
    - text: Beitrag erstellen
  - button "DE":
    - text: DE
    - img
  - button "Notifications":
    - img
    - text: "4"
  - link "Rückmeldung senden":
    - /url: /support?type=feedback
    - text: Rückmeldung
  - button "Ashish":
    - img "Ashish"
- main:
  - img "Ashish"
  - paragraph: Ashish
  - textbox "Beitragsinhalt":
    - /placeholder: Was möchten Sie teilen?
  - button "Bild hinzufügen":
    - img
  - button "Link hinzufügen":
    - img
  - button "Umfrage erstellen":
    - img
  - button "Standort hinzufügen":
    - img
  - button "Emoji hinzufügen":
    - img
  - button "Veröffentlichen" [disabled]:
    - img
    - text: Veröffentlichen
  - img
  - heading "Trendthemen" [level=2]
  - paragraph: Aktuell keine Trends.
  - button "Weitere anzeigen":
    - text: Weitere anzeigen
    - img
  - img
  - heading "Personen, die Sie kennen könnten" [level=2]
  - text: SM Srinath Mamidala
  - paragraph: "@srinath_mamidala"
  - paragraph: Beliebt auf VdpConnect
  - button "Folgen"
  - button "Alle ansehen":
    - text: Alle ansehen
    - img
  - img
  - heading "Empfohlene Partner" [level=2]
  - button "Weitere Partner entdecken":
    - text: Weitere Partner entdecken
    - img
  - img
  - heading "Anstehende Veranstaltungen" [level=2]
  - paragraph: Noch keine kommenden Veranstaltungen.
  - button "Alle Veranstaltungen":
    - text: Alle Veranstaltungen
    - img
  - link "Nutzungsbedingungen":
    - /url: /terms
  - link "Datenschutzrichtlinie":
    - /url: /privacy
  - link "Cookie-Richtlinie":
    - /url: /cookie
  - link "Erklärung zur Barrierefreiheit":
    - /url: /accessibility
  - link "Unterstützung":
    - /url: /support?type=support
  - paragraph: © 2026 vdpResearch
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from '@playwright/test';
  2  | import { clickFirst, fillFirst } from '../utils/locators';
  3  | 
  4  | export class PostDetailPage {
  5  |   constructor(private readonly page: Page) {}
  6  | 
  7  |   async gotoPost(postId: string): Promise<void> {
  8  |     await this.page.goto(`/posts/${encodeURIComponent(postId)}`);
  9  |   }
  10 | 
  11 |   private postContainerByText(contentSnippet: string): Locator {
  12 |     return this.page
  13 |       .locator('[data-testid="post-card"], [data-testid="post-detail"], article, [data-post-id]')
  14 |       .filter({ hasText: contentSnippet })
  15 |       .first();
  16 |   }
  17 | 
  18 |   async editPostByContent(originalText: string, updatedText: string): Promise<void> {
  19 |     const post = this.postContainerByText(originalText);
  20 |     await expect(post).toBeVisible();
  21 |     const actions = post.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
  22 |     if (await actions.count()) {
  23 |       await actions.click();
  24 |     }
  25 |     await clickFirst(this.page, ['[data-testid="post-edit-button"]', '[role="menuitem"]:has-text("Edit")', 'button:has-text("Edit")']);
  26 |     await fillFirst(this.page, ['[data-testid="post-edit-input"]', '[data-testid="post-textarea"]', 'textarea[name="content"]', 'textarea'], updatedText);
  27 |     await clickFirst(this.page, ['[data-testid="post-edit-save"]', 'button:has-text("Save")', 'button:has-text("Update")']);
  28 |   }
  29 | 
  30 |   async deletePostByContent(contentSnippet: string): Promise<void> {
  31 |     const post = this.postContainerByText(contentSnippet);
  32 |     await expect(post).toBeVisible();
  33 |     const actions = post.locator('[data-testid="post-actions-trigger"], button[aria-label*="more"], button:has-text("...")').first();
  34 |     if (await actions.count()) {
  35 |       await actions.click();
  36 |     }
  37 |     await clickFirst(this.page, ['[data-testid="post-delete-button"]', '[role="menuitem"]:has-text("Delete")', 'button:has-text("Delete")']);
  38 |     await clickFirst(this.page, ['[data-testid="confirm-delete"]', 'button:has-text("Confirm")', 'button:has-text("Delete")']);
  39 |   }
  40 | 
  41 |   async expectPostContent(content: string): Promise<void> {
  42 |     await expect(this.page.getByText(content)).toBeVisible();
  43 |   }
  44 | 
  45 |   async expectPostNotVisible(content: string): Promise<void> {
  46 |     await expect(this.page.getByText(content)).toHaveCount(0);
  47 |   }
  48 | 
  49 |   async addComment(text: string): Promise<void> {
  50 |     await fillFirst(this.page, ['[data-testid="comment-input"]', 'textarea[name="comment"]', 'textarea[placeholder*="comment"]'], text);
  51 |     await clickFirst(this.page, ['[data-testid="comment-submit"]', 'button:has-text("Add Comment")', 'button:has-text("Submit")']);
  52 |   }
  53 | 
  54 |   async expectCommentVisible(text: string): Promise<void> {
  55 |     await expect(this.page.getByText(text)).toBeVisible();
  56 |   }
  57 | 
  58 |   async expectCommentValidationError(): Promise<void> {
  59 |     await expect(this.page.getByText(/comment|required|empty/i)).toBeVisible();
  60 |   }
  61 | 
  62 |   async deleteOwnComment(text: string): Promise<void> {
  63 |     const comment = this.page
  64 |       .locator('[data-testid="comment-item"], [data-testid="comment-card"], article')
  65 |       .filter({ hasText: text })
  66 |       .first();
  67 |     await expect(comment).toBeVisible();
  68 |     const deleteButton = comment.locator('[data-testid="comment-delete"], button:has-text("Delete")').first();
  69 |     await deleteButton.click();
  70 | 
  71 |     const confirmDelete = this.page.locator('[data-testid="confirm-delete"], button:has-text("Confirm"), button:has-text("Delete")').first();
  72 |     if (await confirmDelete.count()) {
  73 |       await confirmDelete.click();
  74 |     }
  75 |   }
  76 | 
  77 |   async expectNoDeleteForForeignComment(text: string): Promise<void> {
  78 |     const comment = this.page
  79 |       .locator('[data-testid="comment-item"], [data-testid="comment-card"], article')
  80 |       .filter({ hasText: text })
  81 |       .first();
> 82 |     await expect(comment).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  83 |     await expect(comment.locator('[data-testid="comment-delete"], button:has-text("Delete")')).toHaveCount(0);
  84 |   }
  85 | }
  86 | 
```