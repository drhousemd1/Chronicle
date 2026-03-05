

## Plan: Redesign Chat History Row Layout

**Goal:** Make the conversation thumbnail significantly larger and reflow the layout so all text content sits to the right of the image, not below it.

### Current layout:
```text
[48x48 img] [Title  💬 count • date] [✏ 🗑]
            [Last message preview........]
```

### New layout:
```text
┌────────────┬──────────────────────────────────┐
│            │ Title   💬 count • date    [✏][🗑]│
│   Image    │                                   │
│  96x96     │ Last message preview...            │
│            │                                   │
└────────────┴──────────────────────────────────┘
```

### Changes

**File: `src/components/chronicle/ConversationsTab.tsx`**

1. **Increase thumbnail size** — from `w-12 h-12` to `w-24 h-24` (96px)
2. **Restructure the row layout** — move the last message preview into the right-side content area instead of being a separate row below
3. **Stack title row and preview vertically** to the right of the image, with action buttons top-right
4. **Widen the list container** — from `max-w-4xl` to `max-w-5xl`

**1 file to update.** Pure layout/styling change, no logic changes.

