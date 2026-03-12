

# Chat History Page: Slate Blue Borders + Red Delete Button

## Changes in `src/components/chronicle/ConversationsTab.tsx`

### 1. Borders → Solid Slate Blue (`border-[#4a5f7f]`)
All borders on this page will use `border-[#4a5f7f]` with no opacity:
- **Line 36** (empty state): already `border-[#4a5f7f]` ✓
- **Line 54** (outer card): already `border-[#4a5f7f]` ✓
- **Line 57** (inner content area): `border-ghost-white` → `border-[#4a5f7f]`
- **Line 62** (thumbnail): already `border-[#4a5f7f]` ✓
- **Line 124** (message preview box): `border-ghost-white` → `border-[#4a5f7f]`
- **Line 144** (Load More button): `border-[hsl(var(--ui-border))]` → `border-[#4a5f7f]`

### 2. Trash Button → Red Background + White Icon
**Line 109**: Change from ghost-white background with zinc icon to red background with white icon:
```
// FROM:
"p-2 rounded-lg bg-ghost-white border border-ghost-white text-zinc-400 hover:bg-white/15 hover:text-red-500 hover:border-red-500/30"

// TO:
"p-2 rounded-lg bg-red-500 border border-red-500 text-white hover:bg-red-600 hover:border-red-600"
```

One file, six border updates + one button restyle.

