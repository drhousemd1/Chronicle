import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GITHUB_OWNER = 'drhousemd1';
const GITHUB_REPO = 'Chronicle';
const GUIDES_PATH = 'docs/guides';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getFileSha(token: string, path: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (res.status === 200) {
    const data = await res.json();
    return data.sha;
  }
  await res.text(); // consume body
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('GITHUB_PAT');
    if (!token) {
      return new Response(JSON.stringify({ error: 'GITHUB_PAT not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, title, markdown } = await req.json();
    const slug = slugify(title);
    const filePath = `${GUIDES_PATH}/${slug}.md`;

    if (action === 'delete') {
      const sha = await getFileSha(token, filePath);
      if (!sha) {
        return new Response(JSON.stringify({ success: true, message: 'File not found, nothing to delete' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Delete guide: ${title}`, sha }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`GitHub delete failed [${res.status}]: ${err}`);
      }
      await res.text();

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: upsert
    const sha = await getFileSha(token, filePath);
    const content = btoa(unescape(encodeURIComponent(markdown || '')));

    const body: Record<string, string> = {
      message: `Update guide: ${title}`,
      content,
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub upsert failed [${res.status}]: ${err}`);
    }
    await res.text();

    return new Response(JSON.stringify({ success: true, path: filePath }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('sync-guide-to-github error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
