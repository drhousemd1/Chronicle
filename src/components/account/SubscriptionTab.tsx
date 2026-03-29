import React, { useEffect, useMemo, useState } from "react";
import { Check, Crown, Gem, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_SUBSCRIPTION_TIERS,
  TIER_FEATURE_SECTIONS,
  getFeatureLabel,
  getTierSubtitleById,
  loadSubscriptionTiersConfig,
  subscribeToSubscriptionTiersConfig,
  type SubscriptionTierConfig,
  type TierFeatureKey,
} from "@/services/subscription-tier-config";

const iconByTierId: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  free: Zap,
  starter: Sparkles,
  premium: Crown,
  elite: Gem,
};

function normalizeCurrentTierId(rawTier: unknown): string {
  if (typeof rawTier !== "string" || !rawTier.trim()) return "free";
  const normalized = rawTier.trim().toLowerCase();
  if (normalized === "pro") return "starter";
  if (normalized === "free_trial") return "free";
  return normalized;
}

function formatTierPrice(price: number): string {
  if (price === 0) return "$0";
  return `$${price % 1 === 0 ? price : price.toFixed(2)}`;
}

export const SubscriptionTab: React.FC = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTierConfig[]>(DEFAULT_SUBSCRIPTION_TIERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTiers = async () => {
      const liveTiers = await loadSubscriptionTiersConfig();
      if (isMounted) {
        setTiers(liveTiers);
        setIsLoading(false);
      }
    };

    void loadTiers();

    const unsubscribe = subscribeToSubscriptionTiersConfig((nextTiers) => {
      setTiers(nextTiers);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const currentTierId = useMemo(
    () => normalizeCurrentTierId(user?.user_metadata?.subscription_tier),
    [user?.user_metadata?.subscription_tier]
  );

  const allFeatureKeys = useMemo(
    () =>
      TIER_FEATURE_SECTIONS.flatMap((section) => section.rows)
        .filter((row) => row.type === "toggle")
        .map((row) => row.key as TierFeatureKey),
    []
  );

  return (
    <div className="mx-auto w-full max-w-[1480px]">
      <div className="mb-10 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Choose Your Plan</h2>
        <p className="text-sm text-[rgba(248,250,252,0.7)]">
          Subscription tiers update live from the Admin Finance Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-4">
        {tiers.map((tier, index) => {
          const Icon = iconByTierId[tier.id] ?? Sparkles;
          const prevTier = index > 0 ? tiers[index - 1] : null;

          const myFeatures = allFeatureKeys.filter((key) => tier.features[key]);
          const inheritedKeys = new Set(prevTier ? allFeatureKeys.filter((key) => prevTier.features[key]) : []);
          const newFeatures = myFeatures.filter((key) => !inheritedKeys.has(key));
          const inheritedFeatures = myFeatures.filter((key) => inheritedKeys.has(key));

          const msgIsNew = !prevTier || tier.msgLimit !== prevTier.msgLimit;
          const imgIsNew = !prevTier || tier.imgLimit !== prevTier.imgLimit;

          const isCurrent = tier.id === currentTierId;
          const isComingSoon = !!tier.badge && tier.badge.toLowerCase().includes("coming soon");
          const isActionDisabled = isCurrent || isComingSoon;

          return (
            <div
              key={tier.id}
              className="relative flex flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#1b1c22]/95 shadow-[0_16px_38px_-10px_rgba(0,0,0,0.6)]"
            >
              <div className="h-1 w-full" style={{ background: tier.accent }} />

              {tier.badge && (
                <div className="absolute right-4 top-4">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white"
                    style={{ background: tier.accent }}
                  >
                    {tier.badge}
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute left-4 top-4">
                  <span className="rounded-full border border-emerald-500/35 bg-emerald-500/20 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-300">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Icon className="h-6 w-6" style={{ color: tier.accent }} />
                  <h3 className="text-3xl font-extrabold text-white">{tier.name}</h3>
                </div>

                <p className="mb-6 text-sm text-white/65">{getTierSubtitleById(tier.id)}</p>

                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-5xl font-black leading-none text-white">{formatTierPrice(tier.price)}</span>
                  <span className="text-2xl font-semibold text-white/55">/mo</span>
                </div>

                <button
                  disabled={isActionDisabled}
                  className="mb-5 w-full rounded-xl px-4 py-3 text-xl font-bold text-white transition disabled:cursor-not-allowed"
                  style={{
                    background: isActionDisabled ? "#62656f" : tier.accent,
                    opacity: isActionDisabled ? 0.55 : 1,
                  }}
                >
                  {isCurrent
                    ? "Current Plan"
                    : isComingSoon
                    ? "Coming Soon"
                    : tier.id === "free"
                    ? "Start Free"
                    : `Get ${tier.name}`}
                </button>

                {prevTier && (inheritedFeatures.length > 0 || !msgIsNew) && (
                  <div className="mb-3 text-lg font-semibold text-white/75">
                    Everything in {prevTier.name}, plus:
                  </div>
                )}

                {(newFeatures.length > 0 || msgIsNew || (index > 0 && imgIsNew && tier.imgLimit > 0)) && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    {msgIsNew && (
                      <div className="mb-2 flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: tier.accent }} />
                        <span className="text-base md:text-lg font-semibold leading-snug text-white">
                          {tier.msgLimit === 0 ? "Messages" : `${tier.msgLimit.toLocaleString()} messages / mo`}
                        </span>
                      </div>
                    )}

                    {index > 0 && imgIsNew && tier.imgLimit > 0 && (
                      <div className="mb-2 flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: tier.accent }} />
                        <span className="text-base md:text-lg font-semibold leading-snug text-white">
                          {tier.imgLimit.toLocaleString()} images / mo
                        </span>
                      </div>
                    )}

                    {newFeatures.map((featureKey) => (
                      <div key={featureKey} className="mb-2 flex items-start gap-3 last:mb-0">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: tier.accent }} />
                        <span className="text-base md:text-lg font-semibold leading-snug text-white">
                          {getFeatureLabel(featureKey)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {(inheritedFeatures.length > 0 || (!msgIsNew && tier.msgLimit > 0) || (!imgIsNew && tier.imgLimit > 0)) && (
                  <div className="mt-auto space-y-2">
                    {!msgIsNew && tier.msgLimit > 0 && (
                      <div className="flex items-start gap-3 text-white/55">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-base md:text-lg leading-snug">{tier.msgLimit.toLocaleString()} messages / mo</span>
                      </div>
                    )}

                    {!imgIsNew && tier.imgLimit > 0 && (
                      <div className="flex items-start gap-3 text-white/55">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-base md:text-lg leading-snug">{tier.imgLimit.toLocaleString()} images / mo</span>
                      </div>
                    )}

                    {inheritedFeatures.map((featureKey) => (
                      <div key={featureKey} className="flex items-start gap-3 text-white/55">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-base md:text-lg leading-snug">{getFeatureLabel(featureKey)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!prevTier && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2 flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: tier.accent }} />
                      <span className="text-base md:text-lg font-semibold leading-snug text-white">
                        {tier.msgLimit === 0 ? "Limited messages" : `${tier.msgLimit.toLocaleString()} messages / mo`}
                      </span>
                    </div>
                    {tier.imgLimit > 0 && (
                      <div className="mb-2 flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: tier.accent }} />
                        <span className="text-base md:text-lg font-semibold leading-snug text-white">
                          {tier.imgLimit.toLocaleString()} images / mo
                        </span>
                      </div>
                    )}
                    {myFeatures.map((featureKey) => (
                      <div key={featureKey} className="mb-2 flex items-start gap-3 last:mb-0">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: tier.accent }} />
                        <span className="text-base md:text-lg font-semibold leading-snug text-white">
                          {getFeatureLabel(featureKey)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <p className="mt-5 text-center text-xs text-white/45">
          Loading subscription tiers...
        </p>
      )}
    </div>
  );
};
