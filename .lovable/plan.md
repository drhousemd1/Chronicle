

# Plan: Add Instruction Callout Box + Fix Panels & Modals Previews (Batched)

## Task 1: Add Instruction Callout Box at Top of Style Guide

Insert a styled callout box between the header (line ~1031) and the content area (line ~1034) in `StyleGuideTool.tsx`. The box will be formatted as shown in the uploaded image:

- Bold "Instructions for Lovable" heading
- Body paragraph explaining single source of truth
- "Rules:" subheading with a numbered list of 4 rules
- Styling: white background, subtle border (border-slate-200), rounded-xl, padding, max-width matching content area. Text in dark gray. Numbered list with left padding.

This callout is purely visual on the page — it also serves as persistent instructions for AI agents reading the component.

---

## Task 2: Fix Panels & Modals Previews (Batched in 3 Rounds)

Every PanelCardV2 preview will be rebuilt to match the **actual source code** exactly — no approximations or mockups. The plan breaks 30+ cards into 3 batches.

### Batch 1: Story Builder + Chat Interface (11 cards)

**Story Builder Page:**
1. **Story Card** — Rebuild preview to match `StoryHub.tsx` lines 33-140: aspect-[2/3], rounded-[2rem], border-[#4a5f7f], gradient overlay (from-zinc-800 via-slate-900/60 to-transparent), bg-slate-200 fallback with large initial letter, bottom text with font-black title + italic description + stats row (Eye/Heart/Bookmark/Play icons). Show hover actions (Edit/Delete/Play buttons with exact h-8 px-4 rounded-xl styling). Show SFW/NSFW badge top-right and Published badge top-left.
2. **Panel Container** — Verify against actual code. Currently looks correct.
3. **Panel Header Bar** — Verify. Currently looks correct.
4. **Builder Collapsible Section** — Verify. Currently looks correct.

**Chat Interface:**
5. **Chat Message Bubble** — Verify AI vs User border (border-white/5 vs border-2 border-blue-500). Currently looks correct.
6. **Frosted Glass Character Card** — Verify. Currently looks correct.
7. **Chat Input Bar** — Currently minimal, acceptable.
8. **Chat Sidebar (White)** — Verify. Currently looks correct.
9. **Chat Sidebar Collapsible Info** — Verify. Currently looks correct.
10. **Side Character Card (Dual Mode)** — Verify. Currently looks correct.
11. **Day/Time Sky Panel** — WRONG. Currently shows a CSS gradient (orange→pink→blue). Actual component uses **real sky images** (`/images/time-backgrounds/*.png`) with crossfade, a `bg-black/20` overlay, `border border-slate-200`, and icon-only time selector buttons (Sunrise/Sun/Sunset/Moon from Lucide) + a white Day counter stepper. Rebuild preview to show: the actual `rounded-xl border border-slate-200 shadow-lg` container with a placeholder sky image area, the `bg-black/20` overlay, the Day counter (white box with border-black, chevron arrows), and 4 icon-only time buttons (active: `bg-blue-100 border-2 border-blue-500 text-blue-500`, inactive: `bg-white border border-black text-black`). Use actual Lucide icons (Sunrise, Sun, Sunset, Moon) imported at top of file.

### Batch 2: Chat History + Gallery + Account + Auth + Global + World Tab (12 cards)

12. **Session Card (Double-nested)** — Verify against ConversationsTab.tsx. Currently looks correct.
13. **Category Sidebar** — Verify against GalleryCategorySidebar.tsx. Currently looks correct.
14. **Settings Card** — Verify against AccountSettingsTab.tsx. Currently looks correct.
15. **Subscription Tier Cards** — Verify against SubscriptionTab.tsx. Currently looks correct.
16. **Auth Card** — Verify against Auth.tsx. Currently looks correct.
17. **Global Sidebar** — Verify against ChronicleApp.tsx. Currently looks correct.
18. **Dropdown Menu** — Verify. Currently looks correct.
19. **HintBox** — Verify against WorldTab.tsx. Currently looks correct.
20. **CharacterButton** — Verify against WorldTab.tsx. Currently looks correct.
21. **World Tab Two-Pane Layout** — Verify. Currently looks correct.
22. **Story Detail Character Card** — Verify. Currently looks correct.
23. **Review Card** — NEEDS FIX. Currently uses emoji stars (⭐) instead of actual `StarRating` and `SpiceRating` components. Rebuild to use the real imported components (already imported at top of file).

### Batch 3: Modals + Misc (15 cards)

24-38. Most modal previews are simple "label in a box" placeholders (CharacterEditModal, ShareStoryModal, StoryDetailModal, ReviewModal, DraftsModal, FolderEditModal, SidebarThemeModal, SceneTagEditorModal, Image Generation Modals, ChangeNameModal, BackgroundPickerModal, ImageLibraryPickerModal, MemoriesModal). These are **metadata-focused entries** — their value is in the labeled specs (background, border, borderRadius, shadow, notes), not the preview. The previews show the modal's unique visual signature (shape, color, border) which is acceptable for documenting modal variants. These are lower priority but will be audited for accuracy of the **metadata fields** (background color, border, borderRadius values) against actual source.

Special fixes in Batch 3:
- **Two-Option Selection Modal** — Currently looks correct (matches EnhanceModeModal.tsx).
- **AIPromptModal** — Currently looks correct.
- **DeleteConfirmDialog** — Currently looks correct.
- **Chat Settings Modal** — Currently looks correct.
- **Arc Phase Card** — Currently looks correct.
- **Arc Branch Lane** — Currently looks correct.
- **Icon Colors code block** — Still has `text-red-400` on line 4391, needs update to `text-red-500` (missed in previous migration).

---

## Summary

| Batch | Cards | Key Fixes |
|-------|-------|-----------|
| 1 | 11 | Story Card preview (full rebuild), Day/Time Sky Panel (full rebuild with real Lucide icons) |
| 2 | 12 | Review Card (use real StarRating/SpiceRating components) |
| 3 | 15 | Audit metadata accuracy, fix Icon Colors code block orphan |
| Callout | 1 | New instruction box at top of page |

Implementation will proceed: Callout box first, then Batch 1 (the highest-impact fixes), then Batch 2, then Batch 3.

