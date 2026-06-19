/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AVATAR_STYLES, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';
import type { AvatarStyle, GenderPresentation } from '@/constants/avatar-styles';

interface ArtStylesContextValue {
  styles: AvatarStyle[];
  defaultStyleId: string;
  getStyleById: (id: string) => AvatarStyle | undefined;
  getStylePromptForGender: (style: AvatarStyle, gender: GenderPresentation) => string;
  refreshStyles: () => Promise<void>;
  isLoading: boolean;
}

const ArtStylesContext = createContext<ArtStylesContextValue | null>(null);

export function ArtStylesProvider({ children }: { children: React.ReactNode }) {
  const [styles, setStyles] = useState<AvatarStyle[]>(AVATAR_STYLES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStyles = useCallback(async () => {
    try {
      // BF-02: direct SELECT on public.art_styles is admin-only.
      // Non-admin clients receive sanitized fields via the public RPC.
      const { data, error } = await (supabase as any).rpc('get_public_art_styles');

      if (error) {
        console.error('Failed to fetch art styles:', error);
        return;
      }

      if (data && data.length > 0) {
        // Prompts are never returned to the client. Image-gen edge functions
        // resolve prompts server-side from styleId using the service role.
        // Keep local AVATAR_STYLES prompts as a best-effort client fallback
        // for any pre-existing flows that still read backendPrompt.
        const fallbackById = new Map(AVATAR_STYLES.map((s) => [s.id, s]));
        const mapped: AvatarStyle[] = data.map((row: any) => {
          const fb = fallbackById.get(row.id);
          return {
            id: row.id,
            displayName: row.display_name,
            thumbnailUrl: row.thumbnail_url,
            backendPrompt: fb?.backendPrompt ?? '',
            backendPromptMasculine: fb?.backendPromptMasculine,
            backendPromptAndrogynous: fb?.backendPromptAndrogynous,
          };
        });
        setStyles(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch art styles:', err);
      // Falls back to hardcoded defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const getStyleById = useCallback(
    (id: string) => styles.find((s) => s.id === id),
    [styles]
  );

  const getStylePromptForGender = useCallback(
    (style: AvatarStyle, gender: GenderPresentation): string => {
      if (gender === 'masculine' && style.backendPromptMasculine) {
        return style.backendPromptMasculine;
      }
      if (gender === 'androgynous' && style.backendPromptAndrogynous) {
        return style.backendPromptAndrogynous;
      }
      return style.backendPrompt;
    },
    []
  );

  return (
    <ArtStylesContext.Provider
      value={{
        styles,
        defaultStyleId: DEFAULT_STYLE_ID,
        getStyleById,
        getStylePromptForGender,
        refreshStyles: fetchStyles,
        isLoading,
      }}
    >
      {children}
    </ArtStylesContext.Provider>
  );
}

export function useArtStyles(): ArtStylesContextValue {
  const ctx = useContext(ArtStylesContext);
  if (!ctx) {
    throw new Error('useArtStyles must be used within ArtStylesProvider');
  }
  return ctx;
}
