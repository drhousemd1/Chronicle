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
 * Get all known character names (both main and side characters)
 * Used to prevent duplicate character creation
 */
export function getKnownCharacterNames(appData: ScenarioData): Set<string> {
  const names = new Set<string>();
  appData.characters.forEach(c => names.add(c.name.toLowerCase()));
  appData.sideCharacters?.forEach(c => names.add(c.name.toLowerCase()));
  return names;
}

/**
 * Find a character (main or side) by name
 */
export function findCharacterByName(
  name: string | null, 
  appData: ScenarioData
): Character | SideCharacter | null {
  if (!name) return null;
  const nameLower = name.toLowerCase();
  
  const mainChar = appData.characters.find(c => c.name.toLowerCase() === nameLower);
  if (mainChar) return mainChar;
  
  const sideChar = appData.sideCharacters?.find(c => c.name.toLowerCase() === nameLower);
  if (sideChar) return sideChar;
  
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
 * Parse a message for CharacterName: tags
 * Returns segments that can be rendered with individual avatars
 * 
 * SIMPLIFIED: Each paragraph with a Name: tag gets that speaker.
 * Content before first tag or without tags gets null speaker.
 */
export function parseMessageSegments(text: string): MessageSegment[] {
  // Remove ALL system tags first (SCENE, UPDATE, ADDROW, NEWCAT)
  const cleanText = text
    .replace(/\[SCENE:\s*.*?\]/g, '')
    .replace(/\[UPDATE:[^\]]*\]/g, '')
    .replace(/\[ADDROW:[^\]]*\]/g, '')
    .replace(/\[NEWCAT:[^\]]*\]/g, '')
    .trim();
  
  // Regex to find "Name:" at start of line or after newline
  // Name must start with capital letter, be 1-30 chars, followed by colon
  // Supports hyphens and apostrophes for names like "Mary-Jane" or "O'Brien"
  const segments: MessageSegment[] = [];
  const regex = /(?:^|\n)([A-Z][a-zA-Z\s'-]{0,29}):\s*/g;
  
  // Find all speaker tags
  const matches: Array<{ name: string; index: number; length: number }> = [];
  let match;
  
  while ((match = regex.exec(cleanText)) !== null) {
    matches.push({
      name: match[1].trim(),
      index: match.index,
      length: match[0].length
    });
  }
  
  if (matches.length === 0) {
    // No speaker tags - return whole message as null speaker
    return [{ speakerName: null, content: cleanText }];
  }
  
  // Content before first tag (if any)
  if (matches[0].index > 0) {
    const before = cleanText.slice(0, matches[0].index).trim();
    if (before) {
      segments.push({ speakerName: null, content: before });
    }
  }
  
  // Build segments - each tag gets all content until next tag
  matches.forEach((m, i) => {
    const contentStart = m.index + m.length;
    const contentEnd = i < matches.length - 1 ? matches[i + 1].index : cleanText.length;
    const content = cleanText.slice(contentStart, contentEnd).trim();
    
    if (content) {
      segments.push({ speakerName: m.name, content });
    }
  });
  
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
      
      // Skip if already known
      if (knownNames.has(nameLower)) continue;
      
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
