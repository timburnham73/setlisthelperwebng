# Domain Pitfalls

**Domain:** SSR/Prerendering, RBAC, and Cross-Band Song Sharing for Angular 18 + Firebase
**Researched:** 2026-04-15

## Critical Pitfalls

Mistakes that cause rewrites, security holes, or major delivery delays.

### Pitfall 1: Wildcard Firestore Rules Bypass RBAC Entirely

**What goes wrong:** The current Firestore rules grant full read/write/delete to ANY subcollection document under an account if the user's UID is in the account's `users` array (line 17-19 of `firestore.rules`). Adding Owner/Admin/Member roles in the Angular UI without updating these rules creates a false sense of security -- Members can still write/delete songs, setlists, and lyrics directly through the Firestore SDK or REST API.

**Why it happens:** The existing rule `match /accounts/{accountId}/{document=**}` is a flat "if you're a member, you can do anything" gate. When RBAC is layered on top client-side only, the rules never check role values.

**Consequences:** Any band member can delete songs, modify setlists, or remove other users' lyrics by calling Firestore directly, completely bypassing the Angular UI's role checks. This is a real security vulnerability, not just a UX concern.

**Prevention:**
- Implement RBAC in Firestore rules BEFORE or simultaneously with client-side guards. Never ship client-side-only RBAC.
- Store each member's role in a field the user cannot self-modify. Two options:
  - (A) A `memberRoles` map on the account doc: `{ "uid123": "Member", "uid456": "Admin" }`. Only the Owner can write this field.
  - (B) An `accountUsers` subcollection with per-user role docs that only Owner/Admin can write.
- Replace the wildcard rule with granular rules per subcollection (songs, lyrics, setlists, tags) that check the user's role before allowing writes.
- Example rule structure:
  ```
  function getUserRole(accountId) {
    return get(/databases/$(database)/documents/accounts/$(accountId)).data.memberRoles[request.auth.uid];
  }
  match /accounts/{accountId}/songs/{songId} {
    allow read: if request.auth.uid in get(.../accounts/$(accountId)).data.users;
    allow create, update: if getUserRole(accountId) in ['Owner', 'Admin'];
    allow delete: if getUserRole(accountId) == 'Owner';
  }
  ```

**Detection:** Review: "Can a Member write to any subcollection through the Firebase console or REST API?" If yes, RBAC is cosmetic.

**Which phase should address it:** RBAC phase -- must be the FIRST thing implemented in that phase, before any UI guards.

---

### Pitfall 2: Browser API Crashes During Prerender Build

**What goes wrong:** The prerender build runs in Node.js where `window`, `document`, `localStorage`, and `sessionStorage` do not exist. Components that reference these globals crash the build with `ReferenceError: window is not defined`.

**Why it happens:** 12 files in the codebase directly access browser globals (identified in SSR research). The `WINDOW` injection token in `window.helper.ts` calls `window` unconditionally. `AppComponent` subscribes to auth state and triggers navigation on every route render, including during prerender.

**Consequences:** Build fails completely. No prerendered output. SSR/SEO phase is blocked until every browser API reference in the prerendered component tree is guarded.

**Prevention:**
- Guard all browser API access with `isPlatformBrowser(inject(PLATFORM_ID))` or wrap in `afterNextRender()`.
- Update `window.helper.ts` to return `null` on server platform.
- Guard `AppComponent`'s auth subscription with a platform check.
- Do NOT use `isPlatformBrowser` in templates for conditional rendering -- this causes hydration mismatches.
- Set `discoverRoutes: false` in angular.json to prevent prerendering auth-gated routes.

**Detection:** Run `ng build --configuration=production` after adding `@angular/ssr`. If it hangs or throws `ReferenceError`, browser APIs are leaking into the prerender context.

**Which phase should address it:** SSR/Prerendering phase -- this is the core work of that phase.

---

### Pitfall 3: @angular/fire Compat Hangs the Prerender Build

**What goes wrong:** The `@angular/fire/compat` Firestore API uses Zone.js integration that keeps the Angular zone in an "unstable" state while Firestore listeners are open. The prerender engine waits for zone stability before capturing HTML, so the build hangs indefinitely at "Prerendering X routes..." and never completes.

**Why it happens:** The compat API wraps the v8 Firebase SDK which uses long-lived WebSocket connections. Zone.js sees these as pending macrotasks. There is a well-documented GitHub issue (#2420) on this exact behavior.

**Consequences:** Build hangs forever. CI/CD pipeline times out. No prerendered output.

**Prevention:**
- Ensure NO prerendered route (home, why, tools, help, blog, contact, privacy-policy, pricing, login) imports or injects any `AngularFirestore`, `AngularFireAuth`, or NGXS state that triggers Firestore queries.
- Grep all public-route components for Firebase imports before starting.
- If `AccountStateModule` or any root-level provider triggers Firestore on app init, guard it with `isPlatformBrowser()`.
- Fallback plan: If compat hanging proves unsolvable, use Puppeteer-based post-build HTML generation instead (documented in SSR research as Approach B).

**Detection:** Build hangs at prerender step for more than 60 seconds on routes that should be instant.

**Which phase should address it:** SSR/Prerendering phase -- verify before any prerender work begins.

---

### Pitfall 4: Song Copy Race Condition on Counter Fields

**What goes wrong:** The cross-band sharing spec calls for incrementing `countOfSongs` on the target account and updating the `sharedTo` array on the source song. If two users share to the same target band simultaneously, or if a user shares multiple songs in quick succession without batching, counter fields can become inconsistent (lost updates).

**Why it happens:** Firestore increment operations (`FieldValue.increment(1)`) are atomic per-document, but the overall copy flow (create song doc + create lyrics docs + increment counter + update source) spans multiple documents. Without a batched write or transaction, partial failures leave data inconsistent.

**Consequences:** `countOfSongs` drifts from actual song count. `countOfLyrics` on copied songs may be wrong. Source song's `sharedTo` array may not include all copies. Users see incorrect counts in the UI.

**Prevention:**
- Use a Firestore batched write for the entire copy operation: create song, create lyrics, increment countOfSongs, update source sharedTo -- all in one atomic batch.
- Firestore batches are limited to 500 operations. For bulk sharing (multiple songs), chunk into batches of at most ~100 songs per batch (each song needs: 1 song write + N lyric writes + 1 counter increment + 1 source update).
- Use `FieldValue.increment()` for counters (not read-then-write) to avoid read-write race conditions.
- If a batch fails, no partial state is written (atomic), so retry is safe.

**Detection:** `countOfSongs` on account doc does not match actual number of songs in the subcollection. Songs appear in target band but `sharedTo` array on source is missing the reference.

**Which phase should address it:** Cross-band sharing phase -- implement batched writes from the start.

---

### Pitfall 5: RBAC Role Storage Location Allows Self-Elevation

**What goes wrong:** The existing `roles.ts` defines roles as strings ("Admin", "Member", "Read-Only") and `AccountUser` has a `role` field. If the role is stored in a document the user can write to (e.g., their own user doc, or the account doc via the current wildcard rule), any member can change their own role to "Owner" or "Admin".

**Why it happens:** The current Firestore rules allow any account member to update the account document (with an ownership check only on `ownerUser`). But the `memberRoles` map (if stored on the account doc) could be modified by any member unless the rule explicitly blocks it.

**Consequences:** Complete RBAC bypass. Any member promotes themselves to Owner. All permission restrictions become meaningless.

**Prevention:**
- Store roles in a location that Firestore rules protect against self-modification.
- Best approach for this scale: Store `memberRoles` as a map field on the account document. Add a Firestore rule that only allows `ownerUser.uid` (or users with "Owner" role) to modify the `memberRoles` field. Use `request.resource.data.memberRoles == resource.data.memberRoles` to ensure non-owners cannot change it.
- Alternative: Use a separate `accountMembers` subcollection where only Owner can write.
- Never use Firebase custom claims for per-band roles -- claims are global to the user token and do not support per-account roles without awkward namespacing.

**Detection:** In the Firebase console, try updating the role field as a non-owner user. If it succeeds, the system is vulnerable.

**Which phase should address it:** RBAC phase -- data model design must account for this on day one.

## Moderate Pitfalls

### Pitfall 6: Prerendered Route Falls Through to SPA Index

**What goes wrong:** After deploying prerendered HTML, Firebase Hosting serves the SPA `index.html` instead of the prerendered file for public routes. Google still sees an empty shell.

**Why it happens:** The `@angular/ssr` schematic may change `outputPath` from `{ base: "dist", browser: "" }` to `dist/browser/`. If `firebase.json`'s `"public"` field still points to `"dist"`, Firebase Hosting finds no matching file and falls through to the catch-all rewrite serving the SPA shell.

**Prevention:**
- After running `ng add @angular/ssr@18`, inspect the build output directory structure.
- Update `firebase.json` `"public"` to match (likely `"dist/browser"`).
- Test locally with `firebase serve` before deploying. Verify that `curl http://localhost:5000/why` returns full HTML content, not just `<app-root></app-root>`.

**Detection:** After deploy, view page source in browser. If the HTML body contains only `<app-root></app-root>` on a route that should be prerendered, the path is misconfigured.

**Which phase should address it:** SSR/Prerendering phase -- verification step after first successful build.

---

### Pitfall 7: Sharing Songs Without Checking Target Band Entitlement Limits

**What goes wrong:** A user copies 50 songs to a band on the "free" tier (which may have a song count limit). The copy operation succeeds because Firestore rules only check membership, not entitlement limits. The target band now exceeds its plan limits.

**Why it happens:** Entitlement limits (`entitlement-limits.ts`) are enforced client-side in the Angular UI. The sharing feature adds songs without checking limits because it is a new code path that was not wired into the existing limit-checking logic.

**Consequences:** Free-tier bands get unlimited songs through sharing, bypassing the subscription paywall. Paid users feel cheated.

**Prevention:**
- Before executing the copy batch, check `countOfSongs + numberOfSongsToCopy <= entitlementLimit` for the target account.
- Enforce this check both client-side (for UX -- show "Band X has reached its song limit") and in Firestore rules or a Cloud Function (for security).
- Consider implementing the copy operation as a Cloud Function that validates entitlements server-side, rather than trusting the client.

**Detection:** After sharing, compare target account's `countOfSongs` to its `entitlementLevel` limit.

**Which phase should address it:** Cross-band sharing phase -- include in the sharing service logic.

---

### Pitfall 8: Member Role Breaks Existing UI Without Graceful Degradation

**What goes wrong:** After RBAC is deployed, Members who previously had full access suddenly cannot edit songs or setlists. Buttons they used to click now silently fail, show cryptic Firestore permission errors, or worse -- the UI shows edit forms that fail on save.

**Why it happens:** RBAC is implemented in Firestore rules (blocking writes) but the UI still renders edit/delete buttons because template visibility was not updated to check the user's role.

**Consequences:** Confused users, support tickets, potential data loss if partial writes succeed before the rule blocks them.

**Prevention:**
- Implement a role-aware service that exposes the current user's role for the active band.
- Use this service in templates to hide/disable actions the user cannot perform: `*ngIf="canEdit"` or `[disabled]="!canEdit"`.
- Show clear messaging when a user attempts a restricted action: "Only Admins can edit songs."
- Roll out RBAC with all existing users as Owner/Admin first (backwards compatible). Then allow owners to downgrade members.

**Detection:** Log in as a Member and navigate the entire app. Every action that should be blocked must either be hidden or show a clear error.

**Which phase should address it:** RBAC phase -- UI changes must ship simultaneously with rule changes.

---

### Pitfall 9: Cross-Band Sharing Copies Stale Song Data

**What goes wrong:** User opens the song list, selects songs, switches to another tab, waits 30 minutes, then clicks "Share to Band." The copy operation uses the in-memory NGXS state (which may be stale) rather than reading the current Firestore document. The copy captures outdated data.

**Why it happens:** The share function reads from the NGXS store (which holds the last-fetched snapshot) instead of performing a fresh Firestore read at copy time.

**Consequences:** Copied song has outdated metadata (wrong key, old tempo, missing notes that another band member added after the list was loaded).

**Prevention:**
- At copy time, perform a fresh Firestore read of each source song document rather than relying on the in-memory store.
- This is especially important because other band members may have edited the song since the list was loaded.
- For bulk copies, batch the reads using `getDoc()` (or `getDocs()` with document references) to minimize round-trips.

**Detection:** Edit a song in Band A from another device, then immediately share that song from Band A to Band B using a device that loaded the list before the edit. Compare the copy in Band B -- if it has the old data, this pitfall is present.

**Which phase should address it:** Cross-band sharing phase -- implement fresh reads in the share service.

---

### Pitfall 10: NGXS State Initialization Blocks Prerender

**What goes wrong:** `AccountStateModule` is imported globally in `main.ts`. If its state initialization dispatches actions that trigger Firestore reads (e.g., loading the current user's accounts), the prerender build hangs because Firestore compat listeners never resolve in Node.js.

**Why it happens:** NGXS states can dispatch actions in their `ngxsOnInit()` lifecycle hook. If `AccountState` or any related state auto-dispatches on initialization, it fires during prerender for every route.

**Consequences:** Prerender build hangs indefinitely. Same root cause as Pitfall 3, but harder to diagnose because the Firestore call is buried inside state management.

**Prevention:**
- Audit all NGXS state classes for `ngxsOnInit()` or constructor-time dispatches.
- Guard any Firestore-triggering actions with `isPlatformBrowser()` before dispatching.
- Alternatively, lazy-load the NGXS states that depend on Firebase only in auth-gated routes, keeping them out of the prerender component tree entirely.

**Detection:** If the prerender build hangs even after guarding all component-level browser APIs, NGXS state init is the likely culprit. Add logging to state `ngxsOnInit()` methods.

**Which phase should address it:** SSR/Prerendering phase -- audit NGXS states early.

## Minor Pitfalls

### Pitfall 11: Hydration Mismatch on Prerendered Pages

**What goes wrong:** After prerendered HTML loads, Angular's hydration step detects differences between the server-rendered DOM and what the client renders. Console fills with hydration mismatch warnings. In some cases, Angular destroys and re-renders the entire component, causing a visible flash.

**Why it happens:** Using `isPlatformBrowser()` inside templates to conditionally render content creates different HTML on server vs client. Timestamps, random IDs, or date-dependent content also cause mismatches.

**Prevention:**
- Never use `isPlatformBrowser()` in template conditionals (`@if`, `*ngIf`). Instead, use `afterNextRender()` to modify state after hydration completes.
- For content that must differ, use `ngSkipHydration` attribute on the component.
- Ensure prerendered marketing pages have fully static content with no dynamic elements.

**Detection:** Open browser DevTools console on a prerendered page. Hydration mismatch warnings appear as Angular warnings.

**Which phase should address it:** SSR/Prerendering phase.

---

### Pitfall 12: Duplicate Song Detection Absent in Sharing

**What goes wrong:** A user shares the same song from Band A to Band B multiple times. Each share creates a new independent copy. Band B ends up with 5 copies of "Sweet Home Alabama."

**Why it happens:** The sharing spec explicitly states "Sharing same song twice creates a second copy (no dedup blocking)." This is by design, but without any warning in the UI, users will do this accidentally.

**Consequences:** Cluttered song lists. User confusion about which copy is the "real" one.

**Prevention:**
- Before copying, query the target band's songs for any with `sourceSongId` matching the song being shared.
- If a match exists, show a confirmation: "This song was already shared to [Band Name] on [date]. Share again?"
- Do NOT block the operation -- just warn. The spec allows duplicates intentionally.

**Detection:** Same song appears multiple times in target band with identical `sourceSongId` values.

**Which phase should address it:** Cross-band sharing phase -- add as a UX enhancement.

---

### Pitfall 13: Existing "Role" Model Mismatch

**What goes wrong:** The codebase already has `roles.ts` defining `["Admin", "Member", "Read-Only"]` and `AccountUser` with a `role` field. The PROJECT.md specifies Owner/Admin/Member. These do not match -- there is no "Owner" in the existing model, and "Read-Only" in the code does not match "Member" in the spec.

**Why it happens:** The existing role definitions were created for a different or earlier design. The PROJECT.md spec uses a different naming convention.

**Consequences:** Confusion during implementation. Code may reference the wrong role names. Firestore rules may check for "Owner" but the data says "Admin".

**Prevention:**
- Align the role model before writing any RBAC code. Decide on canonical names: Owner/Admin/Member.
- Update `roles.ts` to match: `export const ROLES = ['Owner', 'Admin', 'Member']`.
- Audit all existing uses of `AccountUser.role` and the role constants to ensure consistency.
- Migrate any existing Firestore data that uses the old role names.

**Detection:** Grep the codebase for "Read-Only", "ADMIN", "MEMBER" and compare to the new spec.

**Which phase should address it:** RBAC phase -- first task before any implementation.

---

### Pitfall 14: FirebaseUI Incompatibility with Prerender

**What goes wrong:** Even though the login route is excluded from `routes.txt`, FirebaseUI's module-level `window` access can crash the prerender build if its code is loaded as part of a shared module or eager import.

**Why it happens:** FirebaseUI accesses `window` at import time (not at render time). If any module in the eagerly-loaded dependency tree imports FirebaseUI, the prerender crashes even for routes that do not use login.

**Prevention:**
- Ensure FirebaseUI is only imported via a lazy-loaded route module.
- If it is part of any shared module or eagerly-loaded feature, move it to a dynamic `import()` guarded by `isPlatformBrowser()`.
- Verify by checking the import chain: `main.ts` -> `app.module` -> ... -> does any path reach `firebaseui`?

**Detection:** `ReferenceError: window is not defined` or `componentHandler is not defined` during prerender build, even though login is not in routes.txt.

**Which phase should address it:** SSR/Prerendering phase.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| SSR/Prerendering | Browser API crashes (Pitfall 2) | Guard 12 identified files with isPlatformBrowser/afterNextRender before first build attempt |
| SSR/Prerendering | Compat Firestore hangs build (Pitfall 3) | Grep public-route components for Firebase imports; audit NGXS init |
| SSR/Prerendering | Output path mismatch (Pitfall 6) | Verify dist structure matches firebase.json public path |
| SSR/Prerendering | NGXS state init (Pitfall 10) | Audit ngxsOnInit in all state classes |
| SSR/Prerendering | FirebaseUI import chain (Pitfall 14) | Verify lazy loading isolates firebaseui |
| RBAC | Wildcard rules bypass roles (Pitfall 1) | Replace wildcard with per-subcollection role-checked rules |
| RBAC | Self-elevation of roles (Pitfall 5) | Store roles where users cannot self-modify; enforce in rules |
| RBAC | UI breaks for Members (Pitfall 8) | Ship UI role checks simultaneously with rule changes |
| RBAC | Role model mismatch (Pitfall 13) | Align roles.ts with spec before coding |
| Cross-Band Sharing | Counter race conditions (Pitfall 4) | Use batched writes with FieldValue.increment |
| Cross-Band Sharing | Entitlement bypass (Pitfall 7) | Check song limits before copy; consider Cloud Function |
| Cross-Band Sharing | Stale data in copies (Pitfall 9) | Fresh Firestore reads at copy time, not from NGXS store |
| Cross-Band Sharing | Accidental duplicates (Pitfall 12) | Warn user if song was already shared to target band |

## Sources

- [Firestore Security Rules for RBAC](https://oneuptime.com/blog/post/2026-02-17-how-to-write-firestore-security-rules-for-role-based-access-control/view) - RBAC rules patterns
- [Firebase Insecure Rules Guide](https://firebase.google.com/docs/rules/insecure-rules) - Common rule mistakes
- [RBAC with Firebase](https://medium.com/@christophnissle/role-base-access-control-rbac-with-firebase-d04c5e4c774a) - Role storage patterns
- [Firestore Transactions and Batched Writes](https://firebase.google.com/docs/firestore/manage-data/transactions) - Batch limits and atomicity
- [Race Conditions in Firestore](https://medium.com/quintoandar-tech-blog/race-conditions-in-firestore-how-to-solve-it-5d6ff9e69ba7) - Counter race condition patterns
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices) - Official best practices
- [Angular SSR Guide](https://angular.dev/guide/ssr) - isPlatformBrowser, afterNextRender, hydration
- [Angular 18 Prerendering Guide](https://v18.angular.dev/guide/prerendering/) - Prerender configuration
- [Fixing Angular Prerendering Errors](https://medium.com/@josphatwanjiruw/fixing-angular-prerendering-errors-a-complete-guide-0c75f4ff9556) - Common prerender mistakes
- [AngularFire SSR Issue #2420](https://github.com/angular/angularfire/issues/2420) - Compat Firestore hanging during SSR
- [NGXS Auth Pattern](https://auth0.com/blog/state-management-in-angular-with-ngxs-part-2/) - NGXS + auth guard patterns
- [Angular Guard for RBAC](https://dev-academy.com/angular-router-guard-rbac/) - Route guard patterns
- Codebase analysis: `firestore.rules`, `roles.ts`, `user-roles.ts`, `AccountUser.ts`, `account.ts`, `song.ts`, `lyric.ts`
- SSR Research: `.planning/phases/ssr-research/RESEARCH.md`
- Cross-Band Sharing Spec: `bandcentral-pm/features/cross-band-song-sharing.md`

---

*Pitfalls audit: 2026-04-15*
