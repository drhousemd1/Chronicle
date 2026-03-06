

## Plan: Persist Chat Settings to Database

### Problem
`onUpdateUiSettings` in `Index.tsx` only updates in-memory React state (`setActiveData`). It never writes to the database. When the user navigates away from chat and returns, the scenario is re-loaded from DB with the old `ui_settings` values.

### Root Cause
`handleUpdateActive` is a generic in-memory state updater. Unlike conversation messages (which have dedicated `saveNewMessages`/`updateConversationMeta` calls), UI settings changes have no DB write path.

### Solution

**1. Add a lightweight `updateStoryUiSettings` function in `src/services/supabase-data.ts`**

A new exported async function that does a targeted `.update({ ui_settings })` on the `stories` table by scenario ID. This avoids the heavy full `saveScenario` call.

```ts
export async function updateStoryUiSettings(
  scenarioId: string,
  uiSettings: Record<string, any>
): Promise<void> {
  await supabase.from('stories').update({ ui_settings: uiSettings }).eq('id', scenarioId);
}
```

**2. Update `onUpdateUiSettings` handler in `src/pages/Index.tsx` (~line 2206)**

After updating in-memory state, fire-and-forget a DB write:

```tsx
onUpdateUiSettings={(patch) => {
  const currentSettings = activeData?.uiSettings || createDefaultScenarioData().uiSettings;
  const merged = { ...currentSettings, ...patch };
  handleUpdateActive({ uiSettings: merged });
  // Persist to DB (fire-and-forget)
  if (activeId) {
    supabaseData.updateStoryUiSettings(activeId, merged);
  }
}}
```

This is the same fire-and-forget pattern used for model preference persistence and conversation metadata updates elsewhere in the app.

**3. Update documentation**
- `docs/guides/chat-interface-page-structure-guide.md` — add resolved known issue for settings persistence.

### What this fixes
All chat settings (NSFW Intensity, Realism Mode, Response Detail, Proactive AI, Dynamic Text, Narrative POV, Time Mode, etc.) will persist across navigation and page reloads since they all flow through the same `onUpdateUiSettings` handler.

