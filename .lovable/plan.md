

# Fix Custom Category Layout and Collapsed View

## Summary

Three issues to address in both the Chat Interface (`CharacterEditModal.tsx`) and Scenario Builder (`CharactersTab.tsx`):

1. **Wrong placeholder text**: Change "Value" to "Description" for the description field
2. **Layout change**: Return custom category items to a side-by-side (inline) layout with Label and Description next to each other horizontally
3. **Missing collapsed view in chat modal**: Add collapsed content display for custom sections (showing label/value pairs) matching how hardcoded sections display in the Scenario Builder

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharacterEditModal.tsx` | Fix placeholder, inline layout, add collapsed content view for custom sections |
| `src/components/chronicle/CharactersTab.tsx` | Fix placeholder, inline layout for custom section items |

---

## Technical Changes

### 1. Change Placeholder from "Value" to "Description"

**CharacterEditModal.tsx** (around line 940):
```tsx
// Change this:
placeholder="Value"

// To:
placeholder="Description"
```

**CharactersTab.tsx** (around line 833):
```tsx
// Change this:
placeholder="Value"

// To:
placeholder="Description"
```

---

### 2. Change Layout from Stacked to Inline (Side-by-Side)

Replace the stacked vertical layout with a horizontal inline layout where Label and Description are next to each other.

**Current layout (both files):**
```tsx
<div className="flex-1 space-y-2">
  {/* Label field - on top */}
  <AutoResizeTextarea ... placeholder="Label" />
  {/* Description field - below */}
  <AutoResizeTextarea ... placeholder="Value" />
</div>
```

**New layout:**
```tsx
<div className="flex-1 flex gap-2">
  {/* Label field - left side */}
  <AutoResizeTextarea 
    ... 
    placeholder="Label" 
    className="w-1/3 ..." 
  />
  {/* Description field - right side */}
  <AutoResizeTextarea 
    ... 
    placeholder="Description" 
    className="flex-1 ..." 
  />
</div>
```

This matches the old design from the reference screenshot where Label is a narrower field on the left and Description/Value takes up more space on the right.

---

### 3. Add Collapsed Content View to Custom Sections (Chat Modal)

The `CharacterEditModal.tsx` needs to show a summary view when custom sections are collapsed, matching the pattern used in `CharactersTab.tsx` for hardcoded sections.

**Add a collapsed content component for custom sections:**

```tsx
// Collapsed custom section content (label/value pairs displayed vertically)
const CollapsedCustomSection: React.FC<{ items: { label: string; value: string }[] }> = ({ items }) => {
  const hasAnyValue = items.some(item => item.label || item.value);
  if (!hasAnyValue) {
    return <p className="text-zinc-500 text-sm italic">No items</p>;
  }
  return (
    <div className="space-y-4">
      {items.filter(item => item.label || item.value).map((item, idx) => (
        <div key={idx} className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
            {item.label || 'Untitled'}
          </span>
          <p className="text-sm text-zinc-400">{item.value || '—'}</p>
        </div>
      ))}
    </div>
  );
};
```

**Update the custom section rendering to show collapsed content:**

```tsx
{/* Custom Sections - Each as its own container */}
{!isSideCharacter && draft.sections?.map((section) => {
  const isExpanded = expandedCustomSections[section.id] ?? true;
  
  return (
    <div key={section.id} className="...">
      {/* Header (unchanged) */}
      <div className="bg-blue-900/40 ...">
        ...
      </div>
      
      {/* Content - show either expanded or collapsed view */}
      <div className="p-5">
        <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
          {isExpanded ? (
            <div className="space-y-4">
              {/* Editable items inline layout */}
              ...
            </div>
          ) : (
            <CollapsedCustomSection items={section.items} />
          )}
        </div>
      </div>
    </div>
  );
})}
```

**Also update CharactersTab.tsx** to show collapsed content for custom sections using the same pattern.

---

## Visual Result

**Expanded State:**
- Label and Description fields are side-by-side (horizontally inline)
- Label takes up roughly 1/3 width, Description takes remaining 2/3
- Delete button positioned to the right

**Collapsed State:**
- Shows a read-only summary view
- Label displayed as uppercase muted header text
- Description/value displayed below in zinc-400 text
- Matches the collapsed view of hardcoded sections like "Physical Appearance"

---

## Summary of Changes

| Change | Before | After |
|--------|--------|-------|
| Placeholder | "Value" | "Description" |
| Item layout | Stacked vertically | Side-by-side inline |
| Collapsed view (chat modal) | Hidden entirely | Shows label/value summary |

