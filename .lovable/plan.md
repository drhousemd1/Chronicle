
I found the actual issue.

What’s actually wrong
- The chooser modals were styled like a separate mockup instead of using the same container system already used all over the Story Builder and Character Builder.
- The mismatch is mainly the container shape language: shell/header/card corners and overall builder-style framing.
- So yes: the real problem is the corners/container treatment, not the labels, not the copy, and not some tiny hover state.

Real source of truth in the app
- `src/components/chronicle/StoryGoalsSection.tsx:307-315`
- `src/components/chronicle/CharacterGoalsSection.tsx:210-212`
- `src/components/chronicle/WorldTab.tsx:674-684`

Those existing containers already define the app’s correct pattern:
- outer shell: `bg-[#2a2a2f] rounded-[24px] overflow-hidden ...`
- builder header: slate gradient, `border-t border-white/20`, `px-5 py-3`, gloss overlay, `shadow-lg`
- header title: `text-xl font-bold tracking-[-0.015em]`
- inner surface/card: `bg-[#2e2e33] rounded-2xl ...`

Why the current chooser modals feel wrong
- They currently use a bespoke modal treatment:
  - different outer shadow language
  - different header sizing (`py-4`)
  - different title styling (all caps, `text-[16px] font-black`, wide tracking)
  - option tiles styled from the standalone mockup instead of the app’s builder containers
- Even with similar colors, that makes the corners/read feel off compared to the rest of the product.

Implementation plan
1. Replace the chooser modal shell/header styling with the exact builder/story container pattern already used elsewhere in the app.
2. Keep each modal’s own label, icon, and action text, but make the framing identical to the existing builder containers.
3. Align the option cards to the same inner-surface treatment used inside builder sections so the corner radius/depth matches the rest of the app.
4. Apply this consistently to:
   - `src/components/chronicle/CharacterCreationModal.tsx`
   - `src/components/chronicle/CustomContentTypeModal.tsx`
   - `src/components/chronicle/EnhanceModeModal.tsx`
   - `src/components/chronicle/StoryImportModeModal.tsx`
   - `src/components/chronicle/StoryExportFormatModal.tsx`
   - `KeepOrEditModal` in `src/components/admin/styleguide/StyleGuideEditsModal.tsx`
5. Do not spend time on unrelated one-off tweaks unless something is still visibly wrong after the shared container pattern is restored.

Technical details
- I will copy from the app’s existing builder/story containers, not from the standalone mockup.
- The exact things to normalize are:
  - shell radius/shadow language
  - header height/padding
  - header gloss placement
  - title typography
  - inner card radius/shadow treatment
- Behavior stays the same; this is a visual consistency refactor only.

Expected result
- The chooser modals will stop looking like a separate design system.
- Their corners/container framing will match the many existing examples on the Story Builder and Character Builder pages, which is the mismatch you were calling out.
