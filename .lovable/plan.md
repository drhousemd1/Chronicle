

# Plan: Complete Style Guide — All Pages & UI Elements

## The Problem

The current Style Guide only documents UI elements from **2 pages** (Story Builder and My Stories). The app has **10+ distinct views**, each with unique UI elements that are not represented. The guide needs to be expanded page-by-page to catalog every button, input, card, badge, panel, and layout pattern across the entire application.

## Pages/Views to Add

Currently documented: Story Builder, My Stories (partial)

**Missing pages (in implementation order):**

1. **Community Gallery** — search bar, filter sidebar, sort pills, gallery cards with like/save/play icon buttons, detail modal, category sidebar
2. **Chat Interface** — message bubbles, input bar, quick action buttons, character sidebar cards, day/time panel, chat settings modal, memories modal, character edit modal
3. **Chat History** — session cards (nested card layout), thumbnail buttons, action buttons, empty state, load-more button
4. **Character Library / Characters Tab** — character cards with avatar, trait sections with Lock icons, section headers, avatar generation, enhance mode button (iridescent), custom content type modal
5. **Image Library** — folder grid cards, image grid, lightbox overlay, upload states, folder edit modal, aspect ratio badges
6. **Account Page** — tab pills (dark variant), settings cards, form inputs (dark theme), subscription badges, public profile form
7. **Model Settings** — model selection cards, connection status badges, switch toggles
8. **Auth Page** — login/signup card (light theme), form validation errors
9. **Global Sidebar** — sidebar items (active/inactive/collapsed), logo block, section dividers, collapse toggle
10. **Global Header** — header bar, back button, page titles, search inputs, action button groups

## What to Document Per Page

For each page, add:
- **Colors** section entries (new swatches specific to that page)
- **Typography** entries (any text styles not already documented)
- **Buttons** entries (unique button patterns)
- **Form Inputs** entries (page-specific input styles)
- **Badges & Tags** entries
- **Panels** entries (card/container patterns)
- Rendered previews using real Tailwind classes (not inline styles)
- Inconsistency notes where applicable

## Implementation Approach

Each page gets a `PageSubheading` + `PageDesc` + entry cards under the existing 8 sections (Colors, Typography, Buttons, etc.) — following the established pattern. This means new entries are added within the existing sections, grouped by page.

### Pass 1: Community Gallery + Chat Interface
Add under each section:
- **Colors**: Gallery card gradient, search bar bg, filter sidebar bg, chat bubble bg (`#1c1f26`), chat input bar bg, character sidebar bg
- **Typography**: Gallery card title/creator, search placeholder, chat message text styles (action/speech/plain), character name labels, day/time badge text
- **Buttons**: Gallery icon buttons (Like h-8 w-8, Save, Play), sort pills, filter clear button, chat Send button (active/inactive), Chat Settings button, Generate Image button
- **Form Inputs**: Gallery search bar, chat textarea (white bg variant)
- **Badges**: Gallery spice rating, gallery stats badges
- **Panels**: Chat message bubble (transparent + solid variants), character sidebar cards (frosted glass — light bg + dark bg variants), day/time sky panel, chat input bar container

### Pass 2: Chat History + Character Library + Image Library
- **Colors**: Session card nested bg (`#3a3a3f/30`), character builder dark surfaces, image library folder card styling
- **Typography**: Session title, message preview text, character section headers (lock icon pattern), folder names
- **Buttons**: Session thumbnail click area, conversation delete button (`bg-white/10`), Load More button, avatar action buttons, enhance mode button, folder action buttons
- **Form Inputs**: Character trait row textareas (dark theme, no border variant)
- **Badges**: Message count badge, aspect ratio badges
- **Panels**: Session cards (double-nested), character roster sidebar, character trait sections, folder grid cards, image lightbox

### Pass 3: Account + Model Settings + Auth + Global Elements
- **Colors**: Account bg (`#121214`), settings card bg (`#1e1e22`), auth page gradient, plan badge color
- **Typography**: Account section titles, auth card title, model card labels
- **Buttons**: Account tab pills (dark variant on `#2b2b2e`), auth submit button, model selection cards
- **Form Inputs**: Account password input (dark theme, rounded-xl), auth email/password inputs (light theme)
- **Badges**: Subscription plan badge (`bg-[#4a5f7f]/20 text-[#7ba3d4]`), connection status indicator
- **Panels**: Sidebar navigation (expanded + collapsed), global header bar, account settings cards, auth card (light theme Card component)

## File Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add ~50-60 new entry cards across the 8 existing sections, organized by page |

## Execution Plan

3 implementation passes, each adding entries for a group of pages:
1. **Pass 1**: Community Gallery + Chat Interface (~20 new entries)
2. **Pass 2**: Chat History + Character Library + Image Library (~20 new entries)
3. **Pass 3**: Account + Model Settings + Auth + Global Sidebar/Header (~15 new entries)

Each pass adds new `PageSubheading` blocks within existing sections. Verify after each pass before proceeding.

