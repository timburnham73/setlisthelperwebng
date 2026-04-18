# Plan 01-03 Summary: Sitemap Automation

**Status:** Complete
**Shipped:** 2026-04-18
**Requirements:** SEO-02

## What shipped

New `scripts/generate-sitemap.mjs` — pure Node ES module, 160 lines. Reads `routes.txt` and `src/app/features/blog/blog-content.ts` to generate `src/sitemap.xml`. Priority and changefreq table matches spec.

10 tests in `scripts/generate-sitemap.test.mjs` using `node --test`, all passing.

Wired into production build via `package.json`:
```
build-production: npm run generate-sitemap && ng build --configuration=production --base-href=/
```

## Key decisions

1. **Exclude patterns** — `/auth`, `/bands`, `/admin`, `/users`, `/about` excluded from sitemap (auth-gated or redirect-only).
2. **Dedup** — `/blog` landing and `/blog/{slug}` overlap resolved.
3. **Alphabetical sort** — deterministic output for git diffs.
4. **Runs before ng build** — so the generated sitemap is copied to `dist/browser/` via angular.json assets.

## Verified live

- `curl https://www.bandcentral.com/sitemap.xml | grep -c '<loc>'` → **19** URLs
- No `/auth`, `/bands`, `/admin`, `/users` in sitemap
- All routes in `routes.txt` present
- Valid XML (xmllint clean)

## Drift fixed from old manual sitemap

- Old had `/pricing` (wrong path) → now correctly `/home/pricing`
- Old had `/about` (auth-gated, should not be in sitemap) → now excluded
- Old was missing `/home/pricing` until manually added

## Commits

- `31d671e` — Tests (RED)
- `2d39d29` — Sitemap generator (GREEN)
- `e2495e5` — Wire into build-production
