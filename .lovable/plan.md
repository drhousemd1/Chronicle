

# Add Two-Level Hierarchy: "Profile" + "Avatar"

## Overview

Add a black "Profile" column header above the left column to align with "Character Traits" on the right, while keeping "Avatar" as the blue section header inside the panel.

---

## Current Structure (lines 328-334)

```
<div className="space-y-6 lg:sticky ...">     <!-- left column wrapper -->
  <div className="w-full bg-[#2a2a2f] ...">   <!-- Avatar panel starts immediately -->
    <div className="bg-[#4a5f7f] ...">        <!-- Blue section header -->
      <span>Section</span>
      <h2>Avatar</h2>
    </div>
    ...
  </div>
</div>
```

## Target Structure

```
<div className="space-y-6 lg:sticky ...">     <!-- left column wrapper -->
  <div className="flex justify-between items-center h-9">  <!-- NEW: Black column header -->
    <h2 className="text-xl font-bold text-slate-900">Profile</h2>
  </div>
  <div className="w-full bg-[#2a2a2f] ...">   <!-- Avatar panel -->
    <div className="bg-[#4a5f7f] ...">        <!-- Blue section header -->
      <span>Section</span>
      <h2>Avatar</h2>                          <!-- Keeps "Avatar" -->
    </div>
    ...
  </div>
</div>
```

---

## Technical Changes

### File: `src/components/chronicle/CharactersTab.tsx`

**Insert new header at line 329** (before the Avatar panel div):

```tsx
<div className="flex justify-between items-center h-9">
  <h2 className="text-xl font-bold text-slate-900">Profile</h2>
</div>
```

This mirrors the exact structure used for "Character Traits" at line 537-539:
```tsx
<div className="flex justify-between items-center h-9">
  <h2 className="text-xl font-bold text-slate-900">Character Traits</h2>
</div>
```

---

## Visual Result

After this change:

| Left Column | Right Column |
|-------------|--------------|
| **Profile** (black, h-9) | **Character Traits** (black, h-9) |
| Avatar Panel with blue "Avatar" header | Trait sections with blue headers |

The two columns will be properly aligned, with matching black headers at the same height, and the panel hierarchy will be clear:
- **Profile** = the overall category for the left column
- **Avatar** = the specific section containing the character image and controls

