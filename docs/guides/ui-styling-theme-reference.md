> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> This document is the SINGLE SOURCE OF TRUTH for the application's visual design system.

# PAGE: UI STYLING & THEME REFERENCE

---

## 1. Overview

| Field | Detail |
|-------|--------|
| **Purpose** | Central reference for all colors, typography, spacing, icons, and component variants used across the application. Prevents style drift by providing a single source of truth. |
| **CSS Files** | `src/index.css` (design tokens), `tailwind.config.ts` (Tailwind extensions) |
| **Component Library** | shadcn/ui (base) + `src/components/chronicle/UI.tsx` (custom dark-theme variants) |

---

## 2. Design Tokens (CSS Custom Properties)

Defined in `src/index.css` under `:root` and `.dark`.

### Light Theme (`:root`)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `222.2 84% 4.9%` | Primary text |
| `--primary` | `222.2 47.4% 11.2%` | Primary buttons |
| `--primary-foreground` | `210 40% 98%` | Text on primary |
| `--secondary` | `210 40% 96.1%` | Secondary surfaces |
| `--muted` | `210 40% 96.1%` | Muted surfaces |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Muted text |
| `--accent` | `210 40% 96.1%` | Accent surfaces |
| `--destructive` | `0 84.2% 60.2%` | Destructive actions |
| `--border` | `214.3 31.8% 91.4%` | Default borders |
| `--input` | `214.3 31.8% 91.4%` | Input borders |
| `--ring` | `222.2 84% 4.9%` | Focus rings |
| `--radius` | `0.5rem` | Default border radius |

### Dark UI Panel Tokens

Used by the Chronicle dark theme components:

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--ui-surface` | `240 7% 16%` | Dark panel backgrounds |
| `--ui-surface-2` | `228 7% 20%` | Elevated panel backgrounds |
| `--ui-border` | `0 0% 100% / 0.10` | Subtle borders on dark surfaces |
| `--ui-border-hover` | `0 0% 100% / 0.16` | Hover borders on dark surfaces |
| `--ui-text` | `210 20% 93%` | Text on dark surfaces |
| `--ui-text-muted` | `210 20% 93% / 0.75` | Muted text on dark surfaces |
| `--accent-teal` | `186 71% 46%` | Teal accent (used for highlights) |
| `--accent-purple` | `246 91% 67%` | Purple accent |

---

## 3. Brand Colors (Hardcoded)

These are hardcoded hex values used consistently across Chronicle components:

| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Brand border | `#4a5f7f` | `border-[#4a5f7f]` | All tile borders, card borders |
| Active sidebar | `#4a5f7f` | `bg-[#4a5f7f]` | Active sidebar item |
| Teal accent | `#00F0FF` | `text-[#00F0FF]` | Hover accent on guide titles |
| Dark background | `#000000` | `bg-black` | Admin, Guide viewer backgrounds |
| Panel dark | `#1a1a1a` | `bg-[#1a1a1a]` | Table headers, tab bars |
| Code block bg | `#1e1e1e` | `bg-[#1e1e1e]` | Code blocks, line number gutters |
| Table border | `#333333` | `border-[#333333]` | Table borders in guides |
| Even row bg | `#111111` | `bg-[#111111]` | Even table row striping |

---

## 4. Typography

| Element | Classes | Notes |
|---------|---------|-------|
| Page titles | `text-2xl font-bold text-white` | Used in ScenarioHub, GalleryHub |
| Section headers | `text-sm font-bold uppercase tracking-wider` | Used in admin, settings |
| Card titles | `text-base font-bold text-white` | Scenario cards, tool cards |
| Card descriptions | `text-xs text-slate-300 italic` | Below card titles |
| Body text | `text-sm text-[#e2e2e2]` | Guide content, descriptions |
| Labels | `text-xs font-semibold text-gray-400` | Form labels, table headers |
| Sidebar items | `text-sm font-bold` | Sidebar navigation labels |
| Sidebar subtitles | `text-[10px] font-black tracking-wide uppercase` | Scenario name under tab |

---

## 5. Component Variants

### Chronicle UI Components (`src/components/chronicle/UI.tsx`)

Custom dark-themed components used throughout the chronicle interface:

| Component | Purpose | Key Styling |
|-----------|---------|-------------|
| `Button` | Dark-themed button | Custom dark variant styling |
| `TextArea` | Dark-themed textarea | Custom styling with wrapper |

### shadcn/ui Components

Base components from shadcn used alongside Chronicle variants:

| Component | File | Usage |
|-----------|------|-------|
| `Dialog` | `src/components/ui/dialog.tsx` | Modals throughout app |
| `AlertDialog` | `src/components/ui/alert-dialog.tsx` | Confirmation dialogs |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | Context menus, message actions |
| `Tooltip` | `src/components/ui/tooltip.tsx` | Hover tooltips |
| `Badge` | `src/components/ui/badge.tsx` | Status badges |
| `Tabs` | `src/components/ui/tabs.tsx` | Tab navigation |
| `ScrollArea` | `src/components/ui/scroll-area.tsx` | Scrollable containers |
| `Popover` | `src/components/ui/popover.tsx` | Floating panels |
| `Select` | `src/components/ui/select.tsx` | Select dropdowns |

---

## 6. Icon Library

Primary icon library: `lucide-react` (v0.462.0)

Common icons used:

| Icon | Import | Usage |
|------|--------|-------|
| `Settings` | `lucide-react` | Admin tab |
| `UserCircle` | `lucide-react` | Account tab |
| `PanelLeftClose` / `PanelLeft` | `lucide-react` | Sidebar toggle |
| `Sparkles` | `lucide-react` | AI features, empty states |
| `RefreshCw` | `lucide-react` | Regenerate message |
| `Trash2` | `lucide-react` | Delete actions |
| `Pencil` | `lucide-react` | Edit actions |
| `Save` | `lucide-react` | Save actions |
| `Eye` | `lucide-react` | View mode toggle |
| `Search` | `lucide-react` | Search |

Custom SVG icons: Defined inline in `IconsList` object in `src/pages/Index.tsx` for sidebar navigation.

---

## 7. Spacing & Layout

| Pattern | Value | Usage |
|---------|-------|-------|
| Card gap | `gap-4 lg:gap-8` | Grid spacing |
| Section padding | `p-4 lg:p-10` | Page-level padding |
| Card radius | `rounded-[2rem]` | Large rounded cards |
| Standard radius | `rounded-xl` | Sidebar items, buttons |
| Small radius | `rounded-lg` | Code blocks, inputs |

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| `sm` | 640px | 2-column grids |
| `md` | 768px | 3-column grids |
| `lg` | 1024px | Sidebar collapse, larger padding |
| `xl` | 1280px | 4-column admin grid |
| `2xl` | 1536px | 5-column admin grid |

Sidebar auto-collapses at `max-width: 1024px`.

---

## 12. Known Issues & Gotchas

- **ACTIVE**: Chronicle UI components (`UI.tsx`) and shadcn components sometimes conflict in styling — ensure correct import. (2026-03-01)
- **ACTIVE**: Hardcoded hex values like `#4a5f7f` are not in the CSS custom properties — they should ideally be tokens. (2026-03-01)

---

## 13. Planned / Future Changes

- Consider migrating hardcoded hex values to CSS custom properties
- Document dark mode token overrides

> Last updated: 2026-03-01 — Initial creation.