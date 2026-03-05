
## Plan: Change "Goal Name" to "Story Arc Title" in Story Builder

**Problem:** The Story Arcs section in the Story Builder still uses the legacy "Goal Name" label instead of the standardized "Story Arc Title" terminology.

**Location:** `src/components/chronicle/StoryGoalsSection.tsx` line 317

**Changes Required:**
1. Line 317: Change the label text from "Goal Name" to "Story Arc Title"
2. Line 321: Change the placeholder text from "Enter goal name..." to "Enter story arc title..."

**Files to Update:**
- `src/components/chronicle/StoryGoalsSection.tsx`

**Technical Details:**
The change is straightforward text replacement on two lines within the Story Arc container that displays when editing story arcs. This aligns with the story terminology standardization where "Scenario" was replaced with "Story" throughout the application.
