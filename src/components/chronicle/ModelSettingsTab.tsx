
import React, { useState } from "react";
import { Card, SectionTitle, Button, Label } from "./UI";
import { LLM_MODELS } from "@/constants";

const MODEL_INFO: Record<string, { description: string }> = {
  'gemini-3-flash-preview': {
    description: 'Ultra-fast and efficient, perfect for quick roleplay interactions and consistent narrative flow.',
  },
  'gemini-3-pro-preview': {
    description: 'High-intelligence model for complex world-building, intricate plot twists, and deep character reasoning.',
  },
  'gemini-2.5-flash-native-audio-preview-12-2025': {
    description: 'Enhanced for native audio tasks and long-context narrative history.',
  }
};

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

  const handleLinkAPI = async () => {
    setConnectionStatus('checking');
    // Simulate connection check
    setTimeout(() => setConnectionStatus('connected'), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SectionTitle 
        title="Model Settings" 
        subtitle="Configure your Global AI Narrative Engine connection." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Select Active Model</h3>
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
                   <div>
                     <div className={`font-bold ${selectedModelId === model.id ? 'text-white' : 'text-slate-900'}`}>{model.name}</div>
                     <div className={`text-xs uppercase tracking-wider font-bold mt-1 ${selectedModelId === model.id ? 'text-blue-400' : 'text-slate-400'}`}>{model.provider}</div>
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
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">Provider: {selectedModel?.provider}</p>
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
                <p className="text-sm text-slate-700 font-medium mb-4">
                  This model is configured globally for all your stories. The API link is managed by the Chronicle system.
                </p>
                <Button variant="secondary" onClick={handleLinkAPI} disabled={connectionStatus === 'checking'}>
                  Refresh Connection
                </Button>
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

          <Card className="p-8 bg-white border-blue-100 border-2">
            <h4 className="font-bold text-slate-900 mb-2">Billing & Limits</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Usage of advanced models like Gemini 3 Pro may be subject to your personal quota or billing if using a custom project link.
            </p>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              View Billing Docs →
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
