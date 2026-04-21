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
- **tim@bandcentral.com** — Tim's bandcentral.com email account
- **bimturnham@gmail.com** — "Bim Turn" — Tim's secondary test account
- **bysydsdesign@gmail.com** — Sydney Osten (family/team account, not real revenue)
- **sydney@bandcentral.com** — Sydney Osten (bandcentral.com account, not real revenue)
- **sydburnhammusic@gmail.com** — Sydney Burnham (family account, not real revenue)

These accounts may appear with paid entitlements (granted for testing) but do not represent real revenue. Filter them out of any revenue calculation, purchased-user count, or growth metric before reporting numbers.

Pricing reference (for revenue math, from `src/app/features/home/pricings/pricings.component.html`):
- free: $0
- solo / solo-free-trial: $14.99/yr
- band-small / band-small-free-trial: $29.99/yr
- band-medium / band-medium-free-trial: $59.99/yr
- band-large / band-large-free-trial: $79.99/yr
- band-extra-large / band-extra-large-free-trial: $99.99/yr

Free-trial tiers generate $0 actual revenue until the trial converts to paid.

## Support Knowledge Base

Canned reference answers for recurring support topics live at `/Users/timburnham/src/bandcentral-pm/support/knowledge-base.md`. **Consult it before drafting any support reply.** It currently covers: subscription complaints, multi-user / multi-band subscriptions, migration from SLH, and known platform bug triage shortcuts. Add new sections when a pattern emerges (same question from 2+ users) — don't rewrite canned answers from scratch each time.

## Support Email Workflow (support@bandcentral.com via `gmail-support` MCP)

When handling any email from the support@bandcentral.com mailbox, ALWAYS follow this two-step flow. Never send a reply without explicit approval.

**Step 1 — Summarize the incoming email, then draft the reply.**

For each email being handled, output exactly this structure:

```
### Email: <subject>
**From:** <sender name and email>
**Received:** <date/time>
**User tier:** <entitlement from Firestore if known, or "unknown">

**Summary:** 2-4 sentence plain-language summary of what the user is asking or reporting. Include any reproduction steps, error messages, or specific details that matter for the reply. Call out anything time-sensitive.

---

**Draft reply:**

<full proposed reply, ready to send as-is>
```

**Step 2 — Wait for user input.** Valid responses:
- "send" / "send it" / "looks good, send" → send the reply via `mcp__gmail-support__send_email` (or `reply_all` if appropriate), THEN immediately mark the original email as read and archive it (remove `INBOX` and `UNREAD` labels via `mcp__gmail-support__modify_email`)
- any correction / edit / "change X to Y" → revise the draft, re-display the summary + new draft, wait again
- "skip" / "next" → do not send, move to the next email (do NOT archive — leave it unread)
- "archive" / "handled elsewhere" → mark as read and archive (remove `INBOX` and `UNREAD` labels), no send
- "label as X" → apply the label, do not send, do not archive

**NEVER auto-send.** Even if a reply seems obviously correct, always stop at Step 1 and wait for explicit approval.

**After every send:** mark the original as read and archive it in the same turn. Do not wait for the user to ask. This keeps the support inbox clean and makes "how many unread?" an accurate signal of what still needs attention.

**Style of drafted replies:**
- Match the tone of Tim's previous replies — warm, direct, specific, not corporate
- Sign off as "Tim" (not "the Band Central team")
- If the issue requires a code fix, say so honestly — don't promise fast timelines unless certain
- If the issue has a known workaround, include it
- Reply-all only when CC'd parties are relevant; otherwise plain reply
