# Feature Landscape: RBAC and Cross-Band Song Sharing

**Domain:** Band management / collaborative music organization
**Researched:** 2026-04-15
**Focus:** RBAC roles and cross-band song sharing for existing Angular web app

## Table Stakes

Features users expect. Missing = product feels incomplete or insecure.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Owner/Admin/Member role distinction | BandHelper has this (Admin vs Member + Owner). Every multi-user band app ships some form of role hierarchy. Without it, any member can delete the entire song library. | Medium | Band Central's planned 3-tier model (Owner/Admin/Member) matches industry standard |
| Read-only member access | BandHelper's "None" editing access is exactly this. Members who just need to view songs/lyrics during rehearsal should not be able to edit shared data. | Low | Member role = view-only for shared data, can manage own lyrics |
| Admin can add/edit/delete songs and setlists | Standard delegation pattern. Band leader shouldn't be the only person who can manage the library. | Low | Direct mapping to Admin role |
| Owner controls membership and roles | Only one person should be able to add/remove members and assign Admin/Member roles. Prevents accidental lockout. | Low | Owner = single seat, not transferable in v1 |
| Copy song(s) to another band | BandHelper supports copying songs between projects. OnSong supports beaming songs/sets between devices. Users in multiple bands need this. | Medium | Band Central's spec is well-designed: copy-based with source tracking |
| Band picker for sharing target | BandHelper lets you assign items to projects. UI must show user's other bands with clear selection. | Low | Spec already covers this: exclude current band, confirmation dialog |
| Bulk song sharing (multi-select) | BandHelper supports bulk operations. Users switching bands or seeding a new band need to share 20+ songs at once. | Medium | Spec covers this. Progress indicator needed for large batches |
| Personal lyrics only in share | Users expect their own lyrics/notes to follow them, but NOT other members' private lyrics. This is a privacy boundary. | Low | Spec correctly scopes to `createdByUser.uid == currentUser` |

## Differentiators

Features that set Band Central apart. Not universally expected, but high value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Source tracking on copied songs | BandHelper's "smart copy" inherits changes from originals. Band Central's approach is simpler (explicit pull) but still tracks lineage. Rare in the market. | Low | Already in spec: `sourceAccountId`/`sourceSongId` fields |
| "Pull updates from source" (future phase) | BandHelper auto-syncs shared items. Band Central's one-way manual pull is a safer UX that avoids surprise overwrites. Most competitors either fully sync or fully isolate. | High | Out of scope this milestone but source tracking lays the groundwork |
| Member can create/edit own lyrics only | BandHelper allows personal versions alongside a master copy. Most apps are all-or-nothing (full edit or read-only). Band Central letting Members manage their own lyric versions while protecting shared song data is a genuine differentiator. | Medium | Key UX: Members see shared song metadata (read-only) but can create personal lyric sheets |
| Role visible in member list UI | BandHelper shows roles in user management. Clear role indicators (Owner badge, Admin badge) reduce confusion about who can do what. | Low | Admin dashboard already shows roles; extend to band member list in-app |
| Shared song indicator badge | No competitor shows "this song was shared from Band X" in the song list. Visual lineage tracking helps users understand their library. | Low | Show a subtle "shared from [Band Name]" badge on copied songs |
| Dropbox file references preserved on share | Band Central already stores Dropbox file refs. Carrying them through the copy means the user's attached PDFs/audio just work in the new band. | Low | Already in spec |

## Anti-Features

Features to explicitly NOT build. These add complexity without proportional value at current scale (~15 subscribers).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom/configurable permission system | Planning Center Services has 5+ permission tiers with folder-level granularity. This is enterprise-grade complexity for worship teams of 50+. Band Central's users are small bands (2-20 members). | Fixed 3-tier roles (Owner/Admin/Member). Revisit only if demand emerges from bands with 20+ members. |
| Real-time shared references (not copies) | BandHelper's shared items are single documents visible across projects. This creates complex consistency problems: who can edit, how do conflicts resolve, what happens when a project is deleted? | Copy-based sharing with optional future pull. Each band owns their copy independently. No conflict resolution needed. |
| Automatic sync / push updates to copies | Auto-sync creates surprise changes in live performance scenarios. A band could be mid-gig when lyrics update underneath them. | Manual "Pull updates" action only (future phase). User explicitly chooses when to sync. |
| Move song between bands | Moving requires updating setlist references, breaking source tracking, and handling edge cases (what if song is in an active setlist?). | Copy + delete achieves the same result. Already noted in PROJECT.md out-of-scope. |
| Per-song permission overrides | "Song X is editable by Member Y but not Member Z" is a permissions nightmare. No competitor below enterprise tier does this. | Role applies uniformly to all songs in the band. |
| Bidirectional sync between copied songs | Two-way sync between source and copy creates circular update conflicts and requires merge logic. Even BandHelper only does one-way (original to smart copy). | One-way only: source to copy. Already in spec. |
| Song "loan" with expiration (OnSong-style) | OnSong allows temporary sharing where songs expire. This is a DRM feature for worship licensing compliance. Irrelevant for bands managing their own original arrangements. | Permanent copies. If a song shouldn't be in a band, the Admin or Owner deletes it. |
| Transfer ownership of band | Edge case that creates complex state transitions (what if new owner has a free tier?). | Owner is permanent for v1. Support can reassign via admin dashboard if needed. |
| Invitation/approval workflow for sharing | "Request to join band" or "Approve song share" adds friction. At small scale, bands communicate directly. | Direct add-by-email for members. Direct copy for songs. No approval queues. |

## Feature Dependencies

```
RBAC Foundation
  |
  +-- Owner/Admin/Member roles stored in Firestore
  |     |
  |     +-- UI permission guards (hide edit/delete for Members)
  |     |
  |     +-- Firestore security rules (enforce server-side)
  |     |
  |     +-- Admin dashboard role management (already partially exists)
  |
Cross-Band Song Sharing
  |
  +-- Song model: sourceAccountId, sourceSongId, sharedTo fields
  |     |
  |     +-- "Share to Band" action in song list
  |     |     |
  |     |     +-- Band picker dialog
  |     |     |
  |     |     +-- Copy logic (song + user's lyrics)
  |     |
  |     +-- Shared song badge in UI (depends on source fields)
  |
  +-- (Future) Pull updates from source
        |
        +-- Requires source tracking from initial share
```

RBAC and Song Sharing are independent features with no dependency between them. They can be built in parallel or in either order. However, RBAC should ship first because:
1. It protects data integrity before opening sharing (shared songs should respect role permissions)
2. Members who receive shared songs need to understand they are read-only for song metadata

## MVP Recommendation

### Phase 1: RBAC (ship first)
1. **Owner/Admin/Member roles in Firestore** - Add `role` field to account member entries
2. **UI permission guards** - Hide edit/delete/manage buttons for Member role; hide member management for non-Owners
3. **Firestore security rules** - Enforce role checks server-side (don't rely on UI-only guards)
4. **Role management UI** - Owner can promote/demote members in band settings

### Phase 2: Cross-Band Song Sharing
1. **Song model changes** - Add `sourceAccountId`, `sourceSongId`, `sharedTo` fields
2. **Share to Band action** - Context menu on song list (single and multi-select)
3. **Band picker dialog** - Show user's other bands, exclude current
4. **Copy logic** - Song metadata + user's lyrics with source tracking
5. **Shared song badge** - Visual indicator on copied songs

### Defer
- **Pull updates from source**: Explicitly out of scope per PROJECT.md. Source tracking fields lay the groundwork.
- **Transfer ownership**: Handle via admin dashboard manually.
- **Custom permissions**: No demand signal at current scale.

## Competitor Feature Matrix

| Feature | BandHelper | OnSong | Planning Center | Band Central (planned) |
|---------|-----------|--------|----------------|----------------------|
| **Role tiers** | 2 (Admin/Member) + Owner | None visible | 5 (Scheduled Viewer through Administrator) | 3 (Owner/Admin/Member) |
| **Read-only mode** | Yes (editing = "None") | No explicit roles | Yes (Scheduled Viewer) | Yes (Member role) |
| **Granular permissions** | 3 editing levels, 4 viewing levels | No | Folder/service-type level | No (fixed roles) |
| **Cross-project song sharing** | Yes (shared reference or smart copy) | Beam/wireless only | Song library is shared across service types | Yes (copy with source tracking) |
| **Personal versions** | Yes (master + personal) | Yes (own versions) | No | Yes (Members own lyrics) |
| **Bulk sharing** | Yes | Sets only | N/A | Yes (multi-select) |
| **Source tracking** | Implicit (smart copy inherits) | No | No | Explicit (sourceAccountId) |
| **Update propagation** | Automatic (shared items) | No | N/A | Manual pull (future) |
| **Pricing** | $49.99/yr single, $99.99/yr band | $24.99-99.99/yr | $0-249/mo | Tiered annual subscriptions |

## Sources

- [BandHelper Managing Users](https://www.bandhelper.com/tutorials/managing_users.html) - HIGH confidence (official docs)
- [BandHelper Features](https://www.bandhelper.com/main/features.html) - HIGH confidence (official docs)
- [BandHelper Projects](https://www.bandhelper.com/tutorials/projects.html) - HIGH confidence (official docs)
- [OnSong Connect](https://onsongapp.com/docs/features/connect/) - HIGH confidence (official docs)
- [OnSong Sharing Rights](https://onsongapp.com/docs/interface/menubar/utilities-menu/settings/menu-settings/sharing/rights/) - HIGH confidence (official docs)
- [Planning Center Services Permissions](https://pcoservices.zendesk.com/hc/en-us/articles/204261964-Permissions-in-Services) - HIGH confidence (official docs)
- [Planning Center Updated Permissions (March 2025)](https://www.planningcenter.com/blog/2025/03/new-in-services-updated-permissions-for-customized-account-access) - HIGH confidence (official blog)
- [Bandinq Band Management](https://www.bandinq.com/Features/BandManagement) - MEDIUM confidence (WebSearch)
- [Band Pencil Best Apps 2025](https://bandpencil.com/article/the-best-band-management-apps-of-2024) - MEDIUM confidence (WebSearch)
