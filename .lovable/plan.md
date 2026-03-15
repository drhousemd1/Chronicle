
Scope I will execute (no assumptions left): full line-by-line parity pass for Story Builder + Scenario Card path + shared arc components, including every nested control (inputs, buttons, toggles, chips, hint boxes, empty states), not just container shells.

Audit findings (everything still not updated)
1) Upload buttons still old/flat (wrong style system)
- `SceneGalleryActionButtons.tsx`: Upload trigger still uses flat bordered HSL button instead of raised `#3c3e47` shadow-surface.
- `CoverImageActionButtons.tsx`: same issue for Story Card upload button.
- Target parity source: `AvatarActionButtons.tsx` upload button.

2) Publish area still missing secondary tray layer + wrong button treatment
- `WorldTab.tsx` Share section: content is a single flat layer (no inner tray `bg-[#2e2e33]` shell), and “Publish to Gallery” still uses old flat bordered style.
- `WorldTab.tsx` Scene Gallery section also lacks the secondary inner tray layer used by other sections.

3) Segmented toggles not using canonical builder toggle styling
- `WorldTab.tsx` Opening Dialog “Mode” toggle still uses old `bg-zinc-700 text-blue-500` active style.
- `arc/ArcModeToggle.tsx` (used in Story Arcs + phases) still uses old `bg-zinc-900/50 + border-ghost-white` pattern.

4) AI Enhance buttons still old in Story Builder stack
- `WorldTab.tsx` field-level enhance buttons (core fields + custom rows) are still plain icon buttons.
- `StoryGoalsSection.tsx` sparkle button still plain.
- `arc/ArcPhaseCard.tsx` sparkle button still plain.
- Required parity: iridescent 4-layer enhance icon style used in Character Builder.

5) Story Arcs internals still on pre-refresh field system
- `arc/ArcPhaseCard.tsx` inputs still use old `bg-zinc-900/50 border border-zinc-700`.
- `arc/ArcBranchLane.tsx` trigger/step/sentinel textareas still old bordered style; add-step control is still text-link style, not raised action button.

6) Hint/description box still has legacy white border
- `GuidanceStrengthSlider.tsx`: description block still uses `border border-ghost-white` (the “white outline” you called out).

7) Content Themes controls still partially legacy
- `ContentThemesSection.tsx` option chips still use legacy `border-[#4a5f7f]` pattern.
- Section content also remains flat (no secondary inner tray layer).

8) Additional “still old” elements that were previously left out but are not parity-complete
- `WorldTab.tsx` character roster/sidebar + character cards + add-character placeholders still include legacy slate border/dashed treatments.

Implementation plan (single pass, no partial stop)
A) Normalize shared primitives first
- Create one shared raised-action class recipe (Upload/Add/Publish).
- Create one shared segmented-toggle recipe (raised container, blue active pill).
- Create one shared iridescent-enhance icon recipe (same as Character Builder).

B) Apply primitives everywhere in scope
- Update both action button components (`SceneGalleryActionButtons`, `CoverImageActionButtons`) from Avatar canonical.
- Update toggles in `WorldTab` and `arc/ArcModeToggle`.
- Replace all Story Builder sparkle buttons with iridescent pattern.
- Update arc field inputs and add-step controls to canonical builder field/button system.
- Remove white border from guidance hint box.

C) Restore full container layering parity
- Add missing secondary inner trays to Scene Gallery, Content Themes, and Share sections.
- Re-style Publish button inside the new inner tray.

D) Complete remaining legacy sweep in Story Builder route
- Replace lingering legacy tokens in sidebar/cards/placeholders where still old if full-page parity is required (this pass assumes yes).

Validation gates (must all pass before done)
1) Token sweep: zero remaining legacy patterns in target files (old flat sparkle class, old segmented toggle classes, white hint border, old upload flat button tokens).
2) Structural sweep: every major Story Builder section has outer shell + header + inner tray (or an intentionally equivalent nested structure).
3) Interaction sweep: hover/active/focus/disabled states verified for upload/generate/publish/toggle/enhance controls.
4) Final parity checklist: Story Builder matches Character Builder control-level styling, not only container borders.
