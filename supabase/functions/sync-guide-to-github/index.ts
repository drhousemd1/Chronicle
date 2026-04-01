import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const GITHUB_OWNER = "drhousemd1";
const GITHUB_REPO = "Chronicle";
const GUIDES_PATH = "docs/guides";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function githubHeaders(token: string, withJson = false): HeadersInit {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "lovable-sync-guide-to-github",
    ...(withJson ? { "Content-Type": "application/json" } : {}),
  };
}

function toBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function parseGitHubError(res: Response): Promise<string> {
  const raw = await res.text();
  let message = raw;

  try {
    const parsed = JSON.parse(raw);
    message = parsed?.message || raw;
  } catch {
    // raw is not JSON
  }

  const accepted = res.headers.get("x-accepted-github-permissions");
  const scopes = res.headers.get("x-oauth-scopes");
  const sso = res.headers.get("x-github-sso");

  const tips: string[] = [];
  if (accepted) tips.push(`required_permissions=${accepted}`);
  if (scopes) tips.push(`token_scopes=${scopes}`);
  if (sso) tips.push(`sso=${sso}`);

  const suffix = tips.length ? ` | ${tips.join(" | ")}` : "";
  return `${message}${suffix}`;
}

async function assertRepoAccess(token: string): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.ok) {
    await res.text();
    return;
  }

  const details = await parseGitHubError(res);
  throw new Error(
    `Repository access failed [${res.status}] for ${GITHUB_OWNER}/${GITHUB_REPO}: ${details}. ` +
      "Ensure token has repository access and Contents: Read & write."
  );
}

async function getFileSha(token: string, path: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, { headers: githubHeaders(token) });

  if (res.status === 404) {
    await res.text();
    return null;
  }

  if (!res.ok) {
    const details = await parseGitHubError(res);
    throw new Error(`Get file SHA failed [${res.status}]: ${details}`);
  }

  const data = await res.json();
  return data.sha ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth guard — require authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("GITHUB_PAT");
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "GITHUB_PAT not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    const action = payload?.action as "upsert" | "delete";
    const title = String(payload?.title || "").trim();
    const markdown = String(payload?.markdown || "");

    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: title" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action !== "upsert" && action !== "delete") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action. Use 'upsert' or 'delete'." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await assertRepoAccess(token);

    const slug = slugify(title);
    const filePath = `${GUIDES_PATH}/${slug}.md`;

    if (action === "delete") {
      const sha = await getFileSha(token, filePath);
      if (!sha) {
        return new Response(
          JSON.stringify({ success: true, message: "File not found, nothing to delete", path: filePath }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: "DELETE",
          headers: githubHeaders(token, true),
          body: JSON.stringify({ message: `Delete guide: ${title}`, sha }),
        }
      );

      if (!res.ok) {
        const details = await parseGitHubError(res);
        throw new Error(`GitHub delete failed [${res.status}]: ${details}`);
      }

      await res.text();
      return new Response(JSON.stringify({ success: true, path: filePath }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sha = await getFileSha(token, filePath);
    const content = toBase64Utf8(markdown);

    const body: Record<string, string> = {
      message: `Update guide: ${title}`,
      content,
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: githubHeaders(token, true),
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const details = await parseGitHubError(res);
      throw new Error(`GitHub upsert failed [${res.status}]: ${details}`);
    }

    await res.text();
    return new Response(JSON.stringify({ success: true, path: filePath }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("sync-guide-to-github error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
