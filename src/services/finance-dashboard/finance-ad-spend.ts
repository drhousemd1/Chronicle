import { supabase } from "@/integrations/supabase/client";

export type FinanceAdSpendChannel = {
  id?: string;
  type?: string;
  name: string;
  desc?: string;
  url?: string;
  status: string;
  spent: number;
  cost: number;
  costCadence: string;
  startDate?: string;
  cpa?: null;
};

export function mapAdSpendRowToChannel(row: any): FinanceAdSpendChannel {
  return {
    id: row.id,
    type: Number(row.recurring_cost || 0) > 0 ? "paid" : "organic",
    name: row.name || "Untitled",
    desc: row.description || "",
    url: row.url || "",
    status: row.status === "cancelled" ? "cancelled" : "active",
    spent: Number(row.spent_override || 0),
    cost: Number(row.recurring_cost || 0),
    costCadence: row.cost_cadence === "yr" ? "yr" : "mo",
    startDate: row.start_date || "",
    cpa: null,
  };
}

export async function fetchAdSpendChannels(fallbackChannels: FinanceAdSpendChannel[]) {
  const { data, error } = await supabase
    .from("ad_spend")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) return fallbackChannels;
  return data.map(mapAdSpendRowToChannel);
}

export async function saveAdSpendChannel({ editTarget, entry }: { editTarget: string | null; entry: FinanceAdSpendChannel }) {
  if (editTarget) {
    const { error } = await supabase
      .from("ad_spend")
      .update({
        platform: entry.type || "custom",
        campaign_name: entry.name,
        amount: entry.cost,
        period_start: entry.startDate || new Date().toISOString().slice(0, 10),
        period_end: entry.startDate || new Date().toISOString().slice(0, 10),
        name: entry.name,
        description: entry.desc,
        url: entry.url,
        status: entry.status === "cancelled" ? "cancelled" : "active",
        recurring_cost: entry.cost,
        cost_cadence: entry.costCadence === "yr" ? "yr" : "mo",
        start_date: entry.startDate || null,
        spent_override: entry.spent || null,
      })
      .eq("id", editTarget);

    if (error) throw error;
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error("Authentication required");

  const { error } = await supabase
    .from("ad_spend")
    .insert({
      created_by: authData.user.id,
      platform: entry.type || "custom",
      campaign_name: entry.name,
      amount: entry.cost,
      period_start: entry.startDate || new Date().toISOString().slice(0, 10),
      period_end: entry.startDate || new Date().toISOString().slice(0, 10),
      name: entry.name,
      description: entry.desc,
      url: entry.url,
      status: entry.status === "cancelled" ? "cancelled" : "active",
      recurring_cost: entry.cost,
      cost_cadence: entry.costCadence === "yr" ? "yr" : "mo",
      start_date: entry.startDate || null,
      spent_override: entry.spent || null,
    });

  if (error) throw error;
}

export async function deleteAdSpendChannel(editTarget: string) {
  const { error } = await supabase
    .from("ad_spend")
    .delete()
    .eq("id", editTarget);

  if (error) throw error;
}
