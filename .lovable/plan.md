
Goal: Fix the chat-interface character control toggle so switching a main character from AI → User persists correctly and the card badge/settings stay in sync.

What I found from code review:
1. The save path in `ChatInterfaceTab` is incorrectly classifying main characters as side characters.
2. In `handleModalSave` (`src/components/chronicle/ChatInterfaceTab.tsx`), the branch check is:
   - `if ('background' in characterToEdit) { ...side character save... }`
3. This is a bug because **both** `Character` and `SideCharacter` include a `background` field in this codebase (`src/types.ts`), so main characters can enter the side-character save path.
4. When that happens:
   - `updateSideCharacter(...)` is called with a main character id.
   - No matching side-character row is updated.
   - Session state (`character_session_states`) is never updated with `controlledBy`.
   - Result: card badge still shows AI, reopening modal shows AI again.

Implementation plan:
1. Fix type discrimination in `handleModalSave` (`src/components/chronicle/ChatInterfaceTab.tsx`)
   - Replace the current `'background' in characterToEdit` check with a reliable side-character discriminator.
   - Use existing established discriminator pattern already present in modal logic: side characters have `firstMentionedIn`.
   - New branch logic:
     - If `'firstMentionedIn' in characterToEdit` → `handleSaveSideCharacterEdit(...)`
     - Else → treat as main character and call `handleSaveMainCharacterEdit(...)`.
2. Keep current main-character persistence flow unchanged
   - `handleSaveMainCharacterEdit` already updates `character_session_states` via `supabaseData.updateSessionState(...)` including:
     - `controlledBy`
     - `characterRole`
   - Then refreshes via `fetchSessionStates(conversationId)`; this should immediately drive badge + modal state via `getEffectiveCharacter(...)`.
3. Optional but recommended hardening in same file
   - Add a tiny helper predicate (e.g. `isSideCharacterForEdit`) to prevent this regression from reappearing.
   - Reuse this helper wherever branching main vs side save behavior occurs.
4. Validate related read path assumptions
   - Confirm badge rendering uses effective merged state:
     - `renderCharacterCard` uses `getEffectiveCharacter(baseChar)` (already correct).
   - Confirm modal opens with effective character (already passes `char` from `renderCharacterCard`, good).

Validation checklist (end-to-end):
1. Open chat interface sidebar character card.
2. Edit a **main** character:
   - Controlled By: AI → User
   - Save.
3. Verify immediately:
   - Card badge changes to `User`.
4. Reopen modal:
   - Controlled By remains `User`.
5. Refresh page / reload conversation:
   - Controlled By still `User` (session-scoped persistence confirmed).
6. Sanity checks:
   - Side-character edit/save still works.
   - Character role toggle (Main/Side) still persists for both paths.

Technical notes:
- Root cause is a structural type guard mismatch, not database schema/RLS.
- No backend migration required.
- No edge-function change required.
- File expected to change: `src/components/chronicle/ChatInterfaceTab.tsx`.
