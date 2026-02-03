

# Change Blue Color to Match "+ Add Milestone Step"

## Overview

Update three UI elements to use the same blue color (`blue-400`) as the "+ Add Milestone Step" link text, replacing the current `blue-600` which is a darker/more saturated blue.

---

## Color Comparison

| Element | Current | Target |
|---------|---------|--------|
| "+ Add Milestone Step" | `text-blue-400` | (reference color) |
| "C" Logo | `bg-blue-600` | `bg-blue-400` |
| Active sidebar items | `bg-blue-600` | `bg-blue-400` |
| "Save Scenario" button | `bg-blue-600` | `bg-blue-400` |

The `blue-400` hex value is approximately `#60a5fa` - a softer, lighter blue.

---

## Changes

### 1. "C" Logo (2 locations)

**File:** `src/pages/Index.tsx`

**Loading state (line 927):**
```tsx
// Current
bg-blue-600 ... shadow-blue-500/30

// Updated
bg-blue-400 ... shadow-blue-400/30
```

**Header logo (line 946):**
```tsx
// Current  
bg-blue-600 ... shadow-blue-500/30

// Updated
bg-blue-400 ... shadow-blue-400/30
```

---

### 2. Active Sidebar Item State

**File:** `src/pages/Index.tsx` (lines 62-63)

```tsx
// Current
const activeClasses = active 
  ? "bg-blue-600 shadow-lg shadow-black/40 text-white" 
  : "...";

// Updated
const activeClasses = active 
  ? "bg-blue-400 shadow-lg shadow-black/40 text-white" 
  : "...";
```

This affects the "Scenario Builder" sidebar button when active.

---

### 3. "Save Scenario" Button (brand variant)

**File:** `src/components/chronicle/UI.tsx` (line 17)

```tsx
// Current
brand: "bg-blue-600 text-white border-blue-600 hover:bg-blue-500 shadow-md hover:shadow-lg",

// Updated
brand: "bg-blue-400 text-white border-blue-400 hover:bg-blue-300 shadow-md hover:shadow-lg",
```

Note: Hover state also updated from `blue-500` to `blue-300` to maintain the "lighter on hover" pattern.

---

## Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/pages/Index.tsx` | 927 | Update loading logo `bg-blue-600` to `bg-blue-400`, shadow to `shadow-blue-400/30` |
| `src/pages/Index.tsx` | 946 | Update header logo `bg-blue-600` to `bg-blue-400`, shadow to `shadow-blue-400/30` |
| `src/pages/Index.tsx` | 63 | Update active sidebar `bg-blue-600` to `bg-blue-400` |
| `src/components/chronicle/UI.tsx` | 17 | Update brand variant `bg-blue-600` to `bg-blue-400`, `border-blue-600` to `border-blue-400`, hover `bg-blue-500` to `bg-blue-300` |

---

## Visual Result

All three elements (logo, active sidebar, save button) will now use the same softer blue (`#60a5fa`) that matches the "+ Add Milestone Step" text, creating a more cohesive color scheme.

