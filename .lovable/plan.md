

## Fix: "Delete All" button typography on Chat History page

**File:** `src/pages/Index.tsx`, line ~1886-1888

Change the button text from `Delete All` to `DELETE ALL` and update the text styling to match the app's standard button typography: `text-[10px] font-bold uppercase tracking-wider` (same as the DeleteConfirmDialog buttons and other standardized buttons).

Current:
```
text-sm font-bold
Delete All
```

Updated:
```
text-[10px] font-bold uppercase tracking-wider
DELETE ALL
```

Single line change — text content + two class swaps.

