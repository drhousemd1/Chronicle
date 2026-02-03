

# Match Buttons to Exact "+ Add Milestone Step" Color

## The Fix

Change all three elements from the custom hex `#6b8aae` to the **exact** Tailwind `blue-400` color (`#60A5FA`).

---

## Changes

### 1. Active Sidebar Item

**File:** `src/pages/Index.tsx` (line 63)

```tsx
// Current
"bg-[#6b8aae] shadow-lg shadow-black/40 text-white"

// Updated
"bg-[#60A5FA] shadow-lg shadow-black/40 text-white"
```

### 2. "C" Logo - Loading State

**File:** `src/pages/Index.tsx` (line 927)

```tsx
// Current
bg-[#6b8aae] ... shadow-[#6b8aae]/30

// Updated
bg-[#60A5FA] ... shadow-[#60A5FA]/30
```

### 3. "C" Logo - Header

**File:** `src/pages/Index.tsx` (line 946)

```tsx
// Current
bg-[#6b8aae] ... shadow-[#6b8aae]/30

// Updated
bg-[#60A5FA] ... shadow-[#60A5FA]/30
```

### 4. "Save Scenario" Button (brand variant)

**File:** `src/components/chronicle/UI.tsx` (line 17)

```tsx
// Current
brand: "bg-[#6b8aae] text-white border-[#6b8aae] hover:bg-[#7d9abc] ..."

// Updated (using #93C5FD for hover to match blue-300)
brand: "bg-[#60A5FA] text-white border-[#60A5FA] hover:bg-[#93C5FD] ..."
```

---

## Color Reference

| State | Hex | Tailwind Equivalent |
|-------|-----|---------------------|
| Base | `#60A5FA` | blue-400 |
| Hover | `#93C5FD` | blue-300 |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Lines 63, 927, 946 - replace `#6b8aae` with `#60A5FA` |
| `src/components/chronicle/UI.tsx` | Line 17 - replace `#6b8aae` with `#60A5FA`, `#7d9abc` with `#93C5FD` |

