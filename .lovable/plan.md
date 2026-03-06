
Goal: make delete-confirm buttons match the app’s standard button shape/style (same feel as image 1), and stop style drift.

1) Root cause identified
- In `src/components/chronicle/DeleteConfirmDialog.tsx`, button radius classes are wrong:
  - Cancel uses `rounded-l` (left-only corners).
  - Delete uses `rounded-2l` (typo / invalid utility).
- Because this dialog is shared, the bad classes propagate to character delete, chat-history delete, scenario delete, etc.

2) Exact fix (single file)
- File: `src/components/chronicle/DeleteConfirmDialog.tsx`
- Update both action buttons to the same standard shape used in the app header buttons:
  - `rounded-xl`
  - `h-10 px-6`
  - `text-[10px] font-bold leading-none uppercase tracking-wider`
  - keep the existing dark-theme background + border pattern for Cancel
  - keep the existing destructive color treatment for Delete (only radius/style normalization)
- Remove the side/typo radius classes entirely so both buttons have identical corner geometry.

3) Consistency hardening in the same component
- Introduce one shared local button class string (base) used by both Cancel and Delete, then append color-specific classes.
- This prevents future “almost same but slightly different” regressions in this dialog.

4) Validation
- Verify these flows now render identical button corner style:
  - Delete Character
  - Delete chat session (chat history page)
  - Delete all sessions
  - Other places using `DeleteConfirmDialog` (library/world/review)
- Confirm only button corner/style changed; modal background stays as currently standardized dark theme.
