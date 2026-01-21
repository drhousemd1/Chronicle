
export type MessageRole = "system" | "user" | "assistant";

export type TimeOfDay = "sunrise" | "day" | "sunset" | "night";

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  day?: number;
  timeOfDay?: TimeOfDay;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  currentDay: number;
  currentTimeOfDay: TimeOfDay;
  createdAt: number;
  updatedAt: number;
};

export type OpeningDialog = {
  enabled: boolean;
  text: string;
  startingDay: number;
  startingTimeOfDay: TimeOfDay;
};

export type WorldCore = {
  scenarioName: string;
  briefDescription: string;
  settingOverview: string;
  rulesOfMagicTech: string;
  factions: string;
  locations: string;
  historyTimeline: string;
  toneThemes: string;
  plotHooks: string;
  narrativeStyle: string;
  dialogFormatting: string;
};

export type CodexEntry = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type World = {
  core: WorldCore;
  entries: CodexEntry[];
};

export type Scene = {
  id: string;
  url: string;
  tag: string;
  isStartingScene?: boolean;
  createdAt: number;
};

export type CharacterTraitItem = {
  id: string;
  label: string;
  value: string;
  createdAt: number;
  updatedAt: number;
};

export type CharacterTraitSection = {
  id: string;
  title: string;
  items: CharacterTraitItem[];
  createdAt: number;
  updatedAt: number;
};

export type CharacterControl = "AI" | "User";
export type CharacterRole = "Main" | "Side";

// Hardcoded attribute structures
export type PhysicalAppearance = {
  hairColor: string;
  eyeColor: string;
  build: string;
  bodyHair: string;
  height: string;
  breastSize: string;
  genitalia: string;
  skinTone: string;
  makeup: string;
  bodyMarkings: string;
  temporaryConditions: string;
};

export type CurrentlyWearing = {
  top: string;
  bottom: string;
  undergarments: string;
  miscellaneous: string;
};

export type PreferredClothing = {
  casual: string;
  work: string;
  sleep: string;
  undergarments: string;  // Changed from 'underwear' for consistency
  miscellaneous: string;
};

export type Character = {
  id: string;
  name: string;
  age: string;
  sexType: string;
  location: string;
  currentMood: string;
  controlledBy: CharacterControl;
  characterRole: CharacterRole;
  roleDescription: string;
  tags: string;
  avatarDataUrl: string;
  avatarPosition?: { x: number; y: number };
  
  // Hardcoded attribute sections
  physicalAppearance: PhysicalAppearance;
  currentlyWearing: CurrentlyWearing;
  preferredClothing: PreferredClothing;
  
  // User-created custom sections
  sections: CharacterTraitSection[];
  createdAt: number;
  updatedAt: number;
};

// Session state for per-playthrough tracking
// Extended to support full character editing within sessions
export type CharacterSessionState = {
  id: string;
  characterId: string;
  conversationId: string;
  userId: string;
  // Basic info overrides
  name?: string;
  age?: string;
  sexType?: string;
  roleDescription?: string;
  location: string;
  currentMood: string;
  // Appearance overrides
  physicalAppearance: Partial<PhysicalAppearance>;
  currentlyWearing: CurrentlyWearing;
  preferredClothing?: Partial<PreferredClothing>;
  customSections?: CharacterTraitSection[];
  // Avatar overrides (session-scoped)
  avatarUrl?: string;
  avatarPosition?: { x: number; y: number };
  // Control and role overrides (session-scoped)
  controlledBy?: CharacterControl;
  characterRole?: CharacterRole;
  createdAt: number;
  updatedAt: number;
};

// =============================================
// SIDE CHARACTER TYPES (AI-Generated during play)
// =============================================

// Background info specific to AI-generated side characters
export type SideCharacterBackground = {
  relationshipStatus: string;
  residence: string;
  educationLevel: string;
};

// Personality section for side characters
export type SideCharacterPersonality = {
  traits: string[];         // 1-2 generated personality traits
  miscellaneous: string;
  secrets: string;
  fears: string;
  kinksFantasies: string;
  desires: string;
};

// Complete AI-generated side character profile
export type SideCharacter = {
  id: string;
  name: string;
  age: string;
  sexType: string;
  location: string;
  currentMood: string;
  controlledBy: CharacterControl;   // Can be changed by user during session
  characterRole: CharacterRole;     // Can be promoted to Main by user
  roleDescription: string;          // Their role in the story
  
  // Reused from main Character type
  physicalAppearance: PhysicalAppearance;
  currentlyWearing: CurrentlyWearing;
  preferredClothing: PreferredClothing;
  
  // Side-character specific sections
  background: SideCharacterBackground;
  personality: SideCharacterPersonality;
  
  avatarDataUrl: string;
  avatarPosition?: { x: number; y: number };
  isAvatarGenerating?: boolean;  // For async avatar generation UI
  
  // Metadata
  firstMentionedIn: string;     // Conversation ID where first mentioned
  extractedTraits: string[];    // Traits extracted from dialog for reference
  createdAt: number;
  updatedAt: number;
};

export type ScenarioData = {
  version: number;
  characters: Character[];
  sideCharacters: SideCharacter[];   // AI-generated during play
  world: World;
  story: { openingDialog: OpeningDialog };
  scenes: Scene[];
  uiSettings?: {
    showBackgrounds: boolean;
    transparentBubbles: boolean;
    darkMode: boolean;
  };
  conversations: Conversation[];
  selectedModel?: string;
};

export type ScenarioMetadata = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  coverImagePosition?: { x: number; y: number };
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type AppState = {
  registry: ScenarioMetadata[];
  activeScenarioId: string | null;
};

export type ConversationMetadata = {
  conversationId: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioImageUrl: string | null;
  conversationTitle: string;
  lastMessage: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
};

// User background for the hub page
export type UserBackground = {
  id: string;
  userId: string;
  imageUrl: string;
  isSelected: boolean;
  createdAt: number;
};

export type TabKey = "hub" | "characters" | "world" | "conversations" | "model_settings" | "builder" | "chat_interface";

// Default empty hardcoded attributes
export const defaultPhysicalAppearance: PhysicalAppearance = {
  hairColor: '',
  eyeColor: '',
  build: '',
  bodyHair: '',
  height: '',
  breastSize: '',
  genitalia: '',
  skinTone: '',
  makeup: '',
  bodyMarkings: '',
  temporaryConditions: ''
};

export const defaultCurrentlyWearing: CurrentlyWearing = {
  top: '',
  bottom: '',
  undergarments: '',
  miscellaneous: ''
};

export const defaultPreferredClothing: PreferredClothing = {
  casual: '',
  work: '',
  sleep: '',
  undergarments: '',  // Changed from 'underwear' for consistency
  miscellaneous: ''
};

export const defaultSideCharacterBackground: SideCharacterBackground = {
  relationshipStatus: '',
  residence: '',
  educationLevel: ''
};

export const defaultSideCharacterPersonality: SideCharacterPersonality = {
  traits: [],
  miscellaneous: '',
  secrets: '',
  fears: '',
  kinksFantasies: '',
  desires: ''
};
