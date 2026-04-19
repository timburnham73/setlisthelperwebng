# Claude Project Notes

## Change Logging (ALWAYS FOLLOW — NEVER SKIP)
Every code change MUST include doc updates in `/Users/timburnham/src/bandcentral-pm/`:
1. **`backlog/TODO.md`** — Add `[x]` completed item as changelog entry
2. **`bandcentralios/requirements.md`** — Update the relevant section to reflect the change (iOS requirements is the reference for all platforms)
3. Add planned `[ ]` TODO items for other platforms if the feature applies cross-platform

## Central Docs
All requirements, feature specs, and project management docs are in **bandcentraldocs** (GitHub: timburnham73/bandcentraldocs), located at `/Users/timburnham/src/bandcentral-pm/`.

- Check `backlog/TODO.md` for planned and completed features
- Check `bandcentralios/requirements.md` for the full feature inventory (iOS is the reference implementation)
- Feature parity across all platforms is the default goal

## Project-Specific Notes
- Web app (Angular) — serves as bandcentral.com
- Handles legacy data import from setlisthelper.com
- See `setlisthelperwebng/todo.md` in central docs for web-specific task tracking

## Revenue / User Analytics — Accounts to ALWAYS Exclude
When calculating revenue, paid-user counts, or any business metric from the user/account data, NEVER include these accounts — they are Tim's own test/dev accounts:

- **timburnham73@gmail.com** — Tim's primary dev account (also the systemAdmin)
- **bimturnham@gmail.com** — "Bim Turn" — Tim's secondary test account

These accounts may appear with paid entitlements (granted for testing) but do not represent real revenue. Filter them out of any revenue calculation, purchased-user count, or growth metric before reporting numbers.

Pricing reference (for revenue math, from `src/app/features/home/pricings/pricings.component.html`):
- free: $0
- solo / solo-free-trial: $14.99/yr
- band-small / band-small-free-trial: $29.99/yr
- band-medium / band-medium-free-trial: $59.99/yr
- band-large / band-large-free-trial: $79.99/yr
- band-extra-large / band-extra-large-free-trial: $99.99/yr

Free-trial tiers generate $0 actual revenue until the trial converts to paid.
