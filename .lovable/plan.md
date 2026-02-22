

# Match Image Library Thumbnail Hover Effect to Story Tiles

---

## What You'll Notice After This

- Image library thumbnails no longer shift upward on hover
- Instead, the image inside zooms in slightly (same as story/gallery tiles)
- All tiles stay aligned in their grid when hovered

---

## The Change

The story tiles use `group-hover:scale-110` on the `<img>` element (zoom into the image) and the outer wrapper's `-translate-y-3` effectively does nothing because `group-hover` on the same `group` element doesn't self-trigger. So the only visible effect is the image zoom.

The image library thumbnails currently have `hover:-translate-y-2` on the outer wrapper (which DOES work and causes the shift-up you're seeing) but no image zoom.

**Fix:**
1. Remove `hover:-translate-y-2` from the outer div (line 687)
2. Add `transition-transform duration-700 group-hover:scale-110` to the `<img>` element (line 695)

**File:** `src/components/chronicle/ImageLibraryTab.tsx`
- Line 687: change `"group relative transition-all duration-300 hover:-translate-y-2"` to `"group relative"`
- Line 695: change `"w-full h-full object-cover cursor-pointer"` to `"w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"`

