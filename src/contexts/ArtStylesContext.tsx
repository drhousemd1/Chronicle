/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AVATAR_STYLES, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';
import type { AvatarStyle } from '@/constants/avatar-styles';

// BF-02: The browser never sees backend art-style prompts. This context
// exposes only safe presentation fields (id, displayName, thumbnailUrl,
// sortOrder) loaded from get_public_art_styles. Image-gen edge functions
// resolve the actual prompt text server-side from public.art_styles by
// styleId using the service role.

interface ArtStylesContextValue {
  styles: AvatarStyle[];
  defaultStyleId: string;
  getStyleById: (id: string) => AvatarStyle | undefined;
  refreshStyles: () => Promise<void>;
  isLoading: boolean;
}

const ArtStylesContext = createContext<ArtStylesContextValue | null>(null);

export function ArtStylesProvider({ children }: { children: React.ReactNode }) {
  const [styles, setStyles] = useState<AvatarStyle[]>(AVATAR_STYLES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStyles = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).rpc('get_public_art_styles');
      if (error) {
        console.error('Failed to fetch art styles:', error);
        return;
      }
      if (data && data.length > 0) {
        setStyles(
          data.map((row: any) => ({
            id: row.id,
            displayName: row.display_name,
            thumbnailUrl: row.thumbnail_url,
            sortOrder: row.sort_order ?? undefined,
          })),
        );
      }
    } catch (err) {
      console.error('Failed to fetch art styles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStyles(); }, [fetchStyles]);

  const getStyleById = useCallback(
    (id: string) => styles.find((s) => s.id === id),
    [styles],
  );

  return (
    <ArtStylesContext.Provider
      value={{
        styles,
        defaultStyleId: DEFAULT_STYLE_ID,
        getStyleById,
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
  if (!ctx) throw new Error('useArtStyles must be used within ArtStylesProvider');
  return ctx;
}
