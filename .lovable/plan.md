
# Fix: Enable Toggle for Shared XAI Key

## Problem Identified

The toggle is disabled because the edge function cannot read the `app_settings` table. Here's what's happening:

1. The edge function `check-shared-keys` uses the **anon key** to query the database
2. The RLS policy only allows **authenticated** users to read the table
3. Since the edge function operates without user authentication, it fails with "0 rows" error
4. This causes `xaiConfigured` to return `false`, which disables the toggle

## Solution

Add an RLS policy allowing the `anon` role to read `app_settings`. This is safe because:
- The settings table only contains non-sensitive boolean flags
- We're not exposing any API keys, just the status "is sharing enabled?"
- All users (logged in or not) should be able to check if shared keys are available

---

## Changes

### 1. Add Database Migration

Create a new RLS policy to allow anonymous access to read settings:

```sql
-- Allow anonymous users to read app settings (for edge functions)
CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  TO anon
  USING (true);
```

This single change will:
- Allow the edge function to successfully query `app_settings`
- Return the correct `xaiShared` and `xaiConfigured` values
- Enable the toggle switch for you (the admin)

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add RLS policy for `anon` role to SELECT from `app_settings` |

---

## After This Fix

1. The edge function will correctly read the `app_settings` table
2. `xaiConfigured` will return `true` (since XAI_API_KEY is set)
3. The toggle will be clickable for your admin account
4. You can enable sharing, and your wife will see "Shared" instead of "BYOK"
