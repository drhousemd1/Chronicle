import React from 'react';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    icon: Zap,
    color: 'text-slate-400',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
    current: true,
    features: [
      'Create unlimited scenarios',
      'Publish to community gallery',
      'Basic AI models',
      'Standard image generation',
    ],
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    icon: Sparkles,
    color: 'text-[#7ba3d4]',
    bgColor: 'bg-[#4a5f7f]/10',
    borderColor: 'border-[#4a5f7f]/30',
    comingSoon: true,
    features: [
      'Everything in Free',
      'Premium AI models',
      'Enhanced image quality',
      'Priority support',
      'Advanced character AI',
    ],
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    comingSoon: true,
    features: [
      'Everything in Pro',
      'Unlimited AI generation',
      'Custom model fine-tuning',
      'Early access to features',
      'Creator analytics',
      'Custom branding',
    ],
  },
];

export const SubscriptionTab: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-white/50 text-sm">Upgrade to unlock more powerful features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.name}
              className={`relative rounded-2xl border ${tier.borderColor} ${tier.bgColor} p-6 flex flex-col`}
            >
              {tier.comingSoon && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-[#4a5f7f] text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
              )}
              {tier.current && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-6 h-6 ${tier.color}`} />
                <h3 className={`text-xl font-bold ${tier.color}`}>{tier.name}</h3>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">{tier.price}</span>
                <span className="text-white/40 text-sm">{tier.period}</span>
              </div>

              <ul className="space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`} />
                    <span className="text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={tier.current || tier.comingSoon}
                className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  tier.current
                    ? 'bg-white/5 text-white/40 cursor-default'
                    : tier.comingSoon
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-[#4a5f7f] hover:bg-[#5a6f8f] text-white'
                }`}
              >
                {tier.current ? 'Current Plan' : tier.comingSoon ? 'Coming Soon' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
