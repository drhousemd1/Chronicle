
# Add Collapsible Chevron to Character Section Headers

## What Changes

Add a small chevron arrow (V) to the right side of both the "Main Characters" and "Side Characters" headers. Clicking it toggles visibility of the character cards below.

- **Default state:** Chevron points down, cards visible
- **Collapsed state:** Chevron points up, cards hidden with a smooth slide-up animation
- **Headers stay fixed in place** -- only the card content collapses

## Technical Details

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

1. **Add two state variables** near the top of the component:
   ```tsx
   const [mainCharsCollapsed, setMainCharsCollapsed] = useState(false);
   const [sideCharsCollapsed, setSideCharsCollapsed] = useState(false);
   ```

2. **Update both `<h3>` headers** (lines 2688 and 2713) to be clickable with a ChevronDown icon on the right that rotates 180deg when collapsed:
   ```tsx
   <h3
     className="flex-shrink-0 text-[11px] font-bold text-white bg-[#4a5f7f] px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none"
     onClick={() => setMainCharsCollapsed(prev => !prev)}
   >
     Main Characters
     <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mainCharsCollapsed ? 'rotate-180' : ''}`} />
   </h3>
   ```

3. **Wrap each ScrollableSection** in a collapsible container with a CSS transition for a smooth collapse effect:
   ```tsx
   <div className={`transition-all duration-300 ease-in-out overflow-hidden ${mainCharsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
     <ScrollableSection ...>
       ...
     </ScrollableSection>
   </div>
   ```

This gives a nice slide-up/fade effect when collapsing without touching any of the existing card layout, stacking, or display logic. The `ChevronDown` icon from lucide-react (already imported in the file) handles the visual indicator.
