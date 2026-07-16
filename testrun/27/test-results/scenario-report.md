# Scenario Report

- Total scenarios: 35
- Passed: 6
- Failed: 4
- Timed out: 2
- Interrupted: 0
- Skipped: 23
- High priority: 20
- Medium priority: 13
- Low priority: 2
- Unlabeled: 0

| Priority | Status | Scenario | File |
| --- | --- | --- | --- |
| high | passed | User accesses account and privacy settings and logs out | account-settings.spec.ts |
| medium | skipped | Admin moderation is available to admins and denied to normal users | admin-moderation.spec.ts |
| high | passed | Registered user logs in and reaches the home feed | authentication.spec.ts |
| high | passed | Login rejects empty fields and invalid credentials | authentication.spec.ts |
| high | skipped | User adds a comment, replies, and deletes their own comment | comments.spec.ts |
| high | skipped | Comment form rejects empty and over-limit text | comments.spec.ts |
| high | skipped | Non-admin user cannot delete another user's comment | comments.spec.ts |
| medium | timedOut | User updates profile information and cancels an unsaved edit | edit-profile.spec.ts |
| medium | skipped | Edit Profile rejects invalid required, URL, length, and image values | edit-profile.spec.ts |
| high | skipped | User follows and unfollows another user | follow.spec.ts |
| medium | failed | Guest navigates the landing page and public information pages | guest-navigation.spec.ts |
| high | failed | Authenticated user views and incrementally loads the personalized feed | home-feed.spec.ts |
| high | passed | Guest is denied access to the home feed | home-feed.spec.ts |
| medium | skipped | Registered users exchange a private message | messaging.spec.ts |
| medium | skipped | User views a notification produced by an in-scope social action | notifications.spec.ts |
| medium | skipped | New user completes onboarding and reaches the feed | onboarding.spec.ts |
| low | skipped | User skips optional onboarding steps | onboarding.spec.ts |
| medium | skipped | Onboarding rejects a non-image profile-picture upload | onboarding.spec.ts |
| medium | passed | Password reset gives a security-safe response for existing and unknown email addresses | password-reset.spec.ts |
| high | skipped | User creates a valid text post with selected visibility | post-creation.spec.ts |
| high | skipped | User creates supported image, video, and link posts | post-creation.spec.ts |
| high | skipped | Post composer rejects empty, oversized, and unsupported submissions | post-creation.spec.ts |
| medium | skipped | User cancels post creation without publishing the draft | post-creation.spec.ts |
| high | skipped | User likes, saves, opens comments, and opens an author profile from a feed post | post-interactions.spec.ts |
| medium | skipped | User shares and reports a feed post | post-interactions.spec.ts |
| high | skipped | Post owner edits and then deletes a post with confirmation | post-management.spec.ts |
| high | skipped | Non-owner cannot edit or delete another user's post | post-management.spec.ts |
| high | skipped | Post visibility restricts followers-only and private content | post-visibility.spec.ts |
| high | skipped | Private profile content is restricted from unauthorized viewers | profile-privacy.spec.ts |
| medium | skipped | User views own profile, public profiles, lists, and individual posts | profile.spec.ts |
| high | passed | New user registers with valid required information | registration.spec.ts |
| high | timedOut | Registration rejects missing and malformed required values | registration.spec.ts |
| high | failed | Registration rejects duplicate username and email | registration.spec.ts |
| low | skipped | Critical guest and authenticated journeys remain usable at supported viewport sizes | responsive-smoke.spec.ts |
| medium | failed | User searches for users, posts, and hashtags | search.spec.ts |

