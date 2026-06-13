import { supabase } from "@/integrations/supabase/client";
import { loadSubscriptionTiersConfig } from "@/services/subscription-tier-config";
import type { DashboardUser } from "@/types/finance-dashboard";
import {
  DEFAULT_TIER_PRICES,
  USER_TIER_OVERRIDES_KEY,
  isObject,
  normalizeUserTierSlug,
  tierSlugFromRole,
  tierLabelBySlug,
  isAdminTierSlug,
} from "@/components/admin/finance/shared/finance-shared";

export type FinanceDashboardUsersResult = {
  users: DashboardUser[];
  tierPrices: Record<string, number>;
  tierOverrides: Record<string, string>;
};

export function resolveFinanceUserTier(rawTierSlug: unknown) {
  const tierSlug = normalizeUserTierSlug(rawTierSlug);
  const tierLabel = tierLabelBySlug[tierSlug as keyof typeof tierLabelBySlug] || "Alpha";
  const shouldHaveAdminUi = isAdminTierSlug(tierSlug);
  return { tierSlug, tierLabel, shouldHaveAdminUi };
}

export async function fetchFinanceDashboardUsers(): Promise<FinanceDashboardUsersResult> {
  const [profilesRes, rolesRes, storiesRes, overrideRes, tiersConfig] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("user_roles")
      .select("user_id, role"),
    supabase
      .from("stories")
      .select("user_id"),
    supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", USER_TIER_OVERRIDES_KEY)
      .maybeSingle(),
    loadSubscriptionTiersConfig(),
  ]);

  if (profilesRes.error) console.error("Failed to load profiles:", profilesRes.error);
  if (rolesRes.error) console.error("Failed to load user roles:", rolesRes.error);
  if (storiesRes.error) console.error("Failed to load stories:", storiesRes.error);
  if (overrideRes.error) console.error("Failed to load user tier overrides:", overrideRes.error);

  const tierPrices: Record<string, number> = { ...DEFAULT_TIER_PRICES };
  tiersConfig.forEach((tier) => {
    if (tier.id in tierPrices) tierPrices[tier.id] = tier.price;
  });

  const rawOverrides = isObject(overrideRes.data?.setting_value) ? overrideRes.data.setting_value as Record<string, unknown> : {};
  const tierOverrides: Record<string, string> = {};
  Object.entries(rawOverrides).forEach(([userId, tierSlug]) => {
    tierOverrides[userId] = normalizeUserTierSlug(tierSlug);
  });

  const rolesByUserId: Record<string, string> = {};
  const adminRoleUsers = new Set<string>();
  (rolesRes.data || []).forEach((row) => {
    if (row.role === "admin") adminRoleUsers.add(row.user_id);
    const existingRole = rolesByUserId[row.user_id];
    if (!existingRole || (existingRole !== "admin" && row.role === "admin")) {
      rolesByUserId[row.user_id] = row.role;
    }
  });

  const storyCountsByUserId: Record<string, number> = {};
  (storiesRes.data || []).forEach((story) => {
    storyCountsByUserId[story.user_id] = (storyCountsByUserId[story.user_id] || 0) + 1;
  });

  const users = (profilesRes.data || []).map((profile) => {
    const roleBasedTier = tierSlugFromRole(rolesByUserId[profile.id]);
    const tierSlug = tierOverrides[profile.id] || roleBasedTier;
    const tierLabel = tierLabelBySlug[tierSlug as keyof typeof tierLabelBySlug] || "Alpha";
    const fallbackName = `User ${profile.id.slice(0, 8)}`;

    return {
      id: profile.id,
      email: profile.display_name || profile.username || fallbackName,
      username: profile.username || profile.id.slice(0, 8),
      displayName: profile.display_name || null,
      tier: tierLabel,
      tierSlug,
      status: "active",
      strikes: 0,
      stories: storyCountsByUserId[profile.id] || 0,
      reportCount: 0,
      reported: false,
      joined: profile.created_at || new Date().toISOString(),
      canViewAdminUi: adminRoleUsers.has(profile.id),
    } satisfies DashboardUser;
  });

  return { users, tierPrices, tierOverrides };
}

export async function saveFinanceUserTierOverride({
  userId,
  tierSlug,
  nextOverrides,
  shouldHaveAdminUi,
}: {
  userId: string;
  tierSlug: string;
  nextOverrides: Record<string, string>;
  shouldHaveAdminUi: boolean;
}) {
  const { data: updatedRows, error: updateError } = await supabase
    .from("app_settings")
    .update({
      setting_value: nextOverrides,
      updated_at: new Date().toISOString(),
    })
    .eq("setting_key", USER_TIER_OVERRIDES_KEY)
    .select("id");

  if (updateError) throw updateError;

  if (!updatedRows || updatedRows.length === 0) {
    const { error: insertError } = await supabase
      .from("app_settings")
      .insert({
        setting_key: USER_TIER_OVERRIDES_KEY,
        setting_value: nextOverrides,
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;
  }

  const { error: roleError } = await supabase
    .rpc("set_admin_access", { _target_user_id: userId, _enabled: shouldHaveAdminUi });
  if (roleError) throw roleError;

  return { userId, tierSlug, shouldHaveAdminUi };
}
