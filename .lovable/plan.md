
# Your Stories Tile Border Update

## What's changing

Add the slate blue border (`border-[#4a5f7f]`) to story tile cards on the Your Stories page, replacing the current subtle ring (`ring-1 ring-slate-900/5`).

## Technical Details

**File:** `src/components/chronicle/ScenarioHub.tsx`, line 35

**Current:**
```
ring-1 ring-slate-900/5
```

**New:**
```
border border-[#4a5f7f]
```

Single class swap on one line. No other pages touched.
