
# Character Library Tile Border Color Update

## What's changing

Swap the character tile card border on the Character Library page from the current silver/white (`border-slate-200`) to the slate blue brand color (`border-[#4a5f7f]`), matching what we just applied to the Image Library.

## Technical Details

**File:** `src/components/chronicle/CharactersTab.tsx`, line 476

**Current:**
```
border border-slate-200
```

**New:**
```
border border-[#4a5f7f]
```

Single class swap on one line. No other pages or components are touched.
