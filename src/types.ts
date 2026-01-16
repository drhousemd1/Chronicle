
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
  underwear: string;
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
export type CharacterSessionState = {
  id: string;
  characterId: string;
  conversationId: string;
  userId: string;
  location: string;
  currentMood: string;
  physicalAppearance: Partial<PhysicalAppearance>;
  currentlyWearing: CurrentlyWearing;
  createdAt: number;
  updatedAt: number;
};

export type ScenarioData = {
  version: number;
  characters: Character[];
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
  conversationTitle: string;
  lastMessage: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
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
  underwear: '',
  miscellaneous: ''
};
