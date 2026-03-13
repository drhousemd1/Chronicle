

# Fix Header Title on Character Builder Page

## Problem
The header at line 1717-1718 shows "Story Builder" for both the World tab and the Characters tab. When on the Character Builder page (`tab === "characters"`), it should display "Character Builder" instead.

## Change — Single File: `src/pages/Index.tsx`

**Line 1717-1718**: Change the static "Story Builder" text to a conditional expression:

```tsx
<h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
  {tab === "characters" ? "Character Builder" : "Story Builder"}
</h1>
```

This checks if the current tab is "characters" and shows "Character Builder", otherwise shows "Story Builder" (for the world tab and any future tabs that share this header).

No other changes needed.

