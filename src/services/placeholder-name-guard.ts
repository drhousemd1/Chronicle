/**
 * Placeholder Name Guard
 * 
 * Detects and replaces generic placeholder speaker labels (e.g., "Man 1:", "Cashier:")
 * with generated proper names to ensure side character detection works correctly.
 */

// Patterns that match placeholder speaker labels at line starts
const PLACEHOLDER_PATTERNS = [
  // Generic person labels: Man 1, Woman Two, Guy, Girl, Person, Someone
  /^(Man|Woman|Guy|Girl|Person|Someone|Stranger|Visitor|Patron|Customer)\s*(One|Two|Three|Four|Five|\d+)?\s*:/gim,
  // Role-based labels: Cashier, Doctor, Guard, etc.
  /^(Cashier|Doctor|Nurse|Guard|Bartender|Waiter|Waitress|Driver|Officer|Clerk|Receptionist|Manager|Boss|Worker|Employee|Attendant|Host|Hostess|Chef|Cook|Server|Bouncer|Doorman|Security|Paramedic|Firefighter|Police|Cop|Detective|Agent|Lawyer|Judge|Teacher|Professor|Student|Coach|Trainer|Therapist|Counselor|Priest|Pastor|Minister|Monk|Nun)\s*(\d+)?\s*:/gim,
];

// Name pools for generating replacements
const MALE_NAMES = [
  'Marcus', 'Derek', 'Jason', 'Tyler', 'Brandon', 'Kyle', 'Nathan', 'Evan',
  'Trevor', 'Connor', 'Blake', 'Ryan', 'Logan', 'Jake', 'Cole', 'Dustin',
  'Chad', 'Brett', 'Scott', 'Brian', 'Kevin', 'Matt', 'Chris', 'Mike',
  'Adam', 'Eric', 'Steve', 'Dan', 'Tom', 'Nick', 'Alex', 'Ben', 'Sam'
];

const FEMALE_NAMES = [
  'Sarah', 'Jessica', 'Megan', 'Lauren', 'Brittany', 'Nicole', 'Amanda', 'Kayla',
  'Ashley', 'Stephanie', 'Rachel', 'Samantha', 'Emily', 'Michelle', 'Hannah', 'Olivia',
  'Sophia', 'Emma', 'Ava', 'Madison', 'Chloe', 'Lily', 'Grace', 'Zoe',
  'Natalie', 'Leah', 'Brooke', 'Victoria', 'Vanessa', 'Amber', 'Crystal', 'Heather'
];

const NEUTRAL_NAMES = [
  'Jordan', 'Morgan', 'Riley', 'Casey', 'Alex', 'Taylor', 'Quinn', 'Avery',
  'Cameron', 'Jamie', 'Jesse', 'Drew', 'Skyler', 'Reese', 'Finley', 'Parker'
];

// Patterns that indicate female gender
const FEMALE_INDICATORS = /woman|girl|waitress|hostess|nun|nurse/i;
// Patterns that indicate male gender
const MALE_INDICATORS = /man|guy|waiter|host(?!ess)|monk|priest|pastor|doorman|bouncer/i;

export interface PlaceholderNameMap {
  [placeholder: string]: string;
}

/**
 * Normalizes a placeholder match to a consistent key for the map
 */
function normalizeKey(match: string): string {
  return match.toLowerCase().replace(/[:\s]+/g, '_').trim();
}

/**
 * Determines which name pool to use based on the placeholder text
 */
function getNamePool(placeholder: string): string[] {
  if (FEMALE_INDICATORS.test(placeholder)) {
    return FEMALE_NAMES;
  }
  if (MALE_INDICATORS.test(placeholder)) {
    return MALE_NAMES;
  }
  return NEUTRAL_NAMES;
}

/**
 * Generates a unique name not already in use
 */
function generateUniqueName(
  pool: string[],
  existingNames: Set<string>,
  usedInThisSession: Set<string>
): string {
  // First try to find an unused name from the pool
  for (const name of pool) {
    const lowerName = name.toLowerCase();
    if (!existingNames.has(lowerName) && !usedInThisSession.has(lowerName)) {
      usedInThisSession.add(lowerName);
      return name;
    }
  }
  
  // If all names are used, append a number
  for (let i = 2; i < 100; i++) {
    const name = `${pool[0]}${i}`;
    const lowerName = name.toLowerCase();
    if (!existingNames.has(lowerName) && !usedInThisSession.has(lowerName)) {
      usedInThisSession.add(lowerName);
      return name;
    }
  }
  
  // Fallback
  return `Person${Math.floor(Math.random() * 1000)}`;
}

/**
 * Normalizes placeholder speaker labels in AI response text, replacing them with proper names.
 * 
 * @param text - The AI response text to process
 * @param existingNames - Set of character names already in use (lowercase)
 * @param placeholderMap - Persistent map of placeholder->name replacements (for conversation consistency)
 * @returns The normalized text with placeholder labels replaced by proper names
 */
export function normalizePlaceholderNames(
  text: string,
  existingNames: Set<string>,
  placeholderMap: PlaceholderNameMap
): { normalizedText: string; newNames: string[] } {
  let result = text;
  const newNames: string[] = [];
  const usedInThisSession = new Set<string>(Object.values(placeholderMap).map(n => n.toLowerCase()));
  
  // Process each line separately to handle multi-line responses
  const lines = result.split('\n');
  const processedLines = lines.map(line => {
    let processedLine = line;
    
    for (const pattern of PLACEHOLDER_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      
      processedLine = processedLine.replace(pattern, (match) => {
        const key = normalizeKey(match);
        
        // Check if we already have a mapping for this placeholder
        if (placeholderMap[key]) {
          return placeholderMap[key] + ':';
        }
        
        // Generate a new name
        const pool = getNamePool(match);
        const newName = generateUniqueName(pool, existingNames, usedInThisSession);
        
        // Store the mapping for consistency
        placeholderMap[key] = newName;
        newNames.push(newName);
        existingNames.add(newName.toLowerCase());
        
        console.log(`[Placeholder Guard] Replaced "${match.trim()}" with "${newName}:"`);
        
        return newName + ':';
      });
    }
    
    return processedLine;
  });
  
  return {
    normalizedText: processedLines.join('\n'),
    newNames
  };
}

/**
 * Checks if text contains any placeholder patterns that need normalization
 */
export function hasPlaceholderNames(text: string): boolean {
  for (const pattern of PLACEHOLDER_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}
