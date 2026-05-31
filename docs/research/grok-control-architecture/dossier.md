# Grok Control Architecture Research Dossier

Research date: 2026-05-30
Repo: `/Users/thomashall/Documents/New project/Chronicle-main`
Mode: research-only. No application code, prompts, schema, migrations, or tests were changed.

## 1. Research Plan

Research question: does the attached Chronicle/Grok conversation reveal a better direction for making Grok behave predictably in Chronicle's adult roleplay loop, and how do Grok's recommendations compare against what the current repo actually does?

Why this matters: Chronicle's core product is long-form roleplay. If the model cannot preserve established facts, physical continuity, character voice, erotic tone when relevant, user agency, and durable state over many turns, then the app fails at its main job.

In scope: the attached DOCX conversation, Grok's self-reported recommendations, official xAI API docs, public xAI Grok prompt files, Grok model capabilities and training disclosures, roleplay/persona-memory research, the current live roleplay call, post-turn support calls, debug/review exports, and stale internal API guidance.

Out of scope: implementation patches, prompt rewrites, database migrations, provider switching, and one-off tuning around any single test story.

Supplied artifacts:

- [Thomas, ChatGPT, Grok Chronicle Architecture Contemplation.docx](</Users/thomashall/Desktop/Thomas, ChatGPT, Grok Chronicle Architecture Contemplation.docx>)
- Repo: `/Users/thomashall/Documents/New project/Chronicle-main`
- Skill: `chronicle-research-workflow`
- Template: `dossier-template.md`

Initial assumptions:

- The DOCX includes both useful hypotheses and stale claims.
- Grok's own answer is not authoritative about xAI's private companion stack, but it is useful as a list of claims to verify.
- The current repo is the source of truth for what Chronicle sends today.
- Official xAI docs are the strongest public source for API capabilities as of 2026-05-30.

Evidence that would change this answer:

- Recent production debug exports proving the dominant failures come from UI rendering, not model output or state writes.
- A newer xAI doc that says late non-first system messages are recommended for Grok 4.3 roleplay.
- A live xAI probe showing `grok-4.3` Chat Completions rejects the same reasoning controls that the current Responses docs support.
- Product logs showing support-call state writes are never involved in later roleplay drift.

Delegation check: this was substantial research. I did not use new subagents in this pass because the user asked for a tighter, accountable correction after earlier work missed the point. I kept the source trail in this main thread, using the Chronicle research workflow and DOCX extraction workflow directly.

## 2. Source Index

| Source | Type | Path/URL | Why It Matters | Credibility |
|---|---|---|---|---|
| Attached DOCX | User-supplied document | [DOCX](</Users/thomashall/Desktop/Thomas, ChatGPT, Grok Chronicle Architecture Contemplation.docx>) | Captures the original Grok-control prompt, prior ChatGPT research, and Grok's recommendations. | Medium for intent and hypotheses; low-medium for unverified claims |
| Live roleplay prompt builder | Repo file | [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:65>) | Builds the system prompt, capped history, final user wrapper, response detail guidance, and debug request mirror. | High |
| Chat edge function | Repo file | [supabase/functions/chat/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/chat/index.ts:229>) | Sends the actual xAI Chat Completions request and handles streaming, allowlisting, and 403 fallback. | High |
| Live roleplay map | Repo file | [src/data/api-inspector-live-map.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-live-map.ts:93>) | Documents the current roleplay pipeline from UI action through Grok call and post-turn state reconciliation. | High |
| Review export | Repo file | [src/features/chat-debug/review-export.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/features/chat-debug/review-export.ts:422>) | Confirms Chronicle already exports exact Grok-facing payloads, support calls, hidden repair attempts, and applied state changes. | High |
| Prompt review docs | Repo file | [src/data/api-inspector-prompt-documents.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-prompt-documents.ts:396>) | Confirms support calls are documented with structured-output policy notes and current request shapes. | High |
| Internal Grok guide | Repo file | [src/data/api-inspector-guide-template.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-guide-template.ts:629>) | Contains useful but stale xAI/Grok guidance that can mislead future debugging. | Medium |
| Memory extraction | Repo file | [supabase/functions/extract-memory-events/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/extract-memory-events/index.ts:54>) | Shows memory extraction is already JSON-schema constrained. | High |
| Goal progress extraction | Repo file | [supabase/functions/evaluate-goal-progress/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/evaluate-goal-progress/index.ts:154>) | Shows story-step completion uses JSON schema plus deterministic acceptance gates. | High |
| Goal alignment extraction | Repo file | [supabase/functions/evaluate-goal-alignment/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/evaluate-goal-alignment/index.ts:209>) | Shows goal alignment is structured and currently diagnostic-only. | High |
| Character update extraction | Repo file | [supabase/functions/extract-character-updates/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/extract-character-updates/index.ts:62>) | Shows character state sync uses JSON schema and candidate review gates. | High |
| Adaptive style and hidden repair | Repo file | [src/lib/assistant-style-directive.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/lib/assistant-style-directive.ts:214>) | Shows dynamic per-turn style pressure can alter the live call after the stable prompt is built. | High |
| xAI Responses comparison | Official docs | [Comparison with Chat Completions](https://docs.x.ai/developers/model-capabilities/text/comparison) | Says Responses is recommended and Chat Completions is legacy/deprecated and stateless. | High |
| xAI Chat Completions legacy docs | Official docs | [Chat Completions](https://docs.x.ai/developers/model-capabilities/legacy/chat-completions) | Confirms Chat Completions is stateless and role content changes ingestion. | High |
| xAI Responses/generate text docs | Official docs | [Generate Text](https://docs.x.ai/developers/model-capabilities/text/generate-text) | Shows Responses examples, `store:false`, and reasoning-related response behavior. | High |
| xAI Grok 4.3 model page | Official docs | [Grok 4.3](https://docs.x.ai/developers/models/grok-4.3) | Confirms 1M context, text/image input, function calling, structured outputs, configurable reasoning, pricing, and aliases. | High |
| xAI reasoning docs | Official docs | [Reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning) | Confirms `grok-4.3` supports `reasoning.effort` with default `low`. | High |
| xAI structured outputs docs | Official docs | [Structured Outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs) | Confirms schema-constrained output is intended for structured tasks and tool arguments. | High |
| xAI prompt caching docs | Official docs | [Prompt Caching](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/best-practices) | Confirms `x-grok-conv-id` and `prompt_cache_key` improve cache hits but do not change output quality. | High |
| xAI API security FAQ | Official docs | [Security FAQ](https://docs.x.ai/developers/faq/security) | Confirms API inputs/outputs are not trained on without permission and are stored 30 days unless ZDR applies. | High |
| xAI Grok public prompts | Official/public repo | [xai-org/grok-prompts](https://github.com/xai-org/grok-prompts) | Shows xAI publishes Grok product prompts and safety prefixes, including adult-fiction-relevant safety language. | Medium-high |
| Grok 4.20 system card | Official model card | [PDF](https://data.x.ai/2026-04-07-grok-4-20-model-card.pdf) | Gives limited public training/development disclosure for a nearby Grok generation. | High for 4.20; medium for 4.3 inference |
| Lost in the Middle | Peer-reviewed paper | [ACL Anthology](https://aclanthology.org/2024.tacl-1.9/) | Supports the point that long context does not guarantee reliable use of information buried in the middle. | High |
| Instruction Hierarchy | Research paper | [arXiv 2404.13208](https://arxiv.org/abs/2404.13208) | Supports separating high-authority app instructions from user and generated text. | High |
| Memory-Driven Role-Playing | Research paper | [arXiv 2603.19313](https://arxiv.org/abs/2603.19313) | Supports explicit persona memory and retrieval as central to long-form roleplay consistency. | Medium |
| RMTBench | Research paper | [arXiv 2507.20352](https://arxiv.org/abs/2507.20352) | Supports user-intention fulfillment as a roleplay evaluation axis. | Medium |
| RPEval | Research paper | [arXiv 2505.13157](https://arxiv.org/abs/2505.13157) | Supports scoring roleplay across emotion, decisions, moral alignment, and in-character consistency. | Medium |

## 3. Repo And Artifact Map

The attached DOCX asked for Grok controllability research, not generic prompt advice. Its source trail is useful: official xAI docs, public Grok prompts, model versions, role/message structure, generation parameters, roleplay-specific evaluation, and concrete experiments that isolate Grok versus integration failures.

The prior ChatGPT answer inside the DOCX was directionally right on several API levers, but parts of it are stale against this repo. It says support calls still need structured-output hardening. Current Chronicle already does that for the main post-turn state workers: memory extraction, goal progress, goal alignment, and character updates all use `response_format.type = "json_schema"` with evidence/confidence-style fields or deterministic review gates. The live roleplay call remains free-form text, which is appropriate for an immersive roleplay response.

The strongest local evidence is that Chronicle already has the debug and review machinery the earlier answer treated as missing. The HTML review export renders the Grok-facing request body, browser-to-edge request, backend trace, support-call request/response bodies, hidden repair attempts, and applied update summaries in [src/features/chat-debug/review-export.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/features/chat-debug/review-export.ts:422>). The app architecture page also documents the live runtime map and source-backed prompt documents, including API Call 1 and API Call 2 + support calls in [src/data/api-inspector-live-map.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-live-map.ts:93>) and [src/data/api-inspector-prompt-documents.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-prompt-documents.ts:1563>).

The current live roleplay path is:

| Layer | Current Chronicle Behavior | Evidence |
|---|---|---|
| Stable prompt | One first `system` message containing story, world, character cards, memory, current scene, formatting rules, and chat settings. | [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:460>), [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:660>) |
| History | Last 9 non-local-notice messages plus current wrapped user turn. | [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:90>), [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:703>) |
| Final turn | Session marker, current-scene snapshot, adaptive style directive, raw user text or regen text, and execution brief are joined into one final `user` message. | [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:715>) |
| Transport | Edge function calls `https://api.x.ai/v1/chat/completions`. | [supabase/functions/chat/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/chat/index.ts:229>) |
| Model and parameters | `grok-4.3`, streaming, temperature `0.6`, max tokens based on response detail, no `top_p`, no penalties, no response schema, no tools, no cache header, no explicit reasoning setting. | [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:805>), [src/services/llm.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/services/llm.ts:854>), [supabase/functions/chat/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/chat/index.ts:235>) |
| Model gate | Only `grok-4.3` is allowlisted in the chat function. | [supabase/functions/chat/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/chat/index.ts:760>) |
| Hidden repair | If repetition guard triggers, the first draft can be discarded and a hidden second Call 1 is made with extra style pressure. | [src/components/chronicle/ChatInterfaceTab.tsx](</Users/thomashall/Documents/New project/Chronicle-main/src/components/chronicle/ChatInterfaceTab.tsx:5412>) |
| Post-turn support | Memory, goal progress, goal alignment, and character state workers run after the accepted assistant message. | [src/components/chronicle/ChatInterfaceTab.tsx](</Users/thomashall/Documents/New project/Chronicle-main/src/components/chronicle/ChatInterfaceTab.tsx:5165>) |
| Safety fallback | A provider 403 inserts a short content redirect system message and retries once. | [supabase/functions/chat/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/chat/index.ts:628>) |

There are also adjacent xAI calls that are not central post-turn roleplay state workers. Day-memory compression returns plain synopsis text in [supabase/functions/compress-day-memories/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/compress-day-memories/index.ts:42>). Side-character generation asks for JSON without xAI structured outputs in [supabase/functions/generate-side-character/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/generate-side-character/index.ts:109>). Scene/avatar image prompt optimization uses free-form text because the downstream artifact is an image prompt, not durable roleplay state. Those could be tightened later, but they do not overturn the main finding: the core post-turn state layer is already much more schema-disciplined than the DOCX implied.

## 4. Grok And xAI Findings

The official xAI docs as of this research date say the Responses API is the recommended text API, while Chat Completions is a legacy/deprecated, stateless endpoint. xAI's comparison table says Responses supports `previous_response_id`, server-side storage, full reasoning support, native tools, and future features first, while Chat Completions requires resending history and has a narrower feature surface. Chronicle's live Call 1 still uses Chat Completions.

This does not mean "migrate and everything is fixed." Responses changes request/stream shapes and storage semantics. The xAI generate-text docs show `store:false`, and the xAI security FAQ says normal API requests/responses are stored for 30 days for abuse auditing unless ZDR applies. For an adult roleplay product, any Responses experiment should use `store:false` by default and Chronicle should continue owning durable story state in its own database.

The current `grok-4.3` model page says the model has text/image input, text output, a 1,000,000 token context window, structured outputs, function calling, and configurable reasoning. xAI's reasoning docs say `grok-4.3` supports `reasoning.effort` values `none`, `low`, `medium`, and `high`, with `low` as the default. Chronicle currently labels the model as reasoning, but the live request does not send an explicit reasoning setting.

That matters because "default low reasoning" is a hidden variable. Roleplay is not always improved by more thinking. The likely useful test is not "turn reasoning higher." It is `none` versus `low` for dialogue-heavy, sensual, emotionally immediate scenes, then maybe `medium` only where physical continuity or multi-character logic is failing. The technical term is reasoning budget. Plain English: how much time the model spends mentally chewing before it speaks. In roleplay, too much chewing can make a character sound less present.

Prompt caching is real, but Grok framed it too strongly as a conversation-management fix. xAI's caching docs recommend `x-grok-conv-id` for Chat Completions and `prompt_cache_key` for Responses. They also explicitly say caching does not affect output quality. It routes repeat-prefix requests to improve cache hits, latency, and cost. Chronicle should probably add this for cost/latency measurement, but it should not expect better character behavior from caching alone.

Structured Outputs is one of the places where Grok's advice is half right and half dangerous. xAI's docs say schema-constrained output is useful for tasks like extraction, parsing, reports, and tool arguments. Chronicle already uses it for the main state workers. Forcing visible roleplay prose into JSON-only output would make parsing easier but can degrade immersion, voice, pacing, and the UI contract unless Chronicle intentionally redesigns the reader experience around structured scene rendering. The safer architecture is free-form visible prose plus structured side channels for state, diagnostics, and tool-like effects.

The public `xai-org/grok-prompts` repo is useful as evidence, not as a recipe. It proves xAI publishes product prompts and safety prefixes for Grok experiences, including language that says fictional adult sexual content with dark or violent themes is not globally disallowed in that prompt layer. It also shows there are upstream instructions Chronicle does not control. That helps explain why moderation or style behavior can sometimes feel like an upstream pressure issue. It does not justify pasting Grok product prompts into Chronicle. Those prompts are built for grok.com, X, and xAI product contexts, not for Chronicle's roleplay state machine.

Public Grok training disclosure is limited. The Grok 4.20 system card says that model was pre-trained on public data, third-party-produced data, and internally generated data, then mid-trained for capabilities and post-trained with supervised fine-tuning and reinforcement learning on human and synthetic reward signals. I did not find a Grok 4.3-specific model card with a more detailed training recipe. So the honest answer to "what is Grok trained on?" is: xAI discloses broad phases and sources for nearby model generations, but not enough to infer a secret roleplay training recipe.

Grok's companion claim is plausible but unverified. Its statement that companions likely use the same base model family plus heavy system prompts, app memory, relationship state, voice, animation, and NSFW toggles fits normal companion-product architecture and the public prompt evidence. But I did not find official xAI documentation confirming the private companion implementation or proving there is no companion-tuned model behind the app. The practical conclusion is still useful: Chronicle should not chase a secret "Ani endpoint." It should improve its own prompt/state/runtime layer because that is the layer API developers actually control.

## 5. Grok Recommendation Verdicts

| Grok Claim Or Recommendation | Verdict | Chronicle Reality | What To Do |
|---|---|---|---|
| Companions use app-layer prompts/state more than a secret API endpoint. | Plausible, unverified, directionally useful. | Chronicle already has app-owned story, character, memory, goal, and debug state. | Keep strengthening Chronicle's runtime layer. Do not chase a private companion model as the main path. |
| Use a stable, front-loaded, structured system prompt. | Mostly already done. | Chronicle uses one first system message with labeled sections and stable rule/state structure. | Do not rewrite solely into XML. If testing XML, test delimiters only, not prose changes at the same time. |
| XML-like tags dramatically reduce failure. | Weak evidence. | Chronicle already uses strong labeled sections and delimiter blocks. | Treat as low-confidence formatting A/B. Do not assume tags are magic. |
| Use few-shot examples in the stable prompt. | Potentially useful, risky. | Chronicle currently carries lots of scenario-specific state and rules; extra examples would add prompt mass and imitation risk. | Only test tiny structural examples if a specific output-format defect remains after simpler fixes. Avoid story-specific examples. |
| Force visible roleplay into JSON-only structured output. | I disagree for the main visible response. | Chronicle's visible output is immersive prose with app-specific speaker tags; state workers are structured. | Keep visible roleplay as text. Use schemas for side effects, extraction, and optional diagnostics. |
| Structured Outputs are the biggest control fix. | Right for support/state calls, not for prose quality. | Core post-turn state workers already use JSON schema and local gates. | Inventory remaining non-core JSON-ish calls, but do not call the core support layer schema-free. |
| Use `x-grok-conv-id` or `prompt_cache_key`. | Correct, but for caching rather than behavior. | Live Call 1 sends neither. | Add as a latency/cost experiment and log cached tokens. Do not score it as a roleplay-quality fix. |
| Never edit or reorder past messages. | Correct for cache hits and conversation identity, but Chronicle must still support regenerate/edit branches. | Chronicle slices history and uses generation lineage to avoid stale branches. | Preserve branch-safe message lineage. Cache keys should reflect conversation/session branch identity. |
| Periodically summarize turns and inject hidden context. | Already partly done, with caveats. | Chronicle uses memory bullets, day synopses, current scene state, and support workers. | Improve relevance and acceptance gates; do not dump more summaries blindly. |
| Temperature 0.7-0.85 is best for roleplay. | Low-confidence self-report. | Chronicle currently uses 0.6; repo history shows higher temps were previously reduced due variance. | Do not raise temperature first. Test after transport/reasoning/packing variables are isolated. |
| Start at 0.75 and test one value at a time. | Good experimental discipline, weak starting point. | Current app already has a chosen 0.6 baseline. | Keep 0.6 as baseline; run controlled variants if flatness is the observed failure. |
| Study public Grok prompts. | Yes, diagnostically. | Public prompts reveal upstream product/safety style, not companion internals. | Use them to understand upstream pressure and safety boundaries. Do not paste them into Chronicle. |
| Use leaked companion prompts. | Low-confidence and not engineering-grade. | Leaks may be stale, fake, contextless, or product-specific. | Do not base Chronicle architecture on leaked prompts. At most use them as anecdotal input after official/source-backed work. |

## 6. Where Chronicle Is Already Right

Chronicle is not doing this fundamentally wrong. The split architecture is the correct kind of architecture for a serious roleplay app: one live generation call for the scene response, then separate state workers for memory, goals, alignment diagnostics, and character updates. A single monolithic free-form model call would be weaker.

The current support calls are also much better than the DOCX suggested. Memory extraction returns a schema with an `events` array in [extract-memory-events/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/extract-memory-events/index.ts:89>). Goal progress returns structured classifications and then only accepts completion when the step is known, the model marked it completed, confidence is at least 0.75, and evidence is non-generic in [evaluate-goal-progress/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/evaluate-goal-progress/index.ts:201>) and [evaluate-goal-progress/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/evaluate-goal-progress/index.ts:302>). Goal alignment is JSON-schema constrained and shadow-mode only in [evaluate-goal-alignment/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/evaluate-goal-alignment/index.ts:217>) and [ChatInterfaceTab.tsx](</Users/thomashall/Documents/New project/Chronicle-main/src/components/chronicle/ChatInterfaceTab.tsx:1359>). Character extraction uses a schema with character, field, value, evidence, and confidence in [extract-character-updates/index.ts](</Users/thomashall/Documents/New project/Chronicle-main/supabase/functions/extract-character-updates/index.ts:62>).

The debug export is also not a missing concept. It already captures the exact things needed to analyze a turn: the browser-to-edge body, Grok-facing request, backend trace, support calls, hidden repair attempts, and applied state changes. That is precisely the right foundation for comparing Grok claims against actual Chronicle behavior.

The system prompt is not an unstructured blob in the naive sense. It uses source-backed sections, a first system message, current scene/memory state, explicit user-control boundaries, response detail settings, and multi-character flow rules. Grok's advice to "front-load a stable structured prompt" is therefore not a new revelation. It describes something Chronicle already mostly does.

## 7. Where Chronicle Likely Conflicts With Grok's Current Control Surface

The biggest current gap is that live Call 1 still uses Chat Completions. xAI's current docs call this legacy and stateless. Chronicle can still build a good product on a stateless endpoint, but it leaves current xAI controls unused: Responses chaining, explicit `store:false`, current reasoning API shape, and newer tool/agentic integration paths.

The second gap is that reasoning effort is not explicit. The app pins `grok-4.3`, which is good, but the request accepts whatever default xAI applies. xAI currently says the default is `low`. Because roleplay quality can change when a model is more or less deliberative, this should be a named request variable in experiments and debug exports.

The third gap is final-turn packing. Chronicle puts the session marker, current-scene snapshot, adaptive style directive, raw player text, regeneration directive if any, and execution brief into one final `user` message. The proper technical term is instruction hierarchy. Plain English: the player's actual scene input and the app's stage directions are being printed on the same sheet of paper. The model can still follow it, but it is harder to tell which part is a story fact and which part is runtime control, especially under long prompt pressure.

The fourth gap is dynamic style pressure. `buildAssistantStyleDirective` can inject a per-turn style adjustment when recent assistant messages repeat shape, length, wording, or dialogue/narration balance. Hidden repair can then discard the first draft and retry with an additional repair directive. This is useful, but it makes "what did Grok do?" a two-path question: the final visible response may be the second attempt, not the first. The review export captures this, so the fix is not "remove it blindly." The fix is to make quality analysis account for it.

The fifth gap is stale internal Grok guidance. [src/data/api-inspector-guide-template.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-guide-template.ts:648>) still mentions Grok 4.20 and 2M context in its verified-doc layer, while current app/model docs target `grok-4.3` with 1M context. It also says `reasoning_effort` returns error for Grok 4 in [src/data/api-inspector-guide-template.ts](</Users/thomashall/Documents/New project/Chronicle-main/src/data/api-inspector-guide-template.ts:662>), which conflicts with current xAI Grok 4.3 reasoning docs. This matters because future prompt debugging threads will keep inheriting stale assumptions from the app itself unless this reference gets refreshed.

## 8. Role, Message, And Endpoint Nuance

One DOCX recommendation was to test a separate late system message for the per-turn execution brief, followed by a clean user turn. I would not promote that directly as the main fix.

The reason is important: older xAI docs/search snippets say chat models have no role-order limitation, but current Responses guidance says only a single system/developer message should be used and it should be first. The Chat Completions legacy docs describe what roles mean, but the current primary path is Responses, and its guidance is stricter.

So the safer interpretation is this:

| Option | Why It Is Tempting | Risk | Better Framing |
|---|---|---|---|
| Late extra system message before the user turn | Gives runtime controls higher salience and separates player text from app text. | It may fight current xAI guidance for Responses and makes behavior less portable across endpoints. | Treat only as a Chat Completions experiment, not the default architecture. |
| Keep one first system message and use clear final user sub-blocks | Preserves xAI's single-first-system guidance. | Still leaves app controls in a user-role message. | Good low-risk packing variant: separate `[APP TURN CONTROLS]` from `[PLAYER TURN]` without changing prose. |
| Move volatile controls into stable system prompt | Keeps authority clean. | Static prompt can bloat and lose responsiveness. | Use only for controls that are truly stable across turns. |
| Responses API with `input` array and `store:false` | Uses xAI's recommended endpoint. | Requires adapter and streaming/debug work. | Best transport experiment, but not bundled with prompt rewrites. |

My recommendation is to test structure before wording. Compare current final wrapper against a final wrapper that clearly separates app controls from player input while preserving one first system message. Then, separately, compare Chat Completions versus Responses with equivalent content. Do not change endpoint, role ordering, execution brief prose, reasoning effort, and temperature in one patch.

## 9. Failure Pattern Log

| Symptom | Expected | Current Evidence | Likely Layer | What To Preserve |
|---|---|---|---|---|
| Fix one behavior and new problems appear elsewhere | A narrow change improves a failure without destabilizing continuity, voice, pacing, or state | The live path combines stable prompt, dynamic style pressure, capped history, hidden retry, provider fallback, and post-turn state writes. | Whole roleplay loop | Keep the split architecture and debug export. |
| Grok ignores or overweights part of the prompt | High-priority app rules and player text remain distinct | Final `user` content mixes player turn and runtime controls. | Prompt packing / instruction hierarchy | Preserve the current user-agency boundary and response detail controls. |
| Detailed mode still feels clipped or underdeveloped | Detailed mode expands the AI-controlled character's side of the exchange without writing the user's choices | Current execution brief is better than the old DOCX quote, but it is still late and appended to the user message. | Late prompt pressure | Preserve "stop before user-owned response" but avoid accidental compression. |
| Long-session continuity fails despite 1M context | Durable facts remain available when old messages age out | Call 1 sends only nine prior messages; state must come from memories, scene state, character state, and summaries. | Retrieval/state packing | Keep app-owned state; do not dump entire transcripts as a substitute. |
| State drift contaminates future turns | Support workers save only durable, evidenced facts | Core workers are structured and gated, but any accepted bad state becomes future prompt input. | Post-turn state machine | Preserve JSON schema and evidence/confidence gates. |
| Moderation feels misattributed | Failure is treated as a turn-context problem, not automatically user blame | Edge retry can insert content redirect and return a fallback or notice; debug trace distinguishes path. | Provider fallback / UX | Preserve recovery while exposing path clearly in review. |
| Public Grok prompt behavior seems inconsistent with Chronicle prompt | Chronicle knows what it controls versus what xAI controls | xAI public prompts include upstream safety/product instructions and adult-fiction-relevant language. | Upstream model/product layer | Do not cargo-cult public prompts; use them as evidence of upstream pressure. |

## 10. External Research Notes

Official xAI source trail:

- Responses is the preferred path and Chat Completions is legacy/deprecated and stateless.
- `grok-4.3` has text/image input, 1M context, structured outputs, function calling, and configurable reasoning.
- `reasoning.effort` defaults to `low` if not specified.
- `store:false` is available on Responses examples and should be the default posture for sensitive adult roleplay experiments.
- Prompt caching improves latency/cost through stable prefixes and conversation routing; xAI explicitly says it does not change output quality.
- xAI's security FAQ says API inputs/outputs are not used for training without explicit permission and are stored 30 days for abuse auditing unless ZDR is enabled.
- Public Grok prompt files show xAI product and safety prompt layers exist. They also contain adult-fiction-relevant language, which suggests fictional adult sexual content is not globally banned at that prompt layer, though actual provider enforcement can still depend on exact context.

Roleplay and long-context research:

- Lost in the Middle supports not trusting a giant context window as reliable memory. Models can perform worse when relevant facts sit in the middle of long context, even when the model accepts the tokens.
- Memory-Driven Role-Playing frames sustained character roleplay as a memory-utilization problem, not just a style-prompt problem.
- RMTBench argues roleplay should be scored by how well the character serves the user's intention across turns, not only by whether it resembles the character card.
- RPEval scores roleplay across emotional understanding, decision-making, moral alignment, and in-character consistency. Chronicle should add its own product-specific axes: erotic tone when relevant, physical continuity, user-agency boundary, state-write correctness, and repetition.

Rejected or weak sources:

- Leaked companion prompts: not reliable enough to drive architecture.
- Generic "best roleplay prompts" posts: mostly vibes and not tied to Grok API controls.
- Grok's self-reported compliance percentages or "dramatically reduces" claims: useful hypotheses, not measurements.
- Old xAI docs or snippets that contradict current Grok 4.3 docs: useful history, not current truth.

## 11. Claim-Source Matrix

| Claim | Chronicle Evidence | External Evidence | Confidence | Alternative Explanation | Disconfirming Test |
|---|---|---|---|---|---|
| Chronicle's split architecture is right. | Live generation and post-turn support workers are separate; support outputs are structured and gated. | Roleplay-memory research supports explicit memory/state systems. | High | Support workers may still over-save bad facts. | Replay fixed turns through support workers and inspect accepted updates. |
| The core support calls are not schema-free anymore. | Memory, goal progress, goal alignment, and character updates use JSON schema. | xAI structured outputs docs support this pattern. | High | Some adjacent non-core JSON-ish calls remain free-form. | Inventory every xAI call and classify by output contract and downstream risk. |
| Live Call 1 is the weaker Grok control surface. | It uses Chat Completions, no explicit reasoning, no cache key, no schema/tools, mixed final user wrapper. | xAI recommends Responses and documents richer control there. | High | Prompt content itself may dominate endpoint effects. | Run same prompt content through Chat Completions vs Responses with `store:false`. |
| Prompt caching will not improve roleplay behavior directly. | Chronicle sends no cache key today. | xAI FAQ says caching does not affect output quality. | High | Lower latency may improve user perception. | Add cache key and compare cached tokens/latency separately from quality scores. |
| Visible JSON-only roleplay is the wrong default. | Chronicle UI expects immersive text with speaker tags. | xAI docs position structured output for extraction/parsing/reporting/tool arguments. | Medium-high | A future UI could render structured scene objects elegantly. | Prototype only if the product intentionally redesigns response rendering. |
| Explicit reasoning is worth testing before temperature. | Current request does not set reasoning; model default is hidden. | xAI docs say `low` is default and `none` is supported. | Medium-high | Chat Completions may expose a different request shape than Responses. | Probe accepted fields safely, then compare `none` vs `low` on existing review exports. |
| Temperature 0.75 is not obviously better. | Current code uses 0.6; prior app notes lowered higher temperatures due variance. | No official xAI roleplay temperature prescription found. | Medium | Current 0.6 may be too flat for some erotic scenes. | Test temperature only after endpoint/reasoning/packing are held constant. |
| Current internal Grok guide is stale. | It references 4.20/2M and `reasoning_effort` errors. | Current xAI 4.3 docs say 1M and support reasoning effort. | High | Some guide sections intentionally preserve old history. | Refresh guide and confirm app docs no longer contradict current xAI docs. |
| Late system-message separation is not a safe default. | Current code uses one first system; DOCX suggests a late system experiment. | Current Responses docs recommend one system/developer message first. | Medium-high | Chat Completions may tolerate mixed role order better. | Treat as endpoint-specific experiment, not global design. |

## 12. Recommended Research-Backed Experiments

These are intentionally phrased as experiments because Chronicle already has the review/export surface to evaluate them. This is not a recommendation to build a generic harness; it is a recommendation to use the existing exports to isolate actual Grok control variables.

First, create a named Call 1 variant matrix. A variant should record endpoint, model slug, reasoning setting, temperature, cache key/session id, final wrapper type, hidden repair status, and fallback status in the same review export that already captures payloads. The first four variants should be:

| Variant | Purpose | Change |
|---|---|---|
| Baseline | Preserve current truth. | Current Chat Completions, current packing, temp 0.6, default reasoning. |
| Explicit reasoning | Remove hidden default. | Same as baseline, but set/record `none` or `low` where xAI accepts it. |
| Separated final wrapper | Test structure without prose changes. | Keep one first system message, but separate app turn controls and player turn with clear final-user sub-blocks. |
| Responses transport | Test current xAI endpoint. | `/v1/responses`, `store:false`, equivalent prompt content, same temperature, explicit reasoning. |

Second, score existing review exports against Grok-specific failure categories rather than generic "good/bad." The categories that matter most for Chronicle are physical continuity, established facts, user-agency boundary, character voice, erotic directness when the scene calls for it, purposeful external dialogue, multi-character chronology, repetition, moderation path, support-call state correctness, and next-turn state injection.

Third, audit stale internal Grok documentation. This should happen before future prompt surgery because agents and humans will keep using the architecture page as a source of truth. The current guide needs to distinguish current Grok 4.3 facts from historical Grok 4.20 notes and model self-report.

Fourth, add cache keys as telemetry, not as a behavior fix. The useful measurements are cached tokens, time-to-first-token, total latency, and cost. If roleplay output changes, treat that as sampling variance unless the prompt content or endpoint also changed.

Fifth, do a state-write replay pass on support calls. The question is not "does JSON parse?" The question is "did the app save only durable facts that should affect future scenes?" This is where bad long-session behavior can sneak in even when Call 1 looks acceptable.

## 13. What Not To Do

Do not keep adding long lists of prohibitions to the live prompt. This is prompt debt. The technical term is overconstraint: too many local rules competing for the model's attention. Plain English: if you tape fifty sticky notes to the actor's face, they are not going to perform better.

Do not rewrite the prompt around the current test story's objects, locations, or character names. The test story is diagnostic input, not product architecture.

Do not treat Grok's JSON-only advice as a universal answer. JSON is excellent when the app needs a machine-readable state update. It is not automatically excellent for the erotic, emotional, immersive prose the user actually reads.

Do not paste public Grok product prompts or leaked companion prompts into Chronicle. Use them to understand upstream pressure, not as templates.

Do not assume 1M context means "send more transcript." Long context is capacity, not guaranteed attention. Chronicle's curated state approach is still the right direction.

Do not migrate endpoint, change message packing, alter execution prose, change temperature, and change reasoning effort in the same patch. That would create a new pile of variables and no clear answer.

Do not trust the internal API guide until it is refreshed against current xAI docs. It currently contains facts that were reasonable for older Grok docs but are wrong or stale for `grok-4.3`.

## 14. Critique Log

Strongest counterargument: the live endpoint may not be the main problem. Grok could still fail because the prompt is very large, internally competitive, and full of creative constraints that fight each other. Responses API and explicit reasoning are better control surfaces, not a guarantee of better roleplay.

Second counterargument: the final user wrapper may not be causing failures. The model may handle the current sections fine, and state drift or hidden repair may explain more bad outputs than role packing. This is why the recommendation is structural A/B testing, not a confident rewrite.

Third counterargument: a JSON side-channel for visible response metadata might help. That is possible. But it should be a separate optional diagnostic or rendering layer, not the default visible roleplay response until the product decides to render structured scenes.

Assumptions that may be wrong:

- I did not inspect a fresh playthrough HTML export from the exact latest failing run.
- I did not call the xAI API live to verify which reasoning fields Chat Completions accepts today.
- I did not verify private xAI companion architecture. I only judged Grok's claim against public evidence and normal product architecture.
- I treated current official docs as stronger than older docs/search snippets when they conflict.

Recommendation most likely to backfire: moving Call 1 to Responses and changing prompt packing in the same patch. That would make it impossible to know whether behavior changed because of endpoint semantics, storage, reasoning defaults, streaming parser differences, or prompt shape.

Follow-up research after critique:

- Rechecked current repo support calls to avoid repeating the false "support calls are schema-free" claim.
- Rechecked review export code to confirm exact payload export already exists.
- Compared older xAI role-order claims against current Responses guidance and downgraded the late-system-message recommendation.
- Rechecked current `EXECUTION_BRIEF_TEXT` and corrected the stale DOCX claim about "one concrete AI-owned development and stop." That exact wording is no longer in live code.

## 15. Final Analysis

The answer is not "Chronicle is doing everything wrong." The answer is more precise: Chronicle has the right broad architecture, but the live roleplay call is still running through an older, narrower Grok control surface, and several important runtime variables are either hidden, stale in docs, or mixed together in one final user wrapper.

Grok's most useful guidance is that companion-like behavior is mostly app-layer engineering: stable identity prompt, persistent state, relationship/memory systems, and runtime controls. Chronicle already built much of that layer. The work now is not to chase a secret model endpoint or keep asking for magic prompt words. It is to make Chronicle's Grok integration more explicit: endpoint, reasoning, packing, cache/session identity, hidden repair path, fallback path, and accepted state writes.

Grok's weakest guidance is the JSON-only visible response recommendation. It is correct for support calls and state updates. It is not the right default for immersive roleplay prose. Chronicle is already applying structured outputs where they matter most: post-turn state. That finding directly contradicts the stale parts of the DOCX and the earlier bad answer.

The highest-confidence product direction is:

| Priority | Direction | Why |
|---|---|---|
| 1 | Refresh internal Grok/API docs. | Future work is currently exposed to stale 4.20/2M/reasoning assumptions. |
| 2 | Add named Call 1 variants in the existing review/export flow. | Chronicle already has the right inspection surface; use it to isolate Grok controls. |
| 3 | Test explicit reasoning (`none` vs `low`) before temperature changes. | Default reasoning is currently hidden, and roleplay may prefer less analysis. |
| 4 | Test final-wrapper separation without changing wording. | This isolates instruction hierarchy from prose changes. |
| 5 | Test Responses API with `store:false` behind an adapter. | xAI's current primary endpoint exposes the newer control surface, but migration must be isolated. |
| 6 | Treat cache keys as cost/latency telemetry. | Useful, but not a behavior fix. |
| 7 | Replay support workers for accepted state correctness. | The long-session memory system is only as reliable as the state it saves. |

In plain English: Chronicle already has the skeleton of a serious roleplay system. The next move is not more duct tape on the prompt. It is instrumented Grok-specific integration work: stop letting defaults hide, stop letting stale docs steer decisions, separate app controls from player text more cleanly, and compare current Chat Completions against Responses without changing five other things at the same time.

## 16. Open Questions

Does xAI currently accept explicit reasoning controls on the Chat Completions path for `grok-4.3`, or should reasoning tests happen only on Responses? The docs strongly show Responses support; live probing would answer the Chat Completions side.

Which failure category is currently most damaging in the latest playthrough exports: flat/clipped prose, physical continuity, character voice, user-agency overcorrection, state drift, repetition, or moderation fallback? The answer determines which Call 1 variant should be tested first.

How often does hidden repair trigger in real sessions, and does it correlate with better final outputs or with new failures? The export already captures discarded attempts, so this should be measurable.

How often do later failures trace back to a bad support-call state write rather than a bad visible response? This is the key state-machine question.

Should Chronicle eventually use structured side-channel metadata for scene effects while keeping visible prose free-form? That is a product/UI design decision, not merely a prompt decision.
