
What I found:
- In Lovable Cloud, your newest draft records currently have only the story row; related character/codex/scene rows are missing. So when you click Edit, the builder loads “empty” because there’s nothing to hydrate.
- So the prior UUID migration fix addressed one failure path, but it did not repair already-broken drafts or enforce verified child-data persistence.

Implementation plan:
1. Harden Save Draft flow in `src/pages/Index.tsx`
   - Keep ID migration.
   - Before remote save, always write a local safety snapshot (`draft_${scenarioId}`) containing full `activeData`, cover info, and timestamp.
   - Fix button state text so in-flight shows “Saving…” (not “Draft Saved!” before completion).
   - After save, immediately verify persisted child data; if mismatch, auto-retry once with the same payload.

2. Add save verification helpers in `src/services/supabase-data.ts`
   - Add `fetchScenarioIntegrity(id)` to check child-table counts (characters/codex/scenes).
   - Add `saveScenarioWithVerification(...)` wrapper: run `saveScenario` → verify → retry once if integrity fails → only return success when verified.

3. Make Edit recovery deterministic in `src/pages/Index.tsx` (`handleEditScenario`)
   - Remove unconditional local draft override.
   - Use precedence rules:
     - Prefer richer/newer backend data.
     - If backend draft is empty but local snapshot has character content, restore from local snapshot.
   - Do not delete local snapshot on open; only clear after a verified successful save/finalize.

4. Recover already-empty drafts when possible
   - On opening an empty draft, auto-attempt restore from local snapshot (same browser/session family), then immediately persist via verified save.
   - If no local snapshot exists, keep the draft open as-is and avoid destructive overwrites.

Validation checklist:
- Create/edit characters → Save Draft → go to hub → Edit again → characters still populated.
- Repeat with legacy/non-UUID imported data.
- Confirm existing non-draft edit flow remains unchanged.
