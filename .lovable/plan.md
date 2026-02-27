

## Make AI Enhance Work Without Labels Everywhere

### Problem
The AI Enhance sparkle tool is broken or incomplete across many sections when the label field is empty:
1. **Personality traits** -- hard guard `if (!trait.label) return` silently blocks the enhance call
2. **Custom sections** -- sparkle button is conditionally hidden with `{item.label && (` so it doesn't even render
3. **All ExtraRow sections** (Tone, Background, Key Life Events, Relationships, Secrets, Fears, Physical Appearance extras, Currently Wearing extras, Preferred Clothing extras) -- the AI call fires but only sets the `value`, never generating a label. The user has to come up with the label themselves even though the AI has enough context to determine it.

### Solution

A "generate both" mode: when the label is empty, the AI generates both a label and description, and the response is parsed to update both fields.

### Changes

**1. `src/services/character-ai.ts` -- Add dual-field prompt mode and response parsing**

- Add a `GENERATE_BOTH_PREFIX` constant (e.g. `"__GENERATE_BOTH__:"`)
- In `buildCharacterFieldPrompt`: when `customLabel` starts with this prefix, modify the prompt to instruct the AI to return a structured response: `LABEL: <label>\nDESCRIPTION: <description>`
- In `aiEnhanceCharacterField`: after getting the AI response, if the customLabel had the prefix, parse the structured response and return it with a delimiter (e.g. `\n---SPLIT---\n`) so the caller can split into label + value
- Export the prefix constant and a helper `parseGenerateBothResponse(response)` that returns `{ label, value }` or `null` if not in that format

**2. `src/components/chronicle/PersonalitySection.tsx` -- Remove guard, enable dual-field**

- Line 220: Remove the `!trait.label` guard from `handleEnhanceTrait`
- When `trait.label` is empty, pass `__GENERATE_BOTH__:personality trait` as customLabel
- Change the `setValue` callback to detect the `---SPLIT---` delimiter and update both `label` and `value` on the trait (using `updateTraits` with both fields)

**3. `src/components/chronicle/CharactersTab.tsx` -- Fix custom sections and all ExtraRow calls**

Custom sections (line 1212):
- Remove the `{item.label && (` conditional so the sparkle button always renders
- When `item.label` is empty, pass `__GENERATE_BOTH__:custom field` as customLabel
- Change the `setValue` to parse the split response and update both `label` and `value` on the item

All ExtraRow enhance calls (tone, background, keyLifeEvents, relationships, secrets, fears, physicalAppearance extras, currentlyWearing extras, preferredClothing extras):
- When `extra.label` is empty, pass `__GENERATE_BOTH__:<section name>` as customLabel instead of the current fallback
- Change `setValue` from only updating `value` to also updating `label` when the split response is detected

This means modifying approximately 10 `openEnhanceModeModal` calls to use a wrapper function like:
```text
const buildExtraEnhanceArgs = (prefix, extra, sectionKey, extraId) => {
  if (extra.label) {
    // existing behavior: just enhance value
    return { customLabel: extra.label, setValue: (v) => handleUpdateExtra(sectionKey, extraId, { value: v }) }
  } else {
    // generate both
    return {
      customLabel: `__GENERATE_BOTH__:${prefix}`,
      setValue: (v) => {
        const parsed = parseGenerateBothResponse(v);
        if (parsed) handleUpdateExtra(sectionKey, extraId, { label: parsed.label, value: parsed.value });
        else handleUpdateExtra(sectionKey, extraId, { value: v });
      }
    }
  }
}
```

**4. Summary of all affected locations**

| Section | File | Issue | Fix |
|---------|------|-------|-----|
| Personality traits | PersonalitySection.tsx:220 | Hard guard blocks call | Remove guard, add generate-both |
| Custom sections | CharactersTab.tsx:1212 | Button hidden | Always show, add generate-both |
| Physical Appearance extras | CharactersTab.tsx:930 | Value-only update | Add generate-both when no label |
| Currently Wearing extras | CharactersTab.tsx:950 | Value-only update | Add generate-both when no label |
| Preferred Clothing extras | CharactersTab.tsx:971 | Value-only update | Add generate-both when no label |
| Tone extras | CharactersTab.tsx:1006 | Value-only update | Add generate-both when no label |
| Background extras | CharactersTab.tsx:1045 | Value-only update | Add generate-both when no label |
| Key Life Events extras | CharactersTab.tsx:1070 | Value-only update | Add generate-both when no label |
| Relationships extras | CharactersTab.tsx:1095 | Value-only update | Add generate-both when no label |
| Secrets extras | CharactersTab.tsx:1120 | Value-only update | Add generate-both when no label |
| Fears extras | CharactersTab.tsx:1145 | Value-only update | Add generate-both when no label |

