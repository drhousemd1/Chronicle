
// ============================================================================
// APP-WIDE AI CONFIGURATION — Admin-only, read-only status page.
// Shows which Grok models the app uses. Not interactive — nothing to select.
// The app is hardcoded to grok-4-1-fast-reasoning (text) and grok-imagine-image (images).
// ============================================================================

import React, { useState, useEffect } from "react";
import { Card, SectionTitle, Button } from "./UI";
import { Cpu, Image, Share2, Zap, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { 
  checkSharedKeyStatus, 
  checkIsAdmin, 
  updateSharedKeySetting,
  SharedKeyStatus 
} from "@/services/app-settings";

export function ModelSettingsTab() {
  const { user } = useAuth();

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('checking');
  const [sharedKeyStatus, setSharedKeyStatus] = useState<SharedKeyStatus>({ 
    xaiShared: false, 
    xaiConfigured: false 
  });
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.id) checkIsAdmin(user.id).then(setIsAdmin);
  }, [user?.id]);

  useEffect(() => {
    checkSharedKeyStatus().then(status => {
      setSharedKeyStatus(status);
      setConnectionStatus(status.xaiConfigured ? 'connected' : 'error');
    });
  }, []);

  const handleRefreshConnection = async () => {
    setConnectionStatus('checking');
    const status = await checkSharedKeyStatus();
    setSharedKeyStatus(status);
    setTimeout(() => setConnectionStatus(status.xaiConfigured ? 'connected' : 'error'), 500);
  };

  const handleToggleShare = async (checked: boolean) => {
    setIsUpdatingShare(true);
    const success = await updateSharedKeySetting(checked);
    if (success) {
      setSharedKeyStatus(prev => ({ ...prev, xaiShared: checked }));
    }
    setIsUpdatingShare(false);
  };

  const statusBadge = (
    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
      connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
      connectionStatus === 'checking' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
      'bg-slate-100 text-slate-500 border border-slate-200'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 
        connectionStatus === 'checking' ? 'bg-amber-500 animate-bounce' :
        'bg-slate-300'
      }`} />
      {connectionStatus === 'connected' ? 'Connected' : 
       connectionStatus === 'checking' ? 'Checking...' : 
       'Not Connected'}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionTitle 
        title="AI Configuration" 
        subtitle="App-wide models set by admin. These apply to all users — nothing here is user-selectable." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Models — static display */}
          <Card className="p-8">
            <h3 className="text-xl font-bold text-[hsl(var(--ui-surface-2))] mb-6">Active Models</h3>

            {/* Text Model */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Text Model</div>
                    <div className="font-bold text-[hsl(var(--ui-surface-2))]">Grok 4.1 Fast (Reasoning)</div>
                    <div className="text-xs text-slate-500 mt-0.5">Used for chat, character generation, world building, and all AI text features</div>
                  </div>
                </div>
                {statusBadge}
              </div>
            </div>

            {/* Image Model */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Image className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Image Model</div>
                    <div className="font-bold text-[hsl(var(--ui-surface-2))]">grok-imagine-image</div>
                    <div className="text-xs text-slate-500 mt-0.5">Used for avatar, scene, and cover image generation</div>
                  </div>
                </div>
                {statusBadge}
              </div>
            </div>
          </Card>

          {/* API Connection */}
          <Card className="p-8">
            <h3 className="text-lg font-bold text-[hsl(var(--ui-surface-2))] mb-4">API Connection</h3>
            <div className="bg-ghost-white rounded-2xl p-6 border border-slate-200">
              <div className="space-y-4">
                {isAdmin && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200 mb-4">
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-slate-700 font-medium">
                          Share API key with all users
                        </p>
                        <p className="text-xs text-slate-500">
                          When enabled, all users can use Grok models
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={sharedKeyStatus.xaiShared}
                      onCheckedChange={handleToggleShare}
                      disabled={isUpdatingShare || !sharedKeyStatus.xaiConfigured}
                    />
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  {sharedKeyStatus.xaiShared ? (
                    <>
                      <Share2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-700 font-medium">
                          xAI API key is active and shared with all users.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          All Grok models are available app-wide.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-700 font-medium">
                          xAI API key not yet shared.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAdmin 
                            ? "Enable sharing above to let all users access Grok."
                            : "Contact the app administrator for access."
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button variant="secondary" onClick={handleRefreshConnection} disabled={connectionStatus === 'checking'}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
                  Verify Connection
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="font-black text-lg tracking-tight mb-2">Narrative Core</h4>
              <p className="text-xs text-[rgba(248,250,252,0.3)] mb-6">Powered by xAI Grok — all AI features use this provider.</p>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Context: 2M Tokens
                </li>
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Retry: Same model, up to 3 attempts
                </li>
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Content Restrictions: Minimal
                </li>
              </ul>
            </div>
            <div className="absolute -right-4 -bottom-4 text-[120px] font-black text-white/5 italic select-none">AI</div>
          </Card>

          <Card className="p-8 bg-white border-blue-100 border-2">
            <h4 className="font-bold text-[hsl(var(--ui-surface-2))] mb-2">About Grok</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Grok models have fewer content restrictions, making them ideal for mature roleplay scenarios and creative freedom.
            </p>
            <a 
              href="https://console.x.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              xAI Console →
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
