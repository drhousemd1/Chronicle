

# Update API Call Inspector Content to Match Current Codebase

## Analysis Summary

After comparing the API Inspector HTML against the actual edge functions and service files, I found the content is largely accurate but missing several API calls and has some outdated details. Here are the specific updates needed:

## Missing API Calls (not in the inspector at all)

### 1. Narrative Directive Generation (`generate-narrative-directive`)
- Edge function that analyzes recent conversation and story arcs to produce a 1-3 sentence directive for the next AI response
- Model: `grok-4-1-fast-reasoning`, Temp: 0.4, Max tokens: 256
- Triggered by the chat system when story stagnation is detected
- Needs a new sidebar entry and content section

### 2. Side Character Profile Generation (`generate-side-character`)
- Edge function that generates a full character profile JSON from a name + dialog context
- Model: configurable (default `grok-4-1-fast-reasoning`), Temp: 0.8
- Triggered when a new character name is detected in AI responses
- Needs a new sidebar entry and content section

### 3. Check Shared Keys (`check-shared-keys`)
- Utility edge function that checks if shared API keys are configured
- Simple config check, no AI model call
- Could be added as a minor utility entry, or skipped since it's not an AI call

## Content Updates Needed in Existing Sections

### API Call 1 — Chat (Main Roleplay)
The system prompt has grown significantly. Key additions not reflected in the inspector:

1. **Realism Mode block** — New conditional section (`realismMode`) with injury response hierarchy (Minor/Moderate/Severe), experience-based limits, persistent consequences, and user override resistance. Needs a new `iblock` in the Instructions section.

2. **Regeneration Directive** — When `isRegeneration` is true, a dedicated directive block is appended to the user message. Should be documented as a conditional instruction block.

3. **Runtime Directives** — A new system message injected as a high-priority directive for specific responses. Not documented.

4. **Style Hints** — Random style hints appended to user messages based on verbosity level (concise/balanced/detailed). Three distinct hint pools. Not documented.

5. **Session Message Count** — `[SESSION: Message N]` tag prepended to user messages for trait dynamics tracking. Referenced in the trait adherence rules but the mechanic isn't documented.

6. **Length Directive** — Optional length directive prepended to user messages. Not documented.

7. **Max Tokens by Verbosity** — The Verbosity block mentions max_tokens but the actual values have been confirmed: concise=1024, balanced=2048, detailed=3072. Already correct in the inspector.

8. **Valid Grok Models list** — Updated to include `grok-4-1-fast-reasoning`, `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-4-fast-reasoning`, `grok-3-mini`, `grok-3`. The inspector shows `grok-4-1-fast-reasoning` as default which is correct.

### API Call 2 — Post-Response Processing
Content is accurate. Minor updates:
- Character Extraction: The "eligible characters" filtering and constraint is documented. The 3-phase system, analytical depth framework, and trait lifecycle are all present and accurate. No changes needed.
- Memory Extraction: Accurate. The `modelId` parameter is optional with `grok-4-1-fast-reasoning` default.
- Arc Progress: Accurate. Uses hardcoded `grok-4-1-fast-reasoning`.
- Memory Compression: Accurate.

### Text Field Generation
- Star Icon Character Fields: Accurate. The `GENERATE_BOTH` mode and `SPLIT_DELIMITER` mechanic are documented.
- Star Icon World Fields: Accurate.
- AI Fill: Accurate. The empty field detection now includes `background`, `personality`, `tone`, `keyLifeEvents`, `relationships`, `secrets`, `fears` sections with `_extras` handling. The inspector already reflects this.
- AI Generate: Accurate. Story type analysis and section creation logic matches.

### Image Generation
- Cover Image: Accurate.
- Scene Image: Accurate. The analysis prompt, weighting rules, gender presentation rules, and byte-limit assembly are all documented correctly.
- Character Avatar: Accurate. Two-step process (prompt optimization + image generation) matches.

## Changes to Make

| File | Change |
|------|--------|
| `public/api-call-inspector-chronicle.html` | Add sidebar entries + content sections for "Narrative Directive" and "Side Character Generation". Add new instruction blocks for Realism Mode, Regeneration Directive, Runtime Directives, Style Hints, and Session Message Counter within API Call 1. |

### Sidebar additions:
- Under "API Call 2 — Post-response processing", add:
  - **Narrative Directive** (`generate-narrative-directive`)
- New group "API Call 3 — Side Character Pipeline" with:
  - **Side Character Generation** (`generate-side-character`)

### Content sections to add:
1. **Narrative Directive** — Full block documenting the directive generation prompt, inputs, and output
2. **Side Character Generation** — Full block documenting the profile generation prompt and JSON schema
3. **Realism Mode** — Conditional instruction block within API Call 1 Instructions section (after Verbosity)
4. **Regeneration Directive** — Conditional block documenting the regeneration system message
5. **Runtime Directives** — Block documenting the high-priority system message injection
6. **Style Hints** — Block documenting the 3 style hint pools and random selection per verbosity
7. **Session Message Counter** — Small note block documenting the `[SESSION: Message N]` tag

