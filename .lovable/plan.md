
# Implementation Plan: Character Goals Tracking System

## Overview

This plan implements a new **Character Goals** tracking system that allows the AI to monitor and update character objectives during roleplay. The system uses a single unified container with automatic sorting by progress, matching your preferred approach (Image 1).

Additionally, this plan addresses the text wrapping bug in custom section labels.

---

## Data Model

### New Type: `CharacterGoal`

```typescript
type CharacterGoal = {
  id: string;
  title: string;           // Short goal name (e.g., "Move out of the city")
  desiredOutcome: string;  // What success looks like
  currentStatus: string;   // What has been done so far
  progress: number;        // 0-100 percentage
  createdAt: number;
  updatedAt: number;
};
```

### Updated Types

The `Character` type will gain a new `goals` field:

```typescript
type Character = {
  // ...existing fields...
  goals: CharacterGoal[];  // New field
};
```

Similarly, `CharacterSessionState` will include:

```typescript
type CharacterSessionState = {
  // ...existing fields...
  goals?: CharacterGoal[];  // Session-scoped goal overrides
};
```

---

## Database Schema Changes

### New JSONB column on `characters` table

```sql
ALTER TABLE characters 
ADD COLUMN goals jsonb DEFAULT '[]'::jsonb;
```

### New JSONB column on `character_session_states` table

```sql
ALTER TABLE character_session_states 
ADD COLUMN goals jsonb DEFAULT '[]'::jsonb;
```

---

## UI Component: GoalsSection

### Location
New file: `src/components/chronicle/CharacterGoalsSection.tsx`

### Design (matching app's existing styling)

The component renders a table-like layout within a Card container:

```text
┌─────────────────────────────────────────────────────────────┐
│  Character Goals                                    [+ Add] │
├─────────────────────────────────────────────────────────────┤
│  GOAL             DESIRED OUTCOME       STATUS      PROGRESS│
├─────────────────────────────────────────────────────────────┤
│  Move out of      Ashley will convince  James and     ●────●│
│  the city         James to move out...  Ashley moved  100%  │
│                                         to the...           │
├─────────────────────────────────────────────────────────────┤
│  Hormone          Ashley secretly...    Ashley gave    ●───○│
│  Therapy                                3 doses...     30%  │
├─────────────────────────────────────────────────────────────┤
│  Sissification    Ashley has always...  Still hasn't   ○───○│
│                                         figured out..   0%  │
└─────────────────────────────────────────────────────────────┘
```

### Features

1. **Progress Ring Indicator**
   - Circular SVG ring showing percentage (0-100%)
   - Color coding:
     - 0%: Gray ring with gray text
     - 1-99%: Blue ring with percentage fill
     - 100%: Green filled ring
   - Clicking the ring opens a small input to manually edit the percentage

2. **Text Wrapping**
   - All columns support text wrapping
   - Goal title column: ~25% width
   - Desired Outcome column: ~35% width
   - Current Status column: ~25% width
   - Progress column: ~15% width (ring + percentage)

3. **Auto-Sort**
   - Goals automatically sort by progress (descending)
   - 100% goals appear at top
   - 0% goals appear at bottom

4. **Row Actions**
   - Edit button (pencil icon on hover)
   - Delete button (trash icon on hover)
   - All fields are editable inline or via popup

5. **Add Goal Button**
   - Creates a new goal row with empty fields and 0% progress

---

## AI Integration

### Extract Character Updates Enhancement

The `extract-character-updates` edge function prompt will be updated to understand goals:

```text
GOALS TRACKING:
You can also track character goals using this format:
- goals.GoalTitle.desiredOutcome = "Description of success"
- goals.GoalTitle.currentStatus = "What has been done"
- goals.GoalTitle.progress = number (0-100)

Examples:
- goals.Hormone Therapy.currentStatus = "Given 4 doses so far"
- goals.Hormone Therapy.progress = 40
- goals.Move to countryside.progress = 100
- goals.Find new job.desiredOutcome = "Get hired as a nurse"

When dialogue reveals:
- A NEW goal or desire: Create goals.GoalTitle with desiredOutcome, currentStatus="Not started", progress=0
- Progress on an existing goal: Update goals.GoalTitle.currentStatus and goals.GoalTitle.progress
- Goal completion: Set goals.GoalTitle.progress = 100 and update currentStatus with the outcome
```

### Apply Extracted Updates Enhancement

The `applyExtractedUpdates` function in `ChatInterfaceTab.tsx` will be updated to handle goal updates:

```typescript
// Handle goals.* field updates
if (field.startsWith('goals.')) {
  const parts = field.split('.');
  const goalTitle = parts[1];
  const goalField = parts[2] as 'desiredOutcome' | 'currentStatus' | 'progress';
  
  // Find or create the goal
  const existingGoals = currentGoals[characterId] || [];
  let goal = existingGoals.find(g => g.title === goalTitle);
  
  if (!goal) {
    goal = {
      id: `goal-${Date.now()}`,
      title: goalTitle,
      desiredOutcome: '',
      currentStatus: '',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    existingGoals.push(goal);
  }
  
  // Update the specific field
  if (goalField === 'progress') {
    goal.progress = Math.min(100, Math.max(0, parseInt(value) || 0));
  } else {
    goal[goalField] = value;
  }
  goal.updatedAt = Date.now();
  
  // Save updated goals
  updateCharacterGoals(characterId, existingGoals);
}
```

---

## Text Wrapping Fix (Side Issue)

### Problem
In `CharactersTab.tsx`, the label Input in custom sections uses a standard `<Input>` component which is a single-line `<input>` element that doesn't wrap text.

### Solution
The label field should use a textarea with auto-resize instead, or we add a CSS property to allow the input to show the full text on blur.

Option A (Simpler): Add `text-ellipsis overflow-hidden` for display, but show full text on focus.

Option B (Better): Convert the label field to use a small auto-resizing textarea that wraps naturally.

For consistency with the rest of the app, Option B is recommended. This involves:

1. Change the label Input to TextArea in custom sections (lines 556-564 in CharactersTab.tsx)
2. Add `autoResize={true}` and `rows={1}` for minimal initial height
3. Apply the same pattern to CharacterEditModal.tsx custom sections (lines 860-863)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/chronicle/CharacterGoalsSection.tsx` | Goals table component with progress rings |
| `src/components/chronicle/CircularProgress.tsx` | Reusable circular progress ring component |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add `CharacterGoal` type, update `Character` and `CharacterSessionState` |
| `src/components/chronicle/CharactersTab.tsx` | Add GoalsSection after Preferred Clothing, fix label wrapping |
| `src/components/chronicle/CharacterEditModal.tsx` | Add GoalsSection, fix label wrapping in custom sections |
| `supabase/functions/extract-character-updates/index.ts` | Add goals tracking to prompt |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Handle goals.* updates in `applyExtractedUpdates` |

---

## Database Migrations

1. Add `goals` JSONB column to `characters` table (default: `'[]'::jsonb`)
2. Add `goals` JSONB column to `character_session_states` table (default: `'[]'::jsonb`)

---

## Implementation Sequence

### Phase 1: Types and Database
1. Update `src/types.ts` with CharacterGoal type
2. Run database migration to add goals columns

### Phase 2: UI Components
3. Create `CircularProgress.tsx` component
4. Create `CharacterGoalsSection.tsx` component
5. Integrate into `CharactersTab.tsx` (Scenario Builder)
6. Integrate into `CharacterEditModal.tsx` (Session edit modal)

### Phase 3: AI Integration
7. Update `extract-character-updates` edge function prompt
8. Update `applyExtractedUpdates` in ChatInterfaceTab.tsx

### Phase 4: Bug Fix
9. Fix text wrapping in custom section labels

---

## Technical Notes

### Circular Progress SVG

The progress ring will be implemented using SVG `circle` elements with `stroke-dasharray` and `stroke-dashoffset` for the fill animation:

```tsx
const CircularProgress = ({ value, size = 48 }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <svg width={size} height={size}>
      {/* Background circle */}
      <circle
        cx={size/2} cy={size/2} r={radius}
        stroke="#e2e8f0" strokeWidth={4} fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size/2} cy={size/2} r={radius}
        stroke={value >= 100 ? "#22c55e" : "#3b82f6"}
        strokeWidth={4} fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      {/* Text */}
      <text x="50%" y="50%" textAnchor="middle" dy=".3em">
        {value}%
      </text>
    </svg>
  );
};
```

### Goals Sorting Logic

Goals will be sorted in the UI with completed goals at the top:

```typescript
const sortedGoals = [...goals].sort((a, b) => b.progress - a.progress);
```

### Manual Progress Edit

When user clicks the progress ring, a small popover or inline input appears:

```tsx
<Popover>
  <PopoverTrigger><CircularProgress value={goal.progress} /></PopoverTrigger>
  <PopoverContent>
    <Input 
      type="number" 
      min={0} max={100} 
      value={goal.progress}
      onChange={(v) => updateGoalProgress(goal.id, parseInt(v))}
    />
  </PopoverContent>
</Popover>
```
