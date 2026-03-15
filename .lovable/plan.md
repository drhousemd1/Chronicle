

## Plan: Reduce Character Roster Header Height

The "Main Characters" and "Side Characters" headers were made taller when the 3D styling was applied — padding changed from `py-2` to `py-3`.

**Fix**: Change `py-3` back to `py-2` on lines 626 and 644 in `src/components/chronicle/WorldTab.tsx`. Everything else stays the same.

