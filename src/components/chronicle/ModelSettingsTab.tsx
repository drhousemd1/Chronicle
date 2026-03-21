
// ============================================================================
// APP-WIDE AI CONFIGURATION — Admin-only panel.
// Sets the Grok model used across the entire app for all users.
// This is NOT a per-user preference selector.
// ============================================================================

import React, { useState, useEffect } from "react";
import { Card, SectionTitle, Button, Label } from "./UI";
import { LLM_MODELS, LLMModel } from "@/constants";
import { Zap, Share2, Image, Cpu } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { 
  checkSharedKeyStatus, 
  checkIsAdmin, 
  updateSharedKeySetting,
  SharedKeyStatus 
} from "@/services/app-settings";

interface ModelSettingsTabProps {
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export function ModelSettingsTab({ selectedModelId, onSelectModel }: ModelSettingsTabProps) {
  const { user } = useAuth();
  const selectedModel = LLM_MODELS.find(m => m.id === selectedModelId) || LLM_MODELS[0];

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionTitle 
        title="AI Configuration" 
        subtitle="App-wide settings controlled by admin. Applies to all users." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Text Model */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Cpu className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[hsl(var(--ui-surface-2))]">Text Model</h3>
                  <p className="text-xs text-slate-500">Used for all AI chat, character generation, and story features</p>
                </div>
              </div>
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
            </div>
            
            <div className="space-y-2">
              {LLM_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    selectedModelId === model.id 
                      ? 'bg-slate-900 border-slate-900 shadow-xl scale-[1.02]' 
                      : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedModelId === model.id ? 'bg-ghost-white' : 'bg-emerald-50'}`}>
                      <Zap className={`w-4 h-4 ${selectedModelId === model.id ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    </div>
                    <div>
                      <div className={`font-bold ${selectedModelId === model.id ? 'text-white' : 'text-[hsl(var(--ui-surface-2))]'}`}>
                        {model.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${selectedModelId === model.id ? 'text-slate-400' : 'text-slate-500'}`}>
                        {model.description}
                      </div>
                    </div>
                  </div>
                  {selectedModelId === model.id && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-4 italic">
              This setting applies app-wide. All users will use the selected model.
            </p>
          </Card>

          {/* Active Image Model (read-only display) */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[hsl(var(--ui-surface-2))]">Image Model</h3>
                <p className="text-xs text-slate-500">Used for avatar, scene, and cover image generation</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[hsl(var(--ui-surface-2))]">grok-imagine-image</div>
                  <div className="text-xs text-slate-500 mt-0.5">All image generation routes to this model automatically</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
          </Card>

          {/* Connection & API Key */}
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
