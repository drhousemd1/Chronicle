

# Collapsible Sections for Character Traits

## Clarification

This plan **does NOT remove or replace** the hardcoded sections. These sections (Physical Appearance, Currently Wearing, Preferred Clothing, Character Goals) contain core fields that the AI uses and must always be present.

The change is purely **visual/UX**: adding a collapse/expand toggle so users can condense sections they're done editing to reduce scroll distance, while keeping all fields and data intact.

---

## What Changes

| Current | After |
|---------|-------|
| Sections always show full edit mode with input fields | Sections can toggle between expanded (edit) and collapsed (read-only summary) |
| No header controls | Chevron arrow in header right corner toggles state |
| Fixed section height | Collapsed sections are more compact |

---

## Implementation

### 1. Enhance `HardcodedSection` Component

Add collapse functionality to the existing component:

```tsx
// Updated HardcodedSection with collapse toggle
const HardcodedSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent: React.ReactNode;
}> = ({ title, isExpanded, onToggle, children, collapsedContent }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[...]">
    {/* Header with toggle button */}
    <div className="bg-[#4a5f7f] ... flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="...">Section</span>
        <h2 className="...">{title}</h2>
      </div>
      <button onClick={onToggle} className="text-white/70 hover:text-white p-1">
        {isExpanded ? <ChevronDown /> : <ChevronUp />}
      </button>
    </div>
    {/* Content switches between edit and read-only */}
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        {isExpanded ? children : collapsedContent}
      </div>
    </div>
  </div>
);
```

### 2. Add State Management

Track which sections are expanded:

```tsx
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
  avatar: true,
  physicalAppearance: true,
  currentlyWearing: true,
  preferredClothing: true,
  characterGoals: true
});

const toggleSection = (key: string) => {
  setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
};
```

### 3. Create Condensed Read-Only Views

Helper components that show field values as plain text (no inputs):

**Physical Appearance (collapsed):**
```tsx
const CollapsedPhysicalAppearance: React.FC<{ data: PhysicalAppearance }> = ({ data }) => (
  <div className="space-y-1.5">
    {data.hairColor && (
      <div className="flex gap-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase w-20">Hair</span>
        <span className="text-sm text-zinc-200">{data.hairColor}</span>
      </div>
    )}
    {data.eyeColor && (
      <div className="flex gap-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase w-20">Eyes</span>
        <span className="text-sm text-zinc-200">{data.eyeColor}</span>
      </div>
    )}
    {/* ... similar for other non-empty fields */}
  </div>
);
```

Only fields with values are shown. Empty fields are hidden in collapsed view.

### 4. Update Section Usage

```tsx
{/* Physical Appearance - now collapsible */}
<HardcodedSection 
  title="Physical Appearance"
  isExpanded={expandedSections.physicalAppearance}
  onToggle={() => toggleSection('physicalAppearance')}
  collapsedContent={<CollapsedPhysicalAppearance data={selected.physicalAppearance} />}
>
  {/* All existing HardcodedInput fields stay exactly the same */}
  <HardcodedInput label="Hair Color" ... />
  <HardcodedInput label="Eye Color" ... />
  {/* etc. */}
</HardcodedSection>
```

### 5. Update CharacterGoalsSection

Add header toggle that uses the existing `readOnly` prop:

```tsx
// In CharacterGoalsSection header:
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <span>Section</span>
    <h2>Character Goals</h2>
  </div>
  <button onClick={onToggle}>
    {isExpanded ? <ChevronDown /> : <ChevronUp />}
  </button>
</div>

// Props interface updated:
interface CharacterGoalsSectionProps {
  goals: CharacterGoal[];
  onChange: (goals: CharacterGoal[]) => void;
  readOnly?: boolean;
  isExpanded?: boolean;        // NEW
  onToggle?: () => void;       // NEW
  currentDay?: number;
  currentTimeOfDay?: TimeOfDay;
}
```

### 6. Avatar Panel

Same pattern - add toggle to header, collapsed view shows:
- Smaller avatar thumbnail
- Name, Age, Sex/Identity as inline text
- Hide action buttons (Upload, AI Generate, Reposition)

---

## Visual Comparison

**Expanded (default):**
```text
┌──────────────────────────────────────────────┐
│ SECTION  Physical Appearance            ▼   │ ← Chevron down
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ HAIR COLOR                             │  │
│  │ [________________________] ✨          │  │
│  │                                        │  │
│  │ EYE COLOR                              │  │
│  │ [________________________] ✨          │  │
│  │                                        │  │
│  │ ... 9 more fields ...                  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Collapsed:**
```text
┌──────────────────────────────────────────────┐
│ SECTION  Physical Appearance            ▲   │ ← Chevron up
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ HAIR    Brown, wavy, shoulder-length   │  │
│  │ EYES    Hazel                          │  │
│  │ BUILD   Athletic                       │  │
│  │ HEIGHT  5'8"                           │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharactersTab.tsx` | Add `expandedSections` state, update `HardcodedSection` component, add collapsed view helpers, update all section usages including Avatar |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Add `isExpanded` and `onToggle` props, add chevron toggle to header |

---

## Technical Notes

- Uses Radix UI `Collapsible` (already installed) for smooth height animation
- `ChevronDown` / `ChevronUp` icons from `lucide-react` (already in use)
- Collapsed views only show non-empty fields to keep things tight
- All section data, field handlers, and AI enhancement functionality remain unchanged
- Default state: all sections expanded (matches current behavior)

