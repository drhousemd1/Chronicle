import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LLM_MODELS } from '@/constants';

interface ModelSettingsContextType {
  modelId: string;
  setModelId: (id: string) => void;
}

const STORAGE_KEY = 'rpg_studio_global_model';

const ModelSettingsContext = createContext<ModelSettingsContextType | undefined>(undefined);

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const [modelId, setModelIdState] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Validate stored model exists, fallback to first model if not
    if (stored && LLM_MODELS.some(m => m.id === stored)) {
      return stored;
    }
    return LLM_MODELS[0].id;
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, modelId);
  }, [modelId]);

  const setModelId = useCallback((id: string) => {
    setModelIdState(id);
  }, []);

  return (
    <ModelSettingsContext.Provider value={{ modelId, setModelId }}>
      {children}
    </ModelSettingsContext.Provider>
  );
}

export function useModelSettings(): ModelSettingsContextType {
  const context = useContext(ModelSettingsContext);
  if (!context) {
    throw new Error('useModelSettings must be used within a ModelSettingsProvider');
  }
  return context;
}
