I found the exact mockup you meant.

Exact target found
- `user-uploads://updated_ui_design-3.html`
- The exact “Character Creation Modal — restyled” block is at lines `1216-1265`
- The uploaded screenshot matches that same block exactly

Mandatory style verification from the mockup
- Modal shell: line `1216` → `background:#2a2a2f; border-radius:24px; box-shadow: 0 20px 50px rgba(0,0,0,0.55), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35);`
- Header: lines `1219-1222` → gradient `#5a7292 -> #4a5f7f`, header shadow `0 6px 16px rgba(0,0,0,0.35)`, padding `16px 20px`, title `font-size:16px`, `font-weight:900`, uppercase, `letter-spacing:0.08em`
- Option cards: lines `1232-1235` and `1252-1255` → `background:#2e2e33`, `border-radius:16px`, `padding:20px 16px`, `gap:12px`, shadow `inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)`, border `2px solid`
- Icon tile: lines `1238` and `1258` → `48x48`, `border-radius:14px`, `background:#1c1c1f`, `border-top:1px solid rgba(0,0,0,0.35)`, inset shadow
- Text: lines `1244-1245` and `1264-1265` → title `14px/800`, desc `12px`, color `#a1a1aa`

Cross-check with app palette
- `#2a2a2f` = existing dark charcoal surface
- `#4a5f7f` = existing slate blue brand accent
- `#3b82f6` = existing blue-500 interactive accent
So the mockup uses the app’s real palette; the problem is sizing/radius/spacing/shadow drift, not a new theme.

What is wrong in the current code
- `src/components/chronicle/CharacterCreationModal.tsx`
  - line `30` uses `text-[13px]` instead of the mockup’s `16px`
  - lines `37` and `55` use `rounded-[28px] px-6 py-7` instead of `16px radius` and `20x16 padding`
  - lines `38` and `56` use a much heavier shadow than the mockup
  - lines `42` and `60` use `w-14 h-14 rounded-3xl` instead of `48x48 / 14px`
- The same wrong “too round / too large / too heavy” card treatment was copied into:
  - `src/components/chronicle/CustomContentTypeModal.tsx` (`21-25`, `32-38`, `50-56`)
  - `src/components/chronicle/EnhanceModeModal.tsx` (`22-26`, `33-39`, `51-57`)
  - `src/components/admin/styleguide/StyleGuideEditsModal.tsx` (`116-143`)
- Two more chooser modals still use the older flat style and also need to be brought onto the exact same mockup pattern:
  - `src/components/chronicle/StoryImportModeModal.tsx` (`43-68`)
  - `src/components/chronicle/StoryExportFormatModal.tsx` (`51-76`)

Scope I will update
I found 6 chooser-style pop-up modals that should match this mockup pattern:
1. `CharacterCreationModal`
2. `CustomContentTypeModal`
3. `EnhanceModeModal`
4. `KeepOrEditModal` inside `StyleGuideEditsModal.tsx`
5. `StoryImportModeModal`
6. `StoryExportFormatModal`

Implementation plan
1. Replace the current “rounded-[28px] / big icon / heavy shadow” chooser card styling with the exact uploaded mockup values:
   - card radius `16px`
   - card padding `20px 16px`
   - card gap `12px`
   - lighter card shadow from the HTML
   - icon tile `48x48` with `14px` radius
   - title `14px/800`
   - description `12px`
2. Update chooser modal headers to the exact mockup treatment:
   - keep the same shell/background
   - change header padding and title size to the HTML values
   - add the header drop shadow from the mockup
   - stop using the smaller `13px` header title for this modal family
3. Apply the exact same chooser-card pattern across all 6 files so they stop drifting from each other
4. For `CharacterCreationModal`, match the screenshot behavior by giving the first card the blue selected border on open
5. For the other chooser modals, keep the same exact card geometry/shadow/typography but use their existing accent behavior appropriately instead of inventing new shapes

Result after implementation
- The modal family will match the uploaded HTML instead of the previous rounded interpretation
- Cards will be tighter, flatter, and more exact: `16px` corners, smaller icon wells, lighter shadows, correct text sizing
- All chooser-style pop-up modals in the app will use one consistent visual spec instead of a mix of old-flat and over-rounded variants