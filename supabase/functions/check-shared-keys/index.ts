import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if XAI_API_KEY exists in environment
    const xaiKey = Deno.env.get("XAI_API_KEY");
    const xaiConfigured = !!xaiKey;

    // Check shared_keys setting from app_settings
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_keys')
      .single();

    const xaiShared = data?.setting_value?.xai === true;

    // Perform a real health check against xAI API if key is configured
    let providerReachable = false;
    if (xaiConfigured) {
      try {
        const probe = await fetch("https://api.x.ai/v1/models", {
          method: "GET",
          headers: { "Authorization": `Bearer ${xaiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        providerReachable = probe.ok;
        if (!probe.ok) {
          console.error(`[check-shared-keys] xAI probe returned ${probe.status}`);
        }
      } catch (e) {
        console.error('[check-shared-keys] xAI probe failed:', e);
        providerReachable = false;
      }
    }

    return new Response(
      JSON.stringify({
        xaiConfigured,
        xaiShared: xaiShared && xaiConfigured,
        providerReachable,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[check-shared-keys] Error:', error);
    return new Response(
      JSON.stringify({ xaiConfigured: false, xaiShared: false, providerReachable: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
