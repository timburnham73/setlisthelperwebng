# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- TypeScript ~5.5.3 - All frontend and Cloud Functions code
- SCSS - Component styles (configured in `angular.json` schematics)

**Secondary:**
- HTML - Angular templates
- CSS - Global styles, PrimeFlex utility classes

## Runtime

**Environment:**
- Node.js 20.x (local dev); Node.js 22 (Cloud Functions, per `functions/package.json` engines)
- Browser (Angular SPA)

**Package Manager:**
- yarn (primary; `yarn.lock` present)
- npm (also present; `package-lock.json` exists alongside `yarn.lock`)
- Both lockfiles exist -- prefer yarn for consistency

## Frameworks

**Core:**
- Angular ^18.1.1 - SPA framework (`@angular/core`)
- Angular Material ^18.1.1 - UI component library (`@angular/material`, `@angular/cdk`)
- NGXS ^18.0.0 - State management (`@ngxs/store`, `@ngxs/storage-plugin`)
- RxJS ~7.8.1 - Reactive programming

**Testing:**
- Jasmine ~4.0.0 - Test framework (`jasmine-core`)
- Karma ~6.3.0 - Test runner (`karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`)
- Config: `karma.conf.js`, `tsconfig.spec.json`

**Build/Dev:**
- Angular CLI ^18.1.1 (`@angular/cli`)
- `@angular-devkit/build-angular` ^18.1.1 - Build system (application builder)
- Firebase CLI ^13.0.0 (`firebase-tools`)
- ESLint ^8.23.1 with `@angular-eslint` ^18.1.0 and `@typescript-eslint` ^7.16.1

## Key Dependencies

**Critical:**
- `@angular/fire` ^18.0.1 - Firebase SDK bindings for Angular (uses **compat** API throughout)
- `firebase` ^10.5.2 - Firebase JS SDK
- `firebaseui` ^6.1.0 - Pre-built auth UI (CSS loaded globally in `angular.json`)
- `chordsheetjs` ^9.0.3 - ChordPro chord parsing (`src/app/core/services/ChordProParser.ts`)
- `@ngxs/store` ^18.0.0 - Primary state management (accounts, songs, artists, genres)

**Infrastructure:**
- `firebase-admin` ^12.5.0 (frontend `package.json`; ^11.8.0 in `functions/package.json`)
- `firebase-functions` ^7.0.6 - Cloud Functions v2 triggers
- `nodemailer` ^6.9.0 - Email sending in Cloud Functions
- `jwt-decode` ^3.1.2 - JWT token decoding for legacy SLH auth
- `moment` ^2.29.4 - Date handling (with `@angular/material-moment-adapter` ^18.1.1)

**UI/Layout:**
- `primeflex` ^3.3.1 - CSS utility/grid framework (loaded globally)
- `ngx-flexible-layout` ^18.0.1 - Flex layout directives
- `ngx-mat-timepicker` ^18.0.0 - Time picker component
- `perfect-scrollbar` ^1.5.5 - Custom scrollbar

**Utilities:**
- `lodash` ^4.17.21 / `lodash-es` ^4.17.21 - General utilities
- `ngx-logger` ^5.0.7 - Logging framework (configured per environment in `src/environments/`)
- `tslib` ^2.3.0 - TypeScript runtime helpers
- `zone.js` ~0.14.3 - Angular change detection

## Configuration

**Environment:**
- `src/environments/environment.ts` - Development config (useEmulators flag, log level TRACE)
- `src/environments/environment.prod.ts` - Production config (log level OFF)
- File replacement configured in `angular.json` build configurations
- Firebase project: `setlisthelperfirebase`
- Auth domain: `www.bandcentral.com`

**Build:**
- `angular.json` - Angular CLI workspace config (project name: `angular-material-template`)
- `tsconfig.json` - Base TypeScript config (target: ES2022, strict mode, strict Angular templates)
- `tsconfig.app.json` - App-specific TS config
- `tsconfig.spec.json` - Test-specific TS config
- `.eslintrc*` - Linting rules (via `@angular-eslint`)

**Build Output:**
- Output path: `dist/` (with browser files at root of `dist/`)
- Production budgets: 4MB warning / 5MB error for initial bundle
- Component style budget: 4KB warning / 8KB error

**Firebase:**
- `firebase.json` - Hosting, Firestore, Storage, Functions, emulator config
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `storage.rules` - Firebase Storage security rules

## Scripts

```bash
yarn start              # ng serve (dev server)
yarn startem            # Firebase emulators with sample data
yarn build              # ng build (production by default)
yarn build-production   # Explicit production build
yarn build-debug        # Development build
yarn deploy-production  # Build + deploy hosting to Firebase
yarn test               # ng test (Karma)
yarn lint               # ng lint (ESLint)
```

## Platform Requirements

**Development:**
- Node.js 20.x+
- yarn or npm
- Firebase CLI (`firebase-tools`)
- Firebase emulators for local dev (Auth:9099, Functions:5001, Firestore:8080, Hosting:4999, Storage:9199)

**Production:**
- Firebase Hosting (SPA with client-side routing via rewrites)
- Firebase Cloud Functions (Node.js 22 runtime)
- Domain: www.bandcentral.com

---

*Stack analysis: 2026-04-15*
