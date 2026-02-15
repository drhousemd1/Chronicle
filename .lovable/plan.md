

# Fix: Textarea Bottom Padding (Root Cause)

## Root Cause

The `ref` callback sets `textarea.style.height = scrollHeight`, and with `rows={3}`, an empty textarea's `scrollHeight` is approximately 84px (3 lines + internal padding). The text content only occupies ~20px at the top, leaving ~40px of unused dark space below the text inside the textarea. This creates the illusion of thicker bottom padding even though the outer wrapper's `p-2` is perfectly uniform.

Every previous fix (removing `min-h-[96px]`, adjusting `pb`) shrank the overall container but never addressed the actual cause: `rows={3}` reserves too much vertical space for empty/short content.

## Fix

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

1. **Change `rows={3}` to `rows={1}`** (line 3144) -- The textarea starts at 1 row height when empty, fitting the content snugly. No dead space at the bottom.

2. **Add `min-h-[2.5rem]`** to the textarea className (line 3147) -- Ensures the textarea doesn't collapse too small. This is roughly 1 line of text plus its internal padding, keeping it comfortable to click into.

3. The auto-resize ref already handles expansion when the user types multiple lines, so growing behavior is preserved. The textarea will start compact and grow as needed.

## Result

- Empty textarea: ~40px tall (1 row + padding) with uniform 8px outer padding on all sides
- With content: auto-expands to fit, still with uniform outer padding
- The overall bottom bar does NOT shrink further -- only the dead space inside the textarea is removed

