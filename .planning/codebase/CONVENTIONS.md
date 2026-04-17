# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- Components: `kebab-case.component.ts` (e.g., `song-list.component.ts`, `song-edit-dialog.component.ts`)
- Services: `kebab-case.service.ts` (e.g., `song.service.ts`, `auth.service.ts`)
- Models: `camelCase.ts` or `kebab-case.ts` (mixed: `AccountUser.ts`, `JwtToken.ts`, `song.ts`, `lyric.ts`)
- Factories: `kebab-case.factory.ts` inside `model/factory/` (e.g., `song.factory.ts`, `base.factory.ts`)
- State: `kebab-case.state.ts` and `kebab-case.actions.ts` (e.g., `song.state.ts`, `song.actions.ts`)
- Pipes: `kebab-case.pipe.ts` (e.g., `sec-to-min.pipe.ts`, `local-date.pipe.ts`)
- Directives: `kebab-case.directive.ts` (e.g., `auto-focus.directive.ts`, `swipe.directive.ts`)
- Routing: `feature-routing.module.ts` per feature (e.g., `songs-routing.module.ts`)
- Modules: `feature.module.ts` per feature (e.g., `songs.module.ts`, `lyrics.module.ts`)

**Components:**
- Selector prefix: `app-` with kebab-case (enforced by ESLint): `app-song-list`, `app-confirm-dialog`
- Class names: PascalCase with suffix: `SongListComponent`, `SongEditDialogComponent`

**Services:**
- Class names: PascalCase with `Service` suffix: `SongService`, `AuthenticationService`, `NotificationService`
- All use `providedIn: 'root'` for tree-shakable injection

**Models:**
- Interfaces for data shapes: `Song`, `Setlist`, `Lyric`, `Account`
- All domain models extend `Base` interface from `src/app/core/model/base.ts`
- Factory classes extend `BaseFactory<T>` from `src/app/core/model/factory/base.factory.ts`

**Functions:**
- camelCase for all methods and functions
- Event handlers prefixed with `on`: `onAddSong()`, `onEditSong()`, `onRemoveSong()`
- Getter helpers prefixed with `get`: `getSetlistCount()`, `getSongLength()`
- Private methods: `private` keyword, no underscore prefix

**Variables:**
- camelCase for properties and locals
- Observable properties suffixed with `$`: `songs$`, `loading$`, `selectedAccount$`, `filteredSongs$`
- Boolean properties use adjective/state naming: `showRemove`, `showFind`, `loading`, `saving`, `isNew`

**Types:**
- Interfaces: PascalCase, no `I` prefix: `Song`, `Base`, `Lyric`, `ConfirmDialog`
- Enums: UPPER_CASE values: `CONFIRM_DIALOG_RESULT.OK`, `CONFIRM_DIALOG_RESULT.CANCEL`
- Action namespaces: `SongActions`, `AccountActions` with class-based action pattern

## Component Architecture

**Standalone Components:**
- ALL components use `standalone: true` -- this is the project standard
- Each component imports its own Angular Material modules directly
- Common pattern: long `imports` array in `@Component` decorator listing every Material module used

**Example pattern (use this for new components):**
```typescript
@Component({
    selector: 'app-my-feature',
    templateUrl: './my-feature.component.html',
    styleUrls: ['./my-feature.component.scss'],
    standalone: true,
    imports: [
      MatCardModule,
      MatToolbarModule,
      MatButtonModule,
      MatIconModule,
      FormsModule,
      NgIf,
      NgFor,
      AsyncPipe,
      FlexLayoutModule
    ]
})
export class MyFeatureComponent implements OnInit {
```

**NgModule Usage (legacy, still present):**
- Feature modules exist for routing/lazy-loading: `SongsModule`, `LyricsModule`, `HomeModule`
- `CoreModule` at `src/app/core/core.module.ts` -- singleton services, HTTP interceptors
- `SharedModule` at `src/app/shared/shared.module.ts` -- re-exports common modules/pipes/directives
- No `AppModule` -- app bootstraps via `src/main.ts` with standalone bootstrap

**Routing:**
- Feature routing modules: `*-routing.module.ts` using `RouterModule.forChild(routes)`
- Lazy loading via `loadChildren` in `src/app/app-routing.module.ts`
- Auth guard: `AngularFireAuthGuard` with `redirectUnauthorizedTo(['auth/login'])`
- Custom route reuse strategy: `src/app/core/route-reuse-strategy/custom-route-reuse-strategy.ts`
- Layout wrapper components in routes: `LayoutComponent` or `LayoutNoSidebarComponent`

## Template Syntax

**Mixed control flow -- transitioning from structural directives to new syntax:**
- New `@if`/`@else` blocks used in newer templates: `@if(!showRemove){ ... } @else { ... }`
- Legacy `*ngIf`, `*ngFor` still used extensively in same files
- Both patterns coexist within the same component template (e.g., `song-list.component.html`)

**For new code:** Use the new `@if`, `@for`, `@switch` control flow blocks (Angular 17+ syntax).

**Template patterns:**
- Material table with `mat-table`, `matSort`, `matColumnDef` for list views
- `fxLayout`, `fxFlex`, `fxHide`/`fxShow` from `ngx-flexible-layout` for responsive layout
- PrimeFlex utility classes used alongside: `flex`, `align-items-center`, `w-100`, `py-12`
- Dialogs opened via `MatDialog.open()` with `panelClass: "dialog-responsive"`

## State Management

**NGXS (primary state management):**
- State files: `src/app/core/store/*.state.ts`
- Actions: namespace pattern using TypeScript namespaces in `*.actions.ts`
- State models: interface per state (e.g., `SongStateModel` with `songs`, `selectedSong`, `loading`, `error`)
- Selectors: `@Selector()` decorator on static methods
- Actions: `@Action()` decorator, returns `Observable`
- State updates: `patch()`, `append()`, `updateItem()`, `removeItem()` operators from `@ngxs/store/operators`
- Two patterns for reading state: `store.select()` for observables, `store.selectSnapshot()` for sync values
- Legacy `@Select()` decorator still present in some components (e.g., `setlist-list.component.ts`)

**For new code:** Use `store.select()` and `store.selectSnapshot()`, not `@Select()` decorator.

**Existing states:** `AccountState`, `SongState`, `ArtistState`, `GenreState`

## CSS/Styling Approach

**Mixed CSS and SCSS:**
- Some components use `.scss` (primarily list views, print views, home page)
- Some components use `.css` (primarily dialogs, tool components)
- Global styles: `src/styles.scss`
- Global CSS frameworks: PrimeFlex (`primeflex.min.css`), FirebaseUI CSS

**For new code:** Use `.scss` for component styles.

**Layout:**
- `ngx-flexible-layout` (FlexLayout) directives: `fxLayout`, `fxFlex`, `fxHide`, `fxShow`
- PrimeFlex utility classes for spacing/flex: `flex`, `justify-content-end`, `w-85`, `py-12`
- Material Design components for all UI controls

**Component styling:**
- `styleUrls` (array) or `styleUrl` (singular) both used -- Angular 18 supports both
- Component-scoped styles (ViewEncapsulation default)
- Material column widths often use `!important` overrides on `.mat-column-*` classes

## Import Organization

**Order (observed pattern):**
1. Angular core (`@angular/core`, `@angular/common`, `@angular/forms`)
2. Angular Material modules (`@angular/material/*`)
3. Angular platform (`@angular/platform-browser`)
4. Angular router (`@angular/router`)
5. Third-party libraries (`@ngxs/store`, `rxjs`, `ngx-flexible-layout`)
6. App core imports (`src/app/core/model/*`, `src/app/core/services/*`, `src/app/core/store/*`)
7. App shared imports (`src/app/shared/*`)
8. Relative imports (sibling/child components)

**Path Aliases:**
- Absolute paths from `src/`: `src/app/core/services/song.service` (no `@` alias configured)
- Cross-boundary import: `functions/src/model/setlist` (imports from Firebase Functions project)
- Relative paths for sibling components: `../song-edit-dialog/song-edit-dialog.component`

## Error Handling

**Patterns:**
- `catchError()` in RxJS pipes with `throwError(() => new Error(err))` pattern
- User-facing errors via `alert()` calls (e.g., "Could not add song.") -- simple approach
- `NotificationService.openSnackBar()` for non-critical user notifications
- `GlobalErrorHandler` exists at `src/app/core/services/globar-error.handler.ts` but is COMMENTED OUT in `CoreModule`
- No centralized error logging service active

## Logging

**Framework:** None active (NGXLogger imported but commented out in `CoreModule`)

**Patterns:**
- `console.log()` used in catch blocks for error debugging
- No structured logging in place

## Form Patterns

**Reactive Forms (primary):**
- `FormGroup` with `FormControl` and `Validators` for dialogs
- Form value access via `this.songForm.value` or getter methods: `get name() { return this.songForm.get('name'); }`
- Form initialization in constructor, not `ngOnInit`

## Dialog Pattern

**Standard dialog flow:**
```typescript
const dialogRef = this.dialog.open(MyDialogComponent, {
  data: { accountId: this.accountId, item: row },
  panelClass: "dialog-responsive",
});
dialogRef.afterClosed().subscribe((result) => {
  if (result) { /* handle result */ }
});
```

## Factory Pattern

**Model factories for Firestore document creation:**
- `BaseFactory<T>` provides `getForAdd()` and `getForUpdate()` with timestamps and user tracking
- Domain factories extend base: `SongFactory`, `ArtistFactory`, `GenreFactory`, `SetlistSongFactory`
- All located in `src/app/core/model/factory/`

## Module Design

**Exports:**
- Components, pipes, directives are standalone -- imported directly where needed
- `SharedModule` re-exports common items for convenience
- Feature modules primarily exist for routing configuration

**Barrel Files:**
- No barrel files (`index.ts`) used -- all imports reference specific files

---

*Convention analysis: 2026-04-15*
