

Goal: Remove Import/Export, Finalize and Close, and Save Draft buttons from the Character Builder page (Characters tab). These buttons should only appear on the Story Builder page (World tab).

Current state:
- The action buttons are wrapped in condition `(tab === "world" || tab === "characters")` at lines 2019
- This causes them to appear on both Story Builder AND Character Builder pages

What needs to change:
1. Change the condition for Import/Export/Save Draft/Finalize buttons from `(tab === "world" || tab === "characters")` to just `tab === "world"`
2. Keep the back button and title logic as-is (it correctly shows "Character Builder" vs "Story Builder" based on tab)

Implementation:
- Update line 2019 in `src/pages/Index.tsx` to use `tab === "world"` instead of `(tab === "world" || tab === "characters")`
- The header title and back button section at lines 1835-1856 correctly handles both tabs and should remain unchanged

