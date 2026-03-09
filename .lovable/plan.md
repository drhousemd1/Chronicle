

# Fix Form Inputs Section to Match V2 Card Standard

## Problem
The Form Inputs section (lines 2056-2388) uses the legacy `EntryCard` component, which has a completely different layout from the standardized V2 cards used in Colors, Typography, and Buttons:

- **V2 cards**: Preview strip top, clean labeled fields (Label: / Value), Page Specific/App Wide checkboxes, `CardEditOverlay`
- **EntryCard**: Header bar with name + page tag pill, raw HTML specs paragraph, preview box, monospace code block

The visual mismatch is obvious and makes the Form Inputs section look unfinished compared to the polished sections above it.

## Plan

### 1. Create `InputCardV2` component (~line 436, before EntryCard)

New standardized card matching the exact V2 pattern (same `labelStyle`, `valueStyle`, `monoStyle`, same card shell, same `CardEditOverlay` wrapper).

**Props:**
| Prop | Type | Purpose |
|------|------|---------|
| `inputName` | string | Human-readable name (e.g. "Dark Theme Text Input") |
| `preview` | ReactNode | Live preview of the input element |
| `previewBg` | string? | Preview strip background (default `#25272d` for dark, `#fff` for light) |
| `background` | string | e.g. `rgba(24,24,27,0.5)` or `bg-slate-50` |
| `border` | string | e.g. `1px solid #3f3f46` or `border-slate-200` |
| `borderRadius` | string | e.g. `rounded-lg (8px)` |
| `textColor` | string | e.g. `white` or `text-slate-900` |
| `placeholderColor` | string? | e.g. `text-zinc-500` |
| `focusStyle` | string? | e.g. `ring-2 ring-[#4a5f7f]` |
| `fontSize` | string | e.g. `14px / text-sm` |
| `padding` | string | e.g. `px-3 py-2` |
| `purpose` | string | What this input is for |
| `locations` | string | Where it's used |
| `pageSpecific` | boolean | Checkbox |
| `appWide` | boolean | Checkbox |
| `notes` | string? | Extra info (e.g. inconsistency warnings) |

**Card layout** (identical structure to ButtonCardV2):
1. Preview strip (input rendered on appropriate bg)
2. Labeled fields: Input Name, Background, Border, Border Radius, Text Color, Placeholder Color, Focus Style, Font Size, Padding, Purpose, Locations, Notes
3. Page Specific / App Wide checkboxes
4. Wrapped in `CardEditOverlay`

### 2. Rewrite all Form Inputs entries (lines 2058-2388)

Convert every `EntryCard` in the section to `InputCardV2`, extracting the structured data from the current `specs` HTML strings into proper typed props. Each entry's data is already documented in the existing cards -- just needs to be moved from the messy HTML `specs` string into clean labeled fields.

**Grid layout**: Use the same `display: grid, gridTemplateColumns: repeat(auto-fit, minmax(280px, 1fr)), gap: 14` pattern as the other V2 sections, grouped under `PageSubheading` blocks.

**Entries to convert** (13 total, grouped by page):
- Story Builder: Dark Theme Text Input
- Community Gallery: Gallery Search Input
- Chat Interface: Chat Input Textarea
- Account Page: Account Password Input
- Auth Page: Auth Input (Semi-transparent), Auth Login Input (duplicated -- merge into one)
- Character Library: Header Search (Dark Pill)
- Character Builder: HardcodedRow Textarea, Builder Form Row Input
- Chat Settings: LabeledToggle Component
- Image Generation: Light-Theme Generation Textarea
- Review Modal: Review Textarea (Frosted)
- Memories Modal: Memories Select/Textarea
- Scene Tag Editor: Scene Tag Editor Input
- Chronicle UI System: Chronicle Input, Chronicle TextArea, CharacterPicker Search

**Special components** (GuidanceStrengthSlider, TagInput, LabeledToggle): These are composite/custom controls, not simple inputs. They'll use `InputCardV2` with richer `purpose` and `notes` fields to capture their multi-part specs. The preview strip will show their visual representation as-is.

### 3. Keep InconsistencyNote blocks

The existing `InconsistencyNote` callouts (Memories slate-*, Chronicle UI light-theme friction, Auth slate-*) stay exactly where they are, placed after the relevant `InputCardV2` cards.

### 4. No changes to other sections or components

Only the Form Inputs section content changes. `EntryCard` component definition stays (it may be used in Badges/Tags or other sections). No changes to SwatchCardV2, TypoCardV2, ButtonCardV2, or any other section.

