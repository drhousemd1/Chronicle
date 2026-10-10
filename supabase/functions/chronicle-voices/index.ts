// chronicle-voices: admin-only voice catalog + generation backend.
// Every action: getUser + has_role(admin). Mutations go through SECURITY DEFINER RPCs with the caller's JWT.
// The service-role client is used only server-side for reads, provider cache and background stage results.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  assembleGeneratedWav,
  compileDraft,
  EXPRESSIONS,
  HttpError,
  LIMITS,
  providerVoiceToDraft,
  sha256,
  stableStringify,
} from "./compile.ts";

const MODEL = "gemini-3.8-flash-tts";
const GOOGLE_BASE = "https://generativelanguage.googleapis.com/v1beta";
const PAID_FETCH_TIMEOUT_MS = 110_000;
const STAGE_DEADLINE_SECONDS = 130;
const LIST_TIMEOUT_MS = 20_000;
const ACTIVE_STAGES = new Set(["queued", "voice_creating", "voice_ready", "speech_running"]);

type Mode = "catalog" | "system" | "personal";
type Json = Record<string, any>;

const apiKey = () => Deno.env.get("CHRONICLE_GOOGLE_API_KEY") || "";

function rpcError(error: any): HttpError {
  const code: string = error?.code ?? "";
  const m = code.match(/^VC(\d{3})$/);
  if (m) return new HttpError(Number(m[1]), error.message);
  if (code === "23505") return new HttpError(409, "Conflicting record already exists");
  if (code.startsWith("23") || code.startsWith("22")) return new HttpError(400, "Invalid data");
  console.error("[chronicle-voices] database error", code, error?.message);
  return new HttpError(500, "Database operation failed");
}

async function rpc(client: SupabaseClient, fn: string, args: Json): Promise<any> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw rpcError(error);
  return data;
}

function requireAdminMode(mode: Mode): "system" | "personal" {
  if (mode !== "system" && mode !== "personal")
    throw new HttpError(400, "This action requires mode system or personal");
  return mode;
}

function reqStr(v: unknown, name: string, max = 200): string {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new HttpError(400, `${name} is required`);
  return v;
}
const optInt = (v: unknown, name: string): number => {
  if (typeof v !== "number" || !Number.isInteger(v)) throw new HttpError(400, `${name} must be an integer`);
  return v;
};

// ---------- identity lookup ----------
async function findIdentity(svc: SupabaseClient, owner: string, fingerprint: string): Promise<Json | null> {
  const { data: job, error: jobError } = await svc
    .from("voice_generation_jobs")
    .select("identity,provider_voice_id")
    .eq("owner_id", owner)
    .eq("fingerprint", fingerprint)
    .not("provider_voice_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (jobError) throw rpcError(jobError);
  if (job?.provider_voice_id) return { ...(job.identity ?? {}), provider_voice_id: job.provider_voice_id, fingerprint };
  const { data: ps, error: settingsError } = await svc
    .from("voice_provider_settings")
    .select("identity,voice_catalog_entries!inner(scope,owner_id,removed_at)")
    .eq("identity->>fingerprint", fingerprint)
    .is("voice_catalog_entries.removed_at", null)
    .or(`scope.eq.system,owner_id.eq.${owner}`, { referencedTable: "voice_catalog_entries" })
    .limit(1)
    .maybeSingle();
  if (settingsError) throw rpcError(settingsError);
  const original = ps?.identity;
  const providerId = original?.provider_voice_id ?? original?.record?.voice?.id ?? original?.record?.voice?.key;
  if (providerId) return { ...original, provider_voice_id: providerId, fingerprint };
  return null;
}

async function baseIdentity(svc: SupabaseClient, draft: Json, fingerprint: string): Promise<Json | null> {
  const baseId = typeof draft?.base_voice_id === "string" ? draft.base_voice_id : "";
  if (!baseId) return null;
  const { data, error } = await svc.from("voice_provider_voices").select("id,info").eq("id", baseId).maybeSingle();
  if (error) throw rpcError(error);
  if (!data) return null;
  const baseCompiled = await compileDraft(providerVoiceToDraft(data.id, data.info));
  if (baseCompiled.fingerprint !== fingerprint) return null;
  return {
    provider_voice_id: data.info?.id ?? data.id,
    record: { voice: data.info },
    source: "base",
    base_voice_id: data.id,
    fingerprint,
  };
}

// ---------- state ----------
function runFromJob(j: Json | null) {
  if (!j) return null;
  const state = ACTIVE_STAGES.has(j.stage) ? "running" : j.stage === "ready" ? "ready" : "error";
  return {
    id: j.id,
    state,
    message: j.message,
    destination: j.destination,
    draft: j.draft,
    stage: j.stage,
    uncertain: !!j.uncertain,
  };
}

async function buildSections(svc: SupabaseClient, scope: "system" | "personal", owner: string | null, admin: boolean) {
  let cq = svc.from("voice_catalog_categories").select("id,label,revision,position,created_at").eq("scope", scope);
  let eq = svc
    .from("voice_catalog_entries")
    .select("id,category_id,name,description,presentation,revision,position,created_at")
    .eq("scope", scope)
    .is("removed_at", null);
  cq = owner ? cq.eq("owner_id", owner) : cq.is("owner_id", null);
  eq = owner ? eq.eq("owner_id", owner) : eq.is("owner_id", null);
  const [{ data: cats, error: ce }, { data: entries, error: ee }] = await Promise.all([
    cq.order("position").order("created_at").limit(1000),
    eq.order("position").order("created_at").limit(5000),
  ]);
  if (ce || ee) throw rpcError(ce ?? ee);
  let settings = new Map<string, Json>();
  if (admin && entries?.length) {
    const { data: ps, error } = await svc
      .from("voice_provider_settings")
      .select("entry_id,draft,job_id")
      .in(
        "entry_id",
        entries.map((e) => e.id),
      );
    if (error) throw rpcError(error);
    settings = new Map((ps ?? []).map((p) => [p.entry_id, p]));
  }
  return (cats ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    revision: c.revision,
    voices: (entries ?? [])
      .filter((e) => e.category_id === c.id)
      .map((e) => {
        const v: Json = {
          id: e.id,
          name: e.name,
          description: e.description,
          presentation: e.presentation,
          revision: e.revision,
        };
        const p = settings.get(e.id);
        if (admin && p) {
          if (p.job_id) v.job_id = p.job_id;
          v.draft = p.draft;
        }
        return v;
      }),
  }));
}

async function buildState(user: SupabaseClient, svc: SupabaseClient, uid: string, mode: Mode): Promise<Json> {
  const configured = !!apiKey();
  if (mode === "catalog") {
    return {
      system_sections: await buildSections(svc, "system", null, false),
      candidates: [],
      current: null,
      run: null,
      draft: {},
      draft_revision: 0,
      identity: null,
      expressions: [],
      connected: configured,
    };
  }
  await rpc(user, "voice_job_expire", {});
  const [system_sections, personal_sections, draftRow, latest, ready] = await Promise.all([
    buildSections(svc, "system", null, true),
    mode === "personal" ? buildSections(svc, "personal", uid, true) : Promise.resolve(undefined),
    svc.from("voice_admin_drafts").select("draft,revision").eq("owner_id", uid).eq("mode", mode).maybeSingle(),
    svc
      .from("voice_generation_jobs")
      .select("*")
      .eq("owner_id", uid)
      .is("discarded_at", null)
      .is("committed_entry_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    svc
      .from("voice_generation_jobs")
      .select("*")
      .eq("owner_id", uid)
      .eq("stage", "ready")
      .is("discarded_at", null)
      .is("committed_entry_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  for (const result of [draftRow, latest, ready]) if (result.error) throw rpcError(result.error);
  const draft = draftRow.data?.draft ?? {};
  let identity: Json | null = null;
  try {
    const c = await compileDraft(draft);
    const rec = await findIdentity(svc, uid, c.fingerprint);
    identity = rec ? { fingerprint: c.fingerprint, record: rec } : null;
  } catch (error) {
    if (!(error instanceof HttpError && error.status === 400)) throw error;
  }
  const r = ready.data;
  const state: Json = {
    system_sections,
    candidates: personal_sections?.flatMap((section) => section.voices) ?? [],
    current: r
      ? {
          id: r.id,
          name: r.draft?.name ?? "",
          destination: r.destination,
          job_id: r.id,
          draft: r.draft,
          compiled: r.compiled,
          identity: r.identity,
          audio_path: r.audio_path,
        }
      : null,
    run: runFromJob(latest.data),
    draft,
    draft_revision: draftRow.data?.revision ?? 0,
    identity,
    expressions: EXPRESSIONS,
    connected: configured,
  };
  if (personal_sections) state.personal_sections = personal_sections;
  return state;
}

// ---------- provider calls (paid stages run once, never retried) ----------
function googleHeaders() {
  return { "x-goog-api-key": apiKey(), "Content-Type": "application/json" };
}

async function failStage(svc: SupabaseClient, id: string, from: string, uncertain: boolean, message: string) {
  const { error } = await svc
    .from("voice_generation_jobs")
    .update({ stage: "error", uncertain, message, deadline_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("stage", from);
  if (error) throw rpcError(error); // persisted deadline remains the recovery path
}

async function createVoiceStage(svc: SupabaseClient, job: Json) {
  const c = job.compiled;
  const body: Json = {
    store: true,
    voice: {
      model: MODEL,
      type: "prompted",
      display_name: (job.draft?.name || "Chronicle voice").slice(0, LIMITS.name),
      prompted: { input: c.voice_description },
    },
  };
  if (c.language) body.voice.language_code = c.language;
  let res: Response;
  try {
    res = await fetch(`${GOOGLE_BASE}/voices`, {
      method: "POST",
      headers: googleHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PAID_FETCH_TIMEOUT_MS),
    });
  } catch {
    return failStage(
      svc,
      job.id,
      "voice_creating",
      true,
      "Voice creation timed out or lost connection. Its outcome is uncertain and it was not retried.",
    );
  }
  if (!res.ok) {
    console.error("[chronicle-voices] voice create failed", res.status, (await res.text()).slice(0, 500));
    return failStage(svc, job.id, "voice_creating", res.status >= 500, `Voice creation failed (${res.status}).`);
  }
  const out = await res.json().catch(() => null);
  const pid = out?.id ?? out?.name?.split("/").pop();
  if (!pid)
    return failStage(svc, job.id, "voice_creating", true, "Provider response did not include a voice identity.");
  // Keep the full provider metadata/expiry, but never store duplicated base64 audio in JSON.
  const { sample_audio: _sample, sampleAudio: _camelSample, ...voice } = out;
  const identity = {
    provider_voice_id: pid,
    record: { voice },
    source: "created",
    model: MODEL,
    display_name: body.voice.display_name,
    language_code: c.language ?? null,
    fingerprint: job.fingerprint,
    created_at: new Date().toISOString(),
  };
  // Persist identity unconditionally (retained even if the job already expired), then advance the checkpoint.
  const saved = await svc
    .from("voice_generation_jobs")
    .update({ provider_voice_id: pid, identity, updated_at: new Date().toISOString() })
    .eq("id", job.id);
  if (saved.error) throw rpcError(saved.error); // Never advance before identity is durable.
  const cached = await svc
    .from("voice_provider_voices")
    .upsert({ id: pid, name: body.voice.display_name, info: voice, fetched_at: new Date().toISOString() });
  if (cached.error) console.error("[chronicle-voices] cache save failed", cached.error.code);
  const advanced = await svc
    .from("voice_generation_jobs")
    .update({
      stage: "voice_ready",
      message: "Voice created. Ready to generate the sample.",
      deadline_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("stage", "voice_creating");
  if (advanced.error) throw rpcError(advanced.error);
}

async function speechStage(svc: SupabaseClient, job: Json) {
  const c = job.compiled;
  const content: Json = { type: "text", text: job.draft?.text ?? "" };
  if (c.delivery_instructions) content.annotations = [{ type: "speech_metadata", style: c.delivery_instructions }];
  const speech: Json = { voice: job.provider_voice_id };
  if (c.language) speech.language = c.language;
  const body = {
    model: MODEL,
    input: [{ type: "user_input", content: [content] }],
    response_format: { type: "audio", mime_type: "audio/wav", sample_rate: 24000 },
    generation_config: { speech_config: [speech] },
    stream: false,
  };
  let res: Response;
  try {
    res = await fetch(`${GOOGLE_BASE}/interactions`, {
      method: "POST",
      headers: googleHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PAID_FETCH_TIMEOUT_MS),
    });
  } catch {
    return failStage(
      svc,
      job.id,
      "speech_running",
      true,
      "Sample generation timed out or lost connection. Its outcome is uncertain and it was not retried.",
    );
  }
  if (!res.ok) {
    console.error("[chronicle-voices] speech failed", res.status, (await res.text()).slice(0, 500));
    return failStage(svc, job.id, "speech_running", res.status >= 500, `Sample generation failed (${res.status}).`);
  }
  let bytes: Uint8Array;
  try {
    bytes = assembleGeneratedWav(await res.json());
  } catch (error) {
    return failStage(
      svc,
      job.id,
      "speech_running",
      false,
      `${error instanceof Error ? error.message : "The recording could not be read."} No automatic retry was made.`,
    );
  }
  const path = `${job.owner_id}/${job.id}.wav`;
  const { error } = await svc.storage
    .from("voice-generation")
    .upload(path, bytes, { contentType: "audio/wav", upsert: true });
  if (error) return failStage(svc, job.id, "speech_running", false, "Generated audio could not be stored.");
  const saved = await svc
    .from("voice_generation_jobs")
    .update({ audio_path: path, updated_at: new Date().toISOString() })
    .eq("id", job.id);
  if (saved.error) throw rpcError(saved.error);
  const ready = await svc
    .from("voice_generation_jobs")
    .update({ stage: "ready", message: "Sample ready", deadline_at: null })
    .eq("id", job.id)
    .eq("stage", "speech_running");
  if (ready.error) throw rpcError(ready.error);
}

function background(p: Promise<unknown>) {
  const safe = p.catch((e) => console.error("[chronicle-voices] background stage error", e?.message));
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(safe);
  else return safe;
}

// ---------- base voices ----------
async function refreshBaseVoices(svc: SupabaseClient) {
  if (!apiKey()) throw new HttpError(503, "Voice provider key is not configured");
  const all: Json[] = [];
  let token = "";
  const deadline = Date.now() + 100_000;
  for (let page = 0; page < 20; page++) {
    const url = new URL(`${GOOGLE_BASE}/voices`);
    url.searchParams.set("page_size", "1000");
    if (token) url.searchParams.set("page_token", token);
    let res: Response;
    if (Date.now() >= deadline)
      throw new HttpError(504, "Voice list request timed out; the saved catalog is unchanged.");
    try {
      res = await fetch(url, {
        headers: googleHeaders(),
        signal: AbortSignal.timeout(Math.min(LIST_TIMEOUT_MS, deadline - Date.now())),
      });
    } catch {
      throw new HttpError(504, "Voice list request timed out");
    }
    if (!res.ok) {
      console.error("[chronicle-voices] list failed", res.status);
      throw new HttpError(502, `Voice list request failed (${res.status})`);
    }
    const body = await res.json().catch(() => ({}));
    all.push(...(body.voices ?? []));
    token = body.nextPageToken ?? body.next_page_token ?? "";
    if (!token) break;
  }
  if (token) throw new HttpError(502, "The full voice list was not returned; the saved cache is unchanged.");
  const rows = all
    .map((v) => ({
      id: String(v.id ?? v.name ?? "")
        .split("/")
        .pop()!,
      name: String(v.displayName ?? v.display_name ?? v.name ?? ""),
      info: v,
      fetched_at: new Date().toISOString(),
    }))
    .filter((r) => r.id);
  if (rows.length) {
    const { error } = await svc.from("voice_provider_voices").upsert(rows, { onConflict: "id" });
    if (error) throw rpcError(error);
  }
}

async function listBaseVoices(svc: SupabaseClient) {
  const { data, error } = await svc.from("voice_provider_voices").select("id,name").order("name").limit(5000);
  if (error) throw rpcError(error);
  const configured = !!apiKey();
  return { connected: configured, voices: data ?? [], configuration: configured ? "configured" : "missing" };
}

// ---------- handler ----------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");
    const url = Deno.env.get("SUPABASE_URL")!;
    const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
    const {
      data: { user: u },
      error: ue,
    } = await user.auth.getUser(auth.slice(7));
    if (ue || !u) throw new HttpError(401, "Invalid session");
    const { data: isAdmin, error: re } = await user.rpc("has_role", { _user_id: u.id, _role: "admin" });
    if (re || isAdmin !== true) throw new HttpError(403, "Admin access required");
    const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const body = await req.json().catch(() => {
      throw new HttpError(400, "Body must be JSON");
    });
    if (!body || typeof body !== "object") throw new HttpError(400, "Body must be a JSON object");
    const action = String(body.action ?? "");
    const mode = body.mode as Mode;
    if (!["catalog", "system", "personal"].includes(mode))
      throw new HttpError(400, "mode must be catalog, system or personal");
    const state = () => buildState(user, svc, u.id, mode);

    switch (action) {
      case "state":
        return reply(await state());

      case "preview": {
        requireAdminMode(mode);
        const c = await compileDraft(body.draft);
        const reuseBase = !!(await baseIdentity(svc, body.draft, c.fingerprint));
        const reuseVoice = !!(await findIdentity(svc, u.id, c.fingerprint));
        return reply({
          voice_description: c.voice_description,
          delivery_instructions: c.delivery_instructions,
          fingerprint: c.fingerprint,
          reuse_voice: reuseVoice,
          reuse_base: reuseBase,
        });
      }

      case "draft-save": {
        const m = requireAdminMode(mode);
        if (body.draft && typeof body.draft === "object") await compileDraft(body.draft); // enforce limits
        return reply(
          await rpc(user, "voice_draft_save", {
            p_mode: m,
            p_draft: body.draft ?? {},
            p_expected_revision: optInt(body.expected_revision, "expected_revision"),
          }),
        );
      }

      case "base-voices":
        requireAdminMode(mode);
        return reply(await listBaseVoices(svc));

      case "base-refresh":
        requireAdminMode(mode);
        await refreshBaseVoices(svc);
        return reply(await listBaseVoices(svc));

      case "base-voice": {
        requireAdminMode(mode);
        const id = reqStr(body.voice, "voice");
        const { data, error } = await svc.from("voice_provider_voices").select("id,info").eq("id", id).maybeSingle();
        if (error) throw rpcError(error);
        if (!data) throw new HttpError(404, "Base voice not found in cache; refresh the list first");
        return reply({ draft: providerVoiceToDraft(data.id, data.info) });
      }

      case "generate": {
        const m = requireAdminMode(mode);
        const destination = body.destination ?? m;
        if (destination !== "system" && destination !== "personal")
          throw new HttpError(400, "destination must be system or personal");
        const key = reqStr(body.idempotency_key, "idempotency_key");
        if (key.length < 8) throw new HttpError(400, "idempotency_key must be at least 8 characters");
        const c = await compileDraft(body.draft);
        if (!c.name) throw new HttpError(400, "Voice name is required");
        if (!c.voice_description) throw new HttpError(400, "Voice description is empty");
        if (!c.text.trim()) throw new HttpError(400, "Sample text is required");
        const newVoice = body.new_voice === true;
        const hash = await sha256(stableStringify({ mode: m, destination, new_voice: newVoice, draft: body.draft }));
        // Idempotent replays must not require the key; only brand-new submissions do.
        const { data: prior, error: priorError } = await svc
          .from("voice_generation_jobs")
          .select("request_hash")
          .eq("owner_id", u.id)
          .eq("idempotency_key", key)
          .maybeSingle();
        if (priorError) throw rpcError(priorError);
        if (!prior && !apiKey()) throw new HttpError(503, "Voice provider key is not configured");
        let identity: Json | null = null;
        if (!prior) {
          identity = await baseIdentity(svc, body.draft, c.fingerprint);
          if (!identity && !newVoice) identity = await findIdentity(svc, u.id, c.fingerprint);
        }
        const compiled = {
          voice_description: c.voice_description,
          delivery_instructions: c.delivery_instructions,
          language: c.language,
          fingerprint: c.fingerprint,
        };
        const sub = await rpc(user, "voice_job_submit", {
          p_mode: m,
          p_destination: destination,
          p_new_voice: newVoice,
          p_key: key,
          p_hash: hash,
          p_draft: body.draft,
          p_compiled: compiled,
          p_fingerprint: c.fingerprint,
          p_identity: identity,
        });
        let job = sub.job;
        if (!sub.existing && job.stage === "queued") {
          const claimed = await rpc(user, "voice_job_claim", {
            p_id: job.id,
            p_from: "queued",
            p_to: "voice_creating",
            p_deadline_seconds: STAGE_DEADLINE_SECONDS,
          });
          if (claimed) {
            job = claimed;
            await background(createVoiceStage(svc, claimed));
          }
        }
        return reply({ ...(await state()), job: runFromJob(job) });
      }

      case "advance": {
        requireAdminMode(mode);
        const id = reqStr(body.id, "id");
        await rpc(user, "voice_job_expire", {});
        const { data: job, error } = await svc
          .from("voice_generation_jobs")
          .select("*")
          .eq("id", id)
          .eq("owner_id", u.id)
          .maybeSingle();
        if (error) throw rpcError(error);
        if (!job) throw new HttpError(404, "Generation not found");
        let current = job;
        if (job.stage === "voice_ready" && !job.discarded_at) {
          if (!apiKey()) throw new HttpError(503, "Voice provider key is not configured");
          const claimed = await rpc(user, "voice_job_claim", {
            p_id: id,
            p_from: "voice_ready",
            p_to: "speech_running",
            p_deadline_seconds: STAGE_DEADLINE_SECONDS,
          });
          if (claimed) {
            current = claimed;
            await background(speechStage(svc, claimed));
          }
        }
        return reply({ ...(await state()), job: runFromJob(current) });
      }

      case "discard":
        requireAdminMode(mode);
        await rpc(user, "voice_job_discard", { p_id: reqStr(body.id, "id") });
        return reply(await state());

      case "commit": {
        const m = requireAdminMode(mode);
        const jobId = body.generation_job_id ?? null;
        const result = await rpc(user, "voice_commit", {
          p_mode: m,
          p_entry_id: jobId ? null : reqStr(body.id, "id"),
          p_expected_revision: jobId ? null : optInt(body.expected_revision, "expected_revision"),
          p_name: body.name,
          p_description: body.description ?? null,
          p_presentation: body.presentation ?? null,
          p_samples: body.samples ?? null,
          p_default_sample_id: body.default_sample_id ?? null,
          p_sample_revision: body.sample_revision ?? null,
          p_job_id: jobId,
        });
        return reply({
          ...(await state()),
          entry: result.entry,
          sample_set: result.sample_set,
          idempotent: result.idempotent,
        });
      }

      case "section-add":
        await rpc(user, "voice_section_add", {
          p_mode: requireAdminMode(mode),
          p_id: body.id ?? null,
          p_label: body.label,
        });
        return reply(await state());
      case "section-update":
        await rpc(user, "voice_section_update", {
          p_mode: requireAdminMode(mode),
          p_id: reqStr(body.id, "id"),
          p_label: body.label,
          p_expected_revision: optInt(body.expected_revision, "expected_revision"),
        });
        return reply(await state());
      case "section-remove":
        await rpc(user, "voice_section_remove", {
          p_mode: requireAdminMode(mode),
          p_id: reqStr(body.id, "id"),
          p_expected_revision: optInt(body.expected_revision, "expected_revision"),
        });
        return reply(await state());
      case "section-move":
        await rpc(user, "voice_section_move", {
          p_mode: requireAdminMode(mode),
          p_id: reqStr(body.id, "id"),
          p_before_id: body.before_id ?? null,
          p_expected_revision: optInt(body.expected_revision, "expected_revision"),
        });
        return reply(await state());
      case "system-move":
        await rpc(user, "voice_entry_move", {
          p_mode: requireAdminMode(mode),
          p_id: reqStr(body.id, "id"),
          p_section_id: reqStr(body.section_id, "section_id"),
          p_before_id: body.before_id ?? null,
          p_expected_revision: optInt(body.expected_revision, "expected_revision"),
        });
        return reply(await state());
      case "system-remove":
      case "remove":
        await rpc(user, "voice_entry_remove", {
          p_mode: requireAdminMode(mode),
          p_id: reqStr(body.id, "id"),
          p_expected_revision: optInt(body.expected_revision, "expected_revision"),
        });
        return reply(await state());

      case "import": {
        requireAdminMode(mode);
        const result = await rpc(user, "voice_import", {
          p_migration_id: reqStr(body.migration_id, "migration_id"),
          p_categories: body.categories ?? [],
          p_entries: body.entries ?? [],
          p_provider_voices: body.provider_voices ?? [],
          p_drafts: body.drafts ?? {},
        });
        return reply(result);
      }

      default:
        throw new HttpError(400, "Unknown action");
    }
  } catch (e) {
    if (e instanceof HttpError) return reply({ error: e.message }, e.status);
    console.error("[chronicle-voices] unhandled", (e as Error)?.message);
    return reply({ error: "Internal error" }, 500);
  }
});
