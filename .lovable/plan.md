
# Add Black Borders to Main Containers

## The Problem

All the main containers have light gray borders (`border-slate-300`) or transparent borders with subtle rings that blend into the white/gray backgrounds, making everything look washed out and indistinct.

## Solution

Add visible black borders to the 5 main containers:

| Container | Current Border | New Border |
|-----------|---------------|------------|
| Character Goals | `border border-slate-300` | `border-2 border-slate-800` |
| Physical Appearance | `border border-slate-300` | `border-2 border-slate-800` |
| Currently Wearing | `border border-slate-300` | `border-2 border-slate-800` |
| Preferred Clothing | `border border-slate-300` | `border-2 border-slate-800` |
| Avatar Panel | `border-transparent ring-1 ring-slate-900/5` | `border-2 border-slate-800` |

Using `border-2` (2px) instead of `border` (1px) for more visual weight, and `border-slate-800` which is a near-black color (`#1e293b`).

---

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `CharactersTab.tsx` | 30 | Update HardcodedSection border (affects Physical Appearance, Currently Wearing, Preferred Clothing) |
| `CharactersTab.tsx` | 326 | Update Avatar Panel border |
| `CharacterGoalsSection.tsx` | 79 | Update Character Goals border |

---

## Technical Details

### CharactersTab.tsx - HardcodedSection (line 30)

This single change affects all 3 hardcoded sections (Physical Appearance, Currently Wearing, Preferred Clothing).

From:
```jsx
<Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border border-slate-300">
```

To:
```jsx
<Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border-2 border-slate-800">
```

### CharactersTab.tsx - Avatar Panel (line 326)

From:
```jsx
<Card className="p-6 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
```

To:
```jsx
<Card className="p-6 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-2 border-slate-800">
```

### CharacterGoalsSection.tsx - Goals Card (line 79)

From:
```jsx
<Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border border-slate-300">
```

To:
```jsx
<Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border-2 border-slate-800">
```

---

## Visual Result

Before (containers blend together):
```
┌────────────────────────────────────┐  ← barely visible light gray border
│  Physical Appearance               │
└────────────────────────────────────┘
```

After (clear container boundaries):
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ← visible black border
┃  Physical Appearance               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Summary

- Change `border border-slate-300` to `border-2 border-slate-800` on 3 files/locations
- This creates clear visual separation between all main containers
- The `slate-800` color is near-black while still being consistent with the slate color palette used throughout the app
