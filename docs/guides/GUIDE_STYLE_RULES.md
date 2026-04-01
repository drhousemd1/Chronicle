<!--
╔══════════════════════════════════════════════════════════════════╗
║  CHRONICLE APP — GUIDE DOCUMENT STYLE RULES                     ║
║  Location: docs/guides/GUIDE_STYLE_RULES.md                     ║
║  Last updated: 2026-03-01                                        ║
║                                                                  ║
║  MANDATORY: Read this file IN FULL before creating or editing    ║
║  ANY guide document in this directory. These rules are           ║
║  non-negotiable. Do not deviate from them.                       ║
╚══════════════════════════════════════════════════════════════════╝
-->

# Guide Document Style Rules

> **This file governs how every guide document in `docs/guides/` must be written and formatted.**
> Before making ANY edit to a guide document, re-read this file. Do not skip sections. Do not improvise formatting. Follow these rules exactly.

---

## 1. Heading Hierarchy

| Level | Usage | Example |
|-------|-------|---------|
| `# H1` | Page title ONLY. One per document. Must match the page name from Section 0. | `# PAGE: COMMUNITY GALLERY` |
| `## H2` | Template section headings (1–13). Use the exact numbering and titles from the 13-section template. | `## 3. UI ELEMENTS — COMPLETE INVENTORY` |
| `### H3` | Sub-sections within a template section. Use for grouping related content. | `### 6a. Primary Data Hook` |
| `#### H4` | Individual items within sub-sections. Modals, cards, specific components. | `#### Modal: StoryDetailModal` |

**Rules:**
- NEVER use H1 for anything other than the page title.
- NEVER skip heading levels (e.g., jumping from H2 to H4).
- NEVER use bold text as a substitute for headings — use proper markdown headings so the viewer can build a navigation outline.

---

## 2. Table Formatting Rules

Tables are the primary information format in these guides. They must be structured consistently across all documents.

| Rule | Details |
|------|---------|
| **Header row** | Every table MUST have a header row with bold, descriptive column names. Use pipe-separated markdown table syntax. Header separators must use at least 3 dashes (`---|---|---`). |
| **Column consistency** | Use the SAME column structure for the same type of information across all pages. For example, all UI Element Inventory tables must use: `Element \| Type \| Label/Text \| Position \| Color—BG \| Color—Text \| Size/Weight \| Interaction \| Component File \| Notes`. |
| **No empty cells** | Every cell must contain a value. If not applicable, write `N/A` or `—`. Never leave cells blank — blank cells look like you forgot to fill them in. |
| **Color values** | Always provide BOTH the hex code AND the Tailwind class together: `#EF4444 / bg-red-500`. Never just "red" or just `bg-red-500`. The hex is for designers; the class is for developers. |
| **File paths** | Always use backtick-wrapped full paths: `` `src/components/chronicle/GalleryStoryCard.tsx` ``. Never abbreviate. Never write just the filename without the path. |
| **When to use tables vs prose** | USE TABLES for: inventories, comparisons, field lists, config values, any structured data with 3+ attributes. USE PROSE for: overviews, explanations, flow descriptions, rationale. Never use a paragraph to list 5+ items — use a table. |

---

## 3. Code Block Formatting

| Rule | Details |
|------|---------|
| **Language tags** | Always specify the language after the opening triple backticks: `` ```typescript ``, `` ```sql ``, `` ```tsx ``, `` ```json ``. This enables syntax highlighting. Never use bare `` ``` `` without a language. |
| **Inline code** | Use single backticks for: component names (`StoryCard`), function names (`handleSave()`), file paths (`src/services/supabase-data.ts`), Tailwind classes (`bg-[#1a1a1a]`), table/column names (`stories.user_id`), hook names (`useStoriesData`), event names (`'add-new-story'`), and cache keys (`['stories']`). |
| **Fenced code blocks** | Use fenced code blocks for: component trees (with file path comments), cache/sync flow sequences (numbered steps), TypeScript type definitions, SQL RLS policies, and any multi-line code. Indent nested items consistently. |
| **Component trees** | Always use a fenced code block with comment-style file paths. Format: `<ComponentName>  # src/path/to/File.tsx`. Indent children with 2 spaces. Add `(conditional)` or `(×N)` annotations where relevant. |

---

## 4. Content Patterns — What Good vs Bad Looks Like

These patterns apply to every section of every guide page. If you catch yourself writing something from the BAD column, stop and rewrite it.

### BAD — Do Not Write This

- "The page has a header with buttons and a grid of cards below it."
- "Data is fetched from Supabase and cached."
- "The modal has form fields for editing."
- "See the code for more details."
- "Known Issues: No known issues at this time."

### GOOD — Write This Instead

- "Page header row: H1 title `Your Stories` (`text-2xl font-bold text-white`), top-right `+ New` button (`#3B82F6 / bg-blue-500`, `text-white`, `text-sm font-semibold`). Below: 2-column grid (`grid-cols-2 md:grid-cols-3 gap-3`) of `ScenarioCard` components."
- "Hook: `useStoriesData()` (`src/services/supabase-data.ts`). Returns `{ stories: Story[], isLoading }`. Internally calls `useStoriesQuery` with cache key `['stories']`. Cache strategy: IndexedDB first → Supabase if stale > 30min → update IndexedDB + React Query cache."
- Provide the full modal spec table: `Trigger | Component File | Overlay style | Dimensions | Header text`. Then a Form Fields table: `Field Label | Input Type | Default | Validation | Notes`. Then Action Buttons table: `Button | Label | BG Color | Text Color | Icon | Action`.
- NEVER write "see the code for details." The entire purpose of this guide is so that no one needs to read the code. If you are tempted to write this, you have not finished documenting the section.
- "Known Issues: RESOLVED: Stale cache after character deletion — fixed by adding `['characters']` invalidation in delete mutation (2026-02-15). ACTIVE: `AutoResizeTextarea` is duplicated in 9 files — see Shared Elements page."

---

## 5. Section-Specific Formatting Requirements

Each of the 13 template sections has specific formatting expectations. Key sections:

| Section | Must Include | Format |
|---------|-------------|--------|
| **1. Page Overview** | Page title, route, source file, purpose (2–4 sentences), user role access, sidebar label + icon, entry points | Single table with `Field \| Detail` columns. No prose paragraphs — every field in the table. |
| **3. UI Elements** | Every visible element: buttons, badges, icons, inputs, labels, dividers, tooltips. No element too small. | Full 10-column table: `Element \| Type \| Label/Text \| Position \| Color—BG \| Color—Text \| Size/Weight \| Interaction \| Component File \| Notes`. |
| **5. Modals** | Every modal/dialog/sheet: trigger, component file, overlay, dimensions, header, form fields, action buttons, post-save/cancel behavior. | Separate H4 heading per modal. Overview table, then Form Fields table, then Action Buttons table, then Post-Save/Post-Cancel behavior. |
| **6. Data Architecture** | Hook name + file, cache keys, cache/sync flow (numbered steps), React Query config, Supabase tables, mutations, IndexedDB keys. | Sub-sections 6a through 6h per the outline template. Cache flow in a fenced code block with numbered steps. Tables for Supabase tables and mutations. |
| **7. Component Tree** | Full hierarchy from AppLayout down to leaf components. File path for every node. | Fenced code block with `tsx` language tag. Indent with 2 spaces. File path as inline comment: `# src/path/File.tsx` |
| **9. Styling Reference** | Every color used, typography specs, spacing/layout values, icon inventory. | Sub-sections 9a (colors), 9b (typography), 9c (spacing/radii), 9d (icons). Each as a table. Colors must show BOTH hex + Tailwind class. |
| **12. Known Issues** | Every bug, quirk, edge case, and gotcha. Resolved issues marked as RESOLVED with date. Active issues with description and impact. | Bullet list. Each item starts with `ACTIVE:` or `RESOLVED:`. Include enough detail that someone can understand the issue without reading code. |

---

## 6. General Rules

1. **Never write vague descriptions.** "Has some buttons" is unacceptable. Specify exact labels, colors, positions, sizes, and behaviors.
2. **Never write "see code for details."** Document everything explicitly. If you're tempted, you haven't finished the section.
3. **Always include file paths.** Every component, hook, utility, and config referenced must include its full `src/components/chronicle/StoryHub.tsx` path in backticks.
4. **Dates on known issues.** Every RESOLVED and ACTIVE item must include a date (YYYY-MM-DD).
5. **No orphan sections.** If a section is truly not applicable to a page (e.g., a page with no modals), write: `No modals or dialogs on this page.` — do not leave the section empty or delete it.
6. **Update in-place.** Never create duplicate guide documents. Always edit the existing file for a page. If you're unsure which file to edit, check the filename convention: `{page-slug}-page-structure-guide.md`.
7. **Version note.** When you make significant edits, add a line at the bottom of the document: `> Last updated: YYYY-MM-DD — [brief description of change]`.

---

## 7. The 13-Section Template

Every guide page MUST contain all 13 sections in this exact order. Do not rename them. Do not reorder them. Do not skip any.

1. **Page Overview** — Route, source files, purpose, access, sidebar position, entry points
2. **Layout and Structure** — Component tree showing visual hierarchy, responsive breakpoints
3. **UI Elements — Complete Inventory** — Every visible element in a 10-column table
4. **User Interactions & Event Handlers** — Every click, hover, drag, keyboard action with handler function
5. **Modals, Dialogs & Sheets** — Full spec per modal (trigger, fields, actions, post-behavior)
6. **Data Architecture** — Hooks, cache keys, Supabase tables, mutations, sync flow, IndexedDB
7. **Component Tree** — Full hierarchy with file paths, props, conditional renders
8. **State Management** — React Query keys, Zustand stores, local state, URL params
9. **Styling Reference** — Colors (hex + Tailwind), typography, spacing, icons
10. **Security & Access Control** — RLS policies, auth checks, role gates
11. **Dependencies & Cross-Page Interactions** — Shared components, navigation, event bus
12. **Known Issues & Gotchas** — ACTIVE/RESOLVED with dates and details
13. **Planned/Future Enhancements** — Roadmap items with priority and scope

---

<!--
IMPORTANT FOR AI ASSISTANTS:
If you are an AI assistant (Lovable, Cursor, Claude, etc.) editing any file in docs/guides/:
1. You MUST have read this entire file before making changes.
2. Follow every rule above without exception.
3. If you are unsure about a formatting choice, default to MORE detail, not less.
4. Cross-reference other completed guide documents in this directory for examples.
5. Never produce a guide page that contradicts these rules, even if the user prompt is vague.
-->
