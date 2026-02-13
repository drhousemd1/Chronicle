
# Fix AI Fill/Generate for New Character Sections

## Problems Found

### 1. Personality traits and _extras are listed as opaque IDs without labels
When the prompt tells the AI what to fill, it says things like `Personality Traits: outward.abc123, inward.def456`. The AI has no idea what "abc123" refers to -- it doesn't know the trait is called "Nurturing" or "Caring". Same for Tone/Relationships/etc _extras: it just sees `_extras.xyz789` with no context. The AI either skips these or generates nonsense.

**Fix**: Include the human-readable label alongside each ID in the fields-to-fill list, e.g. `outward.abc123 (Nurturing), inward.def456 (Horny)`.

### 2. Tone _extras with empty labels are silently skipped
The detection check requires `extra.label && !extra.value` -- if the user added a Tone row but left the label blank (just the placeholder), it's invisible to the AI. This is actually correct behavior for truly empty rows (how can the AI know what to fill?), but the sections themselves should still be mentioned in the prompt as empty sections the AI could populate with both label AND value.

**Fix**: When a section like Tone has _extras where BOTH label and value are empty, include the section in the prompt and instruct the AI to generate both label and value for those rows. Update the application logic to write back both label and value.

### 3. World context is nearly empty (uses deprecated fields)
The `worldContext` variable references `settingOverview` (deprecated/removed from the UI) and only `scenarioName`. It misses all the rich scenario data: `storyPremise`, `briefDescription`, `toneThemes`, `dialogFormatting`, `historyTimeline`, `factions`, and `plotHooks`.

**Fix**: Replace the world context builder in both `aiFillCharacter` and `aiGenerateCharacter` to include `briefDescription`, `storyPremise`, `toneThemes`, `historyTimeline`, `factions`, `plotHooks`, and `dialogFormatting`. This also addresses the user's request to pull Scenario Builder data into the AI context.

## Technical Details

### File: `src/services/character-ai.ts`

**getEmptyHardcodedFields (lines 226-254)** -- Enhance personality and _extras detection:
- For personality traits: store label alongside ID, e.g. `outward.id:Nurturing` instead of just `outward.id`
- For _extras: store label alongside ID, e.g. `_extras.id:Sarcastic` instead of just `_extras.id`
- For _extras with BOTH label and value empty: include as `_extras.id:__empty__` so the prompt can instruct the AI to generate both

**buildAiFillPrompt (lines 305-322)** -- Parse the enriched field descriptors to display human-readable labels in the prompt:
- Instead of `Personality Traits: outward.abc123`, show `Personality Traits: "Nurturing" (outward.abc123), "Caring" (outward.def456)`
- For `__empty__` entries, instruct: "Generate both a label and value for empty Tone/Relationships/etc rows"

**aiFillCharacter worldContext (lines 568-571)** -- Replace deprecated field references:
```
Setting: ${appData.world.core.briefDescription || 'Not specified'}
Scenario: ${appData.world.core.storyPremise || 'Not specified'}
Tone & Themes: ${appData.world.core.toneThemes || 'Not specified'}
Factions: ${appData.world.core.factions || 'Not specified'}
History: ${appData.world.core.historyTimeline || 'Not specified'}
Plot Hooks: ${appData.world.core.plotHooks || 'Not specified'}
```

**aiGenerateCharacter worldContext (lines 726-730)** -- Same replacement as above.

**Result application (lines 650-690 for fill, 810-847 for generate)** -- Handle the new `__empty__` extras:
- When the AI returns an _extras entry with both label and value, write both back to the character
- Currently only writes value when label already exists; needs to also support writing label for blank-label rows

**buildAiGeneratePrompt (lines 494-501)** -- Same enriched field descriptors as fill prompt.

### Summary
- 1 file modified: `src/services/character-ai.ts`
- No edge function changes needed
- No database changes needed
- Core fix: give the AI the actual labels/context it needs to generate meaningful content for personality traits and _extras sections, plus feed it the full scenario context
