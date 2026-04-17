# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Feature-module Angular SPA with NGXS state management and Firebase backend (Firestore + Cloud Functions)

**Key Characteristics:**
- Lazy-loaded feature modules with dedicated routing modules
- NGXS store for state management (accounts, songs, artists, genres)
- All components are standalone (Angular 18 standalone component pattern)
- Feature modules still use NgModule for routing/lazy-loading but import standalone components
- Firebase compat API throughout (not modular Firebase SDK)
- Multi-tenant data model: all user data scoped under `/accounts/{accountId}/`
- Cloud Functions (v2) for server-side triggers (email, data sync)

## Layers

**Presentation Layer (Components):**
- Purpose: UI rendering, user interaction, dialog management
- Location: `src/app/features/*/`
- Contains: Standalone components with Material Design UI
- Depends on: NGXS Store, Core Services, Shared Module
- Used by: Angular Router

**State Management Layer (NGXS Store):**
- Purpose: Centralized state for accounts, songs, artists, genres
- Location: `src/app/core/store/`
- Contains: State classes, action classes, state module
- Depends on: AngularFirestore (direct Firestore access in state classes)
- Used by: Components via `Store.select()` and `Store.dispatch()`
- Pattern: State classes contain Firestore queries directly (no service intermediary for most operations)

**Service Layer:**
- Purpose: Business logic, Firebase interactions, utilities
- Location: `src/app/core/services/`
- Contains: Injectable services for CRUD, auth, notifications
- Depends on: AngularFirestore, AngularFireAuth
- Used by: State classes, components directly

**Data Model Layer:**
- Purpose: TypeScript interfaces and factory classes for Firestore documents
- Location: `src/app/core/model/`
- Contains: Interfaces extending `Base`, factory classes for add/update operations
- Depends on: Firebase Timestamp
- Used by: Services, state classes, components

**Cloud Functions Layer:**
- Purpose: Server-side triggers for email, data sync, document counting
- Location: `functions/src/`
- Contains: Firestore trigger functions (v2 API)
- Depends on: firebase-admin, firebase-functions
- Used by: Triggered by Firestore document events

**Shared/Layout Layer:**
- Purpose: Reusable components, pipes, directives, layout shells
- Location: `src/app/shared/`
- Contains: Layout components, pipes, directives, confirm dialog
- Depends on: Angular Material, Core Services
- Used by: All feature modules

## Data Flow

**Authenticated Feature Data Flow (e.g., loading songs):**

1. Component constructor dispatches NGXS action: `store.dispatch(new SongActions.LoadSongs(accountId, sortField, sortOrder))`
2. `SongState` action handler queries Firestore via `AngularFirestore` with `snapshotChanges()`
3. Firestore returns real-time observable stream
4. State handler maps snapshots to domain objects and patches state via `setState(patch({...}))`
5. Component subscribes to state selector: `store.select(SongState.all)`
6. Template renders via `async` pipe or manual subscription

**Song Add Flow (with side effects):**

1. Component opens `SongEditDialogComponent` via `MatDialog`
2. Dialog submits -> dispatches `SongActions.AddSong`
3. `SongState` delegates to `SongService.addSong()` which uses a Firestore batch write
4. Batch: creates song doc, increments account `countOfSongs`, upserts artist/genre docs
5. State patches songs array with `append([newSong])`

**State Management:**
- NGXS with storage plugin persists ALL state keys to localStorage (`NgxsStoragePluginModule.forRoot({ keys: '*' })` in `src/app/core/store/account-state.module.ts`)
- `AccountState` is registered as a feature state via `AccountStateModule`
- `SongState`, `ArtistState`, `GenreState` are registered as root-level provided states via `provideStates()` in `src/main.ts`
- State classes inject `AngularFirestore` directly and perform queries within action handlers

## Key Abstractions

**Base Interface:**
- Purpose: Common fields for all Firestore documents
- Definition: `src/app/core/model/base.ts`
- Fields: `id`, `name`, `nameLowered`, `dateCreated`, `lastEdit`, `createdByUser`, `lastUpdatedByUser`
- All domain models (`Account`, `Song`, `Setlist`, `Tag`, etc.) extend `Base`

**BaseFactory Pattern:**
- Purpose: Standardize add/update payloads with audit fields
- Definition: `src/app/core/model/factory/base.factory.ts`
- Subclasses: `SongFactory`, `ArtistFactory`, `GenreFactory`, `SetlistSongFactory`
- `getForAdd()`: adds `dateCreated`, `createdByUser` fields
- `getForUpdate()`: adds `lastEdit`, `lastUpdatedByUser`, `nameLowered` fields

**Account (multi-tenant root):**
- Purpose: Top-level entity representing a band/group
- Definition: `src/app/core/model/account.ts`
- All data is nested under `/accounts/{accountId}/` in Firestore
- Contains: `users[]` array, `ownerUser`, `countOfSongs`, `countOfSetlists`, `entitlementLevel`
- Uses static helper `AccountHelper` instead of factory pattern (older pattern)

**Layout Components:**
- `LayoutComponent` (`src/app/shared/layout/layout.component.ts`): Authenticated view with sidebar navigation, account switcher, responsive design
- `LayoutNoSidebarComponent` (`src/app/shared/layout-no-sidebar/layout-no-sidebar.component.ts`): Authenticated view without sidebar (for account selection, simpler views)
- `LayoutNoSidebarChildViewComponent` (`src/app/shared/layout-no-sidebar-child-view/`): Child view variant for nested routes (setlist songs, lyrics)

## Entry Points

**Browser Entry:**
- Location: `src/main.ts`
- Triggers: Browser loads the app
- Responsibilities: Bootstraps `AppComponent` with standalone API (`bootstrapApplication`), configures providers (Firebase, NGXS, Material modules), sets up emulator connections for dev

**App Component:**
- Location: `src/app/app.component.ts`
- Triggers: Bootstrap
- Responsibilities: Root `<router-outlet>`, redirects authenticated users from `/`, `/home`, `/auth/login` to `/bands`

**Cloud Functions Entry:**
- Location: `functions/src/index.ts`
- Triggers: Firestore document events
- Active functions: `ContactRequest_OnCreate_SendEmail`, `WelcomeEmail_OnCreate_SendEmail`, `Account_OnUpdate_SendSubscriptionEmail`, `accoutImportOnAddStartSLHSync`
- Several triggers are commented out (lyrics count, setlist song stats, song/setlist count)

## Routing Architecture

**Top-level routes** (`src/app/app-routing.module.ts`):
- All feature modules are lazy-loaded via `loadChildren`
- Protected routes use `AngularFireAuthGuard` with `redirectUnauthorizedTo(['auth/login'])`
- `CustomRouteReuseStrategy` (`src/app/core/route-reuse-strategy/custom-route-reuse-strategy.ts`) caches routes marked with `data: { shouldReuse: true }` (used by `/bands` and song/setlist list views)
- Wildcard `**` redirects to `/home`

**Nested routing hierarchy:**
```
/home              -> HomeModule (public landing)
/auth              -> AuthModule (login)
/bands             -> AccountsModule
  /:accountid/songs    -> SongsModule
    /:songid/lyrics    -> LyricsModule
  /:accountid/setlists -> SetlistModule
    /:setlistid/songs  -> SetlistSongsListComponent
    /:setlistid/print  -> SetlistPrintComponent
    /:setlistid/songs/:songid/lyrics -> LyricsModule
  /:accountid/tags     -> TagsModule
  /:accountid/import   -> ImportModule
/admin             -> AdminModule (protected)
/users             -> UsersModule (protected)
/tools             -> ToolsModule (public)
/help              -> HelpModule (public)
/blog              -> BlogModule (public)
/contact           -> ContactModule (public)
/why               -> WhyBandCentralModule (public)
/privacy-policy    -> PrivacyPolicyModule (public)
/about             -> AboutModule (protected)
```

**Layout assignment in child routes:**
- `LayoutComponent` wraps views that need sidebar navigation (songs list, setlists list)
- `LayoutNoSidebarComponent` wraps account home/selection
- `LayoutNoSidebarChildViewComponent` wraps detail/edit views (lyrics, setlist songs, print)

## Error Handling

**Strategy:** Minimal centralized error handling

**Patterns:**
- `GlobalErrorHandler` exists at `src/app/core/services/globar-error.handler.ts` but is **commented out** in `CoreModule`
- `SpinnerInterceptor` (`src/app/core/interceptors/spinner.interceptor.ts`) shows/hides spinner on HTTP requests and hides on error
- NGXS state classes have `error` fields but errors are typically caught at the service/observable level
- User-facing errors shown via `NotificationService.openSnackBar()` (`src/app/core/services/notification.service.ts`)

## Cross-Cutting Concerns

**Authentication:** Firebase Auth via `AngularFireAuth` compat API. `AuthenticationService` (`src/app/core/services/auth.service.ts`) exposes observables: `isLoggedIn$`, `user$`, `roles$`, `displayName$`. Route guards use `AngularFireAuthGuard`.

**Authorization:** Role-based via Firebase custom claims (`admin` claim). Owner-only operations checked in components by comparing `currentUser.uid` against `account.ownerUser.uid`. Entitlement limits checked via `getEntitlementLimits()` (`src/app/core/model/entitlement-limits.ts`).

**Loading/Spinner:** `SpinnerService` (`src/app/core/services/spinner.service.ts`) toggled by `SpinnerInterceptor` for HTTP requests. NGXS state classes track `loading` boolean for Firestore operations.

**Notifications:** `NotificationService` wraps Material `MatSnackBar` for toast-style messages.

**Validation:** Angular Reactive Forms with custom validators in `src/app/shared/validators/`.

**Firestore Data Structure:**
```
/accounts/{accountId}                    - Band/group document
/accounts/{accountId}/users/{userId}     - Band members
/accounts/{accountId}/songs/{songId}     - Songs
/accounts/{accountId}/songs/{songId}/lyrics/{lyricId} - Lyrics
/accounts/{accountId}/setlists/{setlistId} - Setlists
/accounts/{accountId}/setlists/{setlistId}/songs/{setlistSongId} - Setlist songs
/accounts/{accountId}/tags/{tagId}       - Tags
/accounts/{accountId}/artists/{artistId} - Artists (denormalized counts)
/accounts/{accountId}/genres/{genreId}   - Genres (denormalized counts)
/accounts/{accountId}/imports/{importId} - Import jobs
/contactRequests/{id}                    - Contact form submissions
/welcomeEmails/{id}                      - Welcome email triggers
```

---

*Architecture analysis: 2026-04-15*
