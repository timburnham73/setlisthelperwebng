# Roadmap: Band Central Web — Milestone 2

## Overview

This milestone makes Band Central discoverable by search engines, adds role-based access control so band members have appropriate permissions, and enables cross-band song sharing so musicians can copy songs between their bands. A trivial duplicate-setlist unlock ships alongside sharing.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 0.1: Release Notification Emails** - INSERTED: Cloud Function to email all users release notes when a new version is published
- [x] **Phase 1: SSR & SEO** - Prerender public routes and add per-page SEO so Google indexes the site ✓ 2026-04-18
- [ ] **Phase 2: Role-Based Access Control** - Enforce Owner/Admin/Member roles per band in Firestore rules and UI
- [ ] **Phase 3: Cross-Band Sharing & Duplicate Setlist** - Let users copy songs between bands and unlock duplicate setlist for everyone

## Phase Details

### Phase 0.1: Release Notification Emails (INSERTED)
**Goal**: Admin can trigger a branded release-notes email to all registered users when a new app version ships
**Depends on**: Nothing (independent)
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03
**Success Criteria** (what must be TRUE):
  1. Writing a document to the `releases` Firestore collection triggers a Cloud Function that sends an email to every registered user
  2. The email uses a branded HTML template with Tim's signature, AirTurn affiliate link, and release note details
  3. Each user receives the email at their registered email address; users without email are skipped
**Plans**: TBD

Plans:
- [ ] 00.1-01: TBD

### Phase 1: SSR & SEO
**Goal**: Google indexes Band Central's public pages with rich metadata instead of an empty shell
**Depends on**: Nothing (first phase)
**Requirements**: SSR-01, SSR-02, SSR-03, SSR-04, SEO-01, SEO-02, SEO-03
**Success Criteria** (what must be TRUE):
  1. Running `curl` against any public route on the deployed site returns fully rendered HTML with visible content (not just `<app-root></app-root>`)
  2. Auth-gated routes (songs, setlists, admin) still load normally in the browser and are not included in prerender output
  3. Each public page has a unique `<title>`, meta description, and Open Graph tags visible in page source
  4. A sitemap.xml is accessible at the site root and lists all public routes
  5. JSON-LD structured data is present in page source for home, pricing, tools, and blog pages
**Plans**: 3 plans (all complete)

Plans:
- [x] 01-01-PLAN.md — Add @angular/ssr, configure prerender, guard browser APIs ✓
- [x] 01-02-PLAN.md — Per-route SEO service with JSON-LD structured data ✓
- [x] 01-03-PLAN.md — Sitemap automation from routes.txt + blog content ✓

### Phase 2: Role-Based Access Control
**Goal**: Band members have scoped permissions — Members can view but not modify shared resources, Admins can manage content, Owners have full control
**Depends on**: Phase 1
**Requirements**: RBAC-01, RBAC-02, RBAC-03, RBAC-04, RBAC-05, RBAC-06
**Success Criteria** (what must be TRUE):
  1. A Member-role user can view songs and setlists but cannot delete songs, edit other members' songs, or access band settings — both in the UI and when attempting direct Firestore writes
  2. An Owner can open the member list, see role badges next to each name, and change a member's role
  3. UI controls (delete, edit, share, settings) are hidden or disabled for users without the required role, with a message explaining the restriction
  4. AccountUser documents use UID-based keys so Firestore security rules can resolve the requesting user's role without a secondary query
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Cross-Band Sharing & Duplicate Setlist
**Goal**: Musicians can copy songs (with their own lyrics) from one band to another, and all users can duplicate setlists
**Depends on**: Phase 2 (sharing enforces RBAC roles on the target band)
**Requirements**: SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05, SHARE-06, DUP-01
**Success Criteria** (what must be TRUE):
  1. A user belonging to two bands can select songs in Band A and copy them to Band B; the copies appear in Band B's song list with only the user's own lyrics attached
  2. Copied songs do not carry over tags or setlist references from the source band
  3. Sharing into a band is blocked with a clear message when the target band's song count would exceed its entitlement limit
  4. Only users with Admin or Owner role in the target band can share songs into it; Members see the share option disabled
  5. Any user (not just systemAdmin) can duplicate a setlist from the setlist list page
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 0.1 -> 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0.1. Release Notification Emails | 0/0 | Not started | - |
| 1. SSR & SEO | 3/3 | Complete | 2026-04-18 |
| 2. Role-Based Access Control | 0/0 | Not started | - |
| 3. Cross-Band Sharing & Duplicate Setlist | 0/0 | Not started | - |
