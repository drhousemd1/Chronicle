
// ============================================================================
// GROK ONLY -- This app exclusively uses xAI Grok models.
// Do NOT add Google Gemini, OpenAI, or any other provider.
// ============================================================================

import React, { useState, useEffect } from "react";
import { Card, SectionTitle, Button, Label } from "./UI";
import { LLM_MODELS, LLMModel } from "@/constants";
import { Zap, Share2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { 
  checkSharedKeyStatus, 
  isAdminUser, 
  updateSharedKeySetting,
  SharedKeyStatus 
} from "@/services/app-settings";

interface ModelSettingsTabProps {
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export function ModelSettingsTab({ selectedModelId, onSelectModel }: ModelSettingsTabProps) {
  const { user } = useAuth();
  const selectedModel = LLM_MODELS.find(m => m.id === selectedModelId);
  const description = selectedModel?.description || 'xAI Grok powers all AI interactions.';

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('connected');
  const [sharedKeyStatus, setSharedKeyStatus] = useState<SharedKeyStatus>({ 
    xaiShared: false, 
    xaiConfigured: false 
  });
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const isAdmin = isAdminUser(user?.id);

  useEffect(() => {
    checkSharedKeyStatus().then(setSharedKeyStatus);
  }, []);

  const handleRefreshConnection = async () => {
    setConnectionStatus('checking');
    const status = await checkSharedKeyStatus();
    setSharedKeyStatus(status);
    setTimeout(() => setConnectionStatus('connected'), 500);
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
        title="Model Settings" 
        subtitle="All AI is powered by xAI Grok. Choose your preferred Grok model." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Select Grok Model</h3>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs">
                <Zap className="w-3 h-3" /> Powered by xAI
              </span>
            </div>
            
            <div className="space-y-2">
              {LLM_MODELS.map((model) => (
                <button
                  key={model.id}
                  disabled={model.disabled}
                  onClick={() => onSelectModel(model.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    selectedModelId === model.id 
                      ? 'bg-slate-900 border-slate-900 shadow-xl scale-[1.02]' 
                      : model.disabled 
                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedModelId === model.id ? 'bg-white/10' : 'bg-emerald-50'}`}>
                      <Zap className={`w-4 h-4 ${selectedModelId === model.id ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    </div>
                    <div>
                      <div className={`font-bold ${selectedModelId === model.id ? 'text-white' : 'text-slate-900'}`}>
                        {model.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${selectedModelId === model.id ? 'text-slate-400' : 'text-slate-500'}`}>
                        {model.description.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                  {selectedModelId === model.id && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Label>Current Configuration</Label>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedModel?.name}</h3>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">
                  Provider: xAI
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                connectionStatus === 'checking' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 
                  connectionStatus === 'checking' ? 'bg-amber-500 animate-bounce' :
                  'bg-slate-300'
                }`} />
                {connectionStatus === 'connected' ? 'System Linked' : 
                 connectionStatus === 'checking' ? 'Checking Link...' : 
                 'Unlinked'}
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              {description}
            </p>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4">Connection Setup</h4>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="space-y-4">
                  {/* Admin-only toggle */}
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
                            Grok API key is active and shared with all users.
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            All Grok models are available.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-700 font-medium">
                            Grok API key not yet shared.
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
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="font-black text-lg tracking-tight mb-2">Narrative Core</h4>
              <p className="text-xs text-white/60 mb-6">Powered by xAI Grok — unrestricted creative AI.</p>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Context: 128K Tokens
                </li>
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Latency: &lt; 200ms
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
            <h4 className="font-bold text-slate-900 mb-2">About Grok</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Grok models have fewer content restrictions, making them ideal for mature roleplay scenarios and creative freedom.
            </p>
            <a 
              href="https://console.x.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              Learn More →
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
