// Pure prompt compilation for Chronicle voices. Used identically by preview and generate.
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const VOICE_FIELDS: [string, string][] = [
  ["gender", "Voice gender"], ["age", "Perceived age"], ["tone", "Tone"],
  ["characteristics", "Voice characteristics"], ["pitch", "Pitch"], ["pace", "Speaking pace"], ["accent", "Accent"],
];
export const DELIVERY_FIELDS: [string, string][] = [
  ["delivery", "Overall delivery"], ["outward", "Outward personality"], ["inward", "Inward personality"],
  ["conventions", "Text conventions"], ["pronunciation", "Pronunciation guidance"],
];
export const LIMITS = { field: 2000, description: 8000, delivery: 4000, name: 100, text: 60000, custom: 12 };
const LANGUAGE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

function str(v: unknown, label: string, max: number): string {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") throw new HttpError(400, `${label} must be text`);
  if (v.length > max) throw new HttpError(400, `${label} exceeds ${max} characters`);
  return v;
}

/** Accepts flat draft fields, or voice fields nested under draft.voice. */
function source(draft: Record<string, unknown>): Record<string, unknown> {
  const nested = draft.voice && typeof draft.voice === "object" && !Array.isArray(draft.voice)
    ? draft.voice as Record<string, unknown> : {};
  return { ...draft, ...nested };
}

export interface Compiled {
  voice_description: string;
  delivery_instructions: string;
  language: string | null;
  name: string;
  text: string;
  fingerprint: string;
}

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
}

export async function compileDraft(draftIn: unknown): Promise<Compiled> {
  if (!draftIn || typeof draftIn !== "object" || Array.isArray(draftIn)) throw new HttpError(400, "draft must be an object");
  const src = source(draftIn as Record<string, unknown>);
  const parts: string[] = [];
  for (const [k, label] of VOICE_FIELDS) {
    const v = str(src[k], label, LIMITS.field).trim();
    if (v) parts.push(`## ${label}\n${v}`);
  }
  const custom = src.custom ?? [];
  if (!Array.isArray(custom)) throw new HttpError(400, "custom must be a list");
  if (custom.length > LIMITS.custom) throw new HttpError(400, `custom allows at most ${LIMITS.custom} entries`);
  for (const c of custom) {
    if (!c || typeof c !== "object") throw new HttpError(400, "custom entries must be {label,value}");
    const label = str((c as any).label, "Custom label", LIMITS.name).trim();
    const value = str((c as any).value, "Custom value", LIMITS.field).trim();
    if (label && value) parts.push(`## ${label}\n${value}`);
  }
  const additional = str(src.additional, "Additional", LIMITS.description);
  if (additional.trim()) parts.push(additional);
  const voice_description = parts.join("\n\n");
  if (voice_description.length > LIMITS.description) throw new HttpError(400, `Voice description exceeds ${LIMITS.description} characters`);

  const dparts: string[] = [];
  for (const [k, label] of DELIVERY_FIELDS) {
    const v = str(src[k], label, LIMITS.field).trim();
    if (v) dparts.push(`## ${label}\n${v}`);
  }
  const delivery_instructions = dparts.join("\n\n");
  if (delivery_instructions.length > LIMITS.delivery) throw new HttpError(400, `Delivery instructions exceed ${LIMITS.delivery} characters`);

  const langRaw = str(src.language, "Language", 35).trim();
  if (langRaw && !LANGUAGE_RE.test(langRaw)) throw new HttpError(400, "Language must be a known language code (e.g. en-US)");
  const name = str(src.name, "Name", LIMITS.name).trim();
  const text = str(src.text, "Text", LIMITS.text);
  const fingerprint = await sha256(stableStringify({ d: voice_description, l: langRaw || null }));
  return { voice_description, delivery_instructions, language: langRaw || null, name, text, fingerprint };
}

/** Map a provider voice record to a draft. Never infers fields that aren't present as known headings. */
export function providerVoiceToDraft(id: string, info: Record<string, any>): Record<string, unknown> {
  const prompt: string = String(info?.prompted?.input ?? info?.description ?? "");
  const draft: Record<string, unknown> = {
    base_voice_id: id,
    name: String(info?.displayName ?? info?.display_name ?? id).slice(0, LIMITS.name),
  };
  const lang = info?.languageCode ?? info?.language_code;
  if (typeof lang === "string" && LANGUAGE_RE.test(lang)) draft.language = lang;
  const byLabel = new Map(VOICE_FIELDS.map(([k, l]) => [l.toLowerCase(), k]));
  const extra: string[] = [];
  const chunks = prompt.split(/^(?=## )/m);
  for (const chunk of chunks) {
    const m = chunk.match(/^## ([^\n]+)\n?([\s\S]*)$/);
    const key = m ? byLabel.get(m[1].trim().toLowerCase()) : undefined;
    const body = m ? m[2].trim() : "";
    if (key && body && body.length <= LIMITS.field && draft[key] === undefined) draft[key] = body;
    else if (chunk.trim()) extra.push(chunk.trim());
  }
  if (extra.length) draft.additional = extra.join("\n\n").slice(0, LIMITS.description);
  return draft;
}
