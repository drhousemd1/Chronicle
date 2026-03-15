

## Plan: Add collapsible toggle to Main Characters and Side Characters headers

**What changes**: Add a ChevronDown arrow to each roster header that toggles visibility of the character tiles below it, matching the pattern already used on the chat interface page.

**Single file**: `src/components/chronicle/WorldTab.tsx`

### 1. Add state variables
Add two `useState` booleans near the top of the component:
```tsx
const [mainCharsCollapsed, setMainCharsCollapsed] = useState(false);
const [sideCharsCollapsed, setSideCharsCollapsed] = useState(false);
```

### 2. Import ChevronDown
Add `ChevronDown` to the existing lucide-react import.

### 3. Update "Main Characters" header (line 624)
- Make the header a clickable element (`cursor-pointer select-none`)
- Add `flex items-center justify-between` to the title text div
- Add `<ChevronDown>` icon that rotates 180° when collapsed
- Wrap the character tiles div (line 628-633) in a collapsible container using `max-h` + `opacity` transition (same pattern as ChatInterfaceTab):
```tsx
<div className={`transition-all duration-300 ease-in-out overflow-hidden ${mainCharsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
```

### 4. Update "Side Characters" header (line 637)
Same treatment with `sideCharsCollapsed` state.

### Style details
- ChevronDown: `w-3.5 h-3.5 text-white/70 transition-transform duration-200`, rotates 180° when collapsed
- Header title div gets `flex items-center justify-between` and `cursor-pointer select-none`
- The chevron sits inside the `relative z-[1]` title div so it appears above the gloss sheen

