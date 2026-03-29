import { supabase } from "@/integrations/supabase/client";

export interface XaiBillingSummary {
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

export async function fetchXaiBillingSummary(): Promise<XaiBillingSummary> {
  const { data, error } = await supabase.functions.invoke("xai-billing-balance");
  if (error) {
    throw new Error(error.message || "Failed to load xAI billing summary");
  }
  return data as XaiBillingSummary;
}
