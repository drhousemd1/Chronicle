

# Update Story Detail Modal to Builder Container Pattern

## Problem
The Story Detail Modal (image 1) uses an older visual treatment — darker `bg-[#121214]` outer shell with a `border-[#4a5f7f]` border and `rounded-[32px]`. The target (image 2) follows the standard builder container pattern: `bg-[#2a2a2f]`, `rounded-[24px]`, borderless with a multi-layered shadow stack.

## Changes — `src/components/chronicle/StoryDetailModal.tsx`

### 1. Outer modal shell (line 236)

**Current:**
```
bg-[#121214] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#4a5f7f]
```

**New (builder container pattern):**
```
bg-[#2a2a2f] rounded-[24px] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]
```

Remove the `border border-[#4a5f7f]` — the builder container pattern uses the shadow stack for elevation, not borders.

### 2. Cover image placeholder background (line 250)

**Current:** `bg-[#2a2a2f]` — same as new outer shell, will be invisible.

**New:** `bg-[#2e2e33]` — use the inner-card surface to maintain visual separation.

### 3. Right column border (line 378)

**Current:** `md:border-l border-[#4a5f7f]`

This internal structural border is correct per the border spec — keep it.

## Summary
Two styling changes in one file. The outer shell adopts the borderless `bg-[#2a2a2f]` builder container pattern with the standard shadow stack, and the inner cover placeholder uses `bg-[#2e2e33]` for contrast.

