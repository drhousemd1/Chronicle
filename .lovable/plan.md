

## Fix Remaining EntryCard Sections → ButtonCardV2

All remaining `EntryCard` entries in the Buttons section (lines 1479-1827) need conversion to `ButtonCardV2`. I've verified each against the actual source code. Here are the corrections needed alongside the format migration.

### Sections to convert (16 entries total):

---

**CHAT HISTORY (2 entries, lines 1481-1498)**

1. **Session Delete Button** — Verified correct against `ConversationsTab.tsx:109`. No changes to styling data.
2. **Load More Button** — Verified correct against `ConversationsTab.tsx:144`. No changes to styling data.

---

**IMAGE LIBRARY — first instance (1 entry, lines 1502-1511)**

3. **Folder Hover Buttons — Edit / Open** — Verified correct against `ImageLibraryTab.tsx:502,512`. No changes.

---

**ACCOUNT PAGE (1 entry, lines 1515-1527)**

4. **Account Tab Pills** — Verified correct against `Index.tsx:2344-2348`. No changes.

---

**AUTH PAGE (2 entries, lines 1531-1548)**

5. **Auth Submit Button** — Verified against `Auth.tsx:157-163`. Correct.
6. **Auth Toggle Link** — Verified against `Auth.tsx:173-176`. Correct.

---

**CHRONICLE UI.tsx — Parallel Button System (2 entries, lines 1558-1578)**

7. **Chronicle UI.tsx — Primary** — Verified against `UI.tsx`. Correct.
8. **Chronicle UI.tsx — Brand / Gradient / OutlineDark** — Verified. Correct.

---

**CREATOR PROFILE (1 entry, lines 1582-1591)**

9. **Follow / Unfollow Toggle** — **DISCREPANCY FOUND**:
   - Style guide says: `px-6 py-2.5 text-sm font-bold shadow-lg` / Following: `bg-white/10 text-white`
   - Actual code (`CreatorProfile.tsx:204-209`): `w-full px-4 py-2.5 rounded-xl text-sm font-semibold` / Following: `bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400`
   - Fix: Update size to `w-full px-4 py-2.5`, weight to `font-semibold`, add hover-to-unfollow state, remove `shadow-lg`. Uses `UserPlus`/`UserMinus` icons.

---

**UPLOAD SOURCE MENU (1 entry, lines 1595-1606)**

10. **UploadSourceMenu Dropdown** — Verified against `UploadSourceMenu.tsx:47`. Correct.

---

**GLOBAL SIDEBAR (2 entries, lines 1613-1636)**

11. **Sidebar Navigation Item** — Verified against `Index.tsx:76-78,1535`. Correct.
12. **Sidebar Collapse Toggle** — Verified against `Index.tsx:1533-1538`. Correct.

---

**CHARACTER BUILDER (3 entries, lines 1640-1678)**

13. **AI Enhance Sparkle Button** — Verified against `CharactersTab.tsx:117-124`. Correct.
14. **EnhanceModeModal Option Cards** — Verified against `EnhanceModeModal.tsx:28-56`. Correct.
15. **ExtraRow Delete Button** — **DISCREPANCY FOUND**:
    - Style guide says: `p-1 rounded`
    - Actual code uses two variants: `p-1 rounded-md` (section delete, `CharacterEditModal.tsx:1752`) and `p-1.5 rounded-md` (item delete, `CharacterEditModal.tsx:1800`). Both use `rounded-md`, not `rounded`.
    - Fix: Update to `p-1 / p-1.5 rounded-md` with note about the two sizes.

---

**MODEL SETTINGS (1 entry, lines 1682-1701)**

16. **Model Selection Card** — Verified against `ModelSettingsTab.tsx:89-93`. Correct.

---

**IMAGE LIBRARY — second instance (2 entries, lines 1708-1733)**

17. **New Folder Dashed Card** — Verified against `ImageLibraryTab.tsx:537`. Correct.
18. **Folder Delete Button (Circular)** — Verified against `ImageLibraryTab.tsx:525`. Actual code has `hover:bg-black/60` which style guide doesn't mention — add it.

---

**STORY DETAIL MODAL (1 entry, lines 1737-1752)**

19. **Story Detail Action Buttons** — Verified against `StoryDetailModal.tsx:302-352`. Style guide preview uses `text-xs font-semibold` but actual code uses `text-sm font-semibold`. Fix preview to `text-sm`.

---

**REVIEW MODAL (1 entry, lines 1756-1771)**

20. **Review Submit / Delete Buttons** — Verified against `ReviewModal.tsx:170,179`. Correct.

---

**SHARE STORY MODAL (1 entry, lines 1775-1791)**

21. **Share Modal !important Override Buttons** — Verified against `ShareStoryModal.tsx:154-180`. Style guide shows generic "Publish"/"Unpublish" but actual labels are "Publish to Gallery"/"Update Publication"/"Unpublish". Fix labels. Also actual Unpublish uses `!bg-rose-500/20 !text-rose-300 !border-rose-500/30` (not `text-rose-400`). Fix color.

---

**ARC SYSTEM (1 entry, lines 1795-1807)**

22. **Arc Phase Delete Button** — Verified against `ArcPhaseCard.tsx:189`. Actual text color is `text-red-300` not `text-red-400`. Fix.

---

**TAG CHIPS (1 entry, lines 1811-1827)**

23. **Tag Chip Remove Button** — **Two variants exist**:
    - `SceneTagEditorModal.tsx:94`: `px-2.5 py-1 text-xs` (matches style guide)
    - `TagInput.tsx:59`: `px-3 py-1.5 text-sm` (different)
    - Note both variants in the entry.

---

### Implementation

Replace all `EntryCard` entries from lines 1479-1827 with `ButtonCardV2` entries. For each:
- Map `name` → `buttonName`
- Extract `buttonColor`, `textColor`, `size`, `purpose`, `visualEffects`, `locations` from the specs/code
- Keep existing `preview` JSX, fixing discrepancies noted above
- Set `pageSpecific`/`appWide` flags appropriately
- Preserve `InconsistencyNote` blocks and `PageSubheading` dividers
- Use dark preview wrappers where `previewDark` was set

### Fixes summary (3 discrepancies + 3 minor corrections):
1. **Follow/Unfollow**: `px-4` not `px-6`, `font-semibold` not `font-bold`, add hover-to-unfollow red state
2. **ExtraRow Delete**: `rounded-md` not `rounded`
3. **Story Detail**: `text-sm` not `text-xs` in preview
4. **Share Modal**: Fix "Unpublish" color to `text-rose-300`, fix labels
5. **Arc Phase Delete**: `text-red-300` not `text-red-400`
6. **Tag Chips**: Document both size variants

