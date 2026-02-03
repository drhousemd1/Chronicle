

# Fix Blue Color to Match "+ Add Milestone Step" Visual Appearance

## The Problem

Your wife is absolutely right. The same Tailwind class `blue-400` looks completely different as text vs. background:

| Usage | Appearance |
|-------|------------|
| `text-blue-400` on dark background | Muted, soft blue-gray (Image 1) |
| `bg-blue-400` as solid fill | Bright, vibrant blue (Image 2) |

This is because text appears thinner and blends with the dark background, while a solid background fill shows the full saturation of the color.

---

## Solution

Use a custom hex color that matches the **visual appearance** of the "+ Add Milestone Step" text when used as a background. Based on Image 1, this is approximately `#5a7a9e` or `#6b8aae` - a desaturated, slate-blue tone.

---

## Changes

### 1. Active Sidebar Item

**File:** `src/pages/Index.tsx` (line 63)

```tsx
// Current (too bright)
"bg-blue-400 shadow-lg shadow-black/40 text-white"

// Updated (muted blue matching Image 1)
"bg-[#6b8aae] shadow-lg shadow-black/40 text-white"
```

### 2. "C" Logo - Loading State

**File:** `src/pages/Index.tsx` (line 927)

```tsx
// Current
bg-blue-400 ... shadow-blue-400/30

// Updated
bg-[#6b8aae] ... shadow-[#6b8aae]/30
```

### 3. "C" Logo - Header

**File:** `src/pages/Index.tsx` (line 946)

```tsx
// Current
bg-blue-400 ... shadow-blue-400/30

// Updated
bg-[#6b8aae] ... shadow-[#6b8aae]/30
```

### 4. "Save Scenario" Button (brand variant)

**File:** `src/components/chronicle/UI.tsx` (line 17)

```tsx
// Current
brand: "bg-blue-400 text-white border-blue-400 hover:bg-blue-300 ..."

// Updated
brand: "bg-[#6b8aae] text-white border-[#6b8aae] hover:bg-[#7d9abc] ..."
```

---

## Color Reference

| Element | Hex | Description |
|---------|-----|-------------|
| Base | `#6b8aae` | Muted slate-blue, matches Image 1 visual tone |
| Hover | `#7d9abc` | Slightly lighter for hover states |
| Shadow | `#6b8aae` with `/30` opacity | Matching glow effect |

---

## Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/pages/Index.tsx` | 63 | Change `bg-blue-400` to `bg-[#6b8aae]` |
| `src/pages/Index.tsx` | 927 | Change logo `bg-blue-400` to `bg-[#6b8aae]`, shadow to `shadow-[#6b8aae]/30` |
| `src/pages/Index.tsx` | 946 | Change logo `bg-blue-400` to `bg-[#6b8aae]`, shadow to `shadow-[#6b8aae]/30` |
| `src/components/chronicle/UI.tsx` | 17 | Change brand variant to use `#6b8aae` base with `#7d9abc` hover |

---

## Visual Result

The logo, active sidebar, and Save button will now have a muted, desaturated blue that visually matches the soft blue-gray appearance of the "+ Add Milestone Step" text, rather than the overly bright Tailwind blue-400.

