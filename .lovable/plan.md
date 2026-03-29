

# Fix "Billing Unavailable" in Finance Dashboard

## Problem
The `xai-billing-balance` edge function code exists in the repo but was never deployed. The dashboard tries to call it, gets a network error, and shows "Billing unavailable."

## Fix

### 1. Deploy the edge function
Deploy `xai-billing-balance` using Lovable's deployment tool. It will use your existing `XAI_API_KEY` secret (already configured) via the legacy API fallback path.

### 2. Verify it works
After deployment, hit Refresh on the billing card. If xAI's `/v1/billing/credits` endpoint exists and accepts your API key, you'll see real balance data.

### 3. If the legacy fallback doesn't work
xAI may not expose billing endpoints through a regular API key. In that case, you'd need to get `XAI_MANAGEMENT_KEY` and `XAI_TEAM_ID` from your xAI account's team/billing settings, and I'd add those as secrets. But we try the simple path first.

## What about the API Usage chart?
The `-$5.37` and the chart appear to be pulling from the `admin-ai-usage-summary` and `admin-ai-usage-timeseries` edge functions, which track internal usage logged by your app. Those are separate from billing and should already be working if deployed. I'll check their deployment status too and deploy any that are missing.

## Scope
- Deploy edge function(s) — no code changes needed
- Test the billing endpoint
- If legacy fallback fails, walk you through getting management credentials from xAI

