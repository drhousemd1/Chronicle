

# Admin Chat Debug Export

## What we're building

A new "Admin" section at the bottom of the Chat Settings modal, visible only to admin users. It contains a single button — "Download Session Log" — that exports the current conversation as a clean Markdown file designed for pasting into external AI tools (like Grok) for prompt diagnosis.

The export captures:
- **Speaker attribution** on every message (who said what)
- **Timeline markers** (Day X, Time of Day) whenever they change
- **Action flags** — when you clicked Continue or Regenerate, those actions are annotated inline in the log so you can see exactly where the AI was prompted to keep going vs. respond to input
- **Scenario context header** — story title, character names, model ID — so an external AI has baseline context

## How it works

1. **Admin gating**: `ChatInterfaceTab` receives a new `isAdmin` prop from `Index.tsx` (which already has `isAdminState`). The Admin section only renders when `isAdmin === true`.

2. **Action tracking**: Two lightweight arrays (`continueEventsRef` and `regenerateEventsRef`) track timestamps of Continue and Regenerate button clicks by recording the message ID they acted on. These are `useRef` arrays so they don't trigger re-renders.

3. **Markdown generation**: When you click "Download Session Log," a function builds a Markdown string:
   - Header block with scenario name, characters, model, current day/time
   - Each message rendered as `### User` or `### [CharacterName] (AI)` with the full text
   - Day/time change markers inserted between messages when they differ
   - `> ⚡ CONTINUE triggered here` or `> 🔄 REGENERATE triggered here` annotations injected at the relevant message positions
   - Triggers a browser file download (`.md` file)

4. **No database changes needed** — this is purely a client-side export of in-memory conversation data.

## Files changed

- **`src/pages/Index.tsx`** — Pass `isAdmin={isAdminState}` prop to `ChatInterfaceTab`
- **`src/components/chronicle/ChatInterfaceTab.tsx`**:
  - Add `isAdmin` to props interface
  - Add `continueEventsRef` and `regenerateEventsRef` (useRef arrays)
  - Record events in `handleContinueConversation` and `handleRegenerateMessage`
  - Add `generateSessionLog()` function that builds the Markdown
  - Add Admin section at bottom of Chat Settings modal (after Time Progression divider)

## Markdown output format

```text
# Session Log — [Story Title]
**Conversation:** [Conversation Title]
**Characters:** Aria (User), Marcus (AI), Elena (AI)
**Model:** xai/grok-4
**Exported:** 2026-03-20 14:30

---

#### Day 1 — Day

### User
I walk toward the old cathedral, keeping my hand on the hilt of my sword.

### Marcus (AI)
*Marcus steps out from behind a crumbling pillar, his expression wary.* "You shouldn't be here," *he says quietly.*

> 🔄 REGENERATE triggered on this message

### User
"I go where I please. What are you hiding?"

> ⚡ CONTINUE triggered after this message

### Marcus (AI)
*He glances over his shoulder...* 

#### Day 1 — Sunset

### Elena (AI)
...
```

