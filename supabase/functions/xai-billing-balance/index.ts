import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toUsdCents(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    if (Math.abs(value) >= 1000 && Number.isInteger(value)) return Math.round(value);
    return Math.round(value * 100);
  }

  if (typeof value === "string") {
    const parsed = parseNumeric(value);
    if (parsed == null) return null;
    if (Math.abs(parsed) >= 1000 && Number.isInteger(parsed)) return Math.round(parsed);
    return Math.round(parsed * 100);
  }

  if (isObject(value)) {
    if ("usdCents" in value) {
      const parsed = parseNumeric(value.usdCents);
      if (parsed != null) return Math.round(parsed);
    }
    if ("cents" in value) {
      const parsed = parseNumeric(value.cents);
      if (parsed != null) return Math.round(parsed);
    }
    if ("value" in value) {
      const parsed = parseNumeric(value.value);
      if (parsed != null) return Math.round(parsed);
    }
    if ("amountCents" in value) {
      const parsed = parseNumeric(value.amountCents);
      if (parsed != null) return Math.round(parsed);
    }
    if ("units" in value || "nanos" in value) {
      const units = parseNumeric(value.units) ?? 0;
      const nanos = parseNumeric(value.nanos) ?? 0;
      return Math.round(units * 100 + nanos / 10_000_000);
    }
    if ("amount" in value) {
      const parsed = parseNumeric(value.amount);
      if (parsed != null) return Math.round(parsed * 100);
    }
  }

  return null;
}

function findFirstByKeyPattern(
  input: unknown,
  keyPatterns: RegExp[],
  visited = new Set<unknown>()
): number | null {
  if (input == null || visited.has(input)) return null;
  visited.add(input);

  const direct = toUsdCents(input);
  if (direct != null && typeof input !== "object") return direct;

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findFirstByKeyPattern(item, keyPatterns, visited);
      if (found != null) return found;
    }
    return null;
  }

  if (isObject(input)) {
    for (const [key, value] of Object.entries(input)) {
      if (keyPatterns.some((pattern) => pattern.test(key))) {
        const candidate = toUsdCents(value);
        if (candidate != null) return candidate;
      }
    }
    for (const value of Object.values(input)) {
      const found = findFirstByKeyPattern(value, keyPatterns, visited);
      if (found != null) return found;
    }
  }

  return null;
}

function safeDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function extractTimestamp(change: unknown): Date | null {
  if (!isObject(change)) return null;
  const candidates = [
    change.createdAt,
    change.created_at,
    change.timestamp,
    change.time,
    change.at,
    change.date,
  ];
  for (const candidate of candidates) {
    const parsed = safeDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function extractChangeAmountCents(change: unknown): number {
  if (!isObject(change)) return 0;
  const prioritizedKeys = ["amount", "delta", "change", "value", "usdCents", "cents"];

  for (const key of prioritizedKeys) {
    if (key in change) {
      const parsed = toUsdCents(change[key]);
      if (parsed != null) return parsed;
    }
  }

  const found = findFirstByKeyPattern(change, [/amount/i, /delta/i, /change/i, /value/i, /cents/i]);
  return found ?? 0;
}

function summarizePrepaid(prepaidData: unknown): {
  totalCents: number;
  remainingCents: number;
  usedCents: number;
  usedThisMonthCents: number;
} {
  const remainingCents =
    findFirstByKeyPattern(prepaidData, [/^total$/i, /remaining/i, /balance/i]) ?? 0;

  const changes = isObject(prepaidData) && Array.isArray(prepaidData.changes)
    ? prepaidData.changes
    : [];

  let positiveCredits = 0;
  let negativeUsageAll = 0;
  let negativeUsageThisMonth = 0;

  const now = new Date();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();

  for (const change of changes) {
    const amount = extractChangeAmountCents(change);
    if (amount > 0) {
      positiveCredits += amount;
      continue;
    }

    if (amount < 0) {
      const absAmount = Math.abs(amount);
      negativeUsageAll += absAmount;
      const ts = extractTimestamp(change);
      if (ts && ts.getUTCMonth() === month && ts.getUTCFullYear() === year) {
        negativeUsageThisMonth += absAmount;
      }
    }
  }

  const inferredTotal = Math.max(remainingCents + negativeUsageAll, positiveCredits, remainingCents);
  const usedCents = Math.max(0, inferredTotal - remainingCents);

  return {
    totalCents: inferredTotal,
    remainingCents,
    usedCents,
    usedThisMonthCents: Math.max(0, negativeUsageThisMonth),
  };
}

function centsToUsd(value: number): number {
  return Math.round(value) / 100;
}

async function fetchJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: JsonValue | null; errorText: string | null }> {
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    let data: JsonValue | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as JsonValue;
      } catch {
        data = null;
      }
    }
    return { ok: response.ok, status: response.status, data, errorText: response.ok ? null : text || null };
  } catch (error) {
    return { ok: false, status: 0, data: null, errorText: String(error) };
  }
}

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

  console.log("[xai-billing-balance] RAW prepaid response:", JSON.stringify(prepaidRes.data));
  console.log("[xai-billing-balance] RAW invoice response:", JSON.stringify(invoiceRes.data));

  if (!prepaidRes.ok || !prepaidRes.data) {
    console.error("[xai-billing-balance] Management prepaid call failed:", prepaidRes.status, prepaidRes.errorText);
    return null;
  }

  const prepaidSummary = summarizePrepaid(prepaidRes.data);
  const nextInvoiceCents = invoiceRes.ok
    ? findFirstByKeyPattern(invoiceRes.data, [/invoice/i, /amount/i, /due/i, /total/i]) ?? 0
    : 0;

  return {
    source: "management_api",
    fetchedAt: new Date().toISOString(),
    prepaidCredits: {
      totalUsd: centsToUsd(prepaidSummary.totalCents),
      remainingUsd: centsToUsd(prepaidSummary.remainingCents),
      usedUsd: centsToUsd(prepaidSummary.usedCents),
      usedThisMonthUsd: centsToUsd(prepaidSummary.usedThisMonthCents),
    },
    nextInvoiceUsd: centsToUsd(nextInvoiceCents),
  };
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

  const totalCents = findFirstByKeyPattern(creditsRes.data, [/total/i, /initial/i, /credits/i]) ?? 0;
  const remainingCents = findFirstByKeyPattern(creditsRes.data, [/remaining/i, /balance/i]) ?? totalCents;
  const usedCents = Math.max(0, totalCents - remainingCents);
  const usedThisMonthCents =
    (usageRes.ok
      ? findFirstByKeyPattern(usageRes.data, [/month/i, /current/i, /usage/i, /spent/i])
      : null) ?? usedCents;

  return {
    source: "legacy_api",
    fetchedAt: new Date().toISOString(),
    prepaidCredits: {
      totalUsd: centsToUsd(totalCents),
      remainingUsd: centsToUsd(remainingCents),
      usedUsd: centsToUsd(usedCents),
      usedThisMonthUsd: centsToUsd(usedThisMonthCents),
    },
    nextInvoiceUsd: 0,
  };
}

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
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
