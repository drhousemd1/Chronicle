

## Plan: Fix time progression mode persistence

### Root Cause
`updateConversationMeta` in `supabase-data.ts` only persists `currentDay`, `currentTimeOfDay`, and `title`. It ignores `timeProgressionMode` and `timeProgressionInterval`. 

When `handleTimeProgressionChange` calls `onSaveScenario`, the save path at line 2187 in `Index.tsx` calls `updateConversationMeta` with only day/time/title — the mode and interval fields are silently dropped.

### Fix (two small changes)

**1. Expand `updateConversationMeta` patch type and mapping** (`src/services/supabase-data.ts`, lines 934-946)

Add `timeProgressionMode` and `timeProgressionInterval` to the accepted patch fields and map them to their DB columns.

**2. Include mode/interval in the `onSaveScenario` handler** (`src/pages/Index.tsx`, line 2187-2191)

Pass `timeProgressionMode` and `timeProgressionInterval` from `modifiedConv` into the `updateConversationMeta` call.

**3. Documentation** — update known issues in `chat-interface-page-structure-guide.md`.

