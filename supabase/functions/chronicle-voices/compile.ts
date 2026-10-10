// Pure prompt compilation for Chronicle voices. Used identically by preview and generate.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const VOICE_FIELDS: [string, string][] = [
  ["gender", "Voice gender"],
  ["age", "Perceived age"],
  ["tone", "Tone"],
  ["characteristics", "Voice characteristics"],
  ["pitch", "Pitch"],
  ["pace", "Speaking pace"],
  ["accent", "Accent"],
];
export const DELIVERY_FIELDS: [string, string][] = [
  ["delivery", "Overall delivery"],
  ["outward", "Outward personality"],
  ["inward", "Inward personality"],
  ["conventions", "Text conventions"],
  ["pronunciation", "Pronunciation guidance"],
];
export const LIMITS = { field: 2000, description: 8000, delivery: 4000, name: 100, text: 60000, custom: 12 };
export const LANGUAGES: Record<string, string> = {
  "": "Automatic",
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "it-IT": "Italian",
  "pt-BR": "Portuguese (Brazil)",
  "ja-JP": "Japanese",
  "ko-KR": "Korean",
  "hi-IN": "Hindi",
  "ar-XA": "Arabic",
  "zh-CN": "Mandarin Chinese",
};
export const EXPRESSIONS = [
  "argh",
  "breath",
  "heavy breath",
  "exhales",
  "cackle",
  "cheer",
  "chuckle",
  "chuckles",
  "cough",
  "cry",
  "gasp",
  "giggle",
  "groan",
  "growl",
  "grunt",
  "grr",
  "hiss",
  "laugh",
  "laughter",
  "moan",
  "pant",
  "pff",
  "phew",
  "scream",
  "shout",
  "shriek",
  "sigh",
  "sighs",
  "sneeze",
  "snicker",
  "snort",
  "sob",
  "throat-clearing",
  "tsk",
  "whimper",
  "whispers",
  "whispering",
  "yawn",
];

function str(v: unknown, label: string, max: number): string {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") throw new HttpError(400, `${label} must be text`);
  if (v.length > max) throw new HttpError(400, `${label} exceeds ${max} characters`);
  return v;
}

/** Accepts flat draft fields, or voice fields nested under draft.voice. */
function source(draft: Record<string, unknown>): Record<string, unknown> {
  const nested =
    draft.voice && typeof draft.voice === "object" && !Array.isArray(draft.voice)
      ? (draft.voice as Record<string, unknown>)
      : {};
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
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .filter((k) => o[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(",")}}`;
}

export async function compileDraft(draftIn: unknown): Promise<Compiled> {
  if (!draftIn || typeof draftIn !== "object" || Array.isArray(draftIn))
    throw new HttpError(400, "draft must be an object");
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
    const label = str((c as any).label, "Custom label", 80).trim();
    const value = str((c as any).value, "Custom value", LIMITS.field).trim();
    if (value) parts.push(`## ${label || "Additional characteristic"}\n${value}`);
  }
  const langRaw = str(src.language, "Language", 40).trim();
  if (!Object.hasOwn(LANGUAGES, langRaw)) throw new HttpError(400, "Choose a language from the list.");
  if (langRaw) parts.push(`## Language\n${LANGUAGES[langRaw]}`);
  const additional = str(src.additional, "Additional", LIMITS.description).trim();
  if (additional) parts.push(additional);
  const voice_description = parts.join("\n\n");
  if (voice_description.length > LIMITS.description)
    throw new HttpError(400, `Voice description exceeds ${LIMITS.description} characters`);

  const dparts: string[] = [];
  for (const [k, label] of DELIVERY_FIELDS) {
    const v = str(src[k], label, LIMITS.field).trim();
    if (v) dparts.push(`## ${label}\n${v}`);
  }
  const delivery_instructions = dparts.join("\n\n");
  if (delivery_instructions.length > LIMITS.delivery)
    throw new HttpError(400, `Delivery instructions exceed ${LIMITS.delivery} characters`);

  const name = str(src.name, "Name", LIMITS.name).trim();
  const text = str(src.text, "Text", LIMITS.text);
  str(src.base_voice_id, "Base voice", 128);
  // Preserve the lab's Python json.dumps identity exactly, including Unicode
  // escaping and separators, so migration never creates a replacement voice.
  const legacyJson =
    "[" +
    [voice_description, langRaw, "gemini-3.8-flash-tts"]
      .map((v) =>
        JSON.stringify(v).replace(/[\u007f-\uffff]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0")),
      )
      .join(", ") +
    "]";
  const fingerprint = await sha256(legacyJson);
  return { voice_description, delivery_instructions, language: langRaw || null, name, text, fingerprint };
}

/** Map a provider voice record to a draft. Never infers fields that aren't present as known headings. */
export function providerVoiceToDraft(id: string, info: Record<string, any>): Record<string, unknown> {
  const prompt: string = String(info?.prompted?.input ?? "");
  const draft: Record<string, unknown> = {
    base_voice_id: id,
    name: str(info?.displayName ?? info?.display_name ?? id, "Voice name", LIMITS.name),
    custom: [],
  };
  const lang = info?.languageCode ?? info?.language_code;
  const byLabel = new Map(VOICE_FIELDS.map(([k, l]) => [l.toLowerCase(), k]));
  for (const [label, key] of Object.entries({
    gender: "gender",
    age: "age",
    "vocal tone": "tone",
    characteristics: "characteristics",
    pace: "pace",
  }))
    byLabel.set(label, key);
  const extra: string[] = [];
  const chunks = prompt.split(/^(?=## )/m);
  for (const chunk of chunks) {
    const m = chunk.match(/^## ([^\n]+)\n?([\s\S]*)$/);
    const key = m ? byLabel.get(m[1].trim().toLowerCase()) : undefined;
    const body = m ? m[2].trim() : "";
    if (key && body && body.length <= LIMITS.field && draft[key] === undefined) draft[key] = body;
    else if (m && m[1].trim().toLowerCase() === "language" && Object.values(LANGUAGES).includes(body))
      draft.language = Object.keys(LANGUAGES).find((k) => LANGUAGES[k] === body);
    else if (chunk.trim()) extra.push(chunk.trim());
  }
  for (const key of ["gender", "pitch", "accent"])
    if (info[key] && !draft[key]) draft[key] = str(String(info[key]), key, LIMITS.field);
  if (lang && !draft.language) {
    if (Object.hasOwn(LANGUAGES, lang)) draft.language = lang;
    else extra.push("Language: " + String(lang));
  }
  for (const key of ["description", "persona", "context", "region_code"])
    if (info[key] && !prompt.includes(String(info[key]))) {
      const label = key.replaceAll("_", " ");
      extra.push(label[0].toUpperCase() + label.slice(1) + ": " + String(info[key]));
    }
  if (extra.length) draft.additional = str(extra.join("\n\n"), "Additional voice details", LIMITS.description);
  return draft;
}
