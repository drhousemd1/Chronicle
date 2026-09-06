# Overview

## Chat Interface at a Glance

Chat Interface is Chronicle’s active play screen. It presents one loaded story and one identified conversation, shows the accepted message history, gives the player a place to write the next action or dialogue, and keeps the controls needed to read and manage that session within reach. The capability begins after another area has selected a story or conversation. It ends at clearly named handoffs: persistence stores accepted conversation changes, Chat History later finds the session again, and the separate Roleplay Pipeline handles response construction behind the opaque response-request boundary.

This manual deliberately does not describe the internal Roleplay Pipeline. It does not explain provider calls, prompt assembly, memory selection algorithms, post-turn evaluation stages, or service-level retry orchestration. Those mechanisms are documented in [Roleplay Pipeline](/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&tab=app-architecture). Here, the relevant contract is only what the visible interface sends across that boundary, what state it shows while waiting, what result it accepts back, and how the player can act on that result.

## Entry, Identity, and Ownership

Chat Interface has no independent catalog. My Stories and Community Gallery can start a new playthrough from a story source. Chat History can resume an existing conversation. In both cases, the shell supplies a story identifier, a conversation identifier, the story data needed to render the session, and the current model selection. A new playthrough begins with its own conversation identity and may include the story’s authored opening dialogue. A resumed playthrough loads the selected conversation rather than creating another session.

The reusable story and the active conversation are different authorities. The story supplies starting material and roleplay settings. The conversation owns the accepted messages, current day and time, session-scoped character state, side characters, memories, scene selection, and other changes established during that playthrough. Editing the live conversation must not silently rewrite the reusable story source. Saving a story-level interface preference, such as chat colors or background visibility, follows the explicit scenario settings handoff rather than changing unrelated account or Gallery data.

## The Visible Play Experience

The screen uses a fixed split layout. The left sidebar contains **Exit Scenario**, theme selection, day and time controls, the principal-character tiles, and character actions. The main area contains the conversation transcript and the message composer. This arrangement keeps the current cast and session clock visible while the transcript remains the primary reading surface.

The transcript distinguishes accepted messages from a response currently being prepared or streamed. Instead of showing an empty transcript while the story or conversation loads, the interface displays **Preparing your story...** When there is no accepted exchange beyond the opening state, **The stage is set** or the current opening material provides orientation. Older accepted messages can be loaded above the current thread when the resumed conversation reports that more history exists.

The composer prompts the player to **Describe your action or dialogue...** Submitting creates a player turn and hands the bounded response job to the separate backend boundary. While that work is active, the interface shows progress and prevents conflicting response actions. A successful response becomes part of the visible conversation only through the accepted result path. A failed response must remain distinguishable from an empty answer or a completed turn and must preserve enough context for the player to retry.

## Message Actions

Accepted messages can expose actions appropriate to their role and state. The player can edit eligible message text and either save or cancel the edit. An accepted assistant response can be continued when the player wants more from the same response, or regenerated when the result should be replaced. Additional actions are grouped behind the message menu so the transcript remains readable.

**Continue** and **Regenerate** are not synonyms. Continue extends an accepted assistant response; Regenerate asks for a replacement under the current conversation state. The interface must prevent those actions when required derived state is unavailable and must label the unavailable condition rather than starting work that cannot complete coherently. Editing, deleting, retrying, continuing, and regenerating must preserve message and generation identity so the visible thread does not attach a result to the wrong turn.

## Characters, Scenes, and Session Controls

The character rail shows principal story characters with an avatar or initial, their name, and whether they are controlled by the user or AI. A character image can be expanded, repositioned, or edited through the visible action menu. Deleting a principal character uses a confirmation boundary. Session-scoped edits and side-character changes belong to the current playthrough; they are not a hidden update to the reusable Character Library or Story Builder source.

Day and time controls expose the current conversation clock. Manual mode allows the player to move between sunrise, day, sunset, and night and to change the day. Automatic mode can advance the time on an interval and can be paused or resumed. Scene imagery and dynamic backgrounds may respond to the current story context when enabled, but the interface must continue to work when no scene image exists.

## Settings and Personalization

**Chat Settings** groups the settings the player can understand and control from the play screen. Interface settings include **Dynamic Backgrounds**, **Transparent Bubbles**, **Offset Bubbles**, and **Dynamic Text**. **Change Chat Colors** edits the chat canvas and bubble colors using a color picker or hexadecimal value. **Time Progression** selects manual or automatic behavior and, for automatic mode, the interval.

The same settings interface currently presents **Narrative POV**, **NSFW Intensity**, **Response Detail**, and **Realism Mode**. Chat Interface owns their visible labels, selected states, and settings updates. It does not own or document how the separate Roleplay Pipeline interprets them internally. For an administrator, the screen can also expose dialogue debug notes and a downloadable session log. Those are controlled review tools, not ordinary player controls and not a second Changelog or conversation-history authority.

## Loading, Failure, and Recovery Expectations

The interface must distinguish initial loading, an empty accepted transcript, active response work, response failure, persistence failure, and unavailable derived state. A spinner or typing state proves only that work is pending. It must not be left visible after the request is known to have failed. The player text and current conversation should remain available after a recoverable failure so retry does not require reconstructing the session.

Persistence and screen state are related but not identical. The interface can update quickly, but a visible message is not durable merely because it appeared. When persistence fails, the user-facing state must not imply that Chat History will necessarily recover the change later. Conversely, a resumed conversation may initially contain only the most recent page; **Load older messages** extends the visible transcript without creating duplicate messages or changing their order.

## Handoffs and Evidence Limits

My Stories or Community Gallery owns the story selection that begins a new session. Chat History owns later discovery and resume. Story Builder owns the reusable authored story. Character Library and Character Builder own reusable and story-authored profiles, while Chat Interface owns only conversation-scoped character changes during play. The persistence layer owns durable conversation rows after a successful save.

Source inspection confirms the current UI owner and its named boundaries. It does not prove the behavior of an inaccessible live Supabase deployment, successful provider execution, or the internal correctness of the separate Roleplay Pipeline. The separate **Supabase Tables** tab is the last synchronized documented database reference; it is not proof that every deployed table, policy, function, or grant is current.

# UI Elements and Functions

## Active Session Layout

- **Exit Scenario** leaves the play screen through the caller-owned back action. It does not delete the story or conversation.
- **Open scenario settings** opens the theme menu. **Set Theme** changes the character-sidebar presentation for the current story settings path.
- The day and time panel shows **Manual** or **Automatic** mode, the current day, and the current time of day. **Increase Day**, **Decrease Day**, and the sunrise, day, sunset, and night selectors change the displayed conversation clock. Automatic mode adds **Pause Timer** or **Resume Timer**.
- Character tiles show the current effective character, control assignment, and avatar. Selecting an avatar expands or collapses it. The pencil menu provides **Reposition image**, **Edit character**, and **Delete character**.
- The transcript is the scrollable reading surface. It shows accepted history, any active response presentation, and the loading control for older messages when another page exists.
- The composer accepts the next player action or dialogue and submits through the response boundary. Its text remains a player-owned draft until submission.

## Transcript Actions and Consequences

- **Save changes** commits an eligible inline message edit; **Cancel editing** restores the unedited display.
- **Continue conversation** requests an extension of the selected accepted assistant response.
- **Regenerate response** requests a replacement for the selected assistant result.
- **More message actions** contains secondary operations that would otherwise crowd each bubble.
- **Generate new image** starts the scene-image action for an eligible assistant message. The resulting image belongs to the conversation/scene destination, not to an unrelated public Gallery record.
- Administrator-only **Add dialogue debug note** attaches or edits a review note for the identified message and generation. The note is diagnostic evidence, not part of the roleplay text.

Actions that can overlap with active streaming are disabled or guarded. An unavailable action must explain its condition through the visible title or error state. A message action must remain attached to the message and generation the player selected even if the transcript changes while the action is pending.

## Chat Settings

- **Dynamic Backgrounds** allows scene-tagged imagery to change the visual background.
- **Transparent Bubbles** changes bubble opacity without changing message content.
- **Offset Bubbles** changes message alignment/presentation.
- **Dynamic Text** controls enhanced text presentation.
- **Narrative POV** offers 1st Person and 3rd Person selections.
- **NSFW Intensity** offers Normal and High.
- **Response Detail** offers Concise, Balanced, and Detailed.
- **Realism Mode** toggles the corresponding story UI setting.
- **Time Mode** offers Manual and Automatic. Automatic mode reveals **Advance Every**, with choices of 5, 10, 15, 30, or 60 minutes.
- **Change Chat Colors** exposes Chat Background and Bubble Background color inputs. Valid values update the preview; leaving an incomplete value restores the current normalized color.

These controls describe the visible input contract only. Their presence does not authorize this manual to document the internal Roleplay Pipeline.

## Administrative Review Controls

When the caller confirms administrator access, **Dialogue Debug Notes** can reveal comment controls on chat bubbles. The note dialog lets the reviewer select issue categories and write a concrete observation. **Download Session Log** produces a local HTML review artifact for the current conversation, including the session information supplied to the exporter. Ordinary users do not receive these controls.

## Empty and Failure States

- The **Preparing your story...** message means the selected conversation is not yet available to the component.
- A session with no main characters displays **No main characters.** This preserves an honest empty state without inventing a cast.
- A transcript without later accepted messages keeps the opening state understandable rather than showing a generic application-empty screen.
- If older-message loading returns no rows, the interface marks that there is no further page.
- A response or persistence error must stop its pending presentation and preserve the current session for retry. A blank result must not be presented as accepted success.
- A disabled **Continue** or **Regenerate** action must retain the reason it cannot run when the required derived state failed to load.

# App Architecture

## Delivery Boundary and Runtime Entry

The `src/App.tsx` file registers the main Chronicle route at `/`. The `src/pages/Index.tsx` file owns the application-tab state and mounts `ChatInterfaceTab` when the selected tab is `chat_interface`. New-play and resume flows are owned by `src/hooks/use-index-scenario-lifecycle.ts`; both load a specific story and establish a specific conversation identity before the active play screen becomes usable.

`ChatInterfaceTab` receives `scenarioId`, `appData`, `conversationId`, `modelId`, administrator status, update callbacks, a back action, the scenario-save handoff, UI-setting and side-character update callbacks, and optional older-message loading. This property boundary is the screen’s public contract. The component owns extensive session UI state, but the caller retains the story aggregate and durable navigation state.

## State and Persistence Boundaries

The active `Conversation` inside `ScenarioData` is the immediate source for accepted messages, current day and time, and session identity. The `onUpdate` callback returns conversation changes to the caller. The `onSaveScenario` and `onUpdateUiSettings` callbacks hand the appropriate persistence operations back to `Index.tsx`. Conversation persistence is implemented through `src/services/persistence/conversations.ts`; initial and resumed sessions use the scenario-lifecycle hook to save, fetch, page, and delete identified conversations.

Chat Interface also reads or updates conversation-scoped state for character overrides, side characters, scenes, memories, and other visible session tools. Those specialized helpers remain subordinate to the active conversation identity. None of them makes this manual the authority for the internal response pipeline.

## Opaque Roleplay Boundary

The component constructs a named response job for Send, Continue, Retry, or deleted-assistant recovery and invokes the separate response collector. For this capability, the boundary is intentionally opaque: the UI provides the selected story/conversation state, action type, player input, current settings, and message identity; it then renders progress, failure, or an accepted result. Provider selection, prompt composition, staged support calls, token accounting, internal retry strategy, and post-turn reasoning belong to the separate Roleplay Pipeline section and are excluded here.

## Security and Access

The main play screen depends on the authenticated account supplied by `useAuth`. Administrator-only debug controls are rendered only when `isAdmin` is true; the normal interface must not infer administrator authority from a visible control or local query parameter. Supabase persistence remains subject to the deployed authentication and row-level policies, which were not live-tested for this manual.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/components/chronicle/ChatInterfaceTab.tsx
src/components/chronicle/chat/TypingIndicatorBubble.tsx
src/components/app-shell/AppShellWorkspace.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppSidebar.tsx
src/hooks/use-auth.ts
src/hooks/use-index-scenario-lifecycle.ts
src/services/persistence/conversations.ts
src/types.ts
```

## Verification Limit

This account was checked against the listed repository sources on September 4, 2026. It establishes the current entry, ownership, visible controls, local states, persistence handoffs, and explicit Roleplay Pipeline exclusion. It does not prove successful live authentication, deployed Supabase policies, provider execution, or the correctness of the excluded backend pipeline.
