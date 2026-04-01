// App-wide model setting controlled by admin. Not a per-user preference.
// This context stores which Grok model the entire app uses for text AI.
// The admin sets it in the Model Settings panel; all users share the same model.
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LLM_MODELS } from '@/constants';
import { supabase } from '@/integrations/supabase/client';

interface ModelSettingsContextType {
  modelId: string;
  setModelId: (id: string) => void;
}

const STORAGE_KEY = 'rpg_studio_global_model';

const ModelSettingsContext = createContext<ModelSettingsContextType | undefined>(undefined);

export function ModelSettingsProvider({ children }: { children: ReactNode }) {
  const [modelId, setModelIdState] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LLM_MODELS.some(m => m.id === stored)) {
      return stored;
    }
    return LLM_MODELS[0].id;
  });

  // On mount: fetch from DB and override localStorage cache
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('preferred_model')
        .eq('id', user.id)
        .single();
      if (data?.preferred_model && LLM_MODELS.some(m => m.id === data.preferred_model)) {
        setModelIdState(data.preferred_model);
        localStorage.setItem(STORAGE_KEY, data.preferred_model);
      }
    })();
  }, []);

  const setModelId = useCallback((id: string) => {
    setModelIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    // Write to DB (fire-and-forget)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').update({ preferred_model: id } as any).eq('id', user.id).then();
    });
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
