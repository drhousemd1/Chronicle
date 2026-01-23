
import React from 'react';

export const STORAGE_KEY = "rpg_campaign_studio_v3_codex";
export const APP_VERSION = 3;

export type LLMModel = {
  id: string;
  name: string;
  provider: string;
  gateway: 'lovable' | 'xai';
  requiresKey?: boolean;
  disabled?: boolean;
  description: string;
};

export const LLM_MODELS: LLMModel[] = [
  // Lovable AI Gateway - works out of the box
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google', gateway: 'lovable', description: 'Ultra-fast and efficient, perfect for quick roleplay interactions and consistent narrative flow.' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', gateway: 'lovable', description: 'High-intelligence model for complex world-building, intricate plot twists, and deep character reasoning.' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', gateway: 'lovable', description: 'Balanced speed and quality. Great for most roleplay scenarios.' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', gateway: 'lovable', description: 'Top-tier Gemini model for the most complex narratives and reasoning.' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', gateway: 'lovable', description: 'Powerful all-rounder with excellent reasoning and multimodal capabilities.' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', gateway: 'lovable', description: 'Balanced performance at lower cost. Great for extended sessions.' },
  
  // X/Grok - requires user API key (BYOK)
  { id: 'grok-3', name: 'Grok 3', provider: 'xAI', gateway: 'xai', requiresKey: true, description: 'xAI\'s most capable model. Less content filtering for mature roleplay scenarios.' },
  { id: 'grok-3-mini', name: 'Grok 3 Mini', provider: 'xAI', gateway: 'xai', requiresKey: true, description: 'Fast and efficient Grok variant. Good balance of speed and capability.' },
  { id: 'grok-2', name: 'Grok 2', provider: 'xAI', gateway: 'xai', requiresKey: true, description: 'Previous generation Grok. Reliable performance with minimal restrictions.' },
];

// Map text models to their provider's image generation model
export const IMAGE_MODEL_MAP: Record<string, string> = {
  // Google models -> Gemini image model
  'google/gemini-3-flash-preview': 'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-preview': 'google/gemini-2.5-flash-image',
  'google/gemini-2.5-flash': 'google/gemini-2.5-flash-image',
  'google/gemini-2.5-pro': 'google/gemini-2.5-flash-image',
  // OpenAI models -> Gemini image model (via Lovable gateway)
  'openai/gpt-5': 'google/gemini-2.5-flash-image',
  'openai/gpt-5-mini': 'google/gemini-2.5-flash-image',
  // Grok models -> Grok image model
  'grok-3': 'grok-2-image-1212',
  'grok-3-mini': 'grok-2-image-1212',
  'grok-2': 'grok-2-image-1212',
};

// Helper to get the corresponding image model for a text model
export function getImageModelForTextModel(textModelId: string): { imageModel: string; gateway: 'lovable' | 'xai' } {
  const imageModel = IMAGE_MODEL_MAP[textModelId] || 'google/gemini-2.5-flash-image';
  const gateway = imageModel.startsWith('grok') ? 'xai' : 'lovable';
  return { imageModel, gateway };
}

// Helper to get gateway for any model
export function getGatewayForModel(modelId: string): 'lovable' | 'xai' {
  return modelId.startsWith('grok') ? 'xai' : 'lovable';
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
