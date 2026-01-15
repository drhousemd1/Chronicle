
export type MessageRole = "system" | "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export type OpeningDialog = {
  enabled: boolean;
  text: string;
};

export type WorldCore = {
  scenarioName: string;
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

export type Character = {
  id: string;
  name: string;
  sexType: string;
  controlledBy: CharacterControl;
  characterRole: CharacterRole;
  tags: string;
  avatarDataUrl: string;
  avatarPosition?: { x: number; y: number };
  sections: CharacterTraitSection[];
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
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type AppState = {
  registry: ScenarioMetadata[];
  activeScenarioId: string | null;
};

export type TabKey = "hub" | "characters" | "world" | "conversations" | "import_export" | "model_settings" | "builder" | "chat_interface";
