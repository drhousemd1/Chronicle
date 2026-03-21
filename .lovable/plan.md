
Audit result:

- No — the current “Connected” badges are not true live connection checks.
- In `src/components/chronicle/ModelSettingsTab.tsx`, both model rows reuse the same `statusBadge`.
- That badge is driven only by `checkSharedKeyStatus()`.
- In `src/services/app-settings.ts`, `checkSharedKeyStatus()` just invokes `check-shared-keys`.
- In `supabase/functions/check-shared-keys/index.ts`, the function only checks:
  1. whether `shared_keys.xai` is enabled in `app_settings`
  2. whether `XAI_API_KEY` exists in env via `!!Deno.env.get("XAI_API_KEY")`
- It does not verify the actual provider is reachable.
- The “Verify Connection” button only reruns that same env/settings check.
- So “Connected” currently means “key exists,” not “provider/server is actually working.”

Also confirmed from the page code + your screenshot:

- The top-right “Narrative Core” block is useless and visually broken.
- It is using `<Card className="... bg-slate-900 text-white ...">`, but `Card` itself hardcodes `bg-white`, which is why it can render as a washed-out white box with barely visible content.
- The “About Grok” block is just static marketing copy + external link, with no admin function.

Plan:

1. Make the status truthful
- Remove the fake per-model “Connected” badges from the Text Model and Image Model rows.
- Replace them with a dedicated backend status section that separates:
  - API key configured
  - key shared with users
  - live provider health check passed/failed

2. Add a real backend health check
- Update the current status check flow so it performs a real server-side authenticated probe to the provider using `XAI_API_KEY`.
- Return structured fields so the UI can distinguish config state from actual connectivity.
- Keep the check read-only and lightweight.

3. Simplify the Model Settings page
- Keep this page as a static admin info page:
  - Active text model: `grok-4-1-fast-reasoning`
  - Active image model: `grok-imagine-image`
  - share-key toggle
  - truthful backend status
- Remove the two useless sidebar cards entirely.
- Rework layout so it reads like a clean status/configuration page, not a half-interactive dashboard.

4. Fix stale/misleading copy
- Update labels so nothing implies model switching or user selection.
- Update the admin tool description in `src/pages/Admin.tsx` so it no longer says “Select Grok model”.
- Rename “Verify Connection” to something accurate like “Run Health Check” only if it actually performs the live probe.

Technical details:
- Files to update:
  - `src/components/chronicle/ModelSettingsTab.tsx`
  - `src/services/app-settings.ts`
  - `supabase/functions/check-shared-keys/index.ts` (or split into a dedicated live-check function)
  - `src/pages/Admin.tsx`
- Specific removals:
  - shared `statusBadge` on model rows
  - `Narrative Core` card
  - `About Grok` card

Expected result:
- No meaningless “Connected” badges
- No broken white placeholder-style card
- No dead marketing content
- A page that clearly shows what the app uses and whether the backend is merely configured versus actually reachable
