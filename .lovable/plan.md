

# Story Arc: Resistance Scoring, Retry Logic, and Deviated Status

## Scoring System -- Full Breakdown

### Starting Point
Every arc step starts with a `resistanceScore` of **0** (neutral).

### Score Adjustments (once per AI response)
Only ONE classification per AI response (chat bubble), regardless of how much back-and-forth happens within the dialog:

| Classification | Score Change | Example |
|---|---|---|
| ALIGNED | +10 | User cooperates, goes along with the step |
| SOFT_RESISTANCE | -5 | Hesitation, deferral ("let's talk later", "I'm not sure") |
| HARD_RESISTANCE | -10 | Active refusal, blocking, contradictory action |

### Trigger Thresholds (by flexibility)

| Flexibility | Threshold | What it takes to trigger | Status triggered |
|---|---|---|---|
| **Rigid** | -50 | 5 hard resistances (or 10 soft) with no cooperation in between | `deviated` |
| **Normal** | -30 | 3 hard resistances (or 6 soft) with no cooperation | `failed` |
| **Flexible** | -20 | 2 hard resistances (or 4 soft) with no cooperation | `failed` |

### Score Recovery
Cooperation (+10 ALIGNED) heals the score. This means if a user resists twice (-20) then cooperates once (+10), the score is -10 -- nowhere near triggering. The system only triggers when there is sustained, consistent pushback.

### Score Bounds
- Score is capped between **-50** and **+20** (no runaway accumulation in either direction)
- Once a step triggers (fails/deviates), the score freezes on that step

---

## Retry Limits (by flexibility)

When a recovery step succeeds, the failed/deviated progression step is cloned as a new pending retry. Retry limits vary by flexibility:

| Flexibility | Max Retries | After max reached |
|---|---|---|
| **Rigid** | Unlimited | AI keeps retrying indefinitely with escalation |
| **Normal** | 4 | Step marked as permanently failed. AI stops actively pushing it but does NOT avoid it if the user brings it up later |
| **Flexible** | 2 | Step marked as permanently failed. Same behavior -- AI stops pushing but remains open |

### Daily Clone Limit
Regardless of flexibility, only ONE clone per step per in-story day to prevent rapid loops.

### Tracking Retry Count
Each cloned step tracks `retryOf` (original step ID) and `retryCount` (incremented from the previous attempt). When `retryCount` reaches the max for that flexibility level, no further clones are created and the step gets a `permanentlyFailed` flag.

---

## Technical Implementation

### Phase 1: Type Updates (`src/types.ts`)

Add `'deviated'` to `StepStatus`:
```
'pending' | 'failed' | 'succeeded' | 'deviated'
```

Add fields to `ArcStep`:
- `retryOf?: string` -- ID of original step this retries
- `retryCount?: number` -- Which attempt this is (1, 2, 3...)
- `failedOnDay?: number` -- In-story day when failed/deviated
- `permanentlyFailed?: boolean` -- True when max retries exhausted
- `resistanceScore?: number` -- Cumulative score, starts at 0
- `resistanceEvents?: Array<{ day: number; classification: 'aligned' | 'soft_resistance' | 'hard_resistance'; summary: string }>`

### Phase 2: UI Changes (`src/components/chronicle/arc/ArcBranchLane.tsx`)

- For rigid success paths: replace the hidden "Failed" button with an orange **"DEVIATED"** button using `ArrowUpRight` icon
- Add `deviated` border color: `border-orange-500/50`
- Steps with `retryOf` show a small "Retry #N" badge
- Steps with `permanentlyFailed` show a "Max retries reached" indicator

### Phase 3: Clone-on-Recovery Logic (`StoryGoalsSection.tsx` + `ArcPhaseCard.tsx`)

Update `toggleStatus` so when a recovery step is marked "succeeded":
1. Find the most recently failed/deviated success step
2. Check daily clone limit (`failedOnDay !== currentDay`)
3. Check retry limit based on flexibility (rigid=unlimited, normal=4, flexible=2)
4. If both checks pass: clone the step with incremented `retryCount`
5. If retry limit reached: mark as `permanentlyFailed`, no clone

Update `computeActiveFlow` to treat `deviated` the same as `failed` for cross-branch flow.

Update `calculateArcProgress` to exclude failed steps that have a pending retry clone.

### Phase 4: LLM Serialization (`src/services/llm.ts`)

Update `serializeBranch` to include:
- Retry lineage: `[RETRY #2 of Step 2] Step 4: Convince her to stay (pending)`
- Deviated markers: `[DEVIATED] Step 2: ... -> ESCALATION: Recovery steps define escalation tactics`
- Permanently failed markers: `[PERMANENTLY FAILED - Max retries reached] Step 2: ...`
- For permanently failed steps, add directive: `This step is no longer actively pursued. Do not push it unless the user initiates.`
- Resistance history when present

### Phase 5: Backend (`supabase/functions/evaluate-arc-progress/index.ts`)

New edge function that:
- Receives: latest user message, latest AI response, current arc state (pending steps only)
- Uses Grok (xAI API, consistent with chat function) to classify the user's response
- Returns ONE classification per step per call (enforced by prompt design)
- Returns: `{ stepUpdates: [{ stepId, classification, summary, newScore, suggestedStatusChange }] }`
- The function itself calculates the new cumulative score and checks thresholds based on the flexibility level passed in

### Phase 6: Frontend Integration (`src/services/llm.ts` or chat handler)

After each AI response:
1. Call `evaluate-arc-progress` with the latest exchange + arc state
2. Apply score adjustments to each step
3. If threshold crossed, auto-apply `failed` or `deviated` status
4. If auto-triggering a status change, run clone-on-recovery check

---

## Files Summary

| File | Action | Description |
|---|---|---|
| `src/types.ts` | Modify | Add `deviated` to StepStatus; add retry/resistance fields to ArcStep |
| `src/components/chronicle/arc/ArcBranchLane.tsx` | Modify | Deviated button for rigid, retry badges, permanently failed indicator |
| `src/components/chronicle/StoryGoalsSection.tsx` | Modify | Clone-on-recovery with retry limits, progress calc update, computeActiveFlow for deviated |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Modify | Same clone/deviated logic for phases |
| `src/services/llm.ts` | Modify | Arc serialization with retry context, deviated/permanently failed directives |
| `supabase/functions/evaluate-arc-progress/index.ts` | Create | Resistance classification edge function using xAI |

