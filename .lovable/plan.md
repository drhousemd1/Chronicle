Scope confirmed: fix the remaining text-case and typography inconsistencies in (1) Content Themes tags and (2) AI Generate text styling on the Story Builder action rows.

What I audited (current code)
1) Content Themes still has all-caps text in tag UI:
- `src/components/chronicle/ContentThemesSection.tsx`
  - Section label classes force uppercase: lines with `uppercase tracking-widest` on:
    - Character Types heading
    - Story Type heading
    - Custom Tags heading
  - Literal button text is still all caps:
    - `ADD CUSTOM` (Category selector add button)
    - `ADD CUSTOM` (Custom tags add button)
  - Story type chips render uppercase values (`SFW`, `NSFW`) from constants.
2) AI Generate text still does not match Upload Image text styling:
- `src/components/chronicle/CoverImageActionButtons.tsx`
- `src/components/chronicle/SceneGalleryActionButtons.tsx`
- `src/components/chronicle/AvatarActionButtons.tsx`
  - Upload text uses `text-xs font-bold`
  - AI Generate button root uses `text-[10px] font-bold`, so it renders visibly different.

Implementation plan
1) Normalize Content Themes text casing (UI-only, no data semantics change)
- File: `src/components/chronicle/ContentThemesSection.tsx`
- Changes:
  - Remove forced uppercase transform from the three section heading classNames (`uppercase tracking-widest`).
  - Change both literal labels from `ADD CUSTOM` → `Add Custom`.
  - Add a small display formatter for tag labels rendered in this component:
    - Convert fully-uppercase tokens to title-style for display only (e.g. `SFW` → `Sfw`, `NSFW` → `Nsfw`, `CNC` → `Cnc`) while keeping stored values unchanged.
  - Apply formatter to:
    - prebuilt option chip text
    - story type button text
    - custom tag display text (so previously saved all-caps custom tags also render consistently).

2) Match AI Generate text typography to Upload Image text
- Files:
  - `src/components/chronicle/CoverImageActionButtons.tsx`
  - `src/components/chronicle/SceneGalleryActionButtons.tsx`
  - `src/components/chronicle/AvatarActionButtons.tsx`
- Changes:
  - Update AI Generate button typography from `text-[10px] font-bold leading-none` to `text-xs font-bold leading-none` so it matches Upload Image.
  - Keep iridescent layering, icon, spacing, and interaction effects unchanged.
  - Align label span treatment so AI and Upload read as same text system (same size/weight/case baseline).

3) Prevent future drift
- Add one shared constant (or shared helper) for AI action text class and use it in all three action-button components.
- This avoids future “one file changed, others missed” regressions.

4) Keep style guide source-of-truth in sync
- File: `src/components/admin/styleguide/StyleGuideTool.tsx`
- Update AI Generate preview card + metadata text-size description to the final class (`text-xs font-bold`) so docs match runtime UI.

Validation checklist (post-implementation)
1) Content Themes panel:
- No all-caps “ADD CUSTOM” remains.
- Section headers are no longer forced uppercase.
- Story Type pills and any all-caps tag labels render in upper/lower case display.
2) Story art action rows:
- Upload Image and AI Generate text now match in case, weight, and size.
- Confirm in both:
  - Cover Image action row
  - Scene Gallery action row
3) Regression pass:
- Avatar action row still matches same AI text system.
- No visual regression in iridescent button shell (only text typography adjusted).