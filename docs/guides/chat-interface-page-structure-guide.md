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
| **Source File** | `src/components/chronicle/ChatInterfaceTab.tsx` (~3873 lines) |
| **Purpose** | The core roleplay/chat experience. Renders conversation messages, handles LLM streaming, manages character state tracking, side character discovery, scene images, and memory system. |
| **Entry Point** | Activated when user clicks "Resume" on a conversation or starts a new session from Your Stories |
| **User Role** | Authenticated users only |

---

## 2. Layout & Structure

The chat interface uses a two-panel layout:
- **Main panel**: Message stream with input area at bottom
- **Right sidebar**: Character cards, side characters, settings, scene gallery

The right sidebar is collapsible and contains multiple scrollable sections.

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
| Edit message | `handleEditMessage` | Opens inline editor, saves edited content |
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

**AI-Character Canon Detection**: Before each request, `handleSend` checks if user input contains `CharacterName:` prefixes matching AI-controlled characters. If detected, prepends a `[CANON NOTE]` to prevent re-narration.

**Session Depth**: `sessionMessageCountRef` increments per exchange and is injected as `[SESSION: Message N]` for precise trait evolution guidance.

### 6b. Character State Tracking

After each AI response, the system can extract character updates:
- Edge Function: `extract-character-updates`
- Service: `src/services/character-ai.ts`
- Tracks: physical appearance, clothing, mood, location, relationships, personality changes
- Updates stored in `character_session_states` table

### 6c. Side Character Discovery

Service: `src/services/side-character-generator.ts`
- Parses AI responses for new character names
- Auto-creates side character entries in `side_characters` table
- Configurable via `proactiveCharacterDiscovery` UI setting

### 6d. Memory System

- Edge Function: `extract-memory-events`
- Memories extracted from conversation and stored in `memories` table
- Manual save via `MemoryQuickSaveButton` component
- Memory context injected into system prompt when enabled

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

### 9b. Chat Settings

Configurable via `onUpdateUiSettings`:

| Setting | Key | Type |
|---------|-----|------|
| Show backgrounds | `showBackgrounds` | boolean |
| Transparent bubbles | `transparentBubbles` | boolean |
| Dark mode | `darkMode` | boolean |
| Offset bubbles | `offsetBubbles` | boolean |
| Character discovery | `proactiveCharacterDiscovery` | boolean |
| Dynamic text | `dynamicText` | boolean |
| Proactive narrative | `proactiveNarrative` | boolean |
| Narrative POV | `narrativePov` | 'first' \| 'third' |
| NSFW intensity | `nsfwIntensity` | 'normal' \| 'high' |
| Realism mode | `realismMode` | boolean |
| Response verbosity | `responseVerbosity` | 'concise' \| 'balanced' \| 'detailed' |

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
- **RESOLVED — Bug #4**: Wrong AI model (`grok-3-mini`) used for character extraction instead of `grok-3`. (2026-03-01)
- **RESOLVED — Bug #5**: Extraction prompt lacks analytical depth — shallow analysis. (2026-03-01)
- **RESOLVED — Bug #7**: Response length anchoring — all responses same length. Fixed with adaptive `responseLengthsRef` + `getLengthDirective()`. (2026-03-01)
- **RESOLVED — Bug #8**: Forward momentum — AI re-narrates user-authored AI character content. Fixed with canon note detection in `handleSend` + system prompt rule. (2026-03-01)
- **RESOLVED — Bug #9**: Control rule reliability — AI generates for user-controlled characters. Fixed by filtering CAST to AI-only + high-authority quick-reference. (2026-03-01)
- **RESOLVED — Bug #10**: No in-session trait evolution guidance. Fixed with IN-SESSION TRAIT DYNAMICS block + `sessionMessageCountRef` + personality-driven NSFW pacing. (2026-03-01)
- **RESOLVED — Bug #11**: NSFW intensity and verbosity instruction overlap. Fixed by moving sensory detail lines from nsfwRules to verbosityRules. (2026-03-01)
- **RESOLVED — Bug #6**: Memory system incomplete — no long-term accumulation. Fixed with auto-extraction in `handleSend`, `previousDayRef` + day-compression `useEffect` (dependency array: `[currentDay, memories, memoriesEnabled, conversationId]`), `entryType` field on Memory type, and split `memoriesContext` builder in `llm.ts`. (2026-03-01)
- **ACTIVE**: `ChatInterfaceTab.tsx` is ~3900 lines — extremely large single component. (2026-03-01)
- **ACTIVE**: Message parsing regex may miss edge cases with nested formatting markers. (2026-03-01)

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-03-01 — Bugs #6-#11 resolved.