

# Image Library Folder Card Border Color Test

## What's changing

On the Image Library page only, change the folder tile card border from its current silver/white (`border-slate-200`) to the slate blue color (`#4a5f7f`) used as the brand accent throughout the app (e.g., the active filter pill, the "brand" button variant).

## Technical Details

**File:** `src/components/chronicle/ImageLibraryTab.tsx`, line 423

**Current:**
```
border border-slate-200
```

**New:**
```
border border-[#4a5f7f]
```

This is a single class swap on one line. No other pages or components are touched -- this is an isolated test so we can evaluate the color on the black background before rolling it out elsewhere.

