

# Findings Cards: Chevron Indicator + Domain-Based Grouping

## Changes in `src/pages/style-guide/ui-audit.tsx`

### 1. Add dropdown chevron to summary row
Add a `ChevronDown` icon (from lucide-react) in the bottom-right of the `<summary>` element. Use `group-open:rotate-180 transition-transform` so it rotates when expanded, making it obvious the card is expandable.

### 2. Change default grouping to domain-based containers
The current default `groupBy` state is `"severity"`. Change it to `"domain"` so findings are grouped into containers matching the overview page categories: UI/UX, Orphan Code, Cleanup, Functionality, Accessibility, Performance, etc.

Within each domain container, findings will still show their severity badge (critical, high, etc.) on each card — so severity info is not lost, it's just not the top-level grouping anymore.

### 3. Domain container styling
Each domain group header already renders as an uppercase label with a count pill. No styling changes needed there — the `recessedBlockClass` on individual cards and the group headers already match the overview page pattern.

### Summary of edits
| What | Where | Detail |
|------|-------|--------|
| Import `ChevronDown` | Top of file | Add to lucide-react import |
| Chevron in summary | Line ~440-447 | Add `<ChevronDown>` with rotate transition at bottom-right of summary |
| Default groupBy | State initializer | Change from `"severity"` to `"domain"` |

