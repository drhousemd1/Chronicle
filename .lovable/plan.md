

# Update Review Bubble Color to Match Chat Message Bubbles

## Problem
The review bubble in the Story Detail Modal uses `bg-ghost-white border-ghost-white` — a unique one-off color. It should reuse the same dark surface color as the chat message bubbles to maintain palette consistency.

## Change

**File: `src/components/chronicle/StoryDetailModal.tsx` (line 609)**

Replace:
```
bg-ghost-white border border-ghost-white
```

With:
```
bg-[#1c1f26] border border-ghost-white
```

This matches the chat message bubble background (`bg-[#1c1f26]`) from `ChatInterfaceTab.tsx` line 3554, keeping the existing ghost-white border for subtle definition.

