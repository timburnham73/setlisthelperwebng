# Technology Stack

**Project:** Band Central Web -- SSR/Prerendering, RBAC, Cross-Band Song Sharing
**Researched:** 2026-04-15
**Overall Confidence:** HIGH

## Recommended Stack

### SSR / Prerendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@angular/ssr` | 18.2.21 | Build-time prerendering (SSG) of ~12 public routes | Official Angular 18 package; replaces deprecated `@nguniversal/*`. Produces static HTML at build time with zero runtime server cost. [VERIFIED: npm registry, Angular 18 docs] |
| `@angular/platform-server` | ^18.1.1 | Server-side Angular platform (installed by `ng add @angular/ssr`) | Required dependency for prerendering; installed automatically by the schematic |

**Configuration approach:** Use `routes.txt` + `"prerender": { "routesFile": "routes.txt", "discoverRoutes": false }` + `"ssr": false` in angular.json. This generates static HTML for listed public routes without creating a live SSR server. Auth-gated routes stay as client-side SPA.

**Do NOT use:**
- `@nguniversal/*` -- Deprecated since Angular 17. Dead package.
- Firebase "framework-aware" hosting -- Closed to new signups, deprecated in favor of Firebase App Hosting. Not needed for static prerendering anyway.
- Firebase App Hosting -- Overkill. Designed for runtime SSR servers. This project only needs static file hosting, which standard Firebase Hosting already provides.
- Angular 19+ `RenderMode` enum -- Not available in Angular 18. The v18 `routes.txt` approach is the correct pattern for this version.
- Puppeteer/Playwright crawl scripts -- Fragile, no hydration support, maintenance burden. Use only as emergency fallback if `@angular/fire` compat blocks prerendering.

### RBAC (Role-Based Access Control)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Firestore document fields | N/A | Store `userRoles` map on Account documents | Already using Firestore for all data. Adding a `userRoles: { [uid]: 'owner' | 'admin' | 'member' }` map to the Account model is the simplest approach at current scale (~15 subscribers). No new dependencies needed. |
| Firestore Security Rules | v2 | Server-side enforcement of role permissions | Already in use. Extend existing rules to check `resource.data.userRoles[request.auth.uid]` for write operations. This is the ONLY place permissions are enforced -- UI gating is convenience, not security. |
| Angular Route Guards (`CanActivate`) | Built-in | Client-side route protection based on NGXS role state | Already using guards for auth. Add role-aware guards that read from NGXS store. |
| NGXS Store | ^18.0.0 | Centralized role state for UI gating | Already the state management solution. Add role selectors (e.g., `AccountState.currentUserRole`) to drive UI visibility of edit/delete/share actions. |

**Do NOT use:**
- Firebase Custom Claims -- Requires Admin SDK to set, adds 1-hour propagation delay for role changes, tokens must be force-refreshed. Overkill for 3 fixed roles at this scale. Store roles in Firestore documents where they update instantly and are readable by security rules via `get()`.
- `ngx-permissions` library -- Adds a separate permission system parallel to NGXS. Unnecessary complexity when NGXS selectors + route guard pattern achieves the same result with no new dependency.
- Cloud Functions for role enforcement -- Security rules handle this natively. Cloud Functions add latency and cost. Use functions only for role assignment validation (e.g., ensuring only owners can promote to admin).

**Data model change for RBAC:**

Current Account model has:
```typescript
users: string[];           // flat array of UIDs
ownerUser: any;            // single owner object
```

Recommended migration:
```typescript
userRoles: {               // replaces users[] for role-aware access
  [uid: string]: 'owner' | 'admin' | 'member'
};
ownerUser: any;            // keep for backward compat during migration
users: string[];           // keep as derived/computed for existing query compatibility
```

Keep `users[]` alongside `userRoles` during migration so existing security rules and queries continue working. The `users` array is used in security rules (`request.auth.uid in resource.data.users`) and Firestore `array-contains` queries. Removing it requires updating all queries and rules simultaneously.

### Cross-Band Song Sharing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Firestore Batch Writes | Built-in | Atomic copy of song + lyrics across collections | Copy operation writes to multiple documents (new song, N lyrics, source song update, target account counter). Batch writes ensure all-or-nothing atomicity. Max 500 docs per batch -- sufficient since a song rarely has >50 lyrics. |
| Angular Material Dialog | ^18.1.1 | Band picker UI for "Share to Band" flow | Already using Angular Material. New dialog component for band selection + confirmation. |
| NGXS Actions | ^18.0.0 | Orchestrate the share flow as dispatchable actions | Consistent with existing patterns (e.g., song CRUD uses NGXS actions). Add `ShareSongsToBand` action that handles the copy logic. |

**Do NOT use:**
- Cloud Functions for the copy operation -- The user has read access to the source and write access to the target (they are a member of both bands). Client-side batch write is simpler, faster, and avoids cold-start latency. Use Cloud Functions only if server-side validation beyond security rules is needed (e.g., entitlement checks for sharing limits).
- Firestore Transactions -- Transactions are for read-then-write atomicity. The copy operation reads the source song/lyrics first, then writes to a different collection. Since we are reading from collection A and writing to collection B with no contention risk, a batch write after client-side reads is the correct pattern.
- Shared document references (symlinks) -- The spec explicitly chose copy-based sharing to avoid conflict resolution, shared ownership complexity, and cross-band permission leakage.

**Song model additions:**
```typescript
// Add to Song interface
sourceAccountId?: string;       // Account this was copied from (null if original)
sourceSongId?: string;          // Song ID in source account (null if original)
sharedTo?: Array<{accountId: string, songId: string}>;  // Bands this was shared to
```

### Supporting Libraries (No New Installs)

| Library | Version | Purpose | Used For |
|---------|---------|---------|----------|
| `@angular/fire` (compat) | ^18.0.1 | Firestore reads/writes for sharing and RBAC | Already in use. Compat API works for batch writes via `firebase.firestore().batch()`. |
| `@ngxs/store` | ^18.0.0 | State management for roles and sharing state | Already in use. Add selectors for role checks. |
| `@angular/material` | ^18.1.1 | UI components (dialogs, buttons, menus) | Already in use. Band picker dialog, role management UI. |
| `@angular/cdk` | ^18.1.1 | Overlay, accessibility primitives | Already in use with Material. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Prerendering | `@angular/ssr` SSG | Puppeteer crawl post-build | No hydration, fragile, not integrated with Angular build pipeline |
| Prerendering | `@angular/ssr` SSG | Full runtime SSR via Cloud Functions | Adds cold-start latency, costs money, unnecessary for static marketing pages |
| Role storage | Firestore `userRoles` map | Firebase Custom Claims | 1-hour propagation delay, requires Admin SDK, overkill at current scale |
| Role storage | Firestore `userRoles` map | Separate `roles` subcollection | Extra reads per permission check. Map on Account doc means role info arrives with the account read (already happening). |
| Role enforcement | Firestore Security Rules | Cloud Functions middleware | Rules are free, instant, and declarative. Functions add latency and cost. |
| Song sharing | Client-side batch write | Cloud Function | User has access to both bands. Client-side is simpler and faster. |
| Song sharing | Copy-based | Shared references | Spec decision: avoids conflict resolution, cross-band permission leakage |
| Upgrade to Angular 19 | Stay on Angular 18 | Upgrade for `RenderMode` | Major version upgrade risk for a feature (per-route render mode) that `routes.txt` already solves in v18 |

## Installation

```bash
# SSR / Prerendering (only new install needed)
ng add @angular/ssr@18

# No other new packages required.
# RBAC and cross-band sharing use existing dependencies:
#   @angular/fire, @ngxs/store, @angular/material, firebase
```

**Post-install configuration:**

1. Create `routes.txt` in project root listing ~12 public routes
2. Update `angular.json`:
   ```json
   "prerender": { "routesFile": "routes.txt", "discoverRoutes": false },
   "server": "src/main.server.ts",
   "ssr": false
   ```
3. Guard browser APIs in ~12 files (see SSR research at `.planning/phases/ssr-research/RESEARCH.md`)
4. Verify `firebase.json` `public` path matches build output directory

## Firestore Security Rules Updates

Current rules use `request.auth.uid in resource.data.users` for subcollection access. For RBAC:

```
// Read: any member (owner, admin, or member)
allow read: if request.auth.uid in resource.data.users;

// Write songs/setlists: owner or admin only
allow write: if get(/databases/$(database)/documents/accounts/$(accountId))
               .data.userRoles[request.auth.uid] in ['owner', 'admin'];

// Delete: owner only
allow delete: if get(/databases/$(database)/documents/accounts/$(accountId))
               .data.userRoles[request.auth.uid] == 'owner';

// Member management: owner only
allow update: if request.auth.uid == resource.data.ownerUser.uid;
```

Keep `users[]` array for read-access checks (efficient `array-contains` queries). Use `userRoles` map for write-permission granularity.

## Version Constraints

| Dependency | Current | Target | Notes |
|------------|---------|--------|-------|
| Angular | ^18.1.1 | ^18.1.1 (no change) | Stay on 18 LTS. Do not upgrade to 19 for this milestone. |
| `@angular/ssr` | Not installed | 18.2.21 | Latest patch for v18 line |
| `@angular/fire` | ^18.0.1 | ^18.0.1 (no change) | Compat API; watch for prerender hanging (see pitfalls) |
| Node.js | 20.x (local) / 22 (functions) | No change | Both support `@angular/ssr` prerender |
| TypeScript | ~5.5.3 | ~5.5.3 (no change) | Compatible with Angular 18 |
| Firebase JS SDK | ^10.5.2 | ^10.5.2 (no change) | Batch write API is stable |
| NGXS | ^18.0.0 | ^18.0.0 (no change) | SSR compatibility assumed (LOW confidence -- needs testing) |

## Migration Complexity Assessment

| Feature | New Dependencies | Model Changes | Security Rule Changes | Estimated Effort |
|---------|-----------------|---------------|----------------------|-----------------|
| SSR/Prerendering | `@angular/ssr` (1 package) | None | None | Medium (2-3 days): main work is browser API guards |
| RBAC | None | `userRoles` map on Account | Moderate (subcollection write rules) | Medium (3-4 days): model migration + rules + UI gating |
| Cross-Band Sharing | None | 3 fields on Song, 1 on Lyric | None (existing rules cover it) | Medium (3-4 days): copy logic + band picker UI + NGXS actions |

**Total new dependencies: 1 package (`@angular/ssr`).** Everything else uses existing stack.

## Sources

### HIGH Confidence
- [Angular 18 Prerendering Guide](https://v18.angular.dev/guide/prerendering/) -- Official docs for v18 prerender config
- [Angular SSR Guide](https://angular.dev/guide/ssr) -- Current SSR/hybrid rendering docs
- [Firestore Security Rules -- Role-Based Access](https://firebase.google.com/docs/firestore/solutions/role-based-access) -- Official Firebase RBAC pattern
- [Firestore Batch Writes](https://firebase.google.com/docs/firestore/manage-data/transactions) -- Official batch write docs (500 doc limit)
- [Firebase Hosting Configuration](https://firebase.google.com/docs/hosting/full-config) -- Rewrite rules for SPA fallback
- Codebase analysis: `account.ts`, `song.ts`, `firestore.rules`, `angular.json`, `package.json`

### MEDIUM Confidence
- [Firestore RBAC with Custom Claims](https://www.freecodecamp.org/news/firebase-rbac-custom-claims-rules/) -- Custom Claims approach (rejected but informed decision)
- [NGXS Authentication Recipe](https://www.ngxs.io/recipes/authentication) -- NGXS auth/guard patterns
- Cross-band sharing spec at `/Users/timburnham/src/bandcentral-pm/features/cross-band-song-sharing.md`

### LOW Confidence
- NGXS SSR compatibility -- No official docs found confirming SSR support. Assumed compatible based on it being a state management library with no DOM dependencies. Needs verification during implementation.
