# Deferred Items — Phase 01 SSR/SEO

Issues encountered but not owned by any phase-01 plan. Tracked here for future work.

## Pre-existing spec-file TS compile errors (discovered Plan 01-02)

When `ng test` was run for Plan 01-02 (to exercise the new `SeoService` unit tests),
the Karma build failed because four unrelated pre-existing spec files had TypeScript
type errors that blocked the whole test-suite compile. Per Rule 3 (blocking issue
prevents current task) these were patched with minimal type-safe edits so the new
tests could run. The underlying pipe implementations themselves are unchanged.

Files patched (minimal):
- `src/app/shared/pipes/limit-to.pipe.spec.ts` — `transform(undefined, ...)` args
- `src/app/shared/pipes/local-date.pipe.spec.ts` — `transform(null, ...)` / `transform(date, null)` args
- `src/app/shared/pipes/safe-html.pipe.spec.ts` — import name mismatch

Root cause: `SafeHtmlPipe` class is actually exported as `SafeHtml`, and the Limit/LocalDate
pipe signatures were tightened but the specs still pass loose arg types. Recommendation
for a future cleanup plan:
- Rename `SafeHtml` class to `SafeHtmlPipe` for consistency, update all imports
- Widen the pipe `transform()` signatures to accept `null | undefined` (or mark the
  args optional) so spec assertions don't need `as unknown as` casts
