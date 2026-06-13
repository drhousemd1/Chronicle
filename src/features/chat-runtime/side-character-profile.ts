import type {
  Character,
  CurrentlyWearing,
  PhysicalAppearance,
  SideCharacter,
  SideCharacterBackground,
  SideCharacterPersonality,
} from '@/types';
import {
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultSideCharacterPersonality,
} from '@/types';

export type SanitizedGeneratedSideCharacterProfile = {
  nicknames: string;
  age: string;
  sexType: string;
  sexualOrientation: string;
  roleDescription: string;
  physicalAppearance: PhysicalAppearance;
  currentlyWearing: CurrentlyWearing;
  background: SideCharacterBackground;
  personality: SideCharacterPersonality;
  avatarPrompt: string;
};

export type SceneImageCharacterData = {
  name: string;
  physicalAppearance: Pick<PhysicalAppearance,
    'hairColor' | 'eyeColor' | 'build' | 'height' | 'skinTone' | 'makeup' | 'bodyMarkings' | 'temporaryConditions'
  >;
  currentlyWearing: Pick<CurrentlyWearing, 'top' | 'bottom'>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function cleanGeneratedProfileString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function normalizeGeneratedProfileSupport(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function generatedProfileSourceSupportsValue(value: unknown, sourceText: string): boolean {
  const normalizedValue = normalizeGeneratedProfileSupport(cleanGeneratedProfileString(value));
  if (!normalizedValue) return false;
  const normalizedSource = normalizeGeneratedProfileSupport(sourceText);
  return normalizedSource.includes(normalizedValue);
}

export function sourceSupportedGeneratedProfileValue(value: unknown, sourceText: string): string {
  const cleaned = cleanGeneratedProfileString(value);
  return generatedProfileSourceSupportsValue(cleaned, sourceText) ? cleaned : '';
}

export function buildSanitizedSideCharacterAvatarPrompt(
  profile: Partial<SanitizedGeneratedSideCharacterProfile>,
  name: string,
): string {
  const appearance: Partial<PhysicalAppearance> = profile.physicalAppearance || {};
  const clothing: Partial<CurrentlyWearing> = profile.currentlyWearing || {};
  const parts = [
    cleanGeneratedProfileString(name),
    cleanGeneratedProfileString(profile.age),
    cleanGeneratedProfileString(profile.sexType),
    cleanGeneratedProfileString(appearance.hairColor),
    cleanGeneratedProfileString(appearance.eyeColor),
    cleanGeneratedProfileString(appearance.build),
    cleanGeneratedProfileString(appearance.height),
    cleanGeneratedProfileString(appearance.skinTone),
    cleanGeneratedProfileString(appearance.makeup),
    cleanGeneratedProfileString(appearance.bodyMarkings),
    cleanGeneratedProfileString(appearance.temporaryConditions),
    cleanGeneratedProfileString(clothing.top),
    cleanGeneratedProfileString(clothing.bottom),
  ].filter(Boolean);
  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.length
    ? `Portrait of ${uniqueParts.join(', ')}.`
    : `Portrait of ${cleanGeneratedProfileString(name) || 'supporting character'}.`;
}

export function sanitizeGeneratedSideCharacterProfile(
  profile: unknown,
  name: string,
  sourceText: string,
): SanitizedGeneratedSideCharacterProfile {
  const raw = asRecord(profile);
  const physicalAppearance = asRecord(raw.physicalAppearance);
  const currentlyWearing = asRecord(raw.currentlyWearing);
  const background = asRecord(raw.background);
  const personality = asRecord(raw.personality);

  const sanitized: Omit<SanitizedGeneratedSideCharacterProfile, 'avatarPrompt'> = {
    nicknames: sourceSupportedGeneratedProfileValue(raw.nicknames, sourceText),
    age: cleanGeneratedProfileString(raw.age),
    sexType: cleanGeneratedProfileString(raw.sexType),
    sexualOrientation: sourceSupportedGeneratedProfileValue(raw.sexualOrientation, sourceText),
    roleDescription: cleanGeneratedProfileString(raw.roleDescription),
    physicalAppearance: {
      ...defaultPhysicalAppearance,
      hairColor: cleanGeneratedProfileString(physicalAppearance.hairColor),
      eyeColor: cleanGeneratedProfileString(physicalAppearance.eyeColor),
      build: cleanGeneratedProfileString(physicalAppearance.build),
      bodyHair: sourceSupportedGeneratedProfileValue(physicalAppearance.bodyHair, sourceText),
      height: cleanGeneratedProfileString(physicalAppearance.height),
      breastSize: sourceSupportedGeneratedProfileValue(physicalAppearance.breastSize, sourceText),
      genitalia: sourceSupportedGeneratedProfileValue(physicalAppearance.genitalia, sourceText),
      skinTone: cleanGeneratedProfileString(physicalAppearance.skinTone),
      makeup: cleanGeneratedProfileString(physicalAppearance.makeup),
      bodyMarkings: cleanGeneratedProfileString(physicalAppearance.bodyMarkings),
      temporaryConditions: cleanGeneratedProfileString(physicalAppearance.temporaryConditions),
    },
    currentlyWearing: {
      ...defaultCurrentlyWearing,
      top: cleanGeneratedProfileString(currentlyWearing.top),
      bottom: cleanGeneratedProfileString(currentlyWearing.bottom),
      undergarments: sourceSupportedGeneratedProfileValue(currentlyWearing.undergarments, sourceText),
      miscellaneous: cleanGeneratedProfileString(currentlyWearing.miscellaneous),
    },
    background: {
      relationshipStatus: sourceSupportedGeneratedProfileValue(background.relationshipStatus, sourceText),
      residence: cleanGeneratedProfileString(background.residence),
      educationLevel: cleanGeneratedProfileString(background.educationLevel),
    },
    personality: {
      ...defaultSideCharacterPersonality,
      traits: Array.isArray(personality.traits)
        ? personality.traits.map(cleanGeneratedProfileString).filter(Boolean).slice(0, 2)
        : [],
      miscellaneous: cleanGeneratedProfileString(personality.miscellaneous),
      secrets: sourceSupportedGeneratedProfileValue(personality.secrets, sourceText),
      fears: sourceSupportedGeneratedProfileValue(personality.fears, sourceText),
      kinksFantasies: sourceSupportedGeneratedProfileValue(personality.kinksFantasies, sourceText),
      desires: sourceSupportedGeneratedProfileValue(personality.desires, sourceText),
    },
  };

  return {
    ...sanitized,
    avatarPrompt: buildSanitizedSideCharacterAvatarPrompt(sanitized, name),
  };
}

export function mergeGeneratedProfileSection<T extends object>(existing: T, generated: unknown): T {
  const merged = { ...existing };
  if (!generated || typeof generated !== 'object') return merged;
  for (const [key, value] of Object.entries(generated as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      if (value.length > 0) (merged as Record<string, unknown>)[key] = value;
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) (merged as Record<string, unknown>)[key] = trimmed;
      continue;
    }
    if (value && typeof value === 'object') {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

export function buildSceneImageCharacterData(char: Character | SideCharacter): SceneImageCharacterData {
  const appearance = 'physicalAppearance' in char ? char.physicalAppearance : undefined;
  const wearing = 'currentlyWearing' in char ? char.currentlyWearing : undefined;
  return {
    name: char.name,
    physicalAppearance: {
      hairColor: appearance?.hairColor || '',
      eyeColor: appearance?.eyeColor || '',
      build: appearance?.build || '',
      height: appearance?.height || '',
      skinTone: appearance?.skinTone || '',
      makeup: appearance?.makeup || '',
      bodyMarkings: appearance?.bodyMarkings || '',
      temporaryConditions: appearance?.temporaryConditions || '',
    },
    currentlyWearing: {
      top: wearing?.top || '',
      bottom: wearing?.bottom || '',
    },
  };
}
