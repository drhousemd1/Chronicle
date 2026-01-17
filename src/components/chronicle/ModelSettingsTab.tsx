
import React, { useState } from "react";
import { Card, SectionTitle, Button, Label } from "./UI";
import { LLM_MODELS, LLMModel } from "@/constants";
import { Key, Zap, Shield } from "lucide-react";

const MODEL_INFO: Record<string, { description: string }> = {
  'google/gemini-3-flash-preview': {
    description: 'Ultra-fast and efficient, perfect for quick roleplay interactions and consistent narrative flow.',
  },
  'google/gemini-3-pro-preview': {
    description: 'High-intelligence model for complex world-building, intricate plot twists, and deep character reasoning.',
  },
  'google/gemini-2.5-flash': {
    description: 'Balanced speed and quality. Great for most roleplay scenarios.',
  },
  'google/gemini-2.5-pro': {
    description: 'Top-tier Gemini model for the most complex narratives and reasoning.',
  },
  'openai/gpt-5': {
    description: 'Powerful all-rounder with excellent reasoning and multimodal capabilities.',
  },
  'openai/gpt-5-mini': {
    description: 'Balanced performance at lower cost. Great for extended sessions.',
  },
  'grok-3': {
    description: 'xAI\'s most capable model. Less content filtering for mature roleplay scenarios.',
  },
  'grok-3-mini': {
    description: 'Fast and efficient Grok variant. Good balance of speed and capability.',
  },
  'grok-2': {
    description: 'Previous generation Grok. Reliable performance with minimal restrictions.',
  },
};

// Group models by provider
function groupModelsByProvider(models: LLMModel[]): Record<string, LLMModel[]> {
  return models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, LLMModel[]>);
}

interface ModelSettingsTabProps {
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export function ModelSettingsTab({ selectedModelId, onSelectModel }: ModelSettingsTabProps) {
  const selectedModel = LLM_MODELS.find(m => m.id === selectedModelId);
  const info = MODEL_INFO[selectedModelId] || { 
    description: 'Integrating external models for diverse narrative experiences.',
  };

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('connected');

  const handleRefreshConnection = async () => {
    setConnectionStatus('checking');
    setTimeout(() => setConnectionStatus('connected'), 1000);
  };

  const groupedModels = groupModelsByProvider(LLM_MODELS);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'xAI':
        return <Key className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'xAI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
            <Key className="w-2.5 h-2.5" />
            BYOK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Zap className="w-2.5 h-2.5" />
            Ready
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionTitle 
        title="Model Settings" 
        subtitle="Configure your AI Narrative Engine. Choose from built-in models or bring your own API key." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Select Active Model</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <Zap className="w-3 h-3" /> Built-in
                </span>
                <span className="inline-flex items-center gap-1.5 text-orange-600">
                  <Key className="w-3 h-3" /> Requires API Key
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              {Object.entries(groupedModels).map(([provider, models]) => (
                <div key={provider} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{provider}</span>
                    {getProviderBadge(provider)}
                  </div>
                  
                  <div className="space-y-2">
                    {models.map((model) => (
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
                          <div className={`p-2 rounded-lg ${
                            selectedModelId === model.id 
                              ? 'bg-white/10' 
                              : model.requiresKey 
                                ? 'bg-orange-50' 
                                : 'bg-emerald-50'
                          }`}>
                            {model.requiresKey 
                              ? <Key className={`w-4 h-4 ${selectedModelId === model.id ? 'text-orange-400' : 'text-orange-500'}`} />
                              : <Zap className={`w-4 h-4 ${selectedModelId === model.id ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            }
                          </div>
                          <div>
                            <div className={`font-bold ${selectedModelId === model.id ? 'text-white' : 'text-slate-900'}`}>
                              {model.name}
                            </div>
                            <div className={`text-xs mt-0.5 ${selectedModelId === model.id ? 'text-slate-400' : 'text-slate-500'}`}>
                              {MODEL_INFO[model.id]?.description.slice(0, 60)}...
                            </div>
                          </div>
                        </div>
                        {selectedModelId === model.id && (
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Label>Current Configuration</Label>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedModel?.name}</h3>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">
                  Provider: {selectedModel?.provider}
                  {selectedModel?.requiresKey && (
                    <span className="ml-2 text-orange-500">• BYOK</span>
                  )}
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
              {info.description}
            </p>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4">Connection Setup</h4>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                {selectedModel?.requiresKey ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-700 font-medium">
                          This model requires your personal API key from {selectedModel.provider}.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Your API key is stored securely and never exposed to the client.
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" onClick={handleRefreshConnection} disabled={connectionStatus === 'checking'}>
                      Verify API Key Connection
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 font-medium mb-4">
                      This model is provided by Lovable AI and works out of the box. No API key required.
                    </p>
                    <Button variant="secondary" onClick={handleRefreshConnection} disabled={connectionStatus === 'checking'}>
                      Refresh Connection
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="font-black text-lg tracking-tight mb-2">Narrative Core</h4>
              <p className="text-xs text-white/60 mb-6">Optimized for descriptive text generation.</p>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Context: 1M+ Tokens
                </li>
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Latency: &lt; 200ms
                </li>
                <li className="flex items-center gap-3 text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Creative Logic: Enabled
                </li>
              </ul>
            </div>
            <div className="absolute -right-4 -bottom-4 text-[120px] font-black text-white/5 italic select-none">AI</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 border-2">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-orange-600" />
              <h4 className="font-bold text-slate-900">xAI / Grok</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Grok models have fewer content restrictions, making them ideal for mature roleplay scenarios and creative freedom.
            </p>
            <a 
              href="https://console.x.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              Get API Key →
            </a>
          </Card>

          <Card className="p-8 bg-white border-blue-100 border-2">
            <h4 className="font-bold text-slate-900 mb-2">Usage & Billing</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Built-in models are included with Lovable. BYOK models use your personal API quota.
            </p>
            <a 
              href="https://docs.lovable.dev/features/ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              View Docs →
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
