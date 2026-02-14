

# Fix: AI Behavior Issues, Inline Edit UI, and Streaming Truncation

## Issues Addressed

### 1. Object Permanence -- AI seeing hidden items via character card knowledge
The system prompt already has LINE OF SIGHT rules (llm.ts lines 337-356), but the AI is using character card Secrets data (e.g., "secretly wears her thongs") to infer details that are physically hidden. The prompt needs a new rule distinguishing between "character sheet knowledge" and "perceptual observation."

### 2. AI generating dialogue for User-controlled characters
The CONTROL rules exist (llm.ts lines 527-529) but are being violated, especially in longer responses. The enforcement needs to be stronger and repeated in the regeneration directive.

### 3. Inline Edit UI (replacing the modal)
Replace the popup Dialog for editing messages with in-place contentEditable editing inside the chat bubble itself. When the user clicks Edit, the bubble becomes editable. The hover action buttons transform: Continue becomes a Checkmark (save), Refresh becomes an X (cancel), and the three-dot menu hides. Exiting edit mode restores original buttons.

### 4. AI responding to internal thoughts too specifically
The INTERNAL THOUGHT BOUNDARY rules exist (llm.ts lines 284-293) but the AI is echoing exact words from parenthetical thoughts (e.g., user thinks "freak" and AI says "you aren't a freak"). Need to add a rule forbidding echo/mirror of specific words from thoughts.

### 5. Refresh button generating truncated responses
The streaming parser in llm.ts has a bug: when an incomplete JSON chunk arrives, it puts the raw line (including the "data: " prefix) back into the buffer (line 717), then on the next iteration it tries to parse it again but the buffer now has the "data: " prefix duplicated or the line gets stuck. Also, the edge function doesn't set `max_tokens`, so regenerations may hit a lower default.

---

## Technical Details

### File 1: `src/services/llm.ts`

**Strengthen object permanence rules (line 337-356):**
Add a new subsection to the LINE OF SIGHT block:
```
* CHARACTER SHEET vs PERCEPTION: Information from the character's profile (e.g., Secrets, Kinks)
  represents what the character KNOWS or SUSPECTS over time -- NOT what they can see right now.
  - If the character KNOWS the user wears thongs, they may WONDER or HOPE, but cannot SEE specifics
    (color, style) that are covered by clothing.
  - WRONG: "She noticed the purple lace beneath his shorts" (covered = invisible)
  - WRONG: "She couldn't see it, but she knew the purple lace was there" (naming hidden specifics)
  - RIGHT: "She wondered if he was wearing one of hers underneath" (knowledge without visual detail)
  - RIGHT: "The thought of what might be under those shorts made her pulse quicken" (desire without certainty)
  - KEY RULE: If the user explicitly describes hiding/concealing something, the AI character
    MUST NOT name the hidden item's specific attributes (color, material, style) in their response.
```

**Strengthen internal thought boundary (line 284-293):**
Add an anti-echo rule:
```
* ANTI-ECHO RULE: Do NOT repeat, quote, or mirror the exact distinctive words from the user's
  internal thoughts. If the user thinks (She's going to call me a freak), the AI character
  MUST NOT use the word "freak" in their next response. Instead, infer the emotional state
  and respond to that: "He looks terrified" or "She can see the fear in his eyes."
  The AI should react to the EMOTION behind the thought, not the specific vocabulary.
```

**Strengthen control enforcement (line 527-529):**
Add a post-instruction reinforcement and add it to the regeneration directive:
```
* VIOLATION CHECK: Before finalizing your response, re-read it and DELETE any paragraphs
  where a User-controlled character speaks (quotes), acts (asterisks), or thinks (parentheses).
  Only narration about them is allowed (e.g., "He sat there quietly.").
```

**Fix streaming parser bug (lines 714-719):**
The current code puts incomplete JSON back into the buffer with `textBuffer = line + "\n" + textBuffer` but this causes the "data: " prefix to be re-parsed. Fix: only put back the jsonStr portion, not the full line.

```typescript
// Current (buggy):
} catch {
  textBuffer = line + "\n" + textBuffer;
  break;
}

// Fixed:
} catch {
  // Don't put back - the JSON was truly malformed or incomplete.
  // Skip it and continue processing remaining lines.
  continue;
}
```

**Add max_tokens to prevent truncation:** In `generateRoleplayResponseStream`, add `max_tokens: 4096` to the request body sent to the edge function. This prevents the API from using a lower default that truncates long responses.

### File 2: `supabase/functions/chat/index.ts`

Add `max_tokens` passthrough from the request body:
- Accept optional `max_tokens` in the ChatRequest type
- Pass it through to both `callLovableAI` and `callXAI` (default to 4096 if not provided)

### File 3: `src/components/chronicle/ChatInterfaceTab.tsx`

**Replace edit modal with inline editing:**

1. Add new state:
   - `inlineEditingId: string | null` -- which message is being edited inline
   - `inlineEditText: string` -- the current edit text

2. Modify message bubble rendering (around line 2688):
   - When `inlineEditingId === msg.id`, replace the `FormattedMessage` component with a `<textarea>` styled to match the bubble's text appearance (same padding, font, colors)
   - The textarea should auto-resize to fit content

3. Modify action buttons (around line 2695):
   - When `inlineEditingId === msg.id`, force buttons to stay visible (`opacity-100` instead of `opacity-0 group-hover:opacity-100`)
   - Replace Continue button with a Check icon (save) that calls `handleInlineEditSave`
   - Replace Refresh button with an X icon (cancel) that calls `handleInlineEditCancel`
   - Hide the three-dot menu while editing

4. When NOT editing, keep existing hover behavior with Continue, Refresh, and three-dot menu

5. Update the "Edit" menu item (line 2732) to set `inlineEditingId` and `inlineEditText` instead of opening the dialog

6. Remove the Edit Message Dialog block (lines 3037-3059)

7. Add handlers:
   ```typescript
   const handleInlineEditSave = () => {
     if (!inlineEditingId || !inlineEditText.trim()) return;
     // Same logic as handleEditMessage but using inlineEditingId/inlineEditText
     const updatedConvs = appData.conversations.map(c =>
       c.id === conversationId
         ? { ...c, messages: c.messages.map(m => m.id === inlineEditingId ? { ...m, text: inlineEditText } : m), updatedAt: now() }
         : c
     );
     onUpdate(updatedConvs);
     onSaveScenario(updatedConvs);
     setInlineEditingId(null);
     setInlineEditText('');
   };

   const handleInlineEditCancel = () => {
     setInlineEditingId(null);
     setInlineEditText('');
   };
   ```

---

## Summary
- 3 files modified: `llm.ts`, `chat/index.ts` (edge function), `ChatInterfaceTab.tsx`
- 1 edge function redeployed
- No database changes
- Prompt improvements for object permanence, thought boundary, and control enforcement
- Streaming fix to prevent truncated responses
- Inline edit UX replaces the modal

