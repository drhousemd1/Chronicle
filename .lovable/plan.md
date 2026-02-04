
# Add Header Title for Community Gallery Tab

## Problem

The Community Gallery tab is missing a header bar with a title. Other tabs like "Your Stories", "Image Library", and "Chat History" all have header titles displayed, but the gallery tab does not.

---

## Solution

Add a conditional header title for the gallery tab, matching the styling pattern used by other tabs.

---

## Changes

### File: `src/pages/Index.tsx`

**Location:** Around line 1113-1117 (after the image_library header and before the closing `</div>`)

Add a new conditional block for the gallery tab header:

```tsx
{tab === "image_library" && (
  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
    Image Library
  </h1>
)}
{tab === "gallery" && (
  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
    Community Gallery
  </h1>
)}
```

---

## Result

The Community Gallery tab will now display a header title "COMMUNITY GALLERY" in the same uppercase, bold styling as all other tabs, providing visual consistency across the application.
