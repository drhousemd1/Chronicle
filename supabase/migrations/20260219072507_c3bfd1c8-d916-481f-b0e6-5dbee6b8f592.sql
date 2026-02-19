
-- 1. Create app_role enum and user_roles table for secure role checking
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can read roles (prevents enumeration)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Seed admin role for the admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('98d690d7-ac5a-4b04-b15e-78b462f5eec6', 'admin');

-- 4. Create art_styles table
CREATE TABLE public.art_styles (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  thumbnail_url text NOT NULL DEFAULT '',
  backend_prompt text NOT NULL DEFAULT '',
  backend_prompt_masculine text,
  backend_prompt_androgynous text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.art_styles ENABLE ROW LEVEL SECURITY;

-- Public read (all users need styles for image generation)
CREATE POLICY "Anyone can read art styles"
  ON public.art_styles FOR SELECT
  USING (true);

-- Admin-only write using has_role function
CREATE POLICY "Admins can insert art styles"
  ON public.art_styles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update art styles"
  ON public.art_styles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete art styles"
  ON public.art_styles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Seed with existing styles from avatar-styles.ts
INSERT INTO public.art_styles (id, display_name, thumbnail_url, backend_prompt, backend_prompt_masculine, backend_prompt_androgynous, sort_order) VALUES
('cinematic-2-5d', 'Cinematic 2.5D', '/images/styles/cinematic-2-5d.png',
 'Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, refined feminine features with realistic facial proportions and natural eye size, consistent warm skin tone, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast soft pastel palette.',
 'Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, refined masculine features with realistic facial proportions and defined jawline, consistent skin tone, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast palette.',
 'Polished 2.5-D semi-realistic digital illustration, clean digital paintover, smooth airbrushed skin textures, airbrushed gradients and seamless clean transitions, simplified textures with no photographic microtexture, illustrative highlight shapes on metal and skin, refined features with realistic facial proportions and natural eye size, consistent skin tone, no lineart, no cel shading, clean high-detail finish, soft background blur, warm rim light glow, high contrast soft palette.',
 1),
('comic-book', 'Comic Book', '/images/styles/comic-book.png',
 'High-quality modern graphic novel art aesthetic. Clean, defined contour line art. Semi-realistic proportions stylized with a western animation influence. Shading utilizes a blend of hard-edged cell shading and smooth color gradients to define volume. Matte finish texture, low specular highlights. Rich, saturated color palette, stylized lighting emphasizing form over photorealism. Clean graphic composition.',
 NULL, NULL, 2),
('hyper-realism', 'Hyper-Realism', '/images/styles/hyper-realism.png',
 'Masterpiece, photorealistic raw photo aesthetic, ultra-high resolution 8K. Focus on hyper-detailed textures and material realism, emphasizing lifelike clarity in every surface and fiber. Physically based rendering (PBR) with advanced subsurface scattering for realistic skin and material depth. Cinematic natural lighting with realistic global illumination, soft shadows, and ray-traced reflections. Sharp focus on the subject with professional camera lens characteristics, utilizing a shallow depth of field and soft natural bokeh for background separation. Authentic, un-stylized textures with intricate micro-details, sharp clarity, and no digital artifacts.',
 NULL, NULL, 3),
('modern-anime', 'Modern Anime', '/images/styles/modern-anime.png',
 'High-end modern anime illustration style, premium key visual quality, 4K. Clean, precise character line art with fine contours and controlled line weight. Sophisticated cel shading blended with soft airbrushed gradients for smooth volume and form. Bright, high-contrast atmospheric lighting with crisp specular highlights, subtle bloom, and natural reflected light. Rich, vibrant yet balanced color palette with clear separation and minimal muddiness. Strong material readability with realistic highlight behavior across surfaces. Sharp subject focus with shallow depth of field and a slightly softer, painterly background for cinematic separation. High clarity, no artifacts.',
 NULL, NULL, 4),
('photo-realism', 'Photo Realism', '/images/styles/photo-realism.png',
 'Masterpiece, authentic 35mm photography aesthetic, high-fidelity raw photo. Natural, unedited lighting with realistic environmental shadows and highlights. Focus on organic textures and lifelike surface details, including subtle imperfections and micro-textures. Sharp subject clarity with natural depth of field and realistic optical bokeh. Accurate color science and neutral saturation for a grounded, true-to-life appearance. Clean, high-resolution rendering that mimics a professional DSLR camera output with no artificial sharpening.',
 NULL, NULL, 5);

-- 6. Trigger for auto-updating updated_at
CREATE TRIGGER update_art_styles_updated_at
  BEFORE UPDATE ON public.art_styles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
