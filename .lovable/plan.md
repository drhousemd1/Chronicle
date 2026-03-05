

## Plan: Fix Inconsistent Error Text Styling

**Root cause:** The location error message is embedded *inside* the `text-[10px]` label element, so it inherits 10px font size. It needs to be a standalone `<p>` element like all other error messages.

### Changes

**`src/components/chronicle/WorldTab.tsx`** — Line 614

**Current:** Location error is a `<span>` inside the 10px label:
```
<label className="text-[10px] ...">Primary Locations <span>— {error}</span></label>
```

**Fix:** Remove the inline error span from the label. Add a separate `<p className="text-sm text-red-500 mt-1">` below the label, matching Story Premise, Opening Dialog, etc.

That is the only remaining inconsistency. ContentThemesSection already uses `text-sm text-red-500 font-medium`, and all other WorldTab errors already use `text-sm text-red-500`.

