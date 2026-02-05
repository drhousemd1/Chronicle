
# Fix Text Wrapping + Remove Tags + Move Control + Redesign Custom Categories

## Summary

This plan addresses:
1. **Text wrapping issue**: All text fields currently use `<Input>` which cannot wrap - will switch to auto-resizing `<textarea>` that wraps text
2. **Remove Tags container**: Delete the unused Tags field from the chat modal
3. **Move Control fields**: Move "Controlled By" and "Character Type" into the Avatar section (not separate)
4. **Redesign Custom Categories**: Each custom category becomes its own collapsible container with an editable header field, using the dark blue color (`bg-blue-900/20` with `border-blue-500/20`) you're currently using

Files to modify:
- `src/components/chronicle/CharacterEditModal.tsx` (chat interface modal)
- `src/components/chronicle/CharactersTab.tsx` (scenario builder character editor)

---

## Technical Changes

### 1. Create Auto-Resizing Textarea Component (Both Files)

Add a helper component that renders a `<textarea>` styled like an input but wraps text:

```tsx
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, className = '', rows = 1 }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words ${className}`}
    />
  );
};
```

---

### 2. CharacterEditModal.tsx Changes

#### 2a. Update FieldInput to use AutoResizeTextarea
Replace the current `<Input>` with the auto-resizing textarea:

```tsx
const FieldInput: React.FC<{...}> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</Label>
    <AutoResizeTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-3 py-2 rounded-lg text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
    />
  </div>
);
```

#### 2b. Remove Tags Field
Delete the entire Tags `FieldInput` block and remove `tags` from the draft type/initialization.

#### 2c. Move Control Fields into Avatar Section
- Delete the separate "Control" `CollapsibleSection`
- Remove `control` from `expandedSections` state
- Add "Controlled By" and "Character Type" fields at the bottom of the Avatar section content (after Name/Nicknames/Age/etc.)

#### 2d. Redesign Custom Categories - Each as Own Container

Replace the current single "Custom Categories" section with individual containers per category:

```tsx
{/* Custom Sections - Each as its own container */}
{!isSideCharacter && draft.sections?.map((section) => (
  <CustomCollapsibleSection
    key={section.id}
    title={section.title}
    onTitleChange={(newTitle) => updateSectionTitle(section.id, newTitle)}
    isExpanded={expandedCustomSections[section.id] ?? true}
    onToggle={() => toggleCustomSection(section.id)}
    onDelete={() => deleteSection(section.id)}
  >
    {/* Items inside */}
    {section.items.map((item) => (
      <div key={item.id} className="space-y-2">
        <AutoResizeTextarea
          value={item.label}
          onChange={(v) => updateSectionItem(section.id, item.id, 'label', v)}
          placeholder="Label"
          className="..."
        />
        <AutoResizeTextarea
          value={item.value}
          onChange={(v) => updateSectionItem(section.id, item.id, 'value', v)}
          placeholder="Value"
          className="..."
        />
        <button onClick={() => removeItemFromSection(section.id, item.id)}>×</button>
      </div>
    ))}
    <button onClick={() => addItemToSection(section.id)}>+ Add Row</button>
  </CustomCollapsibleSection>
))}

{/* Add Category button outside containers */}
{!isSideCharacter && (
  <Button onClick={addNewSection}>+ Add Category</Button>
)}
```

#### 2e. CustomCollapsibleSection Component (Dark Blue Header)

```tsx
const CustomCollapsibleSection: React.FC<{
  title: string;
  onTitleChange: (title: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}> = ({ title, onTitleChange, isExpanded, onToggle, onDelete, children }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Dark blue header with editable title */}
    <div className="bg-blue-900/40 border-b border-blue-500/20 px-5 py-3 flex items-center justify-between">
      <AutoResizeTextarea
        value={title}
        onChange={onTitleChange}
        placeholder="Category name"
        className="bg-transparent border-none text-white text-xl font-bold tracking-tight placeholder:text-white/50 focus:outline-none flex-1"
      />
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-900/30">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
    {/* Content */}
    {isExpanded && (
      <div className="p-5">
        <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5 space-y-4">
          {children}
        </div>
      </div>
    )}
  </div>
);
```

#### 2f. Add State for Custom Section Expansion

```tsx
const [expandedCustomSections, setExpandedCustomSections] = useState<Record<string, boolean>>({});

const toggleCustomSection = (sectionId: string) => {
  setExpandedCustomSections(prev => ({
    ...prev,
    [sectionId]: !(prev[sectionId] ?? true)
  }));
};
```

---

### 3. CharactersTab.tsx Changes (Scenario Builder)

#### 3a. Update HardcodedInput to use AutoResizeTextarea
Replace `<input type="text">` with the auto-resizing textarea for text wrapping:

```tsx
const HardcodedInput: React.FC<{...}> = ({ label, value, onChange, placeholder, onEnhance, isEnhancing }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-1.5">
      <AutoResizeTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
      />
      {/* AI enhance button */}
    </div>
  </div>
);
```

#### 3b. Update Avatar Panel Fields
Convert the avatar panel input fields (Name, Nicknames, Age, etc.) to use AutoResizeTextarea.

#### 3c. Redesign Custom Sections to Match Hardcoded Shells

Replace the current light green `Card` structure with a dark-themed shell matching the chat modal:

```tsx
{selected.sections.map(section => (
  <div key={section.id} className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Dark blue header with editable title */}
    <div className="bg-blue-900/40 border-b border-blue-500/20 px-5 py-3 flex items-center justify-between">
      <AutoResizeTextarea
        value={section.title}
        onChange={(v) => handleUpdateSection(selected.id, section.id, { title: v })}
        placeholder="Section Title"
        className="bg-transparent border-none text-white text-xl font-bold tracking-tight placeholder:text-white/50 focus:outline-none flex-1"
      />
      <div className="flex items-center gap-2">
        <button onClick={() => toggleCustomSection(section.id)}>
          {expandedCustomSections[section.id] ? <ChevronDown /> : <ChevronUp />}
        </button>
        <button onClick={() => deleteSection(section.id)}>
          <Trash2 />
        </button>
      </div>
    </div>
    {/* Content */}
    {(expandedCustomSections[section.id] ?? true) && (
      <div className="p-5">
        <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5 space-y-4">
          {section.items.map(item => (
            <div key={item.id} className="space-y-2">
              {/* Label field - wrapping */}
              <AutoResizeTextarea value={item.label} onChange={...} />
              {/* Value field - wrapping */}
              <AutoResizeTextarea value={item.value} onChange={...} />
              {/* Delete button */}
            </div>
          ))}
          <button>+ Add Row</button>
        </div>
      </div>
    )}
  </div>
))}
```

#### 3d. Add Custom Section Expansion State

```tsx
const [expandedCustomSections, setExpandedCustomSections] = useState<Record<string, boolean>>({});
```

---

## Color Reference

- **Hardcoded sections header**: `bg-[#4a5f7f]` (slate blue)
- **Custom sections header**: `bg-blue-900/40` with `border-blue-500/20` (dark navy blue - matches your screenshot)
- **Container background**: `bg-[#2a2a2f]` (dark charcoal)
- **Inner content area**: `bg-[#3a3a3f]/30` (recessed gray)

---

## Visual Result

**Chat Modal After Changes:**
- All text fields wrap long content instead of clipping
- No Tags field
- Controlled By + Character Type appear inside Avatar section
- Each custom category has its own dark-themed container with editable header

**Scenario Builder After Changes:**
- All hardcoded input fields wrap text
- Custom sections use dark theme matching chat modal
- Each custom section has collapsible header with editable title input
- Consistent styling between both interfaces
