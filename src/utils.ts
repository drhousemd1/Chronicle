
import { 
  ScenarioData, 
  Character, 
  CharacterTraitItem, 
  CharacterTraitSection, 
  World, 
  OpeningDialog, 
  Conversation, 
  ScenarioMetadata, 
  Scene, 
  ConversationMetadata,
  defaultPhysicalAppearance,
  defaultCurrentlyWearing,
  defaultPreferredClothing
} from './types';

export const REGISTRY_KEY = "rpg_campaign_studio_v3_codex";
export const STORAGE_KEY = REGISTRY_KEY;
export const LIBRARY_KEY = "rpg_campaign_studio_v3_char_lib";
export const SCENARIO_PREFIX = "rpg_scenario_v3_";
export const CONVERSATION_REGISTRY_KEY = "rpg_conversation_registry_v1";
export const APP_VERSION = 3;

export function now(): number {
  return Date.now();
}

// Generate a proper UUID v4 for Supabase compatibility
export function uuid(): string {
  return crypto.randomUUID();
}

// Legacy function for local-only IDs (not stored in Supabase UUID columns)
export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function truncateLine(s: string, max = 90): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

export function safeJsonParse(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

export async function resizeImage(dataUrl: string, maxWidth = 512, maxHeight = 512, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context failed");
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function mkTestTrait(id: string, label: string, value: string): CharacterTraitItem {
  return { id, label, value, createdAt: now(), updatedAt: now() };
}

function mkTestSection(id: string, title: string, items: CharacterTraitItem[]): CharacterTraitSection {
  return { id, title, items, createdAt: now(), updatedAt: now() };
}

export const getHardcodedTestCharacters = (): Character[] => {
  const t = now();
  return [
    {
      id: uuid(),
      name: "Ashley",
      age: "24",
      sexType: "Intersex",
      location: "Living Room",
      currentMood: "Relaxed",
      controlledBy: "AI",
      characterRole: "Main",
      roleDescription: "A caring nurse who lives with the protagonist",
      tags: "sister, nurse, blonde",
      avatarDataUrl: "",
      avatarPosition: { x: 50, y: 35 },
      physicalAppearance: {
        hairColor: "Blonde",
        eyeColor: "Blue",
        build: "Curvy",
        bodyHair: "Smooth",
        height: "5'7\"",
        breastSize: "Large",
        genitalia: "Both",
        skinTone: "Fair",
        makeup: "Light, natural",
        bodyMarkings: "",
        temporaryConditions: ""
      },
      currentlyWearing: {
        top: "White crop top",
        bottom: "Gray leggings",
        undergarments: "Lacy white bra and thong",
        miscellaneous: "Fuzzy slippers"
      },
      preferredClothing: {
        casual: "Crop tops, hoodies, leggings",
        work: "Nurse scrubs",
        sleep: "Oversized t-shirt",
        underwear: "Lacy or silky lingerie",
        miscellaneous: ""
      },
      sections: [
        mkTestSection(uid("sec"), "Personality", [
          mkTestTrait(uid("item"), "Traits", "Caring, playful, slightly mischievous"),
          mkTestTrait(uid("item"), "Likes", "Cooking, movies, teasing"),
          mkTestTrait(uid("item"), "Dislikes", "Being ignored, loud noises"),
        ]),
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: uuid(),
      name: "Player",
      age: "",
      sexType: "Male",
      location: "",
      currentMood: "",
      controlledBy: "User",
      characterRole: "Main",
      roleDescription: "The protagonist",
      tags: "protagonist",
      avatarDataUrl: "",
      avatarPosition: { x: 50, y: 50 },
      physicalAppearance: { ...defaultPhysicalAppearance },
      currentlyWearing: { ...defaultCurrentlyWearing },
      preferredClothing: { ...defaultPreferredClothing },
      sections: [
        mkTestSection(uid("sec"), "Basics", [
          mkTestTrait(uid("item"), "Identity", "Protagonist"),
          mkTestTrait(uid("item"), "Status", "Active"),
        ]),
      ],
      createdAt: t,
      updatedAt: t,
    }
  ];
};

export function createDefaultScenarioData(): ScenarioData {
  const lib = getCharacterLibrary();
  const baseChars = getHardcodedTestCharacters();
  
  const characters = baseChars.map(bc => {
    const existing = lib.find(l => l.name === bc.name); // Match by name instead of old prefixed ID
    return existing ? { ...JSON.parse(JSON.stringify(existing)), id: uuid() } : bc;
  });

  return {
    version: APP_VERSION,
    selectedModel: 'gemini-3-flash-preview',
    characters,
    world: {
      core: {
        scenarioName: "Test story",
        settingOverview: "A cozy apartment setting designed for testing character interactions and narrative flow.",
        rulesOfMagicTech: "Modern-day realism.",
        factions: "None",
        locations: "Living Room, Kitchen, Bedroom",
        historyTimeline: "Current Day",
        toneThemes: "Casual, Intimate, Slice-of-Life",
        plotHooks: "Ashley is relaxing on the sofa when you walk in.",
        narrativeStyle: "Detailed descriptions of environments and character actions. Maintain character traits strictly.",
        dialogFormatting: "Enclose all spoken dialogue in \" \".\nEnclose all physical actions or descriptions in * *.\nEnclose all internal thoughts in ( ).",
      },
      entries: [],
    },
    scenes: [],
    uiSettings: {
      showBackgrounds: true,
      transparentBubbles: false,
      darkMode: false
    },
    story: { 
      openingDialog: {
        enabled: true,
        text: "*Ashley was curled up on the corner of the plush sofa, her legs tucked neatly beneath her.* (I wonder if he had a long day...)\n\n\"Hey,\" *she replied, her voice soft and welcoming.* \"You're back sooner than I expected. How was your day?\"",
        startingDay: 1,
        startingTimeOfDay: 'day',
      }
    },
    conversations: [
      {
        id: uuid(), // Use UUID for Supabase
        title: "Test Session",
        messages: [],
        currentDay: 1,
        currentTimeOfDay: 'day',
        createdAt: now(),
        updatedAt: now(),
      }
    ],
  };
}

export function normalizeScenarioData(raw: any): ScenarioData {
  const t = now();
  const normStr = (x: any) => typeof x === "string" ? x : "";
  const normNum = (x: any, fallback: number) => typeof x === "number" && Number.isFinite(x) ? x : fallback;

  // Check if a string is a valid UUID format
  const isValidUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  // For Supabase entities, ensure UUID format or generate new one
  const ensureUuid = (id: any) => typeof id === "string" && isValidUuid(id) ? id : uuid();

  function normItems(itemsRaw: any): CharacterTraitItem[] {
    if (!Array.isArray(itemsRaw)) return [];
    return itemsRaw.map((it: any) => ({
      id: typeof it?.id === "string" ? it.id : uid("item"), // Items are stored as JSON, can keep prefix
      label: normStr(it?.label),
      value: normStr(it?.value),
      createdAt: normNum(it?.createdAt, t),
      updatedAt: normNum(it?.updatedAt, t),
    }));
  }

  function normSections(secsRaw: any): CharacterTraitSection[] {
    if (!Array.isArray(secsRaw)) return [];
    return secsRaw.map((s: any) => ({
      id: typeof s?.id === "string" ? s.id : uid("sec"), // Sections are stored as JSON, can keep prefix
      title: normStr(s?.title),
      items: normItems(s?.items),
      createdAt: normNum(s?.createdAt, t),
      updatedAt: normNum(s?.updatedAt, t),
    }));
  }

  const characters: Character[] = Array.isArray(raw?.characters)
    ? raw.characters.map((c: any) => ({
        id: ensureUuid(c?.id),
        name: normStr(c?.name),
        age: normStr(c?.age),
        sexType: normStr(c?.sexType || c?.pronouns),
        location: normStr(c?.location),
        currentMood: normStr(c?.currentMood),
        controlledBy: (c?.controlledBy === "User" || c?.controlledBy === "AI") ? c.controlledBy : "AI",
        characterRole: (c?.characterRole === "Main" || c?.characterRole === "Side") ? c.characterRole : "Main",
        roleDescription: normStr(c?.roleDescription),
        tags: normStr(c?.tags),
        avatarDataUrl: normStr(c?.avatarDataUrl),
        avatarPosition: c?.avatarPosition || { x: 50, y: 50 },
        physicalAppearance: {
          hairColor: normStr(c?.physicalAppearance?.hairColor),
          eyeColor: normStr(c?.physicalAppearance?.eyeColor),
          build: normStr(c?.physicalAppearance?.build),
          bodyHair: normStr(c?.physicalAppearance?.bodyHair),
          height: normStr(c?.physicalAppearance?.height),
          breastSize: normStr(c?.physicalAppearance?.breastSize),
          genitalia: normStr(c?.physicalAppearance?.genitalia),
          skinTone: normStr(c?.physicalAppearance?.skinTone),
          makeup: normStr(c?.physicalAppearance?.makeup),
          bodyMarkings: normStr(c?.physicalAppearance?.bodyMarkings),
          temporaryConditions: normStr(c?.physicalAppearance?.temporaryConditions)
        },
        currentlyWearing: {
          top: normStr(c?.currentlyWearing?.top),
          bottom: normStr(c?.currentlyWearing?.bottom),
          undergarments: normStr(c?.currentlyWearing?.undergarments),
          miscellaneous: normStr(c?.currentlyWearing?.miscellaneous)
        },
        preferredClothing: {
          casual: normStr(c?.preferredClothing?.casual),
          work: normStr(c?.preferredClothing?.work),
          sleep: normStr(c?.preferredClothing?.sleep),
          underwear: normStr(c?.preferredClothing?.underwear),
          miscellaneous: normStr(c?.preferredClothing?.miscellaneous)
        },
        sections: normSections(c?.sections),
        createdAt: normNum(c?.createdAt, t),
        updatedAt: normNum(c?.updatedAt, t),
      }))
    : [];

  const world: World = {
    core: {
      scenarioName: normStr(raw?.world?.core?.scenarioName),
      settingOverview: normStr(raw?.world?.core?.settingOverview),
      rulesOfMagicTech: normStr(raw?.world?.core?.rulesOfMagicTech),
      factions: normStr(raw?.world?.core?.factions),
      locations: normStr(raw?.world?.core?.locations),
      historyTimeline: normStr(raw?.world?.core?.historyTimeline),
      toneThemes: normStr(raw?.world?.core?.toneThemes),
      plotHooks: normStr(raw?.world?.core?.plotHooks),
      narrativeStyle: normStr(raw?.world?.core?.narrativeStyle) || "Detailed descriptions of environments and character actions. Maintain character traits strictly.",
      dialogFormatting: normStr(raw?.world?.core?.dialogFormatting) || "Enclose all outspoken dialogue in \" \"\nEnclose all physical actions or descriptions in * *\nEnclose all internal thoughts in ( )",
    },
    entries: Array.isArray(raw?.world?.entries)
      ? raw.world.entries.map((e: any) => ({
          id: ensureUuid(e?.id), // Codex entries need UUID for Supabase
          title: normStr(e?.title),
          body: normStr(e?.body),
          createdAt: normNum(e?.createdAt, t),
          updatedAt: normNum(e?.updatedAt, t),
        }))
      : [],
  };

  const scenes: Scene[] = Array.isArray(raw?.scenes)
    ? raw.scenes.map((s: any) => ({
        id: ensureUuid(s?.id), // Scenes need UUID for Supabase
        url: normStr(s?.url),
        tag: normStr(s?.tag),
        isStartingScene: s?.isStartingScene === true,
        createdAt: normNum(s?.createdAt, t),
      }))
    : [];

  const uiSettings = {
    showBackgrounds: typeof raw?.uiSettings?.showBackgrounds === "boolean" ? raw.uiSettings.showBackgrounds : true,
    transparentBubbles: typeof raw?.uiSettings?.transparentBubbles === "boolean" ? raw.uiSettings.transparentBubbles : false,
    darkMode: typeof raw?.uiSettings?.darkMode === "boolean" ? raw.uiSettings.darkMode : false,
  };

  // Normalize TimeOfDay value
  const normTimeOfDay = (val: any): 'sunrise' | 'day' | 'sunset' | 'night' => {
    if (val === 'sunrise' || val === 'day' || val === 'sunset' || val === 'night') return val;
    return 'day';
  };

  const openingDialog: OpeningDialog = {
    enabled: typeof raw?.story?.openingDialog?.enabled === "boolean" ? raw.story.openingDialog.enabled : true,
    text: normStr(raw?.story?.openingDialog?.text),
    startingDay: normNum(raw?.story?.openingDialog?.startingDay, 1),
    startingTimeOfDay: normTimeOfDay(raw?.story?.openingDialog?.startingTimeOfDay),
  };

  const conversations: Conversation[] = Array.isArray(raw?.conversations)
    ? raw.conversations.map((c: any) => ({
        id: ensureUuid(c?.id), // Conversations need UUID for Supabase
        title: normStr(c?.title) || "Story",
        messages: Array.isArray(c?.messages)
          ? c.messages.map((m: any) => ({
              id: ensureUuid(m?.id), // Messages need UUID for Supabase
              role: m?.role === "system" || m?.role === "assistant" || m?.role === "user" ? m.role : "user",
              text: normStr(m?.text),
              createdAt: normNum(m?.createdAt, t),
            }))
          : [],
        createdAt: normNum(c?.createdAt, t),
        updatedAt: normNum(c?.updatedAt, t),
      }))
    : [];

  return {
    version: APP_VERSION,
    selectedModel: normStr(raw?.selectedModel) || 'gemini-3-flash-preview',
    characters,
    world,
    scenes,
    uiSettings,
    story: { openingDialog },
    conversations,
  };
}

export function getRegistry(): ScenarioMetadata[] {
  const raw = localStorage.getItem(REGISTRY_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw);
  return (parsed.ok && Array.isArray(parsed.value)) ? parsed.value : [];
}

export function saveRegistry(registry: ScenarioMetadata[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

export function loadScenario(id: string): ScenarioData {
  const raw = localStorage.getItem(`${SCENARIO_PREFIX}${id}`);
  if (!raw) return createDefaultScenarioData();
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) return createDefaultScenarioData();
  return normalizeScenarioData(parsed.value);
}

export function saveScenario(id: string, data: ScenarioData) {
  localStorage.setItem(`${SCENARIO_PREFIX}${id}`, JSON.stringify(data));
}

export function deleteScenario(id: string) {
  localStorage.removeItem(`${SCENARIO_PREFIX}${id}`);
  const reg = getRegistry().filter(m => m.id !== id);
  saveRegistry(reg);
}

export function getCharacterLibrary(): Character[] {
  const raw = localStorage.getItem(LIBRARY_KEY);
  if (!raw) {
    const seed = getHardcodedTestCharacters();
    saveCharacterLibrary(seed);
    return seed;
  }
  const parsed = safeJsonParse(raw);
  return (parsed.ok && Array.isArray(parsed.value)) ? parsed.value : getHardcodedTestCharacters();
}

export function saveCharacterLibrary(library: Character[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

// ============ Global Conversation Registry ============

export function getConversationRegistry(): ConversationMetadata[] {
  const raw = localStorage.getItem(CONVERSATION_REGISTRY_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw);
  return (parsed.ok && Array.isArray(parsed.value)) ? parsed.value : [];
}

export function saveConversationRegistry(registry: ConversationMetadata[]) {
  localStorage.setItem(CONVERSATION_REGISTRY_KEY, JSON.stringify(registry));
}

export function updateConversationRegistry(
  scenarioId: string, 
  scenarioTitle: string, 
  conversations: Conversation[]
): ConversationMetadata[] {
  const existing = getConversationRegistry();
  
  // Remove old entries for this scenario
  const filtered = existing.filter(e => e.scenarioId !== scenarioId);
  
  // Add updated entries for all conversations in this scenario
  const newEntries: ConversationMetadata[] = conversations.map(c => {
    const lastMsg = c.messages[c.messages.length - 1];
    return {
      conversationId: c.id,
      scenarioId,
      scenarioTitle,
      conversationTitle: c.title,
      lastMessage: lastMsg ? truncateLine(lastMsg.text, 100) : "",
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });
  
  // Combine and sort by updatedAt (newest first)
  const combined = [...newEntries, ...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
  
  // Limit to 200 entries to prevent storage bloat
  const limited = combined.slice(0, 200);
  
  saveConversationRegistry(limited);
  return limited;
}

export function removeScenarioFromConversationRegistry(scenarioId: string) {
  const existing = getConversationRegistry();
  const filtered = existing.filter(e => e.scenarioId !== scenarioId);
  saveConversationRegistry(filtered);
  return filtered;
}
