# Band Central

The web app for **Band Central** — a song management and setlist collaboration platform for bands, worship teams, and gigging musicians. Live at [bandcentral.com](https://www.bandcentral.com).

Band Central is the next-generation successor to [Setlist Helper](https://www.setlisthelper.com), a music management app I've shipped for over a decade. Band Central adds real-time cloud sync, multi-member band collaboration, per-member lyric versions, and a modern Angular 18 frontend backed by Firestore.

![Band Central Home](https://www.bandcentral.com/assets/images/bandcentral-home.png)

## What's in This Repo

This is the **Angular web app** for Band Central. It's the browser-based companion to native iOS and Android apps (separate repos). All three platforms share the same Firestore backend and real-time sync infrastructure.

## Tech Stack

### Frontend
- **Angular 18** with standalone components
- **Angular Material** for UI components
- **NGXS** for state management (actions, selectors, state containers)
- **RxJS** for reactive data flows
- **ngx-flexible-layout** for responsive layouts
- **ChordSheetJS** for ChordPro parsing and transposition

### Backend / Cloud
- **Firebase Firestore** — NoSQL document database with real-time listeners
- **Firebase Authentication** — Google, Apple, and email/password sign-in
- **Firebase Cloud Functions** — TypeScript/Node 22 serverless functions (transactional email, account imports, data aggregation)
- **Firebase Hosting** — CDN-backed static hosting
- **Firebase Storage** — user-uploaded files

### Tooling
- TypeScript 5.5
- ESLint with Angular plugins
- Firebase Emulator Suite for local dev
- GitHub Actions for CI/CD

## Highlighted Features

- **Real-time collaboration** — changes to songs, setlists, and lyrics propagate instantly to all band members via Firestore snapshot listeners
- **Per-member lyrics** — each band member can maintain their own lyric version of a shared song; `defaultForUsers` field routes which lyric version each user sees by default
- **Tiered entitlements** — `free`, `solo`, `band-small`, `band-medium`, `band-large`, `band-extra-large` plans with enforced limits on songs, setlists, and member counts
- **Bulk song import** — 3-step wizard that parses CSV/tab-separated data, auto-detects columns (key, tempo, time signature, genre), and imports sequentially to avoid duplicates
- **Free musician tools** — public tools section (BPM tap tempo, chord transpose, Web Audio metronome) built as an SEO funnel
- **Setlist Helper migration** — one-click import from the legacy Setlist Helper REST API into Firestore (account + songs + setlists + lyrics + tags), implemented as a Cloud Function
- **Subscription lifecycle emails** — Cloud Function trigger on `accounts/{accountId}` document updates detects entitlement changes from free to paid and sends personalized confirmation emails via nodemailer

## Project Structure

```
src/app/
├── core/
│   ├── model/              # TypeScript interfaces for all entities
│   ├── services/           # Firebase data access layer
│   └── store/              # NGXS state, actions, selectors
├── features/
│   ├── home/               # Marketing pages (home, pricing, footer)
│   ├── auth/               # Login, signup, password reset
│   ├── bands/              # Account/band management
│   ├── songs/              # Song catalog, edit dialog, bulk import
│   ├── setlists/           # Setlist builder with drag-and-drop
│   ├── lyrics/             # Lyric view/edit with ChordPro support
│   ├── tags/               # Tag management
│   ├── help/               # Help center, migration guide
│   ├── blog/               # SEO blog
│   ├── tools/              # Free musician tools (tap tempo, transpose, metronome)
│   └── admin/              # Admin dashboard
└── shared/
    ├── layout/             # Header, sidebar, footer shell
    ├── confirm-dialog/     # Reusable confirmation dialog
    └── export-dialog/      # Column-picker dialog for CSV/HTML export

functions/src/
├── index.ts                       # Cloud Function exports
├── contact-request/               # Support form email routing
├── welcome-email/                 # New user welcome email
├── subscription-email/            # Entitlement change email
└── sync-slh-data/                 # Setlist Helper → Band Central importer
```

## Running Locally

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. Create `src/environments/environment.ts` (gitignored) with your Firebase project config. A real config looks like:
   ```ts
   export const environment = {
     production: false,
     useEmulators: true,
     firebase: {
       projectId: 'your-project-id',
       apiKey: 'your-api-key',
       // ... etc
     }
   };
   ```

4. Start the Firebase emulators (Firestore, Auth, Functions, Hosting):
   ```bash
   npm run startem
   ```

5. In another terminal, start the Angular dev server:
   ```bash
   npm start
   ```

Visit `http://localhost:4200`.

## Deploying

Production hosting deploys from `master` via Firebase CLI:

```bash
npm run build
firebase deploy --only hosting
```

Cloud Functions:

```bash
cd functions
firebase deploy --only functions
```

## About

I'm **Tim Burnham** — I build apps for musicians. Setlist Helper has served 73,000+ users since 2011, and Band Central is its modern successor.

- 🌐 [bandcentral.com](https://www.bandcentral.com)
- 🎸 [setlisthelper.com](https://www.setlisthelper.com)
- 📧 Contact: tim@setlisthelper.com
