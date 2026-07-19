import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('support-call hardening source contracts', () => {
  it('sends only the current open story-goal milestone to goal-progress evaluation', () => {
    const source = read('src/components/chronicle/ChatInterfaceTab.tsx');

    expect(source).toContain('const storyGoals = (effectiveWorldCore.storyGoals || []).filter((goal) => {');
    expect(source).toContain('shouldRenderGoalToWriter(goal?.alignment, flexibility)');
    expect(source).toContain('const currentOpenStep = (goal.steps || []).find((step) => !step.completed);');
    expect(source).toContain('description: currentOpenStep.description');
    expect(source).not.toContain('for (const step of goal.steps || [])');
  });

  it('requires character-state evidence to match the latest exchange text', () => {
    const source = read('supabase/functions/extract-character-updates/index.ts');

    expect(source).toContain('function evidenceAppearsInLatestExchange');
    expect(source).toContain('if (!evidenceAppearsInLatestExchange(evidence, latestExchangeText)) return null;');
    expect(source).toContain('return "evidence_not_in_latest_exchange";');
    expect(source).toContain('const latestExchangeText = [');
    expect(source).toContain('reviewUpdateCandidates(extractedUpdates, filteredCharacters as CharacterData[], { latestExchangeText })');
  });

  it('uses durable-memory wording and deterministic memory point cleanup', () => {
    const source = read('supabase/functions/extract-memory-events/index.ts');

    expect(source).toContain('const MEMORY_POINT_MAX_CHARS = 140;');
    expect(source).toContain('Accept only source-backed information whose future loss would create meaningful inconsistency.');
    expect(source).toContain('At most three candidates may be accepted.');
    expect(source).toContain('candidateText');
    expect(source).toContain('durabilityCategory');
    expect(source).toContain('sourceClassification');
    expect(source).toContain('normalizeMemoryPoint');
    expect(source).not.toContain('Keep each point under 90 characters.');
    expect(source).not.toContain('Relationship milestones, intimacy milestones');
  });

  it('caps day-memory compression output and normalizes the returned synopsis', () => {
    const source = read('supabase/functions/compress-day-memories/index.ts');

    expect(source).toContain('const DAY_SYNOPSIS_MAX_CHARS = 900;');
    expect(source).toContain('maxOutputTokens: 350');
    expect(source).toContain('normalizeSynopsis');
    expect(source).toContain('sentences.slice(0, 3)');
  });

  it('uses schema-shaped side-character profile generation with sanitation before persistence boundaries', () => {
    const edgeSource = read('supabase/functions/generate-side-character/index.ts');
    const browserSource = read('src/components/chronicle/ChatInterfaceTab.tsx');
    const runtimeSource = read('src/features/chat-runtime/side-character-profile.ts');

    expect(edgeSource).toContain('sideCharacterProfileResponseFormat');
    expect(edgeSource).toContain('temperature: 0.55');
    expect(edgeSource).toContain('response_format: sideCharacterProfileResponseFormat');
    expect(edgeSource).toContain('sanitizeGeneratedProfile');
    expect(edgeSource).toContain('Do not infer private sexuality, intimate anatomy, undergarments, secrets, fears, kinks, or hidden desires');
    expect(edgeSource).toContain('return normalizedSource.includes(normalizedValue);');
    expect(edgeSource).not.toContain('return tokens.every((token) => normalizedSource.includes(token));');
    expect(edgeSource).not.toContain('worldContext || "",');
    expect(edgeSource).not.toContain('cleanString(profile.roleDescription)');
    expect(edgeSource).not.toContain('cleanString(appearance.genitalia)');
    expect(edgeSource).not.toContain('cleanString(clothing.undergarments)');
    expect(edgeSource).not.toContain('temperature: 0.8');
    expect(edgeSource).not.toContain('a secret they might have');

    expect(browserSource).toContain('sanitizeGeneratedSideCharacterProfile');
    expect(browserSource).toContain('mergeGeneratedProfileSection(sc.physicalAppearance, profileForUse.physicalAppearance)');
    expect(browserSource).not.toContain('physicalAppearance: { ...sc.physicalAppearance, ...profileForUse.physicalAppearance }');
    expect(browserSource).toContain('sexualOrientation: profileForUse.sexualOrientation || sc.sexualOrientation');
    expect(runtimeSource).toContain('buildSanitizedSideCharacterAvatarPrompt');
    expect(runtimeSource).toContain('function mergeGeneratedProfileSection');
    expect(runtimeSource).toContain('generatedProfileSourceSupportsValue');
    expect(runtimeSource).toContain('return normalizedSource.includes(normalizedValue);');
  });

  it('grounds scene-image analysis in established visible data with neutral fallbacks', () => {
    const source = read('supabase/functions/generate-scene-image/index.ts');

    expect(source).toContain('sceneAnalysisResponseFormat');
    expect(source).toContain('response_format: sceneAnalysisResponseFormat');
    expect(source).toContain('Use weightedTraits sparingly.');
    expect(source).toContain('Do not infer private anatomy or identity from sparse cues.');
    expect(source).toContain('SCENE_IMAGE_APPEARANCE_KEYS');
    expect(source).toContain('SCENE_IMAGE_CLOTHING_KEYS');
    expect(source).toContain('SCENE_IMAGE_APPEARANCE_KEYS.has(key) && value');
    expect(source).toContain('SCENE_IMAGE_CLOTHING_KEYS.has(key) && value');
    expect(source).not.toContain('age=${c.age');
    expect(source).toContain("typeof m.content === 'string' ? m.content : typeof m.text === 'string' ? m.text : ''");
    expect(source).toContain('normalizeStructuredPromptData({}, characters || [], sceneLocation || \'\')');
    expect(source).toContain("const primaryGender = structuredData.characters[0]?.genderPresentation || 'androgynous';");
    expect(source).not.toContain('WEIGHTING RULES (MANDATORY)');
    expect(source).not.toContain("genderPresentation: 'feminine' as GenderPresentation");
    expect(source).not.toContain("clothing: 'casual outfit'");
  });
});
