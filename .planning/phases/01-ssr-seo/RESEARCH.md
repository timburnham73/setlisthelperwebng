# SSR / Prerendering for Angular 18 on Firebase Hosting - Research

**Researched:** 2026-04-15
**Domain:** Angular 18 SSR/Prerendering, Firebase Hosting, SEO
**Confidence:** HIGH

## Summary

The app currently deploys as a pure client-side SPA to Firebase Hosting, which means Google sees an empty `<app-root>` shell for all pages. The recommended fix for this use case is **build-time prerendering (SSG)** of the ~12 public routes, NOT full SSR. The public pages are static marketing/tool content that does not change per-request, making SSG the ideal fit.

Angular 18 supports prerendering natively via `@angular/ssr` (v18.2.21 is the latest patch for v18). Running `ng add @angular/ssr` adds the necessary packages and configuration. By setting `"prerender": true` (or providing a `routes.txt`) in `angular.json` and **not** enabling a server runtime, the build produces static HTML files for each specified route that can be deployed directly to Firebase Hosting as static assets -- no Cloud Function needed for SSR.

**Primary recommendation:** Use `@angular/ssr` with prerendering only (no live SSR server). Generate static HTML for public routes at build time. Deploy prerendered HTML + SPA fallback to Firebase Hosting. Auth-gated routes continue as client-side SPA.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SEO HTML generation | Build-time (SSG) | -- | Pages are static; no per-request data needed |
| Public page serving | CDN / Firebase Hosting | -- | Static HTML served directly from CDN edge |
| Auth-gated pages | Browser / Client (SPA) | -- | Require user auth; no SEO value; remain CSR |
| Firebase Auth/Firestore | Browser / Client | -- | Only needed for authenticated features |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/ssr` | 18.2.21 | Prerendering engine for Angular 18 | Official Angular package, replaces Angular Universal [VERIFIED: npm registry] |
| `@angular-devkit/build-angular` | ^18.1.1 (already installed) | Application builder with prerender support | Already in use; the `application` builder supports `prerender` option natively [VERIFIED: angular.json] |

### Supporting (already present, no new installs needed beyond @angular/ssr)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@angular/platform-server` | ^18.1.1 | Server-side platform for Angular | Installed by `ng add @angular/ssr` automatically |
| `express` | ^4.x | SSR dev server (optional) | Installed by schematic; only used if live SSR is desired |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Angular SSG (prerender) | Full SSR via Cloud Functions | SSR adds cold-start latency, Cloud Function costs, and complexity for content that doesn't change per-request |
| Angular SSG | Manual prerender script (e.g., Puppeteer crawl) | Fragile, not integrated with Angular build pipeline, hard to maintain |
| Angular SSG | Rendertron / prerender.io middleware | External service dependency, adds latency, costs money at scale |
| Staying on Angular 18 | Upgrade to Angular 19+ for hybrid rendering (`RenderMode`) | 19+ has per-route `RenderMode.Prerender` / `RenderMode.Client` config, but requires major version upgrade; 18's `routes.txt` approach works fine |

**Installation:**
```bash
ng add @angular/ssr@18
```
This is the only command needed. It installs `@angular/ssr`, `@angular/platform-server`, creates `server.ts`, and updates `angular.json`. [VERIFIED: Angular 18 docs]

## Architecture Patterns

### How Prerendering Works with Firebase Hosting

```
Build Time:
  ng build --configuration=production
      |
      v
  Angular Application Builder
      |
      +--> Browser bundle (JS/CSS) --> dist/browser/
      |
      +--> Prerenderer reads routes.txt
      |        |
      |        +--> /home --> dist/browser/home/index.html
      |        +--> /why --> dist/browser/why/index.html
      |        +--> /tools/metronome --> dist/browser/tools/metronome/index.html
      |        +--> ... (all public routes)
      |
      +--> index.csr.html (client-only fallback)

Deploy Time:
  firebase deploy --only hosting
      |
      v
  Firebase Hosting CDN

Request Time:
  GET /why
      |
      v
  Firebase Hosting checks: does dist/browser/why/index.html exist?
      YES --> serve static HTML (fast, SEO-friendly)

  GET /bands (auth-gated, not prerendered)
      |
      v
  Firebase Hosting checks: does dist/browser/bands/index.html exist?
      NO --> falls back to rewrite rule --> serves index.html (SPA bootstrap)
```

### Recommended Configuration

**routes.txt** (list of public routes to prerender):
```
/home
/why
/tools
/tools/metronome
/tools/transpose
/tools/tap-tempo
/help
/blog
/contact
/privacy-policy
/home/pricing
/auth/login
```

**angular.json** changes:
```json
{
  "architect": {
    "build": {
      "options": {
        "prerender": {
          "routesFile": "routes.txt",
          "discoverRoutes": false
        },
        "server": "src/main.server.ts",
        "ssr": false
      }
    }
  }
}
```
[CITED: https://v18.angular.dev/guide/prerendering/]

Key settings:
- `"discoverRoutes": false` -- prevents Angular from trying to prerender auth-gated routes
- `"ssr": false` -- disables live SSR server generation; we only want build-time prerendering
- `"routesFile": "routes.txt"` -- explicitly lists only public routes

### firebase.json Changes

The current rewrite rule sends everything to `index.html`. With prerendering, Firebase Hosting naturally serves the prerendered files because **rewrites only trigger when no file or directory matches the URL path**. The existing config already works:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
[CITED: https://firebase.google.com/docs/hosting/full-config]

**Important:** The `public` directory may need updating. Currently `"public": "dist"`. With the application builder, prerendered output goes to `dist/browser/` (or wherever `outputPath.browser` points, which is currently `"base": "dist", "browser": ""`). Verify the output structure after first build. The current config sets `"browser": ""` so files go directly to `dist/`, which should work without changes.

### Build Output Structure

With the current `outputPath` config (`base: "dist"`, `browser: ""`), prerendered files will be:
```
dist/
  index.html              # SPA fallback (or renamed to index.csr.html)
  home/index.html          # prerendered /home
  why/index.html           # prerendered /why
  tools/index.html         # prerendered /tools
  tools/metronome/index.html
  tools/transpose/index.html
  tools/tap-tempo/index.html
  help/index.html
  blog/index.html
  contact/index.html
  privacy-policy/index.html
  main-[hash].js           # browser bundle
  styles-[hash].css        # styles
  ...
```

### Anti-Patterns to Avoid
- **Running full SSR on Firebase Cloud Functions for static content:** Adds cold-start latency (3-10s on first request), costs money, and is unnecessary for pages that are identical for all users
- **Using Firebase's "framework-aware" hosting:** It is in early preview, closed to new signups, and Google recommends migrating to Firebase App Hosting instead [CITED: https://firebase.google.com/docs/hosting/frameworks/angular]
- **Prerendering auth-gated routes:** These need user context; prerendering them produces blank/redirect pages

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static HTML generation | Custom Puppeteer/Playwright crawl script | `@angular/ssr` prerender | Integrated with Angular build, understands routes, handles hydration |
| SEO meta tags per page | Manual HTML injection post-build | Angular `Meta` and `Title` services (already used in tools components) | Works during prerender, sets correct meta per route |
| Sitemap generation | Manual file editing | Keep current manual `sitemap.xml` or add a build script | Sitemap is already in `src/sitemap.xml`; update it when routes change |
| Browser API guards | Manual `if (typeof window !== 'undefined')` checks everywhere | `isPlatformBrowser()` / `afterNextRender()` / `PLATFORM_ID` injection | Standard Angular SSR pattern, works consistently |

## Common Pitfalls

### Pitfall 1: Browser API Access During Prerender
**What goes wrong:** Components that reference `window`, `document`, `localStorage`, or `sessionStorage` crash during the prerender build because Node.js has no DOM.
**Why it happens:** 12 files in the codebase directly access browser globals (found via grep).
**How to avoid:** Guard all browser API access with `isPlatformBrowser(this.platformId)` or use `afterNextRender()`. The `WINDOW` injection token in `window.helper.ts` needs a server-safe factory that returns a mock/empty object.
**Warning signs:** Build errors like `ReferenceError: window is not defined` or `document is not defined`.

**Affected files (verified via codebase grep):**
- `src/app/shared/helpers/window.helper.ts` -- directly calls `window`
- `src/app/features/home/header/header.component.ts` -- uses WINDOW token + document
- `src/app/features/home/home/home.component.ts` -- `document.getElementById`
- `src/app/shared/layout/layout.component.ts` -- `window.open`
- `src/app/shared/layout-no-sidebar/layout-no-sidebar.component.ts`
- `src/app/shared/directives/scroll-to.directive.ts`
- `src/app/features/lyrics/lyrics-edit/lyrics-edit.component.ts`
- `src/app/features/lyrics/lyrics-print/lyrics-print.component.ts`
- `src/app/features/setlists/setlist-print/setlist-print.component.ts`
- `src/app/features/songs/song-list/song-list.component.ts`
- `src/app/core/core.module.ts`
- `src/app/shared/shared.module.ts`

### Pitfall 2: FirebaseUI Breaks Prerender
**What goes wrong:** `firebaseui` (v6.1.0) requires `window` and DOM at import time, causing build failures.
**Why it happens:** FirebaseUI is a browser-only library that accesses DOM globals at the module level.
**How to avoid:** FirebaseUI is only used in the login component (`src/app/features/auth/login/`), which is NOT in the prerender route list. Since Angular uses lazy loading, this module won't be loaded during prerender IF `discoverRoutes: false` is set and login is excluded from `routes.txt`. If it still causes issues, use dynamic `import()` guarded by `isPlatformBrowser()`.
**Warning signs:** `ReferenceError: componentHandler is not defined` or `window is not defined` during build.

### Pitfall 3: @angular/fire Compat + Prerender Hanging
**What goes wrong:** Firestore queries initiated during prerender never complete, causing the build to hang indefinitely.
**Why it happens:** The compat API's Zone.js integration keeps the Zone stable/unstable state from resolving when Firestore listeners are open. [CITED: https://github.com/angular/angularfire/issues/2420]
**How to avoid:** Public pages should NOT make Firestore calls. Since prerendered routes are marketing pages and tools (metronome, transpose, tap-tempo), they likely don't query Firestore. Verify no Firestore injection exists in the home, tools, help, blog, or contact components. If any do, guard with `isPlatformBrowser()`.
**Warning signs:** `ng build` hangs at "Prerendering X routes..." and never completes.

### Pitfall 4: NGXS State Initialization During Prerender
**What goes wrong:** NGXS store dispatches during prerender may fail if they depend on browser-only APIs or auth state.
**Why it happens:** The store is initialized globally in `main.ts` via `NgxsModule.forRoot([])` and `AccountStateModule`.
**How to avoid:** NGXS itself is SSR-compatible. Ensure state actions dispatched at app init don't trigger Firestore calls or browser API access. The `AccountStateModule` may attempt to read auth state; verify it handles the server platform gracefully. [ASSUMED]
**Warning signs:** Prerender errors from state initialization.

### Pitfall 5: AppComponent Auth Redirect During Prerender
**What goes wrong:** `AppComponent` subscribes to `authService.isLoggedIn$` and navigates to `/bands` on auth events. During prerender, this may cause route resolution issues.
**Why it happens:** The constructor runs during prerender for every route since AppComponent wraps the router outlet.
**How to avoid:** Guard the auth subscription with `isPlatformBrowser()`:
```typescript
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// In constructor:
if (isPlatformBrowser(inject(PLATFORM_ID))) {
  router.events.subscribe(/* ... existing auth redirect logic */);
}
```
**Warning signs:** Prerendered pages contain redirect HTML instead of actual content.

### Pitfall 6: Output Path Mismatch with Firebase
**What goes wrong:** Firebase Hosting serves from the wrong directory, showing 404s.
**Why it happens:** `angular.json` sets `outputPath: { base: "dist", browser: "" }` which puts browser files in `dist/`. But `ng add @angular/ssr` may change this to `dist/browser/`.
**How to avoid:** After running `ng add @angular/ssr`, verify the `outputPath` config. Update `firebase.json`'s `"public"` to match (e.g., `"public": "dist/browser"` if needed).
**Warning signs:** Deployment succeeds but site shows "Page Not Found."

## Code Examples

### Guarding Browser APIs (Standard Pattern)
```typescript
// Source: https://angular.dev/guide/ssr
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Component({ /* ... */ })
export class HeaderComponent {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  onScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const offset = this.document.documentElement.scrollTop;
      // ... scroll logic
    }
  }
}
```

### Updating window.helper.ts for SSR
```typescript
import { isPlatformBrowser } from '@angular/common';
import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';

export const WINDOW = new InjectionToken<Window | null>('WindowToken', {
  factory: () => {
    return isPlatformBrowser(inject(PLATFORM_ID)) ? window : null;
  }
});
```

### afterNextRender for Browser-Only Init
```typescript
// Source: https://angular.dev/guide/ssr
import { afterNextRender, Component } from '@angular/core';

@Component({ /* ... */ })
export class MetronomeComponent {
  private audioContext: AudioContext | null = null;

  constructor() {
    afterNextRender(() => {
      // This only runs in the browser
      this.audioContext = new AudioContext();
    });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@nguniversal/express-engine` | `@angular/ssr` | Angular 17 (Nov 2023) | Universal was deprecated; all SSR is now built into `@angular/ssr` |
| Separate `angular.json` targets for prerender | `prerender` option in `build` target | Angular 17+ | Single build command handles both browser + prerender |
| Manual `server.ts` + Express setup | `ng add @angular/ssr` schematic | Angular 17+ | Automated scaffolding; Express server generated automatically |
| `TransferState` manual wiring | Automatic with `provideClientHydration()` | Angular 16+ | Hydration is automatic for prerendered content |
| Firebase "framework-aware" hosting (beta) | Firebase App Hosting (GA April 2025) | April 2025 | Framework-aware hosting is deprecated; App Hosting is the successor [CITED: https://firebase.blog/posts/2025/04/apphosting-general-availability/] |

**Deprecated/outdated:**
- `@nguniversal/*`: Deprecated since Angular 17. Use `@angular/ssr` instead.
- Firebase "framework-aware" hosting: Closed to new signups. Do NOT use `firebase init hosting` with framework detection. Use standard static hosting instead.
- Angular 19+'s `RenderMode` enum (Prerender/Server/Client): Available in Angular 19, NOT in Angular 18. The v18 approach uses `angular.json` prerender options + routes.txt.

## Two Approaches: Comparison

### Approach A: @angular/ssr Prerendering (Recommended)

**Pros:**
- Official Angular solution, well-maintained
- Produces real Angular-rendered HTML with hydration support
- `ng add @angular/ssr` does most of the setup automatically
- Components render with actual Angular template engine

**Cons:**
- Requires fixing all browser API access in prerendered component tree
- `@angular/fire` compat may cause hanging builds if Firestore is touched
- Adds `@angular/platform-server` + `express` to dependencies

**Effort:** Medium (2-3 days). Main work is guarding browser APIs and testing the build.

### Approach B: Post-Build Static HTML Generation (Alternative)

If `@angular/ssr` causes too many issues with the compat Firebase libraries, a simpler fallback:

1. Keep the SPA build as-is
2. Add a post-build script that uses Puppeteer to crawl the public routes
3. Save rendered HTML snapshots to the dist folder

**Pros:**
- Zero changes to existing Angular code
- No browser API guarding needed
- Works regardless of library SSR compatibility

**Cons:**
- Not integrated with Angular build pipeline
- No hydration (page re-renders fully on client)
- Requires headless Chrome in CI/build environment
- Fragile; breaks if page takes too long to render

**Effort:** Low (1 day), but ongoing maintenance burden.

**Verdict:** Start with Approach A. Fall back to Approach B only if @angular/fire compat proves insurmountable during prerendering.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | NGXS is SSR-compatible and won't block prerender | Pitfall 4 | Build hangs or errors; would need platform guards around state init |
| A2 | Public routes (home, tools, help, blog, contact, why) don't inject or query Firestore | Pitfall 3 | Build hangs; would need to remove Firestore from those components or guard with isPlatformBrowser |
| A3 | `"ssr": false` in angular.json v18 disables server bundle generation while keeping prerender | Architecture Patterns | If not supported, may need to generate server bundle but not deploy it |
| A4 | `trailingSlash: false` in firebase.json correctly serves `/home` from `/home/index.html` | Architecture | 404s for prerendered routes; would need to adjust output or hosting config |

## Open Questions

1. **Do any public-route components inject AngularFirestore or AngularFireAuth?**
   - What we know: Auth-gated routes clearly inject them; public marketing pages likely don't
   - What's unclear: Blog component may fetch posts from Firestore
   - Recommendation: Grep for `AngularFirestore` / `AngularFireAuth` in public route components before starting

2. **Does `AccountStateModule` trigger Firestore calls at app bootstrap?**
   - What we know: It's imported in `main.ts` globally via `importProvidersFrom`
   - What's unclear: Whether it dispatches actions that hit Firestore during initialization
   - Recommendation: Review `AccountStateModule` and its state class; if it auto-dispatches, guard with platform check

3. **Blog route with `:slug` parameter -- prerender specific posts?**
   - What we know: Blog has a `BlogPostComponent` with `:slug` dynamic route
   - What's unclear: Whether blog posts should be prerendered (requires listing all slugs)
   - Recommendation: Start by prerendering only `/blog` landing. Add individual posts later if needed.

4. **Firebase App Hosting vs standard Hosting?**
   - What we know: Firebase App Hosting went GA April 2025 and is the recommended path for SSR apps
   - What's unclear: Whether it's worth migrating to App Hosting vs staying on standard Hosting with static prerender
   - Recommendation: Stay on standard Firebase Hosting. Pure static prerendering doesn't need App Hosting's server capabilities. Revisit if full SSR is ever needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, Firebase | Yes | 20.11.0 | -- |
| Angular CLI | `ng add @angular/ssr` | Yes | 18.2.21 | -- |
| `@angular/ssr` | Prerendering | Not installed yet | Will install 18.2.21 | -- |
| Firebase CLI | Deployment | Yes (in package.json) | ^13.0.0 | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Migration Steps (High-Level)

1. **Add @angular/ssr:** `ng add @angular/ssr@18` -- installs packages, creates `server.ts`, `main.server.ts`, updates `angular.json`
2. **Create routes.txt:** List all public routes (see above)
3. **Configure angular.json:** Set `prerender.routesFile`, `discoverRoutes: false`, `ssr: false`
4. **Fix browser API access:** Update the 12 identified files to guard with `isPlatformBrowser()` or `afterNextRender()`
5. **Update window.helper.ts:** Make factory SSR-safe
6. **Guard AppComponent auth redirect:** Wrap in `isPlatformBrowser()` check
7. **Test build:** Run `ng build --configuration=production` and verify prerendered HTML files exist
8. **Verify Firebase config:** Ensure `firebase.json` `public` path matches build output
9. **Deploy and validate:** `firebase deploy --only hosting`, test with `curl` that prerendered routes return full HTML
10. **Verify SEO:** Use Google Search Console to request re-indexing of prerendered pages

## Sources

### Primary (HIGH confidence)
- [Angular 18 Prerendering Guide](https://v18.angular.dev/guide/prerendering/) - Official prerendering docs for Angular 18
- [Angular SSR Guide](https://angular.dev/guide/ssr) - Current Angular SSR/hybrid rendering documentation
- [Firebase Hosting Configuration](https://firebase.google.com/docs/hosting/full-config) - Rewrite rules and static file serving
- npm registry: `@angular/ssr@18.2.21` verified as latest v18 patch

### Secondary (MEDIUM confidence)
- [Firebase + Angular Integration](https://firebase.google.com/docs/hosting/frameworks/angular) - Framework-aware hosting status (deprecated for new users)
- [Angular SSR + Firebase Fixes](https://medium.com/@michele.patrassi/angular-ssr-firebase-save-days-of-debugging-by-reading-these-fixes-fcb060e248bb) - Common Firebase SSR gotchas and fixes
- [State of Angular SSR Deployment 2024](https://dev.to/jdgamble555/the-state-of-angular-ssr-deployment-in-2024-17jb) - Deployment platform comparison
- [Firebase App Hosting GA](https://firebase.blog/posts/2025/04/apphosting-general-availability/) - App Hosting launched April 2025

### Tertiary (LOW confidence)
- [AngularFireStore SSR Issue #2420](https://github.com/angular/angularfire/issues/2420) - Firestore hanging during SSR (2020 issue, may be resolved)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `@angular/ssr` is the official, well-documented solution
- Architecture: HIGH - Prerender-only approach is well-supported in Angular 18 and avoids SSR complexity
- Firebase integration: HIGH - Static file serving with SPA fallback is Firebase Hosting's core feature
- Pitfalls: MEDIUM - Browser API issues are well-known; @angular/fire compat behavior during prerender needs testing
- NGXS compatibility: LOW - No specific documentation found; needs verification

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (30 days; Angular 18 is stable/LTS)
