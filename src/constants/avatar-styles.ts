export interface AvatarStyle {
  id: string;
  displayName: string;
  thumbnailUrl: string;
  backendPrompt: string; // Hidden from user, sent to AI
}

export const AVATAR_STYLES: AvatarStyle[] = [
  {
    id: "cinematic-2-5d",
    displayName: "Cinematic 2.5D",
    thumbnailUrl: "/images/styles/cinematic-2-5d.png",
    backendPrompt: "Masterpiece, best quality, polished 2.5D digital illustration aesthetic. Semi-realistic rendering with a focus on depth and volume. Smooth airbrushed textures with soft subsurface scattering effect. High-gloss specular highlights giving surfaces a polished sheen. Cinematic lighting, dramatic HDR backlighting with gentle rim light glow, global illumination. High contrast, rich saturation palette. Soft-focus depth of field, blurred background for subject isolation. Clean composition, visual harmony, ultra-high resolution 8K rendering."
  },
  {
    id: "comic-book",
    displayName: "Comic Book",
    thumbnailUrl: "/images/styles/comic-book.png",
    backendPrompt: "High-quality modern graphic novel art aesthetic. Clean, defined contour line art. Semi-realistic proportions stylized with a western animation influence. Shading utilizes a blend of hard-edged cell shading and smooth color gradients to define volume. Matte finish texture, low specular highlights. Rich, saturated color palette, stylized lighting emphasizing form over photorealism. Clean graphic composition."
  },
  {
    id: "hyper-realism",
    displayName: "Hyper-Realism",
    thumbnailUrl: "/images/styles/hyper-realism.png",
    backendPrompt: "Masterpiece, photorealistic raw photo aesthetic, ultra-high resolution 8K. Focus on hyper-detailed textures and material realism, emphasizing lifelike clarity in every surface and fiber. Physically based rendering (PBR) with advanced subsurface scattering for realistic skin and material depth. Cinematic natural lighting with realistic global illumination, soft shadows, and ray-traced reflections. Sharp focus on the subject with professional camera lens characteristics, utilizing a shallow depth of field and soft natural bokeh for background separation. Authentic, un-stylized textures with intricate micro-details, sharp clarity, and no digital artifacts."
  },
  {
    id: "modern-anime",
    displayName: "Modern Anime",
    thumbnailUrl: "/images/styles/modern-anime.png",
    backendPrompt: "High-end modern anime illustration style, premium key visual quality, 4K. Clean, precise character line art with fine contours and controlled line weight. Sophisticated cel shading blended with soft airbrushed gradients for smooth volume and form. Bright, high-contrast atmospheric lighting with crisp specular highlights, subtle bloom, and natural reflected light. Rich, vibrant yet balanced color palette with clear separation and minimal muddiness. Strong material readability with realistic highlight behavior across surfaces. Sharp subject focus with shallow depth of field and a slightly softer, painterly background for cinematic separation. High clarity, no artifacts."
  },
  {
    id: "photo-realism",
    displayName: "Photo Realism",
    thumbnailUrl: "/images/styles/photo-realism.png",
    backendPrompt: "Masterpiece, authentic 35mm photography aesthetic, high-fidelity raw photo. Natural, unedited lighting with realistic environmental shadows and highlights. Focus on organic textures and lifelike surface details, including subtle imperfections and micro-textures. Sharp subject clarity with natural depth of field and realistic optical bokeh. Accurate color science and neutral saturation for a grounded, true-to-life appearance. Clean, high-resolution rendering that mimics a professional DSLR camera output with no artificial sharpening."
  }
];

export const DEFAULT_STYLE_ID = "cinematic-2-5d";

export const getStyleById = (id: string): AvatarStyle | undefined => {
  return AVATAR_STYLES.find(style => style.id === id);
};
