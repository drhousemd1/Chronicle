# Overview

## Chat History at a Glance

Chat History is Chronicle’s saved-session index. It helps an authenticated player find a conversation that already exists, resume that exact playthrough, or remove a session they no longer want. It is not a second story library: My Stories owns reusable story sources, while Chat History owns the list of conversation identities created by playing them.

Each row combines a conversation identity with enough story context to recognize it: cover image, story title, message count, last-updated date, creator name, and the latest-message preview. Selecting the image, title, or preview resumes the same conversation. The list is ordered by most recently updated first so the sessions the player used most recently appear at the top.

## Session Identity and Ownership

A saved session is identified by both a story identifier and a conversation identifier. The story identifier locates the reusable source and its current presentation data. The conversation identifier locates the player’s particular accepted history and playthrough state. Resuming must preserve both values; opening the story without the chosen conversation would create or display the wrong playthrough.

Chat History receives a global conversation registry assembled after authentication. The registry is summary data, not the full transcript. The full conversation, recent messages, side characters, and supporting story state are loaded only when the player resumes a row. This keeps the index lightweight while allowing Chat Interface to receive the state needed for the selected session.

## Resume Flow

Selecting a saved session asks the scenario lifecycle owner to fetch the referenced story and conversation. The resume path loads the recent message page, restores the conversation as the active session, adds relevant side characters and content-theme data, and then opens Chat Interface. If older messages exist, Chat Interface can request them in additional pages without changing their identity or order.

The visual transition alone does not prove the session was restored correctly. A correct resume requires the selected conversation identifier, the matching story, and its accepted messages to agree. A load failure must not silently create a replacement conversation or present an unrelated story as the saved session.

## Deletion and Recovery

The trash action removes one identified conversation, not its reusable story. The application asks for confirmation before deletion. It updates the visible registry promptly, calls the persistence boundary, and restores the previous registry entry if the delete request fails. The top-bar **Delete All** action is available only when saved conversations exist and uses its own confirmation before deleting the registry’s sessions.

Deletion is therefore distinct from removing a story in My Stories or unsaving a Gallery publication. It affects playthrough history only. A failed deletion should leave the prior session discoverable rather than making the interface look successful while the durable conversation remains.

## Loading, Empty, and Paging States

The authenticated data loader first fetches the conversation registry. When Chat History becomes active, it can enrich that registry with fuller display data. An empty registry renders **No saved sessions found** and directs the player to start playing a scenario. This is a real empty state, not proof that a failed request returned no sessions.

The screen initially displays up to 30 sessions. When more exist, **Load More** adds the next local page and reports how many remain. Paging changes only the number of registry rows shown; it does not create, fetch, or modify a conversation transcript.

## Handoffs and Evidence Limits

My Stories and Community Gallery can start a playthrough that later appears here. Chat History discovers and selects the saved conversation. Chat Interface owns the resumed play screen. Story Builder continues to own the reusable authored source, and the persistence layer owns durable conversation rows after a successful operation.

Source inspection confirms the current list, resume, pagination, confirmation, and rollback paths. It does not prove deployed row-level policies, live database completeness, or that every older conversation can currently be reconstructed. The **Supabase Tables** tab provides the last synchronized database reference and states its own limits.

# UI Elements and Functions

## Saved Session List

- A session card represents one conversation and uses the conversation identifier as its row key.
- The cover image is a resume control. When no cover exists, a book placeholder preserves the control’s location.
- The story title, message count, last-updated date, and creator name provide recognition without opening the transcript.
- The latest-message preview shows up to two lines. When no preview exists, it displays **No messages yet**.
- Selecting the cover, title area, or message preview resumes the same identified conversation.

## Delete Controls

- The red trash button requests deletion of the selected conversation without opening it.
- The single-session delete path requires confirmation from the application owner before the persistence operation begins.
- **Delete All** appears in the application top bar only when the registry contains conversations. It requests a separate confirmation and deletes the identified registry set.
- The visible registry is restored when the persistence call fails. Deletion does not remove the referenced story from My Stories.

## Empty and Pagination Controls

- **No saved sessions found** appears when the loaded registry is empty and explains that playing a story creates the first save.
- The first 30 sorted sessions are visible by default.
- **Load More (N remaining)** expands the local list by another 30. It does not load older transcript messages; that is a separate Chat Interface operation.

## Navigation and Accessibility Expectations

The resume surfaces and delete button are native buttons and must remain keyboard operable. The delete icon receives its accessible name from the accompanying tooltip. Focus, hover, and selection must not change which conversation identity is sent to the resume or deletion handler.

## Visible Failure Boundaries

The list component does not own a dedicated network-error panel. Registry-loading failures are handled by the authenticated data owner, while delete failures restore the previous registry. Because an empty list and a failed load are materially different, future changes must not convert all loader failures into the empty-state message without explanation.

# App Architecture

## Entry and Composition

The `src/App.tsx` file mounts Chronicle at `/`. The `src/pages/Index.tsx` file owns the main tab state and renders `ConversationsTab` when the selected tab is `conversations`. `AppSidebar` labels that destination **Chat History**. `AppShellTopBar` adds **Delete All** only when the active Chat History configuration reports at least one conversation.

`ConversationsTab` is a presentation component. Its public contract is the registry plus two actions: `onResume(scenarioId, conversationId)` and `onDelete(scenarioId, conversationId)`. It sorts and pages the supplied summaries but does not query or mutate Supabase directly.

## Registry Loading

`use-index-authenticated-data.ts` owns the authenticated registry load. It calls the conversation persistence service, stores the resulting `ConversationMetadata[]`, and enriches the registry when the conversations tab is visited. The metadata type carries the story and conversation IDs, title, cover, creator, message count, last message, and timestamps used by the list.

This registry is deliberately separate from `ScenarioData.conversations`, which represents the active story aggregate. Treating the summary registry as a full transcript would lose message and playthrough state that is loaded only on resume.

## Resume and Message Paging

`use-index-scenario-lifecycle.ts` implements the resume boundary. It fetches the referenced story, then fetches the selected conversation and its recent messages. It establishes the active story and playing conversation ID before sending the user to `chat_interface`. The same lifecycle exposes older-message loading in bounded pages for Chat Interface.

The path must preserve the requested conversation ID throughout. It must not fall back to a different existing conversation merely because the story contains several sessions, and it must not create a new conversation when a requested saved session fails to load.

## Deletion Boundaries

The lifecycle removes a conversation through `src/services/persistence/conversations.ts`. Index owns confirmation and optimistic registry updates. On a rejected persistence operation, it restores the prior registry. Bulk deletion uses the registry’s identified conversations and similarly restores the prior state on failure.

The persistence service is responsible for durable conversation and message rows. The Chat History component is responsible only for displaying the caller’s result and emitting the selected identity.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/components/chronicle/ConversationsTab.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppSidebar.tsx
src/hooks/use-index-authenticated-data.ts
src/hooks/use-index-scenario-lifecycle.ts
src/services/persistence/conversations.ts
src/types.ts
```

## Verification Limit

This account was checked against the listed repository sources on September 4, 2026. It establishes the current registry, sorting, paging, resume, deletion, rollback, and screen handoffs. It does not prove live database contents, deployed authorization policies, or successful restoration of every historical session.
