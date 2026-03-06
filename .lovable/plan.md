
## Plan: Change Info Icon Color to Slate Blue for Consistency Testing

The user wants to test using the slate blue brand accent color (#4a5f7f) for the Info icon in the Chat Settings modal to see if it creates a more visually consistent appearance across different background colors throughout the app.

**File**: `src/components/chronicle/ChatInterfaceTab.tsx` (line 3770)

**Change**:
- Current: `<Info className="w-3.5 h-3.5 text-zinc-500 cursor-help" />`
- Updated: `<Info className="w-3.5 h-3.5 text-[#4a5f7f] cursor-help" />`

This replaces the neutral gray (`text-zinc-500`) with the application's slate blue brand accent color (`#4a5f7f`), which is currently used for story tile borders and gallery card accents.

**Outcome**: The icon will display in slate blue, making it stand out more and creating a consistent visual language with other branded elements. If the user likes this approach, the same color can be applied to all other hint icons throughout the application when replacing the hint block text areas.

One line changed. Simple color test.
