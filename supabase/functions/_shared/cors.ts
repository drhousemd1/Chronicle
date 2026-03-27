const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "https://hello-git-hug.lovable.app",
];

const DEFAULT_ALLOWED_SUFFIXES = [".lovable.app", ".lovableproject.com"];

function parseOrigins(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const configuredEntries = parseOrigins(
  Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("CORS_ALLOWED_ORIGINS") ?? null,
);

const configuredOrigins = configuredEntries.filter(
  (entry) => !entry.startsWith(".") && entry !== "*",
);
const configuredSuffixes = configuredEntries.filter((entry) => entry.startsWith("."));

export const ALLOWED_ORIGINS =
  configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;

export const ALLOWED_SUFFIXES =
  configuredSuffixes.length > 0 ? configuredSuffixes : DEFAULT_ALLOWED_SUFFIXES;

function originMatchesSuffix(origin: string): boolean {
  return ALLOWED_SUFFIXES.some((suffix) => origin.endsWith(suffix));
}

function originIsAllowed(origin: string): boolean {
  if (!origin) return false;
  if (configuredEntries.includes("*")) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return originMatchesSuffix(origin);
}

function getFallbackOrigin(): string {
  return ALLOWED_ORIGINS[0] ?? DEFAULT_ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = configuredEntries.includes("*")
    ? "*"
    : originIsAllowed(origin)
      ? origin
      : getFallbackOrigin();

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}
