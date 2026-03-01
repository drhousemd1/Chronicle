# Chat History Page

## 1. Page Overview

**Route:** `tab === "conversations"` in `Index.tsx`
**Primary source:** `ConversationsTab.tsx` (127 lines)
**Purpose:** Centralized view of all saved chat sessions across all scenarios. Users can browse, resume, rename, and delete their conversation history from a single list.
**Sidebar position:** 5th item — "Chat History"
**Entry points:** Sidebar click only. No sub-views or nested navigation.

---

## 2. Layout and Structure

Single flat list layout. No tabs, no grid, no nested views.

```
┌─────────────────────────────────────────────┐
│ Header: "Chat History"        [Delete All]  │
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │ bg-black p-10 overflow-y-auto h-full     ││
│ │                                          ││
│ │  max-w-4xl mx-auto py-4                  ││
│ │  ┌──────────────────────────────────────┐││
│ │  │ [thumb] Title  💬 5 • Jan 12  [✏][🗑]│││
│ │  │         Last message preview...      │││
│ │  ├──────────────────────────────────────┤││
│ │  │ [thumb] Title  💬 12 • Feb 3  [✏][🗑]│││
│ │  │         Last message preview...      │││
│ │  └──────────────────────────────────────┘││
│ └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- Outer container: `bg-black` full height with `p-10` and `overflow-y-auto h-full`
- Inner list: `max-w-4xl mx-auto py-4`
- Each row is a horizontal flex strip: thumbnail (left), title + preview (center), action buttons (right)
- Rows divided by `divide-y divide-white/10`
- Loading overlay (absolute-positioned) appears when resuming a session

---

## 3. UI Elements — Complete Inventory

| Element | Location | Details |
|---------|----------|---------|
| "Chat History" heading | Header | Page title |
| "Delete All" button | Header, right side | `rounded-xl`, dark themed, CSS custom properties |
| Conversation row | List body | Clickable flex strip with thumbnail, title area, action buttons |
| Scenario thumbnail | Row, left | `w-12 h-12 rounded-lg border border-[#4a5f7f]` |
| Scenario title | Row, center top | `font-bold text-white truncate` |
| Message count | Row, center top | Speech bubble emoji + count, `text-sm text-zinc-500` |
| Date | Row, center top | MMM DD, YYYY format, `text-sm text-zinc-500` |
| Last message preview | Row, center bottom | `text-sm text-zinc-400 truncate` |
| Rename button (Pencil) | Row, right | `text-zinc-500 hover:text-zinc-300 hover:bg-white/10` |
| Delete button (Trash) | Row, right | `text-zinc-500 hover:text-red-500 hover:bg-red-500/10` |
| Loading overlay | Full screen | `bg-black/70 backdrop-blur-sm` with spinner + "Loading session..." |
| Empty state | Center | Speech bubble emoji + "No saved sessions found" + helper text |

---

## 4. Cards / List Items

Each conversation row is a horizontal flex strip, not a card:

```
[Thumbnail] [Title area                          ] [Actions]
 w-12 h-12   scenarioTitle  💬 count • date         ✏  🗑
              lastMessage (truncated)
```

**Thumbnail:** `w-12 h-12 rounded-lg overflow-hidden border border-[#4a5f7f]`. Shows scenario cover image if available, otherwise a 📖 book emoji fallback on `bg-zinc-800`.

**Title area (clickable to resume):**
- Line 1: `scenarioTitle` (`font-bold text-white truncate`) + `💬 messageCount` (`text-sm text-zinc-500`) + dot separator + date string
- Line 2: `lastMessage` or "No messages yet" (`text-sm text-zinc-400 truncate leading-relaxed`)

**Hover state:** `hover:bg-white/5` on the entire row

**Empty state:** Centered layout with `opacity-50`:
- `💬` emoji (text-6xl)
- "No saved sessions found." (`font-bold text-zinc-500`)
- "Start playing a scenario to create your first save." (`text-sm text-zinc-600`)

---

## 5. Modals and Overlays

No custom modals are used on this page. All dialogs use native browser APIs:

| Action | Dialog | Details |
|--------|--------|---------|
| Rename | `window.prompt()` | Pre-filled with current conversation title |
| Delete single | `window.confirm()` | Simple confirmation message |
| Delete All | `window.confirm()` | Includes count of conversations to delete |

**Loading overlay:** Appears when `isResuming` is true. Absolute-positioned over the list container with `bg-black/70 backdrop-blur-sm`, a white spinning loader, and "Loading session..." text.

---

## 6. Data Architecture

**Primary data type:** `ConversationMetadata`

```typescript
interface ConversationMetadata {
  conversationId: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioImageUrl: string;
  conversationTitle: string;
  lastMessage: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}
```

**Source tables:** `conversations` and `messages` (joined via `enrichConversationRegistry`)

**Data flow:**
1. `fetchConversationRegistry()` loads all conversations at app startup
2. When the Chat History tab is first viewed, `enrichConversationRegistry()` populates message previews (last message text, message count)
3. Enrichment runs once per session (gated by `conversationsEnriched` flag)
4. Sorted client-side by `updatedAt` descending (most recent first)

**State management:** Direct `useState` in `Index.tsx` — no React Query. Registry is optimistically updated on delete operations.

---

## 7. Component Tree

```
Index.tsx
├── Header
│   ├── "Chat History" (h2)
│   └── "Delete All" button
├── div.bg-black (container)
│   ├── Loading overlay (conditional, when isResuming)
│   └── ConversationsTab
│       ├── Empty state (when no conversations)
│       └── Conversation rows (mapped from globalRegistry)
│           ├── Thumbnail button (clickable → onResume)
│           ├── Title/preview button (clickable → onResume)
│           └── Action buttons
│               ├── Rename (Pencil icon)
│               └── Delete (Trash icon)
```

---

## 8. Custom Events and Callbacks

| Callback | Trigger | What it does |
|----------|---------|-------------|
| `onResume(scenarioId, conversationId)` | Click thumbnail or title area | Loads the scenario and conversation, sets `isResuming`, transitions to `chat_interface` tab |
| `onRename(scenarioId, conversationId)` | Click pencil icon | Opens `window.prompt()`, calls `supabaseData.renameConversation()`, refreshes registry |
| `onDelete(scenarioId, conversationId)` | Click trash icon | Opens `window.confirm()`, optimistically removes from registry, calls `supabaseData.deleteConversation()` |
| `handleDeleteAllConversations()` | Click "Delete All" header button | Opens `window.confirm()` with count, clears entire registry, deletes all conversations sequentially in a loop |

**Resume flow detail:** `onResume` triggers `handleResumeConversationFromHistory` which loads the full scenario data, loads the conversation and its messages, then switches to the chat interface tab.

---

## 9. Styling Reference

| Element | Classes / Values |
|---------|-----------------|
| Outer container | `bg-black` full height |
| Inner padding | `p-10`, `overflow-y-auto h-full` |
| List container | `max-w-4xl mx-auto py-4` |
| Row wrapper | `rounded-2xl overflow-hidden` |
| Row dividers | `divide-y divide-white/10` |
| Row hover | `hover:bg-white/5 transition-all` |
| Row padding | `p-4`, `gap-4`, `flex items-center` |
| Thumbnail | `w-12 h-12 rounded-lg border border-[#4a5f7f]`, hover: `hover:ring-2 hover:ring-[#4a5f7f]` |
| Thumbnail fallback bg | `bg-zinc-800` |
| Title text | `font-bold text-white truncate` |
| Message count / date | `text-sm text-zinc-500` |
| Preview text | `text-sm text-zinc-400 truncate leading-relaxed` |
| Rename icon | `text-zinc-500 hover:text-zinc-300 hover:bg-white/10`, `p-2 rounded-lg` |
| Delete icon | `text-zinc-500 hover:text-red-500 hover:bg-red-500/10`, `p-2 rounded-lg` |
| Empty state container | `py-20 text-center opacity-50` |
| Empty state title | `font-bold text-zinc-500` |
| Empty state subtitle | `text-sm text-zinc-600 mt-1` |
| Loading overlay | `absolute inset-0 bg-black/70 backdrop-blur-sm z-50` |
| "Delete All" button | `rounded-xl`, uses CSS custom properties for theming |

---

## 10. Cross-Page Dependencies

| Dependency | Direction | Details |
|-----------|-----------|---------|
| Scenario load | Chat History → Chat Interface | `onResume` triggers full scenario load + tab transition to `chat_interface` |
| Global registry | Index.tsx ↔ Chat History | Registry is populated during global data load, shared with scenario builder's conversation list |
| Active scenario sync | Chat History → Active Data | Deleting a conversation here also updates `activeData.conversations` if the deleted conversation belongs to the currently loaded scenario |
| Enrichment | Index.tsx → ConversationsTab | Message previews are populated lazily via `enrichConversationRegistry()` on first tab view |

---

## 11. Security and Access Control

| Table | Policy | Rule |
|-------|--------|------|
| `conversations` | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |
| `messages` | SELECT, INSERT, UPDATE, DELETE | Via parent conversation: `EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid())` |

No cross-user visibility. All conversation data is strictly scoped to the authenticated user.

---

## 12. Known Issues / Quirks

- **Browser dialogs:** Rename uses `window.prompt()` and Delete uses `window.confirm()` — not styled modals. These look out of place in the dark-themed UI.
- **Sequential delete:** "Delete All" deletes conversations one at a time in a loop rather than a batch database operation. This can be slow with many conversations.
- **Stale previews:** Enrichment (message previews) only runs once per session via the `conversationsEnriched` flag. New conversations created after the first viewing of this tab won't show message previews until page reload.
- **Loading flash:** The `isResuming` overlay uses a simple boolean which may flash briefly on fast connections.
- **No pagination:** All conversations are loaded and rendered at once. Could become slow with hundreds of conversations.

---

## 13. Planned / Future Changes

None documented.