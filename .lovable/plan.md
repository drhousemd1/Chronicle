

# Fix: Make Add Buttons More Visible with Black Border

## The Problem

The buttons still blend into the background because `border-slate-300` (light gray) on `bg-slate-50/50` (light gray) creates almost no visual contrast.

## Solution

Use a **black border by default** and **blue border on hover** for clear visibility:

---

## Files to Modify

| File | Change |
|------|--------|
| `CharactersTab.tsx` | Change `border-slate-300` to `border-slate-500` (darker gray/black) |
| `CharacterGoalsSection.tsx` | Change `border-slate-300` to `border-slate-500` (darker gray/black) |

---

## Technical Details

### CharactersTab.tsx (line 621)

From:
```jsx
className="... border-slate-300 bg-slate-50/50 ..."
```

To:
```jsx
className="... border-slate-500 bg-slate-50/50 ..."
```

### CharacterGoalsSection.tsx (line 229)

From:
```jsx
className="... border-slate-300 bg-slate-50/50 ..."
```

To:
```jsx
className="... border-slate-500 bg-slate-50/50 ..."
```

---

## Color Reference

| State | Border Color | Visual |
|-------|--------------|--------|
| Default | `border-slate-500` | Dark gray (almost black) |
| Hover | `border-blue-400` | Blue (already set) |

`slate-500` is `#64748b` - a medium-dark gray that provides strong contrast against the light background while not being harsh pure black.

If you want true black, I can use `border-slate-700` (`#334155`) or `border-slate-800` (`#1e293b`).

