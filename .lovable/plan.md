

# Add Period Toggle to Subscriber Snapshot

## Current state
All values are calculated as monthly (`users × $/mo`) but headers don't indicate this. No way to view weekly or yearly projections.

## Plan

### 1. Add period toggle buttons (Mo / Yr)
Add a simple two-button toggle in the header area (like other widgets use). Default to "Mo".

- **Monthly (Mo)**: Current behavior — `users × price`, `users × apiCost`
- **Yearly (Yr)**: Multiply monthly values by 12

Weekly doesn't make sense here since subscription pricing is monthly. Mo/Yr is the standard SaaS dashboard pattern.

### 2. Update column headers to show period
- "Income" → "Income (mo)" or "Income (yr)" based on toggle
- Same for "API Cost", "Stripe", "Net"
- "Tier", "Users" stay unchanged

### 3. Add a totals row at the bottom
Sum all tiers into a bold footer row showing total users, total income, total API cost, total Stripe fees, total net. This gives at-a-glance financial health without mental math.

## Files changed
- `src/components/admin/finance/FinanceDashboardTool.tsx` — add state for period, toggle buttons, multiply factor, update headers, add totals row

## What stays untouched
- All other widgets, tier config, billing card

