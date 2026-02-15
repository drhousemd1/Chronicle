import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[check-shared-keys] Checking shared key status...");

    // Get the shared_keys setting
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_keys')
      .single();

    if (error) {
      console.error('[check-shared-keys] Error fetching settings:', error);
      return new Response(
        JSON.stringify({ xaiShared: false, xaiConfigured: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xaiShared = data?.setting_value?.xai === true;
    
    // Also check if XAI key is actually configured
    const xaiConfigured = !!Deno.env.get("XAI_API_KEY");

    console.log(`[check-shared-keys] xaiShared=${xaiShared}, xaiConfigured=${xaiConfigured}`);

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
