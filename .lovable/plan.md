

## Plan: Restyle Dialog Formatting in World Codex

### Changes in `src/components/chronicle/WorldTab.tsx`

**1. Replace HintBox with a styled read-only container matching text input fields**

Lines 1182-1190: Replace the current `<label>` + `<HintBox>` with:
- A label row containing "Dialog Formatting" text + a `Lock` icon (from lucide-react) to the right, indicating the rules are locked/immutable
- A read-only container styled like the text input fields below it: `bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2` with normal bullet points (`•`) instead of diamonds (`◆`)

**2. Add spacing between the dialog formatting container and "Additional Formatting Rules"**

The "Additional Formatting Rules" `<div>` (line 1193) currently has no top margin. Add `mt-4` to create breathing room between it and the locked rules container above.

**3. Import `Lock` icon**

Add `Lock` to the lucide-react import statement.

### What stays the same
- The text content of the three rules
- The "Additional Formatting Rules" label and textarea
- The outer World Codex container structure

### Files changed
- `src/components/chronicle/WorldTab.tsx` — ~15 lines modified

