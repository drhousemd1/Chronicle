> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format — do not skip sections, do not reorganize
> 5. USE REAL VALUES from the code — exact file paths, exact Tailwind classes, exact hex codes
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component
>
> If a section does not apply, write: `N/A — [specific reason]`
>
> Never write: "see code for details" — this document exists so no one needs to read the code.

# PAGE: CHAT INTERFACE

---

## 1. Page Overview

| Field | Detail |
|-------|--------|
| **Tab Key** | `chat` |
| **Source File** | `src/components/chronicle/ChatInterfaceTab.tsx` (~6023 lines) |
| **Purpose** | The core roleplay/chat experience. Renders conversation messages, handles LLM streaming, manages character state tracking, side character discovery, scene images, and memory system. |
| **Entry Point** | Activated when user clicks "Resume" on a conversation or starts a new session from Your Stories |
| **User Role** | Authenticated users only |

---

## 2. Layout & Structure

The chat interface uses a fixed two-panel layout rendered in `src/components/chronicle/ChatInterfaceTab.tsx`.

- **Shell**: `flex flex-1 min-h-0 min-w-0 h-full w-full flex-row overflow-hidden relative`
- **Sidebar panel**: fixed-width split pane on the left. Width is locked to `300px` via `CHAT_SIDEBAR_WIDTH = CHAT_TILE_WIDTH + 32`; shell uses `h-full flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden`
- **Main panel**: `flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden h-full relative z-10`

The character column is intentionally kept as a fixed session sidebar and does **not** stack above the transcript when the browser narrows. The transcript area is the pane that shrinks first.

---

## 3. UI Elements — Complete Inventory

| Element | Type | Label/Text | Component File | Notes |
|---------|------|-----------|----------------|-------|
| Message bubble | Custom div | — | `ChatInterfaceTab.tsx` | Parsed into segments: dialog `"..."`, action `*...*`, thought `(...)`, plain |
| Send button | Button | Send | `ChatInterfaceTab.tsx` | Sends user message and triggers LLM response |
| Regenerate button | Icon button | `RefreshCw` | `ChatInterfaceTab.tsx` | Re-generates last AI response |
| Message actions | Dropdown | `MoreVertical` | `ChatInterfaceTab.tsx` | Copy, Edit, Delete per message |
| Day/Time tracker | Badge | Day X / Time | `ChatInterfaceTab.tsx` | Shows current in-story day and time of day |
| Time advance | Icon buttons | Sunrise/Sun/Sunset/Moon | `ChatInterfaceTab.tsx` | Manually advance time of day |
| Day advance | Icon button | `StepForward` | `ChatInterfaceTab.tsx` | Advance to next day |
| Settings gear | Icon button | `Settings` | `ChatInterfaceTab.tsx` | Opens chat settings panel |
| Image button | Icon button | `ImageIcon` | `ChatInterfaceTab.tsx` | Scene image generation |
| Memory button | Icon button | `Brain` | `ChatInterfaceTab.tsx` | Opens memories modal |

---

## 4. User Interactions & Event Handlers

| Action | Handler | Effect |
|--------|---------|--------|
| Send message | `handleSendMessage` | Saves user message, streams AI response via `generateRoleplayResponseStream()` |
| Regenerate | `handleRegenerate` | Deletes last AI message, re-streams response |
| Edit message | `openInlineMessageEditor()` → `handleInlineEditSave()` / `handleInlineEditCancel()` | Opens in-place rich editors inside the existing bubble, preserves avatar wrap + token styling, and keeps every multi-speaker row editable in its original position |
| Delete message | `handleDeleteMessage` | Removes message from conversation |
| Copy message | `handleCopy` | Copies message text to clipboard |
| Time change | `handleTimeChange` | Updates `current_time_of_day` on conversation |
| Day advance | `handleDayAdvance` | Increments `current_day` on conversation |
| Load older messages | `onLoadOlderMessages` | Lazy-loads paginated older messages |

---

## 5. Modals, Dialogs & Sheets

#### Modal: Scene Image Generation

| Field | Detail |
|-------|--------|
| **Trigger** | Image icon button in chat header |
| **Component** | `src/components/chronicle/SceneImageGenerationModal.tsx` |
| **Purpose** | Generate scene images using AI based on current conversation context |

#### Modal: Memories

| Field | Detail |
|-------|--------|
| **Trigger** | Brain icon button in chat header |
| **Component** | `src/components/chronicle/MemoriesModal.tsx` |
| **Purpose** | View, add, and manage conversation memories |

#### Modal: Sidebar Theme

| Field | Detail |
|-------|--------|
| **Trigger** | Settings in chat sidebar |
| **Component** | `src/components/chronicle/SidebarThemeModal.tsx` |
| **Purpose** | Customize chat sidebar appearance |
| **Theme** | Dark-themed modal: `bg-zinc-900 border-white/10`, dropdowns use `bg-zinc-800` |

#### Modal: Character Edit

| Field | Detail |
|-------|--------|
| **Trigger** | Click on character card in sidebar |
| **Component** | `src/components/chronicle/CharacterEditModal.tsx` |
| **Purpose** | Edit character session state mid-conversation |

---

## 6. Data Architecture

### 6a. LLM Integration

Primary function: `generateRoleplayResponseStream()` in `src/services/llm.ts` (~1070 lines)

**System Prompt Construction** (`getSystemInstruction()`):
1. Builds world context from `ScenarioData.world.core`
2. Builds character state blocks for AI-controlled characters only; user-controlled listed as names-only reference
3. Injects story arc/goal directives with flexibility levels (rigid/normal/flexible)
4. Injects content theme directives via `buildContentThemeDirectives()`
5. Injects memory context if enabled
6. Injects dialog formatting rules based on POV setting (first/third person)
7. Injects time-of-day context
8. INSTRUCTIONS block includes DO NOT GENERATE FOR quick-reference, IN-SESSION TRAIT DYNAMICS, and forward momentum AI-character canon rule

**Streaming**: Uses backend Edge Function `chat` with streaming response.

**Adaptive Length Control**: `responseLengthsRef` tracks word counts of recent responses. `getLengthDirective()` detects locked length patterns (last 3 responses within 20% of each other) and injects a targeted length directive.

**AI-Character Canon Detection**: `buildCanonNote()` (exported from `llm.ts`) checks if user input contains `CharacterName:` prefixes matching AI-controlled characters. If detected, returns a `[CANON NOTE]` prefix to prevent re-narration. Applied in all three generation paths: `handleSend`, `handleRegenerateMessage`, and `handleContinueConversation` (continue checks the most recent user message in history).

**Session Depth**: `sessionMessageCountRef` increments per exchange and is injected as `[SESSION: Message N]` for precise trait evolution guidance.

### 6b. Character State Tracking

After each AI response, the system can extract character updates:
- Edge Function: `extract-character-updates` (model: `grok-4-1-fast-reasoning`)
- Service: `src/services/character-ai.ts`
- **Throttled**: Extraction only fires every 5th AI response (controlled by `extractionCountRef` in `ChatInterfaceTab.tsx`, reset on conversation switch)
- Tracks: physical appearance, clothing, mood, location, relationships, personality changes
- Updates stored in `character_session_states` table

### 6c. Side Character Discovery

Service: `src/services/side-character-generator.ts`
- Parses AI responses for new character names
- Auto-creates side character entries in `side_characters` table
- Configurable via `proactiveCharacterDiscovery` UI setting

### 6d. Memory System

- **Auto-extraction**: After every AI response in `handleSend`, `extract-memory-events` is invoked non-blocking. Extracted events are saved as `entryType: 'bullet'` memories tagged with current day/time.
- **Day-transition compression**: When `currentDay` increments, a `useEffect` (guarded by `currentDay > prevDay && memoriesEnabled && memoriesLoaded`) invokes `compress-day-memories` edge function (grok-3-mini). Completed-day bullets are compressed into a 2-3 sentence synopsis (`entryType: 'synopsis'`), raw bullets deleted.
- **Conversation-switch safety**: `previousDayRef.current` is reset in the `conversationId` reset effect to prevent stale-state compression on conversation switch.
- **Manual save**: `MemoryQuickSaveButton` component for user-initiated memory entries.
- **Prompt injection**: `memoriesContext` in `llm.ts` separates synopses under "COMPLETED DAYS" and today's bullets under "TODAY" with memory rules preventing contradiction.

### 6e. Key Tables

| Table | Purpose |
|-------|--------|
| `conversations` | Conversation metadata (title, day, time_of_day) |
| `messages` | Individual messages (role, content, day, time_of_day) |
| `character_session_states` | Per-conversation character state snapshots |
| `side_characters` | AI-discovered side characters |
| `memories` | Extracted memory events |
| `scenes` | Generated scene images |

---

## 7. Component Tree

```tsx
<ChatInterfaceTab>  # src/components/chronicle/ChatInterfaceTab.tsx
  {/* Main chat area */}
  <MessageBubble> (×N)  # inline in ChatInterfaceTab
    <DropdownMenu>  # message actions
  <TextArea>  # src/components/chronicle/UI.tsx (input)
  <Button>  # send button
  
  {/* Right sidebar */}
  <ScrollableSection>  # src/components/chronicle/ScrollableSection.tsx
    <SideCharacterCard> (×N)  # src/components/chronicle/SideCharacterCard.tsx
  <CharacterEditModal>  # src/components/chronicle/CharacterEditModal.tsx
  <SceneImageGenerationModal>  # src/components/chronicle/SceneImageGenerationModal.tsx
  <MemoriesModal>  # src/components/chronicle/MemoriesModal.tsx
  <MemoryQuickSaveButton>  # src/components/chronicle/MemoryQuickSaveButton.tsx
  <SidebarThemeModal>  # src/components/chronicle/SidebarThemeModal.tsx
```

---

## 8. State Management

| State | Type | Purpose |
|-------|------|--------|
| `messages` | `Message[]` | Current conversation messages |
| `isStreaming` | `boolean` | Whether AI response is currently streaming |
| `sideCharacters` | `SideCharacter[]` | Discovered side characters |
| `sessionStates` | `CharacterSessionState[]` | Per-conversation character states |
| `memories` | `Memory[]` | Conversation memories |
| `currentDay` | `number` | In-story day counter |
| `currentTimeOfDay` | `TimeOfDay` | sunrise/day/sunset/night |
| `responseLengthsRef` | `useRef<number[]>` | Tracks word counts of recent AI responses for adaptive length directives |
| `sessionMessageCountRef` | `useRef<number>` | Increments per exchange; injected as `[SESSION: Message N]` for trait evolution |
| `previousDayRef` | `useRef<number>` | Tracks previous day value; reset on conversation switch; used by compression effect to detect real day increments |
| `memoriesLoaded` | `boolean` | Guards compression effect — prevents firing before conversation memories are fetched |
| `extractionCountRef` | `useRef<number>` | Counts AI responses; extraction fires when `count % 5 === 0`; reset on conversation switch |
| `narrativeDirectiveRef` | `useRef<string \| null>` | Pass 14 — Stores the narrative director's tactical directive for the next turn. Generated async after each AI response by `generate-narrative-directive` edge function. Injected as `[DIRECTOR: ...]` tag in next `handleSend`, then cleared (one-shot). Reset on conversation switch. |
| `outwardScoreOffset` | N/A (code-side in `llm.ts`) | Outward traits receive +15 effective score bonus during prompt formatting; inward traits receive -10 penalty. This ensures outward presentation (e.g., shy/reserved) dominates visible expression by default. As inward scores rise through adherence scoring, they naturally catch up. At raw 75%: outward → 90% (Primary), inward → 65% (Moderate). |
| `sidebarBgIsLight` | `boolean` | Detected via canvas pixel luminosity (threshold > 128). Drives adaptive frosted glass theming on character cards, scroll indicators, and "Exit Scenario" text color |

---

## 9. Styling Reference

### 9a. Message Bubbles

| Segment Type | Rendering |
|-------------|----------|
| Dialog `"..."` | Quoted text styling |
| Action `*...*` | Italic action text |
| Thought `(...)` | Parenthetical thought styling |
| Plain text | Default narrative text |
| `[SCENE: ...]` | Stripped from display, used for scene image triggers |

Inline edit mode reuses the same token parsing/styling path instead of swapping to a plain textarea. `InlineFormattedMessageEditor` renders the editable surface in-place with `contentEditable`, `text-[15px] leading-relaxed`, and token HTML from `parseMessageTokens()` + `tokensToStyledHtml()` so dialogue/action/thought styling remains visible during edits.

For multi-speaker messages, `openInlineMessageEditor()` builds per-segment edit state from `parseMessageSegments()` + `mergeByRenderedSpeaker()`. Edit mode renders one inline editor per merged speaker block so later character rows stay visible instead of collapsing into the first segment.

### 9b. Chat Settings

Configurable via `onUpdateUiSettings`:

| Setting | Key | Type | Persistence |
|---------|-----|------|-------------|
| Show backgrounds | `showBackgrounds` | boolean | `stories.ui_settings` |
| Transparent bubbles | `transparentBubbles` | boolean | `stories.ui_settings` |
| Dark mode | `darkMode` | boolean | `stories.ui_settings` |
| Offset bubbles | `offsetBubbles` | boolean | `stories.ui_settings` |
| Character discovery | `proactiveCharacterDiscovery` | boolean | `stories.ui_settings` |
| Dynamic text | `dynamicText` | boolean | `stories.ui_settings` |
| Proactive narrative | `proactiveNarrative` | boolean | `stories.ui_settings` |
| Narrative POV | `narrativePov` | 'first' \| 'third' | `stories.ui_settings` |
| NSFW intensity | `nsfwIntensity` | 'normal' \| 'high' | `stories.ui_settings` |
| Realism mode | `realismMode` | boolean | `stories.ui_settings` |
| Response verbosity | `responseVerbosity` | 'concise' \| 'balanced' \| 'detailed' | `stories.ui_settings` |
| Time progression mode | `timeProgressionMode` | 'manual' \| 'automatic' | `conversations` table |
| Time progression interval | `timeProgressionInterval` | 5 \| 10 \| 15 \| 30 \| 60 (minutes) | `conversations` table |
| Time remaining | `time_remaining` | number (seconds) | `conversations` table |

**Dual Persistence Strategy**: Narrative/behavioral settings persist to `stories.ui_settings` (JSONB), becoming defaults for that scenario. Temporal state (time mode, interval, `time_remaining`) persists to the `conversations` table, tracked per-session.

### 9c. Adaptive Character Card Theming

Character cards in the sidebar use adaptive frosted glass styling based on `sidebarBgIsLight`:

| Background | Card | Text | Menu | Avatar |
|------------|------|------|------|--------|
| **Dark** | `bg-white/30 hover:bg-white backdrop-blur-sm` | `text-slate-800` | `hover:bg-slate-200 text-slate-700` | `bg-purple-50 border-purple-100` |
| **Light** | `bg-black/30 hover:bg-black/50 backdrop-blur-sm` | `text-white` | `hover:bg-white/20 text-white/70` | `bg-zinc-800 border-white/20` |

Applied in both `renderCharacterCard()` (main characters) and `SideCharacterCard` (side characters via `isDarkBg` prop).

---

## 10. Security & Access Control

- All message CRUD gated by RLS: user must own the parent conversation
- Character session states scoped to `user_id = auth.uid()`
- Side characters scoped to `user_id = auth.uid()`
- Memories scoped to `user_id = auth.uid()`
- Edge Functions validate auth token before processing

---

## 11. Dependencies & Cross-Page Interactions

| Dependency | Direction | Detail |
|-----------|-----------|--------|
| Scenario Builder → Chat | Data flow | World data, character definitions used in system prompt |
| Character Builder → Chat | Data flow | Character traits injected into LLM context |
| Image Library → Chat | Asset | Scene images can be picked from library |
| Chat → Character Builder | State sync | Character session state updates flow back |

---

## 12. Known Issues & Gotchas

- **RESOLVED — Bug #1**: `buildCharacterStateBlock()` omits empty sections — 13/16 section types invisible to AI when empty. (2026-03-01)
- **RESOLVED — Bug #4**: Wrong AI model (`grok-3-mini`) used for character extraction instead of `grok-3`. Now uses `grok-4-1-fast-reasoning`. (2026-03-01, updated 2026-03-04)
- **RESOLVED — Bug #5**: Extraction prompt lacks analytical depth — shallow analysis. (2026-03-01)
- **RESOLVED — Bug #7**: Response length anchoring — all responses same length. Fixed with adaptive `responseLengthsRef` + `getLengthDirective()`. (2026-03-01)
- **RESOLVED — Bug #8**: Forward momentum — AI re-narrates user-authored AI character content. Fixed with canon note detection in `handleSend` + system prompt rule. (2026-03-01)
- **RESOLVED — Bug #9**: Control rule reliability — AI generates for user-controlled characters. Fixed by filtering CAST to AI-only + high-authority quick-reference. (2026-03-01)
- **RESOLVED — Bug #10**: No in-session trait evolution guidance. Fixed with IN-SESSION TRAIT DYNAMICS block + `sessionMessageCountRef` + personality-driven NSFW pacing. (2026-03-01)
- **RESOLVED — Bug #11**: NSFW intensity and verbosity instruction overlap. Fixed by moving sensory detail lines from nsfwRules to verbosityRules. (2026-03-01)
- **RESOLVED — Bug #6**: Memory system incomplete — no long-term accumulation. Fixed with auto-extraction in `handleSend`, `previousDayRef` (reset on conversation switch) + day-compression `useEffect` (guarded by `memoriesLoaded`, dependency array: `[currentDay, memories, memoriesEnabled, conversationId]`), `entryType` field on Memory type, split `memoriesContext` builder in `llm.ts`, and `compress-day-memories` edge function (grok-3-mini). (2026-03-01)
- **ACTIVE**: `ChatInterfaceTab.tsx` is ~5000 lines — extremely large single component. (2026-03-01)
- **ACTIVE**: Message parsing regex may miss edge cases with nested formatting markers. (2026-03-01)
- **RESOLVED — 2026-03-15**: Tile image "shoot up then bounce" on expand/collapse. Root-cause: `transition-all` animated `object-position` changes. Fix: changed to `transition-[height,object-fit] duration-300`, matched expanded/collapsed classes to Story Builder (`h-auto object-contain object-top` / `h-full object-cover`).
- **RESOLVED — 2026-03-04**: Extraction throttling — `extract-character-updates` now throttled to every 5th AI response via `extractionCountRef` to reduce API costs.
- **RESOLVED — 2026-03-06**: Mode hint tooltip clipped behind left nav / background layers. Root-cause: shared `TooltipContent` rendered without a portal, trapping it inside local overflow/stacking contexts. Fix: wrapped `TooltipPrimitive.Content` in `TooltipPrimitive.Portal` in shared tooltip component (`src/components/ui/tooltip.tsx`), raised z-index to `z-[80]`, added `collisionPadding`. Chat tooltip uses `side="bottom" align="start"` with standard info-tooltip styling.
- **RESOLVED — 2026-03-06**: Chat settings (NSFW Intensity, Realism Mode, Time Mode, etc.) not persisting across navigation. Root-cause: `onUpdateUiSettings` in `Index.tsx` only updated in-memory state via `handleUpdateActive`, never wrote to DB. Fix: added `updateStoryUiSettings()` in `supabase-data.ts` for targeted `stories.ui_settings` update; `onUpdateUiSettings` handler now fire-and-forgets a DB write after merging the patch.
- **RESOLVED — 2026-03-06**: Time progression mode/interval not persisting. Root-cause: `updateConversationMeta` only mapped `currentDay`, `currentTimeOfDay`, `title` — `timeProgressionMode` and `timeProgressionInterval` were silently dropped. Fix: expanded patch type and DB column mapping in `updateConversationMeta`; `onSaveScenario` handler now passes both fields.
- **RESOLVED — 2026-03-06**: Auto-timer `timeRemaining` resetting on navigation. Root-cause: remaining seconds were never persisted — always defaulted to full interval on load. Fix: added `time_remaining` column to `conversations` table; `ChatInterfaceTab` saves remaining seconds on unmount/beforeunload via `updateConversationMeta`, restores on load.
- **RESOLVED — 2026-04-04**: Chat sidebar stacked above the transcript after the responsive shell pass. Root-cause: `ChatInterfaceTab` used `flex-col lg:flex-row` plus `w-full` / bounded-height sidebar rules, which caused the character column to jump above the conversation at narrower widths. Fix: restored a fixed split-pane shell and locked sidebar width to `CHAT_SIDEBAR_WIDTH` (`300px`) so the transcript shrinks before the character column reflows.
- **RESOLVED — 2026-04-04**: Inline message edit mode lost Chronicle text styling and shifted under the avatar. Root-cause: the in-place formatted editor was replaced with a plain transparent `<textarea>`, which broke avatar wrapping, token styling, and bubble-height continuity. Fix: restored an in-place rich editor (`InlineFormattedMessageEditor`) that keeps dialogue/action/thought styling visible while editing inside the existing bubble.
- **RESOLVED — 2026-04-04**: Multi-speaker inline edit mode blanked later speaker rows. Root-cause: edit mode only mounted the editor in the first rendered segment while later speaker shells stayed mounted with null content, so second/third character rows appeared empty under their avatars. Fix: `openInlineMessageEditor()` now captures structured per-segment edit state and edit mode renders one `InlineFormattedMessageEditor` per merged speaker block.

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-04-04 — Restored the fixed split-pane chat sidebar, repaired inline message editing, and fixed multi-speaker edit mode so every speaker block stays visible in place while editing.
