// BF-02: This file is bundled into the browser. Backend/internal art-style
// prompt strings live ONLY in the database (public.art_styles) and are
// resolved server-side by edge functions using the service role.
// Public client code may carry only safe presentation fields (id, display
// name, thumbnail URL, sort order).

export interface AvatarStyle {
  id: string;
  displayName: string;
  thumbnailUrl: string;
  sortOrder?: number;
}

export type GenderPresentation = 'feminine' | 'masculine' | 'androgynous';

/**
 * Public, prompt-free fallback list of art styles.
 * Used only if the sanitized get_public_art_styles RPC is unreachable.
 * Contains zero backend prompt text by design.
 */
export const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'cinematic-2-5d', displayName: 'Cinematic 2.5D', thumbnailUrl: '/images/styles/cinematic-2-5d.png', sortOrder: 1 },
  { id: 'comic-book',     displayName: 'Comic Book',     thumbnailUrl: '/images/styles/comic-book.png',     sortOrder: 2 },
  { id: 'hyper-realism',  displayName: 'Hyper-Realism',  thumbnailUrl: '/images/styles/hyper-realism.png',  sortOrder: 3 },
  { id: 'modern-anime',   displayName: 'Modern Anime',   thumbnailUrl: '/images/styles/modern-anime.png',   sortOrder: 4 },
  { id: 'photo-realism',  displayName: 'Photo Realism',  thumbnailUrl: '/images/styles/photo-realism.png',  sortOrder: 5 },
];

export const DEFAULT_STYLE_ID = 'cinematic-2-5d';

export const getStyleById = (id: string): AvatarStyle | undefined =>
  AVATAR_STYLES.find((style) => style.id === id);
