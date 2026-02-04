

# Add Admin-Only "Share XAI Key" Toggle

## Overview

Create an admin-only setting that allows you (the app owner) to toggle whether the XAI API key is shared with all users. When enabled, the Grok models will show as "Shared Key" instead of "BYOK", and your wife (and any other users) can use Grok without needing their own API key.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin User (your account)                                      │
│  - Sees toggle: "Share XAI Key with all users"                  │
│  - Can enable/disable key sharing                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  app_settings table                                             │
│  - share_xai_key: boolean                                       │
│  - admin_user_id: UUID (hardcoded to your account)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  check-shared-keys edge function                                │
│  - Returns { xaiShared: true/false }                            │
│  - All users can read this                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ModelSettingsTab UI                                            │
│  - Admin sees toggle switch                                     │
│  - All users see "Shared Key" badge when enabled                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Changes

### 1. Create app_settings Table

Create a simple settings table to store admin preferences:

```sql
-- Create app_settings table for admin-controlled settings
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (for shared key status)
CREATE POLICY "Anyone authenticated can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only the admin can update settings (hardcoded to your user ID)
CREATE POLICY "Admin can update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = '98d690d7-ac5a-4b04-b15e-78b462f5eec6');

CREATE POLICY "Admin can insert settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = '98d690d7-ac5a-4b04-b15e-78b462f5eec6');

-- Insert default setting (XAI key sharing disabled by default)
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('shared_keys', '{"xai": false}');
```

### 2. Create Edge Function to Check Shared Key Status

**File:** `supabase/functions/check-shared-keys/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the shared_keys setting
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_keys')
      .single();

    if (error) {
      console.error('[check-shared-keys] Error:', error);
      return new Response(
        JSON.stringify({ xaiShared: false, xaiConfigured: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xaiShared = data?.setting_value?.xai === true;
    
    // Also check if XAI key is actually configured
    const xaiConfigured = !!Deno.env.get("XAI_API_KEY");

    return new Response(
      JSON.stringify({ 
        xaiShared: xaiShared && xaiConfigured,
        xaiConfigured 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[check-shared-keys] Error:', error);
    return new Response(
      JSON.stringify({ xaiShared: false, xaiConfigured: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 3. Update supabase/config.toml

Add the new edge function:

```toml
[functions.check-shared-keys]
verify_jwt = false
```

### 4. Create Service Function for Shared Key Status

**File:** `src/services/app-settings.ts` (new file)

```typescript
import { supabase } from "@/integrations/supabase/client";

const ADMIN_USER_ID = "98d690d7-ac5a-4b04-b15e-78b462f5eec6";

export interface SharedKeyStatus {
  xaiShared: boolean;
  xaiConfigured: boolean;
}

export async function checkSharedKeyStatus(): Promise<SharedKeyStatus> {
  try {
    const { data, error } = await supabase.functions.invoke('check-shared-keys');
    if (error) {
      console.error('Error checking shared key status:', error);
      return { xaiShared: false, xaiConfigured: false };
    }
    return data as SharedKeyStatus;
  } catch {
    return { xaiShared: false, xaiConfigured: false };
  }
}

export function isAdminUser(userId: string | undefined): boolean {
  return userId === ADMIN_USER_ID;
}

export async function updateSharedKeySetting(xaiShared: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_settings')
      .update({ 
        setting_value: { xai: xaiShared },
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'shared_keys');
    
    if (error) {
      console.error('Error updating shared key setting:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
```

### 5. Update ModelSettingsTab Component

**File:** `src/components/chronicle/ModelSettingsTab.tsx`

Add the following changes:

1. **Import new dependencies:**
```typescript
import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  checkSharedKeyStatus, 
  isAdminUser, 
  updateSharedKeySetting,
  SharedKeyStatus 
} from "@/services/app-settings";
import { Switch } from "@/components/ui/switch";
```

2. **Add state for shared key status and admin check:**
```typescript
const { user } = useAuth();
const [sharedKeyStatus, setSharedKeyStatus] = useState<SharedKeyStatus>({ 
  xaiShared: false, 
  xaiConfigured: false 
});
const [isUpdatingShare, setIsUpdatingShare] = useState(false);
const isAdmin = isAdminUser(user?.id);

// Fetch shared key status on mount
useEffect(() => {
  checkSharedKeyStatus().then(setSharedKeyStatus);
}, []);
```

3. **Add toggle handler for admin:**
```typescript
const handleToggleShare = async (checked: boolean) => {
  setIsUpdatingShare(true);
  const success = await updateSharedKeySetting(checked);
  if (success) {
    setSharedKeyStatus(prev => ({ ...prev, xaiShared: checked }));
  }
  setIsUpdatingShare(false);
};
```

4. **Update getProviderBadge function to show "Shared Key" when enabled:**
```typescript
const getProviderBadge = (provider: string) => {
  switch (provider) {
    case 'xAI':
      if (sharedKeyStatus.xaiShared) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Share2 className="w-2.5 h-2.5" />
            Shared
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
          <Key className="w-2.5 h-2.5" />
          BYOK
        </span>
      );
    // ... rest unchanged
  }
};
```

5. **Add admin toggle in the "Connection Setup" section:**
```typescript
{selectedModel?.requiresKey ? (
  <div className="space-y-4">
    {/* Admin-only toggle */}
    {isAdmin && (
      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200 mb-4">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm text-slate-700 font-medium">
              Share XAI key with all users
            </p>
            <p className="text-xs text-slate-500">
              When enabled, all users can use Grok models
            </p>
          </div>
        </div>
        <Switch 
          checked={sharedKeyStatus.xaiShared}
          onCheckedChange={handleToggleShare}
          disabled={isUpdatingShare || !sharedKeyStatus.xaiConfigured}
        />
      </div>
    )}
    
    {/* Status message for all users */}
    <div className="flex items-start gap-3">
      {sharedKeyStatus.xaiShared ? (
        <>
          <Share2 className="w-5 h-5 text-emerald-500 mt-0.5" />
          <div>
            <p className="text-sm text-slate-700 font-medium">
              A shared API key is available for all users.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              You can use Grok models without providing your own key.
            </p>
          </div>
        </>
      ) : (
        <>
          <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <p className="text-sm text-slate-700 font-medium">
              This model requires an API key from {selectedModel.provider}.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin 
                ? "Enable sharing above to let all users access Grok."
                : "Contact the app administrator for access."
              }
            </p>
          </div>
        </>
      )}
    </div>
  </div>
) : (
  // ... existing Lovable AI content
)}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | `app_settings` table with RLS policies |
| `supabase/functions/check-shared-keys/index.ts` | Create | Edge function to check shared key status |
| `supabase/config.toml` | Modify | Add new edge function config |
| `src/services/app-settings.ts` | Create | Service functions for settings |
| `src/components/chronicle/ModelSettingsTab.tsx` | Modify | Add admin toggle and shared status UI |

---

## Security Considerations

1. **Admin ID is hardcoded** - Only your specific user ID (`98d690d7-ac5a-4b04-b15e-78b462f5eec6`) can modify the setting
2. **RLS enforced** - Database policies prevent unauthorized updates
3. **API key never exposed** - Only the boolean "is it configured?" is returned to clients
4. **Server-side validation** - Admin check happens both client-side (for UI) and server-side (via RLS)

---

## Result

After implementation:
- You (admin) will see a purple toggle: "Share XAI key with all users"
- When enabled, all users see Grok models with a green "Shared" badge
- Your wife can use Grok models without any setup
- Regular users see a friendly message: "A shared API key is available"
- You can toggle sharing on/off at any time

