

# Fix: Save Button Stuck -- The Real Root Cause

## What's Actually Happening

The `saveScenario()` function (line 719) makes ~10 sequential database calls. Console logs confirm that **every database call is timing out at 15 seconds**. When any one of those 10 calls inside `saveScenario` hangs and never resolves, the entire `await` on line 719 hangs forever. The button's `finally` block never runs.

"Save and Close" isn't actually faster -- it just hides the problem. After `saveScenario` eventually completes, `setTab("hub")` on line 740 unmounts the builder, so the stuck button disappears from view.

## The Fix: Two Changes

### 1. Parallelize the save operations in `saveScenario()` (supabase-data.ts)

Currently the function runs everything sequentially:
1. Upsert scenario (must go first)
2. Fetch existing chars -> delete removed -> upsert current (sequential)
3. Fetch existing codex -> delete removed -> upsert current (sequential)
4. Fetch existing scenes -> delete removed -> upsert current (sequential)

Steps 2, 3, and 4 are independent of each other. Run them in parallel with `Promise.all`:

```tsx
// Step 1: Upsert scenario (must complete first)
await supabase.from('scenarios').upsert({...});

// Steps 2, 3, 4: Run character/codex/scene sync IN PARALLEL
await Promise.all([
  syncCharacters(id, data, userId),
  syncCodexEntries(id, data),
  syncScenes(id, data),
]);
```

This cuts the number of sequential round-trips from ~10 to ~4 (1 for scenario + 3 parallel chains of ~3 each).

### 2. Add a safety-net timeout on the Save button itself (Index.tsx)

Even with parallelization, if the database connection is genuinely unresponsive, the button should never stay stuck forever. Add a `setTimeout` that force-resets the button state after 12 seconds. This is a last-resort safety net:

```tsx
// Scenario Builder Save button
onClick={async () => {
  setIsSaving(true);
  const safety = setTimeout(() => {
    console.warn('Save button safety timeout - forcing reset');
    setIsSaving(false);
  }, 12000);
  try {
    await handleSave(false);
  } finally {
    clearTimeout(safety);
    setIsSaving(false);
  }
}}
```

Apply the same pattern to all three save buttons (Scenario Save, Save and Close, Character Save).

## Technical Details

### File: `src/services/supabase-data.ts`

Refactor `saveScenario` to parallelize independent operations. Extract three helper functions (`syncCharacters`, `syncCodexEntries`, `syncScenes`) and run them with `Promise.all` after the scenario upsert.

### File: `src/pages/Index.tsx`

Add safety-net `setTimeout(12s)` to all three save button `onClick` handlers:
- Scenario Builder "Save and Close" (line 1486)
- Scenario Builder "Save" (line 1499)
- Character Builder "Save" (line 1614)

## Result

- Save operations run ~3x faster by parallelizing character/codex/scene syncs
- Button is guaranteed to reset within 12 seconds maximum, even in worst-case network conditions
- No toasts added

## Files Modified
| File | Change |
|---|---|
| `src/services/supabase-data.ts` | Parallelize character/codex/scene sync with `Promise.all` |
| `src/pages/Index.tsx` | Add 12s safety-net timeout to all 3 save buttons |

