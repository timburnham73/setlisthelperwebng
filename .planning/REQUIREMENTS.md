# Requirements: Band Central Web — Milestone 2

**Defined:** 2026-04-17
**Core Value:** Musicians in a band can collaboratively manage their song library and setlists across all their devices, with changes syncing in real time.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### SSR / Prerendering

- [ ] **SSR-01**: Public routes (~20 pages) are prerendered to static HTML at build time so Google indexes real content instead of an empty shell
- [ ] **SSR-02**: Auth-gated routes (songs, setlists, admin) remain client-side rendered and are excluded from prerendering
- [ ] **SSR-03**: Browser API access (window, document, localStorage) is guarded with `isPlatformBrowser()` so prerender builds do not crash
- [ ] **SSR-04**: Prerendered HTML is served by Firebase Hosting; no runtime SSR server or Cloud Function is needed

### SEO

- [ ] **SEO-01**: Each public route has its own title, meta description, and Open Graph tags (not the global defaults from index.html)
- [ ] **SEO-02**: sitemap.xml is generated from the route configuration rather than maintained manually
- [ ] **SEO-03**: Each page type (tools, blog, pricing, home) has page-specific JSON-LD structured data

### RBAC

- [ ] **RBAC-01**: Each band has three roles: Owner (full control), Admin (add/edit/share), Member (view songs/setlists, create/edit own lyrics only)
- [ ] **RBAC-02**: Firestore security rules enforce role-based write restrictions server-side — Members cannot delete, edit others' songs, or modify band settings regardless of client UI
- [ ] **RBAC-03**: AccountUser documents are keyed by UID (migrated from auto-generated IDs) so security rules can look up the requesting user's role
- [ ] **RBAC-04**: Owner can view and change member roles from the band settings / member list UI
- [ ] **RBAC-05**: UI elements (delete, edit, share, settings) are hidden or disabled based on the user's role with clear messaging explaining why
- [ ] **RBAC-06**: Role badges (Owner/Admin/Member) are displayed next to each member's name in the member list

### Cross-Band Song Sharing

- [ ] **SHARE-01**: User can select one or more songs and copy them (with user's own lyrics) to another band they belong to
- [ ] **SHARE-02**: Copied songs store `sourceAccountId` and `sourceSongId`; source song stores a `sharedTo` array referencing the copies
- [ ] **SHARE-03**: Only the current user's lyrics are copied — other members' lyrics stay in the source band
- [ ] **SHARE-04**: Tags and setlist references are not copied (band-specific)
- [ ] **SHARE-05**: Sharing respects entitlement limits — user cannot share songs into a band that would exceed its song count limit
- [ ] **SHARE-06**: Only users with Admin or Owner role in the target band can share songs into it

### Duplicate Setlist

- [ ] **DUP-01**: Duplicate setlist feature is available to all users (remove systemAdmin gate)

## v2 Requirements

### Cross-Band Sharing Enhancements

- **SHARE-V2-01**: User can "Pull updates from source" to refresh a copied song with changes from the original
- **SHARE-V2-02**: "Shared from [Band Name]" badge is displayed on copied songs showing provenance
- **SHARE-V2-03**: Cross-band sharing is available on iOS and Android (port from web)

### RBAC Enhancements

- **RBAC-V2-01**: Owner can transfer ownership to another member
- **RBAC-V2-02**: RBAC roles are enforced on iOS and Android (port from web)

### SEO Enhancements

- **SEO-V2-01**: Dynamic blog sitemap entries auto-update when new blog posts are added
- **SEO-V2-02**: Additional blog content / landing pages for organic traffic

## Out of Scope

| Feature | Reason |
|---------|--------|
| Runtime SSR (Node.js server) | Public pages are static; prerendering achieves the same SEO result without server cost |
| Custom/configurable RBAC permissions | Fixed 3-tier roles cover the use case; custom permissions add complexity with minimal benefit at current scale |
| Shared song reference (live sync) | Copy-based sharing is simpler, avoids conflict resolution; re-sync can be added later |
| Move song between bands | Copy + delete achieves this without setlist reference complications |
| iOS/Android sharing and RBAC | Web-first this milestone to validate approach; port later |
| Monthly subscription billing | Annual-only via App Store/Play Store; no web payment flow |
| Re-sync / pull updates from source | Future phase after sharing validates; source tracking fields are laid in this milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SSR-01 | Phase 1 | Pending |
| SSR-02 | Phase 1 | Pending |
| SSR-03 | Phase 1 | Pending |
| SSR-04 | Phase 1 | Pending |
| SEO-01 | Phase 1 | Pending |
| SEO-02 | Phase 1 | Pending |
| SEO-03 | Phase 1 | Pending |
| RBAC-01 | Phase 2 | Pending |
| RBAC-02 | Phase 2 | Pending |
| RBAC-03 | Phase 2 | Pending |
| RBAC-04 | Phase 2 | Pending |
| RBAC-05 | Phase 2 | Pending |
| RBAC-06 | Phase 2 | Pending |
| SHARE-01 | Phase 3 | Pending |
| SHARE-02 | Phase 3 | Pending |
| SHARE-03 | Phase 3 | Pending |
| SHARE-04 | Phase 3 | Pending |
| SHARE-05 | Phase 3 | Pending |
| SHARE-06 | Phase 3 | Pending |
| DUP-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-04-17*
*Last updated: 2026-04-15 after roadmap creation*
