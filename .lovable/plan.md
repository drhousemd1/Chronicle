
# Character Goals Section - Complete UI Overhaul

## Overview

This is a major redesign of the `CharacterGoalsSection` component, transforming it from a table-style layout with a light theme to a dark, card-based design with milestone history tracking. Additionally, we're changing how users access character cards - replacing the expandable dropdown with a "View character card" link that opens the modal in view mode, with an edit toggle.

---

## Color Scheme Analysis (from mockups)

### Outer Container
- Background: Dark slate/charcoal (`bg-slate-800` or `#2d3748`)
- Border: Subtle gray border (`border-slate-600`)
- Border radius: Rounded corners

### Section Header
- Background: Muted blue-gray (`bg-slate-500/60` or similar)
- "SECTION" label: Light green text (`text-emerald-300`)
- "Character Goals" title: White text (`text-white`)

### Goal Subcontainer
- Background: Slightly lighter dark (`bg-slate-700` or `#374151`)
- Border: Subtle (`border-slate-600`)

### Labels
- Category labels (GOAL NAME, DESIRED OUTCOME, etc.): Yellow/gold color (`text-amber-400` or `text-yellow-400`)
- Content text: White (`text-white`) or light gray (`text-slate-200`)

### Progress Ring
- Large circular progress indicator
- Blue ring stroke (`stroke-blue-500`)
- Dark fill background
- White percentage text
- "OVERALL PROGRESS" label: Muted gray uppercase text

### Milestone History Section
- Divider line separating from main content
- Clock icon with "MILESTONE HISTORY" header
- Timeline-style dots (blue circles with vertical connector)
- "DAY X" and time-of-day chips on the right side
  - Day chip: Dark background with white text
  - Time chip: Time-specific colors (blue for midday, orange for sunset, etc.)

### Edit Mode Differences
- Blue border around editable containers (`border-blue-500`)
- Input fields appear inside containers
- Delete (X) buttons appear next to milestones
- Horizontal slider appears under progress ring for manual adjustment
- "+ Add Milestone Step" button at bottom of milestones
- "+ Add New Goal" button (blue with white text)
- Trash icon in top-right for deleting entire goal

---

## Data Model Changes

Add a new type for milestone history in `src/types.ts`:

```typescript
export type GoalMilestone = {
  id: string;
  description: string;
  day: number;
  timeOfDay: TimeOfDay;
  createdAt: number;
};

export type CharacterGoal = {
  id: string;
  title: string;
  desiredOutcome: string;
  currentStatus: string;
  progress: number;
  milestones?: GoalMilestone[];  // NEW: milestone history
  createdAt: number;
  updatedAt: number;
};
```

---

## Component Architecture

### CharacterGoalsSection.tsx - Complete Rewrite

**Props changes:**
- Keep `goals`, `onChange`, `readOnly`
- Add `currentDay` and `currentTimeOfDay` for milestone timestamps

**New internal state:**
- `isEditMode` - toggle between view and edit modes (passed from parent or internal)

**Structure:**

```
CharacterGoalsSection (dark container)
├── Section Header (muted blue bar)
│   └── "SECTION" label + "Character Goals" title
│
├── Goal Cards (one per goal, sorted by progress)
│   ├── Left Side (flex-1)
│   │   ├── GOAL NAME section
│   │   │   └── Label + Title (view mode) OR Input (edit mode)
│   │   ├── DESIRED OUTCOME section
│   │   │   └── Label + Text (view mode) OR Textarea (edit mode)
│   │   ├── CURRENT STATUS SUMMARY section
│   │   │   └── Label + Text (view mode) OR Textarea (edit mode)
│   │   ├── Divider line
│   │   └── MILESTONE HISTORY section
│   │       ├── Clock icon + Header
│   │       ├── Timeline items (dots + descriptions + day/time chips)
│   │       └── "+ Add Milestone Step" button (edit mode only)
│   │
│   └── Right Side (fixed width ~200px)
│       ├── Circular Progress Ring (large, redesigned)
│       ├── "OVERALL PROGRESS" label
│       └── Horizontal Slider (edit mode only)
│
└── "+ Add New Goal" button (edit mode only)
```

---

## Character Card Changes

### Current Behavior (to remove)
- Click on avatar/name expands an inline dropdown showing character details
- Small arrow icon next to name indicates expandability

### New Behavior
1. Replace the expandable area with a simple "View character card" text link below the avatar/name
2. On hover, show a subtle highlight effect
3. Click opens the `CharacterEditModal` in **view mode** (new prop: `viewOnly`)
4. Inside the modal, add an edit icon/button that toggles to edit mode

### Files to modify:
- `ChatInterfaceTab.tsx`: Update `renderCharacterCard` function
- `SideCharacterCard.tsx`: Update to match new behavior
- `CharacterEditModal.tsx`: Add `viewOnly` prop and toggle UI

---

## Implementation Phases

### Phase 1: Types Update
- Add `GoalMilestone` type to `src/types.ts`
- Update `CharacterGoal` to include optional `milestones` array

### Phase 2: CharacterGoalsSection Rewrite
- Complete visual overhaul with dark theme
- Two-column layout (content + progress ring)
- Milestone history section with timeline UI
- View mode vs Edit mode states
- All the color/styling from mockups

### Phase 3: CircularProgress Enhancement
- Larger size for goals display (80-100px)
- Dark background variant for the new theme
- Optional size variants

### Phase 4: Character Card Flow Update
- Remove expandable dropdown from `renderCharacterCard`
- Add "View character card" clickable text
- Update `CharacterEditModal` to support view-only mode with edit toggle
- Apply same changes to `SideCharacterCard`

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types.ts` | Modify | Add `GoalMilestone` type, update `CharacterGoal` |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Rewrite | Complete visual overhaul with new design |
| `src/components/chronicle/CircularProgress.tsx` | Modify | Add dark theme variant, larger size support |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Modify | Replace expandable dropdown with "View character card" link |
| `src/components/chronicle/SideCharacterCard.tsx` | Modify | Match new character card behavior |
| `src/components/chronicle/CharacterEditModal.tsx` | Modify | Add `viewOnly` prop and edit toggle |

---

## Technical Notes

### Timeline UI for Milestones
The milestone history uses a vertical timeline with:
- Blue circle dots on the left
- Vertical line connecting them (using CSS `::before` or border)
- Description text
- Day/Time chips aligned to the right

### Day/Time Chips in Milestones
Reuse the same time-of-day styling from the Day/Time tracker:
- Sunrise: orange/amber colors
- Day/Midday: blue colors
- Sunset: orange/pink colors
- Night: dark/indigo colors

### Edit Mode Blue Borders
When `readOnly === false`, add blue border to all editable containers to visually indicate edit mode.

### Slider for Progress
Use the existing `@/components/ui/slider` component, styled to match the dark theme.
