

# Fix Missing Inner Container in HardcodedSection

## Problem

The "Preferred Clothing" section is missing the inner card wrapper that creates the two-layer visual depth seen in Character Goals:

| Character Goals | Preferred Clothing (Current) |
|-----------------|------------------------------|
| Outer bg: `#2a2a2f` | Outer bg: `#2a2a2f` |
| Inner card: `#3a3a3f/30` with rounded-2xl | ❌ Missing - inputs go directly in outer container |
| Two-layer padding creates depth | Single layer - content touches container edges |

## Solution

Wrap the `{children}` content in HardcodedSection with an inner container matching Character Goals:

```tsx
<div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
  {children}
</div>
```

---

## Technical Changes

### File: `src/components/chronicle/CharactersTab.tsx`

**Current (lines 36-40):**
```tsx
{/* Content */}
<div className="p-5 space-y-4">
  {children}
</div>
```

**Updated:**
```tsx
{/* Content */}
<div className="p-5 space-y-4">
  {/* Inner card for visual depth */}
  <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
    <div className="space-y-4">
      {children}
    </div>
  </div>
</div>
```

---

## Visual Result

After this change, the Preferred Clothing section will have:
- **Outer container**: Dark charcoal `#2a2a2f` with rounded-[24px] corners
- **Outer padding**: `p-5` creates gap between header and inner card
- **Inner card**: Slightly lighter `#3a3a3f/30` with rounded-2xl and subtle border
- **Inner padding**: `p-5 pb-6` creates space around the input fields

This matches the Character Goals structure exactly, creating the same two-layer depth effect.

