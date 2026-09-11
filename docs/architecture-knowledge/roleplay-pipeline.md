<!-- Canonical Roleplay Pipeline manual. Authored HTML inside Markdown preserves the approved stage, branch, and table hierarchy. The application imports these exact bytes; there is no separately maintained prose copy. Source account reviewed 2026-09-04; editorial and transfer review 2026-09-05. -->

# Overview

<h1>Roleplay Pipeline at a Glance</h1>
        <h2>The System Behind an Ongoing Playthrough</h2>
        <p>The Roleplay Pipeline is the processing behind Chronicle’s live storytelling. It takes a player’s action, assembles the relevant story and conversation context, asks the language model for a response, decides whether the returning result still belongs to that action, and saves the accepted exchange. It then runs separate background work that can preserve memories, record goal progress, and update character state for future turns.</p>
        <p>Its purpose is continuity within one particular playthrough. A response should follow the current scene, the player’s actual action, the authored world and characters, and what has already happened in that conversation. The system must distinguish those sources instead of treating every stored paragraph, rejected response, private note, or model suggestion as equally authoritative. A <strong>pipeline</strong> is this connected sequence of preparation, generation, acceptance, storage, and later reuse—not merely the network request that produces text.</p>
        <p>Chat Interface owns the screen the player sees: the composer, message controls, pending indicators, and visible transcript. Roleplay Pipeline explains what happens behind those controls. Story Builder and Character Builder supply the authored starting material; the active conversation supplies the developing playthrough. Chat History owns finding and reopening saved conversations. These responsibilities meet during play, but they are not interchangeable.</p>

        <h2>Authored Story, Conversation, and Current State</h2>
        <h3>The story supplies the starting world; the conversation records what happens within it</h3>
        <p>The authored story can supply its premise, world information, locations, cast, character descriptions and rules, opening state, goals, scenes, and roleplay settings. The conversation adds the accepted exchanges, current story day and time, and developments specific to this session. A new playthrough and a resumed playthrough therefore do not begin with the same context: one starts from the story setup, while the other must recover the particular conversation’s saved history and state.</p>
        <p><strong>Current state</strong> means the information Chronicle presently uses to represent that playthrough, such as current character conditions or completed goal steps. Some state is loaded from saved records; some changes first exist in the browser while a save is pending. A visible change is not automatically durable. Likewise, deriving a character change from dialogue does not mean the reusable Character Library profile or authored story has been rewritten.</p>
        <h3>Generation requires the conversation’s core state to be ready</h3>
        <p>Before starting a response, Chronicle waits for required saved main- and side-character snapshots, goal-step and goal-alignment records, and message-identity records. Together these form the core conversation state needed to process a turn safely. Failure to load a required part blocks generation rather than authorizing a guessed replacement state.</p>
        <p>Memory loading is a separate, deferred operation. The current Send path does not wait for that memory load to finish. This distinction matters after a reload: core state can be ready while saved memories are still arriving, so an early request can be assembled without those memories even though they exist in storage.</p>

        <h2>Send, Retry, and Continue Mean Different Work</h2>
        <h3>Send creates a new player turn</h3>
        <p>Send begins with the composer’s submitted text. Chronicle creates a new player message, attaches the current story clock, displays that message locally, clears the composer, and marks response work as active. The exact submitted text becomes the leading player instruction for the request. Blank input, an unavailable conversation, a response already in progress, or core state that is not ready can stop this preparation.</p>
        <h3>Retry replaces a selected assistant response</h3>
        <p>Retry targets an existing assistant message and reuses the preceding player message that requested it. It does not create a second player turn. Chronicle excludes the rejected answer from the replacement request’s accepted history and includes the original player instruction once. It also supplies direction about what should differ while preserving established facts and player-controlled actions.</p>
        <p>The old assistant text remains visible until a replacement returns and passes the current-source check. A successful Retry keeps that message’s identity, replaces its content, and assigns a new version identity. If generation fails, the existing answer is not silently replaced by an unfinished draft.</p>
        <h3>Continue extends the accepted conversation tail</h3>
        <p>Strict Continue uses the latest accepted assistant message as its continuation anchor. It adds no new player instruction and must not invent a new player decision merely to keep the scene moving. The accepted anchor is represented once in the model input rather than duplicated as both history and a separate instruction. The resulting continuation is appended as a new assistant message.</p>
        <p>There is also a narrower deleted-response recovery path. If deleting an assistant reply left the current session’s recovery marker beside the surviving player turn, Continue can request a replacement from that turn without appending the player text again. An ordinary unanswered player message does not automatically qualify. The recovery marker is browser-session state and is not reconstructed after a reload.</p>

        <h2>How Chronicle Chooses the Model’s Context</h2>
        <h3>Available information is not the same as information actually sent</h3>
        <p>Request assembly begins with the action’s work order: which action is running, which message version it belongs to, which history to exclude, and what current-state or response-detail instructions apply. It combines that with eligible story, scene, character, memory, goal, and conversation material. These are <strong>source candidates</strong>—information considered for inclusion, not a promise that every item reaches the model.</p>
        <p>The selection process produces the final instructions and messages sent for generation. It considers current session state, the story clock, character control assignments, visibility rules, response settings, and the action-specific history boundary. Private player-only text is removed from model-visible material. A debug view showing a candidate or an omission record does not establish that Grok received that material.</p>
        <h3>Accepted history must not repeat or reintroduce the wrong action</h3>
        <p>For Send and Retry, the active player text is included once in its dedicated instruction lane, rather than repeated in ordinary history. Retry leaves out the rejected assistant generation. Strict Continue includes its accepted assistant anchor once. Local provider-error and content-filter notices do not become roleplay history. Recent eligible assistant text can remain verbatim; older assistant text may use structured outcome records where those exist.</p>
        <p>This is why the model-facing conversation can differ from the screen’s transcript. The screen shows the user’s interaction history; the request contains the selected context appropriate to this particular action. Exclusions protect continuity by preventing rejected answers, duplicated player instructions, and local error notices from being treated as new story facts.</p>
        <h3>Player control and character knowledge are distinct boundaries</h3>
        <p>The latest player action supplies authority over what the player just said or did. Authored background, goals, or derived state must not silently substitute a different action for a user-controlled character. Character knowledge adds another boundary: information available to Chronicle is not necessarily information a particular character is allowed to know. Context preparation applies those control and visibility rules before generation; their presence in a request is not a guarantee that the model’s prose will always respect them.</p>
        <h3>Goals provide conditional direction, not an automatic scene agenda</h3>
        <p>The current goal selector hides completed goals and goals marked dropped. A remaining goal becomes active for a request only when the latest player turn contains a strong direct request supporting it. Otherwise it remains hidden for that turn. When a goal is active, Chronicle supplies its direction, progress, next open milestone, and guidance strength as background context—not an instruction that the next response must complete that milestone.</p>
        <p>Goal selection before generation and goal evaluation afterward serve different purposes. Selection decides what direction reaches the writer now. Later evaluation considers what the accepted exchange actually established. Merely having a goal stored in the story does not mean it is sent on every turn or advanced by every response.</p>

        <h2>API Call 1: Producing the Narrative Response</h2>
        <h3>The browser, Chronicle’s server, and Grok perform different jobs</h3>
        <p><strong>API Call 1</strong> names the narrative-generation round trip. The browser prepares the selected request and sends it to Chronicle’s Chat Edge Function. An <strong>Edge Function</strong> is server-side code that checks and forwards the request; it is not the language model. It validates authentication, request size and message structure, applies rate limits, and normalizes the model and output settings before contacting xAI’s Grok service.</p>
        <p>Grok generates the narrative from the selected input. Chronicle’s server holds the provider credentials and handles the provider connection; those credentials are not delivered to the browser. The browser-to-server request and server-to-provider request are two network segments within the same Call 1 workflow, not two separate narrative-generation stages.</p>
        <h3>Streaming transport does not necessarily mean live text appears in the transcript</h3>
        <p>The provider can return text in streamed pieces. Chronicle’s server separates the output text from usage and other response metadata, and the browser’s collector joins the returned pieces and performs deterministic text cleanup, including known formatting artifacts and placeholder normalization. In the current ordinary action paths, that stream is collected before the response is committed to the transcript rather than being written into the conversation token by token.</p>
        <p>A completed provider response is still only a candidate result. Chronicle has not yet established that it belongs to the current message version, that it was saved, or that its narrative meets the user’s expectations. Those are separate questions.</p>
        <h3>Automatic recovery is limited and is not the player’s Retry command</h3>
        <p>A normal narrative round trip makes one provider attempt. A provider content rejection can trigger one bounded server-side content-redirect retry; another rejection becomes a classified failure. This automatic fallback is separate from pressing Retry on an existing assistant message. The pipeline does not routinely generate several narrative candidates and choose the best one, nor does a style warning automatically launch another generation.</p>

        <h2>Accepting a Response and Saving the Turn</h2>
        <h3>A returning result must still belong to the current action</h3>
        <p>Each message has an identity and a generation identity for its current version. A <strong>freshness check</strong> compares the returning result with those current identities. Send checks the player message that triggered it. Retry checks the assistant version selected for replacement. Continue checks that the conversation tail still supports the same continuation or recovery action. If the conversation or relevant source has changed, the old result cannot simply overwrite the newer state.</p>
        <p>In this pipeline, <strong>accepted</strong> means that the returned result passed the applicable processing and current-source checks and was committed to the conversation. It does not mean a person reviewed it or that an automatic critic proved its narrative quality. Chronicle currently commits the first completed, cleaned, current draft. Style and response-shape observations are diagnostic information, not a hidden quality-selection loop.</p>
        <h3>Visible, saved, and available to background work are separate milestones</h3>
        <p>The local transcript updates before durable persistence. Send appends a new assistant answer after the new player message and queues both for saving. Retry replaces the selected assistant content and saves that replacement. Continue and deleted-response recovery append and save a new assistant message without duplicating the existing player message.</p>
        <p><strong>Persistence</strong> is the database save that lets the accepted exchange survive leaving or reloading the page. Source-message saves run in order: a later save waits for the previous save in that queue. Only after an exchange’s source messages save successfully may its standard background workers begin. If the save fails, the response can remain visible in the browser while not being safely recoverable after reload, and those standard workers are skipped.</p>

        <h2>Characters Introduced During Play</h2>
        <p>An accepted response can introduce a name that is not yet a known character. Chronicle’s side-character branch detects those names and, when applicable, creates minimal conversation-linked records. Initial registration is awaited before the normal source-message-save path continues. A caught individual registration failure removes that unsuccessful local character entry so later same-turn review does not treat it as a saved character.</p>
        <p>Profile enrichment starts separately for successfully registered characters. It can produce and save fuller character information and, when an avatar prompt is available, request and save an avatar. That enrichment is not awaited before normal message saving continues. Its failure does not by itself erase the accepted narrative or cancel the standard post-turn workers. An error escaping the overall awaited registration path, however, can prevent the action from reaching message saving.</p>
        <p>This is an auxiliary branch, not one of the four standard background workers described below. Some of its evidence carries a Call 2 tag, but that label does not make its timing or responsibility identical to the post-save queue. Its characters belong to the conversation in which they appeared, not automatically to the reusable Character Library.</p>

        <h2>API Call 2: Preparing State for Future Turns</h2>
        <p><strong>API Call 2</strong> names the standard post-save support workflow, not one literal network request. Its workers receive the accepted exchange and exact source-message versions. They derive proposed state changes from that exchange; they do not rewrite the narrative the player just received. Depending on which work is applicable and how it completes, this workflow can include several provider requests or worker-specific retries.</p>
        <h3>Memory extraction preserves supported events</h3>
        <p>The memory worker looks for durable information worth carrying into later turns. Chronicle reviews returned candidates against their source, rejects unsupported, unauthorized, or near-duplicate events, and writes accepted candidates as source-linked memory records. A candidate the model suggested is not automatically a saved memory. Each accepted record still needs successful persistence and a source generation that remains current.</p>
        <h3>Goal progress records supported milestone completion</h3>
        <p>The goal-progress worker compares the accepted exchange with eligible open goal steps. A completion must match a known step and include qualifying evidence and confidence before it can be recorded. Accepted results become conversation-linked goal-step records rather than edits to the authored base goal. If no completion qualifies, the correct result is no accepted progress update.</p>
        <h3>Goal alignment currently observes without steering</h3>
        <p>Goal alignment evaluates whether the exchange supports, resists, or drifts from story and AI-character goals. In the current implementation it runs in <strong>shadow mode</strong>: evaluations are recorded for examination, but this worker does not persist alignment rows, steer the next prompt, or change the visible response. An alignment evaluation appearing in diagnostics must not be mistaken for an applied behavior change.</p>
        <h3>Character-state review applies supported changes</h3>
        <p>The character-state worker considers characters supported by the latest exchange and proposes changes to their current condition. Chronicle reviews whether the character, field, evidence, confidence, source version, and player-control boundary permit each candidate. Accepted updates are saved as source-linked character snapshots and synchronized with local runtime state. Raw or rejected model suggestions cannot be treated as applied character changes. If storage succeeds but local synchronization fails, a reload may be needed before the active session uses the saved state.</p>
        <h3>The workers do not form one all-or-nothing operation</h3>
        <p>Memory extraction and goal progress can run independently. Goal alignment and character state each use their own ordered queue so work of the same kind does not overtake earlier work. Workers can complete, fail, become stale, or be skipped independently; one failure does not automatically cancel the others or invalidate the visible narrative. Later source-message saves do not wait for every earlier background worker to finish.</p>

        <h2>How Saved State Returns to the Next Request</h2>
        <p>The end of one turn feeds the beginning of another. Accepted memories, recorded goal progress, and current character snapshots can join the next request’s context candidates. They still pass the next action’s source-selection and visibility rules. Saving information makes it available for consideration; it does not require Chronicle to send all of it to Grok every time.</p>
        <p>For example, an accepted exchange might establish that Mara promised to protect a map. If memory review accepts that fact and its save succeeds, a later request can use it without replaying the entire original exchange. If the source message is deleted or its generation changes through an edit or Retry, the older source-linked memory is no longer automatically valid. Chronicle checks the source relationship before treating it as effective memory.</p>
        <p>A new turn uses the state available when its request is assembled. It does not wait for unfinished memory extraction. A memory that finishes after the next request has already started cannot retroactively enter that request; it can first affect a later eligible dispatch. Disabling memories leaves saved rows in storage but omits the memory source from generation. Editing or deleting a memory changes what later requests can use after the relevant operation succeeds.</p>

        <h2>Interruption, Editing, and Recovery</h2>
        <h3>Failures must be understood at the point where they occur</h3>
        <p>A request can stop before generation because conversation state is unavailable, during server admission because authentication or request validation fails, while waiting for the provider, during response collection, when freshness no longer matches, during saving, or inside one background worker. These outcomes are different. A successful provider call does not prove saving succeeded; a saved narrative does not prove every background update succeeded.</p>
        <p>When an action catches a generation failure, it adds the applicable local notice only while that action still owns the source. Send may leave the newly entered player text visible. Retry keeps the prior assistant answer unless replacement succeeds. Continue adds no new player turn. The standard background queue does not begin from those failed narrative-generation paths.</p>
        <h3>Editing changes the active version; reloading restores what was actually saved</h3>
        <p>Editing or deleting messages changes the context a later action sees without itself calling Grok. Editing updates the local message and its version identity immediately, then attempts persistence. In the current implementation, a failed edit save is logged without restoring the earlier local text or warning the player, so a reload can bring back the older saved version. Reload also does not reconstruct unfinished browser work or the temporary deleted-response recovery marker.</p>
        <p>There are other current limits worth distinguishing from the intended experience. A missing browser access token can produce a session-expired warning through the ordinary text collector, allowing that warning to be committed as assistant text even though no provider call occurred. The collector and action handlers also do not add a separate empty-text rejection after cleanup, although the server checks for missing provider output earlier. The App Architecture tab identifies the exact branches behind these limitations; this Overview does not imply that they have been repaired.</p>

        <h2>What Diagnostics Explain—and What They Do Not Do</h2>
        <p>Selection receipts, validation snapshots, generation identities, worker outcomes, usage records, and debug traces help explain what the pipeline attempted and what happened to its results. They can distinguish considered context from selected context, a provider response from a save, or a reviewed candidate from an applied state change. These records are useful because the player sees only part of that process.</p>
        <p>Recording an observation does not itself enforce it. A style metric does not rewrite the answer, a selection receipt does not choose context, and a shadow-mode alignment result does not steer the story. Likewise, the Graphify map in App Architecture shows extracted source relationships, not a live execution trace of one conversation. Operational evidence and visual maps must be read according to the specific facts they actually represent.</p>

        <h2>What a Successful End-to-End Turn Accomplishes</h2>
        <p>The pipeline succeeds when the requested action is preserved from beginning to end: the selected context belongs to the correct conversation and action, the response returns to the correct current message version, the accepted exchange is durably saved, and any applied background changes are supported by that exchange. Later turns can then use current saved developments without reviving rejected text, duplicating player actions, granting characters unauthorized knowledge, or confusing a model suggestion with established state.</p>
        <p>This Overview explains the connected behavior. <strong>App Architecture</strong> provides the detailed processing paths and source references. <strong>Supabase Tables</strong> relates the stages to the documented storage model. <strong>Issues</strong> describes verified problems and audit findings, while <strong>Changelog</strong> records meaningful completed changes. The <a href="/style-guide/chronicle-knowledge-base?section=chat-interface&amp;tab=overview">Chat Interface Overview</a> remains the companion account of the visible play experience.</p>

        <h2>Explore the Detailed Architecture</h2>
        <nav class="rp-lifecycle" aria-label="Roleplay Pipeline stages">
          <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-begin-turn"><span class="rp-lifecycle__number">Stage 1</span>Begin the turn</a>
          <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-assemble-request"><span class="rp-lifecycle__number">Stage 2</span>Assemble the request</a>
          <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-generate-narrative"><span class="rp-lifecycle__number">Stage 3 · API Call 1</span>Generate narrative</a>
          <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-accept-save"><span class="rp-lifecycle__number">Stage 4</span>Accept and save</a>
          <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-extract-update"><span class="rp-lifecycle__number">Stage 5 · API Call 2</span>Extract and update</a>
        </nav>

        <p class="rp-inline-note">This manual describes the referenced repository source. It does not establish live provider or Supabase behavior.</p>

# App Architecture

<h1>Roleplay Pipeline App Architecture</h1>
        <p>Follow one turn from its initiating action to the state available for later turns. Each stage explains what Chronicle’s code does, where Grok is involved, what can fail, and what passes to the next stage.</p>


        <nav class="rp-flow-contents" aria-labelledby="roleplay-flow-contents-title">
          <h3 id="roleplay-flow-contents-title">Jump to a stage</h3>
          <div class="rp-flow-contents__links">
            <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-begin-turn">1. Begin the turn</a>
            <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-assemble-request">2. Assemble the request</a>
            <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-generate-narrative">3. Generate the narrative</a>
            <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-accept-save">4. Accept and save</a>
            <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-extract-update">5. Extract and update</a>
            <a href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-later-turn-feedback">Later-turn feedback</a>
          </div>
        </nav>

        <section id="pipeline-stage-begin-turn" class="pipeline-stage pipeline-stage--word-layout" aria-labelledby="roleplay-stage-1-title">
          <div class="rp-stage-opening">
            <div class="pipeline-stage-heading-row">
              <span class="pipeline-stage__number">Stage 1</span>
              <h2 id="roleplay-stage-1-title" class="pipeline-chapter-title">Send, Retry &amp; Continue</h2>
            </div>
            <div class="rp-stage-intro">
              <p>Send, Retry, and Continue are alternative entry paths: exactly one runs for an action. Each creates a <strong>response job</strong>—a structured work order identifying the action, its source message, and the conversation history Stage 2 may use. No Grok request occurs during this preparation.</p>
              <p>Before generation, Chronicle must finish loading the conversation’s <strong>canonical chat state</strong>: saved main- and side-character snapshots, goal-step and goal-alignment records, and message-identity records. If any required load fails, generation remains blocked. This readiness gate is separate from the freshness checks on returning results and the deferred memory load described later.</p>

            </div>
          </div>

          <article class="pipeline-route-card">
            <h3>Send</h3>

            <p class="rp-action-intro">Send begins a new player turn from the current composer text. It creates the one new user message that later stages use as both visible conversation state and the authoritative player instruction.</p>

            <h4>What must be true before Send starts</h4>
            <p><code>handleSend</code> stops when the composer is blank, no conversation is active, another response is running, or canonical chat state is unavailable.</p>

            <h4>What Chronicle creates for the new turn</h4>
            <p>Chronicle creates a user message with its own message ID and generation ID, attaches the current story day and time, appends it to the local conversation, clears the composer, and marks response work as active. It also prepares session-merged app data, an optional established-fact note, a digest of the current turn state, and the selected response-detail setting.</p>
            <p>The exact submitted text is preserved as <code>userInput</code>. Stage 2 places it in <code>player_turn</code>, the highest-authority <strong>lane</strong>—a named section of the model input reserved for the player’s instruction.</p>

            <h4>Why the new message identity matters later</h4>
            <p>The new user message becomes the freshness boundary for the request. When the assistant result returns, Chronicle checks that this exact message still exists with the same generation identity. A result for a deleted or changed source cannot be committed to the conversation.</p>

            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span><code>buildNormalSendResponseJob</code> passes the new turn’s work order to Stage 2.</span></p>
            <p class="pipeline-branch__source">Sources: <code>src/components/chronicle/ChatInterfaceTab.tsx</code> · <code>handleSend</code>; <code>src/features/chat-runtime/roleplay-response-job.ts</code> · <code>buildNormalSendResponseJob</code>.</p>
          </article>

          <article class="pipeline-route-card">
            <h3>Retry</h3>

            <p class="rp-action-intro">Retry asks Chronicle to replace one selected assistant response. It reuses the player message that originally triggered that response and does not create a second copy of the player's turn.</p>

            <h4>What must be true before Retry starts</h4>
            <p>The Retry button is disabled while a response is streaming, another Retry is in progress, or canonical chat state is unavailable. <code>handleRegenerateMessage</code> separately requires an active conversation, usable canonical state, a selected assistant message, and a preceding user message. The handler does not repeat the button’s streaming check.</p>

            <h4>What Retry targets</h4>
            <p>The handler searches backward from the selected assistant response for the nearest preceding user message. It records the assistant’s current generation ID so Stage 4 can reject a delayed result if a newer Retry or edit has changed the target.</p>

            <h4>How Chronicle builds clean replacement context</h4>
            <p>The handler removes both the rejected assistant response and its triggering user message from the ordinary conversation slice used for request preparation. The player message is then reintroduced once, as the authoritative <code>player_turn</code> lane. The response job also carries a concise rejection summary, a required-difference instruction, and a preservation rule so the new response is asked to differ without rewriting established facts or user-controlled actions.</p>
            <p>This is the player's explicit Retry action. It is separate from the one bounded provider fallback described in Stage 3.</p>

            <h4>What remains visible while Retry runs</h4>
            <p>The selected assistant text remains visible until a replacement returns and passes the freshness check.</p>

            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span><code>buildRetryRegenerateResponseJob</code> passes the replacement work order to Stage 2.</span></p>
            <p class="pipeline-branch__source">Sources: <code>src/components/chronicle/ChatInterfaceTab.tsx</code> · <code>handleRegenerateMessage</code>; <code>src/features/chat-runtime/roleplay-response-job.ts</code> · <code>buildRetryRegenerateResponseJob</code>.</p>
          </article>

          <article class="pipeline-route-card">
            <h3>Continue</h3>

            <p class="rp-action-intro">Continue extends the current conversation tail without inventing a new player turn. Chronicle first decides whether the tail supports a strict continuation or the narrower recovery path used after an assistant response was deleted.</p>

            <h4>What must be true before Continue starts</h4>
            <p>The Continue button is disabled while a response is streaming, Retry is in progress, or canonical chat state is unavailable. <code>handleContinueConversation</code> also requires an active conversation, repeats the streaming and canonical-state checks, and stops if the tail resolver returns <code>unavailable</code>.</p>

            <h4>Which conversation tail may continue</h4>
            <p><code>resolveRoleplayContinueTailAction</code> ignores local provider-error and content-filter notices, then inspects the latest usable roleplay message. An accepted assistant tail can use strict Continue. A normal user-authored tail cannot. Empty or absent roleplay tails are also unavailable rather than being converted into guessed input.</p>

            <h4>The two Continue paths</h4>
            <p>For strict Continue, the latest accepted assistant message becomes the continuation anchor, including its message and generation identities. Chronicle also remembers the nearest preceding user message for continuity and later source selection.</p>
            <p>If the latest usable row is a user message with the in-session marker left after its assistant reply was deleted, Chronicle uses deleted-response recovery. That path uses <code>normal_send</code> request semantics with the purpose <code>recover_after_deleted_assistant_response</code>.</p>

            <h4>How Continue avoids duplicated text</h4>
            <p>Strict Continue creates no <code>player_turn</code> lane. The accepted assistant text appears once as a state-authority <code>continue_anchor</code>, and Stage 2 omits the duplicate history copy. Deleted-response recovery reuses the surviving user message rather than appending it again.</p>

            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span><code>buildContinueAssistantTailResponseJob</code> passes strict continuation to Stage 2; <code>buildDeletedAssistantRecoveryResponseJob</code> passes deleted-response recovery.</span></p>
            <p class="pipeline-branch__source">Sources: <code>src/features/chat-runtime/continue-tail-action.ts</code> · <code>resolveRoleplayContinueTailAction</code>; <code>src/features/chat-runtime/roleplay-response-job.ts</code> · Continue and deleted-response-recovery builders; <code>src/components/chronicle/ChatInterfaceTab.tsx</code> · <code>handleContinueConversation</code>.</p>
          </article>

          <h3>Actions that change the next pipeline entry</h3>
          <p><strong>Edit</strong> and <strong>Delete</strong> change conversation state without calling Grok. Editing a message immediately replaces that message in the active browser state, assigns it a new generation identity, and starts an asynchronous persistence attempt. The next Send, Retry, or Continue action in that session therefore reads the edited text. If the save fails, Chronicle logs the failure but does not restore the earlier local text or warn the player, so a later reload can restore the older durable version. Deleting an assistant response can leave a local recovery marker that lets the next Continue action reuse the surviving user message through deleted-response recovery. That recovery marker is held in the current browser session and is not reconstructed after a reload.</p>
          <p>Reloading restores persisted messages, not unfinished browser-only work. A result that returns after its source message, target generation, or conversation tail has changed is rejected by the later freshness check rather than committed to the reloaded or edited conversation.</p>
          <p class="pipeline-branch__source">Sources: src/components/chronicle/ChatInterfaceTab.tsx · handleDeleteMessage and inline edit persistence · src/features/chat-runtime/continue-tail-action.ts</p>
          <!-- ROLEPLAY PIPELINE STAGE 1 RECIPROCAL LINKS START -->

          <!-- ROLEPLAY PIPELINE STAGE 1 RECIPROCAL LINKS END -->
        <p class="pipeline-branch__source">Related manual: <a class="rp-action-link" href="/style-guide/chronicle-knowledge-base?section=chat-interface&amp;tab=overview">Chat Interface</a>.</p></section>

        <section id="pipeline-stage-assemble-request" class="pipeline-stage pipeline-stage--word-layout" aria-labelledby="roleplay-stage-2-title">
          <div class="pipeline-stage-heading-row">
            <span class="pipeline-stage__number">Stage 2</span>
            <h2 id="roleplay-stage-2-title" class="pipeline-chapter-title">Assemble the authoritative model input</h2>
          </div>
          <div class="rp-stage-intro">
            <p>Stage 2 selects the story context and action-specific instructions for Grok, then prepares the browser request for API Call 1. A <strong>source candidate</strong> is material considered for the prompt; only candidates retained in the final <code>messages</code> array become model-visible.</p>

          </div>



          <h3>Begin with the action-specific work order</h3>
          <p>Shared request assembly receives a <code>RoleplayResponseJob</code>. It carries the action, source message and generation identities, history exclusions, and separate lanes for the player turn or continuation anchor, current-state digest, response detail, and optional established-fact note. These builders produce data only; dispatch happens afterward.</p>


          <h3>Resolve current story direction and source authority</h3>
          <p><code>generateRoleplayResponseStream</code> merges current session state, removes private player-only text from model-visible material, resolves the response-detail setting, and selects eligible goals. Goals provide direction alongside the authored story, current scene, character facts, memories, accepted history, and latest action; they do not replace the conversation.</p>
          <p><code>selectRoleplayGoalsForTurn</code> uses the same eligibility rules for Send, Retry, strict Continue, and deleted-response recovery. Completed goals and goals whose stored alignment status is <code>dropped</code> are hidden. A goal with no stored alignment passes the alignment gate; flexibility does not change that gate. A remaining goal becomes active only when the latest player turn contains a strong direct request supporting it. Otherwise it stays hidden for that request. There is no cooldown, pressure score, or automatic rotation.</p>
          <p>An active goal is rendered with its long-range direction, current progress, next open milestone, flexibility-based strength, and current alignment. Even then, the prompt presents it as background direction: the open milestone is not a required action for the current response and advances only when the current scene and recent messages already support it.</p>
          <p><strong>User-state authority</strong> protects the player’s control over user-controlled characters. Character facts and knowledge-visibility rules determine which details enter the prompt and which characters are allowed to know them.</p>

          <h3>Compile accepted history without duplicating the active action</h3>
          <p><code>buildRoleplayApiMessages</code> and <code>compileRoleplayRecentHistory</code> construct the recent-history portion according to the Stage 1 work order. Local provider-error and content-filter notices are excluded. A Send or Retry user message that already appears in the final <code>player_turn</code> lane is omitted from ordinary history. Retry excludes the rejected assistant generation. Strict Continue omits the accepted assistant tail from ordinary history because the same text is represented once as the higher-authority <code>continue_anchor</code>.</p>
          <p>The latest eligible assistant history can remain verbatim. Older assistant history may be represented by structured outcome records when those records exist. The resulting provider history is therefore selected accepted context, not a blind copy of every stored message.</p>

          <h3>Build candidates, then select what Grok will actually receive</h3>
          <p>Source selection combines the eligible context with the story clock, character control assignments, action-specific history, state summary, and response settings. It produces the final system instruction, provider history, and user content.</p>

          <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--diagnostic">Diagnostics</span><span>Selection receipts are records of what was considered, selected, or omitted. Duplicate metrics, coverage summaries, field evidence, validation snapshots, and usage records describe the result; they do not select, block, retry, or rewrite the request.</span></p>

          <article class="pipeline-component-card" aria-labelledby="roleplay-stage-2-envelopes">
            <h3 id="roleplay-stage-2-envelopes">What each request envelope contains and controls</h3>
            <p>These five data packages have different roles. The final column distinguishes provider input from material retained only within Chronicle.</p>
            <div class="pipeline-register">
              <table>
                <thead>
                  <tr>
                    <th>Envelope</th>
                    <th>Owner and contents</th>
                    <th>Live effect</th>
                    <th>Boundary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td data-label="Envelope">Source candidates</td>
                    <td data-label="Owner and contents">Browser request assembly. The complete set of eligible story, scene, character, memory, goal, history, state, and action-lane sources.</td>
                    <td data-label="Live effect">Provides the pool from which live source selection chooses.</td>
                    <td data-label="Boundary">Not all candidates reach the provider.</td>
                  </tr>
                  <tr>
                    <td data-label="Envelope">Selected <code>messages</code></td>
                    <td data-label="Owner and contents">Browser source selection. The final system instruction, selected accepted history, and final action-specific user content.</td>
                    <td data-label="Live effect">This is the model-facing message set submitted to Chronicle’s server.</td>
                    <td data-label="Boundary">Omitted candidates and selection receipts are outside this array.</td>
                  </tr>
                  <tr>
                    <td data-label="Envelope">Browser request body</td>
                    <td data-label="Owner and contents"><code>generateRoleplayResponseStream</code>. Selected messages plus model, streaming and token settings, provider transport, response job, and administrator evidence when debug tracing is enabled.</td>
                    <td data-label="Live effect">The authenticated JSON body sent to <code>/functions/v1/chat</code>.</td>
                    <td data-label="Boundary">Some fields support browser review and are not read into the provider request.</td>
                  </tr>
                  <tr>
                    <td data-label="Envelope">Edge-normalized inputs</td>
                    <td data-label="Owner and contents">Chat Edge Function. Authenticated user, validated messages, normalized model and transport, bounded token limit, and usage type.</td>
                    <td data-label="Live effect">Controls whether and how Chronicle’s server calls the provider.</td>
                    <td data-label="Boundary">Authentication, rate, size, or message validation can stop the request here. Response headers and any permitted debug trace are assembled as return evidence; they are not provider inputs.</td>
                  </tr>
                  <tr>
                    <td data-label="Envelope">xAI Responses payload</td>
                    <td data-label="Owner and contents"><code>callXaiResponses</code>. Normalized model, selected input messages, streaming flag, output-token limit, <code>store: false</code>, temperature, and reasoning effort.</td>
                    <td data-label="Live effect">This is the external request Grok actually receives.</td>
                    <td data-label="Boundary">Browser-only response-job and evidence objects are not copied wholesale into this payload.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="pipeline-branch__source">Sources: src/services/llm.ts · generateRoleplayResponseStream · supabase/functions/chat/index.ts · supabase/functions/_shared/xai-responses.ts</p>
          </article>

          <h3>Handoff to API Call 1</h3>
          <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>The browser dispatch receives the selected <code>messages</code> and request settings described above.</span></p>
          <p class="pipeline-branch__source">Sources: src/features/chat-runtime/roleplay-response-job.ts · src/features/chat-runtime/roleplay-recent-history.ts · src/features/chat-runtime/roleplay-source-shaping.ts · src/services/llm.ts · <code>src/features/chat-runtime/roleplay-goal-selector.ts</code> · <code>src/lib/goal-alignment.ts</code></p>

        </section>

        <section id="pipeline-stage-generate-narrative" class="pipeline-stage pipeline-stage--word-layout" aria-labelledby="roleplay-stage-3-title">
          <div class="pipeline-stage-heading-row">
            <span class="pipeline-stage__number">Stage 3</span>
            <span class="pipeline-stage__scope pipeline-stage__scope--call1">API Call 1</span>
            <h2 id="roleplay-stage-3-title" class="pipeline-chapter-title">Generate and return the narrative response</h2>
          </div>
          <div class="rp-stage-intro">
            <p><strong>API Call 1</strong> is Chronicle's complete narrative-generation round trip. The browser sends Stage 2's selected packet to the Chat Edge Function, the Edge Function admits and normalizes the request, xAI generates the response, and Chronicle's collector returns cleaned candidate text.</p>

          </div>



          <article class="pipeline-component-card" id="rp-stage3-browser">
          <h3>Browser dispatch and session boundary</h3>
          <p><code>generateRoleplayResponseStream</code> reads the current Supabase session and posts the Stage 2 request body to <code>/functions/v1/chat</code> with the user’s bearer token and Supabase publishable key. The browser waits up to 180 seconds. <strong>Current implementation limitation:</strong> when no access token exists, the generator yields a session-expired warning string and returns without making the network request. The collector currently gathers that warning through the ordinary response stream, and the action handler then follows its ordinary freshness, local-commit, and persistence path. If the source is still current, the warning can therefore be committed as assistant text even though Grok was never called.</p>
          <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>The authenticated browser body crosses into Chronicle’s server environment.</span></p>
          </article>

          <article class="pipeline-component-card" id="rp-stage3-edge">
          <h3>Edge admission and normalization</h3>
          <p>The Chat Edge Function verifies the bearer token, applies rate limits, bounds and parses the body, validates the <code>messages</code> array, clamps the output-token limit, normalizes the provider transport, and normalizes unsupported model names to <code>grok-4.3</code>. A missing or invalid token returns <code>401</code>; rate limiting returns <code>429</code>; an oversized body returns <code>413</code>; malformed JSON or messages return <code>400</code>. These checks stop the workflow before Grok is called.</p>

          </article>

          <article class="pipeline-component-card" id="rp-stage3-provider">
          <h3>xAI narrative generation</h3>
          <p><code>handleResponsesDirect</code> passes the Edge-approved messages and settings to <code>callXaiResponses</code>, which builds the external <code>POST https://api.x.ai/v1/responses</code> request. The live payload uses <code>grok-4.3</code>, streaming mode, the clamped output-token limit, temperature <code>0.6</code>, <code>store: false</code>, and reasoning effort <code>medium</code>. The server-only xAI bearer key never enters the browser.</p>
          <p>Grok generates the narrative. Chronicle owns selection, transport, failure classification, and returned-text cleanup; it does not pre-author the narrative inside the browser or Edge Function.</p>
          </article>

          <article class="pipeline-component-card" id="rp-stage3-collector">
          <h3>Collect and clean the returned text</h3>
          <p>The Edge Function reads xAI Responses events, separates output text from usage and reasoning metadata, rejects an incomplete stream or a completed response without <code>output_text</code>, and returns browser-compatible server-sent events. <code>generateRoleplayResponseStream</code> parses that stream and yields visible content. <code>collectRoleplayResponse</code> joins the chunks, sanitizes deterministic formatting artifacts, normalizes known placeholder names, and returns cleaned text plus available Call 1 evidence. Normal action handlers currently call the collector with <code>streamToUi: false</code>, so provider streaming is collected before the ordinary conversation commit.</p>
          <p><strong>Returned text is not yet an accepted conversation message.</strong> Collection prepares the candidate; Stage 4 checks whether it still belongs to the current action. That is a freshness decision, not a judgment of narrative quality.</p>
          </article>

          <article class="pipeline-component-card" id="rp-stage3-failure">
          <h3>How API Call 1 can fail or recover</h3>
          <p>A provider HTTP <code>403</code> can trigger one server-side content-redirect retry through the same Responses transport; this is separate from the player’s Retry action. A second block becomes a classified content-filter failure. Timeout, network, admission, provider, and incomplete-stream failures follow their respective error paths.</p>
          <p>When an action handler catches a provider or content-filter failure, it adds the corresponding local notice only if that generation still owns the current source. Send may leave its newly created local player message visible. Retry leaves the existing assistant response in place unless replacement succeeds. Continue adds no new player message. These failure paths do not begin the standard API Call 2 queue.</p>
          </article>

          <h3>Handoff to response acceptance</h3>
          <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>The collector returns cleaned candidate text, placeholder mappings, and available Call 1 evidence to the initiating action handler.</span></p>
          <p class="pipeline-branch__source">Sources: src/services/llm.ts · generateRoleplayResponseStream · src/features/chat-runtime/collect-roleplay-response.ts · supabase/functions/chat/index.ts · supabase/functions/_shared/xai-responses.ts</p>

        </section>

        <section id="pipeline-stage-accept-save" class="pipeline-stage pipeline-stage--word-layout" aria-labelledby="roleplay-stage-4-title">
          <div class="pipeline-stage-heading-row">
            <span class="pipeline-stage__number">Stage 4</span>
            <h2 id="roleplay-stage-4-title" class="pipeline-chapter-title">Accept the response and make the turn durable</h2>
          </div>
          <div class="rp-stage-intro">
            <p>Stage 4 decides whether the returned text still belongs to the current action, updates the visible conversation, and saves the accepted messages. New-side-character registration runs between the local update and the standard source-message save.</p>

          </div>



          <h3>Admit only a response for the current source generation</h3>
          <p>Each action confirms that the conversation is still current, then re-reads its source. Send requires the triggering user message and its generation to match. Retry requires the selected assistant message to retain the targeted generation. Continue re-runs tail resolution and requires the same assistant anchor or deleted-response recovery target. A mismatch discards the returned text before it changes the conversation.</p>



          <h3>Accept the first current completed draft without a hidden quality retry</h3>
          <p>After cleanup and freshness checks, Chronicle commits the first completed API Call 1 draft. It does not generate several candidates, score them, or request another draft because the first is weak. Style analysis and response-shape checks record telemetry; they do not repair, retry, or refuse the response. The collector and action handlers do not add a separate empty-text rejection after cleanup; Stage 3’s missing-provider-output check is an earlier, distinct boundary.</p>
          <p>A normal <strong>API Call 1 round trip</strong> uses one xAI provider attempt. The exception is the single content-redirect fallback after an initial HTTP <code>403</code>, described in Stage 3. Later background requests belong to separate work.</p>

          <article class="pipeline-component-card" id="rp-stage4-commit">
            <h3>How each action commits locally and becomes durable</h3>
            <p>The Chat Interface updates first. <strong>Persistence</strong> means saving those changes so they can survive a reload; that asynchronous step happens afterward.</p>
            <div class="pipeline-register">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Local visible commit</th>
                    <th>Messages passed to persistence</th>

                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td data-label="Action">Send</td>
                    <td data-label="Local visible commit">Creates a new assistant message with new message and generation IDs and appends it after the already-visible new user message.</td>
                    <td data-label="Messages passed to persistence">The new user message and new assistant message together.</td>

                  </tr>
                  <tr>
                    <td data-label="Action">Retry</td>
                    <td data-label="Local visible commit">Keeps the assistant message ID, replaces its text in place, and assigns a new generation ID.</td>
                    <td data-label="Messages passed to persistence">The regenerated assistant message. The source user message already exists.</td>

                  </tr>
                  <tr>
                    <td data-label="Action">Continue or deleted-response recovery</td>
                    <td data-label="Local visible commit">Creates and appends a new assistant message with new message and generation IDs. No new user message is created.</td>
                    <td data-label="Messages passed to persistence">The new assistant message. The existing source user message is passed separately to later workers.</td>

                  </tr>
                </tbody>
              </table>
            </div>
            <p class="pipeline-branch__source">Source: src/components/chronicle/ChatInterfaceTab.tsx · handleSend, handleRegenerateMessage, and handleContinueConversation</p>
          </article>

          <article class="pipeline-component-card" id="rp-stage4-side-character">
            <h3>Auxiliary branch: register and enrich a new side character</h3>
            <h4>Detection and initial record</h4>
            <p><code>processResponseForNewCharacters</code> scans the accepted text for names Chronicle does not already know. With no new names or no authenticated user, it returns without registration. Otherwise it publishes initial side-character objects locally and awaits their minimal database saves one at a time. An individual save failure removes that row from local state before same-turn character-state review can consume it. The helper returns the successfully persisted subset.</p>
            <h4>Profile and avatar enrichment</h4>
            <p>After the minimal-save helper returns, <code>generateSideCharacterDetailsAsync</code> starts profile enrichment for each persisted character without awaiting completion. A successfully reviewed profile is saved; if it provides an avatar prompt, an avatar request may follow and save its result. Meanwhile, the action handler continues toward source-message saving.</p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--diagnostic">Evidence grouping</span><span>The profile and avatar validation snapshots are tagged <code>call_2</code>, while their debug-call records use the separate <code>support</code> group. This branch is still not one of the four standard Stage 5 workers.</span></p>

            <p>A caught individual registration failure does not block the main queue. An error escaping the overall awaited registration path does prevent that action from reaching the source-message save. Later profile or avatar failures do not cancel the standard workers or remove the accepted narrative.</p>
            <p class="pipeline-branch__source">Source: src/components/chronicle/ChatInterfaceTab.tsx · processResponseForNewCharacters and action-handler call sites</p>

          </article>

          <section class="pipeline-stage__output" aria-labelledby="roleplay-stage-4-persistence">
            <h3 id="roleplay-stage-4-persistence">Persist the accepted source messages before extraction</h3>
            <p><code>queueAssistantDerivedWorkAfterSourcePersist</code> serializes the source-message saves: each save waits for the previous one in this queue. It writes the action’s message set listed above. A successful save allows that exchange’s standard API Call 2 workers to be scheduled; the next save does not wait for all those workers to finish.</p>

            <p>If the source-message save fails, the response can remain visible in the current session but may not survive reload. All four standard workers are marked skipped because their results must be tied to a successfully saved source message.</p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>Only a successfully persisted, still-current accepted exchange is handed to Stage 5.</span></p>
            <p class="pipeline-branch__source">Sources: src/features/chat-runtime/use-post-turn-support-queue.ts · queueAssistantDerivedWorkAfterSourcePersist · src/components/chronicle/ChatInterfaceTab.tsx action handlers</p>

          </section>
        </section>

        <section id="pipeline-stage-extract-update" class="pipeline-stage pipeline-stage--word-layout" aria-labelledby="roleplay-stage-5-title">
          <div class="pipeline-stage-heading-row">
            <span class="pipeline-stage__number">Stage 5</span>
            <span class="pipeline-stage__scope pipeline-stage__scope--call2">API Call 2</span>
            <h2 id="roleplay-stage-5-title" class="pipeline-chapter-title">Extract and reconcile state for later turns</h2>
          </div>
          <div class="rp-stage-intro">
            <p><strong>API Call 2</strong> is the standard support queue opened after Stage 4 saves the source messages. Four workers receive the accepted assistant generation and visible user text: memory extraction, goal progress, goal alignment, and character state. This workflow label can include multiple provider requests or worker-specific retries.</p>
            <p><code>usePostTurnSupportQueue</code> removes private player-only text before dispatch. Workers finish independently as completed, failed, stale, or skipped; none rewrites the accepted narrative or automatically cancels the others. Memory and goal progress can start independently. Goal alignment and character state each have their own serial queue, so evaluations of the same kind do not overtake one another.</p>
          </div>





          <article class="pipeline-component-card">
            <h3>Memory extraction</h3>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--function">Function</span><span>Derive durable events from the accepted exchange so later turns can remember important changes without replaying the entire transcript.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--code-logic">Request path</span><span><code>queueAssistantMemoryExtraction</code> calls <code>POST /functions/v1/extract-memory-events</code>.</span></p>
            <p>The request contains visible user text, accepted assistant text, exact source identities, known character names, user-controlled character names, and recent existing memories. Chronicle parses the versioned response contract, reviews each candidate, rejects unsupported, non-authoritative, or near-duplicate events, and records both accepted and rejected candidate outcomes.</p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--enforcement">Enforcement</span><span>Only reviewed accepted candidates whose exact source generation remains current are eligible to persist. Rejected candidates remain debug evidence.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--persistence">Persistence</span><span>Each accepted candidate is written as a source-linked memory row. Partial failure is recorded per candidate; stale candidates are skipped or excluded from effective prompt memory.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>Persisted current memory rows become part of the memory source available to later Stage 2 request assembly when memories are enabled.</span></p>

            <p class="pipeline-branch__source">Source: src/components/chronicle/ChatInterfaceTab.tsx · queueAssistantMemoryExtraction · src/features/chat-runtime/use-post-turn-support-queue.ts</p>
          </article>

          <article class="pipeline-component-card">
            <h3>Goal-progress evaluation</h3>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--function">Function</span><span>Determine whether the accepted exchange completed the currently open step of an eligible story goal.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--code-logic">Request path</span><span><code>evaluateGoalProgress</code> calls <code>POST /functions/v1/evaluate-goal-progress</code>.</span></p>
            <p>The request contains visible user text, accepted assistant text, the open step for each eligible story goal, goal descriptions and flexibility, and the current story day and time. The returned classifications are matched back to known step IDs.</p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--enforcement">Enforcement</span><span>A completion is accepted only for a known step when the model marks it completed, returns the completed result, supplies non-generic evidence, and meets the confidence threshold. The source generation is checked before and after persistence.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--persistence">Persistence</span><span>Accepted completions create or update source-linked goal-step derivation rows. The authored base goal definition is not rewritten by this worker.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>Current derivation rows contribute to later goal state and can affect which goal steps Stage 2 treats as still open.</span></p>
            <p>If no completion qualifies, no goal-step update is accepted. Stale work, missing authentication, and save failures are recorded as the corresponding support outcome.</p>
            <p class="pipeline-branch__source">Source: src/components/chronicle/ChatInterfaceTab.tsx · evaluateGoalProgress · src/features/chat-runtime/use-post-turn-support-queue.ts</p>
          </article>

          <article class="pipeline-component-card">
            <h3>Goal-alignment evaluation</h3>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--function">Function</span><span>Evaluate whether the accepted exchange supports, resists, or drifts from active story and AI-character goals.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--code-logic">Request path</span><span><code>evaluateGoalAlignment</code> calls <code>POST /functions/v1/evaluate-goal-alignment</code> through its dedicated serial queue.</span></p>
            <p>The request includes the accepted exchange, recent visible conversation, current story and AI-character goals, open steps, flexibility, and the story clock.</p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--diagnostic">Diagnostic</span><span><code>GOAL_ALIGNMENT_SHADOW_MODE</code> is currently enabled. Evaluations and their evidence are recorded for review, but they do not persist alignment rows, steer Stage 2 prompts, or change the visible response.</span></p>


            <p class="pipeline-branch__source">Sources: src/components/chronicle/ChatInterfaceTab.tsx · GOAL_ALIGNMENT_SHADOW_MODE and evaluateGoalAlignment · src/features/chat-runtime/use-post-turn-support-queue.ts</p>
          </article>

          <article class="pipeline-component-card">
            <h3>Character-state extraction and application</h3>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--function">Function</span><span>Derive supported changes to current character state from the accepted exchange and make those changes available to later turns.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--code-logic">Request and apply path</span><span><code>extractCharacterUpdatesFromDialogue</code> calls <code>POST /functions/v1/extract-character-updates</code>; <code>applyExtractedUpdates</code> persists accepted reviewed candidates.</span></p>
            <p>Deterministic eligibility first limits the request to characters explicitly supported by the latest user and assistant exchange. The endpoint receives those eligible character records, visible recent context, story time, and exact source identities. Returned updates are reviewed for a supported field, eligible character, evidence, confidence, user-state authority, and current source generation.</p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--enforcement">Enforcement</span><span>Only accepted reviewed candidates can reach the apply path. Raw model candidates, rejected fields, unsupported removals, low-confidence claims, and stale generations remain evidence and cannot update state.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--persistence">Persistence</span><span>Accepted main- and side-character changes are written as source-linked per-message state snapshots, then applied to local runtime state when that synchronization succeeds.</span></p>
            <p class="pipeline-route-line"><span class="pipeline-taxonomy-badge pipeline-taxonomy-badge--handoff">Handoff</span><span>Current persisted snapshots are merged into the effective character state that later Stage 2 request assembly can read. A persisted row whose local runtime sync failed may require reload before it affects the active prompt.</span></p>

            <p class="pipeline-branch__source">Sources: src/components/chronicle/ChatInterfaceTab.tsx · extractCharacterUpdatesFromDialogue and applyExtractedUpdates · src/features/chat-runtime/use-post-turn-support-queue.ts</p>
          </article>


        </section>

        <section id="pipeline-later-turn-feedback" class="rp-callout rp-intro--accent">
          <p class="rp-kicker">Later-turn feedback loop</p>
          <h2>Accepted derived state returns to Stage 2</h2>
          <p>On a later Send, Retry, or Continue action, current persisted memories, goal-step derivations, and character-state snapshots can become candidates during request assembly. They still pass the Stage 2 visibility, authority, eligibility, and live-selection rules; persistence does not guarantee that every stored detail is sent to Grok on every turn.</p>

          <h3>A concrete memory example from acceptance to a later request</h3>
          <p>Suppose Stage 5 reviews and accepts the source-backed memory <q>Mara promised to protect the map.</q> Chronicle persists that candidate with the exact assistant source-message ID and generation ID that established it. The row does not alter the response that triggered extraction. It can influence only a later request.</p>
          <p>When a later turn begins, <code>buildActiveMemories</code> excludes a memory if its source message was deleted or its recorded generation no longer matches the current message-generation map. If memories are enabled and the source is still current, <code>renderMemories</code> can place the accepted memory into the <code>--- STORY MEMORIES ---</code> portion of the Stage 2 system instruction. The final live-selection rules still decide whether that source family reaches the selected provider packet.</p>

          <h3>What happens when background work is still running</h3>
          <p>A new turn does not wait for unfinished memory extraction. It uses the active-memory snapshot that exists when the request is dispatched. A memory result that finishes and persists after turn N has already started is absent from turn N and first becomes eligible for a later dispatch, such as turn N+1. The support-readiness record documents that timing; it does not itself select the memory.</p>

          <h3>Settings, edits, deletion, Retry, and reload</h3>
          <p>If memories are disabled, the memory source renders nothing even when durable rows exist. Editing a memory persists the replacement text and then updates local memory state, so the next eligible turn can use the revised wording. Deleting a memory persists the deletion and removes it from local state, so later turns omit it. Editing or deleting the source message, or replacing its generation through Retry, makes source-linked results from the older identity stale; normal Send and Continue exclude those stale rows, and Retry applies its own truncated accepted-history generation map.</p>
          <p>Reload fetches durable memories and prunes rows whose source message or generation is no longer current. That load is deferred, and the current Send path does not wait for <code>memoriesLoaded</code>. A player who sends before the load finishes can therefore dispatch with an empty active-memory snapshot even though durable memory rows exist. Browser-only work and the deleted-response recovery marker are not reconstructed by reload.</p>


          <p class="pipeline-branch__source">Sources: <code>src/components/chronicle/ChatInterfaceTab.tsx</code> · memory loading, <code>buildActiveMemories</code>, persistence, edit, delete, Send, Retry, and Continue paths; <code>src/services/llm.ts</code> · <code>renderMemories</code>.</p>
          <p><a class="rp-action-link" href="/style-guide/chronicle-knowledge-base?section=roleplay-pipeline&amp;tab=app-architecture#pipeline-stage-assemble-request">Return to Stage 2 request assembly</a></p>
        </section>

<!-- Graph lens input: these are the implementation paths referenced by the account above, not a second visible source appendix.
### Pipeline Source Paths

```text
src/components/chronicle/ChatInterfaceTab.tsx
src/features/chat-runtime/roleplay-response-job.ts
src/features/chat-runtime/continue-tail-action.ts
src/services/llm.ts
supabase/functions/chat/index.ts
supabase/functions/_shared/xai-responses.ts
src/features/chat-runtime/roleplay-recent-history.ts
src/features/chat-runtime/roleplay-source-shaping.ts
src/features/chat-runtime/roleplay-goal-selector.ts
src/lib/goal-alignment.ts
src/features/chat-runtime/collect-roleplay-response.ts
src/features/chat-runtime/use-post-turn-support-queue.ts
supabase/functions/extract-memory-events/index.ts
supabase/functions/evaluate-goal-progress/index.ts
supabase/functions/evaluate-goal-alignment/index.ts
supabase/functions/extract-character-updates/index.ts
```
-->

# Supabase Tables

<h1>Roleplay Pipeline Supabase Tables</h1>
        <div class="rp-intro rp-intro--accent">

          <p>Chronicle’s <strong>Supabase Schema Reference</strong> documents the repository’s database model. The mappings below connect its tables with the pipeline stages that use them; they are not a complete schema inventory or confirmation of the live deployment.</p>

        </div>
        <h2>Tables used by the pipeline</h2>

        <div class="pipeline-register">
          <table>
            <thead><tr><th>Repository-reference table</th><th>Referenced fields</th><th>Pipeline consumer or meaning</th></tr></thead>
            <tbody>
              <tr><td data-label="Repository-reference table"><code>messages</code></td><td data-label="Referenced fields"><code>id</code>, <code>conversation_id</code>, <code>role</code>, <code>content</code>, <code>day</code>, <code>time_of_day</code></td><td data-label="Pipeline consumer or meaning">Stage 4 source-message persistence and the accepted history Stage 2 may later select.</td></tr>
              <tr><td data-label="Repository-reference table"><code>memories</code></td><td data-label="Referenced fields"><code>conversation_id</code>, <code>content</code>, <code>source</code>, <code>source_message_id</code></td><td data-label="Pipeline consumer or meaning">Accepted memory candidates from Stage 5 and later memory-source selection.</td></tr>
              <tr><td data-label="Repository-reference table"><code>story_goal_step_derivations</code></td><td data-label="Referenced fields"><code>conversation_id</code>, <code>source_message_id</code>, <code>goal_id</code>, <code>completed</code></td><td data-label="Pipeline consumer or meaning">Source-linked goal progress accepted by Stage 5 and consulted on later turns.</td></tr>
              <tr><td data-label="Repository-reference table"><code>character_state_message_snapshots</code> and <code>side_character_message_snapshots</code></td><td data-label="Referenced fields"><code>conversation_id</code>, character ID, <code>source_message_id</code>, <code>snapshot</code></td><td data-label="Pipeline consumer or meaning">Per-message character-state evidence used to reconstruct current effective state.</td></tr>
              <tr><td data-label="Repository-reference table"><code>side_characters</code></td><td data-label="Referenced fields"><code>conversation_id</code>, <code>name</code>, profile and avatar fields</td><td data-label="Pipeline consumer or meaning">Initial and enriched side-character records created by the auxiliary branch after an accepted response.</td></tr>
            </tbody>
          </table>
        </div>
        <p class="rp-inline-note"><code>goal_alignment_states</code> appears in the repository reference, but the documented pipeline runs goal alignment in shadow mode and does not write alignment state.</p>

        <p><a class="rp-action-link" href="/style-guide/supabase-schema-reference">Open the Supabase Schema Reference</a></p>
