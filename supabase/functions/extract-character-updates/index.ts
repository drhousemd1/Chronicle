import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// GROK ONLY -- All AI calls use xAI Grok. No Gemini. No OpenAI.

interface CharacterGoalData {
  title: string;
  desiredOutcome?: string;
  currentStatus: string;
  progress: number;
  flexibility?: "rigid" | "normal" | "flexible";
  steps?: Array<{ id: string; description: string; completed: boolean }>;
}

interface CharacterData {
  name: string;
  previousNames?: string[];
  nicknames?: string;
  age?: string;
  sexType?: string;
  sexualOrientation?: string;
  roleDescription?: string;
  physicalAppearance?: Record<string, string>;
  currentlyWearing?: Record<string, string>;
  preferredClothing?: Record<string, string>;
  location?: string;
  scenePosition?: string;
  currentMood?: string;
  goals?: CharacterGoalData[];
  customSections?: Array<{ title: string; items: Array<{ label: string; value: string }> }>;
  // New sections
  background?: Record<string, string>;
  personality?: {
    splitMode?: boolean;
    traits?: Array<{ label: string; value: string } | string>;
    outwardTraits?: Array<{ label: string; value: string }>;
    inwardTraits?: Array<{ label: string; value: string }>;
    miscellaneous?: string;
    secrets?: string;
    fears?: string;
    kinksFantasies?: string;
    desires?: string;
  };
  tone?: { _extras?: Array<{ label: string; value: string }> };
  keyLifeEvents?: { _extras?: Array<{ label: string; value: string }> };
  relationships?: { _extras?: Array<{ label: string; value: string }> };
  secrets?: { _extras?: Array<{ label: string; value: string }> };
  fears?: { _extras?: Array<{ label: string; value: string }> };
}

interface ExtractedUpdate {
  character: string;
  field: string;
  value: string;
  evidence?: string;
  confidence?: number;
  candidateIndex?: number;
  supersededCandidateIndexes?: number[];
}

const characterUpdateResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "chronicle_character_updates",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        updates: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              character: { type: "string" },
              field: { type: "string" },
              value: { type: "string" },
              evidence: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["character", "field", "value", "evidence", "confidence"],
          },
        },
      },
      required: ["updates"],
    },
  },
};

type CharacterIndex = {
  map: Map<string, CharacterData>;
  ambiguous: Set<string>;
}

type CandidateReview = {
  index: number;
  accepted: boolean;
  reason: string;
  character: string;
  originalCharacter?: string;
  field: string;
  value: string;
  evidence: string;
  confidence: number;
}

function clampConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function summarize(value: unknown, max = 320): string {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeEvidence(value: unknown, max = 320): string {
  return summarize(value, max)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^evidence\s*:\s*/i, "")
    .trim();
}

function isGenericEvidence(value: string): boolean {
  const normalized = normalizeEvidence(value).toLowerCase();
  return !normalized ||
    /^(short quote|close paraphrase|supported by|evidence from|latest exchange|short exchange evidence|brief evidence|model evidence)/i.test(normalized) ||
    normalized.includes("from this exchange");
}

function normalizeEvidenceForMatching(value: unknown): string {
  return String(value || "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/[*_`~()[\]{}<>]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceAppearsInLatestExchange(evidence: string, latestExchangeText: string): boolean {
  const normalizedEvidence = normalizeEvidenceForMatching(evidence);
  if (normalizedEvidence.length < 6) return false;
  return normalizeEvidenceForMatching(latestExchangeText).includes(normalizedEvidence);
}

function sanitizeCurrentMood(value: string): string {
  const cleaned = value
    .replace(/[*"()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";

  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  const limited = firstSentence.split(/\s+/).slice(0, 12).join(" ");
  const forbiddenPattern = /\b(foot|feet|toe|toes|thigh|hips?|breast|boob|cock|penis|pussy|ass|butt|bed|door|shirt|shorts|thong|bra|moves?|moving|walks?|walking|leans?|leaning|touches?|touching|presses?|pressing|curls?|curling|kneads?|kneading|whispers?|whispering|kisses?|kissing)\b/i;
  return forbiddenPattern.test(limited) ? "" : limited;
}

function isAllowedUpdateField(field: string): boolean {
  if (["age", "sexType", "sexualOrientation", "roleDescription", "location", "scenePosition", "currentMood", "nicknames"].includes(field)) return true;
  if (field.startsWith("goals.")) return true;
  if (field.startsWith("sections.")) {
    const sectionTitle = field.split(".")[1]?.trim().toLowerCase();
    return sectionTitle !== "goals" && sectionTitle !== "goal";
  }
  if (!field.includes(".")) return false;

  const [parent, child] = field.split(".");
  if (!parent || !child) return false;

  if (parent === "physicalAppearance" || parent === "currentlyWearing" || parent === "preferredClothing" || parent === "background") {
    return true;
  }
  if (parent === "personality") {
    return ["traits", "outwardTraits", "inwardTraits", "splitMode", "miscellaneous", "secrets", "fears", "kinksFantasies", "desires"].includes(child);
  }
  if (["tone", "keyLifeEvents", "relationships", "secrets", "fears"].includes(parent)) {
    return child === "_extras";
  }
  return false;
}

function isAllowedUpdateValue(field: string, value: string): boolean {
  if (field.startsWith("goals.") && value.trim().toUpperCase() === "REMOVE") return false;
  return true;
}

function normalizeUpdateCandidate(candidate: any, latestExchangeText: string): ExtractedUpdate | null {
  if (
    typeof candidate?.character !== "string" ||
    typeof candidate?.field !== "string" ||
    typeof candidate?.value !== "string"
  ) {
    return null;
  }

  const character = candidate.character.trim();
  const field = candidate.field.trim();
  const value = candidate.value.trim();
  const evidence = normalizeEvidence(candidate.evidence, 280);
  const confidence = clampConfidence(candidate.confidence);

  if (!character || !field || !value) return null;
  if (!isAllowedUpdateField(field) || !isAllowedUpdateValue(field, value)) return null;
  if (!evidence || isGenericEvidence(evidence) || confidence < 0.72) return null;
  if (!evidenceAppearsInLatestExchange(evidence, latestExchangeText)) return null;

  if (field === "currentMood") {
    const sanitizedMood = sanitizeCurrentMood(value);
    if (!sanitizedMood) return null;
    return { character, field, value: sanitizedMood, evidence, confidence };
  }

  return { character, field, value, evidence, confidence };
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  const STOP = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "by", "at", "from", "is", "are"]);
  return new Set(normalizeText(value).split(/\s+/).filter(t => t && !STOP.has(t)));
}

function tokenSimilarity(a: string, b: string): number {
  const aSet = tokenSet(a);
  const bSet = tokenSet(b);
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let overlap = 0;
  for (const t of aSet) {
    if (bSet.has(t)) overlap += 1;
  }
  return overlap / Math.max(aSet.size, bSet.size);
}

function noveltyRatio(existing: string, incoming: string): number {
  const existingSet = tokenSet(existing);
  const incomingSet = tokenSet(incoming);
  if (incomingSet.size === 0) return 0;
  let novel = 0;
  for (const t of incomingSet) {
    if (!existingSet.has(t)) novel += 1;
  }
  return novel / incomingSet.size;
}

function isMeaningfulRefinement(existing: string, incoming: string): boolean {
  const oldText = (existing || "").trim();
  const newText = (incoming || "").trim();
  if (!newText) return false;
  if (!oldText) return true;

  const similarity = tokenSimilarity(oldText, newText);
  if (similarity < 0.72) return true;

  const novelty = noveltyRatio(oldText, newText);
  return newText.length >= oldText.length * 1.12 && novelty >= 0.20;
}

function parseLabeledValue(value: string): { label: string; description: string } | null {
  const idx = value.indexOf(":");
  if (idx <= 0) return null;
  const label = value.slice(0, idx).trim();
  const description = value.slice(idx + 1).trim();
  if (!label || !description) return null;
  return { label, description };
}

function findBestExistingMatch(
  existingEntries: Array<{ label: string; value: string }>,
  nextLabel: string,
  nextDescription: string
): { index: number; exact: boolean } {
  const normalizedNextLabel = normalizeText(nextLabel);
  let bestIdx = -1;
  let bestScore = 0;
  const exact = false;

  for (let i = 0; i < existingEntries.length; i += 1) {
    const entry = existingEntries[i];
    const normalizedExistingLabel = normalizeText(entry.label || "");
    if (normalizedExistingLabel && normalizedExistingLabel === normalizedNextLabel) {
      return { index: i, exact: true };
    }
    const labelScore = tokenSimilarity(entry.label || "", nextLabel);
    const valueScore = tokenSimilarity(entry.value || "", nextDescription);
    const combinedScore = tokenSimilarity(`${entry.label || ""} ${entry.value || ""}`, `${nextLabel} ${nextDescription}`);
    const score = Math.max(labelScore, valueScore, combinedScore);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  if (bestScore >= 0.72) {
    return { index: bestIdx, exact };
  }
  return { index: -1, exact: false };
}

function getExistingStructuredEntries(character: CharacterData, field: string): Array<{ label: string; value: string }> {
  if (!field.includes(".")) return [];
  const [parent, child] = field.split(".");

  if (parent === "personality" && ["traits", "outwardTraits", "inwardTraits"].includes(child)) {
    const traits = (character.personality as any)?.[child];
    if (!Array.isArray(traits)) return [];
    return traits
      .map((t: any) => {
        if (typeof t === "string") {
          const parsed = parseLabeledValue(t);
          return parsed
            ? { label: parsed.label, value: parsed.description }
            : { label: t.trim(), value: t.trim() };
        }
        return { label: String(t?.label || "").trim(), value: String(t?.value || "").trim() };
      })
      .filter(t => t.label && t.value);
  }

  if (["tone", "keyLifeEvents", "relationships", "secrets", "fears"].includes(parent) && child === "_extras") {
    const extras = (character as any)?.[parent]?._extras;
    if (!Array.isArray(extras)) return [];
    return extras
      .map((e: any) => ({ label: String(e?.label || "").trim(), value: String(e?.value || "").trim() }))
      .filter(e => e.label && e.value);
  }

  return [];
}

function isLikelyToneDescription(description: string): boolean {
  return /\b(voice|tone|speaks?|speech|word(?: choice)?|vocab(?:ulary)?|cadence|rhythm|formal|informal|direct|indirect|clipped|hesitant|quiet|loud|whisper(?:ed|ing)?|sarcastic|blunt|polite|curt|warm)\b/i.test(description);
}

function buildCharacterIndex(characters: CharacterData[]): CharacterIndex {
  const map = new Map<string, CharacterData>();
  const ambiguous = new Set<string>();
  const register = (key: string, character: CharacterData) => {
    const normalizedKey = key.toLowerCase().trim();
    if (!normalizedKey || ambiguous.has(normalizedKey)) return;

    const existing = map.get(normalizedKey);
    if (existing && existing.name !== character.name) {
      map.delete(normalizedKey);
      ambiguous.add(normalizedKey);
      return;
    }

    map.set(normalizedKey, character);
  };

  for (const c of characters || []) {
    const primary = c.name?.trim?.();
    if (primary) register(primary, c);
    for (const alias of c.previousNames || []) {
      const a = alias?.trim?.();
      if (a) register(a, c);
    }
    for (const nick of (c.nicknames || "").split(",")) {
      const n = nick.trim();
      if (n) register(n, c);
    }
  }
  return { map, ambiguous };
}

function reconcileStructuredUpdates(
  updates: ExtractedUpdate[],
  characters: CharacterData[]
): ExtractedUpdate[] {
  const charIndex = buildCharacterIndex(characters);
  const accepted: ExtractedUpdate[] = [];

  for (const update of updates) {
    const characterKey = update.character.toLowerCase().trim();
    if (charIndex.ambiguous.has(characterKey)) {
      continue;
    }

    const existingChar = charIndex.map.get(characterKey) || null;
    if (!existingChar) {
      continue;
    }
    const normalizedUpdate = { ...update, character: existingChar.name };

    const structuredField =
      ["personality.traits", "personality.outwardTraits", "personality.inwardTraits"].includes(normalizedUpdate.field) ||
      ["tone._extras", "keyLifeEvents._extras", "relationships._extras", "secrets._extras", "fears._extras"].includes(normalizedUpdate.field);

    if (!structuredField) {
      accepted.push(normalizedUpdate);
      continue;
    }

    const parsed = parseLabeledValue(normalizedUpdate.value);
    if (!parsed) {
      // Force structured fields to stay structured.
      continue;
    }

    if (normalizedUpdate.field === "tone._extras" && !isLikelyToneDescription(parsed.description)) {
      continue;
    }

    const existingEntries = getExistingStructuredEntries(existingChar, normalizedUpdate.field);
    const match = findBestExistingMatch(existingEntries, parsed.label, parsed.description);

    if (match.index !== -1) {
      const existing = existingEntries[match.index];
      if (!isMeaningfulRefinement(existing.value, parsed.description)) {
        continue;
      }
      accepted.push({
        ...normalizedUpdate,
        // Preserve the existing label to avoid variant-label duplication.
        value: `${existing.label}: ${parsed.description}`
      });
      continue;
    }

    // Also suppress duplicates introduced earlier in the same extraction payload.
    const sameFieldAccepted = accepted.filter(a =>
      a.character.toLowerCase() === normalizedUpdate.character.toLowerCase() && a.field === normalizedUpdate.field
    );
    const priorEntries = sameFieldAccepted
      .map(a => parseLabeledValue(a.value))
      .filter((x): x is { label: string; description: string } => Boolean(x))
      .map(x => ({ label: x.label, value: x.description }));

    const priorMatch = findBestExistingMatch(priorEntries, parsed.label, parsed.description);
    if (priorMatch.index !== -1) {
      const existing = priorEntries[priorMatch.index];
      if (!isMeaningfulRefinement(existing.value, parsed.description)) {
        continue;
      }
      // Replace prior accepted variant with refined single entry.
      const replaceIdx = accepted.findIndex(a =>
        a.character.toLowerCase() === normalizedUpdate.character.toLowerCase() &&
        a.field === normalizedUpdate.field &&
        normalizeText(a.value.split(":")[0] || "") === normalizeText(existing.label)
      );
      if (replaceIdx !== -1) {
        const supersededCandidateIndexes = [
          ...(accepted[replaceIdx].supersededCandidateIndexes || []),
          ...(typeof accepted[replaceIdx].candidateIndex === "number" ? [accepted[replaceIdx].candidateIndex] : []),
        ];
        const existingLabel = accepted[replaceIdx].value.split(":")[0].trim();
        accepted[replaceIdx] = {
          ...normalizedUpdate,
          value: `${existingLabel}: ${parsed.description}`,
          supersededCandidateIndexes,
        };
        continue;
      }
    }

    accepted.push(normalizedUpdate);
  }

  return accepted;
}

function getCandidateRejectionReason(
  candidate: any,
  charIndex: CharacterIndex,
  options: { disallowGoals?: boolean; latestExchangeText?: string } = {},
): string {
  if (
    typeof candidate?.character !== "string" ||
    typeof candidate?.field !== "string" ||
    typeof candidate?.value !== "string"
  ) {
    return "invalid_candidate_shape";
  }

  const character = candidate.character.trim();
  const field = candidate.field.trim();
  const value = candidate.value.trim();
  const evidence = normalizeEvidence(candidate.evidence, 280);
  const confidence = clampConfidence(candidate.confidence);

  if (!character || !field || !value) return "missing_required_value";
  const characterKey = character.toLowerCase();
  if (charIndex.ambiguous.has(characterKey)) return "ambiguous_character_alias";
  if (!charIndex.map.has(characterKey)) return "unknown_character";
  if (!isAllowedUpdateField(field)) return "unsupported_field";
  if (!isAllowedUpdateValue(field, value)) return "unsupported_value";
  if (options.disallowGoals && field.startsWith("goals.")) return "goals_disabled_in_safe_retry";
  if (!evidence || isGenericEvidence(evidence)) return "missing_evidence";
  if (!evidenceAppearsInLatestExchange(evidence, options.latestExchangeText || "")) return "evidence_not_in_latest_exchange";
  if (confidence < 0.72) return "low_confidence";
  if (field === "currentMood" && !sanitizeCurrentMood(value)) return "invalid_current_mood";
  return "filtered_by_state_guard";
}

function reviewUpdateCandidates(
  rawCandidates: any[],
  characters: CharacterData[],
  options: { disallowGoals?: boolean; latestExchangeText?: string } = {},
): { updates: ExtractedUpdate[]; candidateReviews: CandidateReview[]; rejectedCandidates: CandidateReview[] } {
  const charIndex = buildCharacterIndex(characters);
  const normalizedCandidates: Array<{
    index: number;
    raw: any;
    normalized: ExtractedUpdate | null;
    preRejectionReason: string;
  }> = rawCandidates.map((candidate, index) => {
    const normalized = normalizeUpdateCandidate(candidate, options.latestExchangeText || "");
    const disallowedByOptions = normalized && options.disallowGoals && normalized.field.startsWith("goals.");
    return {
      index,
      raw: candidate,
      normalized: normalized && !disallowedByOptions ? { ...normalized, candidateIndex: index } : null,
      preRejectionReason: !normalized || disallowedByOptions
        ? getCandidateRejectionReason(candidate, charIndex, options)
        : "",
    };
  });

  const reconciledUpdates = reconcileStructuredUpdates(
    normalizedCandidates
      .map((candidate) => candidate.normalized)
      .filter((candidate): candidate is ExtractedUpdate => Boolean(candidate)),
    characters,
  );
  const acceptedIndexes = new Set(
    reconciledUpdates
      .map((update) => update.candidateIndex)
      .filter((index): index is number => typeof index === "number"),
  );
  const acceptedByIndex = new Map(
    reconciledUpdates
      .filter((update) => typeof update.candidateIndex === "number")
      .map((update) => [update.candidateIndex as number, update]),
  );
  const supersededIndexes = new Set(
    reconciledUpdates.flatMap((update) => update.supersededCandidateIndexes || []),
  );

  const candidateReviews = normalizedCandidates.map((candidate): CandidateReview => {
    const normalized = candidate.normalized;
    const raw = candidate.raw && typeof candidate.raw === "object" ? candidate.raw : {};
    const accepted = acceptedIndexes.has(candidate.index);
    const acceptedUpdate = acceptedByIndex.get(candidate.index);
    const rejectionReason = candidate.preRejectionReason ||
      (supersededIndexes.has(candidate.index) ? "superseded_by_refinement" : getCandidateRejectionReason(candidate.raw, charIndex, options));
    const originalCharacter = String(raw.character ?? "");
    const resolvedCharacter = acceptedUpdate?.character ?? normalized?.character ?? originalCharacter;
    return {
      index: candidate.index,
      accepted,
      reason: accepted ? "accepted" : rejectionReason,
      character: String(resolvedCharacter),
      ...(accepted && originalCharacter && originalCharacter !== resolvedCharacter ? { originalCharacter } : {}),
      field: String(normalized?.field ?? raw.field ?? ""),
      value: String(normalized?.value ?? raw.value ?? ""),
      evidence: normalizeEvidence(normalized?.evidence ?? raw.evidence, 280),
      confidence: clampConfidence(normalized?.confidence ?? raw.confidence),
    };
  });

  const updates = reconciledUpdates.map(({
    candidateIndex: _candidateIndex,
    supersededCandidateIndexes: _supersededCandidateIndexes,
    ...update
  }) => update);
  return {
    updates,
    candidateReviews,
    rejectedCandidates: candidateReviews.filter((review) => !review.accepted),
  };
}

function buildMalformedCandidateReview(reason: string, content: string): CandidateReview {
  return {
    index: 0,
    accepted: false,
    reason,
    character: "",
    field: "",
    value: summarize(content, 260),
    evidence: "",
    confidence: 0,
  };
}

function buildCharacterStateBlock(c: CharacterData): string {
  const formatTraitEntry = (trait: unknown): string => {
    if (typeof trait === "string") {
      const trimmed = trait.trim();
      return trimmed ? `- ${trimmed}` : "";
    }
    if (trait && typeof trait === "object") {
      const record = trait as { label?: unknown; value?: unknown };
      const label = String(record.label || "").trim();
      const value = String(record.value || "").trim();
      if (label && value) return `- ${label}: ${value}`;
      if (label) return `- ${label}`;
      if (value) return `- ${value}`;
    }
    return "";
  };

  const formatRecord = (record: Record<string, any> | undefined): string[] => {
    if (!record) return [];
    const lines: string[] = [];
    for (const [key, rawValue] of Object.entries(record)) {
      if (key === "_extras") continue;
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (value) lines.push(`- ${key}: ${value}`);
    }
    const extras = (record as any)._extras;
    if (Array.isArray(extras)) {
      for (const entry of extras) {
        const label = String(entry?.label || "").trim();
        const value = String(entry?.value || "").trim();
        if (label || value) lines.push(`- ${label || "Extra"}: ${value || "(empty)"}`);
      }
    }
    return lines;
  };

  const formatExtras = (section: { _extras?: Array<{ label: string; value: string }> } | undefined): string[] => {
    if (!Array.isArray(section?._extras)) return [];
    return section!._extras!
      .map((entry) => {
        const label = String(entry?.label || "").trim();
        const value = String(entry?.value || "").trim();
        return label || value ? `- ${label || "Entry"}: ${value || "(empty)"}` : "";
      })
      .filter(Boolean);
  };

  const appendBlock = (lines: string[], title: string, entries: string[]) => {
    lines.push(`--- ${title} ---`);
    lines.push(entries.length ? entries.join("\n") : "(empty)");
  };

  const lines: string[] = [];
  lines.push(`## ${c.name}`);

  if (c.previousNames?.length) {
    lines.push(`Previously known as: ${c.previousNames.join(", ")}`);
  }
  if (c.nicknames) {
    lines.push(`Nicknames: ${c.nicknames}`);
  }
  appendBlock(lines, "Core details", [
    `- age: ${c.age || "(empty)"}`,
    `- sexType: ${c.sexType || "(empty)"}`,
    `- sexualOrientation: ${c.sexualOrientation || "(empty)"}`,
    `- roleDescription: ${c.roleDescription || "(empty)"}`,
  ]);

  appendBlock(lines, "Current state", [
    `- currentMood: ${c.currentMood || "(empty)"}`,
    `- location: ${c.location || "(empty)"}`,
    `- scenePosition: ${c.scenePosition || "(empty)"}`,
  ]);
  appendBlock(lines, "Physical appearance", formatRecord(c.physicalAppearance));
  appendBlock(lines, "Currently wearing", formatRecord(c.currentlyWearing));
  appendBlock(lines, "Preferred clothing", formatRecord(c.preferredClothing));
  appendBlock(lines, "Background", formatRecord(c.background));

  if (c.personality?.splitMode) {
    appendBlock(lines, "Personality outward traits", (c.personality.outwardTraits || []).map(formatTraitEntry).filter(Boolean));
    appendBlock(lines, "Personality inward traits", (c.personality.inwardTraits || []).map(formatTraitEntry).filter(Boolean));
  } else if (Array.isArray(c.personality?.traits)) {
    appendBlock(lines, "Personality traits", c.personality.traits.map(formatTraitEntry).filter(Boolean));
  } else if (c.personality) {
    appendBlock(lines, "Personality", Object.entries(c.personality).map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(", ") : value}`).filter(Boolean));
  }

  const sidePersonalityDetails = [
    ["miscellaneous", c.personality?.miscellaneous],
    ["secrets", c.personality?.secrets],
    ["fears", c.personality?.fears],
    ["kinksFantasies", c.personality?.kinksFantasies],
    ["desires", c.personality?.desires],
  ]
    .map(([key, value]) => String(value || "").trim() ? `- ${key}: ${String(value).trim()}` : "")
    .filter(Boolean);
  if (sidePersonalityDetails.length) {
    appendBlock(lines, "Personality details", sidePersonalityDetails);
  }

  const extrasOnlySections: Array<{ key: keyof CharacterData; title: string }> = [
    { key: "tone", title: "Tone" },
    { key: "keyLifeEvents", title: "Key life events" },
    { key: "relationships", title: "Relationships" },
    { key: "secrets", title: "Secrets" },
    { key: "fears", title: "Fears" },
  ];
  for (const { key, title } of extrasOnlySections) {
    appendBlock(lines, title, formatExtras(c[key] as { _extras?: Array<{ label: string; value: string }> } | undefined));
  }

  if (c.goals?.length) {
    lines.push(`--- Character goals ---`);
    for (const g of c.goals) {
      const outcome = g.desiredOutcome ? `desired_outcome: ${g.desiredOutcome}` : "";
      const flexibility = g.flexibility ? ` | guidance_strength: ${g.flexibility}` : "";
      lines.push(`- ${g.title}: ${outcome} | current_status: ${g.currentStatus || "(empty)"} | progress: ${g.progress || 0}%${flexibility}`);
      if (g.steps?.length) {
        for (const [index, step] of g.steps.entries()) {
          lines.push(`  ${step.completed ? "[x]" : "[ ]"} Step ${index + 1}: ${step.description}`);
        }
      }
    }
  } else {
    appendBlock(lines, "Character goals", []);
  }

  if (c.customSections?.length) {
    for (const section of c.customSections) {
      appendBlock(lines, `Custom section: ${section.title}`, (section.items || []).map(item => `- ${item.label}: ${item.value}`).filter(Boolean));
    }
  }

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { userMessage, aiResponse, recentContext, characters, modelId, eligibleCharacters, currentDay, currentTimeOfDay, debugTrace = false } = await req.json();
    
    if (!userMessage && !aiResponse) {
      return new Response(
        JSON.stringify({ error: 'Either userMessage or aiResponse is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build character state blocks — only for eligible characters if provided
    const eligibleSet = eligibleCharacters ? new Set((eligibleCharacters as string[]).map((n: string) => n.toLowerCase())) : null;
    const filteredCharacters = eligibleSet 
      ? (characters || []).filter((c: CharacterData) => eligibleSet.has(c.name.toLowerCase()))
      : (characters || []);
    const characterContext = filteredCharacters.map((c: CharacterData) => buildCharacterStateBlock(c)).join('\n\n');

    // Build eligible character constraint for prompt
    const eligibleConstraint = eligibleSet 
      ? `\n\nELIGIBLE CHARACTERS (ONLY emit updates for these — ignore all others):\n${[...eligibleSet].join(', ')}\n`
      : '';

    const storyClock = currentDay != null || currentTimeOfDay
      ? `Day: ${currentDay ?? 'unknown'}\nTime of Day: ${currentTimeOfDay ?? 'unknown'}`
      : 'Day: unknown\nTime of Day: unknown';

    const supportedFields = `
Top-level fields:
- age
- sexType
- sexualOrientation
- roleDescription
- nicknames
- location
- scenePosition
- currentMood

Nested detail fields:
- physicalAppearance.* and physicalAppearance._extras
- currentlyWearing.* and currentlyWearing._extras
- preferredClothing.* and preferredClothing._extras
- background.* and background._extras

Structured sections:
- personality.traits
- personality.outwardTraits
- personality.inwardTraits
- personality.splitMode
- personality.miscellaneous
- personality.secrets
- personality.fears
- personality.kinksFantasies
- personality.desires
- tone._extras
- keyLifeEvents._extras
- relationships._extras
- secrets._extras
- fears._extras
- sections.SectionTitle.ItemLabel

Character goals:
- goals.GoalTitle`;

    const systemPrompt = `You are the post-turn CHARACTER STATE SYNC worker for an adult roleplay app. Your job is to compare the latest exchange against the current saved character cards and return only supported field updates that materially changed.

--- CURRENT STORY CLOCK ---
${storyClock}

The app code owns timestamps. Do not invent day/time metadata. If an accepted update is saved, the backend will stamp it with the current story clock and source message/generation.

${eligibleConstraint}
--- CURRENT CHARACTER STATE ---
${characterContext || 'No eligible character data provided'}

--- SUPPORTED FIELD PATHS ---
${supportedFields}

--- CORE TASK ---
- Review the latest exchange against every supported field for each eligible character.
- Treat user-established facts and mutually visible outcomes as stronger evidence than unsupported assistant-only assumptions.
- Return an update only when the latest exchange directly supports a material change to a supported field.
- Use recent context only to confirm continuity or conflict with the proposed update.
- If the only support is an assistant-generated assumption that conflicts with current saved state, physical continuity, or the user's latest message, omit the update.
- Return no update when the existing card is still accurate, the evidence is weak, or the proposed value only rewords existing information.
- Use the real field path from SUPPORTED FIELD PATHS. Never create fake containers such as sections.Goals.* when goals.* exists.
- Preserve current card information unless the latest exchange gives a clear reason to change it.
- Every returned update must include a short exact phrase from the latest exchange as evidence and a confidence score from 0 to 1. If you cannot quote the exchange text that supports the change, omit the update.

--- FIELD GUIDANCE ---
- currentMood: emotional/psychological state only, max 12 words. No body-part prose, clothing, objects, or action sequences.
- location: broad place only. Do not change location to a destination merely because it was seen, mentioned, chosen, or approached. Update it only when the exchange clearly establishes that the character has actually arrived in, entered, left, or relocated to a different broad place.
- scenePosition: short factual snapshot of the character's immediate physical situation inside the current location. Update it whenever the latest exchange materially changes that immediate situation, even if the broad location stays the same. Do not leave it blank when the latest exchange establishes a new physical state.
- appearance/clothing/background: update when the exchange explicitly reveals or changes the fact.
- personality/tone/relationships/secrets/fears/keyLifeEvents: write "Label: Description" as the value. Prefer refining a matching existing entry over adding a duplicate.
- custom sections: use sections.SectionTitle.ItemLabel only when the information belongs in an existing or clearly appropriate custom section. Do not use custom sections to avoid the structured fields above.

--- CHARACTER GOALS ---
- Use goals.GoalTitle only for durable objectives that remain meaningful beyond the current scene. Do not save momentary actions, current-scene logistics, routine movement, object interaction, or one-turn decisions as goals.
- Prefer updating an existing goal over creating a near-duplicate. Respect the goal's guidance_strength when present: rigid goals change only with strong evidence, normal goals update when clearly advanced, and flexible goals can shift when the scene repeatedly carries them elsewhere.
- For existing goals, update only current_status, progress, and complete_steps. Do not send new_steps for an existing goal, and do not replace an existing goal's step list.
- Create a brand-new goal only when the latest exchange clearly establishes a sustained objective that is not already covered by an existing goal.
- For brand-new goals, include desired_outcome, current_status, progress, and new_steps.
- The desired_outcome describes the ultimate sustained result of the goal: what becomes true when the goal is meaningfully achieved.
- New steps must be logical milestone stages that naturally build toward that desired_outcome.
- Create or advance goal steps only for major, durable shifts in knowledge, relationship, access, commitment, capability, status, safety, resources, or circumstances that will still matter many scenes later.
- A good step changes the ongoing story state after it happens. It should still matter later. It should not merely describe the next physical movement, object interaction, line of dialogue, one-turn decision, or scene chore.
- Examples are structural only. Do not copy their subject matter, genre, relationship type, setting, kink, or wording into unrelated stories.
- If a proposed goal or step would normally be completed within the current exchange or the next few exchanges, it is too granular to save. Leave it in the live scene instead of turning it into saved state.
- Use complete_steps only for existing steps that were clearly completed.
- Do not remove completed goals. When all steps are complete, preserve the goal and update current_status to show that the desired outcome is now part of the ongoing story.

--- CONSERVATIVE UPDATE RULES ---
- Empty updates are valid and preferred over low-confidence edits.
- Do not emit unchanged values.
- Do not reword existing values just to make them sound better.
- Do not add duplicate traits, tone entries, relationship entries, goals, or custom-section items under slightly different labels.
- Do not update characters outside ELIGIBLE CHARACTERS.
- Do not output unsupported fields; unsupported fields will be ignored.

--- OUTPUT JSON ---
Return only this JSON shape:
{
  "updates": [
    {
      "character": "CharacterName",
      "field": "supported.fieldPath",
      "value": "Proposed saved value",
      "evidence": "Short exact phrase from the latest exchange.",
      "confidence": 0.0
    }
  ]
}

Examples are structural only. Do not copy example field paths, labels, goal names, relationship types, settings, genres, or wording into real updates.

Return ONLY valid JSON. No explanations.`;

    // Build combined text including recent context for continuity and conflict checking.
    const combinedText = [
      recentContext ? `RECENT CONVERSATION CONTEXT (for continuity and conflict checking only):\n${recentContext}` : '',
      userMessage ? `LATEST USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `LATEST AI RESPONSE:\n${aiResponse}` : ''
    ].filter(Boolean).join('\n\n---\n\n');
    const latestExchangeText = [
      userMessage ? `LATEST USER MESSAGE:\n${userMessage}` : '',
      aiResponse ? `LATEST AI RESPONSE:\n${aiResponse}` : '',
    ].filter(Boolean).join('\n\n---\n\n');

    // Only grok-4.3 is used app-wide; reject anything else
    const VALID_GROK_MODELS = ['grok-4.3'];
    const effectiveModelId = (modelId && VALID_GROK_MODELS.includes(modelId)) ? modelId : 'grok-4.3';
    if (modelId && modelId !== effectiveModelId) {
      console.warn(`[extract-character-updates] Rejected non-Grok model "${modelId}", using "${effectiveModelId}"`);
    }

    let apiKey: string | undefined;
    let apiUrl: string;
    let modelForRequest: string;

    {
      apiKey = Deno.env.get("XAI_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "XAI_API_KEY not configured. Please add your Grok API key in settings.", updates: [] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      apiUrl = "https://api.x.ai/v1/chat/completions";
      modelForRequest = effectiveModelId;
    }

    const xaiRequestBody = {
      model: modelForRequest,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze the latest exchange and return only material supported character-card deltas.\n\n${combinedText}` }
      ],
      temperature: 0.15,
      max_tokens: 8192,
      response_format: characterUpdateResponseFormat,
    };
    const primaryDebugPayload = debugTrace === true
      ? {
          modelRequest: {
            endpoint: apiUrl,
            method: "POST",
            capturedAt: Date.now(),
            requestBody: xaiRequestBody,
          },
        }
      : null;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xaiRequestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", updates: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue.", updates: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 403) {
        console.log("[extract-character-updates] Content safety rejection (403), retrying with safe extraction mode");
        // Retry with a sanitized prompt focused on non-explicit metadata only
        const safeRequestBody = {
          model: 'grok-4.3',
          messages: [
		            { role: "system", content: "Extract only non-explicit character state metadata from the latest exchange. Return JSON with {updates:[{character,field,value,evidence,confidence}]}. Use only supported field paths. Include evidence from the latest exchange and confidence from 0 to 1. Omit weak or unsupported changes. Do not create, remove, or advance goals in this fallback." },
            { role: "user", content: `Eligible characters: ${filteredCharacters.map((c: CharacterData) => c.name).join(', ')}.\n\nSupported fields:\n${supportedFields}\n\nCurrent character state:\n${characterContext || 'No eligible character data provided'}\n\nAnalyze:\n${combinedText}` }
          ],
          temperature: 0.2,
          max_tokens: 4096,
          response_format: characterUpdateResponseFormat,
        };
        const safeDebugPayload = debugTrace === true
          ? {
              modelRequest: {
                endpoint: apiUrl,
                method: "POST",
                capturedAt: Date.now(),
                requestBody: safeRequestBody,
                notes: ["Primary character-state sync request received 403; this safe retry was the final Grok request."],
              },
              primaryModelRequest: primaryDebugPayload?.modelRequest,
            }
          : null;
        const safeResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(safeRequestBody),
        });
        if (safeResponse.ok) {
          const safeData = await safeResponse.json();
          const safeContent = safeData.choices?.[0]?.message?.content || '{"updates":[]}';
          try {
            const jsonMatch = safeContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (!Array.isArray(parsed.updates)) {
                const candidateReviews = [buildMalformedCandidateReview("updates_not_array", safeContent)];
                return new Response(JSON.stringify({
                  updates: [],
                  candidateReviews,
                  rejectedCandidates: candidateReviews,
                  parseError: "updates was not an array",
                  ...(safeDebugPayload ? { chronicle_debug_payload: safeDebugPayload } : {}),
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
              const parsedUpdates = parsed.updates;
              const reviewedSafeUpdates = reviewUpdateCandidates(
                parsedUpdates,
                filteredCharacters as CharacterData[],
                { disallowGoals: true, latestExchangeText },
              );
              console.log(`[extract-character-updates] Safe retry yielded ${reviewedSafeUpdates.updates.length} updates`);
              return new Response(JSON.stringify({
                updates: reviewedSafeUpdates.updates,
                candidateReviews: reviewedSafeUpdates.candidateReviews,
                rejectedCandidates: reviewedSafeUpdates.rejectedCandidates,
                ...(safeDebugPayload ? { chronicle_debug_payload: safeDebugPayload } : {}),
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            const candidateReviews = [buildMalformedCandidateReview("no_json_object", safeContent)];
            return new Response(JSON.stringify({
              updates: [],
              candidateReviews,
              rejectedCandidates: candidateReviews,
              parseError: "No JSON object found in safe extraction response",
              ...(safeDebugPayload ? { chronicle_debug_payload: safeDebugPayload } : {}),
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } catch {
            const candidateReviews = [buildMalformedCandidateReview("parse_error", safeContent)];
            return new Response(JSON.stringify({
              updates: [],
              candidateReviews,
              rejectedCandidates: candidateReviews,
              parseError: "Failed to parse safe extraction response",
              ...(safeDebugPayload ? { chronicle_debug_payload: safeDebugPayload } : {}),
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        // If safe retry also fails, return empty
        return new Response(
          JSON.stringify({ updates: [], ...(safeDebugPayload ? { chronicle_debug_payload: safeDebugPayload } : {}) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to extract character updates");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"updates":[]}';
    
    let extractedUpdates: any[] = [];
    let parseError: string | null = null;
    let parseErrorContent = "";
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.updates)) {
          extractedUpdates = parsed.updates;
        } else {
          parseError = "updates_not_array";
          parseErrorContent = content;
        }
      } else {
        parseError = "missing_json_object";
        parseErrorContent = content;
      }
    } catch (_parseError) {
      console.error("Failed to parse extraction response:", content);
      extractedUpdates = [];
      parseError = "parse_error";
      parseErrorContent = content;
    }

    const reviewedUpdates = parseError
      ? {
          updates: [] as ExtractedUpdate[],
          candidateReviews: [buildMalformedCandidateReview(parseError, parseErrorContent || content)],
          rejectedCandidates: [buildMalformedCandidateReview(parseError, parseErrorContent || content)],
        }
      : reviewUpdateCandidates(extractedUpdates, filteredCharacters as CharacterData[], { latestExchangeText });
    extractedUpdates = reviewedUpdates.updates;

    console.log(`[extract-character-updates] Extracted ${extractedUpdates.length} updates from dialogue`);
    if (extractedUpdates.length > 0) {
      console.log(`[extract-character-updates] Updates:`, JSON.stringify(extractedUpdates));
    }

    return new Response(
      JSON.stringify({
        updates: extractedUpdates,
        candidateReviews: reviewedUpdates.candidateReviews,
        rejectedCandidates: reviewedUpdates.rejectedCandidates,
        ...(parseError ? { parseError } : {}),
        ...(primaryDebugPayload ? { chronicle_debug_payload: primaryDebugPayload } : {}),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in extract-character-updates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', updates: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
