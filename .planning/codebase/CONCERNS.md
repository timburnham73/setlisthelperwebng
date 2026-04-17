# Codebase Concerns

**Analysis Date:** 2026-04-15

## Tech Debt

**Firebase Compat API Usage (HIGH):**
- Issue: All Firebase services use the deprecated `@angular/fire/compat/*` API instead of the modular API. The compat layer wraps the older v8 SDK and adds significant bundle weight. It will eventually be removed from `@angular/fire`.
- Files: `src/app/core/services/auth.service.ts`, `src/app/core/services/song.service.ts`, `src/app/core/services/setlist.service.ts`, `src/app/core/services/tag.service.ts`, `src/app/core/services/user.service.ts`, `src/app/core/services/lyrics.service.ts`, `src/app/core/services/account.service.ts`, `src/app/core/services/account-import.service.ts`, `src/app/core/services/artist.service.ts`, `src/app/core/services/genre.service.ts`, `src/app/core/services/setlist-songs.service.ts`, `src/app/core/store/account.state.ts`, `src/app/core/store/genre.state.ts`, `src/app/core/store/artist.state.ts`, `src/app/core/store/song.state.ts`, `src/app/app-routing.module.ts` (compat auth guard)
- Impact: Larger bundle size, blocked from Angular Fire v19+ upgrades, eventual breakage when compat layer is removed.
- Fix approach: Migrate to `@angular/fire` modular API (`inject(Firestore)`, `collection()`, `doc()`, etc.) one service at a time. Replace `AngularFireAuthGuard` with a custom guard using `inject(Auth)`.

**Mixed NgModule and Standalone Architecture (MEDIUM):**
- Issue: Codebase is mid-migration from NgModule to standalone components. ~64 standalone components coexist with ~78 NgModule declarations. This creates import confusion and inconsistent patterns.
- Files: All feature modules under `src/app/features/` and `src/app/shared/`
- Impact: Confusing for developers; unclear which pattern to follow for new components.
- Fix approach: Complete migration to standalone. Convert remaining NgModule-declared components and remove feature modules, replacing with route-level lazy loading.

**Duplicate Router Configuration (MEDIUM):**
- Issue: `app-routing.module.ts` registers routes via both `RouterModule.forRoot(appRoutes)` in imports AND `provideRouter(appRoutes)` in providers. This double-registers route configuration.
- Files: `src/app/app-routing.module.ts` (lines 112-114)
- Impact: Potential subtle routing bugs, duplicate route handling.
- Fix approach: Remove one registration. If staying NgModule-based, keep `RouterModule.forRoot()`. If migrating to standalone, keep `provideRouter()`.

**Dev Environment Marked as Production (HIGH):**
- Issue: `environment.ts` (the dev environment file) has `production: true`. This means local development runs with production flags enabled, disabling Angular dev mode checks and debug tools.
- Files: `src/environments/environment.ts` (line 9)
- Impact: No Angular dev mode warnings during development; harder to catch change detection issues and other dev-time errors.
- Fix approach: Set `production: false` in `environment.ts`.

**Missing API Config in Production Environment (MEDIUM):**
- Issue: `environment.prod.ts` does not include the `api` section, while `environment.ts` defines `api.syncSetlistHelperData`. Any code referencing `environment.api` will fail at runtime in production.
- Files: `src/environments/environment.prod.ts`, `src/environments/environment.ts`
- Impact: Runtime errors for features depending on `environment.api` in production builds.
- Fix approach: Add the `api` section with the production function URL to `environment.prod.ts`.

**Backend Dependencies in Frontend package.json (LOW):**
- Issue: `firebase-admin` and `firebase-functions` are listed as dependencies in the root `package.json`. These are server-side packages and should only be in `functions/package.json` (where they already exist).
- Files: `package.json` (lines 37-38)
- Impact: Unnecessarily bloated `node_modules`; risk of accidentally importing server-only code into the client bundle.
- Fix approach: Remove `firebase-admin` and `firebase-functions` from root `package.json`.

**Both lodash and lodash-es Installed (LOW):**
- Issue: Both `lodash` (CommonJS) and `lodash-es` (ESM) are dependencies. `lodash` is not tree-shakeable and is listed in `allowedCommonJsDependencies`.
- Files: `package.json` (lines 43-44), `src/app/core/services/ChordProParser.ts` (imports `lodash`), `src/app/features/setlists/setlist-songs-list/setlist-songs-list.component.ts` (imports `lodash-es`)
- Impact: Bundle includes both versions; `lodash` CommonJS cannot be tree-shaken.
- Fix approach: Standardize on `lodash-es` only. Replace `import _ from "lodash"` with specific imports from `lodash-es`.

**Moment.js Dependency (LOW):**
- Issue: `moment` is a heavy (~300KB) CommonJS library. It is used in several components and deeply integrated via `@angular/material-moment-adapter`.
- Files: `src/app/core/services/auth.service.ts`, `src/app/features/setlists/setlist-edit-dialog/setlist-edit-dialog.component.ts`, `src/app/shared/pipes/local-date.pipe.ts`, `src/app/custom-material/custom-material.module.ts`
- Impact: Adds ~70KB gzipped to bundle. Cannot be tree-shaken.
- Fix approach: Migrate to `date-fns` or `luxon` with `@angular/material-date-fns-adapter`. Low priority given the deep Material integration.

**Dual State Management Libraries (MEDIUM):**
- Issue: Both `@ngrx/store` and `@ngxs/store` are in `package.json`. Only NGXS is actively used in the codebase. NgRx is an unused dependency.
- Files: `package.json` (line 32), `src/app/core/store/` (all files use NGXS)
- Impact: Unnecessary bundle size from unused NgRx.
- Fix approach: Remove `@ngrx/store` from `package.json`.

**Global Error Handler is a No-Op (MEDIUM):**
- Issue: `GlobalErrorHandler` catches errors but just re-throws them. All logging code is commented out. No error reporting service (Sentry, etc.) is configured.
- Files: `src/app/core/services/globar-error.handler.ts`
- Impact: Production errors are silently lost. No visibility into client-side failures.
- Fix approach: Integrate an error reporting service (Sentry, LogRocket, etc.) or at minimum re-enable the `NGXLogger` integration.

**Incomplete TODO in Tag Service (LOW):**
- Issue: Comment `//TODO: Update the tag statistics` left unimplemented.
- Files: `src/app/core/services/tag.service.ts` (line 157)
- Impact: Tag statistics may be stale after mutations.
- Fix approach: Implement tag statistics update or remove the TODO if not needed.

## Security Considerations

**Firebase Config Exposed in Source (LOW):**
- Risk: Firebase API keys, project IDs, and app IDs are committed to source in environment files. While Firebase API keys are designed to be public (security is enforced via Firestore/Storage rules), this is still a surface for abuse (quota exhaustion, unauthorized API calls).
- Files: `src/environments/environment.ts`, `src/environments/environment.prod.ts`
- Current mitigation: Firestore rules are well-structured with auth checks. Storage rules restrict uploads to contact-attachments only.
- Recommendations: Enable App Check to prevent unauthorized API usage. Consider Firebase API key restrictions in Google Cloud Console (HTTP referrer restrictions).

**No Content Security Policy (MEDIUM):**
- Risk: No CSP header is configured. The app loads resources from multiple external origins (Google Fonts, YouTube embeds) without a CSP to prevent injection of unauthorized scripts.
- Files: `firebase.json` (headers section), `src/index.html`
- Current mitigation: `X-Content-Type-Options`, `X-Frame-Options`, and `X-XSS-Protection` headers are set.
- Recommendations: Add a `Content-Security-Policy` header to `firebase.json` with `script-src 'self'`, `style-src 'self' fonts.googleapis.com`, `frame-src youtube.com`, etc.

**Wildcard CORS on Static Assets (LOW):**
- Risk: `Access-Control-Allow-Origin: *` is set on all static assets (JS, CSS, images). This allows any domain to load and use these resources.
- Files: `firebase.json` (line 21)
- Current mitigation: Auth endpoints correctly restrict CORS to `https://www.bandcentral.com` (line 47).
- Recommendations: Low priority since static assets are public anyway, but tighten to domain-specific if concerned about hotlinking.

**bypassSecurityTrustHtml Pipe (MEDIUM):**
- Risk: The `safeHtml` pipe calls `bypassSecurityTrustHtml()` on any input without sanitization. If user-generated content is piped through this, it enables XSS.
- Files: `src/app/shared/pipes/safe-html.pipe.ts`, used in `src/app/features/help/help-section/help-section.component.html`
- Current mitigation: Currently only used for help content which is developer-authored (in `src/app/features/help/help-content.ts`).
- Recommendations: Document that this pipe must NEVER be used with user-generated content. Consider adding input validation.

**Admin Route Uses Auth-Only Guard (MEDIUM):**
- Risk: The `/admin` route is protected by `AngularFireAuthGuard` which only checks if the user is authenticated, not if they have admin privileges. Any authenticated user can access admin pages.
- Files: `src/app/app-routing.module.ts` (lines 34-38)
- Current mitigation: Admin features may have additional server-side checks via Firestore rules (the `systemAdmin` field exists on user docs).
- Recommendations: Add a custom `adminGuard` that checks `user.systemAdmin === true` or the `admin` custom claim before allowing route activation.

**Direct DOM Manipulation for Printing (LOW):**
- Risk: `lyrics-print.component.ts` replaces `document.body.innerHTML` for printing, which destroys and recreates the entire DOM. This can lose event listeners and Angular state.
- Files: `src/app/features/lyrics/lyrics-print/lyrics-print.component.ts` (lines 109-116)
- Current mitigation: The page reloads after printing.
- Recommendations: Use `window.print()` with a print-specific CSS `@media print` stylesheet instead.

## Performance Bottlenecks

**Excessive Google Font Loads (MEDIUM):**
- Problem: `index.html` loads 7 Google Fonts stylesheet requests with significant overlap (Material Icons loaded twice, Material Symbols Outlined loaded twice, Roboto loaded 3 times with overlapping weight ranges).
- Files: `src/index.html` (lines 34, 37, 38, 39, 42, 44, 45)
- Cause: Incremental additions without cleanup. Each request is a render-blocking resource.
- Improvement path: Consolidate into a single Google Fonts URL combining all needed families and weights. Remove duplicate Material Icons/Symbols loads. Use `display=swap` on all font loads. Consider self-hosting fonts.

**Large Budget Thresholds (LOW):**
- Problem: Initial bundle budget warning is set to 4MB, error at 5MB. These are very permissive for a web app.
- Files: `angular.json` (lines 53-57)
- Cause: Budget was likely increased to accommodate compat Firebase + moment + lodash.
- Improvement path: After removing compat layer, moment, and lodash, tighten budgets to 2MB warning / 3MB error.

**No SSR/Prerendering (LOW for app, MEDIUM for SEO):**
- Problem: Pure client-side SPA. Search engines see only the shell HTML until JavaScript loads. Public marketing pages (home, help, why, tools) would benefit from prerendering.
- Files: `angular.json` (application builder only, no SSR config)
- Cause: Standard SPA setup.
- Improvement path: Add Angular SSR or at minimum static prerendering for public routes. The `sitemap.xml` and structured data in `index.html` are good SEO foundations but crawlers need rendered content.

## Fragile Areas

**Subscription Memory Leaks (HIGH):**
- Files: `src/app/features/songs/song-list/song-list.component.ts`, `src/app/features/songs/song-edit-dialog/song-edit-dialog.component.ts`, `src/app/features/songs/song-import/song-import.component.ts`, `src/app/features/lyrics/lyric-add-dialog/lyric-add-dialog.component.ts`
- Why fragile: Multiple components subscribe to observables (especially `authService.user$` and route params) without unsubscribing. `song-list.component.ts` has 7 `.subscribe()` calls and no `ngOnDestroy` or `takeUntil` pattern. Dialog components call `.subscribe()` on service methods without cleanup.
- Safe modification: When touching these components, add `DestroyRef` + `takeUntilDestroyed()` (Angular 16+ pattern) or the `Subject` + `takeUntil` pattern.
- Test coverage: Spec files exist but likely do not test subscription cleanup.

**Setlist Songs Service Complexity (MEDIUM):**
- Files: `src/app/core/services/setlist-songs.service.ts` (588 lines)
- Why fragile: Largest service file. Manages complex relationships between setlists and songs with nested subscriptions (line 302: `.subscribe()` inside another observable chain).
- Safe modification: Extract sub-operations into smaller methods. Replace nested subscribes with `switchMap`/`mergeMap`.
- Test coverage: `src/app/core/services/setlist-songs.service.spec.ts` exists.

**Error Handling Gaps in Services (MEDIUM):**
- Files: All services in `src/app/core/services/` except `user.service.ts`
- Why fragile: Only `user.service.ts` uses `catchError`. All other services (song, setlist, tag, lyrics, account) have no error handling on Firestore operations. A network failure or permission error will produce an unhandled observable error.
- Safe modification: Add `catchError` operators to all Firestore read/write operations. Show user-facing error messages via a snackbar/toast service.
- Test coverage: Spec files exist but error paths are likely untested.

## Dependencies at Risk

**firebaseui (LOW):**
- Risk: `firebaseui` v6.1.0 is the last maintained version and is built on the compat Firebase SDK. If compat is removed, firebaseui breaks.
- Impact: Login UI breaks.
- Migration plan: Replace with custom login UI using `@angular/fire` modular auth API, or use Firebase's newer `firebase/auth` `signInWithPopup`/`signInWithRedirect` methods directly.

**jwt-decode v3 (LOW):**
- Risk: `jwt-decode` v3 is legacy. v4 has a different API.
- Impact: No security risk, but blocks dependency updates.
- Migration plan: Update to `jwt-decode@4` and adjust import (`jwtDecode` instead of default export).

## Test Coverage Gaps

**No Component Tests for Key Features (MEDIUM):**
- What's not tested: `song-list.component.ts`, `setlist-list.component.ts`, `setlist-songs-list.component.ts`, `tag-list.component.ts` have no component spec files (only service specs exist). The `admin-dashboard` has no tests.
- Files: `src/app/features/songs/song-list/`, `src/app/features/setlists/setlist-list/`, `src/app/features/admin/admin-dashboard/`
- Risk: Core CRUD features can break without detection.
- Priority: Medium

**Existing Specs May Be Stale (MEDIUM):**
- What's not tested: Many spec files exist (42 total) but given the migration from NgModule to standalone, some may have broken imports or test setup.
- Files: All `*.spec.ts` files under `src/app/`
- Risk: Tests may pass trivially (empty suites) or fail on CI without anyone noticing.
- Priority: Medium - run `ng test` and fix broken specs.

**No E2E Tests (LOW):**
- What's not tested: No Cypress, Playwright, or Protractor configuration exists.
- Risk: Full user flows (login, create song, build setlist) are untested end-to-end.
- Priority: Low - unit/integration tests are more impactful first.

---

*Concerns audit: 2026-04-15*
