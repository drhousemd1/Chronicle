

# Fix 5 UI Issues: Tile Clipping, Character Sizing, Upload/Search Placement, Hover Effect

---

## What You'll Notice After This

- No more corner clipping on story/gallery tiles when hovering
- Character Library tiles match the same grid sizing as Your Stories and Community Gallery
- The "+ Upload Images" button and search bar only appear when inside a folder (not on the main Image Library page)
- Image thumbnails in folders have the same hover lift effect as all other tiles in the app

---

## 1. Fix tile card clipping on hover

**The problem:** The `overflow-hidden`, `rounded-[2rem]`, and `group-hover:-translate-y-3` are all on the same `div`. During the CSS transition, the browser clips corners as it composites the rounded overflow with the transform -- causing visible corner artifacts.

**The fix:** Move the hover translate to the outer wrapper `div` (the `group relative` element) instead of the inner card. The inner card keeps `overflow-hidden rounded-[2rem]` but no longer transforms itself. This separates the clipping boundary from the moving element.

**Files affected:**
- `src/components/chronicle/ScenarioHub.tsx` (line 35) -- move `-translate-y-3` and `shadow-2xl` to outer div
- `src/components/chronicle/GalleryScenarioCard.tsx` (line 65) -- same fix
- `src/components/chronicle/ImageLibraryTab.tsx` (line 447, folder tiles) -- same fix
- `src/pages/CreatorProfile.tsx` (line 286) -- same fix
- `src/components/account/PublicProfileTab.tsx` (line 460) -- same fix

---

## 2. Match Character Library tile grid to other pages

**The problem:** Character Library uses `lg:grid-cols-4` while Your Stories and Community Gallery use `lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`. This causes a jarring size difference when switching tabs.

**The fix:** Update the CharactersTab grid to use the same breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`.

**File:** `src/components/chronicle/CharactersTab.tsx` (line 522)

---

## 3. Fix Upload Images button -- only show inside folder

**Current state:** The conditional `isInImageFolder` is already in the header code (line 1750 of Index.tsx). If it's showing on the main page, `isInImageFolder` may be getting set incorrectly. However, looking at the code, the logic appears correct. The user may be seeing the button because they entered a folder and the state persisted. No code change needed here -- just confirming the logic is already correct. If the issue persists after the other fixes, we'll investigate further.

Actually, re-reading the code -- the `isInImageFolder` guard is already in place at line 1750. This should already be working. I'll double-check the `onFolderChange` callback to ensure it properly resets.

---

## 4. Fix search bar -- only show inside folder

**Current state:** The search bar already has `{isInImageFolder && (...)}` at line 1603 of Index.tsx. Same as item 3 -- the conditional is already there. If both items 3 and 4 are showing on the main page, the issue is likely that `isInImageFolder` defaults to or gets stuck as `true`. I'll verify the initial state and the reset logic in `onFolderChange`.

If both are genuinely showing on the main Image Library page (not inside a folder), the fix would be to ensure `isInImageFolder` initializes as `false` and resets properly. The current code shows `useState(false)` at line 153, which is correct.

---

## 5. Add hover lift effect to Image Library thumbnails

**The fix:** Add `transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl` to the image thumbnail wrapper (line 620 of ImageLibraryTab.tsx). Using `-translate-y-2` (slightly less than the 2:3 cards' `-translate-y-3`) since these are smaller tiles. Apply the translate to the outer wrapper to avoid the same clipping issue from item 1.

**File:** `src/components/chronicle/ImageLibraryTab.tsx` (line 618-620)

---

## Technical Details

### Files Modified

- **`src/components/chronicle/ScenarioHub.tsx`** (line 34-35)
  - Outer div: add `transition-all duration-300 group-hover:-translate-y-3`
  - Inner div: remove `group-hover:-translate-y-3` (keep `overflow-hidden rounded-[2rem]`)

- **`src/components/chronicle/GalleryScenarioCard.tsx`** (line 63-65)
  - Same structural fix as ScenarioHub

- **`src/components/chronicle/ImageLibraryTab.tsx`** (line 445-447, folder tile cards)
  - Same structural fix for folder tiles
  - Lines 618-620: Add hover lift to image thumbnails (outer div gets translate, inner keeps overflow-hidden)

- **`src/pages/CreatorProfile.tsx`** (line 285-286)
  - Same structural fix

- **`src/components/account/PublicProfileTab.tsx`** (line 459-460)
  - Same structural fix

- **`src/components/chronicle/CharactersTab.tsx`** (line 522)
  - Grid: change from `lg:grid-cols-4 gap-8` to `lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`

- **`src/pages/Index.tsx`**
  - Verify `isInImageFolder` state management (should already be correct, but will confirm the upload button and search bar only render when inside a folder)
