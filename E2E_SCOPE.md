# E2E Scope

## Purpose
- **App name + stack:** `vite_react_shadcn` (Vite + React + React Router + `@imriva/framework`)
- IMRIVA reads this file first before opening `src/`.
- Scenarios come from ClickUp at GENERATE SCRIPTS; this file documents repository structure/selectors only.

## E2E status today
- `e2e/` exists: **no**
- IMRIVA will scaffold `e2e/` on GENERATE SCRIPTS.

## Read order
1. `E2E_SCOPE.md`
2. `.cursorignore`
3. `src/App.jsx`
4. `src/components/ProtectedRoute.jsx`
5. `src/pages/Signup.jsx`
6. `src/pages/Login.jsx`
7. `src/pages/Onboarding.jsx`
8. `src/pages/Index.jsx`
9. `src/components/post/PostCard.jsx`
10. `src/pages/PostDetail.jsx`
11. `src/pages/Profile.jsx`
12. `src/components/settings/SettingsSidebar.jsx`
13. `package.json` (only when scripts/deps need clarification)

## Selector sources (read-only)

| Path | Contains | Selector hints |
|------|----------|----------------|
| `src/pages/Signup.jsx` | Registration form | `id="name"`, `id="username"`, `id="signup-home-country"`, `id="email"`, `id="password"`, `aria-describedby="signup-name-err"`, `aria-describedby="signup-username-err"`, `aria-describedby="signup-home-country-err"`, `aria-describedby="signup-email-err"`, `aria-describedby="signup-password-err"` |
| `src/pages/Login.jsx` | Login form + required validation | `id="email"`, `id="password"`, `aria-describedby="login-email-err"`, `aria-describedby="login-password-err"`, `to="/forgot-password"` |
| `src/components/ProtectedRoute.jsx` | Guest protection for authenticated routes | `return <Navigate to="/login" state={{ from: location }} replace />` |
| `src/components/layout/MainLayout.jsx` | Authenticated shell / feed landmark | `<main>` landmark wraps app content |
| `src/components/post/CreatePost.jsx` | Inline composer on home feed | `aria-label={label('addImage')}`, `aria-label={label('addLink')}`, `aria-label={label('createPoll')}`, `aria-label={label('addLocation')}`, `aria-label={label('addEmoji')}`, composer `aria-label={toastT('posts.post_content')}` |
| `src/components/post/CreatePostModal.jsx` | Modal composer with visibility selector | `SelectItem value="public"`, `SelectItem value="followers"`, `SelectItem value="private"`, composer `aria-label={toastT('posts.post_content')}`, file input `type="file"` with `aria-label={label('addImage')}` |
| `src/components/post/PostCard.jsx` | Feed post actions + owner/non-owner menus | `aria-label={actionLabels.comment}`, `aria-label={actionLabels.repost}`, `aria-label={actionLabels.like}`, `aria-label={actionLabels.share}`, `aria-label={actionLabels.bookmark}`, `aria-pressed={isLiked}`, `aria-pressed={isReposted}`, `aria-pressed={isBookmarked}`, menu `aria-label={t('posts.post_actions')}`, inline comments wrapper `data-comments-section` |
| `src/components/post/PartnerPostDeleteDialog.jsx` | Delete confirmation dialog | `AlertDialog`, reason field `id={reasonFieldId}`, `name="deletionReason"`, `aria-required="true"`, `aria-invalid={showReasonError}`, validation message `role="alert"` |
| `src/pages/PostDetail.jsx` + `src/components/post/CommentItem.jsx` | Comment add/reply/edit/delete controls | comment textarea `placeholder={t('posts.write_a_comment')}`, post button text `t('posts.post_comment')`, comment action menu `aria-label={t('posts.comment_actions')}` |
| `src/pages/Profile.jsx` | Follow/unfollow + profile shell | follow button text toggles `t('people.follow')` / `t('layout.following')`; message button disabled when not connected (`aria-disabled={!isConnected}`) |
| `src/components/settings/SettingsSidebar.jsx` + `src/components/layout/Header.jsx` + `src/components/layout/Sidebar.jsx` | Settings navigation + logout controls | sidebar links `to="/settings/profile"` and `to="/settings/account"`; logout button text `<LangText path="admin.log_out" />`; header dropdown item navigates `navigate('/settings/account')` then logout item |
| `src/pages/Onboarding.jsx` + `src/components/profile/HomeCountryOnboardingForm.jsx` | Home-country onboarding gate | onboarding form uses `idPrefix="onboarding-home-country"`; country field id resolves to `onboarding-home-country-required`; combobox `role="combobox"` from `CountryMarketCombobox` |
| `src/pages/AccessDenied.jsx` | Access-denied fallback UI | heading `<LangText path="errors.access_denied" />`, links `to="/posts"` and `to="/support?type=support"` |

Do not modify files under `src/`.

## Scenario coverage

| Scenario | src/ path(s) | Selector hints |
|----------|-------------|----------------|
| [high\|positive] New user registers with valid required information — first step: Open the registration page. | `src/pages/Signup.jsx`, `src/pages/Onboarding.jsx`, `src/components/profile/HomeCountryOnboardingForm.jsx`, `src/components/layout/MainLayout.jsx` | Registration fields use `id="name"`, `id="username"`, `id="signup-home-country"`, `id="email"`, `id="password"`; onboarding country input id `onboarding-home-country-required`; post-auth destination uses `<main>` landmark in `MainLayout`. |
| [high\|validation] Registration rejects missing and malformed required values — first step: Submit the registration form without entering values or accepting the terms. | `src/pages/Signup.jsx` | Field-level validation binds with `aria-describedby="signup-name-err"`, `signup-username-err`, `signup-home-country-err`, `signup-email-err`, `signup-password-err`; errors are rendered via `<FieldError id="...">`. |
| [high\|negative] Registration rejects duplicate username and email — first step: Open the registration page. | `src/pages/Signup.jsx` | Duplicate/invalid username is surfaced in `FieldError id="signup-username-err"` and username invalid state (`aria-invalid` on `id="username"`); duplicate email branch triggers toast via `toast.error(...)`. |
| [high\|positive] Registered user logs in and reaches the home feed — first step: Open the login page. | `src/pages/Login.jsx`, `src/App.jsx`, `src/components/layout/MainLayout.jsx` | Login fields use `id="email"` and `id="password"`; successful auth routes to `/posts` (`App.jsx` route path); authenticated shell is discoverable via `<main>` landmark. |
| [high\|negative] Login rejects empty fields and invalid credentials — first step: Submit the login form with both fields empty. | `src/pages/Login.jsx`, `src/components/layout/MainLayout.jsx` | Required field assertions map to `aria-describedby="login-email-err"` and `aria-describedby="login-password-err"`; auth errors render in the top error container when `error` is set; feed `<main>` should stay absent after rejection. |
| [high\|positive] Authenticated user views and incrementally loads the personalized feed — first step: Open the home feed. | `src/pages/Index.jsx`, `src/components/post/PostCard.jsx` | Feed is at `/posts`; incremental loading uses sentinel `ref={setFeedSentinelRef}` and loading text `LangText path="common.loading_more"`; end state text `LangText path="feed.allCaughtUp"`; per-card action controls expose stable `aria-label` values (like/repost/comment/share/bookmark). |
| [high\|permission] Guest is denied access to the home feed — first step: Navigate directly to the home-feed URL. | `src/components/ProtectedRoute.jsx`, `src/pages/Login.jsx` | Guard redirects with `Navigate to="/login" state={{ from: location }} replace`; assert login form (`id="email"`, `id="password"`) appears and feed `<main>` content is not present. |
| [high\|positive] User likes, saves, opens comments, and opens an author profile from a feed post — first step: Open the home feed and locate the seeded post. | `src/components/post/PostCard.jsx` | Use post action buttons by `aria-label={actionLabels.like}`, `aria-label={actionLabels.bookmark}`, `aria-label={actionLabels.comment}`; verify toggles with `aria-pressed`; open author profile via header/avatar `role="button"` click target. |
| [high\|positive] User creates a valid text post with selected visibility — first step: Open the post composer. | `src/components/post/CreatePost.jsx`, `src/components/post/CreatePostModal.jsx` | Inline composer text area uses `aria-label={toastT('posts.post_content')}` and publish button text `common.publish`; visibility selector exists in modal composer with `SelectItem value="public"`, `value="followers"`, `value="private"`. |
| [high\|positive] User creates supported image, video, and link posts — first step: Create a post with valid text and a supported image. | `src/components/post/CreatePost.jsx`, `src/components/post/CreatePostModal.jsx` | Media attachment input is `type="file"` with `aria-label={label('addImage')}`; link input uses `aria-label={toastT('posts.link_url')}`; attached media previews are rendered via `LocalPostMediaFileThumb`. |
| [high\|validation] Post composer rejects empty, oversized, and unsupported submissions — first step: Open the composer and attempt to submit without text or media. | `src/components/post/CreatePost.jsx`, `src/components/post/CreatePostModal.jsx` | Publish button is disabled when `!canSubmit`; over-limit state tracked by `MAX_LENGTH` counter and destructive style; moderation-level failure renders `ModerationAlert title="Post not published"`; unsupported media validation emits toast errors from `mergeValidatedPostMediaFiles(...)`. |
| [high\|permission] Post visibility restricts followers-only and private content — first step: As the author, create a unique Followers only post and a unique Private post. | `src/components/post/CreatePostModal.jsx`, `src/components/post/PostCard.jsx`, `src/pages/Profile.jsx` | Visibility options are literal `SelectItem value="followers"` and `SelectItem value="private"`; content verification can use feed cards (`<article>` in `PostCard`) and profile tabs in `Profile.jsx` for authorized/unauthorized surfaces. |
| [high\|positive] Post owner edits and then deletes a post with confirmation — first step: Open the owned post's more-options menu. | `src/components/post/PostCard.jsx`, `src/components/post/PartnerPostDeleteDialog.jsx`, `src/pages/PostDetail.jsx` | Open menu with `aria-label={t('posts.post_actions')}` then choose `LangText path="messages.edit"` / `LangText path="messages.delete"`; confirmation uses `AlertDialog` with destructive submit action and optional reason field `id={reasonFieldId}`. |
| [high\|permission] Non-owner cannot edit or delete another user's post — first step: Open the other user's post. | `src/components/post/PostCard.jsx` | Menu actions are conditionally rendered; for non-author, assert absence of `messages.edit` and `messages.delete` entries while post card remains visible (`<article ...>`). |
| [high\|positive] User adds a comment, replies, and deletes their own comment — first step: Open the post detail page and record the displayed comment count. | `src/pages/PostDetail.jsx`, `src/components/post/CommentItem.jsx` | Comment compose uses textarea `placeholder={t('posts.write_a_comment')}` and submit text `t('posts.post_comment')`; reply button text `messages.reply`; delete action appears in comment menu `aria-label={t('posts.comment_actions')}`. |
| [high\|validation] Comment form rejects empty and over-limit text — first step: Attempt to submit an empty comment. | `src/pages/PostDetail.jsx`, `src/components/post/CommentItem.jsx` | Empty-submit is blocked by `if (!postId || !replyContent.trim()) return;` and submit button `disabled={!replyContent.trim() \|\| submittingComment}`; reply submit is similarly guarded in `CommentItem` via `disabled={!replyContent.trim() \|\| submitting}`. |
| [high\|permission] Non-admin user cannot delete another user's comment — first step: Open the post detail page. | `src/pages/PostDetail.jsx`, `src/components/post/CommentItem.jsx` | Delete availability is gated by `canDelete={Boolean(authUser?.userId && (comment.authorId === authUser.userId \|\| isPostAuthor))}`; assert `messages.delete` option is absent in `aria-label={t('posts.comment_actions')}` menu for unauthorized viewer. |
| [high\|positive] User follows and unfollows another user — first step: Open the target user's profile and record the follower count. | `src/pages/Profile.jsx` | Follow control text toggles between `t('people.follow')` and `t('layout.following')`; follower counters are rendered in stats section with clickable followers tile (`role="button"` when count > 0). |
| [high\|permission] Private profile content is restricted from unauthorized viewers — first step: As the unauthorized authenticated viewer, open the private profile. | `src/pages/Profile.jsx`, `src/pages/AccessDenied.jsx` | Profile shell is rendered via `MainLayout`; permission fallback UI includes `LangText path="errors.access_denied"` with links to `/posts` and `/support?type=support`; no dedicated `data-testid` for private-profile state is currently present in `Profile.jsx`. |
| [high\|positive] User accesses account and privacy settings and logs out — first step: Open account settings. | `src/components/settings/SettingsSidebar.jsx`, `src/components/layout/Header.jsx`, `src/components/layout/Sidebar.jsx`, `src/pages/settings/AccountSettings.jsx` | Account settings path is `/settings/account` (header dropdown calls `navigate('/settings/account')`); sidebar nav uses `to="/settings/profile"` and `to="/settings/account"`; logout control is `<LangText path="admin.log_out" />` in both settings sidebar and app header/sidebar menus. |
| [medium\|positive] New user completes onboarding and reaches the feed | `src/pages/Onboarding.jsx`, `src/components/profile/HomeCountryOnboardingForm.jsx` | Onboarding country picker field id `onboarding-home-country-required`; submit button text `profile.continue`; redirects via `navigate(returnPath, { replace: true })`. |
| [medium\|positive] User updates profile information and cancels an unsaved edit | `src/pages/settings/ProfileSettings.jsx` | Profile fields use ids like `id="name"`, `id="handle"`, `id="bio"`, `id="location"`; cancel button text `common.cancel`; save button text `common.saveChanges`. |
| [medium\|positive] User searches for users, posts, and hashtags | `src/components/layout/Header.jsx`, `src/pages/Index.jsx` | Global search input passes `dataTestId="header-global-search"` and `aria-label={t('layout.search_posts_and_people')}`; hashtag navigation uses links like `to={\`/explore/tag/\${encodeURIComponent(tag.slice(1))}\`}`. |

## Routes / navigation
- **Router file:** `src/App.jsx`
- **Relevant routes discovered in source:**
  - `/signup`
  - `/login`
  - `/onboarding`
  - `/posts`
  - `/posts/:postId`
  - `/profile/:userId`
  - `/settings`
  - `/settings/profile`
  - `/settings/account`
  - `/access-denied`
  - `/support`

## Write scope (IMRIVA creates at GENERATE SCRIPTS — do not create now)
- `e2e/tests/`
- `e2e/pages/`
- `e2e/fixtures/`
- `e2e/test-data/`
- `e2e/utils/`
- `e2e/playwright.config.ts`
- `e2e/README.md` — secrets/variables + local setup steps **before CI/CD** (not in this PR)
- `.github/workflows/playwright-e2e.yml`

## Do not explore
- Paths listed in `.cursorignore`:
  - `package-lock.json`
  - `node_modules/`
  - `dist/`
  - `build/`
  - `coverage/`
  - `.next/`
  - `.cache/`
  - `test-results/`
  - `playwright-report/`
  - `vitest-full-output.txt`
  - `vitest-result.txt`
  - `vitest*.log`
- Folders not listed under **Selector sources** (`docs/`, `scripts/`, `public/`, `src/test/`).
- Whole-repo grep or reading every file under `src/`.
