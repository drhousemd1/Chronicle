

## Plan: Single Main Character Placeholder with Conditional Error Messages

### Change
Revert to a single "Add / Create" placeholder under Main Characters, with error messages displayed beneath it.

### File: `src/components/chronicle/WorldTab.tsx`

**Lines 447-471** — Simplify `AddCharacterPlaceholder` to not take an `error` prop. Instead, handle errors separately.

**Lines 485-489** — Replace the two placeholders with:
```
{mainCharacters.map(...)}
<AddCharacterPlaceholder label="Add / Create" sublabel="Main Character" 
  hasError={!!noAICharacterError || !!noUserCharacterError} />
{noAICharacterError && <p className="text-sm text-red-500 font-medium pl-2">{noAICharacterError}</p>}
{noUserCharacterError && <p className="text-sm text-red-500 font-medium pl-2">{noUserCharacterError}</p>}
```

The placeholder gets a red dashed border if either error exists. Below it, whichever error messages apply are shown — both if no characters exist, or just the missing type.

Side Characters placeholder stays unchanged (single card, no error).

