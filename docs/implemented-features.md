# Implemented Features

This document lists the product features currently implemented in the codebase.

## Authentication and Account Access

- Email/password login
- User signup
- Forgot password flow
- Password reset flow
- OAuth callback handling
- Email verification page
- Protected routes for authenticated users
- Access-denied handling for restricted pages
- Maintenance-mode routing support

## Onboarding and User Setup

- Authenticated onboarding flow
- Home-country requirement and gating
- Home-country selection support
- Profile setup prompts during onboarding

## Feed and Posting

- Main authenticated feed at `/posts`
- Create post composer
- Feed post cards with engagement state
- Edit post modal
- Post detail page
- Media viewer for post media
- Feed pagination / infinite scrolling
- Feed refresh from realtime or in-app events
- Poll vote state updates in feed posts
- Reposts feed support on profile pages
- Bookmark route and bookmarks page

## Comments and Engagement

- Inline post comments
- Comment item rendering
- Like/reaction-style engagement handling in feed state
- Repost/share presentation
- Post sharing modal
- Emoji picker in posting/messaging related UI
- Content reporting dialog for posts or profiles

## Profile and User Presence

- Profile page with tabs for posts, reposts, media, and about
- Follow and unfollow support
- Connection state support
- Followers, following, connections, and profile-view lists
- Profile media gallery
- Full-screen image/media viewing for users
- Profile view recording support
- Contact and website display
- Experience/about sections on profile
- Profile report action

## Discovery and Social Graph

- Explore page
- Explore by hashtag route
- People page
- People search route
- Suggested people in the main feed sidebar
- Trending hashtags/topics in the main feed sidebar

## Organizations and Partners

- Organizations listing page
- Organization search and category filtering
- Organization cards
- Partners listing page
- Partner detail routes
- Partner member management page
- Partner invite page
- Suggested partners section
- Partner admin user selection/editing components
- Partner location, category, and primary-country fields

## Events

- Events listing page
- Event detail page
- Event registration button/component
- Upcoming events sidebar section
- Event cards and event cover media components

## Messaging

- Conversations list
- Conversation detail view
- Direct messaging UI
- New message modal
- Forward message modal
- Draft message persistence
- Mark conversation as read
- Message edit support
- Message delete support
- Message reactions
- Typing indicators
- Mention suggestions in messages
- Realtime messaging integration with SignalR
- Conversation sorting and persistence helpers

## Notifications

- Notifications page
- Notification filters
- Mark single notification as read
- Mark all notifications as read
- Notification routing into relevant pages
- Realtime notification sync hooks
- Notification dropdown in the main layout
- Support and partner-related notification types
- Profile-view notification support

## Settings and User Preferences

- Settings landing page
- Profile settings page
- Account settings page
- Settings sidebar/layout
- Theme provider support
- Language selection support

## Support and Moderation

- Public support page
- Support inbox page for support/admin users
- Support content moderation page
- Content reports feature gate route
- Moderation alert components
- Support category selection components

## Admin Platform Features

- Admin route protection
- Admin layout and admin sidebar
- Admin dashboard with overview stats and recent activity
- Admin users page
- Admin partners page
- Admin partner create page
- Admin partner detail page
- Admin events page
- Admin event editor/create flow
- Admin advertisements page
- Admin advertisement editor/create flow
- Admin feedback/support page
- Admin content moderation page
- Admin settings page
- Admin audit logs page
- Admin market/country scope support
- Admin staff home redirect

## Advertisements

- Platform advertisement cards
- Sidebar ads carousel
- Feed ad placement support
- Active platform advertisement fetching and display rules
- Admin advertisement management pages

## Studio

- Studio shell/page
- Studio dashboard
- Studio moderation section
- Studio content section
- Studio users section
- Studio API and OAuth section
- Studio branding section
- Studio logs section

## Legal and Informational Pages

- Terms of Service page
- Privacy Policy page
- Cookie Policy page
- Accessibility page
- Not Found page

## Platform and App Experience

- Main application layout with responsive sidebar/header
- Mobile sidebar support
- Global loader
- Toast/toaster notifications
- Route tracking / telemetry integration
- Feature flags provider
- Realtime notifications/messages providers
- Progressive Web App support
- Legal document layout support
- Legacy route redirects for older URLs
