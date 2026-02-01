// Service for generating AI side characters from dialog
// This file is isolated from main character creation logic for easy modification

import { 
  SideCharacter, 
  SideCharacterBackground, 
  SideCharacterPersonality,
  PhysicalAppearance,
  CurrentlyWearing,
  PreferredClothing,
  ScenarioData,
  Character,
  defaultPhysicalAppearance,
  defaultCurrentlyWearing,
  defaultPreferredClothing,
  defaultSideCharacterBackground,
  defaultSideCharacterPersonality
} from '../types';
import { uuid, now } from './storage';

// =============================================
// CHARACTER NAME REGISTRY
// =============================================

/**
 * Get all known character names and nicknames (both main and side characters)
 * Used to prevent duplicate character creation
 */
export function getKnownCharacterNames(appData: ScenarioData): Set<string> {
  const names = new Set<string>();
  appData.characters.forEach(c => {
    names.add(c.name.toLowerCase());
    // Add nicknames to known names set
    if (c.nicknames) {
      c.nicknames.split(',').forEach(n => names.add(n.trim().toLowerCase()));
    }
  });
  appData.sideCharacters?.forEach(c => {
    names.add(c.name.toLowerCase());
    // Add nicknames to known names set
    if (c.nicknames) {
      c.nicknames.split(',').forEach(n => names.add(n.trim().toLowerCase()));
    }
  });
  return names;
}

/**
 * Find a character (main or side) by name OR nickname
 * This ensures aliases like "Jamie" correctly resolve to "James"
 */
export function findCharacterByName(
  name: string | null, 
  appData: ScenarioData
): Character | SideCharacter | null {
  if (!name) return null;
  const nameLower = name.toLowerCase().trim();
  
  // Check main characters - name first, then nicknames
  for (const c of appData.characters) {
    // Exact name match
    if (c.name.toLowerCase() === nameLower) return c;
    // Check nicknames
    if (c.nicknames) {
      const nicknameList = c.nicknames.split(',').map(n => n.trim().toLowerCase());
      if (nicknameList.includes(nameLower)) {
        console.log(`[findCharacterByName] Resolved nickname "${name}" to character "${c.name}"`);
        return c;
      }
    }
  }
  
  // Check side characters - name first, then nicknames
  for (const sc of appData.sideCharacters || []) {
    // Exact name match
    if (sc.name.toLowerCase() === nameLower) return sc;
    // Check nicknames
    if (sc.nicknames) {
      const nicknameList = sc.nicknames.split(',').map(n => n.trim().toLowerCase());
      if (nicknameList.includes(nameLower)) {
        console.log(`[findCharacterByName] Resolved nickname "${name}" to side character "${sc.name}"`);
        return sc;
      }
    }
  }
  
  return null;
}

// =============================================
// MESSAGE PARSING
// =============================================

export interface MessageSegment {
  speakerName: string | null;
  content: string;
}

/**
 * Parse a message for CharacterName: tags using PARAGRAPH-BASED splitting.
 * 
 * Each paragraph (separated by blank lines) is evaluated individually:
 * - If it starts with a Name: tag, that speaker is used
 * - If NO tag is found, the paragraph gets `speakerName: null` (resolves to default character)
 * 
 * This ensures that untagged narrative paragraphs are NOT absorbed into the previous speaker.
 */
export function parseMessageSegments(text: string): MessageSegment[] {
  // Remove ALL system tags first (SCENE, UPDATE, ADDROW, NEWCAT)
  const cleanText = text
    .replace(/\[SCENE:\s*.*?\]/g, '')
    .replace(/\[UPDATE:[^\]]*\]/g, '')
    .replace(/\[ADDROW:[^\]]*\]/g, '')
    .replace(/\[NEWCAT:[^\]]*\]/g, '')
    .trim();
  
  if (!cleanText) return [];
  
  // Split by blank lines (one or more empty lines)
  const paragraphs = cleanText.split(/\n\s*\n+/);
  
  const segments: MessageSegment[] = [];
  
  // Robust tag detection regex:
  // - Optional leading whitespace
  // - Optional markdown bold (**) before name
  // - Name: capital letter, 1-30 chars, allows hyphens/apostrophes/spaces
  // - Optional markdown bold (**) after name
  // - Colon followed by optional whitespace
  const tagRegex = /^\s*(?:\*\*)?([A-Z][a-zA-Z\s'-]{0,29})(?:\*\*)?:\s*/;
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    
    const tagMatch = trimmed.match(tagRegex);
    
    if (tagMatch) {
      // Paragraph starts with a speaker tag
      const speakerName = tagMatch[1].trim();
      const content = trimmed.slice(tagMatch[0].length).trim();
      
      if (content) {
        segments.push({ speakerName, content });
      }
    } else {
      // No tag found - assign null speaker (will resolve to default character)
      segments.push({ speakerName: null, content: trimmed });
    }
  }
  
  return segments.filter(s => s.content.length > 0);
}

/**
 * Merge consecutive segments from the same speaker into one
 * Prevents duplicate avatars for multi-paragraph responses
 */
export function mergeConsecutiveSpeakerSegments(segments: MessageSegment[]): MessageSegment[] {
  if (segments.length <= 1) return segments;
  
  const merged: MessageSegment[] = [];
  let current = segments[0];
  
  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    // If same speaker (including both null), merge the content
    if (current.speakerName === next.speakerName) {
      current = {
        speakerName: current.speakerName,
        content: current.content + '\n\n' + next.content
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  
  return merged;
}

// =============================================
// TRAIT EXTRACTION
// =============================================

interface ExtractedTraits {
  hairColor?: string;
  eyeColor?: string;
  height?: string;
  build?: string;
  skinTone?: string;
  otherTraits: string[];
}

/**
 * Extract physical traits from dialog text using pattern matching
 */
export function extractTraitsFromDialog(dialogText: string): ExtractedTraits {
  const traits: ExtractedTraits = { otherTraits: [] };
  
  // Hair color patterns
  const hairPatterns = [
    /(?:her|his|their)\s+([\w\s]+?)\s+hair/i,
    /(blonde|brunette|redhead|black-haired|gray-haired)/i,
    /hair\s+(?:was|is)\s+([\w\s]+)/i
  ];
  for (const pattern of hairPatterns) {
    const match = dialogText.match(pattern);
    if (match) {
      traits.hairColor = match[1].trim();
      break;
    }
  }
  
  // Eye color patterns
  const eyePatterns = [
    /([\w]+)\s+eyes/i,
    /eyes\s+(?:were|are)\s+([\w]+)/i
  ];
  for (const pattern of eyePatterns) {
    const match = dialogText.match(pattern);
    if (match) {
      traits.eyeColor = match[1].trim();
      break;
    }
  }
  
  // Height patterns
  if (/tall|towering/i.test(dialogText)) traits.height = 'Tall';
  else if (/short|petite|small/i.test(dialogText)) traits.height = 'Short';
  else if (/average height/i.test(dialogText)) traits.height = 'Average';
  
  // Build patterns
  if (/athletic|muscular|fit|toned/i.test(dialogText)) traits.build = 'Athletic';
  else if (/slim|slender|thin|lithe/i.test(dialogText)) traits.build = 'Slim';
  else if (/curvy|voluptuous|full-figured/i.test(dialogText)) traits.build = 'Curvy';
  else if (/heavy|large|big/i.test(dialogText)) traits.build = 'Heavy';
  
  // Skin tone
  const skinPatterns = [
    /(pale|tan|dark|light|olive|ebony|fair|bronze|caramel)\s*(?:skin|complexion)?/i
  ];
  for (const pattern of skinPatterns) {
    const match = dialogText.match(pattern);
    if (match) {
      traits.skinTone = match[1].trim();
      break;
    }
  }
  
  return traits;
}

// =============================================
// SIDE CHARACTER CREATION
// =============================================

/**
 * Create a new side character from detected name and dialog context
 */
export function createSideCharacter(
  name: string,
  dialogContext: string,
  conversationId: string
): SideCharacter {
  const extracted = extractTraitsFromDialog(dialogContext);
  
  return {
    id: uuid(),
    name,
    nicknames: '',
    age: '',
    sexType: '',
    location: '',
    currentMood: '',
    controlledBy: 'AI',
    characterRole: 'Side',
    roleDescription: '',
    
    physicalAppearance: {
      ...defaultPhysicalAppearance,
      hairColor: extracted.hairColor || '',
      eyeColor: extracted.eyeColor || '',
      height: extracted.height || '',
      build: extracted.build || '',
      skinTone: extracted.skinTone || ''
    },
    currentlyWearing: { ...defaultCurrentlyWearing },
    preferredClothing: { ...defaultPreferredClothing },
    
    background: { ...defaultSideCharacterBackground },
    personality: { ...defaultSideCharacterPersonality },
    
    avatarDataUrl: '',
    isAvatarGenerating: true,  // Will trigger async generation
    
    firstMentionedIn: conversationId,
    extractedTraits: extracted.otherTraits,
    createdAt: now(),
    updatedAt: now()
  };
}

// =============================================
// NEW CHARACTER DETECTION
// =============================================

// Common false positives that look like character names but aren't
const FALSE_POSITIVE_NAMES = new Set([
  'note', 'warning', 'narrator', 'scene', 'ooc', 'author', 'gm', 'dm',
  'system', 'action', 'description', 'setting', 'location', 'time',
  'meanwhile', 'later', 'earlier', 'flashback', 'end', 'start', 'summary'
]);

/**
 * Check if a new name is potentially an alias/nickname of an existing name.
 * Prevents duplicate character cards for names like "Mor" and "Morrigan".
 */
export function isPotentialAlias(
  newName: string, 
  existingName: string,
  existingNicknames?: string
): boolean {
  const newLower = newName.toLowerCase().trim();
  const existingLower = existingName.toLowerCase().trim();
  
  // Exact match
  if (newLower === existingLower) return true;
  
  // One is contained in the other (Mor ↔ Morrigan)
  if (existingLower.includes(newLower) || newLower.includes(existingLower)) {
    return true;
  }
  
  // Check against explicit nicknames list
  if (existingNicknames) {
    const nicknameList = existingNicknames.split(',').map(n => n.trim().toLowerCase());
    if (nicknameList.includes(newLower)) {
      return true;
    }
  }
  
  // First N characters match where N >= 3 (common nickname pattern)
  // e.g., "Mor" matches "Morrigan", "Kat" matches "Katherine"
  const minLength = Math.min(newLower.length, existingLower.length);
  if (minLength >= 3) {
    const prefix = newLower.slice(0, minLength);
    if (existingLower.startsWith(prefix)) return true;
  }
  
  return false;
}

/**
 * Detect new characters mentioned in a message
 * Returns array of new character info with their dialog context
 */
export function detectNewCharacters(
  messageText: string,
  knownNames: Set<string>
): Array<{ name: string; dialogContext: string }> {
  const segments = parseMessageSegments(messageText);
  const newCharacters: Array<{ name: string; dialogContext: string }> = [];
  const seenInThisMessage = new Set<string>();
  
  for (const segment of segments) {
    if (segment.speakerName) {
      const nameLower = segment.speakerName.toLowerCase();
      
      // Skip if already known (exact match)
      if (knownNames.has(nameLower)) continue;
      
      // Skip if potential alias of known character (prevents "Mor" + "Morrigan" duplicates)
      let isAlias = false;
      for (const known of knownNames) {
        if (isPotentialAlias(nameLower, known)) {
          console.log(`[detectNewCharacters] Skipping "${segment.speakerName}" - potential alias of "${known}"`);
          isAlias = true;
          break;
        }
      }
      if (isAlias) continue;
      
      // Skip if already detected in this message
      if (seenInThisMessage.has(nameLower)) continue;
      
      // Skip common false positives
      if (FALSE_POSITIVE_NAMES.has(nameLower)) continue;
      
      // Relaxed: Only require minimal content (5+ chars instead of 15)
      // The Name: pattern itself is strong enough signal for detection
      if (segment.content.length < 5) continue;
      
      newCharacters.push({
        name: segment.speakerName,
        dialogContext: segment.content
      });
      
      // Add to seen set to prevent duplicates in same message
      seenInThisMessage.add(nameLower);
    }
  }
  
  return newCharacters;
}

// =============================================
// SMART CONTEXT FILTERING
// =============================================

/**
 * Get characters relevant to the current conversation context
 * Used to reduce token usage when sending to LLM
 */
export function getRelevantCharacters(
  allCharacters: Character[],
  sideCharacters: SideCharacter[],
  recentMessageText: string,
  maxRecent: number = 5
): (Character | SideCharacter)[] {
  const relevant: (Character | SideCharacter)[] = [];
  
  // Always include main characters
  const mainChars = allCharacters.filter(c => c.characterRole === 'Main');
  relevant.push(...mainChars);
  
  // Check which side characters are mentioned in recent messages
  const recentTextLower = recentMessageText.toLowerCase();
  
  for (const sc of sideCharacters || []) {
    if (recentTextLower.includes(sc.name.toLowerCase())) {
      relevant.push(sc);
    }
  }
  
  // Also include non-main characters that are mentioned
  const sideMainChars = allCharacters.filter(c => c.characterRole === 'Side');
  for (const c of sideMainChars) {
    if (recentTextLower.includes(c.name.toLowerCase())) {
      relevant.push(c);
    }
  }
  
  return relevant;
}
