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
