

# Fix Issue #6: Memory System Architecture (3 Sub-Issues)

The only remaining active issue from the Bug Report. Issues #1-#5, #7-#11 have all been verified as correctly implemented.

---

## Issue #6A: Auto-Extraction Never Fires

### 1. Current Problem

The `extract-memory-events` edge function (168 lines, fully functional, uses xAI Grok) exists but is never called automatically. The `MemoryQuickSaveButton` component is imported at line 49 of `ChatInterfaceTab.tsx` but is no longer rendered anywhere in the JSX. In `handleSend()`, after every AI response, two background processes fire in parallel: `extractCharacterUpdatesFromDialogue()` (line 2202) and `evaluateArcProgress()` (line 2212). A third parallel call for memory extraction should exist here but is absent.

### 2. What This Causes

The `memories` array is always empty unless the user manually opens the Memories modal and adds entries. The entire memory system -- day/time tagging, injection into the chat prompt via `memoriesContext` (llm.ts line 336), chronological ordering -- sits idle. The AI has no awareness of past events beyond the conversation window.

### 3. Scope

| File | Change |
|------|--------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add auto-invocation of `extract-memory-events` in `handleSend()` post-response block (after line 2225), mirroring the existing `extractCharacterUpdatesFromDialogue` pattern |

### 4. Proposed Fix

In `handleSend()`, after line 2225 (where `responseLengthsRef` is updated), add a non-blocking memory extraction call:

```typescript
// Issue #6A: Auto-extract memory events (non-blocking, mirrors character extraction pattern)
if (memoriesEnabled) {
  supabase.functions.invoke('extract-memory-events', {
    body: {
      messageText: cleanedText,
      characterNames: allCharacterNames,
      modelId
    }
  }).then(({ data, error }) => {
    if (!error && data?.extractedEvents?.length > 0) {
      const events: string[] = data.extractedEvents;
      const combinedContent = events.length === 1
        ? events[0]
        : events.map((e: string) => `- ${e}`).join('\n');
      handleCreateMemory(combinedContent, currentDay, currentTimeOfDay);
    }
  }).catch(err => {
    console.error('[handleSend] Memory extraction failed:', err);
  });
}
```

This mirrors the existing fire-and-forget pattern used by `extractCharacterUpdatesFromDialogue` (line 2202) and `evaluateArcProgress` (line 2212). It uses the already-existing `allCharacterNames` memo (line 507), `handleCreateMemory` function (line 470), and `memoriesEnabled` state (line 340).

### 5. Expected Behavior

After every AI response, 0-2 key story events are silently extracted and saved as memory entries tagged with the current day and time of day. The memories array populates automatically and is injected into the chat prompt via the existing `memoriesContext` builder in `llm.ts` (line 336). No user action required.

---

## Issue #6B: Day-Transition Compression Not Built

### 1. Current Problem

The memory system has no mechanism for compressing completed days. When the user increments `currentDay` (via `incrementDay()` at line 2100), raw bullet-point memories from the completed day remain forever. Every memory ever saved is injected into the chat prompt in full (llm.ts lines 336-351), growing unboundedly. A long session will accumulate hundreds of tokens of memory context with no ceiling.

The intended architecture is a two-layer model: while the current day is active, events accumulate as individual bullet points. When the day advances, all bullets from the completed day are compressed into a 2-3 sentence synopsis, the raw bullets are deleted, and the synopsis replaces them.

### 2. What This Causes

Token cost for the `memoriesContext` block grows linearly with session length. After many days of play, the memory injection becomes large enough to crowd out other prompt content or hit context window limits.

### 3. Scope

| File | Change |
|------|--------|
| `supabase/functions/compress-day-memories/index.ts` | NEW edge function -- accepts bullet strings, returns a 2-3 sentence synopsis |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add `previousDayRef` and a `useEffect` watching `currentDay` that triggers compression of the completed day |

### 4. Proposed Fix

**New edge function `compress-day-memories/index.ts`:**
- Accepts `{ bullets: string[], day: number, conversationId: string }`
- Auth check (same pattern as existing functions like `extract-memory-events`)
- Calls xAI Grok (`grok-3-mini`) with system prompt:

```
You are compressing a list of story memory bullet points from a single day of roleplay into a brief narrative synopsis for long-term storage.

INPUT: An array of bullet point strings from one day.
OUTPUT: A single plain-text synopsis of 2-3 sentences maximum.

Rules:
- Capture only changes, revelations, decisions, and events with future impact.
- Distill the narrative essence of the day.
- Use past tense.
- No bullet points or formatting -- plain prose only.
```

- Returns `{ synopsis: string }`

**ChatInterfaceTab.tsx:**
Add `previousDayRef = useRef<number>(currentDay)` and a `useEffect`:

```typescript
const previousDayRef = useRef<number>(currentDay);

useEffect(() => {
  const prevDay = previousDayRef.current;
  previousDayRef.current = currentDay;

  // Only compress when day increments (not decrements or initial load)
  if (currentDay > prevDay && memoriesEnabled) {
    const completedDay = prevDay;
    const bulletMemories = memories.filter(
      m => m.day === completedDay && m.entryType === 'bullet'
    );
    if (bulletMemories.length === 0) return;

    const bullets = bulletMemories.map(m => m.content);

    supabase.functions.invoke('compress-day-memories', {
      body: { bullets, day: completedDay, conversationId }
    }).then(async ({ data, error }) => {
      if (!error && data?.synopsis) {
        await handleCreateMemory(data.synopsis, completedDay, null, undefined, 'synopsis');
        for (const bm of bulletMemories) {
          await handleDeleteMemory(bm.id);
        }
      }
    }).catch(err => {
      console.error('[Day compression] Failed:', err);
    });
  }
}, [currentDay, memories, memoriesEnabled, conversationId]);
```

**IMPORTANT**: The dependency array is `[currentDay, memories, memoriesEnabled, conversationId]` -- not just `[currentDay]`. All four values are used inside the effect body. The `currentDay > prevDay` guard prevents compression from running when only `memories`, `memoriesEnabled`, or `conversationId` change, so there is no risk of spurious compression.

### 5. Expected Behavior

When the user clicks the day increment button, a background process fetches all bullet memories for the completed day, sends them to the compression edge function, saves the resulting synopsis, and deletes the raw bullets. The memory list stays compact: one synopsis per completed day plus live bullets for the active day only.

---

## Issue #6C: Memory Type Cannot Distinguish Bullets from Synopses

### 1. Current Problem

The `Memory` type in `src/types.ts` (line 502) has no field to identify whether a stored entry is a current-day bullet point or a completed-day synopsis. The `memories` database table also has no such column. Without this distinction, the compression logic in Issue #6B cannot identify which entries to compress and which to skip.

### 2. What This Causes

Without an `entryType` field:
- Compression logic cannot filter only bullet entries (skipping already-compressed synopses)
- The prompt cannot format bullets and synopses differently
- Traits only accumulate and can never be structurally separated for display

### 3. Scope

| File | Change |
|------|--------|
| `src/types.ts` | Add `MemoryEntryType` type and `entryType` field to `Memory` |
| Database migration | Add `entry_type` column to `memories` table |
| `src/services/supabase-data.ts` | Update `dbToMemory()`, `createMemory()` to handle the new field |
| `src/services/llm.ts` | Update `memoriesContext` builder (lines 336-351) to format bullets and synopses differently |

### 4. Proposed Fix

**Database migration:**
```sql
ALTER TABLE memories ADD COLUMN entry_type TEXT NOT NULL DEFAULT 'bullet';
```
Existing rows correctly default to `'bullet'`.

**src/types.ts** (after line 500):
```typescript
export type MemoryEntryType = 'bullet' | 'synopsis';
```

Update `Memory` type to include:
```typescript
entryType: MemoryEntryType;
```

**supabase-data.ts:**
- `dbToMemory()` (line 1724): Add `entryType: row.entry_type || 'bullet'`
- `createMemory()` (line 1750): Accept optional `entryType` parameter (defaults to `'bullet'`), include `entry_type: entryType` in the insert

**ChatInterfaceTab.tsx:**
- `handleCreateMemory()` (line 470): Accept optional `entryType` parameter and pass through to `supabaseData.createMemory()`

**llm.ts** -- Replace `memoriesContext` builder (lines 336-351) to separate synopses from bullets:
```typescript
const synopses = memories.filter(m => m.entryType === 'synopsis');
const bullets = memories.filter(m => m.entryType === 'bullet' && m.day === currentDay);

const memoriesContext = (synopses.length > 0 || bullets.length > 0) ? `
    STORY MEMORIES:
    ${synopses.length > 0 ? `COMPLETED DAYS (summaries):
    ${synopses.sort((a, b) => (a.day || 0) - (b.day || 0))
      .map(m => `[Day ${m.day}] ${m.content}`).join('\n    ')}` : ''}
    ${bullets.length > 0 ? `\n    TODAY (Day ${currentDay} -- key events so far):
    ${bullets.map(m => `- ${m.content}`).join('\n    ')}` : ''}

    MEMORY RULES:
    - These events HAVE HAPPENED. Do not write them as new occurrences.
    - Characters should remember and reference past events appropriately.
    - Never contradict or "re-do" events listed in memories.
` : '';
```

### 5. Expected Behavior

Memory entries are typed as either `'bullet'` (live event entries) or `'synopsis'` (compressed day summaries). The compression logic filters by type safely. The chat prompt formats them differently: completed days appear as compact summaries under "COMPLETED DAYS", today's events appear as bullet points under "TODAY". Token cost stays flat regardless of session length.

---

## Implementation Order

These three sub-issues are interdependent and must be delivered together:

1. **#6C first** (database migration + type changes) -- foundation for the other two
2. **#6A second** (auto-extraction in handleSend) -- can now create bullets with the correct `entryType`
3. **#6B last** (compression edge function + day-change trigger) -- depends on #6C's `entryType` and #6A's bullets existing

---

## 6. Codebase Analysis Confirmation

I have read and analyzed:
- `src/components/chronicle/ChatInterfaceTab.tsx` -- `handleSend()` post-response block (lines 2200-2250), `incrementDay()` (line 2100), `handleCreateMemory()` (line 470), `handleDeleteMemory()` (line 492), `allCharacterNames` memo (line 507), `memoriesEnabled` state (line 340), `memories` state (line 339)
- `src/types.ts` -- `Memory` type (lines 502-512), `MemorySource` (line 500)
- `src/services/supabase-data.ts` -- `dbToMemory()` (line 1724), `createMemory()` (line 1750), `fetchMemories()` (line 1738), `deleteMemory()` (line 1786)
- `src/services/llm.ts` -- `memoriesContext` builder (lines 336-351)
- `supabase/functions/extract-memory-events/index.ts` -- full file (168 lines, functional, uses xAI Grok)

## 7. Guide Document Confirmation

I have read:
- `docs/guides/GUIDE_STYLE_RULES.md` -- formatting rules
- `docs/guides/edge-functions-ai-services-structure-guide.md` -- Bug #6 listed as ACTIVE (line 120), Section 2 (edge functions inventory)
- `docs/guides/chat-interface-page-structure-guide.md` -- Bug #6 listed as ACTIVE (line 275), memory-related state at lines 338-342

## 8. Guide Documentation Updates

### `docs/guides/edge-functions-ai-services-structure-guide.md`
- Section 2: Add `compress-day-memories` to edge functions inventory
- Section 5: Bug #6 status from `ACTIVE` to `RESOLVED -- 2026-03-01 -- Auto-extraction fires after every AI response, day-transition compression via new compress-day-memories edge function, entryType field distinguishes bullets from synopses`

### `docs/guides/chat-interface-page-structure-guide.md`
- Section 6 (Data Architecture): Document `previousDayRef`, auto-memory extraction in handleSend, day-compression useEffect with full dependency array
- Section 8 (State Management): Add `previousDayRef` to state table
- Section 12: Bug #6 from `ACTIVE` to `RESOLVED -- 2026-03-01`

