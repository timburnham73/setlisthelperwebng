# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Runner:**
- Karma 6.3 with Jasmine 4.0
- Config: `karma.conf.js`

**Assertion Library:**
- Jasmine (built-in `expect()`)

**Run Commands:**
```bash
ng test                # Run all tests (launches Chrome)
npm test               # Same as ng test
```

## Test File Organization

**Location:**
- Co-located with source files (spec file next to implementation file)

**Naming:**
- `*.component.spec.ts` for components
- `*.service.spec.ts` for services
- `*.pipe.spec.ts` for pipes
- `*.directive.spec.ts` for directives
- One anomaly: `song.service.service.spec.ts` (double `.service` in name) at `src/app/core/services/song.service.service.spec.ts`

**Structure:**
```
src/app/features/songs/song-edit-dialog/
  song-edit-dialog.component.ts
  song-edit-dialog.component.html
  song-edit-dialog.component.css
  song-edit-dialog.component.spec.ts
```

## Test Structure

**All tests follow Angular CLI scaffold pattern -- minimal "should create" tests only:**

**Component test pattern:**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SongEditDialogComponent } from './song-edit-dialog.component';

describe('SongEditDialogComponent', () => {
  let component: SongEditDialogComponent;
  let fixture: ComponentFixture<SongEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongEditDialogComponent]   // standalone component
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Service test pattern:**
```typescript
import { TestBed } from '@angular/core/testing';
import { SongService } from './song.service';

describe('SongServiceService', () => {
  let service: SongService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SongService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

**Pipe test pattern:**
```typescript
import { SecToMinPipe } from './sec-to-min.pipe';

describe('SecToMinPipe', () => {
  it('create an instance', () => {
    const pipe = new SecToMinPipe();
    expect(pipe).toBeTruthy();
  });
});
```

## Mocking

**Framework:** None configured

**Patterns:**
- No mocking observed in any test file
- No mock services or providers configured in `TestBed`
- Tests will fail at runtime because components/services have Firebase dependencies that are not provided
- One mock file exists: `src/app/shared/mocks/spinner-consumer.ts` (utility, not test mock)

**What SHOULD be mocked (for tests to pass):**
- `AngularFirestore` -- all services depend on Firestore
- `AngularFireAuth` -- `AuthenticationService` depends on Firebase Auth
- `Store` (NGXS) -- components dispatch actions and select state
- `MatDialog` -- many components open dialogs
- `ActivatedRoute` -- components read route params

## Fixtures and Factories

**Test Data:**
- `src/app/core/model/sampleSongs.ts` -- `SAMPLE_SONGS` constant used in production code (not test-only)
- No test-specific fixtures, factories, or builders exist

**Location:**
- No dedicated test fixture directory

## Coverage

**Requirements:** None enforced

**Coverage reporter configured in karma.conf.js:**
```javascript
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/angular-material-template'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' }
  ]
}
```

**View Coverage:**
```bash
ng test --code-coverage      # Generates coverage report
# Output: ./coverage/angular-material-template/
```

## Test Types

**Unit Tests:**
- All 41 spec files are scaffold-only "should create" / "should be created" tests
- Zero behavioral assertions across the entire test suite
- No test validates any business logic, data transformation, or user interaction

**Integration Tests:**
- None

**E2E Tests:**
- Not configured (no Cypress, Playwright, or Protractor setup)

## Test Coverage Summary

### Components: 27 of 56 have spec files (48%)

**Components WITH spec files:**
- `src/app/features/lyrics/lyrics-print/lyrics-print.component.spec.ts`
- `src/app/features/lyrics/lyrics-print/lyrics-print-show-dialog/lyrics-print-show-dialog.component.spec.ts`
- `src/app/features/lyrics/lyric-add-dialog/lyric-add-dialog.component.spec.ts`
- `src/app/features/lyrics/lyrics-edit/lyrics-edit.component.spec.ts`
- `src/app/features/lyrics/lyrics-view/lyrics.component.spec.ts`
- `src/app/features/lyrics/lyric-view-wrapper/lyric-view-wrapper.component.spec.ts`
- `src/app/features/lyrics/lyrics-format-dialog/lyrics-format-dialog.component.spec.ts`
- `src/app/features/songs/song-edit-dialog/song-edit-dialog.component.spec.ts`
- `src/app/features/songs/song-import/song-import.component.spec.ts`
- `src/app/features/home/home/home.component.spec.ts`
- `src/app/features/about/about-page/about-page.component.spec.ts`
- `src/app/features/tags/tag-edit-dialog/tag-edit-dialog.component.spec.ts`
- `src/app/features/tags/tag-songs/tag-songs.component.spec.ts`
- `src/app/features/tags/tag-list/tag-list.component.spec.ts`
- `src/app/features/accounts/account-users/account-users.component.spec.ts`
- `src/app/features/accounts/edit-account-dialog/edit-account-dialog.component.spec.ts`
- `src/app/features/accounts/login-legacy-setlist-helper/login-legacy-setlist-helper.component.spec.ts`
- `src/app/features/setlists/setlist-songs-list/setlist-songs-list.component.spec.ts`
- `src/app/features/setlists/song-selector/song-selector.component.spec.ts`
- `src/app/features/setlists/setlist-edit-dialog/setlist-edit-dialog.component.spec.ts`
- `src/app/features/setlists/setlist-print/setlist-print-show-dialog/setlist-print-show-dialog.component.spec.ts`
- `src/app/features/setlists/setlist-print/setlist-print.component.spec.ts`
- `src/app/features/setlists/setlist-list/setlist-list.component.spec.ts`
- `src/app/features/import/account-import-events/account-import-events.component.spec.ts`
- `src/app/shared/layout-no-sidebar/layout-no-sidebar.component.spec.ts`
- `src/app/shared/layout-no-sidebar-child-view/layout-no-sidebar-child-view.component.spec.ts`
- `src/app/shared/icons/expand-icon/expand-icon.component.spec.ts`

**Components WITHOUT spec files (29):**
- `src/app/app.component.ts`
- `src/app/features/songs/song-list/song-list.component.ts`
- `src/app/features/lyrics/lyric-versions-dialog/lyric-versions-dialog.component.ts`
- `src/app/features/home/footer/footer.component.ts`
- `src/app/features/home/intro-one/intro-one.component.ts`
- `src/app/features/home/pricings/pricings.component.ts`
- `src/app/features/home/header/header.component.ts`
- `src/app/features/contact/contact.component.ts`
- `src/app/features/tools/transpose/transpose.component.ts`
- `src/app/features/tools/tools-landing/tools-landing.component.ts`
- `src/app/features/tools/tap-tempo/tap-tempo.component.ts`
- `src/app/features/tools/metronome/metronome.component.ts`
- `src/app/features/auth/login/login.component.ts`
- `src/app/features/privacy-policy/privacy-policy.component.ts`
- `src/app/features/admin/admin-dashboard/admin-dashboard.component.ts`
- `src/app/features/blog/blog-post/blog-post.component.ts`
- `src/app/features/blog/blog-landing/blog-landing.component.ts`
- `src/app/features/accounts/account-home/account-home.component.ts`
- `src/app/features/users/user-list/user-list.component.ts`
- `src/app/features/why-band-central/why-band-central.component.ts`
- `src/app/features/help/help-page/help-page.component.ts`
- `src/app/features/help/help-migration/help-migration.component.ts`
- `src/app/features/help/help-section/help-section.component.ts`
- `src/app/features/help/help-landing/help-landing.component.ts`
- `src/app/shared/export-dialog/export-dialog.component.ts`
- `src/app/shared/layout/layout.component.ts`
- `src/app/shared/confirm-dialog/confirm-dialog.component.ts`
- `src/app/shared/content-placeholder-animation/content-placeholder-animation.component.ts`
- `src/app/custom-material/select-check-all/select-check-all.component.ts`

### Services: 9 of 14 have spec files (64%)

**Services WITH spec files:**
- `src/app/core/services/setlist-songs.service.spec.ts`
- `src/app/core/services/account.service.spec.ts`
- `src/app/core/services/song.service.service.spec.ts`
- `src/app/core/services/tag.service.spec.ts`
- `src/app/core/services/user.service.spec.ts`
- `src/app/core/services/setlist.service.spec.ts`
- `src/app/core/services/account-import.service.spec.ts`
- `src/app/core/services/spinner.service.spec.ts`
- `src/app/core/services/lyrics.service.spec.ts`

**Services WITHOUT spec files:**
- `src/app/core/services/auth.service.ts`
- `src/app/core/services/notification.service.ts`
- `src/app/core/services/artist.service.ts`
- `src/app/core/services/genre.service.ts`
- `src/app/features/tools/metronome/metronome-audio.service.ts`

### Other spec files:
- Pipes: 5 spec files (`safe-html`, `yes-no`, `sec-to-min`, `local-date`, `limit-to`)
- Directives: 1 spec file (`auto-focus.directive.spec.ts`)
- Store states: 0 spec files (no tests for `SongState`, `AccountState`, `ArtistState`, `GenreState`)

## Critical Assessment

**Tests are non-functional.** Every spec file contains only the Angular CLI scaffold with a single "should create" or "should be created" assertion. These tests:

1. **Will not pass** without proper test module configuration (Firebase providers, NGXS store, Material dialog, etc. are missing from `TestBed`)
2. **Test zero business logic** -- no assertions on component behavior, service methods, state transitions, or data transformations
3. **Have no mocks** -- Firebase, NGXS, routing dependencies are not provided

**No tested areas exist.** The test suite provides no regression safety net.

**NGXS store has zero test coverage** -- `src/app/core/store/` contains the most critical business logic (state mutations, side effects) with no tests.

**Utility functions are untested** -- `src/app/core/util/song.util.ts`, `src/app/core/util/date-util.ts`, `src/app/core/util/db-utils.ts` have no spec files and would be the easiest to test (pure functions).

---

*Testing analysis: 2026-04-15*
