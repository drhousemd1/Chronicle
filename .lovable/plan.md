

# Fix Bugs #3 and #5: Field Name Mismatch + Complete Extraction Prompt Depth

---

## Bug #3: `preferredClothing` Field Name Mismatch

### 1. Current Problem

In the extraction prompt's TRACKABLE FIELDS (line 299 of `extract-character-updates/index.ts`), the `preferredClothing` section lists a field called `underwear`:

```text
preferredClothing.casual, preferredClothing.work, preferredClothing.sleep, preferredClothing.underwear, preferredClothing.miscellaneous
```

But the TypeScript type (`PreferredClothing` in `src/types.ts`, line 237) uses `undergarments`, and the database column also stores it as `undergarments`.

### 2. What This Bug Causes

The AI emits `preferredClothing.underwear` updates. The frontend has a normalization workaround at `ChatInterfaceTab.tsx` line 1825 that maps `underwear` to `undergarments`, so the bug is currently patched at the consumer level. But the root cause remains in the prompt -- any other consumer of extraction results without this normalization would silently lose data.

### 3. Scope

| File | Change |
|------|--------|
| `supabase/functions/extract-character-updates/index.ts` | Line 299: `underwear` to `undergarments` |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Line 1823: Add comment noting prompt is now correct; keep normalization as legacy safety net |
| `docs/guides/edge-functions-ai-services-structure-guide.md` | Bug #3 to RESOLVED |
| `docs/guides/character-builder-page-structure-guide.md` | Bug #3 to RESOLVED |

### 4. Proposed Fix

Change line 299 from `preferredClothing.underwear` to `preferredClothing.undergarments`. Keep the frontend normalization with a comment: `// Legacy compat: prompt now uses 'undergarments' but old cached extractions may still use 'underwear'`.

### 5. Expected Behavior

AI will emit `preferredClothing.undergarments` directly, matching the TypeScript type and database. Frontend normalization remains as a belt-and-suspenders safety net.

---

## Bug #5: Extraction Prompt Lacks Analytical Depth (COMPLETE — All 7 Blocks)

### 1. Current Problem

The extraction prompt operates at surface level. It maps observed behaviors to labels but has no mechanism for:
- Progressive trait refinement (traits written early never get refined as evidence accumulates)
- Conflict resolution (contradictory traits coexist without resolution)
- Split personality mode detection (the model never recommends switching to split mode)
- Tone inference from dialogue patterns (tone section stays empty without explicit statements)
- Cross-field coherence (personality, background, fears, tone can become internally contradictory)
- Trait lifecycle management (traits only accumulate, never get revised, merged, or retired)

### 2. What This Bug Causes

- Traits ossify: "Shy" written in message 3 remains forever, even when message 50 reveals a more nuanced "Performance-Anxious in Groups"
- Contradictions stack: old and new observations coexist without resolution
- Tone section remains empty because the model only extracts tone from explicit statements, not speech pattern analysis
- No mechanism to recommend split personality mode when public/private behavior diverges
- Character cards become internally incoherent over long sessions
- Traits only accumulate and are never merged, corrected, or retired

### 3. Scope

| File | Change |
|------|--------|
| `supabase/functions/extract-character-updates/index.ts` | Insert 7 new prompt blocks into the system prompt between Phase 1 and Phase 2 |
| `docs/guides/edge-functions-ai-services-structure-guide.md` | Bug #5 to RESOLVED |
| `docs/guides/character-builder-page-structure-guide.md` | Add Bug #5 resolution note |

### 4. Proposed Fix — All 7 Prompt Blocks

The following 7 blocks will be inserted into the system prompt as a new section between the existing Phase 1 and Phase 2. They replace/augment the current Phase 1 Section C personality guidance.

**Block 1 — Psychological Inference Framework** (replaces current Phase 1 Section C depth)

Introduces a three-layer reasoning requirement before writing any trait:
- LAYER 1 (Surface): What did the character do or say?
- LAYER 2 (Pattern): Is this consistent with earlier behavior, or new?
- LAYER 3 (Psychology): What does this behavior suggest about underlying personality, need, fear, or defense mechanism?

All traits must be written at Layer 3 depth. Forbidden: single-word traits, vague adjectives, circular descriptions, generic positives.

Example of wrong (Layer 1): "Humorous: Makes jokes frequently"
Example of right (Layer 3): "Deflective Humor: Uses wit and levity as a primary buffer against emotional vulnerability. Humor increases noticeably when conversation moves toward personal territory..."

**Block 2 — Progressive Trait Refinement**

Traits are treated as evolving hypotheses with three refinement stages:
- Stage 1 (Tentative, 1 observation): Broad label with minimal description
- Stage 2 (Contextualised, 2-3 observations): Specifies WHEN and WITH WHOM
- Stage 3 (Psychologically Grounded, 4+ observations or revealing moment): Describes underlying mechanism and cost

Rule: Always advance the stage if evidence supports it. Never collapse a Stage 3 back to Stage 1.

**Block 3 — Trait Conflict Resolution**

Defines exactly what to do when new evidence contradicts stored data:
- Path A (Genuine Evolution): Character has changed -- update the single trait to capture the arc
- Path B (Context Dependency): Both observations are true in different contexts -- merge into one nuanced entry
- Path C (False Presentation): Character is performing a trait they don't hold -- split mode candidate

Resolution rule: After resolution, exactly ONE entry per psychological concept. Zero duplicates. Zero silent contradictions.

Staleness rule: If a trait is contradicted and no resolution path applies cleanly, append "(REVIEW: may no longer be accurate based on recent behaviour)".

**Block 4 — Split Personality Mode Detection**

Teaches the model when to flag a character as a split mode candidate:
- Consistent divergence between public presentation and internal dialogue
- What they say vs. what they do when alone
- Behavior with strangers vs. trusted people
- Emotions performed vs. emotions felt

When detected across 3+ exchanges, add a note: `[SPLIT MODE CANDIDATE: Consistent divergence observed...]`

When a character IS already in split mode:
- outwardTraits = how others perceive them
- inwardTraits = their actual emotional experience
- The two lists must complement each other, never duplicate

**Block 5 — Tone Inference from Dialogue**

Concrete framework for extracting tone from the text itself:
- Vocabulary level (technical, slang, formal, monosyllabic)
- Rhythm (short/punchy vs. long/winding, self-interruptions)
- Formality shifts (language changes by audience)
- Emotional directness (names feelings plainly vs. obliquely)
- Deflection patterns (when pressed on uncomfortable topics)
- Intensity escalation (measured vs. clipped/erratic under pressure)

Format: "[Context]: [specific description of how they communicate]"

**Block 6 — Cross-Field Coherence Enforcement**

Final-pass check that the card tells a coherent story:
- Background to Personality: Do experiences produce the observed traits?
- Fears to Behaviour: Do stored fears echo in personality and tone?
- Goals to Motivation: Does at least one goal connect to background motivation?
- Tone to Personality: Does speech style align with personality traits?
- Relationships to Fears/Secrets: Do dynamics reflect known vulnerabilities?

When incoherence is found: flag it or correct it.

**Block 7 — Complete Trait Lifecycle**

Consolidated reference for all trait operations:
- CREATE: New info with no existing home. Must pass Layer 3 depth. No duplicates. Max 1 new non-goal entry per section per extraction.
- REFINE: Existing info can be more specific. Always advance precision. Preferred over CREATE.
- MERGE: Two entries cover same territory. Combine into one richer entry.
- CORRECT: Entry is factually contradicted. Apply Conflict Resolution (Block 3).
- CONTEXTUALISE: Entry true in some situations. Specify contexts in one entry.
- REMOVE: Entry definitively no longer accurate. For goals: `goals.GoalTitle = "REMOVE"`. For traits: empty string only if actively harmful to coherence.
- HOLD: Entry not contradicted but not reinforced. Leave it. Only flag if it creates active incoherence.

Golden Rule: "Every section of the character card should tell the same story as every other section."

### 5. Expected Behavior After Fix

- Traits will be actively refined, corrected, and deepened as sessions progress
- "Shy" written in message 3 will evolve to "Performance-Anxious in Groups" by message 20 as evidence accumulates
- Contradictory traits will be resolved via one of three paths, not left to coexist
- The Tone section will begin populating automatically from speech patterns
- Characters showing consistent public/private divergence will be flagged as split mode candidates
- The card will maintain coherence across all fields as a unified psychological portrait
- Traits can be merged, corrected, contextualized, or retired -- not just accumulated

---

## 6. Codebase Analysis Confirmation

I have read and analyzed in full:
- `supabase/functions/extract-character-updates/index.ts` (all 534 lines) -- the complete extraction prompt, TRACKABLE FIELDS at line 299, all three phases, the field volatility rules, examples, and response format
- `src/types.ts` -- PreferredClothing type confirming `undergarments` is the correct field name
- `src/components/chronicle/ChatInterfaceTab.tsx` line 1825 -- the `underwear` to `undergarments` normalization
- The full Bug Report v2 document (all 7 prompt blocks for Issue #5, all sub-issues for Issue #6, and Issues #7-#11)
- `docs/guides/edge-functions-ai-services-structure-guide.md` -- Bug #3 and #5 listed as ACTIVE
- `docs/guides/character-builder-page-structure-guide.md` -- Bug #3 listed as ACTIVE

## 7. Guide Document Confirmation

I have read:
- `docs/guides/GUIDE_STYLE_RULES.md` -- referenced by all guide documents
- `docs/guides/edge-functions-ai-services-structure-guide.md` -- Section 5 (bugs) and Section 13 (planned)
- `docs/guides/character-builder-page-structure-guide.md` -- Section 12 (known issues, lines 365-394)

## 8. Guide Documentation Updates

### `docs/guides/edge-functions-ai-services-structure-guide.md`
- Section 5: Bug #3 status from `ACTIVE` to `RESOLVED -- 2026-03-01 -- preferredClothing.underwear renamed to preferredClothing.undergarments in TRACKABLE FIELDS`
- Section 5: Bug #5 status from `ACTIVE` to `RESOLVED -- 2026-03-01 -- Added 7-block analytical depth framework: psychological inference, progressive refinement, conflict resolution, split mode detection, tone inference, cross-field coherence, complete trait lifecycle`
- Section 13: Remove Bug #3 and Bug #5 from planned items

### `docs/guides/character-builder-page-structure-guide.md`
- Section 12: Bug #3 from `ACTIVE` to `RESOLVED -- 2026-03-01 -- Extraction prompt now uses correct field name 'undergarments'. Frontend normalization retained as legacy safety net.`
- Section 12: Add Bug #5: `RESOLVED -- 2026-03-01 -- Extraction prompt augmented with 7-block analytical depth framework covering psychological inference, progressive trait refinement, conflict resolution, split personality mode detection, tone inference from dialogue, cross-field coherence enforcement, and complete trait lifecycle management.`

