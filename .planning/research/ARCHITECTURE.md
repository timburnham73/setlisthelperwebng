# Architecture Patterns

**Domain:** Band management SPA — adding SSR/prerendering, RBAC, and cross-band song sharing
**Researched:** 2026-04-15

## Current Architecture (Baseline)

```
Browser (SPA)
  |
  AppComponent (router-outlet, auth redirect)
  |
  +-- Public routes (home, tools, help, blog, contact, why, privacy-policy)
  |     No auth, no Firestore, static marketing/tool content
  |
  +-- Auth-gated routes (bands, admin, users, about)
        AngularFireAuthGuard -> redirect to /auth/login
        |
        +-- AccountState (NGXS) -> loads accounts where users[] contains uid
        +-- SongState (NGXS) -> loads songs under /accounts/{accountId}/songs
        +-- ArtistState, GenreState (NGXS) -> denormalized counts
        |
        Firestore (real-time via snapshotChanges)
```

**Key architectural facts:**
- All data scoped under `/accounts/{accountId}/` (multi-tenant)
- `Account.users[]` is a flat string array of UIDs (no roles in this array)
- `AccountUser` subcollection (`/accounts/{accountId}/users/{docId}`) has a `role` field — already exists but is not enforced anywhere
- Firestore rules use `request.auth.uid in resource.data.users` for all subcollection access — no role differentiation
- Owner checks are done client-side only: `currentUser.uid !== account.ownerUser.uid`
- NGXS state classes inject `AngularFirestore` directly (no service layer for reads)

## Recommended Architecture (After Milestone)

### Component Boundary Map

```
BUILD TIME (SSG)
  |
  @angular/ssr prerenderer
  |
  +-- Static HTML for ~12 public routes
  |     Guarded: no browser APIs, no Firestore, no auth
  |     Output: dist/home/index.html, dist/tools/index.html, etc.

BROWSER (SPA — unchanged for auth routes)
  |
  AppComponent
  |   (isPlatformBrowser guard on auth redirect subscription)
  |
  +-- Public routes: hydrate from prerendered HTML, then SPA takeover
  |
  +-- Auth-gated routes:
        |
        +-- RoleService (NEW) --- reads AccountUser.role for current user
        |     Caches role per accountId to avoid repeated reads
        |     Exposes: currentRole$, canEdit$, canDelete$, canManageMembers$
        |
        +-- RoleGuard (NEW) --- route-level guard for admin/owner routes
        |
        +-- Existing NGXS states (unchanged)
        |     SongState, AccountState, ArtistState, GenreState
        |
        +-- SongSharingService (NEW) --- cross-band copy logic
        |     Reads from source account, writes to target account
        |     Requires user membership in both accounts
        |
        +-- ShareToBandDialogComponent (NEW) --- band picker UI
        |
        +-- UI components --- conditionally show/hide actions based on role
              (song-list, setlist-list, lyrics, account settings)

FIRESTORE (rules updated)
  |
  +-- /accounts/{accountId} --- Owner-only for delete; member for read
  +-- /accounts/{accountId}/users/{userId} --- role field enforced
  +-- /accounts/{accountId}/songs/{songId} --- role-based write rules
  +-- /accounts/{accountId}/setlists/... --- role-based write rules
  +-- /accounts/{accountId}/tags/... --- role-based write rules
```

### Component Boundaries

| Component | Responsibility | Communicates With | New/Existing |
|-----------|---------------|-------------------|--------------|
| `@angular/ssr` prerenderer | Generates static HTML at build time for public routes | Angular build pipeline, routes.txt | NEW |
| `AppComponent` | Root shell, auth redirect (browser-only) | Router, AuthService | MODIFIED (platform guard) |
| `RoleService` | Reads and caches user role per account from Firestore | AngularFirestore, AuthService | NEW |
| `RoleGuard` | Blocks route access based on role | RoleService, Router | NEW |
| `RoleDirective` (`*appIfRole`) | Structural directive hiding UI elements by role | RoleService | NEW |
| `SongSharingService` | Copies songs + user lyrics between accounts | AngularFirestore, SongService | NEW |
| `ShareToBandDialogComponent` | Band picker dialog for sharing | AccountState, SongSharingService | NEW |
| `SongListComponent` | Song table with actions | SongState, RoleService (for conditional actions) | MODIFIED |
| `SetlistListComponent` | Setlist table with actions | SetlistState, RoleService | MODIFIED |
| Firestore security rules | Server-side RBAC enforcement | Firebase Auth, Firestore docs | MODIFIED |
| `SongState` (NGXS) | Song CRUD + state management | AngularFirestore, SongService | MODIFIED (add sharing action) |
| `AccountState` (NGXS) | Account loading, user management | AngularFirestore | UNCHANGED |
| Cloud Functions | Server-side triggers (email, sync) | Firestore triggers | UNCHANGED |

## Data Flow

### 1. SSR/Prerendering Data Flow (Build Time)

```
ng build --configuration=production
  |
  Angular Application Builder reads angular.json
  |
  prerender.routesFile = "routes.txt" (12 public routes)
  discoverRoutes = false (skip auth routes)
  ssr = false (no live server)
  |
  For each route in routes.txt:
    Bootstrap Angular app in Node.js
    Render component tree to HTML string
    Write to dist/{route}/index.html
  |
  Output: static HTML + browser bundle
  |
  firebase deploy --only hosting
  |
  Firebase Hosting CDN:
    GET /home -> serves dist/home/index.html (prerendered)
    GET /bands -> no matching file -> rewrites to index.html (SPA)
```

**Critical boundary:** Prerendered routes must NOT touch AngularFirestore, AngularFireAuth, localStorage, window, or document. The prerenderer runs in Node.js where none of these exist. The existing `WINDOW` injection token, AppComponent auth subscription, and any component using `document.getElementById` must be guarded with `isPlatformBrowser()`.

### 2. RBAC Data Flow (Runtime)

```
User logs in -> Firebase Auth -> uid
  |
  User selects account (band) -> accountId
  |
  AccountState dispatches LoadAccounts(uid)
  -> Firestore: /accounts where users[] contains uid
  -> Returns accounts with ownerUser, users[], entitlementLevel
  |
  RoleService.loadRole(accountId, uid) [NEW]
  -> Firestore: /accounts/{accountId}/users where uid == currentUser.uid
  -> Returns AccountUser document with role field
  -> Caches: { accountId -> 'owner' | 'admin' | 'member' }
  -> Emits: currentRole$, canEdit$, canDelete$, canManageMembers$
  |
  Components subscribe to RoleService observables:
  |
  SongListComponent:
    canEdit$ == true  -> show Add/Edit buttons
    canDelete$ == true -> show Delete button
    canShare$ == true -> show Share to Band button (admin+)
    canEdit$ == false -> hide Add/Edit/Delete, show read-only view
  |
  Firestore Security Rules (server-side enforcement):
    Write to /accounts/{accountId}/songs:
      -> Read /accounts/{accountId}/users/{request.auth.uid}
      -> Check role field: 'admin' or 'owner' required for create/update
      -> 'owner' required for delete
      -> 'member' gets read-only
```

**Role hierarchy (fixed 3-tier):**

| Role | Read songs/setlists | Create/edit songs/setlists | Delete songs/setlists | Manage members | Share to band |
|------|--------------------|--------------------------|-----------------------|----------------|--------------|
| Member | Yes | Own lyrics only | No | No | No |
| Admin | Yes | Yes | No | No | Yes |
| Owner | Yes | Yes | Yes | Yes | Yes |

**Where the `ownerUser` field fits:** The Account document already has `ownerUser: { uid, displayName, ... }`. The Owner role in the `/users` subcollection must match this UID. When an account is created, the creator becomes the owner. The `ownerUser` field on the account doc remains the source of truth for "who is the owner" and should be kept in sync with the role in the users subcollection.

### 3. Cross-Band Song Sharing Data Flow

```
User is member of Band A (source) and Band B (target)
  |
  SongListComponent: user selects song(s) -> "Share to Band"
  |
  ShareToBandDialogComponent opens:
    -> AccountState.all$ filtered to exclude current account
    -> User picks target band (Band B)
    -> Confirms: "Copy N song(s) to Band B? Only your lyrics included."
  |
  SongSharingService.shareSongsToBand(songs[], sourceAccountId, targetAccountId, currentUser):
    |
    For each song:
      1. Read song from /accounts/{sourceAccountId}/songs/{songId}
         (Already in SongState — use snapshot, no extra read)
      |
      2. Build new song document:
         - Copy all metadata fields (name, artist, genre, key, tempo, etc.)
         - Set sourceAccountId = sourceAccountId
         - Set sourceSongId = songId
         - Set sharedTo = [] (copy has no shares)
         - Reset countOfLyrics = 0, tags = [], setlists = []
         - Set dateCreated = serverTimestamp()
         - Set createdByUser = currentUser
      |
      3. Write new song to /accounts/{targetAccountId}/songs/{newSongId}
      |
      4. Query lyrics: /accounts/{sourceAccountId}/songs/{songId}/lyrics
         where createdByUser.uid == currentUser.uid AND deleted == false
         |
         For each matching lyric:
           - Copy all fields
           - Set sourceLyricId = original lyric ID
           - Set songId = newSongId
           - Set defaultForUsers = [currentUser.uid] (first lyric only)
           - Write to /accounts/{targetAccountId}/songs/{newSongId}/lyrics/{newLyricId}
           - Increment countOfLyrics on new song
      |
      5. Update source song: arrayUnion sharedTo with {accountId: targetAccountId, songId: newSongId}
      |
      6. Increment /accounts/{targetAccountId}.countOfSongs
    |
    Use Firestore batch write for atomicity (per song + its lyrics)
    If > 500 operations, split into multiple batches
  |
  Result: Show success notification
  SongState in target band will auto-update via snapshotChanges() if user navigates there
```

**Security for cross-band reads:** The existing Firestore rule already allows reads if `request.auth.uid in resource.data.users`. Since the user must be a member of both bands, they already have read access to the source and write access to the target. No new security rules needed for the copy itself — but the user's role in the target band must be Admin or Owner to write songs there.

### 4. Interaction Between Features

```
SSR/Prerendering <---> RBAC: No interaction
  Prerendered routes are public (no auth, no roles)
  Auth-gated routes remain CSR-only

SSR/Prerendering <---> Sharing: No interaction
  Sharing is auth-gated; prerender never touches it

RBAC <---> Sharing: Direct dependency
  Sharing requires Admin or Owner role in TARGET band
  Sharing requires Member+ role in SOURCE band (read access)
  RoleService must be available before ShareToBandDialog can determine valid targets
```

## RBAC Integration with Existing Firestore Security Rules

### Current Rules (Problem)

The current wildcard subcollection rule grants full read/write to ALL members:

```
match /accounts/{accountId}/{document=**} {
  allow read, write, delete:
    if request.auth.uid in get(/databases/$(database)/documents/accounts/$(accountId)).data.users;
}
```

This means any band member can delete any song. RBAC must restrict this.

### Proposed Rules (Solution)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: get user's role in an account
    function getUserRole(accountId) {
      let userDocs = getAfter(/databases/$(database)/documents/accounts/$(accountId)/users/$(request.auth.uid));
      return userDocs.data.role;
    }

    // Helper: is user a member of this account?
    function isMember(accountId) {
      return request.auth.uid in get(/databases/$(database)/documents/accounts/$(accountId)).data.users;
    }

    // Helper: is user admin or owner?
    function isAdminOrOwner(accountId) {
      return isMember(accountId)
        && getUserRole(accountId) in ['admin', 'owner'];
    }

    // Helper: is user the owner?
    function isOwner(accountId) {
      return isMember(accountId)
        && getUserRole(accountId) == 'owner';
    }

    // Accounts
    match /accounts/{accountId} {
      allow read: if isMember(accountId)
                  || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.systemAdmin == true;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.users;
      allow update: if isMember(accountId)
                    && (request.resource.data.ownerUser.uid == resource.data.ownerUser.uid
                    || request.auth.uid == resource.data.ownerUser.uid);
      allow delete: if isOwner(accountId);
    }

    // Account users subcollection (role management)
    match /accounts/{accountId}/users/{userId} {
      allow read: if isMember(accountId);
      allow create, update: if isOwner(accountId);
      allow delete: if isOwner(accountId);
    }

    // Songs
    match /accounts/{accountId}/songs/{songId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isOwner(accountId);
    }

    // Lyrics (members can create/edit their OWN lyrics)
    match /accounts/{accountId}/songs/{songId}/lyrics/{lyricId} {
      allow read: if isMember(accountId);
      allow create: if isMember(accountId);
      allow update: if isMember(accountId)
                    && (resource.data.createdByUser.uid == request.auth.uid
                        || isAdminOrOwner(accountId));
      allow delete: if isOwner(accountId)
                    || (resource.data.createdByUser.uid == request.auth.uid);
    }

    // Setlists
    match /accounts/{accountId}/setlists/{setlistId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isOwner(accountId);
    }

    // Setlist songs
    match /accounts/{accountId}/setlists/{setlistId}/songs/{setlistSongId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isAdminOrOwner(accountId);
    }

    // Tags
    match /accounts/{accountId}/tags/{tagId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isOwner(accountId);
    }

    // Artists / Genres (denormalized, managed by song operations)
    match /accounts/{accountId}/artists/{artistId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isOwner(accountId);
    }
    match /accounts/{accountId}/genres/{genreId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isOwner(accountId);
    }

    // Imports
    match /accounts/{accountId}/imports/{importId} {
      allow read: if isMember(accountId);
      allow create, update: if isAdminOrOwner(accountId);
      allow delete: if isOwner(accountId);
    }

    // Contact requests, welcome emails, users (unchanged)
    match /contactRequests/{requestId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    match /welcomeEmails/{emailId} {
      allow create: if request.auth != null;
      allow read, update, delete: if false;
    }
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && request.auth.uid == uid;
      allow delete: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**Important caveat:** The `getUserRole()` helper function reads from the `/accounts/{accountId}/users/{uid}` document. This uses `getAfter()` for writes (in case the role document is being created in the same batch) or `get()` for reads. However, the current AccountUser subcollection uses auto-generated document IDs (not the user's UID as the doc ID). This is a problem because the security rule needs to look up by UID.

**Required data model change:** AccountUser documents must use the user's UID as the document ID (i.e., `/accounts/{accountId}/users/{uid}` instead of auto-generated IDs). This makes the security rule lookup `get(/accounts/$(accountId)/users/$(request.auth.uid))` work directly. This requires a data migration for existing accounts.

### Migration Strategy for AccountUser Doc IDs

1. Write a Cloud Function (one-time migration script) that:
   - For each account, reads all docs in the `/users` subcollection
   - Re-creates each doc using `uid` as the document ID
   - Deletes the old auto-ID docs
2. Update `AccountState.AddUserToAccount` to use `doc(user.uid)` instead of `add()`
3. Update `AccountState.RemoveUserFromAccount` to use `doc(user.uid)` instead of querying
4. Update `AccountState.UpdateAccountUserRole` similarly

This migration is a prerequisite for RBAC security rules.

## Prerendering Coexisting with Auth-Gated SPA Routes

**The two rendering modes coexist cleanly because they serve different route sets:**

| Route Type | Rendering | Served As | Example |
|-----------|-----------|-----------|---------|
| Public (marketing/tools) | Prerendered at build time (SSG) | Static HTML from CDN | /home, /tools/metronome |
| Auth-gated (app features) | Client-side rendered (CSR) | SPA bootstrap from index.html | /bands, /bands/:id/songs |

**How Firebase Hosting resolves this:**

1. Request arrives: `GET /home`
2. Firebase checks: does `dist/home/index.html` exist? YES -> serve it (prerendered HTML)
3. Browser receives full HTML, hydrates with Angular (client takes over)

vs.

1. Request arrives: `GET /bands/abc123/songs`
2. Firebase checks: does `dist/bands/abc123/songs/index.html` exist? NO
3. Falls back to rewrite rule: serve `index.html` (SPA shell)
4. Angular bootstraps in browser, router resolves `/bands/abc123/songs`, auth guard checks login

**No conflict.** The prerenderer explicitly lists routes via `routes.txt` with `discoverRoutes: false`. Auth-gated routes are never prerendered. The SPA fallback (`index.html`) handles everything not in routes.txt.

**Angular hydration:** Prerendered pages include `provideClientHydration()` which lets Angular reuse the server-rendered DOM instead of destroying and recreating it. This provides a smooth transition from static HTML to interactive SPA.

## Patterns to Follow

### Pattern 1: RoleService with Per-Account Caching

```typescript
@Injectable({ providedIn: 'root' })
export class RoleService {
  private roleCache = new Map<string, BehaviorSubject<AccountRole>>();

  constructor(
    private db: AngularFirestore,
    private authService: AuthenticationService
  ) {}

  /**
   * Get the current user's role in a specific account.
   * Caches and returns a live observable (updates if role changes in Firestore).
   */
  getRole(accountId: string): Observable<AccountRole> {
    if (!this.roleCache.has(accountId)) {
      this.roleCache.set(accountId, new BehaviorSubject<AccountRole>('member'));
      this.authService.user$.pipe(
        switchMap(user => {
          if (!user?.uid) return of('member' as AccountRole);
          // After migration: doc ID = uid
          return this.db.doc<AccountUser>(
            `/accounts/${accountId}/users/${user.uid}`
          ).valueChanges().pipe(
            map(doc => (doc?.role as AccountRole) ?? 'member')
          );
        })
      ).subscribe(role => this.roleCache.get(accountId)!.next(role));
    }
    return this.roleCache.get(accountId)!.asObservable();
  }

  canEdit(accountId: string): Observable<boolean> {
    return this.getRole(accountId).pipe(
      map(role => role === 'admin' || role === 'owner')
    );
  }

  canDelete(accountId: string): Observable<boolean> {
    return this.getRole(accountId).pipe(
      map(role => role === 'owner')
    );
  }

  canManageMembers(accountId: string): Observable<boolean> {
    return this.getRole(accountId).pipe(
      map(role => role === 'owner')
    );
  }

  clearCache(): void {
    this.roleCache.forEach(s => s.complete());
    this.roleCache.clear();
  }
}

export type AccountRole = 'member' | 'admin' | 'owner';
```

### Pattern 2: Structural Directive for Role-Based UI

```typescript
@Directive({ selector: '[appIfRole]', standalone: true })
export class IfRoleDirective implements OnInit, OnDestroy {
  @Input() appIfRole: AccountRole | AccountRole[];
  @Input() appIfRoleAccountId: string;

  private sub: Subscription;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    const roles = Array.isArray(this.appIfRole) ? this.appIfRole : [this.appIfRole];
    this.sub = this.roleService.getRole(this.appIfRoleAccountId).subscribe(role => {
      if (roles.includes(role) && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!roles.includes(role) && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
```

Usage in templates:
```html
<button *appIfRole="['admin', 'owner']; accountId: accountId" (click)="onAddSong()">
  Add Song
</button>
```

### Pattern 3: Batch Write for Song Sharing

```typescript
@Injectable({ providedIn: 'root' })
export class SongSharingService {
  constructor(private db: AngularFirestore) {}

  shareSongsToBand(
    songs: Song[],
    sourceAccountId: string,
    targetAccountId: string,
    currentUser: BaseUser
  ): Observable<{ copied: number; failed: number }> {
    // Process songs sequentially to stay within batch limits
    return from(songs).pipe(
      concatMap(song => this.shareSingleSong(song, sourceAccountId, targetAccountId, currentUser)),
      toArray(),
      map(results => ({
        copied: results.filter(r => r).length,
        failed: results.filter(r => !r).length
      }))
    );
  }

  private shareSingleSong(
    song: Song,
    sourceAccountId: string,
    targetAccountId: string,
    currentUser: BaseUser
  ): Observable<boolean> {
    // 1. Build batch: new song doc + lyrics + source update + count increment
    // 2. Query source lyrics where createdByUser.uid == currentUser.uid
    // 3. Execute batch
    // Keep each song in its own batch (song + its lyrics < 500 ops)
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side-Only RBAC

**What:** Hiding UI buttons but not enforcing in Firestore rules.
**Why bad:** Any user with dev tools can call Firestore directly and bypass client-side checks. The current codebase does this for owner-only delete (checks `currentUser.uid !== account.ownerUser.uid` only in the component).
**Instead:** Always enforce in Firestore security rules. Client-side checks are for UX only (hiding buttons users can't use), not security.

### Anti-Pattern 2: Reading Role on Every Firestore Operation

**What:** Having security rules call `get()` on the user's role doc for every single read/write.
**Why bad:** Each `get()` in a security rule counts as a Firestore read and adds latency. For a page that loads songs, setlists, tags, artists, and genres, that could be 5+ extra reads per page load.
**Instead:** This is an acceptable cost at current scale (~15 users). The role doc read is cached within a single security rule evaluation, so multiple rules in one request share the cache. At scale, consider moving roles to Firebase custom claims (stored in the auth token, zero extra reads).

### Anti-Pattern 3: Prerendering Auth-Gated Routes

**What:** Including `/bands`, `/admin`, or any auth-required route in routes.txt.
**Why bad:** The prerenderer has no auth context. These routes render as empty shells or redirect pages. Worse, AngularFire's Firestore listeners will hang the build indefinitely.
**Instead:** Only prerender public routes. Set `discoverRoutes: false` in angular.json.

### Anti-Pattern 4: Shared Song References Instead of Copies

**What:** Making Band B's song a live reference to Band A's song document.
**Why bad:** Violates the multi-tenant boundary. Band B's Firestore rules would need to allow reads from Band A's subcollection. Any edit in Band A instantly affects Band B without consent. Deletion in Band A breaks Band B.
**Instead:** Use the copy-based approach. Each band owns its own copy. Source reference stored for optional future re-sync.

## Suggested Build Order (Dependencies)

### Phase 1: SSR/Prerendering (No dependencies on RBAC or sharing)

**What:** Add `@angular/ssr`, create routes.txt, guard browser APIs, deploy prerendered public pages.

**Why first:**
- Zero interaction with RBAC or sharing features
- Immediately improves SEO (the stated #1 priority for user acquisition)
- Smallest blast radius (only public routes affected)
- Validates the build pipeline changes before adding more features

**Prerequisite work:** Guard `isPlatformBrowser()` in 12 identified files.

### Phase 2: RBAC Foundation (Prerequisite for sharing)

**What:** Migrate AccountUser doc IDs to use UID, update Firestore rules, build RoleService, add role directive, update existing components.

**Why second:**
- Sharing requires RBAC to determine who can write to the target band
- Must ship before sharing because sharing without role checks means any Member can flood a band with copied songs
- The AccountUser doc ID migration must happen before new security rules deploy

**Sub-phases:**
1. Data migration: AccountUser docs keyed by UID
2. Firestore rules: role-based read/write
3. RoleService + RoleDirective
4. Update all CRUD components (song-list, setlist-list, etc.) to use role checks
5. Update account management UI for role assignment

### Phase 3: Cross-Band Song Sharing (Depends on RBAC)

**What:** SongSharingService, ShareToBandDialog, Song model updates (sourceAccountId, sourceSongId, sharedTo), UI integration.

**Why third:**
- Requires RBAC to be in place (only Admin/Owner in target band can receive shared songs)
- Song model changes are additive (new optional fields, no migration needed)
- Can be tested end-to-end only after roles are enforced

**Sub-phases:**
1. Song model: add sourceAccountId, sourceSongId, sharedTo fields
2. SongSharingService: copy logic with batch writes
3. ShareToBandDialog: band picker UI
4. Song list UI: share action (context menu or multi-select)
5. Shared song indicator (badge/icon showing song was copied from another band)

### Phase 4: Duplicate Setlist for All Users (Independent, low effort)

**What:** Remove systemAdmin gate from duplicate setlist feature.

**Why last:** Smallest change, independent of everything else, can ship anytime.

## Scalability Considerations

| Concern | At 15 users (now) | At 1K users | At 10K users |
|---------|-------------------|-------------|-------------|
| Firestore rule `get()` for role checks | Negligible cost | Acceptable (~$0.06/day extra) | Consider moving roles to custom claims |
| Prerendering build time | < 30 seconds for 12 routes | Same (routes don't scale with users) | Same |
| Song sharing batch writes | Single batch per song | Add progress indicator for bulk | Consider Cloud Function for > 50 songs |
| NGXS localStorage persistence | `keys: '*'` works fine | May want selective keys | Selective keys + quota monitoring |
| Real-time listeners per user | ~5 concurrent (songs, setlists, etc.) | Same per user | Same per user; Firestore handles this |

## Sources

- Codebase analysis: `firestore.rules`, `auth.service.ts`, `account.ts`, `AccountUser.ts`, `song.state.ts`, `account.state.ts`, `song.service.ts`, `song-list.component.ts`, `app-routing.module.ts`, `main.ts`
- SSR research: `.planning/phases/ssr-research/RESEARCH.md` (HIGH confidence)
- Cross-band sharing spec: `bandcentral-pm/features/cross-band-song-sharing.md` (HIGH confidence, authored by project owner)
- Angular 18 prerendering: https://v18.angular.dev/guide/prerendering/ (HIGH confidence)
- Firebase Hosting rewrites: https://firebase.google.com/docs/hosting/full-config (HIGH confidence)
- Firestore security rules with `get()`: https://firebase.google.com/docs/firestore/security/rules-conditions (HIGH confidence)

---

*Architecture analysis: 2026-04-15*
