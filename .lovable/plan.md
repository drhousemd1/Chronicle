

# Restyle Conversations Tab to Match App Design Language

## Overview

The Conversations tab currently has a flat, unstyled black-on-black look that feels disconnected from the rest of the app. This plan restyls it to match the layered dark-card aesthetic used in the Character Builder and Scenario Builder pages.

## Changes (single file: `src/components/chronicle/ConversationsTab.tsx`)

### 1. Outer wrapper -- slate blue border card
Wrap the entire conversation list in a card container matching the app's standard:
- `bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- This gives the list the same visual weight as character/scenario builder sections

### 2. Each conversation row -- subtle card layering
Replace the current flat `hover:bg-white/5` rows with layered card-style rows:
- Background: `bg-[#3a3a3f]/30` with `rounded-xl` and `border border-white/5`
- Add small margin between rows instead of dividers (`space-y-2` on container, remove `divide-y`)
- Hover: `hover:bg-[#3a3a3f]/60` for a visible lift effect
- Padding inside each row card

### 3. Last message preview -- darker inset field
Style the last message text to look like a read-only text field:
- Wrap in a container with `bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-1.5`
- This creates the "darker input area" look that differentiates it from the card background, matching how text fields look in the character builder

### 4. Action buttons -- styled like app buttons
Replace the bare icon buttons with the app's standard button styling:
- Use `bg-zinc-900/50 border border-white/10 rounded-lg` background on each button
- Keep hover states: rename gets `hover:border-blue-500/30 hover:text-blue-400`, delete gets `hover:border-red-500/30 hover:text-red-400`
- Slightly larger hit targets with proper padding

### 5. Empty state
Update the empty state to sit inside the same card container for consistency, with text colors adjusted to match the dark card background.

### 6. Load More button
Already uses the Shadow Surface style -- no changes needed.

## Visual Result

```text
+--[ #4a5f7f border ]-------------------------------+
|  bg-[#2a2a2f] outer card                          |
|                                                    |
|  +--[ white/5 border ]---------------------------+ |
|  | bg-[#3a3a3f]/30 row card                      | |
|  | [thumb] Title  msgs  date     [edit] [delete] | |
|  | +--[ bg-zinc-900/50 message preview --------+ | |
|  | | "Last message text..."                     | | |
|  | +-------------------------------------------+ | |
|  +-----------------------------------------------+ |
|                                                    |
|  +--[ white/5 border ]---------------------------+ |
|  | (next conversation row)                       | |
|  +-----------------------------------------------+ |
|                                                    |
|            [ Load More ]                           |
+----------------------------------------------------+
```

This matches the layered depth pattern: outer card (dark gray + brand border) contains inner row cards (slightly lighter) which contain inset fields (darkest), creating the same visual hierarchy seen throughout the character and scenario builders.

