
// ============================================================================
// AI CONFIGURATION STATUS — Admin-only, read-only status page.
// Shows which models the app uses (hardcoded, not selectable) and
// whether the backend xAI provider is configured, shared, and reachable.
// ============================================================================

import React, { useState, useEffect } from "react";
import { Card, SectionTitle, Button } from "./UI";
import { Cpu, Image, Share2, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { 
  checkSharedKeyStatus, 
  checkIsAdmin, 
  updateSharedKeySetting,
  SharedKeyStatus 
} from "@/services/app-settings";

function StatusDot({ status }: { status: 'ok' | 'warn' | 'error' | 'loading' }) {
  const cls = {
    ok: 'bg-emerald-500',
    warn: 'bg-amber-500 animate-pulse',
    error: 'bg-red-400',
    loading: 'bg-amber-400 animate-bounce',
  }[status];
  return <div className={`w-2 h-2 rounded-full ${cls}`} />;
}

function StatusRow({ label, value, status }: { label: string; value: string; status: 'ok' | 'warn' | 'error' | 'loading' }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className={`text-sm font-semibold ${
          status === 'ok' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-amber-600'
        }`}>{value}</span>
      </div>
    </div>
  );
}

export function ModelSettingsTab() {
  const { user } = useAuth();

  const [keyStatus, setKeyStatus] = useState<SharedKeyStatus>({ 
    xaiShared: false, 
    xaiConfigured: false,
    providerReachable: false,
  });
  const [isChecking, setIsChecking] = useState(true);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.id) checkIsAdmin(user.id).then(setIsAdmin);
  }, [user?.id]);

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const status = await checkSharedKeyStatus();
    setKeyStatus(status);
    setIsChecking(false);
  };

  const handleToggleShare = async (checked: boolean) => {
    setIsUpdatingShare(true);
    const success = await updateSharedKeySetting(checked);
    if (success) {
      setKeyStatus(prev => ({ ...prev, xaiShared: checked }));
    }
    setIsUpdatingShare(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <SectionTitle 
        title="AI Configuration" 
        subtitle="App-wide models and provider status. Set by admin — applies to all users." 
      />

      {/* Active Models */}
      <Card className="p-8">
        <h3 className="text-lg font-bold text-[hsl(var(--ui-surface-2))] mb-6">Active Models</h3>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Text</div>
              <div className="font-bold text-[hsl(var(--ui-surface-2))]">Grok 4.1 Fast (Reasoning)</div>
              <div className="text-xs text-slate-500 mt-0.5">Chat, character generation, world building, all AI text</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Image className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Image</div>
              <div className="font-bold text-[hsl(var(--ui-surface-2))]">grok-imagine-image</div>
              <div className="text-xs text-slate-500 mt-0.5">Avatar, scene, and cover image generation</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Backend Status */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[hsl(var(--ui-surface-2))]">Backend Status</h3>
          <Button variant="secondary" onClick={runHealthCheck} disabled={isChecking}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking…' : 'Run Health Check'}
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          <StatusRow 
            label="API Key Configured" 
            value={isChecking ? 'Checking…' : keyStatus.xaiConfigured ? 'Yes' : 'Not Set'}
            status={isChecking ? 'loading' : keyStatus.xaiConfigured ? 'ok' : 'error'}
          />
          <StatusRow 
            label="Provider Reachable" 
            value={isChecking ? 'Checking…' : keyStatus.providerReachable ? 'Online' : 'Unreachable'}
            status={isChecking ? 'loading' : keyStatus.providerReachable ? 'ok' : 'error'}
          />
          <StatusRow 
            label="Shared with Users" 
            value={keyStatus.xaiShared ? 'Enabled' : 'Disabled'}
            status={keyStatus.xaiShared ? 'ok' : 'warn'}
          />
        </div>

        {/* Share toggle — admin only */}
        {isAdmin && (
          <div className="mt-6 flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-slate-700 font-medium">Share API key with all users</p>
                <p className="text-xs text-slate-500">When enabled, all users can use Grok models</p>
              </div>
            </div>
            <Switch 
              checked={keyStatus.xaiShared}
              onCheckedChange={handleToggleShare}
              disabled={isUpdatingShare || !keyStatus.xaiConfigured}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
