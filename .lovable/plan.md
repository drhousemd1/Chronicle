
Yes.

A modal can absolutely have the exact same rounded corners as the Character Builder and Story Builder containers. The reason yours still does not is not “because modals are different” — it is because the current chooser modal is still being wrapped by the shared dialog surface that hardcodes its own radius.

What is actually blocking it
- Builder source of truth:
  - `src/components/chronicle/CharacterGoalsSection.tsx:207-223`
  - `src/components/chronicle/StoryGoalsSection.tsx:307-315`
  - `src/components/chronicle/WorldTab.tsx:674-684`
- Real culprit:
  - `src/components/ui/dialog.tsx:38-39`
  - The base `DialogContent` includes `sm:rounded-lg`
- Current chooser:
  - `src/components/chronicle/ChooserModal.tsx:48-49`
  - It asks for `rounded-[24px]`, but at your current viewport width the `sm:rounded-lg` from `DialogContent` wins, so the modal keeps the smaller dialog corners instead of the builder corners.

Why it looked “unchanged”
- The outer modal shell is still owned by `DialogContent`, not fully by the chooser.
- So even after rebuilding the chooser markup, the root surface still carries the default dialog radius at desktop sizes.
- In plain English: the wrong rounded corners are coming from the dialog primitive wrapper, not from the chooser cards/header.

Implementation plan
1. Stop using the styled `DialogContent` surface for chooser modals as-is.
2. Create a bare dialog-content path in `src/components/ui/dialog.tsx`:
   - either a `DialogContentBare` export
   - or a `variant` prop that removes all default surface styling
3. Remove the default shell classes from that bare path, especially:
   - `sm:rounded-lg`
   - default border/background/padding/shadow that make the dialog own the surface
4. Update `src/components/chronicle/ChooserModal.tsx` to render the builder shell as the true root surface:
   - `bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[...]`
   - builder header and gloss exactly matching the source-of-truth sections
5. Keep the five wrapper modals plus `KeepOrEditModal` pointed at the shared chooser component, so once the root shell is fixed they all fix at once.

Technical note
- This is specifically a Tailwind precedence/responsive issue, not a design impossibility.
- At widths above `sm`, `sm:rounded-lg` is active, which is why the current modal cannot visually match the builder containers even though `ChooserModal` says `rounded-[24px]`.

Expected result
- Yes: the chooser modals can match the builder containers exactly.
- Once the root `DialogContent` styling is bypassed/removed for these chooser modals, the modal corners will finally match the Character Builder and Story Builder containers on desktop.
