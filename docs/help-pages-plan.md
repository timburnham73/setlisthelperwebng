# Help Pages Implementation Plan

## Context

Users need help documentation for the Band Central iOS and Android apps, accessible without logging in. The apps share nearly identical features (songs, setlists, lyrics/ChordPro, metronome, audio player, cloud sync, Bluetooth pedal support, tags, import/export). Platform-specific differences are mainly in UI navigation and pedal support (AirTurn on iOS vs generic Bluetooth on Android).

## Structure: Separate Pages per Platform

**Routes:**
- `/help` — Hub landing page linking to all help pages
- `/help/ios` — iOS app help
- `/help/android` — Android app help
- `/help/web` — Website help
- `/help/migration` — Setlist Helper to Band Central migration guide

**Why separate pages:**
- **SEO**: Each page gets its own `<title>` and `<meta description>` targeting platform-specific searches ("Band Central iOS help" vs "Band Central Android help")
- **Deep linking**: iOS app links directly to `/help/ios`, Android app to `/help/android`
- **UX**: Users see only content relevant to their platform — no toggling or scrolling past irrelevant content
- **Maintainability**: A single shared `help-page` component renders both — content is defined in a data file, not duplicated templates

## Route Configuration

Added to `app-routing.module.ts` (before wildcard, no auth guard — same as privacy-policy):

```
/help              → HelpLandingComponent (hub linking to all help pages)
/help/ios          → HelpPageComponent (iOS content)
/help/android      → HelpPageComponent (Android content)
/help/web          → HelpPageComponent (Website content)
/help/migration    → HelpMigrationComponent (Setlist Helper → Band Central migration guide)
```

## File Structure

```
src/app/features/help/
  help.module.ts                        -- Lazy-loaded feature module
  help-routing.module.ts                -- Routes: '', ':platform', 'migration'
  help-content.ts                       -- Static content data (HelpSection[], HelpTopic[])
  help-landing/
    help-landing.component.ts/html/css  -- Hub page linking to iOS, Android, Web, Migration
  help-page/
    help-page.component.ts/html/css     -- Shared help page (reads :platform route param)
  help-section/
    help-section.component.ts/html/css  -- Reusable expandable section (MatExpansionPanel)
  help-migration/
    help-migration.component.ts/html/css -- Setlist Helper → Band Central migration guide
```

### Modified Files

| File | Change |
|------|--------|
| `src/app/app-routing.module.ts` | Added `help` lazy-loaded route before `**` wildcard |
| `src/app/features/home/header/header.component.html` | Added "Help" link to nav bar |
| `src/app/features/home/header/header.component.ts` | Added `RouterLink` to imports |

## Component Design

- **`help-page`** reads `:platform` from the route, selects iOS/Android/Web content from `help-content.ts`, and sets page title/meta description via Angular's `Title` and `Meta` services
- **`help-section`** is a reusable component taking a `HelpSection` as `@Input()`, rendering a `MatExpansionPanel` with FAQ-style topics inside
- **`help-landing`** shows cards for iOS, Android, Web, and Migration guide linking to respective help pages
- **`help-migration`** is a dedicated page for migration content with its own layout
- All components are standalone, following the privacy-policy pattern (own toolbar linking back to `/home`)

## Help Content Sections (iOS & Android pages)

1. **Getting Started** — Account creation, signing in, bands & membership
2. **Songs** — Adding, editing, searching, importing songs
3. **Setlists** — Creating, reordering, timing, managing setlists
4. **Lyrics & ChordPro** — ChordPro format, transposing, auto-scroll, zoom
5. **Metronome** — Tempo, time signatures, tap tempo
6. **Audio Player** — Attaching audio, playback controls
7. **Bluetooth Pedal Support** — iOS: AirTurn setup / Android: generic Bluetooth pairing, action mapping
8. **Tags** — Creating, managing, filtering by tags
9. **Cloud Sync** — How sync works, offline mode, troubleshooting
10. **Import & Export** — Importing lyrics/documents, exporting data
11. **Settings** — Appearance, display options, performance mode
12. **Migrating from Setlist Helper** — Link to `/help/migration`
13. **Troubleshooting & FAQ** — Common issues, contact support

## Website Help Sections (`/help/web`)

1. **Getting Started** — Creating an account, signing in (Google/email)
2. **Bands** — Creating bands, managing members, switching between bands
3. **Songs** — Adding, editing, managing songs
4. **Setlists** — Creating and managing setlists
5. **Tags** — Organizing songs with tags
6. **Import** — Importing from Setlist Helper (links to migration guide)
7. **Account Settings** — Profile, display preferences
8. **Troubleshooting & FAQ** — Common issues, contact support

## Migration Guide: Setlist Helper → Band Central (`/help/migration`)

A dedicated page for users migrating from the legacy Setlist Helper app to Band Central.

### Content Outline

- **Overview** — Why migrate, what's new in Band Central
- **Before You Start** — Prerequisites (Dropbox setup for files)
  - If you have documents/lyrics files: put them in one Dropbox folder
  - If you have audio files: put them in the same Dropbox folder
- **Step-by-Step Migration**
  1. Sign up / log in at bandcentral.com
  2. Create a new band
  3. Tap "Import" on the band card
  4. (Additional steps TBD — user will provide detailed upgrade process)
- **After Migration** — Verifying your data, what to expect
- **Troubleshooting** — Common migration issues

### SEO value

Users searching "migrate from Setlist Helper" or "Setlist Helper to Band Central" will find this dedicated page.

## SEO Approach

- Dynamic `<title>` and `<meta name="description">` per page via Angular's `Title`/`Meta` services
- Semantic HTML: `<article>`, `<section>`, `<nav>`, proper heading hierarchy (`h1` > `h2` > `h3`)
- Unique, descriptive URLs for each platform

## Navigation Access Points

- **Home page header**: "Help" link alongside existing Home/Features/Pricings/Contact buttons
- **Help page toolbar**: "Band Central" link back to home, "All Help" link back to landing
- **Cross-platform nav**: Each help page has nav links to iOS, Android, Web, and Migration pages

## Implementation Notes

- The migration guide has placeholder content for now. Detailed upgrade steps will be added later.
- All help content is defined in `help-content.ts` as static data — editing content requires no template changes.
- The help module is lazy-loaded, keeping the initial bundle size unaffected.
