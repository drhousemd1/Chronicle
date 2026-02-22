

# Remove Outer Wrapper -- Individual Conversation Cards

## What Changes

Remove the outer container card (`bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f]`) that wraps all conversations. Instead, each conversation entry sits directly on the black page background with its own navy blue border and black spacing between entries.

## Single File: `src/components/chronicle/ConversationsTab.tsx`

### 1. Remove the outer card wrapper (lines 37, 164)
Delete the `<div className="bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] ...">` wrapper. The `max-w-4xl mx-auto py-4` container stays for centering/padding.

### 2. Conversation list container
Change from `<div className="p-3 space-y-3">` to `<div className="space-y-4">` -- no padding (entries go edge-to-edge within max-w), slightly more spacing for visible black gaps between cards.

### 3. Each entry already has the right styling
The per-entry div already has `bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f]` -- this now sits directly on the black background instead of being nested inside another identical card.

### 4. Empty state
Wrap the empty state in its own card with the navy blue border so it still looks intentional.

### 5. Load More button
Moves outside the removed wrapper, sits below the list with some vertical spacing.

### Visual Result

```text
black background
|                                                    |
| +--[ #4a5f7f border, bg-#2a2a2f ]--- entry 1 ---+ |
| |  inner card with title, buttons, preview       | |
| +------------------------------------------------+ |
|                                                    |
|        (black gap -- space-y-4)                    |
|                                                    |
| +--[ #4a5f7f border, bg-#2a2a2f ]--- entry 2 ---+ |
| |  inner card with title, buttons, preview       | |
| +------------------------------------------------+ |
|                                                    |
|              [ Load More ]                         |
```

Each entry is its own standalone card with the navy blue border directly visible against the black page background, with black breathing room between them.
