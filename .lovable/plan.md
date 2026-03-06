

## Plan: Remove trailing periods from Dialog Formatting rules

### Change in `src/components/chronicle/WorldTab.tsx`

Remove the period at the end of each of the three `<li>` items in the locked Dialog Formatting container:
- `Enclose all spoken dialogue in " ".` → `Enclose all spoken dialogue in " "`
- `Enclose all physical actions or descriptions in * *.` → `Enclose all physical actions or descriptions in * *`
- `Enclose all internal thoughts in ( ).` → `Enclose all internal thoughts in ( )`

One file, three single-character deletions.

