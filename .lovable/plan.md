

# Restyle Conversations Tab -- Correct Layering

## Problem

The current styling gets the layering direction wrong. In this app, elements stack **lighter as they elevate** (dark base -> lighter cards -> lighter buttons). The current implementation makes buttons darker than the card they sit on, and each conversation entry lacks the navy blue border that other sections use.

## The App's Layering Pattern (from CharactersTab)

```text
Level 0: Page background (black)
Level 1: Outer card -- bg-[#2a2a2f], border border-[#4a5f7f]
Level 2: Inner content card -- bg-[#3a3a3f]/30, border border-white/5 (LIGHTER)
Level 3: Buttons/actions -- bg-white/5 or similar (LIGHTER still)
Level 4: Input fields -- bg-zinc-900/50 (goes DARK, creating an inset/recessed look)
```

Buttons elevate (lighter). Inputs recess (darker). The current code has buttons at zinc-900 (dark/recessed) when they should be elevated.

## Changes (single file: `src/components/chronicle/ConversationsTab.tsx`)

### 1. Each conversation entry -- add navy blue border and proper inner card

Currently each row is:
```
bg-[#3a3a3f]/30 rounded-xl border border-white/5
```

Change to a proper two-layer structure matching CharactersTab sections:
- Outer entry wrapper: `bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] overflow-hidden` (the navy blue border the user is asking for)
- Inner content area: wrapped in `p-4` then `bg-[#3a3a3f]/30 rounded-2xl border border-white/5 p-4` (the lighter elevated card for title/date/message count)

### 2. Action buttons -- lighter, not darker

Currently:
```
bg-zinc-900/50 border border-white/10
```

Change to elevated style:
```
bg-white/10 border border-white/10 hover:bg-white/15
```

This makes them visibly lighter than the card they sit on, matching how buttons appear elsewhere in the app.

### 3. Title/meta row -- sits on the elevated inner card

The scenario title, message count, and date will be inside the `bg-[#3a3a3f]/30` inner card, giving them visual elevation from the base `#2a2a2f` background.

### 4. Last message preview -- stays dark (inset/recessed)

The `bg-zinc-900/50` message preview is correct -- inputs and read-only fields go darker to create a recessed look. This stays as-is but moves inside the inner card structure.

### 5. Visual result

```text
+--[ #4a5f7f border, bg-#2a2a2f ]--- entry --------+
|  p-4                                               |
|  +--[ white/5 border, bg-#3a3a3f/30 ]-- inner ---+|
|  | [thumb] Title  msgs  date  [edit] [delete]     ||
|  |                            (lighter bg)        ||
|  | +--[ bg-zinc-900/50 message preview ]--------+ ||
|  | | "Last message text..." (darker/recessed)   | ||
|  | +-------------------------------------------+ ||
|  +-----------------------------------------------+|
+----------------------------------------------------+

+--[ #4a5f7f border ]--- next entry -----------------+
|  ...                                                |
+-----------------------------------------------------+
```

Each conversation entry now mirrors the section pattern from CharactersTab: navy blue bordered outer shell, lighter inner content card, with recessed dark fields for text content.

## Technical Details

- File: `src/components/chronicle/ConversationsTab.tsx`
- The outer list card (`bg-[#2a2a2f] border-[#4a5f7f]`) remains as the page-level container
- Each row becomes its own mini-section with the same border treatment
- Button classes change from `bg-zinc-900/50` to `bg-white/10` for proper elevation
- `space-y-3` between entries for breathing room
- Thumbnail border stays `border-[#4a5f7f]` as it already matches

