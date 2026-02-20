import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, Mail } from 'lucide-react';

interface AccountSettingsTabProps {
  user: { id: string; email?: string } | null;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ user }) => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast({ title: 'Failed to update password', description: e.message, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Email Section */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-[#4a5f7f]" />
          <h3 className="text-lg font-bold text-white">Email Address</h3>
        </div>
        <p className="text-white/70 text-sm bg-[#2a2a2f] rounded-xl px-4 py-3 border border-white/5">
          {user?.email || 'No email found'}
        </p>
      </div>

      {/* Subscription Section */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[#4a5f7f]" />
          <h3 className="text-lg font-bold text-white">Current Plan</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[#4a5f7f]/20 text-[#7ba3d4] rounded-lg text-sm font-bold">
            Free
          </span>
          <span className="text-white/50 text-sm">Basic access to all features</span>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword || !newPassword}
            className="px-6 py-2.5 bg-[#4a5f7f] hover:bg-[#5a6f8f] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
