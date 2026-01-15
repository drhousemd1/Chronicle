
import { ScenarioData, Character, CharacterTraitItem, CharacterTraitSection, World, OpeningDialog, Conversation, ScenarioMetadata, Scene } from './types';

export const REGISTRY_KEY = "rpg_campaign_studio_v3_codex";
export const STORAGE_KEY = REGISTRY_KEY;
export const LIBRARY_KEY = "rpg_campaign_studio_v3_char_lib";
export const SCENARIO_PREFIX = "rpg_scenario_v3_";
export const APP_VERSION = 3;

export function now(): number {
  return Date.now();
}

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
      id: "char_test_ashley",
      name: "Ashley",
      sexType: "Intersex",
      controlledBy: "AI",
      characterRole: "Main",
      tags: "sister, nurse, blonde",
      avatarDataUrl: "",
      avatarPosition: { x: 50, y: 35 },
      sections: [
        mkTestSection("sec_test_appearance", "Appearance", [
          mkTestTrait("it_test_eye", "Eye Color", "Blue"),
          mkTestTrait("it_test_hair_col", "Hair Color", "Blonde"),
          mkTestTrait("it_test_hair_style", "Hair Style / Length", "Long, pony tail or worn straight."),
          mkTestTrait("it_test_breasts", "Breasts", "Massive"),
          mkTestTrait("it_test_penis", "Penis", "Large"),
        ]),
        mkTestSection("sec_test_clothing", "Clothing Preference", [
          mkTestTrait("it_test_shirts", "Shirts", "Crop tops, hoodies"),
          mkTestTrait("it_test_pants", "Pants", "Leggings, short shorts"),
          mkTestTrait("it_test_under", "Underwear", "Lacy or silky thongs"),
          mkTestTrait("it_test_bras", "Bras", "Lacy or silky bras"),
        ]),
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "char_test_player",
      name: "Player",
      sexType: "Male",
      controlledBy: "User",
      characterRole: "Main",
      tags: "protagonist",
      avatarDataUrl: "",
      avatarPosition: { x: 50, y: 50 },
      sections: [
        mkTestSection("sec_test_player_basics", "Basics", [
          mkTestTrait("it_test_player_id", "Identity", "Protagonist"),
          mkTestTrait("it_test_player_status", "Status", "Active"),
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
    const existing = lib.find(l => l.id === bc.id);
    return existing ? JSON.parse(JSON.stringify(existing)) : bc;
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
      transparentBubbles: false
    },
    story: { 
      openingDialog: {
        enabled: true,
        text: "*Ashley was curled up on the corner of the plush sofa, her legs tucked neatly beneath her.* (I wonder if he had a long day...)\n\n\"Hey,\" *she replied, her voice soft and welcoming.* \"You're back sooner than I expected. How was your day?\"",
      }
    },
    conversations: [
      {
        id: "conv_test_default",
        title: "Test Session",
        messages: [],
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

  function normItems(itemsRaw: any): CharacterTraitItem[] {
    if (!Array.isArray(itemsRaw)) return [];
    return itemsRaw.map((it: any) => ({
      id: typeof it?.id === "string" ? it.id : uid("item"),
      label: normStr(it?.label),
      value: normStr(it?.value),
      createdAt: normNum(it?.createdAt, t),
      updatedAt: normNum(it?.updatedAt, t),
    }));
  }

  function normSections(secsRaw: any): CharacterTraitSection[] {
    if (!Array.isArray(secsRaw)) return [];
    return secsRaw.map((s: any) => ({
      id: typeof s?.id === "string" ? s.id : uid("sec"),
      title: normStr(s?.title),
      items: normItems(s?.items),
      createdAt: normNum(s?.createdAt, t),
      updatedAt: normNum(s?.updatedAt, t),
    }));
  }

  const characters: Character[] = Array.isArray(raw?.characters)
    ? raw.characters.map((c: any) => ({
        id: typeof c?.id === "string" ? c.id : uid("char"),
        name: normStr(c?.name),
        sexType: normStr(c?.sexType || c?.pronouns),
        controlledBy: (c?.controlledBy === "User" || c?.controlledBy === "AI") ? c.controlledBy : "AI",
        characterRole: (c?.characterRole === "Main" || c?.characterRole === "Side") ? c.characterRole : "Main",
        tags: normStr(c?.tags),
        avatarDataUrl: normStr(c?.avatarDataUrl),
        avatarPosition: c?.avatarPosition || { x: 50, y: 50 },
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
          id: typeof e?.id === "string" ? e.id : uid("codex"),
          title: normStr(e?.title),
          body: normStr(e?.body),
          createdAt: normNum(e?.createdAt, t),
          updatedAt: normNum(e?.updatedAt, t),
        }))
      : [],
  };

  const scenes: Scene[] = Array.isArray(raw?.scenes)
    ? raw.scenes.map((s: any) => ({
        id: typeof s?.id === "string" ? s.id : uid("scene"),
        url: normStr(s?.url),
        tag: normStr(s?.tag),
        isStartingScene: s?.isStartingScene === true,
        createdAt: normNum(s?.createdAt, t),
      }))
    : [];

  const uiSettings = {
    showBackgrounds: typeof raw?.uiSettings?.showBackgrounds === "boolean" ? raw.uiSettings.showBackgrounds : true,
    transparentBubbles: typeof raw?.uiSettings?.transparentBubbles === "boolean" ? raw.uiSettings.transparentBubbles : false,
  };

  const openingDialog: OpeningDialog = {
    enabled: typeof raw?.story?.openingDialog?.enabled === "boolean" ? raw.story.openingDialog.enabled : true,
    text: normStr(raw?.story?.openingDialog?.text),
  };

  const conversations: Conversation[] = Array.isArray(raw?.conversations)
    ? raw.conversations.map((c: any) => ({
        id: typeof c?.id === "string" ? c.id : uid("conv"),
        title: normStr(c?.title) || "Story",
        messages: Array.isArray(c?.messages)
          ? c.messages.map((m: any) => ({
              id: typeof m?.id === "string" ? m.id : uid("msg"),
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
