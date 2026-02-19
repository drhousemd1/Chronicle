

# Fix Admin Panel Navigation: Move Back Arrow to White Header

## Problem

The Image Generation tool inside the Admin panel has its own internal back-arrow header rendered inside the black content area. Every other page in the app (Scenario Builder, Image Library folders, Character Library) uses the standard chevron-left arrow in the white header bar next to the page title. This is inconsistent.

**Current (wrong):** White header says "ADMIN PANEL" with no arrow. Below it, a separate dark header bar has a left-arrow + "Image Generation Styles" title.

**Correct pattern (used everywhere else):** The chevron-left arrow appears in the white header bar, to the left of the page title. Clicking it navigates back. No secondary header inside the content area.

## Changes

### 1. `src/pages/Admin.tsx` -- Expose active tool state

Add a callback prop so `Index.tsx` can know whether the admin is viewing the hub or a tool, and can trigger "go back to hub":

- Export the current `activeTool` state and a `setActiveTool` setter via a ref or callback pattern
- Simplest approach: lift the active tool state into `Index.tsx` (add `adminActiveTool` state there) and pass it down as props to `AdminPage`

### 2. `src/pages/Index.tsx` -- Add chevron back arrow for admin tool views

In the admin header block (lines 1457-1461), add the same pattern used by Image Library (lines 1441-1456):

- When inside a tool (e.g. `adminActiveTool !== 'hub'`), show the chevron-left arrow button that resets `adminActiveTool` to `'hub'`
- The title stays "ADMIN PANEL" (matching how "IMAGE LIBRARY" stays the same when inside a folder)

```
Before:  ADMIN PANEL
After:   < ADMIN PANEL    (chevron only appears when inside a tool)
```

Uses the exact same SVG chevron and `p-2 hover:bg-slate-100 rounded-full transition-colors` classes as every other page.

### 3. `src/components/admin/ImageGenerationTool.tsx` -- Remove internal header

Remove the entire internal header section (lines 121-138):
- Remove the `flex-shrink-0 p-6 border-b border-white/10` header div
- Remove the `ArrowLeft` back button and the "Image Generation Styles" title/subtitle
- Remove the `onBack` prop entirely since navigation is now handled by the white header
- The component becomes just the scrollable content columns

## Technical Details

### State lifting in `Index.tsx`

Add state:
```tsx
const [adminActiveTool, setAdminActiveTool] = useState<string>('hub');
```

Reset to `'hub'` whenever switching away from the admin tab (in `handleNavigateAway` or the sidebar click).

Pass to AdminPage:
```tsx
<AdminPage activeTool={adminActiveTool} onSetActiveTool={setAdminActiveTool} />
```

### Header change in `Index.tsx`

Replace:
```tsx
{tab === "admin" && (
  <h1 className="...">Admin Panel</h1>
)}
```

With:
```tsx
{tab === "admin" && (
  <div className="flex items-center gap-2">
    {adminActiveTool !== 'hub' && (
      <button
        type="button"
        onClick={() => setAdminActiveTool('hub')}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
    )}
    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
      Admin Panel
    </h1>
  </div>
)}
```

### AdminPage prop changes

```tsx
interface AdminPageProps {
  activeTool: string;
  onSetActiveTool: (tool: string) => void;
}
```

Remove the internal `activeTool` state, use props instead.

### ImageGenerationTool cleanup

- Remove `onBack` prop from the interface
- Remove the entire header div (lines 121-138)
- The component starts directly with the scrollable columns content

## Files Modified

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Add `adminActiveTool` state, chevron back arrow in admin header, pass props to AdminPage, reset on tab change |
| `src/pages/Admin.tsx` | Accept `activeTool`/`onSetActiveTool` props instead of internal state |
| `src/components/admin/ImageGenerationTool.tsx` | Remove internal header and `onBack` prop |
