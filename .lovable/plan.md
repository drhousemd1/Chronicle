

# Fix Nonsensical Numbers in Finance Dashboard

## Problems found

1. **Subscriber Snapshot shows Stripe -$0.60 and Net -$1 for Admin tier**: The Stripe fee formula applies `(price × 2.9%) + $0.30` per user to ALL tiers including Admin. Two admin users at $0/mo still get charged `2 × $0.30 = $0.60` in phantom Stripe fees, making Net show -$1.

2. **API Cost shows $0 for Admin in Subscriber Snapshot**: The `apiCost` field in `PAID_TIER_SNAPSHOT_META` is a hardcoded per-user monthly estimate (`0.827` for Starter, etc.). Admin is set to `0`. This is a static planning number, not actual tracked usage.

3. **Net Income widget is 100% hardcoded**: `NET_INCOME_DATA` (lines 591-624) contains entirely fake numbers. Not connected to any real data source.

## Fixes

### 1. Skip Stripe fees for Admin tier in SubscriberSnapshot
In the `SubscriberSnapshot` component (line 425), change the Stripe fee calculation to return 0 when `t.price === 0`:
```
const stripeFee = t.price > 0 ? t.users * ((t.price * 0.029) + 0.30) : 0;
```
This fixes Admin showing -$0.60 Stripe and -$1 Net. Same fix needed in `FinancePage` ECON calculations.

### 2. Show real API cost for Admin tier in Subscriber Snapshot
Replace the static `apiCost: 0` for admin with actual usage data. Pull the total cost from the already-fetched timeseries data and divide by admin user count to get a per-user cost. This requires passing the live API cost data down to the snapshot component.

### 3. Wire Net Income to real data
Replace `NET_INCOME_DATA` with a component that calculates net from:
- Revenue: sum of (users × price) for paid tiers (currently $0 since no paying subscribers)
- API costs: from the live timeseries data (already fetched by `ApiUsageMini`)
- Stripe fees: $0 until there are paying subscribers
- Result: Net = Revenue - API costs - Stripe fees

Since you have no paying subscribers yet, Net Income will show negative values (just API costs), which is accurate.

## Files changed
- `src/components/admin/finance/FinanceDashboardTool.tsx` — fix Stripe fee formula for $0 tiers, wire Net Income to real usage data, pass live API cost to snapshot

## What stays untouched
- All tier config, pricing UI, forecasts, user management
- xAI billing card (already working)

