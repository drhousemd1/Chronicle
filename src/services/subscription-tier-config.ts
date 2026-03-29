import { supabase } from "@/integrations/supabase/client";

export const SUBSCRIPTION_TIERS_SETTING_KEY = "subscription_tiers_v1";

export interface TierFeatureFlags {
  memory: boolean;
  nsfw: boolean;
  aiSS: boolean;
  browse: boolean;
}

export type TierFeatureKey = keyof TierFeatureFlags;

export interface SubscriptionTierConfig {
  id: string;
  name: string;
  price: number;
  msgLimit: number;
  imgLimit: number;
  accent: string;
  badge: string | null;
  features: TierFeatureFlags;
}

interface TierFeatureRow {
  key: "msgLimit" | "imgLimit" | TierFeatureKey;
  label: string;
  hint: string;
  type: "limit" | "toggle";
}

interface TierFeatureSection {
  label: string;
  icon: string;
  rows: TierFeatureRow[];
}

export const TIER_FEATURE_SECTIONS: TierFeatureSection[] = [
  {
    label: "Core Chat",
    icon: "💬",
    rows: [
      { key: "msgLimit", label: "Monthly messages", hint: "Each message = one AI response", type: "limit" },
      { key: "memory", label: "Long-term memory", hint: "Day memories compressed & retained across sessions", type: "toggle" },
      { key: "nsfw", label: "NSFW content", hint: "Adult roleplay content unlocked", type: "toggle" },
    ],
  },
  {
    label: "Images",
    icon: "🖼️",
    rows: [
      { key: "imgLimit", label: "In-chat scene images", hint: "Generate images during roleplay ($0.02 each)", type: "limit" },
    ],
  },
  {
    label: "Character Builder AI",
    icon: "✨",
    rows: [
      { key: "aiSS", label: "AI-assisted Generation", hint: "AI-assisted character and scenario generation tools", type: "toggle" },
    ],
  },
  {
    label: "Community",
    icon: "🌐",
    rows: [
      { key: "browse", label: "Browse community gallery", hint: "View published stories and characters", type: "toggle" },
    ],
  },
];

export const DEFAULT_SUBSCRIPTION_TIERS: SubscriptionTierConfig[] = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    msgLimit: 20,
    imgLimit: 0,
    accent: "#6b7280",
    badge: null,
    features: { memory: false, nsfw: true, aiSS: false, browse: true },
  },
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    msgLimit: 300,
    imgLimit: 10,
    accent: "#3b82f6",
    badge: null,
    features: { memory: true, nsfw: true, aiSS: false, browse: true },
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    msgLimit: 900,
    imgLimit: 30,
    accent: "#8b5cf6",
    badge: "Most Popular",
    features: { memory: true, nsfw: true, aiSS: true, browse: true },
  },
  {
    id: "elite",
    name: "Elite",
    price: 39.99,
    msgLimit: 2200,
    imgLimit: 100,
    accent: "#f59e0b",
    badge: "Best Value",
    features: { memory: true, nsfw: true, aiSS: true, browse: true },
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeFeatures(value: unknown, fallback: TierFeatureFlags): TierFeatureFlags {
  if (!isRecord(value)) return { ...fallback };
  return {
    memory: typeof value.memory === "boolean" ? value.memory : fallback.memory,
    nsfw: typeof value.nsfw === "boolean" ? value.nsfw : fallback.nsfw,
    aiSS: typeof value.aiSS === "boolean" ? value.aiSS : fallback.aiSS,
    browse: typeof value.browse === "boolean" ? value.browse : fallback.browse,
  };
}

function normalizeTier(value: unknown, fallback: SubscriptionTierConfig): SubscriptionTierConfig {
  if (!isRecord(value)) return { ...fallback };
  return {
    id: asString(value.id, fallback.id),
    name: asString(value.name, fallback.name),
    price: Math.max(0, asNumber(value.price, fallback.price)),
    msgLimit: Math.max(0, Math.floor(asNumber(value.msgLimit, fallback.msgLimit))),
    imgLimit: Math.max(0, Math.floor(asNumber(value.imgLimit, fallback.imgLimit))),
    accent: asString(value.accent, fallback.accent),
    badge: typeof value.badge === "string" && value.badge.trim() ? value.badge : null,
    features: normalizeFeatures(value.features, fallback.features),
  };
}

export function normalizeSubscriptionTiers(value: unknown): SubscriptionTierConfig[] {
  if (!Array.isArray(value)) return DEFAULT_SUBSCRIPTION_TIERS.map((tier) => ({ ...tier, features: { ...tier.features } }));

  return DEFAULT_SUBSCRIPTION_TIERS.map((fallback) => {
    const match = value.find((item) => isRecord(item) && item.id === fallback.id);
    return normalizeTier(match, fallback);
  });
}

export function getTierSubtitleById(tierId: string): string {
  if (tierId === "free") return "Try before you subscribe";
  if (tierId === "starter") return "Get started with AI roleplay";
  if (tierId === "premium") return "Deep story arcs and more";
  return "Full access, maximum limits";
}

export function getFeatureLabel(key: TierFeatureKey): string {
  for (const section of TIER_FEATURE_SECTIONS) {
    const row = section.rows.find((entry) => entry.key === key);
    if (row) return row.label;
  }
  return key;
}

export async function loadSubscriptionTiersConfig(): Promise<SubscriptionTierConfig[]> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("setting_value")
    .eq("setting_key", SUBSCRIPTION_TIERS_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subscription tiers config:", error);
    return DEFAULT_SUBSCRIPTION_TIERS.map((tier) => ({ ...tier, features: { ...tier.features } }));
  }

  return normalizeSubscriptionTiers(data?.setting_value);
}

export async function saveSubscriptionTiersConfig(
  tiers: SubscriptionTierConfig[],
  updatedBy?: string | null
): Promise<void> {
  const normalized = normalizeSubscriptionTiers(tiers);
  const updatedAt = new Date().toISOString();

  const { data: updatedRows, error: updateError } = await supabase
    .from("app_settings")
    .update({
      setting_value: normalized as unknown as import("@/integrations/supabase/types").Json,
      updated_at: updatedAt,
      updated_by: updatedBy ?? null,
    })
    .eq("setting_key", SUBSCRIPTION_TIERS_SETTING_KEY)
    .select("id");

  if (updateError) {
    throw updateError;
  }

  if (!updatedRows || updatedRows.length === 0) {
    const { error: insertError } = await supabase
      .from("app_settings")
      .insert({
        setting_key: SUBSCRIPTION_TIERS_SETTING_KEY,
        setting_value: normalized as unknown as import("@/integrations/supabase/types").Json,
        updated_at: updatedAt,
        updated_by: updatedBy ?? null,
      });

    if (insertError) {
      throw insertError;
    }
  }
}

export function subscribeToSubscriptionTiersConfig(
  onChange: (tiers: SubscriptionTierConfig[]) => void
): () => void {
  const channel = supabase
    .channel(`subscription-tiers-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_settings",
        filter: `setting_key=eq.${SUBSCRIPTION_TIERS_SETTING_KEY}`,
      },
      (payload) => {
        const nextRow = payload.new as { setting_value?: unknown } | null;
        onChange(normalizeSubscriptionTiers(nextRow?.setting_value));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
