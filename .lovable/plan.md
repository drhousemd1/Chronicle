
# Implementation Plan: Four UI Fixes

## Overview

This plan addresses four distinct UI issues across the application:

1. **Scenario Builder - Cover Image AI Generate button**: Add an "AI Generate" button with a modal for generating cover images
2. **Chat History - Drop shadow**: Apply drop shadow styling to the session tiles container
3. **Chat Interface - Main character three dots visibility**: Make the three-dot menu visible on main character cards (not just side characters)
4. **Chat Interface - Message action button spacing**: Add spacing between action buttons and text content to prevent click collision

---

## Fix 1: Cover Image AI Generate Button

### Current State
The Cover Image section in the Scenario Builder (`WorldTab.tsx`) only has an "Upload Image" button. Users cannot generate AI cover images.

### Solution
Create a new `CoverImageGenerationModal` component (similar to `AvatarGenerationModal`) that:
- Accepts a prompt for the cover image
- Shows art style selection thumbnails (reusing `AVATAR_STYLES`)
- Requests images in portrait 2:3 aspect ratio (matching cover image requirements)
- Calls an edge function to generate the image

### Files to Modify/Create

| File | Changes |
|------|---------|
| `src/components/chronicle/CoverImageGenerationModal.tsx` | **NEW** - Modal component for AI cover image generation |
| `src/components/chronicle/WorldTab.tsx` | Add "AI Generate" button and modal state |
| `supabase/functions/generate-cover-image/index.ts` | **NEW** - Edge function for cover image generation |
| `supabase/config.toml` | Register the new edge function |

### UI Changes in WorldTab.tsx

Add button after "Upload Image" in the Cover Image section (around line 355):

```tsx
<Button 
  variant="primary" 
  onClick={() => setShowCoverGenModal(true)} 
  disabled={isGeneratingCover}
  className="!px-5"
>
  AI Generate
</Button>
```

### Modal Structure

The new modal will mirror `AvatarGenerationModal` with:
- Prompt text input
- Optional negative prompt (collapsible)
- Art style grid (5 styles with thumbnails)
- Generate button that calls the edge function

---

## Fix 2: Chat History Drop Shadow

### Current State
The session tiles container in `ConversationsTab.tsx` uses `shadow-sm` which is very subtle (line 35).

### Solution
Update the container styling to match the premium shadow used in Scenario Builder cards:
```
!shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)]
```

### File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ConversationsTab.tsx` | Update container shadow styling on line 35 |

### Code Change

Line 35, change:
```tsx
<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
```

To:
```tsx
<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5">
```

---

## Fix 3: Main Character Three Dots Visibility

### Current State
In `ChatInterfaceTab.tsx`, the three-dot menu for main characters (around line 1927-1944) is only rendered when the card is expanded (`isExpanded`), and uses light colors (`text-slate-400`).

In contrast, `SideCharacterCard.tsx` (lines 199-225) always renders the menu and uses darker colors (`text-slate-700`).

### Solution
Make the main character card menu:
1. Always visible (not just when expanded)
2. Use the same dark slate styling as side character cards

### File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Update `renderCharacterCard` function (lines 1927-1944) |

### Code Change

Move the dropdown menu outside the `{isExpanded && ...}` conditional and update styling:

```tsx
{/* Edit dropdown menu - always visible */}
<div className="absolute top-2 right-2">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg z-50">
      <DropdownMenuItem onClick={() => openCharacterEditModal(char)}>
        <Pencil className="w-4 h-4 mr-2" />
        Edit for this session
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

## Fix 4: Message Action Button Spacing

### Current State
The action buttons (Continue, Refresh, Edit menu) in message bubbles are positioned at `top-4 right-4` (line 2193), but there's no explicit spacing between them and the text content below. The text can flow too close to the buttons, causing click interference.

### Solution
Add a top padding/margin to the text content area to create clear separation from the action buttons. This mirrors the approach used for the Day/Time badge at the bottom (which uses absolute positioning with explicit bottom spacing).

### File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add top padding to message content area |

### Code Changes

1. Add a spacer/padding below the action buttons area by updating the message bubble's content wrapper. Around line 2186, modify the bubble div to include padding at the top:

```tsx
<div className={`p-8 pt-14 pb-12 rounded-[2rem] shadow-2xl flex flex-col gap-4 transition-all relative ${
```

This changes `p-8` to `p-8 pt-14`, creating 56px of top padding (compared to 32px previously) to ensure the action buttons (positioned at `top-4`) have clear separation from the content.

2. Apply the same change to the streaming message bubble (around line 2395):

```tsx
<div className={`p-8 pt-14 pb-12 rounded-[2rem] border shadow-2xl flex flex-col gap-4 ${
```

---

## Summary of Changes

| Issue | File(s) | Type of Change |
|-------|---------|----------------|
| Cover Image AI Generate | `WorldTab.tsx`, new modal, new edge function | Feature addition |
| Chat History drop shadow | `ConversationsTab.tsx` | Styling update |
| Main character three dots | `ChatInterfaceTab.tsx` | Visibility + styling fix |
| Button spacing in bubbles | `ChatInterfaceTab.tsx` | Padding adjustment |

---

## Technical Notes

### Cover Image Generation Edge Function

The new edge function will:
- Accept a prompt and style selection
- Use the same image generation infrastructure as avatar generation
- Request portrait aspect ratio (2:3) for cover images
- Return a URL to the generated image stored in Supabase Storage

### Testing Recommendations

After implementation:
1. Test AI cover image generation with different styles
2. Verify Chat History page shows enhanced shadows
3. Confirm three dots menu visible on main character cards in chat
4. Check that message action buttons don't overlap with text content
