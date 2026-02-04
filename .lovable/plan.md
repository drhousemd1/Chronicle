

# Update HintBox Styling to Match Dark Theme

## Overview

Update the HintBox component to blend better with the dark container styling:
- Make the box background match the darker inner padding area
- Make the text color more subtle, matching the label text like "Hair Color", "Eye Color"

---

## Current State

```tsx
const HintBox: React.FC<{ hints: string[] }> = ({ hints }) => (
  <div className="bg-slate-900 rounded-xl p-4 space-y-2">
    {hints.map((hint, index) => (
      <p key={index} className="text-sm text-white leading-relaxed flex items-start gap-2">
        <span className="text-white mt-0.5">◆</span>
        <span>{hint}</span>
      </p>
    ))}
  </div>
);
```

**Issues:**
- `bg-slate-900` is too opaque/solid compared to the surrounding `bg-[#3a3a3f]/30`
- `text-white` is too bright/dominating

---

## Target State

| Element | Current | Updated |
|---------|---------|---------|
| Box Background | `bg-slate-900` | `bg-[#2a2a2f]/50` (transparent dark) |
| Text Color | `text-white` | `text-zinc-400` (muted like labels) |
| Diamond Icon | `text-white` | `text-zinc-500` (slightly dimmer) |

---

## Changes

**File:** `src/components/chronicle/WorldTab.tsx` (lines 40-48)

```tsx
const HintBox: React.FC<{ hints: string[] }> = ({ hints }) => (
  <div className="bg-[#2a2a2f]/50 rounded-xl p-4 space-y-2 border border-white/5">
    {hints.map((hint, index) => (
      <p key={index} className="text-sm text-zinc-400 leading-relaxed flex items-start gap-2">
        <span className="text-zinc-500 mt-0.5">◆</span>
        <span>{hint}</span>
      </p>
    ))}
  </div>
);
```

---

## Visual Result

- **Box**: Semi-transparent dark background that blends with the container padding
- **Text**: Muted zinc-400 color matching "Hair Color", "Eye Color" labels
- **Diamond**: Slightly dimmer zinc-500 for subtle accent
- **Border**: Optional subtle `border-white/5` for definition

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chronicle/WorldTab.tsx` | Update HintBox styling (lines 40-48) |

