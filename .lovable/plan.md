

# Fix Capitalization: Domain Group Titles + Detail Field Labels

## Problem
1. Section group titles render raw enum values (`ui-ux`, `orphan-code`, `functionality`) — need proper Title Case display names.
2. All inline field labels inside the expanded detail view (`Severity:`, `Problem:`, `Fix Level:`, etc.) are rendered as regular bold text — they should use the app's micro-label standard: `text-[10px] font-black uppercase tracking-[0.14em]`.

## Changes — `src/pages/style-guide/ui-audit.tsx`

### 1. Add a domain display-name map
A simple lookup to convert enum slugs to proper labels:

| Enum Value | Display Label |
|---|---|
| `ui-ux` | UI/UX Design |
| `functionality` | Functionality |
| `orphan-code` | Orphan / Dead Code |
| `cleanup` | Cleanup |
| `accessibility` | Accessibility |
| `performance` | Performance |
| `security` | Security |
| `tests` | Tests |
| `build` | Build |
| `data-integrity` | Data Integrity |
| `documentation` | Documentation |

Use this map when rendering the `<Section title={...}>` for each domain group (~line 441).

### 2. Convert all inline field labels to uppercase micro-labels
Every `<span className="font-bold text-[#eaedf1]">Label:</span>` pattern (approx. 25+ instances across lines 459–532) gets changed to:

```
<span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eaedf1]">LABEL</span>
```

This applies to: Severity, Domain, Status, Confidence, Category, Page, Route, Component, Problem, Current State, Why It Matters, User Impact, Files, Evidence, Recommendation, Fix Level, Difficulty, Batchable, Design System, Expected Behavior, Actual Behavior, Repro Steps, Found By, Source, Created, Updated, Verified By, Contributors, Related.

### 3. Fix select/option capitalization
The `<select>` dropdowns for status and verification (~lines 537-538) render raw enum values. Apply a capitalize transform or Title Case formatter to the `<option>` labels.

