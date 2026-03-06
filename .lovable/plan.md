

## Equalize Button Heights on Gallery Card

**File:** `src/components/chronicle/GalleryStoryCard.tsx`

The like and save icon buttons use `p-2.5` making them ~36px tall, while the Play button is `h-8` (32px). Fix by giving the icon buttons explicit `h-8 w-8` dimensions with centered content instead of relying on padding.

**Changes (lines 112, 124):**
- Like button: `"p-2.5 rounded-xl"` → `"h-8 w-8 flex items-center justify-center rounded-xl"`
- Save button: same change
- This makes all three buttons 32px tall, matching the Play button

