
You’re right to call this out. Here’s the direct answer: I was scoping too shallow.

Why this kept happening:
1) I treated “container update” as mostly shell-level (outer card + header + inner panel), not a full descendant audit.
2) I did not enforce a recursive checklist for child controls (inputs, textareas, add buttons, toggles, micro-cards, empty states).
3) I did not run a full legacy-token sweep after each pass, so old classes remained in nested components.

I just re-checked the code, and your complaint is valid. Example misses still present:
- `WorldTab.tsx`: location label input still has old placeholder override (`placeholder:normal-case`), and many old `border-[#4a5f7f]` field styles remain.
- `StoryGoalsSection.tsx`: dashed “Add Next Phase” and “Add New Story Arc” buttons still old style.
- `ContentThemesSection.tsx`: dashed “Add custom” buttons still old style.
- Multiple nested controls still use older border/button treatments while container shells were updated.

Plan to prevent this from happening again (and fix it correctly):
1) Define one canonical style matrix first (from Character Builder + your attached style docs):  
   - container shell  
   - header  
   - inner card  
   - text input / label field  
   - add/action buttons  
   - toggle/segmented controls  
   - chip/tag controls
2) Perform a full descendant audit of Story Builder components (not just section wrappers):  
   - `WorldTab.tsx`  
   - `StoryGoalsSection.tsx`  
   - `ContentThemesSection.tsx`  
   - `StoryCardView.tsx`  
   - related child controls rendered inside these sections
3) Apply updates by control type, not by file blocks, so every nested element is covered.
4) Post-change validation in 3 passes:  
   - Pass A: token grep sweep for legacy classes (old dashed add buttons, old placeholder overrides, old border shells)  
   - Pass B: visual parity check against Character Builder and attached references  
   - Pass C: interaction check (hover/active/focus/error states) so styling parity holds in real use.
5) Deliver a mismatch checklist in the final report (fixed + intentionally untouched), so nothing is silently skipped again.

Operational change I’ll follow from now on:
- I will no longer mark style work complete after shell/container parity.  
- Completion requires a descendant-level checklist across inputs, buttons, toggles, chips, and empty states in each affected section.
