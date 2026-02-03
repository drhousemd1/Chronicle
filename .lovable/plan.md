

# Match Buttons to Container Header Blue Color

## The Color

The container headers (like "Avatar", "Character Goals") use:
- **Background:** `#4a5f7f` (steel blue)

For hover states, I'll use a slightly lighter version: `#5a6f8f`

---

## Changes

### 1. Active Sidebar Item

**File:** `src/pages/Index.tsx` (line 63)

```tsx
// Current
"bg-[#60A5FA] shadow-lg shadow-black/40 text-white"

// Updated
"bg-[#4a5f7f] shadow-lg shadow-black/40 text-white"
```

### 2. "C" Logo - Loading State

**File:** `src/pages/Index.tsx` (line 927)

```tsx
// Current
bg-[#60A5FA] ... shadow-[#60A5FA]/30

// Updated
bg-[#4a5f7f] ... shadow-[#4a5f7f]/30
```

### 3. "C" Logo - Header

**File:** `src/pages/Index.tsx` (line 946)

```tsx
// Current
bg-[#60A5FA] ... shadow-[#4a5f7f]/30

// Updated
bg-[#4a5f7f] ... shadow-[#4a5f7f]/30
```

### 4. "Save Scenario" Button (brand variant)

**File:** `src/components/chronicle/UI.tsx` (line 17)

```tsx
// Current
brand: "bg-[#60A5FA] text-white border-[#60A5FA] hover:bg-[#93C5FD] ..."

// Updated
brand: "bg-[#4a5f7f] text-white border-[#4a5f7f] hover:bg-[#5a6f8f] ..."
```

---

## Color Reference

| State | Hex | Description |
|-------|-----|-------------|
| Base | `#4a5f7f` | Steel blue (matches header backgrounds) |
| Hover | `#5a6f8f` | Slightly lighter for hover states |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Lines 63, 927, 946 - replace `#60A5FA` with `#4a5f7f` |
| `src/components/chronicle/UI.tsx` | Line 17 - replace `#60A5FA` with `#4a5f7f`, `#93C5FD` with `#5a6f8f` |

