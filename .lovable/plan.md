

# Replace App Guide + Style Guide with Unified App Dashboard

## Summary

The transfer pack merges the separate App Guide and Style Guide tools into a unified "App Dashboard" hub. It also introduces two new tools (Quality Hub and API Inspector) and restructures the admin panel. Here is a detailed file-by-file breakdown.

## Files in the Transfer Pack

The pack contains updated versions of these files:

1. **`src/App.tsx`** -- adds `/style-guide/api-inspector` route
2. **`src/pages/Index.tsx`** -- minor differences: SidebarItem already matches current (gradient active style, gloss overlay), imports use `DropdownMenuSeparator` + `DropdownMenuLabel` (both currently unused but imported), `useLocation` added
3. **`src/pages/Admin.tsx`** -- removes `app_guide` as a separate tool, renames `style_guide` to "App Dashboard", removes the `app_guide` lazy import, simplifies `DEFAULT_TOOLS` to 3 entries, simplifies card hover (removes `transition-all` on wrong element, adds `bg-black/30` overlay)
4. **`src/components/admin/AdminToolEditModal.tsx`** -- identical to current
5. **`src/components/admin/styleguide/StyleGuideTool.tsx`** -- massive rewrite: now acts as the "App Dashboard" with internal tab navigation between Style Guide, App Guide, Quality Hub, and API Inspector sub-tools
6. **`src/components/admin/styleguide/StyleGuideDownloadModal.tsx`** -- assumed unchanged (not shown separately)
7. **`src/components/admin/styleguide/StyleGuideEditsModal.tsx`** -- identical structure with all Keep/Edit/Edits modals
8. **`src/components/admin/guide/AppGuideTool.tsx`** -- identical to current
9. **`src/components/admin/guide/GuideEditor.tsx`** -- identical to current
10. **`src/components/admin/guide/GuideSidebar.tsx`** -- not shown, assumed unchanged
11. **`src/components/admin/guide/GuideLoadErrorBoundary.tsx`** -- identical to current
12. **`src/pages/style-guide/ui-audit.tsx`** -- **complete rewrite** as "Quality Hub" with new schema types, restructured UI, agent workflow system, module playbooks
13. **`src/pages/style-guide/api-inspector.tsx`** -- **new file**: iframe wrapper for the API Call Inspector HTML
14. **`src/lib/ui-audit-schema.ts`** -- **complete rewrite**: old UI audit types replaced with Quality Hub types (`QualityHubRegistry`, `QualityFinding`, `QualityAgent`, etc.)
15. **`src/lib/ui-audit-utils.ts`** -- **complete rewrite**: new utility functions for Quality Hub (`mergeRegistries`, `countBySeverity`, `countByDomain`, `sortFindings`, `newId`, etc.)
16. **`src/data/ui-audit-findings.ts`** -- **complete rewrite**: new default registry data for Quality Hub
17. **`public/style-guide-component-example.html`** -- **new file**: HTML spec sheet for the Physical Appearance component
18. **`public/api-call-inspector-chronicle.html`** -- **new file**: massive HTML document for the API Call Inspector (embedded via iframe, lines ~12200-15573)

## Key Structural Changes

1. **Admin Panel simplification**: 3 tools instead of 4 (Image Generation, Model Settings, App Dashboard)
2. **App Dashboard** (formerly Style Guide): now a multi-tool hub that internally manages the Style Guide, App Guide, Quality Hub, and API Inspector via its own tab navigation -- eliminating the need for separate `app_guide` routing in Admin
3. **Quality Hub** replaces the old UI Audit: entirely new schema, new types, new data structure
4. **API Inspector** is new: wraps an HTML document in an iframe, with a separate route at `/style-guide/api-inspector`

## Issues Found During Analysis

1. **API Inspector HTML file reference**: The `api-inspector.tsx` references `src="/api-call-inspector-chronicle.html?v=20260317-2"` -- this file needs to be placed in `public/` as `api-call-inspector-chronicle.html`. The HTML content starts at line ~12217 in the transfer pack under `public/style-guide-component-example.html` but the actual API inspector HTML is a separate embedded block around lines 12600-15573.

2. **Import mismatch in ui-audit.tsx**: The new Quality Hub page imports from `@/lib/ui-audit-schema` and `@/lib/ui-audit-utils` and `@/data/ui-audit-findings` -- all three files need to be rewritten simultaneously to match the new types.

3. **Index.tsx differences are minor**: The transfer pack version has the `useLocation` import and `DropdownMenuSeparator`/`DropdownMenuLabel` imports. The current codebase already has these. The SidebarItem gradient active style is already in the current code. The main difference is removing the `app_guide`-specific header buttons from the admin section in the header.

4. **StyleGuideTool.tsx is the biggest change**: It becomes the App Dashboard shell, likely containing internal navigation to load the sub-tools. Need to verify all the sub-tool props are properly threaded.

5. **The `public/api-call-inspector-chronicle.html` file**: This is the full API Call Inspector HTML (~3000+ lines). It needs to be extracted from the transfer pack and placed in `public/`.

## Implementation Plan

### Phase 1: Schema and Data Layer (no UI impact)
- Replace `src/lib/ui-audit-schema.ts` with new Quality Hub schema
- Replace `src/lib/ui-audit-utils.ts` with new Quality Hub utilities  
- Replace `src/data/ui-audit-findings.ts` with new Quality Hub defaults

### Phase 2: New Files
- Create `src/pages/style-guide/api-inspector.tsx`
- Create `public/api-call-inspector-chronicle.html` (extracted from transfer pack)
- Create `public/style-guide-component-example.html`

### Phase 3: App Dashboard (StyleGuideTool Rewrite)
- Replace `src/components/admin/styleguide/StyleGuideTool.tsx` with the new App Dashboard version that includes internal sub-tool navigation

### Phase 4: Admin Panel Update  
- Update `src/pages/Admin.tsx` to remove `app_guide` as a separate tool, simplify to 3 tools
- Update `src/pages/Index.tsx` header to remove `app_guide`-specific buttons (since guide is now inside the dashboard)

### Phase 5: Routing
- Update `src/App.tsx` to add the `/style-guide/api-inspector` route

### Phase 6: Cleanup
- Remove old `app_guide` header buttons from `Index.tsx` since guide Save/Sync actions will be handled internally by the App Dashboard

## Estimated Scope
- **8 files to create/replace**
- **3 files to update** (Admin.tsx, Index.tsx, App.tsx)
- Total: ~15,000 lines of code from the transfer pack
- This will need to be implemented across multiple messages due to file size constraints

