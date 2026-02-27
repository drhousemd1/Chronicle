

## Fix Character Roster Card Styling and Metadata Format

### Problem
1. **Inconsistent metadata format** -- The sex/age line dumps raw field values joined by a dot separator. Since `sexType` sometimes contains species info (e.g., "Female Human", "Male Human", "Male"), the display is inconsistent. The user wants explicit labels: `Sex: [value]` and `Age: [value]`.
2. **Wrong color scheme** -- Cards are light-themed (`bg-slate-50`, dark text, `border-slate-100`). User wants dark cards with white text and a slate blue border.

### Changes

**File: `src/components/chronicle/WorldTab.tsx`** -- `CharacterButton` component (lines 64-87)

**1. Dark card styling**
- Container: `bg-slate-50 hover:bg-white border-slate-100 hover:border-slate-200` changes to `bg-black/80 hover:bg-black border-[#4a5f7f] hover:border-[#6b82a8]`
- Avatar border: `border-slate-100` changes to `border-[#4a5f7f]`
- Avatar fallback bg: `bg-slate-50` changes to `bg-zinc-800`, fallback text from `text-slate-300` to `text-slate-400`
- Name text: `text-slate-800 group-hover:text-blue-600` changes to `text-white group-hover:text-blue-300`
- ControlledBy text: `text-slate-400` changes to `text-slate-400` (keeps as-is, readable on dark)

**2. Labeled metadata format**
Replace the raw joined string with explicit labels:
```
{char.sexType && <span>Sex: {char.sexType}</span>}
{char.sexType && char.age && <span> · </span>}
{char.age && <span>Age: {char.age}</span>}
```
- Style: `text-[10px] text-slate-400 truncate`
- This ensures consistent "Sex: Female · Age: 16" format, and gracefully omits missing fields without dangling separators.

