import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

/* ── Types ── */

interface BillingPayload {
  source: "management_api" | "legacy_api";
  fetchedAt: string;
  prepaidCredits: {
    totalUsd: number;
    remainingUsd: number;
    usedUsd: number;
    usedThisMonthUsd: number;
  };
  nextInvoiceUsd: number;
}

interface FetchResult {
  ok: boolean;
  status: number;
  data: unknown;
  errorText: string | null;
}

/* ── xAI Management API response shapes ── */

interface ValField {
  val: string; // string of integer cents, e.g. "-6663"
}

interface PrepaidChange {
  amount: ValField;
  changeOrigin: string; // "PURCHASE" | "SPEND"
  createTs: string;
  topupStatus?: string; // "SUCCEEDED" | "FAILED_TO_CHARGE"
  spendBpKeyMonth?: number;
  spendBpKeyYear?: number;
}

interface PrepaidBalanceResponse {
  total: ValField; // negative = remaining balance in cents
  changes: PrepaidChange[];
}

interface InvoiceResponse {
  coreInvoice: {
    prepaidCredits: ValField;
    prepaidCreditsUsed: ValField; // negative = cents used from prepaid this billing cycle
    totalWithCorr: ValField;
    amountAfterVat: string;
  };
  billingCycle: { month: number; year: number };
}

/* ── Helpers ── */

function valToCents(v: ValField | undefined | null): number {
  if (!v || typeof v.val !== "string") return 0;
  const n = parseInt(v.val, 10);
  return Number.isFinite(n) ? n : 0;
}

function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

async function fetchJson(url: string, init: RequestInit): Promise<FetchResult> {
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }
    return { ok: response.ok, status: response.status, data, errorText: response.ok ? null : text || null };
  } catch (error) {
    return { ok: false, status: 0, data: null, errorText: String(error) };
  }
}

/* ── Management API parser ── */

function parseManagementApi(
  prepaidData: PrepaidBalanceResponse,
  invoiceData: InvoiceResponse | null,
): BillingPayload {
  // total.val is negative cents representing remaining balance
  // e.g. "-6663" means $66.63 remaining
  const remainingCents = Math.abs(valToCents(prepaidData.total));

  // Sum all successful purchases (negative amount = credit added)
  let totalPurchasedCents = 0;
  let totalSpentCents = 0;

  for (const change of prepaidData.changes ?? []) {
    const amount = valToCents(change.amount);

    if (change.changeOrigin === "PURCHASE") {
      // Skip failed purchases
      if (change.topupStatus === "FAILED_TO_CHARGE") continue;
      // Purchases have negative val = credits added
      totalPurchasedCents += Math.abs(amount);
    } else if (change.changeOrigin === "SPEND") {
      // Spend has positive val = credits consumed
      totalSpentCents += Math.abs(amount);
    }
  }

  const totalCents = Math.max(totalPurchasedCents, remainingCents + totalSpentCents);

  // Current month usage from invoice preview
  let usedThisMonthCents = 0;
  if (invoiceData?.coreInvoice) {
    // prepaidCreditsUsed.val is negative cents used from prepaid this cycle
    usedThisMonthCents = Math.abs(valToCents(invoiceData.coreInvoice.prepaidCreditsUsed));
  }

  // Next invoice amount (postpaid portion after prepaid credits applied)
  const nextInvoiceCents = invoiceData?.coreInvoice
    ? parseInt(invoiceData.coreInvoice.amountAfterVat || "0", 10)
    : 0;

  return {
    source: "management_api",
    fetchedAt: new Date().toISOString(),
    prepaidCredits: {
      totalUsd: centsToDollars(totalCents),
      remainingUsd: centsToDollars(remainingCents),
      usedUsd: centsToDollars(totalCents - remainingCents),
      usedThisMonthUsd: centsToDollars(usedThisMonthCents),
    },
    nextInvoiceUsd: centsToDollars(Math.abs(nextInvoiceCents)),
  };
}

/* ── API callers ── */

async function tryManagementApi(): Promise<BillingPayload | null> {
  const managementKey = Deno.env.get("XAI_MANAGEMENT_KEY");
  const teamId = Deno.env.get("XAI_TEAM_ID");
  if (!managementKey || !teamId) return null;

  const headers = { Authorization: `Bearer ${managementKey}`, "Content-Type": "application/json" };
  const base = `https://management-api.x.ai/v1/billing/teams/${teamId}`;

  const [prepaidRes, invoiceRes] = await Promise.all([
    fetchJson(`${base}/prepaid/balance`, { method: "GET", headers }),
    fetchJson(`${base}/postpaid/invoice/preview`, { method: "GET", headers }),
  ]);

  if (!prepaidRes.ok || !prepaidRes.data) {
    console.error("[xai-billing-balance] Management prepaid call failed:", prepaidRes.status, prepaidRes.errorText);
    return null;
  }

  const invoiceData = invoiceRes.ok ? (invoiceRes.data as InvoiceResponse) : null;
  return parseManagementApi(prepaidRes.data as PrepaidBalanceResponse, invoiceData);
}

async function tryLegacyApi(): Promise<BillingPayload | null> {
  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) return null;

  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const [creditsRes, usageRes] = await Promise.all([
    fetchJson("https://api.x.ai/v1/billing/credits", { method: "GET", headers }),
    fetchJson("https://api.x.ai/v1/billing/usage", { method: "GET", headers }),
  ]);

  if (!creditsRes.ok || !creditsRes.data) {
    console.error("[xai-billing-balance] Legacy credits call failed:", creditsRes.status, creditsRes.errorText);
    return null;
  }

  // Legacy API shape is unknown / undocumented — return zeros with a note
  return {
    source: "legacy_api",
    fetchedAt: new Date().toISOString(),
    prepaidCredits: { totalUsd: 0, remainingUsd: 0, usedUsd: 0, usedThisMonthUsd: 0 },
    nextInvoiceUsd: 0,
  };
}

/* ── Handler ── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const accessToken = authHeader.replace("Bearer ", "");

    const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userResult.user.id,
      _role: "admin",
    });
    if (isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const billing = (await tryManagementApi()) ?? (await tryLegacyApi());
    if (!billing) {
      return new Response(
        JSON.stringify({
          error: "Billing source is not configured. Set XAI_MANAGEMENT_KEY + XAI_TEAM_ID (preferred), or XAI_API_KEY legacy access.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(billing), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[xai-billing-balance] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
