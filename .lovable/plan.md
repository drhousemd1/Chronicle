
Goal: fix character card update behavior so it only updates relevant characters, make extraction reliably run after every message, improve personality inference from actions (not explicit statements), and decouple NSFW explicitness from response verbosity into two separate controls.

What I found in the current implementation

1) Why unrelated cards show “Updating…”
- In `src/components/chronicle/ChatInterfaceTab.tsx`, `applyExtractedUpdates()` calls `showCharacterUpdateIndicator(...)` immediately after name match, before confirming there is a meaningful patch to apply.
- The extraction request sends the full cast (`allCharacters = main + side`) to `extract-character-updates`, and the extraction prompt explicitly pushes broad review behavior (“review existing state”, “active characters must update mood/location”), which can produce updates for characters not in the immediate exchange.

2) Why “second API call” feels inconsistent
- `extractCharacterUpdatesFromDialogue()` has a hard concurrency guard:
  - `if (extractionInProgressRef.current) return [];`
- Calls are fire-and-forget from `handleSend`, `handleRegenerate`, and `handleContinue` (non-awaited `.then(...)`), so if a prior extraction is still running, the next extraction is skipped entirely.
- Also, extraction function returns empty updates on safety 403 with no retry path (chat function has retry logic; extraction does not), which can look like “didn’t trigger” from user perspective.

3) Why “Updating…” can show but nothing visibly changed
- Patch generation may include values equal to existing values, and indicator currently does not depend on diff significance.
- Indicator is tied to “character matched in updates”, not “actual persisted changes.”

4) Why NSFW intensity and verbosity are currently coupled
- In `src/services/llm.ts`, `nsfwIntensity === 'high'` injects both:
  - explicit/vulgar sexual behavior directives
  - drawn-out, stepwise, sensory-heavy “intensification” directives
- Style hints are also coupled: high intensity uses `nsfwStyleHints` that encourage extending scenes and more detail.
- Result: one toggle currently controls both explicitness and descriptive length.

Implementation plan

Phase 1 — Relevance gating for extraction targets and card indicators
Files:
- `src/components/chronicle/ChatInterfaceTab.tsx`
- `supabase/functions/extract-character-updates/index.ts`

Changes:
1. Build an “eligible character set” before extraction apply:
   - Eligible if either:
     - mentioned in latest user+AI exchange (use existing parsing/name resolution helpers), OR
     - has populated avatar (`avatarDataUrl` non-empty).
2. Pass eligible names to extraction function body (new field, e.g. `eligibleCharacters`).
3. In edge function prompt, add hard constraint:
   - “Only emit updates for eligible characters list. Ignore all others.”
4. In frontend `applyExtractedUpdates`, add guard:
   - discard updates for non-eligible characters (defensive second filter).
5. Move `showCharacterUpdateIndicator` to run only after:
   - patch object is non-empty AND
   - patch contains real changes vs current effective state (diff check).

Expected result:
- No more update pulses on unrelated cards.
- “Updating…” appears only when a relevant character has actual changes.

Phase 2 — Make extraction trigger reliable after every message (no skips)
Files:
- `src/components/chronicle/ChatInterfaceTab.tsx`
- `supabase/functions/extract-character-updates/index.ts`

Changes:
1. Replace “skip when busy” with a lightweight queue:
   - Keep `pendingExtractionRef` (latest request snapshot) or FIFO queue.
   - If in progress, enqueue; when current completes, immediately process next.
   - Ensure `handleSend`, `handleRegenerate`, `handleContinue` all enqueue instead of direct fire-and-forget skip behavior.
2. Add extraction lifecycle logs in UI console for observability:
   - queued, started, completed, skipped-by-filter, applied-count.
3. Add 403 retry behavior in extraction edge function similar to chat:
   - first attempt normal analysis
   - if 403, retry with a strict “safe summarization / non-explicit metadata extraction only” directive
   - only then fall back to empty.
4. Keep extraction non-blocking for message render, but guaranteed eventual processing.

Expected result:
- Extraction attempt happens consistently for each interaction path.
- Far fewer silent “no second call” moments.

Phase 3 — Improve action-based personality inference quality
Files:
- `supabase/functions/extract-character-updates/index.ts`
- `src/components/chronicle/ChatInterfaceTab.tsx` (apply merge behavior)

Changes:
1. Tighten extraction prompt for personality:
   - Require inferring traits from observed actions/dialogue patterns in latest exchange + recent context.
   - Require converting behavior into concise trait labels + grounded descriptions.
   - Add anti-placeholder rule: no vague traits (“interesting”, “complex”) and no empty labels.
2. Add output preference hierarchy in prompt:
   - update existing personality trait labels first,
   - append new trait only if it adds non-duplicate signal.
3. Add duplicate/similarity suppression for personality entries during apply:
   - normalize labels and avoid near-duplicates.
4. Only mark indicator if personality merge changed stored data.

Expected result:
- Better extrapolation from behavior.
- Fewer no-op personality writes.
- More stable and useful trait evolution.

Phase 4 — Split verbosity from NSFW explicitness into separate controls
Files:
- `src/types.ts`
- `src/utils.ts`
- `src/components/chronicle/ChatInterfaceTab.tsx`
- `src/services/llm.ts`
- `src/pages/Index.tsx` (patch typing flow consistency)

Changes:
1. Add new UI setting for response verbosity (separate from NSFW intensity), e.g.:
   - `responseVerbosity?: 'concise' | 'balanced' | 'detailed'`
   - default `balanced`.
2. Keep existing NSFW intensity toggle solely for explicitness/proactivity/vulgarity.
3. Add a new Chat Settings control for verbosity (using existing segmented/toggle style).
4. Update prompt composition in `llm.ts`:
   - `nsfwIntensity` controls sexual directness, language, initiative.
   - `responseVerbosity` controls length/detail density across all scene types.
   - Remove/relocate “draw it out / extend scene” directives from intensity block into verbosity block.
5. Decouple style-hint selection:
   - style hints chosen by verbosity setting, not by NSFW intensity alone.

Expected result:
- Users can choose:
  - explicit but concise, or
  - mild but detailed,
  independently.

Phase 5 — Validation and regression checks
Validation matrix:
1. Character update relevance
- Case A: unmentioned + no avatar → no update, no pulse.
- Case B: mentioned + no avatar → eligible, update allowed.
- Case C: unmentioned + avatar present → eligible, update allowed.
2. Reliability
- Rapid send sequence: extraction queue processes each request in order.
- Regenerate/Continue also enqueue and process.
3. Personality inference
- Action-only dialogue still produces meaningful trait updates.
- No duplicate trait spam.
4. Prompt control split
- NSFW High + Verbosity Concise: explicit language with short responses.
- NSFW Normal + Verbosity Detailed: low-vulgarity but rich descriptive output.

Notes on scope/risk
- No database schema changes needed.
- Main risk is over-filtering updates if name resolution misses aliases; mitigation is reusing existing name/nickname/previous-name resolution and keeping avatar eligibility path.
- Backward compatibility maintained with defaults for new setting in normalization logic.
