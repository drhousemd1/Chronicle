

# Wire Up xAI Billing — Add Secrets and Test

## What you gave me
From your screenshot I can extract both required values:
- **XAI_MANAGEMENT_KEY**: `xai-token-t5tBqnV5I3yqum5uLwyNbPvqQEnir71WjwXI5Jz88TVpD4QrtBI9lRHCdGwPuIXigfL447YlJhV06lw5`
- **XAI_TEAM_ID**: `8473ae62-aa65-4739-b065-d826c18907fa` (extracted from the curl URL in the screenshot)

## Steps

### 1. Add both secrets
Use Lovable's secret management to store `XAI_MANAGEMENT_KEY` and `XAI_TEAM_ID` so the deployed `xai-billing-balance` edge function can access them.

### 2. Test the edge function
Call the `xai-billing-balance` endpoint to confirm it returns real billing data instead of the 503 error.

### 3. Verify the Finance Dashboard
Confirm the billing card in the admin panel now shows your actual credit balance and usage instead of "Billing unavailable."

No code changes needed — the edge function already handles these credentials. This is purely a secrets configuration + verification task.

