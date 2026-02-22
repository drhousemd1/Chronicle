
# Chat History Page — Guide Content

## What This Does
Write the full markdown documentation for the "Chat History Page (Structure Guide)" document (ID: `20b1c410-c7f7-4eca-bccc-febd3dfd21a7`) following the same 13-section structure used in all other guides.

## Content Summary (based on code review)

**1. Page Overview** — Route: `tab === "conversations"` in `Index.tsx`. Primary source: `ConversationsTab.tsx` (127 lines). Purpose: centralized view of all saved chat sessions across all scenarios. Sidebar position: 5th item ("Chat History"). Entry points: sidebar click. No sub-views or nested navigation.

**2. Layout and Structure** — Single flat list layout inside `max-w-4xl mx-auto py-4`, wrapped in a `bg-black` container with `p-10` and `overflow-y-auto h-full`. Each conversation row is a horizontal flex strip: thumbnail (left), title + preview (center), action buttons (right). Rows divided by `divide-y divide-white/10`. A full-screen loading overlay appears when resuming a session (`isResuming` state).

**3. UI Elements — Complete Inventory** — "Chat History" heading (header), "Delete All" button (header, rounded-xl, dark themed), conversation rows (thumbnail, title, message count, date, last message preview), Pencil (rename) icon button, Trash (delete) icon button, loading overlay spinner + "Loading session..." text.

**4. Cards / List Items** — Each conversation row: thumbnail `w-12 h-12 rounded-lg border border-[#4a5f7f]` with scenario cover image or fallback book emoji. Title area shows `scenarioTitle` (font-bold text-white truncate), message count emoji (speech bubble + count), dot separator, date string (MMM DD, YYYY). Second line: `lastMessage` (text-sm text-zinc-400 truncate). Hover state: `hover:bg-white/5`. Empty state: centered speech bubble emoji + "No saved sessions found" + helper text.

**5. Modals and Overlays** — No custom modals. Rename uses browser `prompt()` dialog. Delete uses browser `confirm()` dialog. "Delete All" uses browser `confirm()` with count. Loading overlay: absolute-positioned `bg-black/70 backdrop-blur-sm` with white spinner and text.

**6. Data Architecture** — Data type: `ConversationMetadata` (conversationId, scenarioId, scenarioTitle, scenarioImageUrl, conversationTitle, lastMessage, messageCount, createdAt, updatedAt). Source tables: `conversations` and `messages` (joined via `enrichConversationRegistry`). Data is fetched once at app load via `fetchConversationRegistry()`, then enriched lazily when the tab is first viewed (message previews populated). Sorted client-side by `updatedAt` descending. No React Query — direct `useState` management in `Index.tsx`. Registry is optimistically updated on delete.

**7. Component Tree** — `Index.tsx > header ("Chat History" + "Delete All" button) > div.bg-black > loading overlay (conditional) > ConversationsTab > conversation rows`.

**8. Custom Events and Callbacks** — `onResume(scenarioId, conversationId)` — loads the scenario and conversation, transitions to chat interface. `onRename(scenarioId, conversationId)` — browser prompt, then `handleRenameConversationFromHistory` which calls `supabaseData.renameConversation()` and refreshes the registry. `onDelete(scenarioId, conversationId)` — browser confirm, then `handleDeleteConversationFromHistory` with optimistic removal and `supabaseData.deleteConversation()`. `handleDeleteAllConversations()` — confirms, clears entire registry, deletes all conversations sequentially.

**9. Styling Reference** — Container: `bg-black` full height. Row hover: `hover:bg-white/5`. Dividers: `divide-white/10`. Thumbnail border: `border-[#4a5f7f]`. Title: `font-bold text-white`. Preview text: `text-sm text-zinc-400`. Date/count: `text-sm text-zinc-500`. Action icons: `text-zinc-500`, hover rename `hover:text-zinc-300 hover:bg-white/10`, hover delete `hover:text-red-500 hover:bg-red-500/10`. Empty state: `opacity-50`, `text-zinc-500/600`. "Delete All" button: `rounded-xl`, uses CSS custom properties for theming.

**10. Cross-Page Dependencies** — `onResume` triggers a full scenario load + transition to `chat_interface` tab. The registry is populated during the global data load in `Index.tsx` (shared with the scenario builder's conversation list). Deleting a conversation here also updates `activeData.conversations` if the deleted conversation belongs to the currently loaded scenario.

**11. Security and Access Control** — `conversations` table: all CRUD scoped to `auth.uid() = user_id`. `messages` table: all CRUD scoped via parent conversation ownership. No cross-user visibility.

**12. Known Issues / Quirks** — Rename uses browser `prompt()` (not a styled modal). Delete uses browser `confirm()` (not a styled modal). "Delete All" deletes conversations sequentially in a loop rather than a batch operation. Enrichment (message previews) only runs once per session (`conversationsEnriched` flag) — new conversations created after first viewing won't show previews until page reload. Loading overlay uses a simple `isResuming` boolean which may flash briefly on fast connections.

**13. Planned / Future Changes** — None documented.

## Implementation
Single database update to write the markdown content to `guide_documents` row `20b1c410-c7f7-4eca-bccc-febd3dfd21a7`. No code file changes needed.
