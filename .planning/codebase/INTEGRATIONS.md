# External Integrations

**Analysis Date:** 2026-04-15

## Firebase Services

**Firebase Authentication:**
- Providers: Google, Apple, Email/Password
- Implementation: `@angular/fire/compat/auth` (AngularFireAuth)
- Login UI: FirebaseUI (`firebaseui` ^6.1.0) + custom popup-based sign-in
- Login component: `src/app/features/auth/login/login.component.ts`
- Auth service: `src/app/core/services/auth.service.ts`
- Auth guard: `@angular/fire/compat/auth-guard` (AngularFireAuthGuardModule)
- Custom claims: `UserRoles` with `admin` flag, read via `idTokenResult`
- Auth domain: `www.bandcentral.com`

**Cloud Firestore:**
- Primary data store for all application data
- Client: `@angular/fire/compat/firestore` (AngularFirestore)
- Admin: `firebase-admin` in Cloud Functions (`functions/src/init.ts`)
- Security rules: `firestore.rules`
- Indexes: `firestore.indexes.json`
- Emulator port: 8080

**Firestore Collections:**
- `/accounts/{accountId}` - Band/account documents (owner, users array, entitlement, song/setlist counts)
- `/accounts/{accountId}/songs/{songId}` - Songs with artist, genre, key, tempo, tags
- `/accounts/{accountId}/songs/{songId}/lyrics/{lyricId}` - Lyrics/chord sheets per song
- `/accounts/{accountId}/setlists/{setlistId}` - Setlists
- `/accounts/{accountId}/setlists/{setlistId}/songs/{songId}` - Setlist song ordering
- `/accounts/{accountId}/tags/{tagId}` - Song tags/categories
- `/accounts/{accountId}/artists/{artistId}` - Artist lookup with song counts
- `/accounts/{accountId}/genres/{genreId}` - Genre lookup with song counts
- `/accounts/{accountId}/imports/{importId}` - Legacy SLH import records
- `/accounts/{accountId}/imports/{importId}/events/{eventId}` - Import progress events
- `/accounts/{accountId}/users/{userId}` - Account membership (AccountUser)
- `/accounts/{accountId}/file_references/{refId}` - File references (Dropbox/document paths)
- `/users/{uid}` - Global user profiles (login tracking, format settings)
- `/contactRequests/{id}` - Support contact form submissions
- `/welcomeEmails/{id}` - Welcome email trigger documents

**Firebase Cloud Functions (v2):**
- Runtime: Node.js 22
- Source: `functions/src/`
- Entry: `functions/src/index.ts`
- Init: `functions/src/init.ts` (firebase-admin initialization)

Active triggers:
1. `ContactRequest_OnCreate_SendEmail` - Sends support email on contact form submission
   - Trigger: `onDocumentCreated("contactRequests/{contactRequestId}")`
   - Handler: `functions/src/contact-request/on-create-contact-request.ts`
2. `WelcomeEmail_OnCreate_SendEmail` - Sends welcome email to new users
   - Trigger: `onDocumentCreated("welcomeEmails/{welcomeEmailId}")`
   - Handler: `functions/src/welcome-email/on-create-welcome-email.ts`
3. `Account_OnUpdate_SendSubscriptionEmail` - Sends email when user upgrades from free tier
   - Trigger: `onDocumentUpdated("accounts/{accountId}")`
   - Handler: `functions/src/subscription-email/on-update-account-entitlement.ts`
4. `accoutImportOnAddStartSLHSync` - Legacy data import from Setlist Helper
   - Trigger: `onDocumentCreated("accounts/{accountId}/imports/{importId}")`
   - Handler: `functions/src/sync-slh-data/sync-slh-data.ts`
   - Config: 540s timeout, 512MiB memory

Commented-out triggers (in `functions/src/index.ts`):
- `Lyrics_OnAdd_UpdateSongLyricsCount`
- `SetlistSong_OnAdd_UpdateSetlistSongStatistics`
- `Song_onAdd_UpdateSetlistCount`
- `Setlist_onAdd_UpdateSetlistCount`

**Firebase Storage:**
- Used for contact form screenshot attachments
- Storage rules: `storage.rules`
- Paths:
  - `/contact-attachments/{fileName}` - Screenshot uploads (write: <10MB images, read: blocked)
  - `/downloads/{fileName}` - Public downloadable files (read: public, write: blocked)
- Client: `@angular/fire/compat/storage` (AngularFireStorageModule)
- Admin access in Cloud Functions for downloading attachments

**Firebase Analytics:**
- `@angular/fire/compat/analytics` (AngularFireAnalyticsModule)
- Screen tracking: `ScreenTrackingService`
- User tracking: `UserTrackingService`
- Measurement ID: `G-WH7XCFGF5V`
- Configured in `src/main.ts`

**Firebase Hosting:**
- SPA hosting with `dist/` as public directory
- All routes rewrite to `/index.html`
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- CORS configured for auth endpoints (bandcentral.com)
- Static asset caching: 1 year immutable
- `index.html` caching: no-cache

## APIs & External Services

**Setlist Helper Legacy API:**
- Base URL: `https://setlisthelper.azurewebsites.net/api/v2.0/`
- Endpoints called from Cloud Functions (`functions/src/sync-slh-data/sync-slh-data.ts`):
  - `GET /Song` - Fetch all songs
  - `GET /Setlist` - Fetch all setlists
  - `GET /Tag` - Fetch all tags
- Auth: Bearer JWT token (obtained from legacy SLH login)
- Purpose: One-time data migration from old Setlist Helper app to Band Central
- Login UI: `src/app/features/accounts/login-legacy-setlist-helper/`

**Dropbox (Referenced, not directly integrated):**
- File references store Dropbox paths with `[DROPBOX]` prefix
- `dbxFileVersion`, `dbxAudioRev`, `dbxDocumentRev` fields on lyrics and file references
- Dropbox integration handled at the mobile app level; web stores path metadata only
- Model: `functions/src/model/file-reference.ts` (`FileReference` interface)

## Email (SMTP via Nodemailer)

**Transport:** SMTP via `nodemailer` ^6.9.0
- Configuration via Firebase Secrets:
  - `SMTP_HOST` - SMTP server hostname
  - `SMTP_PORT` - SMTP port (465 for TLS)
  - `SMTP_USER` - SMTP username
  - `SMTP_PASS` - SMTP password
- From address: `"Band Central" <{SMTP_USER}>`
- Reply-to: `support@bandcentral.com`

**Email Types:**
1. Contact request forwarding (`functions/src/contact-request/on-create-contact-request.ts`)
2. Welcome email to new users (`functions/src/welcome-email/on-create-welcome-email.ts`)
3. Subscription/trial upgrade notification (`functions/src/subscription-email/on-update-account-entitlement.ts`)

## Entitlement / Subscription System

**Approach:** Entitlement level stored on account document (`entitlementLevel` field)
- Tiers defined in `src/app/core/model/entitlement-limits.ts`:
  - `free` - 25 songs, 5 setlists, 1 band, 1 member
  - `solo` / `solo-free-trial` - Unlimited songs/setlists, 2 bands, 2 members
  - `band-small` / `band-small-free-trial` - 5 bands, 5 members
  - `band-medium` / `band-medium-free-trial` - 10 bands, 20 members
  - `band-large` / `band-large-free-trial` - Unlimited bands, 100 members
  - `band-extra-large` / `band-extra-large-free-trial` - Unlimited bands, 500 members
- No payment processor integration in the web app (entitlements managed externally, likely via RevenueCat on iOS/Android or manual admin)

## State Management

**NGXS Store:**
- Module: `src/app/core/store/account-state.module.ts`
- States:
  - `AccountState` - `src/app/core/store/account.state.ts` (accounts, selected account, users)
  - `SongState` - `src/app/core/store/song.state.ts`
  - `ArtistState` - `src/app/core/store/artist.state.ts`
  - `GenreState` - `src/app/core/store/genre.state.ts`
- Storage plugin: `@ngxs/storage-plugin` ^18.0.0 (persists state to localStorage/sessionStorage)

## Monitoring & Observability

**Logging:**
- Frontend: `ngx-logger` ^5.0.7 (TRACE in dev, OFF in production)
- Cloud Functions: `firebase-functions/v2` built-in `logger`

**Error Tracking:**
- Custom global error handler: `src/app/core/services/globar-error.handler.ts`
- No external error tracking service (Sentry, etc.)

**Analytics:**
- Firebase/Google Analytics via `@angular/fire/compat/analytics`

## SEO & Discovery

- `src/sitemap.xml` - Sitemap for search engines
- `src/llms.txt` - LLM-readable site description (served as static asset)

## Environment Configuration

**Required for frontend (in environment files, NOT secrets):**
- Firebase config (projectId, apiKey, authDomain, storageBucket, messagingSenderId, measurementId)
- `useEmulators` flag (boolean)
- Log level settings

**Required for Cloud Functions (Firebase Secrets):**
- `SMTP_HOST` - Email server
- `SMTP_PORT` - Email port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password

**Emulator Config (in `firebase.json`):**
- Auth: port 9099
- Functions: port 5001
- Firestore: port 8080
- Hosting: port 4999
- Storage: port 9199
- UI enabled

---

*Integration audit: 2026-04-15*
