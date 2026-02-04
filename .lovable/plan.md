

# Fix Community Gallery to Include Sidebar Navigation

## Problem

The Community Gallery page (`/gallery`) is a standalone page that doesn't include the left-hand sidebar navigation. When users click "Community Gallery" in the sidebar, they navigate to a completely separate page that loses the navigation context.

## Solution

Convert the Gallery from a separate route to a **tab within the main Index page**, just like "Your Stories", "Character Library", etc. This ensures consistent navigation across all sections.

---

## Changes

### 1. Add "gallery" as a New Tab Type

**File:** `src/pages/Index.tsx`

Add "gallery" to the tab type definition and render GalleryHub when that tab is active.

```tsx
// Add to tab state type (around line 66)
const [tab, setTab] = useState<"hub" | "library" | "image_library" | "world" | "characters" | "play" | "conversations" | "model_settings" | "gallery">("hub");
```

### 2. Update Sidebar Navigation Item

**File:** `src/pages/Index.tsx` (line 968)

Change from navigating to `/gallery` route to setting the tab:

```tsx
// Before
<SidebarItem active={false} label="Community Gallery" icon={<IconsList.Gallery />} onClick={() => navigate('/gallery')} collapsed={sidebarCollapsed} />

// After
<SidebarItem active={tab === "gallery"} label="Community Gallery" icon={<IconsList.Gallery />} onClick={() => { setActiveId(null); setTab("gallery"); setPlayingConversationId(null); }} collapsed={sidebarCollapsed} />
```

### 3. Add Gallery Tab Rendering in Main Content Area

**File:** `src/pages/Index.tsx` (in the main content render section)

Add a case for rendering the GalleryHub component when tab is "gallery":

```tsx
{tab === "gallery" && (
  <GalleryHub onPlay={handleGalleryPlay} />
)}
```

### 4. Add Gallery Play Handler

**File:** `src/pages/Index.tsx`

Add a handler function for when a user clicks Play on a gallery scenario:

```tsx
const handleGalleryPlay = (scenarioId: string, publishedScenarioId: string) => {
  // Handle playing a gallery scenario
  // Navigate to play tab with the scenario data
};
```

### 5. Import GalleryHub Component

**File:** `src/pages/Index.tsx`

Add import at top of file:

```tsx
import { GalleryHub } from '@/components/chronicle/GalleryHub';
```

### 6. Keep Gallery Route as Redirect (Optional)

**File:** `src/App.tsx`

Optionally keep the `/gallery` route but redirect to main page with gallery tab, or simply remove the route if no longer needed.

---

## Result

After this change:
- Clicking "Community Gallery" in the sidebar shows the gallery content in the main area
- The sidebar remains visible and functional
- Users can navigate between Gallery and other sections seamlessly
- The Gallery sidebar item will show as "active" when viewing the gallery

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add "gallery" to tab type, update SidebarItem onClick, add GalleryHub render case, import GalleryHub, add play handler |
| `src/App.tsx` | Optionally remove or redirect the `/gallery` route |

