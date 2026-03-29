

# Fix FinanceDashboardTool TypeScript Annotations

## Why this is happening
Lovable's `tsconfig.app.json` has `"strict": true` which includes `noImplicitAny`. ChatGPT Codex likely used a looser config. The code logic is correct — it just needs type annotations on ~60 function parameters.

## What I'll do

### 1. Add type annotations to all untyped parameters in FinanceDashboardTool.tsx
Every build error is one of these patterns:
- **Inline component props**: `({ children })` → `({ children }: { children: React.ReactNode })`
- **Simple params**: `(color)` → `(color: string)`, `(n)` → `(n: number)`, `(period)` → `(period: string)`
- **Destructured props with multiple fields**: add proper typed signatures
- **Map/filter callbacks**: `(t)` → `(t: SomeType)`, `(o)` → `(o: { value: string; label: string })`
- **Index signature issues** (lines 214, 215, 627): use typed lookup or cast to `Record<string, ...>`
- **Missing `right` prop** (lines 409, 536): add the required prop
- **Argument type mismatch** (lines 526-528): fix `getTierSubtitleById` call signatures

### 2. Fix the SubscriptionTab.tsx style prop (already done in last diff)

No logic changes. No UI changes. Just making the existing code compile under strict TypeScript.

## Scope
- Single file: `src/components/admin/finance/FinanceDashboardTool.tsx` (~60 annotation fixes)
- Zero behavioral changes — purely adding types to satisfy the compiler

