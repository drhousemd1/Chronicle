import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Shield, Mail } from 'lucide-react';

interface AccountSettingsTabProps {
  user:
    | {
        id: string;
        email?: string;
        user_metadata?: Record<string, unknown>;
      }
    | null;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStatusMessage({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Failed to update password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const sectionClass =
    "bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]";
  const sectionHeaderClass =
    "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg";
  const sectionBodyClass =
    "p-5 bg-[#2e2e33] rounded-b-[24px] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]";
  const sectionShineClass = "absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40";
  const inputClass =
    "w-full bg-[#1b1c21] border border-black/45 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
  const labelClass = "block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2";
  const staticInputClass =
    "w-full bg-[#1b1c21] border border-black/45 rounded-xl px-4 py-3 text-zinc-300 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  const rawTier =
    typeof user?.user_metadata?.subscription_tier === 'string'
      ? user.user_metadata.subscription_tier.trim().toLowerCase()
      : 'free';
  const normalizedTier = rawTier === 'pro' ? 'starter' : rawTier === 'free_trial' ? 'free' : rawTier;

  const tierMeta: Record<string, { label: string; description: string }> = {
    free: { label: 'Free', description: 'Basic access to all features' },
    starter: { label: 'Starter', description: 'Expanded limits for stories and images' },
    premium: { label: 'Premium', description: 'Advanced generation and memory features' },
    elite: { label: 'Elite', description: 'Maximum limits and full feature access' },
  };
  const currentTier = tierMeta[normalizedTier] ?? tierMeta.free;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Email Section */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionShineClass} style={{ height: '60%' }} />
          <Mail className="w-5 h-5 text-white relative z-[1]" />
          <h3 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Email Address</h3>
        </div>
        <div className={sectionBodyClass}>
          <div className={staticInputClass}>{user?.email || 'No email found'}</div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionShineClass} style={{ height: '60%' }} />
          <Shield className="w-5 h-5 text-white relative z-[1]" />
          <h3 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Current Plan</h3>
        </div>
        <div className={sectionBodyClass}>
          <div className="flex items-center gap-3 rounded-xl border border-black/30 bg-[#3c3e47] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.20)]">
            <span className="inline-flex items-center rounded-lg border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-3 py-1 text-xs font-bold text-white shadow-sm">
              {currentTier.label}
            </span>
            <span className="text-sm text-zinc-300">{currentTier.description}</span>
          </div>
        </div>
      </section>

      {/* Change Password */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <div className={sectionShineClass} style={{ height: '60%' }} />
          <h3 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Change Password</h3>
        </div>
        <div className={sectionBodyClass}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            {statusMessage && (
              <div
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {statusMessage.text}
              </div>
            )}
            <button
              type="submit"
              disabled={isChangingPassword || !newPassword}
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:brightness-105 active:brightness-95 transition-all active:scale-[0.99] text-sm font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
