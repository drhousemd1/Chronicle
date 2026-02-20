
# Move Model Settings from Sidebar into Admin Panel

## What's Changing

Model Settings will be removed from the left sidebar (where end users see it) and moved into the Admin panel as a new tile -- only accessible to the admin. End users won't see model selection since the app uses a single shared Grok key.

## Changes

### File: `src/pages/Admin.tsx`

1. Add a new tile to `DEFAULT_TOOLS` for Model Settings:
   - `id: 'model_settings'`
   - `title: 'Model Settings'`
   - `description: 'Select Grok model and manage API key sharing'`
   - No thumbnail (will show the default Sparkles icon placeholder)

2. Add a rendering branch: when `activeTool === 'model_settings'`, render the existing `ModelSettingsTab` component (imported from `@/components/chronicle/ModelSettingsTab`)

3. Pass through the `selectedModelId` and `onSelectModel` props -- these need to be added to `AdminPageProps` and threaded from `Index.tsx`

### File: `src/pages/Index.tsx`

1. **Remove** the Model Settings `SidebarItem` from the sidebar (line 1314)
2. **Remove** the standalone `model_settings` tab rendering block (lines 1919-1926) since it now lives inside the Admin page
3. **Pass** `selectedModelId={globalModelId}` and `onSelectModel={setGlobalModelId}` as new props to `AdminPage`
4. Keep the `model_settings` value in the `TabKey` type if needed, or just remove it -- the admin tool routing handles it internally now

### No other files need changes
- `ModelSettingsTab` component stays exactly as-is
- `ModelSettingsContext` continues to work since `Index.tsx` still manages `globalModelId`
