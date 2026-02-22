

# Sentinel Step + Editable Trigger + LLM Fallback Directive

## Overview

Three changes to the fail (recovery) branch in `ArcBranchLane.tsx`, plus an LLM context directive in `llm.ts`.

## Changes

### 1. Make Resistance Trigger editable in Simple mode
**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`

- Remove the `isPassive` override that forces the trigger value to "AI will handle dynamically" and makes it read-only
- The trigger textarea will always show `branch.triggerDescription` and always be editable in both modes
- Remove the `isPassive`-based italic styling

### 2. Always render the steps section (remove `!isPassive` guard)
**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`

- Currently the entire steps block is wrapped in `{!isPassive && (...)}` -- remove that guard
- In simple mode: hide user-created step cards and the "+ Add Step" button, but still render the sentinel
- In advanced mode: show everything (user steps, add button, sentinel)

### 3. Add sentinel step card at the bottom of the fail branch
**File:** `src/components/chronicle/arc/ArcBranchLane.tsx`

After the user steps loop and add button (or directly after the trigger in simple mode), render a hardcoded, read-only card for the fail branch only:

- **Simple mode text:** "AI will handle recovery steps dynamically"
- **Advanced mode text:** "AI will handle ongoing recovery steps dynamically once predetermined recovery attempts have all been attempted."
- Styled like a regular step card but dimmed (opacity-60), with a lock icon instead of delete, no status toggles
- Label: "DYNAMIC RECOVERY" instead of "RECOVERY STEP N"
- This card is purely UI -- not added to the data model

### 4. LLM fallback directive
**File:** `src/services/llm.ts` (in `serializeBranch`, around line 104-110)

After the status summary line, check if:
- The branch is the fail branch (label contains "Recovery")
- All fail branch steps have resolved statuses (none pending)
- There are still pending progression steps

If so, append: "All predetermined recovery steps have been attempted. Continue to pursue remaining progression steps by adapting dynamically -- introduce new narrative approaches that organically guide the story back toward pending goals. Do not repeat previously failed approaches verbatim."

## What Does NOT Change
- The data model (`ArcStep` type, clone-on-recovery logic)
- Progress calculations
- The success branch behavior
- Retry badges, status toggles on user-created steps
- LLM serialization of individual steps and their retry lineage
