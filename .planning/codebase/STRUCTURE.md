# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
setlisthelperwebng/
├── src/                        # Angular frontend source
│   ├── app/                    # Application code
│   │   ├── core/               # Singleton services, state, models, guards
│   │   ├── custom-material/    # Angular Material module aggregation
│   │   ├── features/           # Lazy-loaded feature modules
│   │   └── shared/             # Reusable components, pipes, directives, layouts
│   ├── assets/                 # Static assets (icons, images)
│   ├── environments/           # Environment configs (dev/prod)
│   ├── index.html              # Main HTML entry
│   ├── main.ts                 # Bootstrap entry point
│   ├── polyfills.ts            # Browser polyfills
│   └── styles.scss             # Global styles
├── functions/                  # Firebase Cloud Functions
│   ├── src/                    # Function source (TypeScript)
│   └── lib/                    # Compiled output
├── server/                     # Server-side code (SSR research/unused)
│   ├── src/                    # Server source
│   └── build/                  # Server build output
├── sample-data/                # Firebase emulator seed data
│   ├── firestore_export/       # Firestore sample data
│   └── storage_export/         # Storage sample data
├── docs/                       # Documentation assets
├── .firebase/                  # Firebase hosting cache
├── .github/workflows/          # GitHub Actions CI/CD
├── .planning/                  # GSD planning documents
│   ├── codebase/               # Codebase analysis docs
│   └── phases/                 # Implementation phase plans
├── angular.json                # Angular CLI config
├── firebase.json               # Firebase project config
├── package.json                # NPM dependencies
├── tsconfig.json               # TypeScript config
└── yarn.lock                   # Yarn lockfile
```

## Directory Purposes

**`src/app/core/`:**
- Purpose: Application-wide singletons loaded once in root module
- Contains: Services, state management, models, guards, interceptors, utilities
- Key files:
  - `core.module.ts` — CoreModule with singleton guard (`throwIfAlreadyLoaded`)
  - `services/auth.service.ts` — Firebase Auth wrapper
  - `services/song.service.ts` — Song CRUD with batch writes and artist/genre management
  - `services/setlist-songs.service.ts` — Setlist-song relationship management
  - `services/notification.service.ts` — MatSnackBar wrapper
  - `services/spinner.service.ts` — Loading state service
  - `services/account.service.ts` — Account CRUD
  - `services/lyrics.service.ts` — Lyrics CRUD
  - `services/tag.service.ts` — Tag CRUD
  - `services/user.service.ts` — User data access
  - `services/artist.service.ts` — Artist lookups
  - `services/genre.service.ts` — Genre lookups
  - `services/ChordProParser.ts` — ChordPro format parsing for lyrics
  - `services/globar-error.handler.ts` — Global error handler (currently disabled)
  - `interceptors/spinner.interceptor.ts` — HTTP spinner interceptor
  - `guards/module-import.guard.ts` — Prevents double-import of CoreModule

**`src/app/core/store/`:**
- Purpose: NGXS state management
- Contains: State classes, action classes, state module
- Key files:
  - `account.state.ts` / `account.actions.ts` — Account state (selected account, account list, users)
  - `account-state.module.ts` — Feature module registering AccountState with NGXS storage plugin
  - `song.state.ts` / `song.actions.ts` — Song state (CRUD, load by tags, filtering)
  - `artist.state.ts` / `artist.actions.ts` — Artist state
  - `genre.state.ts` / `genre.actions.ts` — Genre state

**`src/app/core/model/`:**
- Purpose: TypeScript interfaces and data helpers
- Contains: Domain model interfaces, factory classes
- Key files:
  - `base.ts` — Base interface (id, name, nameLowered, audit fields)
  - `account.ts` — Account interface + AccountHelper static class
  - `song.ts` — Song interface
  - `setlist.ts` / `setlist-song.ts` — Setlist and setlist-song interfaces
  - `lyric.ts` — Lyric interface
  - `tag.ts` — Tag interface
  - `artist.ts` / `genre.ts` — Artist/Genre interfaces
  - `AccountUser.ts` — Account user/member interface
  - `user.ts` — User interface
  - `entitlement-limits.ts` — Subscription tier limits
  - `roles.ts` / `user-roles.ts` — Role definitions
  - `sampleSongs.ts` — Sample song data for new accounts
  - `lyric-format.ts` / `lyric-format-songpart.ts` — Lyric formatting models
  - `setlist-print-settings.ts` — Print layout settings
  - `factory/base.factory.ts` — Abstract factory with audit field management
  - `factory/song.factory.ts` — Song-specific factory
  - `factory/artist.factory.ts` — Artist-specific factory
  - `factory/genre.factory.ts` — Genre-specific factory
  - `factory/setlist-song.factory.ts` — Setlist-song factory

**`src/app/core/util/`:**
- Purpose: Pure utility functions
- Contains: Date helpers, DB utilities, song helpers
- Key files:
  - `song.util.ts` — Song length formatting, song detail string building
  - `date-util.ts` — Date formatting utilities
  - `db-utils.ts` — Firestore helper utilities

**`src/app/core/viewModel/`:**
- Purpose: View-specific data shapes
- Contains: `song-attribute.ts`

**`src/app/features/`:**
- Purpose: Lazy-loaded feature modules organized by domain
- Contains: One directory per feature, each with its own module + routing module
- Structure per feature:
  ```
  features/{feature}/
  ├── {feature}.module.ts           # NgModule (imports standalone components)
  ├── {feature}-routing.module.ts   # Child routes
  └── {component-name}/             # One dir per component
      ├── {component}.component.ts
      ├── {component}.component.html
      ├── {component}.component.scss
      └── {component}.component.spec.ts  (some features)
  ```

**`src/app/features/` — Feature Index:**

| Directory | Route | Auth Required | Purpose |
|-----------|-------|---------------|---------|
| `accounts/` | `/bands` | Yes | Band selection, account management |
| `songs/` | `/bands/:accountid/songs` | Yes | Song list, add/edit/delete songs, bulk import |
| `setlists/` | `/bands/:accountid/setlists` | Yes | Setlist list, setlist songs, print |
| `lyrics/` | `.../:songid/lyrics` | Yes | Lyric viewing, editing, printing, versions |
| `tags/` | `/bands/:accountid/tags` | Yes | Tag management, tag-song associations |
| `import/` | `/bands/:accountid/import` | Yes | Legacy SLH data import |
| `admin/` | `/admin` | Yes | Admin dashboard |
| `users/` | `/users` | Yes | User management |
| `about/` | `/about` | Yes | About page |
| `auth/` | `/auth` | No | Login (FirebaseUI) |
| `home/` | `/home` | No | Public landing page, pricing |
| `help/` | `/help` | No | Help docs, migration guide |
| `blog/` | `/blog` | No | Blog landing, blog posts |
| `contact/` | `/contact` | No | Contact form |
| `tools/` | `/tools` | No | Free tools (tap tempo, transpose, metronome) |
| `why-band-central/` | `/why` | No | Marketing/comparison page |
| `privacy-policy/` | `/privacy-policy` | No | Privacy policy |

**`src/app/shared/`:**
- Purpose: Reusable components, directives, pipes, layout shells
- Contains:
  - `layout/` — `LayoutComponent`: Main authenticated layout with sidebar + toolbar
  - `layout-no-sidebar/` — `LayoutNoSidebarComponent`: Authenticated layout without sidebar
  - `layout-no-sidebar-child-view/` — `LayoutNoSidebarChildViewComponent`: Child view layout
  - `confirm-dialog/` — Reusable confirmation dialog component
  - `export-dialog/` — Export column selection dialog (CSV/HTML export)
  - `content-placeholder-animation/` — Loading skeleton animation
  - `icons/expand-icon/` — Custom expand icon component
  - `directives/auto-focus/` — Auto-focus directive
  - `directives/swipe/` — Swipe gesture directive
  - `pipes/limit-to.pipe.ts` — Array/string truncation pipe
  - `pipes/local-date.pipe.ts` — Local date formatting pipe
  - `pipes/yes-no.pipe.ts` — Boolean to Yes/No pipe
  - `pipes/safe-html.pipe.ts` — HTML sanitization pipe
  - `pipes/sec-to-min.pipe.ts` — Seconds to minutes pipe
  - `validators/` — Custom form validators
  - `helpers/window.helper.ts` — Window injection token
  - `mocks/` — Test mocks
  - `shared.module.ts` — SharedModule exporting common imports

**`src/app/custom-material/`:**
- Purpose: Centralized Angular Material module imports
- Contains: `custom-material.module.ts` importing/exporting all Material modules, custom SVG icon registration
- Also contains: `select-check-all/` — Custom "select all" checkbox component for mat-select

**`functions/src/`:**
- Purpose: Firebase Cloud Functions (TypeScript, v2 API)
- Contains:
  - `index.ts` — Function exports and trigger definitions
  - `contact-request/` — Email on contact form submission
  - `welcome-email/` — Welcome email on new user signup
  - `subscription-email/` — Email on entitlement level change
  - `sync-slh-data/` — Legacy Setlist Helper data import sync
  - `lyrics-count-trigger/` — Lyrics count update (currently disabled)
  - `setlists-trigger/` — Setlist count update (currently disabled)
  - `model/` — Shared model types for functions

## Key File Locations

**Entry Points:**
- `src/main.ts`: Application bootstrap with all root providers
- `src/app/app.component.ts`: Root component (router outlet + auth redirect)
- `src/app/app-routing.module.ts`: Top-level route definitions
- `functions/src/index.ts`: Cloud Functions entry

**Configuration:**
- `angular.json`: Angular CLI build config (output to `dist/`, budget limits 4MB warn / 5MB error)
- `tsconfig.json` / `tsconfig.app.json`: TypeScript configuration
- `firebase.json`: Firebase hosting + functions config
- `src/environments/environment.ts`: Dev environment (emulator flags)
- `src/environments/environment.prod.ts`: Production environment

**Core Logic:**
- `src/app/core/store/song.state.ts`: Song state management (most complex state)
- `src/app/core/services/song.service.ts`: Song business logic with batch writes
- `src/app/core/services/auth.service.ts`: Authentication observables
- `src/app/core/model/factory/base.factory.ts`: Base factory pattern for audit fields

**Shared Components:**
- `src/app/shared/layout/layout.component.ts`: Main app shell with sidebar
- `src/app/shared/confirm-dialog/confirm-dialog.component.ts`: Reusable confirm dialog
- `src/app/shared/export-dialog/export-dialog.component.ts`: Export column picker

## Naming Conventions

**Files:**
- Components: `kebab-case.component.ts` (e.g., `song-list.component.ts`)
- Services: `kebab-case.service.ts` (e.g., `song.service.ts`)
- Modules: `kebab-case.module.ts` (e.g., `songs.module.ts`)
- Routing modules: `kebab-case-routing.module.ts` (e.g., `songs-routing.module.ts`)
- State: `kebab-case.state.ts` / `kebab-case.actions.ts`
- Models: `kebab-case.ts` (e.g., `song.ts`, `account.ts`)
- Factories: `kebab-case.factory.ts` (e.g., `song.factory.ts`)
- Pipes: `kebab-case.pipe.ts` (e.g., `limit-to.pipe.ts`)

**Directories:**
- Feature modules: `kebab-case/` matching the domain (e.g., `songs/`, `setlists/`)
- Components within features: `kebab-case/` (e.g., `song-list/`, `song-edit-dialog/`)

**Exception:** `AccountUser.ts`, `JwtToken.ts`, `LyricDisplaySetting.ts` use PascalCase filenames (older convention, inconsistent)

## Where to Add New Code

**New Feature Module:**
1. Create directory: `src/app/features/{feature-name}/`
2. Create module: `{feature-name}.module.ts`
3. Create routing module: `{feature-name}-routing.module.ts`
4. Add lazy-load route in `src/app/app-routing.module.ts`
5. Add `AngularFireAuthGuard` if auth required

**New Component in Existing Feature:**
1. Create directory: `src/app/features/{feature}/{component-name}/`
2. Create standalone component (all new components should be standalone)
3. Import into feature module's `imports` array
4. Add route in feature's routing module

**New Standalone Component Pattern:**
```typescript
@Component({
    selector: 'app-my-component',
    templateUrl: './my-component.component.html',
    styleUrls: ['./my-component.component.scss'],
    standalone: true,
    imports: [
        // Import Material modules and other dependencies directly
        MatCardModule, MatButtonModule, NgIf, AsyncPipe
    ]
})
```

**New Service:**
- Place in `src/app/core/services/`
- Use `@Injectable({ providedIn: 'root' })` for singletons

**New Model/Interface:**
- Place in `src/app/core/model/`
- Extend `Base` interface for Firestore documents
- Create factory in `src/app/core/model/factory/` extending `BaseFactory<T>`

**New NGXS State:**
- Actions file: `src/app/core/store/{name}.actions.ts` using namespace pattern
- State file: `src/app/core/store/{name}.state.ts`
- Register via `provideStates([NewState])` in `src/main.ts` or via feature module with `NgxsModule.forFeature()`

**New Pipe or Directive:**
- Pipes: `src/app/shared/pipes/`
- Directives: `src/app/shared/directives/{directive-name}/`
- Export from `SharedModule` in `src/app/shared/shared.module.ts`

**New Cloud Function:**
- Create directory: `functions/src/{function-name}/`
- Export trigger in `functions/src/index.ts`
- Use dynamic import pattern: `await import("./function-name/handler")`
- Follow naming: `{Model}_{Event}_{FunctionName}`

**New Utility Function:**
- Place in `src/app/core/util/`

**New Reusable Dialog:**
- Place in `src/app/shared/{dialog-name}/`
- Make it a standalone component
- Import into `SharedModule` if widely used

## Special Directories

**`sample-data/`:**
- Purpose: Firebase emulator seed data for local development
- Generated: Yes (exported from emulator)
- Committed: Yes
- Usage: `firebase emulators:start --import sample-data`

**`dist/`:**
- Purpose: Angular build output
- Generated: Yes
- Committed: No (in .gitignore)

**`functions/lib/`:**
- Purpose: Compiled Cloud Functions output
- Generated: Yes
- Committed: Partially (appears in repo)

**`server/`:**
- Purpose: SSR research/experimentation
- Generated: No
- Status: Appears unused/experimental

**`.planning/`:**
- Purpose: GSD planning and analysis documents
- Generated: By Claude agents
- Committed: Yes

---

*Structure analysis: 2026-04-15*
