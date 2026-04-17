import { supabase } from '@/integrations/supabase/client';
import type {
  CharacterBackground,
  CharacterExtraRow,
  CharacterFears,
  CharacterKeyLifeEvents,
  CharacterPersonality,
  CharacterRelationships,
  CharacterSecrets,
  CharacterTone,
  CurrentlyWearing,
  PersonalityTrait,
  PhysicalAppearance,
  PreferredClothing,
} from '@/types';
import {
  defaultCharacterBackground,
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
} from '@/types';

export { supabase };
export { defaultCharacterBackground, defaultCurrentlyWearing, defaultPhysicalAppearance, defaultPreferredClothing };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export const toTimestamp = (value: string | number | Date | null | undefined): number =>
  value ? new Date(value).getTime() : Date.now();

export const asExtras = (value: unknown): CharacterExtraRow[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const extras = value
    .map((entry, index) => {
      if (!isRecord(entry)) return null;
      const label = asString(entry.label);
      const rowValue = asString(entry.value);
      if (!label && !rowValue) return null;
      return {
        id: asString(entry.id) || `extra-${index}`,
        label,
        value: rowValue,
      };
    })
    .filter((entry): entry is CharacterExtraRow => entry !== null);
  return extras.length ? extras : undefined;
};

const asPersonalityTraits = (value: unknown, prefix: string): PersonalityTrait[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<PersonalityTrait[]>((acc, entry, index) => {
    if (!isRecord(entry)) return acc;
    const rawFlexibility = entry.flexibility;
    const flexibility: PersonalityTrait['flexibility'] =
      rawFlexibility === 'rigid' || rawFlexibility === 'normal' || rawFlexibility === 'flexible'
        ? rawFlexibility
        : 'normal';
    const rawScoreTrend = entry.scoreTrend;
    const scoreTrend: PersonalityTrait['scoreTrend'] =
      rawScoreTrend === 'rising' || rawScoreTrend === 'falling' || rawScoreTrend === 'stable'
        ? rawScoreTrend
        : undefined;
    const rawAdherence = entry.adherenceScore;
    const trait: PersonalityTrait = {
      id: asString(entry.id) || `${prefix}-${index}`,
      label: asString(entry.label),
      value: asString(entry.value),
      flexibility,
      adherenceScore: typeof rawAdherence === 'number' ? rawAdherence : undefined,
      scoreTrend,
    };
    acc.push(trait);
    return acc;
  }, []);
};

export const asCharacterPersonality = (value: unknown): CharacterPersonality | undefined => {
  if (!isRecord(value)) return undefined;
  return {
    splitMode: typeof value.splitMode === 'boolean' ? value.splitMode : false,
    traits: asPersonalityTraits(value.traits, 'trait'),
    outwardTraits: asPersonalityTraits(value.outwardTraits, 'outward'),
    inwardTraits: asPersonalityTraits(value.inwardTraits, 'inward'),
  };
};

export const asCharacterBackground = (value: unknown): CharacterBackground | undefined => {
  if (!isRecord(value)) return undefined;
  return {
    ...defaultCharacterBackground,
    jobOccupation: asString(value.jobOccupation ?? value.job_occupation),
    educationLevel: asString(value.educationLevel ?? value.education_level),
    residence: asString(value.residence),
    hobbies: asString(value.hobbies),
    financialStatus: asString(value.financialStatus ?? value.financial_status),
    motivation: asString(value.motivation),
    _extras: asExtras(value._extras),
  };
};

export const asExtrasSection = <T extends { _extras?: CharacterExtraRow[] }>(value: unknown): T | undefined => {
  if (!isRecord(value)) return undefined;
  return { _extras: asExtras(value._extras) } as T;
};

export function dbPhysicalAppearanceToApp(db: any): PhysicalAppearance {
  return {
    hairColor: db?.hair_color || '',
    eyeColor: db?.eye_color || '',
    build: db?.build || '',
    bodyHair: db?.body_hair || '',
    height: db?.height || '',
    breastSize: db?.breast_size || '',
    genitalia: db?.genitalia || '',
    skinTone: db?.skin_tone || '',
    makeup: db?.makeup || '',
    bodyMarkings: db?.body_markings || '',
    temporaryConditions: db?.temporary_conditions || '',
    _extras: db?._extras || undefined,
  };
}

export function appPhysicalAppearanceToDb(app: PhysicalAppearance) {
  return {
    hair_color: app.hairColor,
    eye_color: app.eyeColor,
    build: app.build,
    body_hair: app.bodyHair,
    height: app.height,
    breast_size: app.breastSize,
    genitalia: app.genitalia,
    skin_tone: app.skinTone,
    makeup: app.makeup,
    body_markings: app.bodyMarkings,
    temporary_conditions: app.temporaryConditions,
    _extras: app._extras || undefined,
  };
}

export function dbCurrentlyWearingToApp(db: any): CurrentlyWearing {
  return {
    top: db?.top || '',
    bottom: db?.bottom || '',
    undergarments: db?.undergarments || '',
    miscellaneous: db?.miscellaneous || '',
    _extras: db?._extras || undefined,
  };
}

export function appCurrentlyWearingToDb(app: CurrentlyWearing) {
  return {
    top: app.top,
    bottom: app.bottom,
    undergarments: app.undergarments,
    miscellaneous: app.miscellaneous,
    _extras: app._extras || undefined,
  };
}

export function dbPreferredClothingToApp(db: any): PreferredClothing {
  return {
    casual: db?.casual || '',
    work: db?.work || '',
    sleep: db?.sleep || '',
    undergarments: db?.underwear || db?.undergarments || '',
    miscellaneous: db?.miscellaneous || '',
    _extras: db?._extras || undefined,
  };
}

export function appPreferredClothingToDb(app: PreferredClothing) {
  return {
    casual: app.casual,
    work: app.work,
    sleep: app.sleep,
    underwear: app.undergarments,
    miscellaneous: app.miscellaneous,
    _extras: app._extras || undefined,
  };
}

/**
 * If `url` is a base64 data URI, uploads it to the given storage bucket
 * and returns the public URL. Otherwise returns the original string.
 */
export async function ensureStorageUrl(
  url: string | undefined | null,
  bucket: string,
  userId: string,
): Promise<string> {
  if (!url || !url.startsWith('data:')) return url || '';
  try {
    const arr = url.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return url;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    const blob = new Blob([u8arr], { type: mime });
    const filename = `${userId}/${bucket}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const { error } = await supabase.storage.from(bucket).upload(filename, blob, {
      contentType: 'image/png',
      upsert: true,
    });
    if (error) {
      console.error(`[ensureStorageUrl] Failed to upload to ${bucket}:`, error);
      return url;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    console.log(`[ensureStorageUrl] Uploaded base64 to ${bucket}:`, data.publicUrl);
    return data.publicUrl;
  } catch {
    return url;
  }
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}
