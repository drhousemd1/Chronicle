
# Restyle CharacterEditModal to Match Scenario Builder Character Page

## Overview

The current CharacterEditModal styling differs significantly from the Character Builder page in the Scenario Builder. This plan will update the modal to mirror the Character Builder's design patterns including:
- Proper containerized avatar panel with slate blue header
- Collapsible sections with slate blue headers and chevron arrows
- Premium AvatarActionButtons (Upload Image dropdown + iridescent AI Generate)
- Vertically stacked fields instead of 2-3 column grids
- Enlarged modal for better usability

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharacterEditModal.tsx` | Complete restyling to match CharactersTab patterns |

---

## Technical Changes

### 1. Enlarge Modal Size

Increase modal width from `max-w-4xl` to `max-w-6xl` for more comfortable editing:

```tsx
<DialogContent className="max-w-6xl max-h-[90vh] ...">
```

### 2. Create CollapsibleSection Component

Add a new component matching `HardcodedSection` from CharactersTab:

```tsx
const CollapsibleSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isExpanded, onToggle, children }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Slate blue header with collapse arrow */}
    <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
      <h2 className="text-white text-xl font-bold tracking-tight">{title}</h2>
      <button 
        onClick={onToggle} 
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    {/* Content */}
    {isExpanded && (
      <div className="p-5">
        <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    )}
  </div>
);
```

### 3. Add Expanded State Tracking

Add state to track which sections are expanded:

```tsx
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
  avatar: true,
  basicInfo: true,
  control: true,
  physicalAppearance: true,
  currentlyWearing: true,
  preferredClothing: true,
  background: true,
  personality: true,
  customCategories: true
});

const toggleSection = (key: string) => {
  setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
};
```

### 4. Restructure Avatar Panel

Wrap the avatar display and buttons in a proper `CollapsibleSection`:

```tsx
<CollapsibleSection
  title="Avatar"
  isExpanded={expandedSections.avatar}
  onToggle={() => toggleSection('avatar')}
>
  {/* Avatar image display */}
  <div className="flex flex-col items-center gap-4">
    <div className="w-48 h-48 rounded-2xl overflow-hidden ...">
      {/* Avatar image */}
    </div>
    
    {/* Use AvatarActionButtons component for premium styling */}
    <AvatarActionButtons
      onUploadFromDevice={() => fileInputRef.current?.click()}
      onSelectFromLibrary={(imageUrl) => {
        setDraft(prev => ({
          ...prev,
          avatarDataUrl: imageUrl,
          avatarPosition: { x: 50, y: 50 }
        }));
        toast.success('Avatar selected from library');
      }}
      onGenerateClick={handleRegenerateAvatar}
      disabled={isUploadingAvatar}
      isGenerating={isRegeneratingAvatar}
      isUploading={isUploadingAvatar}
    />
  </div>
  
  {/* Basic fields below avatar */}
  <div className="space-y-4">
    {/* Name, Nicknames, Age, etc. - stacked vertically */}
  </div>
</CollapsibleSection>
```

### 5. Convert Grid Layouts to Stacked Layouts

Change fields from 2-3 column grids to single-column stacked layout:

**Before:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  <FieldInput label="Hair Color" ... />
  <FieldInput label="Eye Color" ... />
  <FieldInput label="Build" ... />
</div>
```

**After:**
```tsx
<div className="space-y-4">
  <FieldInput label="Hair Color" ... />
  <FieldInput label="Eye Color" ... />
  <FieldInput label="Build" ... />
</div>
```

### 6. Replace Section Component with CollapsibleSection

Update all trait sections to use the new collapsible pattern:

```tsx
{/* Physical Appearance */}
<CollapsibleSection
  title="Physical Appearance"
  isExpanded={expandedSections.physicalAppearance}
  onToggle={() => toggleSection('physicalAppearance')}
>
  <FieldInput label="Hair Color" value={...} onChange={...} placeholder="..." />
  <FieldInput label="Eye Color" value={...} onChange={...} placeholder="..." />
  {/* ... rest of fields stacked vertically */}
</CollapsibleSection>

{/* Currently Wearing */}
<CollapsibleSection
  title="Currently Wearing"
  isExpanded={expandedSections.currentlyWearing}
  onToggle={() => toggleSection('currentlyWearing')}
>
  <FieldInput label="Shirt / Top" ... />
  <FieldInput label="Pants / Bottoms" ... />
  {/* ... rest of fields stacked vertically */}
</CollapsibleSection>
```

### 7. Import Required Components

Add imports for AvatarActionButtons and Lucide icons:

```tsx
import { AvatarActionButtons } from './AvatarActionButtons';
import { ChevronDown, ChevronUp } from 'lucide-react';
```

---

## Layout Changes Summary

| Current Layout | New Layout |
|---------------|------------|
| 3-column grid for Left/Right content | 2-column grid: Avatar column + Traits column |
| Avatar with basic Upload/AI Generate buttons | Avatar with premium `AvatarActionButtons` component |
| `Section` with line divider header | `CollapsibleSection` with slate blue header + arrow |
| 2-3 column field grids | Stacked single-column fields |
| `max-w-4xl` modal | `max-w-6xl` modal |

---

## Visual Result

The modal will now have:
- Larger overall size for comfortable editing
- Left column: Avatar panel with slate blue "Avatar" header, collapse arrow, premium buttons
- Right column: Trait sections each with slate blue headers and collapse arrows
- All fields stacked vertically for full text visibility
- Consistent dark charcoal theme matching the Scenario Builder

---

## What Stays the Same

- Custom Categories section (to be updated separately as mentioned)
- Footer with Cancel/Save Changes buttons
- Basic color scheme (dark charcoal + slate blue)
- Session-scoped change note in header
