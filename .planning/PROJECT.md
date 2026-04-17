# Band Central Web

## What This Is

Band Central is a cross-platform app (iOS, Android, web) that helps bands manage songs, setlists, lyrics, and ChordPro charts with real-time collaboration. This repo is the Angular web app serving bandcentral.com — the public-facing website, authenticated band management tool, and admin dashboard.

## Core Value

Musicians in a band can collaboratively manage their song library and setlists across all their devices, with changes syncing in real time.

## Requirements

### Validated

- ✓ Song management (CRUD, search, sort, key/tempo/genre metadata) — existing
- ✓ Setlist management (CRUD, drag-to-reorder songs, breaks, gig date/time/location) — existing
- ✓ Lyrics management (multiple versions per song, ChordPro + plain text, auto-scroll, transpose) — existing
- ✓ Multi-band support (users belong to multiple bands/accounts) — existing
- ✓ Real-time sync via Firestore — existing
- ✓ Entitlement tiers (free/solo/band-small/medium/large/xl) with App Store/Play Store subscriptions — existing
- ✓ Setlist Helper data import (legacy migration from setlisthelper.com) — existing
- ✓ Dropbox file integration (attach files to lyrics) — existing
- ✓ Admin dashboard (band/user management, entitlement changes, welcome emails) — existing
- ✓ Free musician tools (metronome, transpose, tap-tempo) — existing
- ✓ Public marketing pages (home, pricing, why, help, blog) — existing
- ✓ Song export (CSV/HTML with column picker) — existing
- ✓ Duplicate setlist (systemAdmin-gated for now) — existing
- ✓ Tag-based song organization — existing
- ✓ Setlist printing with configurable layouts — existing

### Active

- [ ] SSR/Prerendering — Angular prerender for ~20 public routes so Google indexes them (only 3 of 24 pages currently indexed)
- [ ] Full SEO push — per-route meta tags, sitemap automation, structured data per page, Google Search Console optimization
- [ ] Cross-band song sharing — copy songs (+ user's lyrics) between bands with source tracking and optional re-sync (web only this milestone; spec at bandcentral-pm/features/cross-band-song-sharing.md)
- [ ] RBAC — Owner/Admin/Member roles per band: Members can only view songs/setlists, create/edit their own lyrics; Admins can add/edit/share; Owners have full control including delete, member management, and role assignment
- [ ] Duplicate setlist for all users — remove systemAdmin gate, ship to everyone

### Out of Scope

- Re-sync / pull updates from source song — future phase after sharing ships
- Cross-band sharing on iOS/Android — web-first this milestone, port later
- Monthly subscription option — annual only via App Store/Play Store
- Move song between bands (copy + delete achieves this)
- Custom configurable RBAC permissions — fixed 3-tier roles only

## Context

- **Codebase:** Angular 18 SPA with standalone components, NGXS state management, @angular/fire (compat) for Firestore, deployed to Firebase Hosting
- **Backend:** Firebase (Firestore, Auth, Storage, Cloud Functions v2 on Node.js 22)
- **SEO problem:** Angular SPA renders empty `<app-root>` shell — Googlebot discovers pages but doesn't index them. Research completed at `.planning/phases/ssr-research/RESEARCH.md`: use `@angular/ssr@18` build-time prerendering (SSG), guard browser APIs in ~12 files
- **Cross-band sharing spec:** Fully designed at `/Users/timburnham/src/bandcentral-pm/features/cross-band-song-sharing.md`. Copy-based with source reference, one-way sync direction, user's lyrics only
- **Central docs:** All requirements and feature specs live in bandcentral-pm repo (`/Users/timburnham/src/bandcentral-pm/`)
- **Current users:** ~15 paid subscribers across solo/band-small/band-medium tiers (~$330/yr gross revenue)

## Constraints

- **Tech stack**: Angular 18, Firebase, TypeScript — no framework changes
- **Hosting**: Firebase Hosting (static files) — SSR must use prerendering (SSG), not runtime SSR server
- **Auth**: Firebase Auth — RBAC roles stored in Firestore user/account docs, not Firebase custom claims (simpler for current scale)
- **Platforms**: Web-only for new features this milestone; iOS/Android get ported in future milestones
- **Subscription billing**: Managed by App Store / Play Store — no web-based payment flow

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prerendering (SSG) over runtime SSR | Public pages are static marketing content; no per-request data needed; avoids Cloud Functions for SSR | — Pending |
| Copy-based song sharing (not shared reference) | Simpler data model, no conflict resolution, each band independently owns their copy | — Pending |
| Fixed 3-tier RBAC (Owner/Admin/Member) | Custom roles add complexity with minimal benefit at current user scale | — Pending |
| Web-first for new features | Fastest iteration cycle; iOS/Android port after web validates the approach | — Pending |
| SSR/SEO prioritized first | Drives organic traffic and user acquisition; sharing/RBAC are retention features | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-17 after initialization*
