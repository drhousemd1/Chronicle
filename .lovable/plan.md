

## Plan: Change Info Icon to Bright Toggle Blue

The toggle switches use `bg-blue-500` when active, and the "On" label uses `text-blue-500`. That same blue (`blue-500` = `#3b82f6`) would make the Info icon pop consistently with the existing interactive elements.

### Change in `src/components/chronicle/ChatInterfaceTab.tsx` (line 3770)

- Current: `text-[#4a5f7f]`
- Updated: `text-blue-500`

One class change, one line.

