# E2E Product Behavior Specification

This document describes implemented product behavior and serves as the source input for generating E2E test scenarios. It is not a test-case document.

## Authentication and Account Access

### Login, Signup, Password Recovery, OAuth Callback, and Email Verification

**Description**
Supports account access through email/password and external identity providers, plus recovery and verification flows.

**Actors**
Unauthenticated users, authenticated users, external identity providers, identity service.

**Entry Points**
`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/callback`, `/verify-email`

**Preconditions**
The identity service must be reachable. For callback handling, a valid OAuth `code` and `state` must be present. For reset and verification flows, the route must include the required token parameters.

**Main Behavior**
Login accepts email and password, starts a session, hydrates the user profile, and redirects based on the intended path, maintenance mode, and home-country state. Signup collects display name, username, email, home country, and password, checks username availability, and registers the account through the identity service. Forgot password submits an email address and shows a generic success state. Reset password validates the new password client-side and submits the reset token and user ID. OAuth callback exchanges the authorization code for tokens, restores the saved language, attempts to hydrate or create the user profile, and then redirects into the app. Email verification posts the verification token and user ID to the identity service and supports resending verification messages.

**Business Rules**
Protected routes require both an access token and a valid session. During maintenance mode, non-staff users are prevented from completing login into app routes and are redirected to maintenance-safe routes; platform staff bypass maintenance restrictions. Post-login redirect behavior also depends on whether the user already has a home country. Access-denied behavior is used for authenticated users who reach restricted staff or admin pages.

**Validations**
Signup enforces a username length of 3 to 30 characters and only allows letters, numbers, underscores, and hyphens. Signup requires a supported home country. Password validation is shared across signup and reset/change-password flows and checks minimum length, uppercase, lowercase, digit, and non-alphanumeric requirements. Reset password also requires confirmation to match. Verify-email requires both token and user ID; it also accepts the typo `userld` in place of `userId`.

**Expected State Changes**
Successful authentication stores a session and hydrates Redux user state. Successful signup stores pending home-country and email data for later onboarding/profile hydration. Successful password reset redirects to `/login?passwordReset=1`. Successful email verification transitions to a success state and redirects to login after a short delay.

**Failure Behavior**
Login, OAuth callback, reset, and verify-email flows show user-facing error states when tokens are missing, state is invalid, credentials fail, the account is suspended, or the identity service returns an error. Forgot password and resend verification handle API failures with error messaging. Maintenance-mode login blocking logs the user out again if a non-staff user authenticates while maintenance is active.

**Persistence and Realtime Behavior**
Language choice and some auth redirect state are persisted in local or session storage. Auth itself is session-based; no realtime behavior is implemented for auth flows.

**Dependencies**
Identity endpoints under `/api-identity` in development or the configured OIDC issuer in non-development environments, auth storage/session helpers, maintenance mode provider, user profile fetch/ensure logic.

**Out of Scope or Unclear**
The exact server-side email content, verification expiry policy, and backend account lifecycle rules are not defined in the frontend repository.

### Protected Routes, Access Denial, and Maintenance Routing

**Description**
Controls which routes are reachable based on authentication, maintenance state, and platform role.

**Actors**
Unauthenticated users, signed-in non-staff users, platform support users, platform admins.

**Entry Points**
Global route handling in `src/App.jsx`, `ProtectedRoute`, `AdminRoute`, `AdminOnlyRoute`, `SupportOrAdminRoute`, `MaintenanceRouteGuard`, `/access-denied`

**Preconditions**
A route transition occurs and the current session or token can be inspected.

**Main Behavior**
Authenticated routes redirect unauthenticated users to `/login`. Admin and support routes inspect platform-role claims from the token and Redux user state. Maintenance routing allows auth/legal/support public routes for everyone, blocks normal app access for signed-in non-staff, and shows a short grace period before redirecting active users to `/maintenance`.

**Business Rules**
`AdminRoute` requires platform staff. `AdminOnlyRoute` requires full platform admin; support-only staff are redirected to the support inbox. Staff users bypass maintenance restrictions. The access-denied page is used instead of a generic failure when a signed-in user lacks permission.

**Validations**
There are no form validations; access checks are based on token/session presence and decoded platform-role claims.

**Expected State Changes**
Users are redirected to login, maintenance, support inbox, or access denied depending on the route and access state.

**Failure Behavior**
If maintenance status cannot be fetched initially, the maintenance provider fails closed and treats maintenance as enabled.

**Persistence and Realtime Behavior**
Maintenance status is refreshed periodically and when the tab becomes visible. A short grace-period flag is maintained in memory when maintenance turns on during an active session.

**Dependencies**
Auth token/session helpers, maintenance status API, maintenance API gate, platform-role decoding.

**Out of Scope or Unclear**
The maintenance page implementation itself was not part of the inspected route inventory for this document.

## Onboarding and User Setup

### Home Country Onboarding and Gating

**Description**
Requires authenticated non-staff users to complete home-country setup before using gated product areas.

**Actors**
Authenticated users without a home country, platform staff, identity/profile services.

**Entry Points**
`/onboarding`, `HomeCountryRequiredGate`, `HomeCountryOnboardingForm`, gated app routes such as `/posts`, `/people`, `/messages`

**Preconditions**
The user is authenticated. The Redux user profile has loaded or is being hydrated.

**Main Behavior**
Users without a home country are redirected to onboarding when they navigate to gated routes. The onboarding flow collects the home country and returns the user to the originally requested route after completion.

**Business Rules**
Platform staff are explicitly exempt from home-country gating. Account settings and legal/auth routes are allowed without home-country completion. If the user already has a home country, the onboarding page redirects away rather than showing the form.

**Validations**
Home country must be present and normalized to a supported country code. Profile settings may lock the home-country field once it is set.

**Expected State Changes**
A successful onboarding/profile update stores the home country in profile state and removes future gating for that user.

**Failure Behavior**
If the profile or onboarding update cannot complete, the user remains blocked from gated routes until the required profile state is available.

**Persistence and Realtime Behavior**
Home-country state persists in the user profile and survives refresh/session restoration. No realtime behavior is implemented.

**Dependencies**
Redux user profile, home-country helper utilities, profile APIs, route-state redirect helpers.

**Out of Scope or Unclear**
The onboarding page references profile setup prompts, but the exact prompt copy and all onboarding-only UI variants were not exhaustively verified in this pass.

## Feed and Posting

### Main Feed, Pagination, Refresh, and Sidebar Content

**Description**
Provides the authenticated home feed and surrounding discovery/sidebar content.

**Actors**
Authenticated users, platform staff using scoped market views, feed APIs, event APIs, partner APIs, advertisement APIs.

**Entry Points**
`/posts`

**Preconditions**
The user must be authenticated and, unless exempt, have completed home-country setup.

**Main Behavior**
The feed loads paged posts and appends additional pages through infinite scrolling. The page also loads trending hashtags, suggested people, upcoming events, partner suggestions, and active sidebar advertisements. The feed listens for in-app and realtime-style browser events so post changes can be merged or refreshed without a full page reload.

**Business Rules**
Feed content is market-scoped for platform staff when a country scope is selected. Advertisements are only shown when they pass the public renderability checks. Empty-state behavior differs between loading, error, and no-posts conditions.

**Validations**
There are no direct user-input validations on the feed page itself.

**Expected State Changes**
New pages append to the feed, post rows update in place when engagement changes arrive, and deleted posts are removed from the visible list.

**Failure Behavior**
Feed and sidebar fetch failures produce error or empty fallback states rather than crashing the route.

**Persistence and Realtime Behavior**
Feed state persists only in memory for the active page session. It refreshes via custom browser events, notification-driven engagement updates, and admin-scope refresh events.

**Dependencies**
`getFeed`, trending hashtag API, suggested people API, public events API, partners API, advertisement API, feed-event utilities, admin scope refresh utilities.

**Out of Scope or Unclear**
The exact backend ranking logic for feed ordering, suggestions, trends, and ad placement is not defined in the frontend repository.

### Post Composition, Editing, Detail View, and Media Viewing

**Description**
Allows users to create posts, edit existing posts, view post details, and browse post media.

**Actors**
Authenticated users, post APIs, media upload policy API, moderation services.

**Entry Points**
Composer on `/posts`, edit post modal, `/posts/:postId`, `/posts/:postId/media`, legacy media redirects

**Preconditions**
The user must be authenticated and have a valid access token. Upload policy and supporting APIs must be reachable for media-based posts.

**Main Behavior**
The composer supports text, media attachments, polls, link metadata, mentions, and optional location. Post detail loads a single post with comments and engagement actions, records a post view, and offers a dedicated media viewer for post attachments. Edit flows update post content, hashtags, media, and poll state through the edit modal.

**Business Rules**
The composer uses a maximum text length of 2000 characters and a maximum of 10 media files. Poll readiness is required before a poll-only post can be published. Platform support-only staff cannot publish public content and platform staff must satisfy market-scope rules before publishing. Location and link metadata are appended into the stored post content/payload. The post detail route joins a post-scoped realtime group and refetches when post or engagement events occur.

**Validations**
Media files are validated against a backend upload policy and client-side file checks. Poll options are subject to configured poll limits. Image and media inputs may be cropped or optimized before upload. Edit and create flows surface moderation errors and network/upload errors.

**Expected State Changes**
Successful post creation inserts a new post into feed state via dispatched events. Successful edits update the corresponding post and related detail/feed cards. Bookmark, like, repost, and poll-vote state update counts and actor flags in detail and feed contexts.

**Failure Behavior**
Publishing and editing show toast or moderation-alert failures when required content is missing, uploads fail, moderation rejects content, the token is absent, or downstream post/poll/hashtag operations fail.

**Persistence and Realtime Behavior**
Created and edited posts persist through backend APIs. Feed and detail pages react to custom events and SignalR-sourced engagement events to keep state aligned without a full refresh.

**Dependencies**
Post CRUD and engagement APIs, poll APIs, hashtag APIs, upload-policy API, image crop helpers, location picker, moderation helpers, realtime event utilities.

**Out of Scope or Unclear**
Server-side post visibility, ranking, and retention rules are not defined in the frontend code. The exact moderation decision criteria are also external.

### Profile Reposts, Bookmarks, and Feed-State Synchronization

**Description**
Exposes reposted content on profile pages and a dedicated saved-posts route for bookmarks.

**Actors**
Authenticated users, post APIs.

**Entry Points**
Profile repost tab, `/bookmarks`

**Preconditions**
The user must be authenticated. Bookmarks depend on the current user’s saved-post records.

**Main Behavior**
Profiles can show a repost feed in addition to authored posts. The bookmarks page loads the user’s bookmarked posts, keeps them ordered by post time, updates visible rows when engagement or post updates occur, and allows removing bookmarks.

**Business Rules**
Bookmark actions toggle the current actor’s bookmark state and adjust the saved-post view accordingly. The bookmarks page displays a dedicated empty state when no bookmarked posts remain.

**Validations**
There are no form validations; actions depend on valid post identifiers and an authenticated session.

**Expected State Changes**
Adding or removing a bookmark changes the bookmark flag and the bookmarked-post list. Post updates received after the initial load replace the affected bookmarked post data.

**Failure Behavior**
Bookmark-load failures show an error state. Failed bookmark toggles surface user-facing errors.

**Persistence and Realtime Behavior**
Bookmarks persist through backend APIs. The page also reacts to engagement and post update events from elsewhere in the app.

**Dependencies**
Bookmark APIs, `getPostById`, feed mapping utilities, browser realtime/feed events.

**Out of Scope or Unclear**
Cross-device bookmark synchronization timing is backend-defined and not specified by the frontend.

## Comments and Engagement

### Comments, Likes, Reposts, Shares, Emoji, and Reporting

**Description**
Supports interaction with posts and comments through commenting, engagement actions, sharing UI, emoji-enabled inputs, and content reporting.

**Actors**
Authenticated users, post/comment APIs, content-report API.

**Entry Points**
Feed post cards, `/posts/:postId`, comment items, share modal, report dialog

**Preconditions**
The relevant post or comment must exist. Reporting depends on the content-reports feature flag for staff routes and report UI exposure.

**Main Behavior**
Users can open inline comments, add comments and replies, like posts and comment items, repost and unrepost posts, open a share modal, and use emoji-enhanced text inputs in posting and messaging UI. Post detail also supports pinning, editing, and deleting comments where permitted. Post and profile report actions open a reporting dialog that submits a content report.

**Business Rules**
Comment and reply actions require login. The content moderation route under support is hidden when the content-report feature flag is disabled. Comment pinning and moderation-related actions are availability-dependent and are exposed only in relevant contexts. Share behavior is present as UI/modal presentation; the repository does not show a server-side share tracking flow for ordinary shares.

**Validations**
Comment and post-related inputs rely on non-empty content and moderation handling. Report submission depends on the backend report service. Emoji input augments existing text entry rather than creating a separate validation path.

**Expected State Changes**
Successful comments and replies update comment counts and visible comment trees. Like, repost, and bookmark operations update counts and actor flags. Successful reports produce a submitted state through the reporting dialog flow.

**Failure Behavior**
Unauthenticated engagement attempts show login-required feedback. API and moderation failures produce toast/error messaging. Report-route access falls back to the support inbox when reporting is disabled for staff tools.

**Persistence and Realtime Behavior**
Engagement and comments persist through backend APIs and are kept in sync by post/comment engagement events where available.

**Dependencies**
Post engagement APIs, comment APIs and mappers, share modal UI, emoji picker components, content-report service, feature flags.

**Out of Scope or Unclear**
The repository does not define downstream moderation workflow after a report is submitted.

## Profile and User Presence

### Profile Viewing, Social Graph Lists, and About Information

**Description**
Displays user profiles with multiple content tabs, relationship state, and extended profile information.

**Actors**
Authenticated users, viewed users, profile APIs, follow APIs, connection APIs.

**Entry Points**
`/profile/:userId`, profile tabs, profile list modals, `/user/:userId/media` and related media routes

**Preconditions**
The target user must be resolvable by ID, slug, or handle. The viewer must be authenticated to reach the profile route in the current app configuration.

**Main Behavior**
The profile route loads a user by ID, slug, or handle, then loads posts, reposts, media, and about information in separate tabs. It also exposes followers, following, connections, and profile-view lists through modal/list experiences. Contact details, website, experience, and about text are shown when available. Media can be opened into a full-screen viewer, and profile views are recorded when a user views someone else’s profile.

**Business Rules**
Canonical slug handling redirects slug-based profiles to the current canonical route. Users cannot report their own profile. Reporting is gated by the content-reports feature flag. Profile-view recording does not run when a user views their own profile. List loading uses pagination/infinite loading for followers, following, and connections.

**Validations**
There are no route-level form validations for viewing. Display fallbacks are used for missing profile fields and missing media.

**Expected State Changes**
Viewed profile state updates in memory, relationship lists and counts refresh as follow/connection status changes, and media-tab navigation opens the correct viewer route.

**Failure Behavior**
Failed profile resolution or list fetches produce error or fallback UI. If the target route parameter is invalid or unresolved, the page cannot render normal profile content.

**Persistence and Realtime Behavior**
Profile data persists through backend APIs. The page merges engagement and poll-vote updates from shared post event mechanisms, but profile metadata itself is not realtime in the inspected code.

**Dependencies**
User profile endpoints, user posts/reposts/media APIs, followers/following APIs, connection API, profile-view API, content-report service, shared post engagement utilities.

**Out of Scope or Unclear**
The exact business meaning of “connections” versus “follows” is backend-defined; the frontend treats them as separate relationship datasets.

### Profile Settings and Account Settings

**Description**
Allows users to edit profile attributes, upload avatar and cover media, manage home country, and update account credentials.

**Actors**
Authenticated users, profile API, designation API, identity service.

**Entry Points**
`/settings`, `/settings/profile`, `/settings/account`

**Preconditions**
The user must be authenticated.

**Main Behavior**
The settings landing route redirects to profile settings. Profile settings load or create the user profile record, allow updating display name, handle, bio, company, job title/designation, location, contact email, LinkedIn URL, website, description, avatar, cover image, and home country. Account settings display the current email, send email-change verification requests, allow password changes, and expose a non-functional account-deletion dialog.

**Business Rules**
Home country may become locked once set. Profile settings can create a missing profile record on first save. Designations are loaded from the API and can be selected from the catalog or added as new catalog entries. Users authenticated only through external providers may be blocked from changing email and password if the identity profile reports no password. Account deletion is explicitly disabled in the current implementation.

**Validations**
Profile creation enforces the same handle length and character rules as signup. Home country is required. Company and designation inputs enforce length-limited text entry. Avatar and cover uploads go through image validation, cropping, and client-side optimization. Account password changes enforce current password presence, new password rules, and confirmation match. Email change rejects blank values and unchanged email values.

**Expected State Changes**
Successful profile saves update backend profile data, Redux user state, avatar/cover previews, and persisted home-country code. Email change requests trigger a verification-email flow. Successful password changes clear the password form fields.

**Failure Behavior**
Profile load/save failures show toasts. Invalid image files, unsupported uploads, designation-save failures, and account-setting API failures show field or toast errors. Account deletion always returns a demo/disabled message.

**Persistence and Realtime Behavior**
Profile and account changes persist across refresh through backend APIs. There is no realtime sync for settings changes in the inspected code.

**Dependencies**
User profile API, designation API, home-country helpers, image validation/crop/upload helpers, identity account endpoints, settings layout.

**Out of Scope or Unclear**
The backend rules for who can unlock or later change home country are not visible from the frontend code.

## Discovery and Social Graph

### Explore, Hashtags, Suggested Users, and Search Persistence

**Description**
Provides discovery of posts, hashtags, people, and partner organizations.

**Actors**
Authenticated users, search APIs, hashtag APIs, partner APIs.

**Entry Points**
`/explore`, `/explore/tag/:tagName`

**Preconditions**
The user must be authenticated and, unless exempt, pass home-country gating.

**Main Behavior**
Explore loads discoverable posts, featured people, trending tags, and partner organizations. Users can search, navigate to tag-specific routes, click saved searches, and remove saved searches. The page also reacts to post update, delete, and engagement events to keep the visible discovery state current.

**Business Rules**
Hashtag routes normalize leading `#` characters. Partner discovery filters out dummy partner records. Saved search behavior is client-driven from the inspected source and includes add/remove feedback.

**Validations**
Search queries are trimmed before comparison and persistence. Invalid or empty searches are handled through UI state rather than hard errors.

**Expected State Changes**
Changing the query or tag changes the loaded discovery results. Saved-search actions update the stored saved-search set and the active discovery UI.

**Failure Behavior**
Discovery fetch failures show toast/error feedback and fallback states.

**Persistence and Realtime Behavior**
Saved-search behavior persists in client state/storage used by the page. Discovery lists update in memory in response to shared post events.

**Dependencies**
Explore/search APIs, featured people API, hashtag APIs, partner APIs, feed-event utilities.

**Out of Scope or Unclear**
The exact persistence mechanism and retention rules for saved searches were not fully traced beyond the page-level behavior.

### People Browsing and Follow/Unfollow

**Description**
Lets users browse people, search users, and change follow state.

**Actors**
Authenticated users, user search API, follow APIs.

**Entry Points**
`/people`, `/people/search/:query`, suggested-people section in `/posts`

**Preconditions**
The user must be authenticated.

**Main Behavior**
The people page loads search results, supports route-driven queries, shows follower and following counts, and allows follow or unfollow actions directly from result cards. Suggested people are also loaded into the main feed sidebar.

**Business Rules**
Follow/unfollow updates are optimistic in the UI and adjust follower counts immediately. Route-based search and query-parameter search are both supported in the page implementation.

**Validations**
No complex form validation is present beyond trimmed query handling and availability of a target user ID.

**Expected State Changes**
Follow actions change the button state and adjust visible follower counts for the affected user.

**Failure Behavior**
Search failures show page-level error messaging. Follow/unfollow failures revert to error feedback and do not leave the user in a silently inconsistent state.

**Persistence and Realtime Behavior**
Follow state persists through backend APIs. The inspected code does not add dedicated realtime follow synchronization beyond notification routing and shared profile/feed refresh behavior.

**Dependencies**
`searchUsers`, `followUser`, `unfollowUser`, suggested people API, user-card components.

**Out of Scope or Unclear**
Connection-request flows are referenced elsewhere in notifications but are not implemented as a dedicated people-page action in the inspected source.

## Organizations and Partners

### Organizations Listing

**Description**
Shows a browseable organization directory with search and category filters.

**Actors**
Authenticated users.

**Entry Points**
`/organizations`

**Preconditions**
The user must be authenticated.

**Main Behavior**
The organizations page renders a list of organization cards from local data and supports client-side search/filtering.

**Business Rules**
This implementation is frontend-only in the inspected repository and does not fetch live organization records from an API.

**Validations**
Filtering is based on client-side query/category input only.

**Expected State Changes**
Search and filter changes update the visible organization cards in memory.

**Failure Behavior**
No API failure path is present because the page uses local data.

**Persistence and Realtime Behavior**
No persistence or realtime synchronization is implemented.

**Dependencies**
Local organizations data and organization card components.

**Out of Scope or Unclear**
Live organization CRUD, permissions, and server-backed filtering are not implemented in the inspected code.

### Partner Directory, Detail, Membership, and Admin Support

**Description**
Provides partner discovery plus dedicated partner routes for viewing, management, invites, and admin editing.

**Actors**
Authenticated users, partner members, partner admins/moderators, platform admins, partner APIs.

**Entry Points**
`/partners`, `/partners/:partnerId`, `/partners/:partnerId/manage`, `/partners/:partnerId/invite`, suggested partners in `/posts`, partner admin pages under `/admin/partners`

**Preconditions**
The user must be authenticated. Admin partner pages require platform-staff access, and full write behavior depends on admin role or partner-specific role checks.

**Main Behavior**
The partners page lists non-dummy partners and supports client-side filtering. Suggested partners in the main feed sidebar allow join-request style interactions. Dedicated routes exist for partner detail, member management, and invite handling. Admin services support listing, creating, updating, deleting, premium toggling, category creation, organizer option loading, and member-role changes for partners.

**Business Rules**
Suggested partner actions adjust visible member counts. Partner-specific moderation helpers treat moderator/admin roles differently from ordinary members. Partner create/edit flows include explicit support for location, category, and primary-country fields, and partner management behavior is role-sensitive.

**Validations**
Primary country is required in dedicated partner form components. Location and category inputs use specialized components and field-level error support. Detailed admin-page validation rules for every partner field were not exhaustively verified in this pass.

**Expected State Changes**
Successful partner membership or join-request actions update membership state and visible counts. Successful admin create/edit/delete actions change the partner dataset behind admin and public listings.

**Failure Behavior**
Directory and suggestion fetch failures surface error states or toasts. Join and admin service failures show user-facing errors.

**Persistence and Realtime Behavior**
Partner data persists through backend APIs. No dedicated realtime partner-sync mechanism was verified beyond general notification support.

**Dependencies**
Partner services under `/api/partners` and `/api/admin/partners`, country/location/category fields, suggested partner component, partner role helpers.

**Out of Scope or Unclear**
The exact end-user behavior of the partner detail, manage, and invite pages was not fully traced line by line for this document, but their routes and supporting services/components are present.

## Events

### Public Events and Event Registration

**Description**
Shows public events, event details, event cards, and external registration actions.

**Actors**
Authenticated users, public events API, event organizers.

**Entry Points**
`/events`, `/event/:id`, upcoming events sidebar in `/posts`

**Preconditions**
The user must be authenticated.

**Main Behavior**
The events page loads upcoming public events and renders event cards. Event detail routes and shared cover-media components support viewing a single event. Registration UI opens the organizer-provided external registration URL in a new tab.

**Business Rules**
The frontend treats registration as an outbound link action rather than a first-party registration flow. Event titles, descriptions, locations, and time zones are localized/presented through event display helpers.

**Validations**
Public event rendering depends on having mappable event data. External registration requires a valid HTTP/HTTPS-style target URL after sanitization.

**Expected State Changes**
Event lists and cards render the currently loaded events. Registration does not create a local enrollment record in the inspected code.

**Failure Behavior**
Event-load failures produce toast or fallback behavior. Invalid or missing registration URLs prevent meaningful outbound registration behavior.

**Persistence and Realtime Behavior**
Event data persists through public/admin event APIs. No realtime event-update flow was verified for public event pages.

**Dependencies**
Public event list/detail APIs, event card/cover components, event UI/time-zone helpers.

**Out of Scope or Unclear**
The repository does not implement first-party attendee management or registration confirmation flows on the public side.

## Messaging

### Conversations, Direct Messages, Drafts, and Realtime Messaging

**Description**
Supports direct messaging with conversation lists, detailed threads, editing, deleting, reactions, forwarding, and draft persistence.

**Actors**
Authenticated users, connected users, messaging APIs, SignalR message hub.

**Entry Points**
`/messages`, `/messages/:conversationId`, new message modal, forward message modal

**Preconditions**
The user must be authenticated.

**Main Behavior**
The messaging area loads cached conversation metadata first, then fetches conversation and message data from the API. Users can open threads, send messages, edit or delete messages, react to messages, forward messages to connections, mark conversations as read, and see typing indicators, online state, last seen, and mention suggestions. Draft text is persisted per conversation.

**Business Rules**
Conversation ordering and preview metadata are derived from message activity and are also persisted locally. Realtime connection is maintained for the signed-in session, with retries and unread-count refreshes. Messaging hubs are disconnected for non-staff users during maintenance mode.

**Validations**
Message-send/edit flows depend on non-empty or otherwise valid message content and pass through moderation helpers for blocked content. Attachment handling and message forwarding depend on valid target conversations/users.

**Expected State Changes**
Sending or receiving a message updates thread content, conversation ordering, unread counts, and cached conversation data. Edit/delete/reaction events update visible message rows. Typing events change transient typing indicators.

**Failure Behavior**
API, moderation, and realtime failures surface toast feedback or silent fallback where appropriate. If the realtime hub cannot connect, the UI can still rely on REST-backed message data but loses live synchronization.

**Persistence and Realtime Behavior**
Drafts and conversation caches persist in `localStorage`. Message state persists through backend APIs. SignalR delivers new messages, message edits/deletes, read receipts, online/offline presence, typing events, reconnection events, and unread-count updates.

**Dependencies**
Message service, connection service, message storage helpers, mention helpers, messages hub provider/service, moderation helpers.

**Out of Scope or Unclear**
Audio/video calling is feature-flagged in the application but detailed call behavior was not verified in the inspected messaging code for this document.

## Notifications

### Notifications Page, Notification Dropdown, and Routing

**Description**
Provides notification lists, notification filtering, unread management, and navigation into relevant product areas.

**Actors**
Authenticated users, notification APIs, SignalR notifications hub.

**Entry Points**
`/notifications`, notification bell/dropdown in the main layout

**Preconditions**
The user must be authenticated.

**Main Behavior**
The notifications page loads and filters notifications by type. The header dropdown loads a shorter unread list, shows an unread badge, supports mark-all-read, and routes users into posts, profiles, connections, partner pages, support items, and other relevant destinations based on notification type.

**Business Rules**
Support and feedback inbox-related notification types are available for platform staff. The dropdown keeps a local optimistic read set so items can appear read immediately before the backend round-trip completes. Notification routing depends on type-specific mapping logic.

**Validations**
No user form validation is involved; operations require valid notification IDs and valid route targets.

**Expected State Changes**
Opening or marking notifications changes read state, unread counts, and visible notification styling. Clicking a notification navigates into the mapped product route.

**Failure Behavior**
Notification fetch and unread-update failures fall back to empty or stale data and show toast feedback for explicit mark-all-read failures.

**Persistence and Realtime Behavior**
Unread counts and items persist through notification APIs. The notifications hub pushes new items and synchronization events, retries on connection failure, and reconnects when the tab becomes visible.

**Dependencies**
Notification service, notification-route mapping, notification hub provider/service, header dropdown, notification message component.

**Out of Scope or Unclear**
Server-side notification deduplication, retention, and batching behavior are not visible from the frontend code.

## Settings and User Preferences

### Settings Navigation, Theme, and Language

**Description**
Provides settings navigation plus user-level theme and language preferences.

**Actors**
Authenticated users.

**Entry Points**
`/settings`, `/settings/profile`, `/settings/account`, theme and language controls in the app UI

**Preconditions**
The settings routes require authentication.

**Main Behavior**
The settings landing route redirects to profile settings. Theme preference toggles light and dark mode and applies the theme class to the document root before and after initial render. Language preference supports `EN` and `DE` and is used across UI text.

**Business Rules**
Theme defaults to stored preference, otherwise falls back to system color-scheme preference. Language defaults to `DE` when no valid stored value exists.

**Validations**
Theme accepts `light` or `dark` through the provider behavior. Language accepts only `EN` or `DE`.

**Expected State Changes**
Changing theme updates the root document class and persists the value. Changing language updates provider state and persists the selection.

**Failure Behavior**
Storage access failures are ignored gracefully and the app continues with in-memory provider state.

**Persistence and Realtime Behavior**
Theme and language are persisted in `localStorage`. No realtime synchronization is implemented.

**Dependencies**
Theme context, language context, settings layout.

**Out of Scope or Unclear**
No server-side preference syncing was verified.

## Support and Moderation

### Public Support and Feedback Submission

**Description**
Allows users or visitors to submit support requests and feedback through a shared public form.

**Actors**
Visitors, authenticated users, support team, support inquiry API.

**Entry Points**
`/support`

**Preconditions**
The support service must be reachable. If the user is authenticated, profile/session data can be used to prefill submitter information.

**Main Behavior**
The support page can operate as a generic support/feedback chooser or be preconfigured into support-only or feedback-only mode based on route/query state. It collects name, email, inquiry type, category, subject when applicable, and message, then submits the inquiry and shows a submitted confirmation state.

**Business Rules**
Support inquiries require a subject; feedback does not. Preset route state can lock the inquiry type. When authenticated, the form prefills submitter name and email from the session/profile.

**Validations**
The form uses shared validation rules for required fields, valid email shape, category selection, and message length. Message length is bounded by configured minimum and maximum values.

**Expected State Changes**
Successful submission clears the active form experience into a success/thank-you state and provides navigation back to the originating route.

**Failure Behavior**
Validation errors are shown inline after touch or submit attempt. Submission failures show toast errors.

**Persistence and Realtime Behavior**
The form itself is not persisted across refresh. Submitted inquiries persist through the support API. No realtime behavior is implemented for the public form.

**Dependencies**
Support inquiry service, support form validation helpers, support category selector, session-derived submitter helpers.

**Out of Scope or Unclear**
Support SLA, ticket assignment, and downstream processing rules are not represented in the frontend repository.

### Staff Support Inbox, Content Moderation, and Moderation Alerts

**Description**
Provides staff-facing inbox and moderation routes inside the main app shell and exposes moderation-related UI components.

**Actors**
Platform support users, platform admins, support/moderation APIs.

**Entry Points**
`/support/inbox`, `/support/content-moderation`, moderation alert components, content-report feature-gate route

**Preconditions**
The user must have platform-staff access. Content moderation additionally depends on the `contentReportsEnabled` feature flag.

**Main Behavior**
The support inbox route renders staff navigation, country-scope controls, and the shared feedback/support admin page inside the regular application shell. The support content-moderation route does the same for the shared admin content-moderation page. Moderation alerts are used in user-facing composition flows to surface moderation failures.

**Business Rules**
When content reporting is disabled by feature flag, the support content-moderation route redirects back to the support inbox. Support-only staff use the support-shell routes instead of the admin shell.

**Validations**
Access is validated through route protection and feature-flag state rather than form input.

**Expected State Changes**
Changing the platform country scope changes the current market context for staff investigations and list views.

**Failure Behavior**
If the feature flag is still loading, the gated route temporarily renders nothing. Permission failures are handled through route redirection/access denial rather than inline errors.

**Persistence and Realtime Behavior**
The selected admin/support country scope persists through the scope-management utilities used across staff features. Realtime moderation queue behavior was not separately verified from the shared admin pages.

**Dependencies**
Platform access helpers, feature flags provider, support navigation, platform country scope control, shared admin feedback and moderation pages.

**Out of Scope or Unclear**
The detailed workflow of moderation decisions inside the shared admin content-moderation page was not fully traced in this pass.

## Admin Platform Features

### Admin Shell, Dashboard, Scope, and Staff Routing

**Description**
Provides the platform admin shell, dashboard, sidebar navigation, market scope handling, and staff-specific home routing.

**Actors**
Platform admins, platform support users.

**Entry Points**
`/admin`, `/admin/*`, staff route guards, country-scope controls

**Preconditions**
The user must have platform-staff access, and some pages require full platform-admin access.

**Main Behavior**
Platform admins enter the admin shell and can reach dashboard, management, and audit pages. Support-only staff are redirected to the support inbox as their staff home. The dashboard loads overview statistics and recent activity and responds to the current admin country scope.

**Business Rules**
Support-only staff are treated as read-only admin users in the platform-access helper and do not use the full admin home route. Admin market/country scope affects market-scoped consumer and admin datasets.

**Validations**
Access validation is role-based rather than form-based.

**Expected State Changes**
Changing scope updates which market-scoped content is fetched or previewed across supported pages.

**Failure Behavior**
Unauthorized users are redirected rather than shown partial admin content. Dashboard fetch failures surface as page-level failure states.

**Persistence and Realtime Behavior**
Scope selection persists through dedicated admin-scope utilities. The dashboard itself is API-backed and not realtime in the inspected source.

**Dependencies**
Admin route guards, platform-access helpers, admin scope-country utilities, admin dashboard service.

**Out of Scope or Unclear**
The full visual structure of every admin-shell component was not required for this behavior-focused document.

### Admin Users, Partners, Events, Advertisements, Support, Moderation, Settings, and Audit Logs

**Description**
Exposes platform management pages for core marketplace/admin datasets.

**Actors**
Platform admins, support staff for selected shared pages, admin APIs.

**Entry Points**
`/admin/users`, `/admin/partners`, `/admin/partners/create`, `/admin/partners/:partnerId`, `/admin/events`, `/admin/events/create`, `/admin/events/:eventId`, `/admin/ads`, `/admin/ads/create`, `/admin/ads/:adId`, `/admin/feedback`, `/admin/content-moderation`, `/admin/settings`, `/admin/audit-logs`

**Preconditions**
The user must be a platform admin for full admin-shell access.

**Main Behavior**
The repository includes dedicated pages and service layers for listing, viewing, creating, updating, deleting, and otherwise managing users, partners, events, advertisements, platform settings, support/feedback records, moderation records, and audit logs. Advertisement pages support activation, pause, schedule windows, placement selection, target URLs, budget fields, and image/video uploads. Event and partner pages are likewise wired to CRUD-oriented admin service endpoints.

**Business Rules**
Admin services consistently use `/api/admin/...` endpoints. Advertisement behavior is market-scoped and placement-aware. Content moderation visibility is tied to the content-reports feature flag in navigation logic. Audit-log presentation includes human-readable summaries plus technical details.

**Validations**
Advertisement editing includes field-level validation for schedule dates, target URL, and banner media, and uses schedule/date helpers that preserve legacy local-date behavior. Partner create/edit flows include required primary-country support. Full validation detail for every admin page was not exhaustively verified in this pass.

**Expected State Changes**
Successful admin operations create, update, activate, pause, or delete managed records and change what appears in the corresponding admin and public-facing modules.

**Failure Behavior**
Admin-page fetch and save failures surface through page-level errors or toasts. Unauthorized access is prevented by route guards before these pages render.

**Persistence and Realtime Behavior**
Admin changes persist through backend admin APIs. Dedicated realtime admin updates were not verified for these pages in the inspected source.

**Dependencies**
Admin advertisement, event, platform settings, partner, support, moderation, and audit-log services/components.

**Out of Scope or Unclear**
This document confirms the presence of these pages, routes, and service integrations, but not every field-level business rule for each admin form.

## Advertisements

### Public Advertisement Rendering and Admin Advertisement Management

**Description**
Shows active platform advertisements in public app surfaces and provides admin management routes for those records.

**Actors**
Authenticated users, platform admins, advertisement APIs.

**Entry Points**
Sidebar ads in `/posts`, feed ad placement helpers, `/admin/ads`, `/admin/ads/create`, `/admin/ads/:adId`

**Preconditions**
Advertisements must be returned by the API and satisfy public display checks.

**Main Behavior**
The main feed sidebar loads active platform advertisements and shows them in a carousel when multiple ads are available. Feed-placement helpers support insertion into feed streams. Admin pages manage advertisement records, including schedule, media, placement, country, CTA content, and activation state.

**Business Rules**
Only publicly renderable advertisements are displayed to end users. Sidebar carousel rotation auto-advances and pauses on hover when multiple ads exist. Advertisement scheduling uses local-date aware helpers to preserve legacy data semantics.

**Validations**
Admin advertisement forms validate media presence/shape, target URL, and scheduling fields. Public rendering rejects ads that fail display-rule checks.

**Expected State Changes**
Active ads appear or disappear from public UI depending on their status and renderability. Admin create/update/pause/activate actions change the visible ad inventory.

**Failure Behavior**
Public ad fetch failures fall back to showing no ad content. Admin ad save/fetch failures show user-facing errors.

**Persistence and Realtime Behavior**
Advertisements persist through backend admin/public APIs. No dedicated realtime ad-sync mechanism was verified.

**Dependencies**
Advertisement services, renderability helpers, sidebar carousel, platform ad card, feed placement helpers.

**Out of Scope or Unclear**
Click tracking and reporting details were not fully verified beyond the presence of analytics-related helpers.

## Studio

### Studio Shell and Sections

**Description**
Provides a studio route with multiple internal sections for platform-oriented tooling.

**Actors**
Authenticated users.

**Entry Points**
`/studio`

**Preconditions**
The user must be authenticated.

**Main Behavior**
The studio page renders a section-based shell with dashboard, moderation, content, users, API/OAuth, branding, and logs sections controlled by local UI state.

**Business Rules**
The inspected implementation is largely frontend-only. Several studio sections use placeholder or mock data rather than live APIs.

**Validations**
No significant backend validation behavior was verified for studio sections in the inspected code.

**Expected State Changes**
Changing the selected section swaps the rendered studio panel.

**Failure Behavior**
Because much of the current implementation is local/mock, there are limited API-failure paths in the inspected studio code.

**Persistence and Realtime Behavior**
Section selection is in-memory only. No realtime behavior was verified.

**Dependencies**
Studio section components.

**Out of Scope or Unclear**
Studio should be treated as partial or placeholder functionality until its sections are backed by production APIs and verified workflows.

## Legal and Informational Pages

### Legal Documents, Accessibility, Supportive Information, and Not Found

**Description**
Provides public informational pages and a fallback not-found route.

**Actors**
Visitors and authenticated users.

**Entry Points**
`/terms`, `/privacy`, `/cookie`, `/accessibility`, fallback `*` route

**Preconditions**
None beyond route access.

**Main Behavior**
Legal and informational pages render within a shared legal-document layout. Unknown routes fall through to the not-found page.

**Business Rules**
These routes remain reachable during maintenance mode.

**Validations**
No form validation is involved.

**Expected State Changes**
None beyond route navigation.

**Failure Behavior**
No special failure path is defined beyond ordinary route rendering.

**Persistence and Realtime Behavior**
No persistence or realtime behavior is implemented.

**Dependencies**
Legal document layout and static page components.

**Out of Scope or Unclear**
Document content governance and revision history are not represented in the frontend repository.

## Platform and App Experience

### Main Layout, Mobile Navigation, Global Loading, Toasts, Telemetry, Feature Flags, and Realtime Providers

**Description**
Defines the shared application shell and global providers that shape overall user experience.

**Actors**
All users, telemetry service, feature-flag API, messages/notifications hubs.

**Entry Points**
`MainLayout`, header/sidebar/mobile sidebar, app providers in `src/App.jsx` and `src/main.jsx`

**Preconditions**
Provider initialization must complete enough for the current route.

**Main Behavior**
The app wraps routed content with theme, language, auth, feature-flag, maintenance, and realtime providers. The main layout includes responsive sidebar/header navigation, a notification dropdown, and mobile navigation support. Global loaders and toast notifications provide async feedback. App Insights route tracking records sanitized page-view telemetry.

**Business Rules**
Feature flags are loaded from the backend and currently expose at least `audioVideoCallEnabled` and `contentReportsEnabled`. Flags refresh on window focus and when the admin scope changes. Route telemetry sanitizes sensitive query-string routes such as verification and reset flows before sending page views. Realtime providers connect only for authenticated users and disconnect during maintenance for non-staff.

**Validations**
Provider behavior validates accepted theme/language values and defensively handles missing storage or failed provider fetches.

**Expected State Changes**
Unread badges, notification lists, message presence, maintenance banners, and feature-flag-dependent navigation/routes update as provider state changes.

**Failure Behavior**
Feature-flag failures default flags to `false`. Maintenance status fetch failures default to maintenance-on. Realtime connection failures retry with backoff and degrade to non-live behavior.

**Persistence and Realtime Behavior**
Theme and language persist in local storage. Messages and notifications providers keep live SignalR connections for authenticated sessions. Maintenance mode refreshes periodically and on tab visibility.

**Dependencies**
Theme context, language context, auth provider, feature-flags provider, maintenance provider, messages hub provider, notifications hub provider, toast system, App Insights telemetry.

**Out of Scope or Unclear**
Progressive Web App support is only partially verifiable from the repository. The code includes mobile safe-area styling and responsive app-shell behavior, but no service worker or web-app manifest was verified in this pass.

### Legacy Route Redirects and Media Route Compatibility

**Description**
Preserves compatibility with older URLs and alternate media-view routes.

**Actors**
Authenticated users.

**Entry Points**
Legacy redirect routes in `src/App.jsx`, profile and post media viewers

**Preconditions**
The user navigates using an old or alternate route shape.

**Main Behavior**
The app redirects legacy routes such as `/`, `/home`, `/feed`, and certain user-media URLs into the current canonical routes used by the application.

**Business Rules**
Canonical route generation is favored for profiles, posts, and media viewers.

**Validations**
Route parameters must be sufficient to build the canonical destination.

**Expected State Changes**
Navigation lands on the modern route while preserving the intended destination where possible.

**Failure Behavior**
If required route data is missing, the target page falls back to its normal error or empty-state handling.

**Persistence and Realtime Behavior**
Redirect behavior is route-based only and has no persistence or realtime element.

**Dependencies**
App route definitions, route helper utilities, media viewer pages.

**Out of Scope or Unclear**
Backward-compatibility guarantees for all historical URL shapes are not documented beyond the currently wired redirects.
