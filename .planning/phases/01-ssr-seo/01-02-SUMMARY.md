# Plan 01-02 Summary: Per-route SEO Service

**Status:** Complete
**Shipped:** 2026-04-18
**Requirements:** SEO-01, SEO-03

## What shipped

New `SeoService` at `src/app/core/services/seo.service.ts` with `setSeo()`, `setJsonLd()`, `clearJsonLd()`. Uses `DOCUMENT` injection — works during Angular SSR prerender. 8 Jasmine tests cover service behavior.

Wired into 14 public-route components (16 URLs — 3 HelpPageComponent instances for ios/android/web):
- home, home/pricing, why, tools (landing), tools/metronome, tools/transpose, tools/tap-tempo, help (landing), help/ios, help/android, help/web, help/migration, blog (landing), blog/:slug, contact, privacy-policy

Page-specific JSON-LD emitted on:
- `/home/pricing` — SoftwareApplication with offers[] (6 tiers)
- `/tools` — ItemList
- `/tools/metronome|transpose|tap-tempo` — SoftwareApplication
- `/blog` — Blog + blogPost[]
- `/blog/:slug` — Article

Global Organization + SoftwareApplication JSON-LD in `src/index.html` preserved. Removed default `<title>`, description, og:* from index.html (now set per-route).

## Key decisions

1. **DOCUMENT injection** — works on both browser and server platform; Angular's Title/Meta services alone don't cover og:tags or JSON-LD.
2. **Stable id="page-jsonld"** — client-side nav replaces, doesn't duplicate.
3. **HomeComponent skips setSeo when child route active** — prevents PricingsComponent (embedded under /home) from being overwritten by parent.
4. **PricingsComponent uses Router.url** — distinguishes standalone `/home/pricing` from embedded render under `/home`.

## Verified live

- `/home`: "Band Central - Manage Your Band's Songs, Setlists & Lyrics"
- `/why`: "Why Band Central - Built for Working Musicians"
- `/tools/metronome`: "Online Metronome - Free Tool | Band Central"
- `/tools/transpose`: "Chord Transpose Tool - Free Online | Band Central"
- `/blog/worship-set-planning-guide`: "Worship Set Planning: How to Build Sets That Flow | Band Central Blog"
- `/tools` has 3 JSON-LD scripts (2 global + 1 page-specific ItemList)
- Blog article schema detected: `"@type":"Article"`

## Deviations

Fixed 5 pre-existing spec file TypeScript errors (unrelated) so karma suite could run the new SeoService tests. Tracked in `.planning/phases/01-ssr-seo/deferred-items.md`.

## Commits

- `c9e8c75` — Unblock pre-existing spec compile errors
- `19f5c69` — Build SeoService with tests (TDD)
- `956e0ee` — Wire 14 components + JSON-LD + update index.html
