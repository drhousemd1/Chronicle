

# Fix Findings Cards: Use Recessed Style + Full Detail Breakdown

## Problem
1. Finding cards use `bg-[#1a2030]` with a custom border — should use the same `recessedBlockClass` as the overview page panels.
2. The expanded dropdown only shows Problem, Current State, Why It Matters, Recommendation, Files, Evidence, Found By, and Updated. Missing: User Impact, Fix Level, Difficulty, Category, Confidence, Tags, Repro Steps, Expected Behavior, Actual Behavior.

## Changes

### `src/pages/style-guide/ui-audit.tsx` — Lines 438-471

**Style fix:** Replace the `<details>` wrapper class from `rounded-xl border border-[#4a5f7f]/45 bg-[#1a2030] open:border-[#5a7292]` to use `recessedBlockClass` with an open-state highlight.

**Content fix:** Restructure the expanded details into organized sections:

| Section | Fields |
|---------|--------|
| Summary | Severity, Domain, Status, Confidence, Category, Page, Component |
| Problem | Problem description, Current State |
| Impact | Why It Matters, User Impact |
| Files & Evidence | Files list, Evidence list, Tags |
| Proposed Fix | Recommendation, Fix Level, Implementation Difficulty, Batchable flag, Design System Level flag |
| Expected Outcome | Expected Behavior, Actual Behavior, Repro Steps |
| Metadata | Found By, Contributors, Created, Updated |
| Actions | Status dropdown, Verification dropdown, Add Comment button |

Each sub-section will use a bold label header in `text-[#eaedf1]` with content in `text-[#a1a1aa]`, matching the existing pattern but covering every field on the `QualityFinding` type. Empty/default fields will show a subtle "—" placeholder rather than being hidden.

