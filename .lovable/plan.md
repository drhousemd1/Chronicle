

# Comprehensive Fix for CharacterEditModal Issues

## Summary

Three issues to fix in `CharacterEditModal.tsx`:

1. **Vertical text stacking in custom categories collapsed view** - Add width constraints and text wrapping classes
2. **Hardcoded sections show no content when collapsed** - Update `CollapsibleSection` component to accept and display collapsed content
3. **Cancel/Save button wrong styling** - Match the "Upload Image" button style with dark surface, rounded corners, and heavy shadow

---

## File to Modify

`src/components/chronicle/CharacterEditModal.tsx`

---

## Technical Changes

### 1. Fix Vertical Text Stacking in Custom Categories (Lines 971-981)

Add `w-full min-w-0` to containers and `break-words whitespace-pre-wrap` to text elements:

**Current:**
```tsx
<div className="space-y-4">
  {section.items.filter(item => item.label || item.value).map((item) => (
    <div key={item.id} className="space-y-1">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
        {item.label || 'Untitled'}
      </span>
      <p className="text-sm text-zinc-400">{item.value || '—'}</p>
    </div>
  ))}
</div>
```

**Fixed:**
```tsx
<div className="space-y-4 w-full min-w-0">
  {section.items.filter(item => item.label || item.value).map((item) => (
    <div key={item.id} className="space-y-1 w-full min-w-0">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block break-words">
        {item.label || 'Untitled'}
      </span>
      <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">{item.value || '—'}</p>
    </div>
  ))}
</div>
```

---

### 2. Add Collapsed Content to CollapsibleSection Component (Lines 136-166)

Update the component to accept an optional `collapsedContent` prop and always render the content area:

**Updated CollapsibleSection:**
```tsx
const CollapsibleSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent?: React.ReactNode;  // NEW: Summary to show when collapsed
}> = ({ title, isExpanded, onToggle, children, collapsedContent }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Slate blue header with collapse arrow */}
    <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
      <h2 className="text-white text-xl font-bold tracking-tight">{title}</h2>
      <button 
        type="button"
        onClick={onToggle} 
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    {/* Content - always rendered, shows either expanded or collapsed view */}
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        {isExpanded ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : (
          <div className="w-full min-w-0">
            {collapsedContent || <p className="text-zinc-500 text-sm italic">No data</p>}
          </div>
        )}
      </div>
    </div>
  </div>
);
```

---

### 3. Create CollapsedFieldSummary Helper Component

Add a helper component to render collapsed field summaries (add after `CollapsibleSection`):

```tsx
// Helper to display field summaries when sections are collapsed
const CollapsedFieldSummary: React.FC<{ 
  fields: { label: string; value: string | undefined }[] 
}> = ({ fields }) => {
  const filledFields = fields.filter(f => f.value);
  if (filledFields.length === 0) {
    return <p className="text-zinc-500 text-sm italic">No data</p>;
  }
  return (
    <div className="space-y-4 w-full min-w-0">
      {filledFields.map((field, idx) => (
        <div key={idx} className="space-y-1 w-full min-w-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block break-words">
            {field.label}
          </span>
          <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">
            {field.value}
          </p>
        </div>
      ))}
    </div>
  );
};
```

---

### 4. Pass collapsedContent to Each Hardcoded Section

Update each `CollapsibleSection` to include the collapsed summary:

**Avatar Section:**
```tsx
<CollapsibleSection
  title="Avatar"
  isExpanded={expandedSections.avatar}
  onToggle={() => toggleSection('avatar')}
  collapsedContent={
    <CollapsedFieldSummary fields={[
      { label: 'Name', value: draft.name || character?.name },
      { label: 'Nicknames', value: draft.nicknames },
      { label: 'Age', value: draft.age },
      { label: 'Sex / Identity', value: draft.sexType },
      { label: 'Location', value: draft.location },
      { label: 'Current Mood', value: draft.currentMood },
      { label: 'Role Description', value: draft.roleDescription },
      { label: 'Controlled By', value: draft.controlledBy },
      { label: 'Character Type', value: draft.characterRole },
    ]} />
  }
>
```

**Physical Appearance Section:**
```tsx
<CollapsibleSection
  title="Physical Appearance"
  isExpanded={expandedSections.physicalAppearance}
  onToggle={() => toggleSection('physicalAppearance')}
  collapsedContent={
    <CollapsedFieldSummary fields={[
      { label: 'Hair Color', value: draft.physicalAppearance?.hairColor },
      { label: 'Eye Color', value: draft.physicalAppearance?.eyeColor },
      { label: 'Build', value: draft.physicalAppearance?.build },
      { label: 'Body Hair', value: draft.physicalAppearance?.bodyHair },
      { label: 'Height', value: draft.physicalAppearance?.height },
      { label: 'Breast Size', value: draft.physicalAppearance?.breastSize },
      { label: 'Genitalia', value: draft.physicalAppearance?.genitalia },
      { label: 'Skin Tone', value: draft.physicalAppearance?.skinTone },
      { label: 'Makeup', value: draft.physicalAppearance?.makeup },
      { label: 'Body Markings', value: draft.physicalAppearance?.bodyMarkings },
      { label: 'Temporary Conditions', value: draft.physicalAppearance?.temporaryConditions },
    ]} />
  }
>
```

**Currently Wearing Section:**
```tsx
collapsedContent={
  <CollapsedFieldSummary fields={[
    { label: 'Shirt / Top', value: draft.currentlyWearing?.top },
    { label: 'Pants / Bottoms', value: draft.currentlyWearing?.bottom },
    { label: 'Undergarments', value: draft.currentlyWearing?.undergarments },
    { label: 'Miscellaneous', value: draft.currentlyWearing?.miscellaneous },
  ]} />
}
```

**Preferred Clothing Section:**
```tsx
collapsedContent={
  <CollapsedFieldSummary fields={[
    { label: 'Casual', value: draft.preferredClothing?.casual },
    { label: 'Work', value: draft.preferredClothing?.work },
    { label: 'Sleep', value: draft.preferredClothing?.sleep },
    { label: 'Undergarments', value: draft.preferredClothing?.undergarments },
    { label: 'Miscellaneous', value: draft.preferredClothing?.miscellaneous },
  ]} />
}
```

Similar updates for Background and Personality sections (for side characters).

---

### 5. Update Cancel/Save Button Styling (Lines 1004-1020)

Change footer buttons to match "Upload Image" button style:

**Current:**
```tsx
<DialogFooter className="px-6 py-5 border-t border-white/20 bg-[#4a5f7f] gap-3">
  <Button
    variant="outline"
    onClick={() => onOpenChange(false)}
    disabled={isSaving}
    className="bg-zinc-900 hover:bg-zinc-800 text-white border-white/20"
  >
    Cancel
  </Button>
  <Button
    onClick={handleSave}
    disabled={isSaving}
    className="bg-blue-600 hover:bg-blue-500 text-white"
  >
    {isSaving ? 'Saving...' : 'Save Changes'}
  </Button>
</DialogFooter>
```

**Updated:**
```tsx
<DialogFooter className="px-6 py-4 border-t border-white/10 bg-[#2a2a2f] gap-3">
  <button
    type="button"
    onClick={() => onOpenChange(false)}
    disabled={isSaving}
    className="flex h-10 px-6 items-center justify-center gap-2
      rounded-xl border border-[hsl(var(--ui-border))] 
      bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
      hover:bg-white/5 active:bg-white/10 disabled:opacity-50
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
      transition-colors"
  >
    Cancel
  </button>
  <button
    type="button"
    onClick={handleSave}
    disabled={isSaving}
    className="flex h-10 px-6 items-center justify-center gap-2
      rounded-xl border border-blue-500/30 
      bg-blue-600 shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      text-white text-[10px] font-bold leading-none uppercase tracking-wider
      hover:bg-blue-500 active:bg-blue-400 disabled:opacity-50
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40
      transition-colors"
  >
    {isSaving ? 'Saving...' : 'Save Changes'}
  </button>
</DialogFooter>
```

**Key style changes:**
- Footer background: `bg-[#2a2a2f]` (dark charcoal instead of slate blue)
- Rounded corners: `rounded-xl` 
- Heavy drop shadow: `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`
- Font styling: `text-[10px] font-bold uppercase tracking-wider`
- Cancel button uses CSS variables matching "Upload Image" button

---

## Summary of All Changes

| Issue | Location | Fix |
|-------|----------|-----|
| Vertical text stacking | Lines 971-981 | Add `w-full min-w-0` to containers, `break-words whitespace-pre-wrap` to text |
| Empty collapsed hardcoded sections | Lines 136-166 | Add `collapsedContent` prop to `CollapsibleSection`, always render content area |
| Collapsed summary helper | After line 166 | Add `CollapsedFieldSummary` component |
| Pass collapsed content | Lines 504, 682, etc. | Add `collapsedContent` prop to each hardcoded section |
| Wrong button styling | Lines 1004-1020 | Update footer and button styles to match "Upload Image" |

