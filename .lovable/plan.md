

# Rebuild Story Arcs Style Guide Card — Full Fidelity From Source Data

## Problem
The current Card 3 preview is a rough approximation. The Guidance Strength slider is rendered as a pill-button bar (completely wrong). Several elements are simplified or missing. The original component source code was deleted without being archived. However, we have enough source data to reconstruct it accurately.

## Available Source Data
1. **`GuidanceStrengthSlider.tsx`** — still in codebase, exact code
2. **`CharacterGoalsSection.tsx`** — sibling component, same shell/header/inner card pattern
3. **Transfer pack type definitions** — exact `ArcStep`, `ArcBranch`, `ArcPhase`, `StoryGoal` field signatures
4. **Transfer pack style guide metadata** — exact colors, border radii, shadows for branch lanes, step cards, phase containers
5. **Transfer pack `evaluateArcProgress`** — exact resistance scoring logic, thresholds, clone-on-recovery rules
6. **`ArcPhaseCard` preview JSX** from transfer pack (lines 17128-17142) — exact mini preview code
7. **`ArcBranchLane` preview JSX** from transfer pack (lines 17155-17165) — exact mini preview code

## What's Wrong in Current Card 3 Preview (lines 1013-1131)

| Element | Current (Wrong) | Correct (From Source) |
|---------|----------------|----------------------|
| **Guidance Strength** | 3 pill buttons in a row inside `bg-[#3c3e47]` container | 12px track (`rgba(21,25,34,0.95)`), blue gradient fill, 24px white thumb circle, 3 labels below, description box (`bg-zinc-900 rounded-xl p-4` with inset shadow) |
| **Mode Toggle position** | After guidance strength | Should be ABOVE the branches, separate from guidance strength |
| **Goal Name field** | Correct | Correct |
| **Desired Outcome** | Correct | Correct |
| **Branch lanes** | Approximately correct but missing resistance trigger label styling | Need exact header padding, step card structure |
| **Step status badges** | Text-only labels | Should show specific status colors matching source |
| **Phase 2 preview** | Oversimplified — just two colored boxes | Should match Phase 1 structure (with its own title, progress ring, desired outcome, branches) |
| **Add Phase button** | Present but no "Add Step" buttons in branches | Each branch lane should have an "Add Step" button |
| **Delete button on goal** | Present | Correct |
| **Progress ring** | Present | Correct |

## Plan — Single File Change

**File: `public/style-guide-component-example.html`** — Replace lines 1013-1131

### 1. Guidance Strength Slider (replace lines 1013-1021)
Build exact static replica from `GuidanceStrengthSlider.tsx`:
- Label: `text-[10px] font-black text-zinc-400` → "Guidance Strength"
- Subtitle: `text-sm text-zinc-400` → "How strongly the AI should steer toward this goal."
- Track: `height: 12px; border-radius: 999px; background: rgba(21,25,34,0.95)`
- Fill bar at 50%: `linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)`
- Thumb at 50%: `width: 24px; height: 24px; border-radius: 50%; background: white; border: 3px solid #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.3)`
- Three labels below with `justify-content: space-between`: Rigid (`color: #71717a`), Normal (`color: #3b82f6`), Flexible (`color: #71717a`)
- Description box: `background: #18181b; border-radius: 12px; padding: 16px; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)` containing the "Normal" description text in `text-sm text-zinc-400`

### 2. Mode Toggle (keep lines 1023-1027 as-is, they're correct)

### 3. Branch Lane Step Cards — Add "Add Step" Buttons
After each branch's step list, add an "Add Step" button using the standard `.add-row-btn` class pattern (same as "Add Phase")

### 4. Phase 2 Preview — Expand to Full Fidelity
Replace the current simplified Phase 2 (lines 1113-1127) with a proper phase container showing:
- Phase title input field
- Desired outcome field
- Its own progress ring (smaller)
- Full fail/success branch lanes with step cards
- Delete button (30x30, red border)

### 5. Add Slider Colors to Color Table
Add entries in the bottom color table for:
- Slider Track: `rgba(21,25,34,0.95)`
- Slider Fill gradient: `#2b4e8d → #4b79d8 → #7dadf5`
- Slider Thumb Border: `#3b82f6`
- Description Box: `#18181b`

### 6. Update Spec Panel — Guidance Strength Section (lines 890-898)
Replace the current mode-toggle-styled spec with accurate slider specs matching the actual component.

## Scope
Single file: `public/style-guide-component-example.html`
~120 lines replaced/added in the preview section, ~15 lines added to color table and spec panel.

