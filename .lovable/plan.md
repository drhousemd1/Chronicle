
Fix the Personality sparkle behavior so it works correctly for all three cases: Standard traits, Split Outward traits, and Split Inward traits.

1. Audit the routing mismatch
- Keep the existing Tone fix as-is.
- Update the personality enhance path because it still routes through the generic `custom` prompt.
- Confirmed from code:
  - `PersonalitySection.tsx` sends labels like `Personality trait: X` or `__GENERATE_BOTH__:personality trait`
  - `character-ai.ts` only has special routing for `extra_tone_*`
  - Result: personality enhance still falls back to the generic “custom” instruction, which explains the random text.

2. Add dedicated personality prompt types
- In `src/services/character-ai.ts`, add explicit prompt configs for:
  - `personality`
  - `personality_outward`
  - `personality_inward`
- These prompts should tell Grok to generate or enhance a personality trait, not tone.
- Outward should focus on what the character projects externally through behavior/dialogue.
- Inward should focus on internal emotional patterns, private impulses, hidden reactions, contradictions, and inner state.
- Standard should work as a general personality trait without split-specific framing.

3. Add section-aware generate-both hints for personality
- Expand the existing generate-both hint map in `character-ai.ts`.
- Add hints for:
  - `personality trait`
  - `outward personality trait`
  - `inward personality trait`
- This ensures blank label + blank description generates:
  - a fitting trait label
  - a matching description
  - no random tone/voice text
  - no duplication of existing character traits

4. Pass the correct personality type from the UI
- In `src/components/chronicle/PersonalitySection.tsx`, change the enhance calls so they identify which personality bucket is being edited:
  - Standard list → `personality`
  - Outward list → `personality_outward`
  - Inward list → `personality_inward`
- Also update the generate-both custom labels so the section hint matches the correct bucket:
  - `__GENERATE_BOTH__:personality trait`
  - `__GENERATE_BOTH__:outward personality trait`
  - `__GENERATE_BOTH__:inward personality trait`

5. Make field resolution robust in the AI service
- In `src/services/character-ai.ts`, extend field-name resolution so `personality_*` keys map correctly, similar to the existing Tone handling.
- This prevents prefixed row IDs from falling back to `custom`.

6. Preserve existing behavior for labeled vs blank rows
- Keep the current UX pattern:
  - Label exists → enhance description only
  - Label missing → generate both label + description
- Only change the prompt routing and instructions, not the UI flow.

7. Verification coverage
- Test these exact cases after implementation:
  - Standard mode: labeled trait, empty description
  - Standard mode: blank label + blank description
  - Split mode Outward: labeled trait, empty description
  - Split mode Outward: blank label + blank description
  - Split mode Inward: labeled trait, empty description
  - Split mode Inward: blank label + blank description
- Confirm results are:
  - personality-specific
  - outward/inward-aware when applicable
  - not tone/voice text
  - not generic/random prose

Technical notes
- Files to update:
  - `src/services/character-ai.ts`
  - `src/components/chronicle/PersonalitySection.tsx`
- No backend or API architecture changes needed.
- This should follow the exact same Grok enhancement pipeline already used elsewhere; only the prompt classification/routing needs to be corrected.
