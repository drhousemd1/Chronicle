export const ALLOWED_ORIGINS = [
  'https://hello-git-hug.lovable.app',
  'https://id-preview--a004b824-bad4-4e86-a30f-524c97ca4ddb.lovable.app',
  'http://localhost:5173',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}
