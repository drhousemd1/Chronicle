

# Fix: Preserve Quotation Marks in Book-Style Mode

## Problem

When "Dynamic Text" is turned off (book-style mode), the current implementation hides ALL symbols including quotation marks (`" "`). However, quotation marks around dialogue are standard in books and should be preserved.

**Current behavior (incorrect):**
- Dynamic Text OFF: Hides `* *`, `( )`, AND `" "`

**Desired behavior:**
- Dynamic Text OFF: Hide only `* *` and `( )`, keep `" "` visible

---

## Root Cause

In the `FormattedMessage` component, the tokenizer strips all symbols during parsing (lines 70-74), storing only the inner content. Then in book-style mode (lines 92-98), it renders all tokens the same way without adding back quotation marks for speech.

---

## Solution

Update the book-style rendering block to check the token type and add quotation marks back for speech tokens only:

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

```typescript
// Book-style: all white, consistent font
if (!dynamicText) {
  // For speech, add quotes back (standard in books)
  if (token.type === 'speech') {
    return (
      <span key={i} className="text-white font-medium">
        "{token.content}"
      </span>
    );
  }
  // For actions and thoughts, no symbols (not standard in books)
  return (
    <span key={i} className="text-white font-medium">
      {token.content}
    </span>
  );
}
```

---

## Expected Result

| Text Type | Dynamic Text ON | Dynamic Text OFF |
|-----------|-----------------|------------------|
| Speech (`"Hello"`) | `"Hello"` (white) | `"Hello"` (white) |
| Action (`*waves*`) | `waves` (gray italic) | `waves` (white, no asterisks) |
| Thought (`(thinking)`) | `thinking` (indigo glow) | `thinking` (white, no parens) |

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Update lines 92-98 to conditionally add quotes for speech tokens |

