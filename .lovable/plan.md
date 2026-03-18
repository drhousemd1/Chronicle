

# Fix Quality Hub: Add Timestamps, Persist to Database

## Context
The code already has all 12 app pages in `reviewUnits` — the screenshot only shows 5 because the right panel requires scrolling. The real issues are: (1) no timestamp shown next to completed badges on scan modules, and (2) all data is in localStorage only, which gets lost on browser clear.

## Changes

### 1. Add timestamps to scan module completed badges
In `src/pages/style-guide/ui-audit.tsx`, line 266 — the scan modules rendering. When a module has `status === "completed"` and a `lastRunId`, look up the matching run from `registry.runs` and display the run's `finishedAt` timestamp below the status badge (formatted as a short date like "Mar 18, 2026").

### 2. Persist Quality Hub registry to database instead of localStorage

**Database migration:** Create a `quality_hub_registries` table:
```sql
CREATE TABLE public.quality_hub_registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registry JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.quality_hub_registries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own registry" ON public.quality_hub_registries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Code changes in `src/pages/style-guide/ui-audit.tsx`:**
- On mount: fetch from `quality_hub_registries` for the current user. If found and its `lastRunId` matches the code-defined one, use it. Otherwise fall back to `cloneInitialRegistry()`.
- On registry change (debounced ~1s): upsert to the database instead of localStorage.
- Keep localStorage as a fast cache layer, but database is the source of truth.
- If user is not authenticated, fall back to localStorage-only mode (current behavior).

### 3. No missing pages
All 12 app pages are already in the code. The panel just needs scrolling to see them all — no changes needed here.

