

# Plan: Add "Story Premise" Field to World Core

## Overview

Add a new "Story Premise" field to the World Core section that allows users to describe the overall plot, central conflict, or narrative situation. This field fills the gap between world-building (settings, locations, rules) and the Opening Dialog (first scene).

---

## Changes Required

### 1. Update Type Definition

**File:** `src/types.ts`

Add a new `storyPremise` field to the `WorldCore` type:

```typescript
export type WorldCore = {
  scenarioName: string;
  briefDescription: string;
  storyPremise: string;           // NEW: Central conflict/plot/situation
  settingOverview: string;
  rulesOfMagicTech: string;
  factions: string;
  locations: string;
  historyTimeline: string;
  toneThemes: string;
  plotHooks: string;
  narrativeStyle: string;
  dialogFormatting: string;
};
```

---

### 2. Update Default Scenario Factory

**File:** `src/utils.ts` (or wherever `createDefaultScenarioData` is located)

Add `storyPremise: ''` to the default WorldCore object.

---

### 3. Add UI Field to World Tab

**File:** `src/components/chronicle/WorldTab.tsx`

Add the new TextArea between "Brief Description" and "Setting Overview" (around line 418-419):

```tsx
<TextArea 
  label="Story Premise" 
  value={world.core.storyPremise || ''} 
  onChange={(v) => updateCore({ storyPremise: v })} 
  rows={4} 
  placeholder="What's the central situation or conflict? What's at stake? Describe the overall narrative the AI should understand..." 
/>
```

Position: After Brief Description, before Setting Overview. This makes logical sense:
1. Scenario Name (what's it called)
2. Brief Description (short summary for card)
3. **Story Premise** (the actual plot/conflict)
4. Setting Overview (where it takes place)
5. Rules of Magic & Technology
6. Primary Locations
7. Tone & Central Themes

---

### 4. Include in AI System Prompt

**File:** `src/services/llm.ts`

Update the `worldContext` section (around line 33-41) to include the new field:

```typescript
const worldContext = `
  SETTING OVERVIEW: ${appData.world.core.settingOverview}
  STORY PREMISE: ${appData.world.core.storyPremise || 'Not specified'}
  RULES/TECH: ${appData.world.core.rulesOfMagicTech}
  FACTIONS: ${appData.world.core.factions}
  LOCATIONS: ${appData.world.core.locations}
  TONE & THEMES: ${appData.world.core.toneThemes}
  NARRATIVE STYLE: ${appData.world.core.narrativeStyle}
  DIALOG FORMATTING: ${fullDialogFormatting}
`;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add `storyPremise: string` to WorldCore type |
| `src/utils.ts` | Add `storyPremise: ''` to default WorldCore in factory |
| `src/components/chronicle/WorldTab.tsx` | Add TextArea for Story Premise field |
| `src/services/llm.ts` | Include storyPremise in AI context |

---

## Field Design Details

| Aspect | Value |
|--------|-------|
| **Label** | "Story Premise" |
| **Rows** | 4 (allows substantial content) |
| **Placeholder** | "What's the central situation or conflict? What's at stake? Describe the overall narrative the AI should understand..." |
| **Position** | After Brief Description, before Setting Overview |

---

## Why "Story Premise"?

This term was chosen because:
- **"Background"** sounds like past history (which `historyTimeline` already covers)
- **"Plot"** implies predetermined outcomes, which may not fit emergent roleplay
- **"Premise"** captures the starting situation and central tension without dictating endings
- It's familiar to writers and storytellers

---

## Technical Notes

- The field is optional (uses `|| ''` fallback) so existing scenarios won't break
- Adding `|| 'Not specified'` in the LLM context ensures the AI doesn't see undefined values
- No database migration needed - this is stored in the scenario's JSON data structure

