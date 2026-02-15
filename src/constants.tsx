import React from 'react';

export const STORAGE_KEY = "rpg_campaign_studio_v3_codex";
export const APP_VERSION = 3;

export type LLMModel = {
  id: string;
  name: string;
  provider: string;
  gateway: 'xai'; // GROK ONLY -- always xai
  disabled?: boolean;
  description: string;
};

// GROK ONLY -- These are the only models available. Do NOT add Gemini or OpenAI.
export const LLM_MODELS: LLMModel[] = [
  { id: 'grok-3', name: 'Grok 3', provider: 'xAI', gateway: 'xai', description: 'xAI\'s most capable model. Excellent for complex narratives and mature roleplay scenarios.' },
  { id: 'grok-3-mini', name: 'Grok 3 Mini', provider: 'xAI', gateway: 'xai', description: 'Fast and efficient Grok variant. Good balance of speed and capability.' },
  { id: 'grok-2', name: 'Grok 2', provider: 'xAI', gateway: 'xai', description: 'Previous generation Grok. Reliable performance with minimal restrictions.' },
];

// GROK ONLY -- All image generation uses grok-2-image-1212
export const IMAGE_MODEL_MAP: Record<string, string> = {
  'grok-3': 'grok-2-image-1212',
  'grok-3-mini': 'grok-2-image-1212',
  'grok-2': 'grok-2-image-1212',
};

// GROK ONLY -- Always returns grok image model
export function getImageModelForTextModel(textModelId: string): { imageModel: string; gateway: 'xai' } {
  const imageModel = IMAGE_MODEL_MAP[textModelId] || 'grok-2-image-1212';
  return { imageModel, gateway: 'xai' };
}

// GROK ONLY -- Always returns 'xai'
export function getGatewayForModel(_modelId: string): 'xai' {
  return 'xai';
}

export const Icons = {
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  MessageSquare: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  )
};
