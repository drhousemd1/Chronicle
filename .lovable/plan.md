

# Phase 7: Modals and Icons Sections

Per the document, Phase 7 is the final build phase. It requires extracting specs from source code and building two new sections in the Style Guide using the same entry card format as existing sections.

I'll split this into two sub-phases — **7A: Modals** then **7B: Icons** — so nothing gets missed.

---

## Phase 7A: Modals Section

### Source Code Audit — Inconsistencies Found

I audited all 17 modal/dialog components. Here is what I found:

**Container backgrounds — 6 different values:**
| Value | Used In |
|-------|---------|
| `bg-zinc-900` | CharacterCreation, EnhanceMode, CustomContentType, DraftsModal, FolderEdit |
| `bg-[#2a2a2f]` | ShareStory, CharacterEditModal |
| `bg-[#121214]` | ReviewModal |
| `bg-slate-900` | MemoriesModal |
| `bg-[hsl(var(--ui-surface))]` | AIPromptModal |
| `bg-transparent` (wraps Card) | BackgroundPickerModal |
| No explicit bg (uses Dialog default) | ChangeNameModal, AvatarGeneration, SceneImageGeneration, CoverImageGeneration, ImageLibraryPicker |

**Borders — 4+ variations:**
- `border-white/10` (most common)
- `border-[#4a5f7f]` (FolderEdit)
- `border-slate-700` (MemoriesModal)
- `border-[hsl(var(--ui-border))]` (AIPromptModal)
- No explicit border (ChangeNameModal, generation modals)

**Header patterns — at least 4 styles:**
- Slate blue banner header (`bg-[#4a5f7f]`, AIPromptModal)
- Simple `DialogHeader` with white title (DraftsModal, ShareStory, MemoriesModal)
- Custom div header with border-b (ReviewModal, SidebarTheme, ChatSettings)
- No DialogHeader, raw `<h3>` (CharacterCreation, EnhanceMode, CustomContentType)

**Footer button patterns — heavily inconsistent:**
- Shadow Surface standard (`h-10 px-6 text-[10px] uppercase`) — DeleteConfirmDialog, FolderEdit
- `h-11` with `text-sm font-semibold` — ReviewModal
- Iridescent layered button — AIPromptModal
- `<Button>` component with variant overrides — ShareStory, generation modals
- Raw `px-4 py-2 text-sm` — SceneTagEditorModal
- `h-8 px-3 text-[10px]` (compact) — DraftsModal inline buttons

**Close button visibility:**
- `[&>button]:hidden` — CharacterCreation, EnhanceMode, CustomContentType, SidebarTheme, BackgroundPicker
- Default Radix close button — most others
- Custom `<X>` icon button — ReviewModal

**SceneTagEditorModal is a complete outlier** — uses raw `fixed inset-0` div instead of Dialog component, different border color (`border-[#4a5f7f]`), and completely non-standard footer buttons.

### What to Build

4 entry cards in the Modals section, documenting the **canonical** pattern plus noting inconsistencies:

1. **Modal Backdrop** — Standard: `bg-black/80` (Radix default). Inconsistency note: ReviewModal uses `bg-black/90 backdrop-blur-sm`.
2. **Modal Container** — Canonical: `bg-zinc-900 border-white/10 rounded-lg`. Shadow: `0 10px 30px rgba(0,0,0,0.5)`. Inconsistency notes listing the 6 different bg values found.
3. **Modal Header** — Two canonical patterns: (a) Simple `DialogHeader` with `text-lg font-bold text-white`, (b) Slate blue banner `bg-[#4a5f7f]` for AI/generation modals. Inconsistency notes.
4. **Modal Footer / Button Row** — Canonical: Shadow Surface standard (`h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider`). Inconsistency notes listing the 5+ button height/style variations.

Each card includes a dark preview area showing the canonical pattern, a code block with the CSS, and a flagged inconsistency note block (styled distinctly, e.g., amber/warning background) listing every file that deviates and how.

---

## Phase 7B: Icons Section

### Source Code Audit — Patterns Found

**Sizes used (Lucide `className`):**
| Size | Pixel | Usage |
|------|-------|-------|
| `w-3 h-3` | 12px | Inline indicators, chevrons, small action icons inside compact buttons |
| `w-3.5 h-3.5` | 14px | Rare, AIPromptModal sparkle icon |
| `w-4 h-4` | 16px | Most common — form icons, button icons, dropdown menu items, action buttons |
| `w-5 h-5` | 20px | Modal title icons, panel header icons, card action icons |
| `w-6 h-6` | 24px | Loading spinners, ShareStory title icon, close buttons on large modals |
| `w-8 h-8` | 32px | Empty state placeholder icons (BackgroundPicker) |

**Icon colors — common tokens:**
- Default: `text-white`, `text-zinc-400`, `text-slate-400`, `text-zinc-500`
- Accent: `text-blue-400`, `text-purple-400`, `text-cyan-200`
- Destructive: `text-red-400`
- Hover: `hover:text-white`, `hover:text-red-400`
- Disabled/muted: `text-white/40`, `text-white/20`

**Icon containers:**
- Panel header gear: `w-5 h-5` icon inside header bar, no container
- Selection checkmarks: `w-5 h-5 bg-blue-500 rounded-full` container with `w-3 h-3` check SVG
- CharacterCreation option icons: `w-10 h-10 rounded-xl bg-blue-500/20` container with `w-5 h-5` icon
- Gallery card action buttons: `h-8 w-8 rounded-xl` container

### What to Build

3 entry cards:

1. **Icon Size Scale** — Table of the 6 sizes with canonical usage contexts. Note: `w-4 h-4` is default for inline/button icons, `w-5 h-5` for modal/panel title icons.
2. **Icon Colors** — Default, accent, destructive, hover, and disabled tokens. Note inconsistencies (e.g., some modals use `text-slate-400` while others use `text-zinc-400` for the same semantic purpose).
3. **Icon Containers** — The 4 container patterns with rendered previews and specs.

---

## Implementation

**File:** `src/components/admin/styleguide/StyleGuideTool.tsx`

Replace the two placeholder `<div>` blocks (lines 630-643) with the fully built sections using the same `EntryCard` and `PageSubheading` components already in the file.

Add a new visual element: **Inconsistency Note** — a small block inside entry cards with an amber-tinted background (`bg-amber-50 border-amber-200`) listing deviating files and values. This is the "flagging" mechanism the document requested.

**File:** `public/styleguide-mockup-reference.html` — Update to include the Modals and Icons sections for future reference (per document instructions).

