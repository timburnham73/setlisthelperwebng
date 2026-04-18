# Plan 01-01 Summary: SSR Prerendering Foundation

**Status:** Complete
**Shipped:** 2026-04-18
**Requirements:** SSR-01, SSR-02, SSR-03, SSR-04

## What shipped

Installed `@angular/ssr@18.2.21` + `@angular/platform-server@18.1.1` (pinned exactly to avoid peer-dep conflict with core 18.1.1). Configured build-time prerendering for 20 public routes via `routes.txt` with `discoverRoutes: false`. Auth-gated routes (/bands, /admin, /users, /about) correctly excluded. `provideClientHydration()` enabled.

Guarded browser API access in 8 files so prerender build does not crash:
- `window.helper.ts` — WINDOW token returns null on server; BrowserWindowRef.nativeWindow guarded with `typeof window !== 'undefined'`
- `shared.module.ts` — WINDOW_PROVIDERS removed from providers array (empty now)
- `core.module.ts` — LOCALSTORAGE factory wrapped in isPlatformBrowser
- `app.component.ts` — auth redirect guarded
- `scroll-to.directive.ts` — platform guards + arrow-fn setTimeout
- `home.component.ts` — ngAfterViewInit guard
- `header.component.ts` — Window|null typing + null-check

Firebase Hosting public dir changed from `dist` to `dist/browser` (schematic changed output structure).

## Key decisions

1. **Build-time prerender (SSG), not runtime SSR** — public pages are static marketing; no Cloud Functions needed.
2. **Pinned exact Angular SSR versions** — 18.2.x required 18.2.x peers; we are on 18.1.1.
3. **NgxsStoragePlugin left as-is** — investigation showed @ngxs/storage-plugin@18.x is already SSR-safe (engineFactory returns null on server, handle() short-circuits on server).
4. **WINDOW_PROVIDERS deleted from SharedModule** — WINDOW token now self-provides via `providedIn: 'root'`.

## Verified live

- `curl https://www.bandcentral.com/why` — returns rendered HTML with `<h1>Why Band Central?</h1>`
- `curl https://www.bandcentral.com/tools/metronome` — returns rendered metronome content
- `dist/browser/bands/` and `dist/browser/admin/` do not exist (auth-gated routes excluded)
- No NG0500/NG0501 hydration errors in browser console

## Commits

- `c8b2813` — Install @angular/ssr, configure prerender, create routes.txt
- `2a58dd0` — Guard browser APIs in 8 files
