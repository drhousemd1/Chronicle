
# Project Planning

This file is used for planning upcoming features and implementations.

---

## Recently Completed

### Interface Settings Modal with Dynamic Text Toggle ✅

Implemented a full modal for interface settings using the Scenario Builder's light theme aesthetic (white background, clean typography). Added a "Dynamic Text" toggle that defaults ON for visual styling of dialogue/actions/thoughts, but can be turned OFF for a consistent white "book-style" reading experience.

**Files Modified:**
- `src/types.ts` - Added `dynamicText?: boolean` to uiSettings
- `src/utils.ts` - Added default value for dynamicText in both data functions
- `src/components/chronicle/ChatInterfaceTab.tsx` - Replaced popover with Dialog modal, updated FormattedMessage component

---

## Upcoming Features

(Add new feature plans here)
