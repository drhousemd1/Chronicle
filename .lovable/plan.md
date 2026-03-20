

# Fix Subheading Style + Remove Freeform Label Input

## Summary
Two fixes across both builders:
1. **Character Builder**: Replace the large bordered input for subheadings with small gray editable text matching the uploaded reference (plain inline input styled like existing section labels).
2. **Story Builder (WorldTab)**: Remove the "LABEL" input field from freeform items — freeform blocks should only have the subheading text + textarea, not an additional label input.

## Changes

### 1. `src/components/chronicle/CharactersTab.tsx` — Subheading style fix

**Current** (line 2059-2068): Full bordered input with `bg-[#1c1c1f] border border-black/35 rounded-lg px-3 py-2`

**New**: Replace with a plain inline input styled as small gray uppercase text:
```
text-[10px] font-bold text-zinc-500 uppercase tracking-widest
bg-transparent border-none focus:outline-none
placeholder:text-zinc-600
```
Placeholder text: `"SECTION TITLE..."`

This matches the user's uploaded screenshot — just small gray text sitting above the content, not a boxed input field.

### 2. `src/components/chronicle/WorldTab.tsx` — Remove freeform "LABEL" input

**Current** (lines 1017-1030): Freeform items render a "LABEL" AutoResizeTextarea input above the content textarea.

**New**: Replace the "LABEL" input with the same small gray subheading text input (matching the new Character Builder style above). Change the placeholder from "LABEL" to "SECTION TITLE..." and restyle to the plain gray text format. This way freeform items just show a small optional subheading + the textarea, no large label field.

## Files Modified
- `src/components/chronicle/CharactersTab.tsx` — Restyle subheading input from bordered box to plain gray text
- `src/components/chronicle/WorldTab.tsx` — Replace freeform "LABEL" input with plain gray subheading text

