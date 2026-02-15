

# Send Button: Use Slate Blue When Active

## Change

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`, line 3132

Currently the send button uses the same dark surface color (`--ui-surface-2`) whether enabled or disabled, and just fades opacity when disabled. The user wants the enabled state to use the slate blue brand color (`#4a5f7f`) used across the app (section headers, search button, sort pills, etc.), while keeping the current muted look for the disabled state.

## Technical Details

Replace the static className on line 3132 with a conditional that switches styles based on whether input is present:

- **Disabled (no text):** Keep current look -- `bg-[hsl(var(--ui-surface-2))]`, muted text, reduced opacity
- **Enabled (has text):** `bg-[#4a5f7f] text-white border-[#4a5f7f] hover:bg-[#5a6f8f]` -- the same slate blue used in section headers and the Gallery search button

This avoids the harsh bright white and instead uses the consistent brand accent.

