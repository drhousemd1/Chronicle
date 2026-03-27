// Node runtime shim for browser-only Supabase client setup
if (!(globalThis as any).localStorage) {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; }
  };
}

const {
  createDefaultScenarioData,
  now,
  uid,
  uuid,
} = await import('../src/utils.ts');

const {
  defaultCharacterBackground,
  defaultCharacterFears,
  defaultCharacterKeyLifeEvents,
  defaultCharacterRelationships,
  defaultCharacterSecrets,
  defaultCharacterTone,
  defaultCurrentlyWearing,
  defaultPhysicalAppearance,
  defaultPreferredClothing,
} = await import('../src/types.ts');

const { getSystemInstruction } = await import('../src/services/llm.ts');

function mkMainCharacter() {
  return {
    id: uuid(),
    name: 'Ariadne',
    nicknames: 'Ari',
    age: '29',
    sexType: 'Female',
    sexualOrientation: 'Bisexual',
    location: 'Clocktower Library',
    currentMood: 'Focused',
    controlledBy: 'AI',
    characterRole: 'Main',
    roleDescription: 'Strategist and archivist',
    tags: 'Scholar, Planner',
    avatarDataUrl: '',
    avatarPosition: { x: 50, y: 50 },
    physicalAppearance: {
      ...defaultPhysicalAppearance,
      hairColor: 'Black with silver streaks',
      eyeColor: 'Gray',
      _extras: [{ id: uid('extra'), label: 'Scars', value: 'Thin scar across left eyebrow' }],
    },
    currentlyWearing: {
      ...defaultCurrentlyWearing,
      top: 'High-collar coat',
      _extras: [{ id: uid('extra'), label: 'Accessory', value: 'Copper compass pendant' }],
    },
    preferredClothing: {
      ...defaultPreferredClothing,
      casual: 'Fitted layers in dark tones',
      _extras: [{ id: uid('extra'), label: 'Footwear', value: 'Soft leather boots' }],
    },
    personality: {
      splitMode: true,
      traits: [],
      outwardTraits: [
        { id: uid('trait'), label: 'Composed', value: 'Stays calm under pressure', flexibility: 'normal' },
      ],
      inwardTraits: [
        { id: uid('trait'), label: 'Self-doubting', value: 'Questions every major decision', flexibility: 'normal' },
      ],
    },
    goals: [
      {
        id: uid('goal'),
        title: 'Decode the Astral Ledger',
        desiredOutcome: 'Recover all missing entries before the eclipse',
        progress: 25,
        flexibility: 'normal',
        steps: [
          { id: uid('step'), description: 'Translate first fragment', completed: true },
          { id: uid('step'), description: 'Cross-check symbol index', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    background: {
      ...defaultCharacterBackground,
      jobOccupation: 'Royal archivist',
      _extras: [{ id: uid('extra'), label: 'Old Mentor', value: 'Master Ilyen disappeared 8 years ago' }],
    },
    tone: {
      ...defaultCharacterTone,
      _extras: [{ id: uid('extra'), label: 'When challenged', value: 'Precise, clipped, unflinching' }],
    },
    keyLifeEvents: {
      ...defaultCharacterKeyLifeEvents,
      _extras: [{ id: uid('extra'), label: 'The Fire', value: 'Lost family archive in city fire at age 17' }],
    },
    relationships: {
      ...defaultCharacterRelationships,
      _extras: [{ id: uid('extra'), label: 'Cassian', value: 'Trusted partner but frequent ideological clashes' }],
    },
    secrets: {
      ...defaultCharacterSecrets,
      _extras: [{ id: uid('extra'), label: 'Forgery', value: 'Secretly altered a treaty to prevent war' }],
    },
    fears: {
      ...defaultCharacterFears,
      _extras: [{ id: uid('extra'), label: 'Failure', value: 'Terrified of causing another archival loss' }],
    },
    sections: [
      {
        id: uid('sec'),
        title: 'Artifacts',
        type: 'structured',
        items: [
          { id: uid('item'), label: 'Relic', value: 'Sun-key etched with star maps', createdAt: now(), updatedAt: now() },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uid('sec'),
        title: 'Private Notes',
        type: 'freeform',
        items: [],
        freeformValue: 'She records every omen in a cipher only she can read.',
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };
}

function mkUserCharacter() {
  return {
    ...mkMainCharacter(),
    id: uuid(),
    name: 'Rowan',
    controlledBy: 'User',
    roleDescription: 'Field operative',
    sections: [
      {
        id: uid('sec'),
        title: 'User Notes',
        type: 'freeform',
        items: [],
        freeformValue: 'Rowan keeps hidden routes mapped in charcoal notebooks.',
        createdAt: now(),
        updatedAt: now(),
      },
    ],
  };
}

function mkSideCharacter() {
  return {
    id: uuid(),
    name: 'Mara',
    nicknames: 'M',
    age: '34',
    sexType: 'Female',
    sexualOrientation: 'Pansexual',
    location: 'Signal room',
    currentMood: 'Guarded',
    controlledBy: 'AI',
    characterRole: 'Side',
    roleDescription: 'Signal intelligence specialist',
    physicalAppearance: {
      ...defaultPhysicalAppearance,
      hairColor: 'Copper',
      eyeColor: 'Amber',
      _extras: [{ id: uid('extra'), label: 'Tattoo', value: 'Wave sigil behind right ear' }],
    },
    currentlyWearing: {
      ...defaultCurrentlyWearing,
      top: 'Signal corps jacket',
      _extras: [{ id: uid('extra'), label: 'Device', value: 'Wrist relay tuned to shortwave' }],
    },
    preferredClothing: {
      ...defaultPreferredClothing,
      casual: 'Functional travel gear',
      _extras: [{ id: uid('extra'), label: 'Color', value: 'Muted navy and charcoal' }],
    },
    background: {
      relationshipStatus: 'Single',
      residence: 'Harbor district loft',
      educationLevel: 'Military academy',
    },
    personality: {
      traits: ['Observant', 'Dry humor'],
      miscellaneous: 'Collects old radio valves',
      secrets: 'Intercepts and archives forbidden transmissions',
      fears: 'Being exposed as an informant',
      kinksFantasies: '',
      desires: 'Build a private communication network',
    },
    avatarDataUrl: '',
    avatarPosition: { x: 50, y: 50 },
    firstMentionedIn: 'conv-1',
    extractedTraits: ['Observant', 'Dry humor'],
    createdAt: now(),
    updatedAt: now(),
  };
}

function printBlock(label: string, content: string) {
  console.log(`\n==================== ${label} ====================`);
  console.log(content);
}

function expectContains(prompt: string, needle: string, label: string) {
  const pass = prompt.includes(needle);
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${label}`);
  if (!pass) {
    console.log(`  Missing text: ${needle}`);
  }
  return pass;
}

const scenario = createDefaultScenarioData();
scenario.world.core.scenarioName = 'Chronicle Validation Run';
scenario.world.core.storyPremise = 'A race to decode prophecy fragments before an eclipse destabilizes the city.';
scenario.world.core.factions = 'Archive Council, Night Couriers';
scenario.world.core.structuredLocations = [
  { id: uid('loc'), label: 'Clocktower Library', description: 'Ancient records and restricted vaults.' },
  { id: uid('loc'), label: 'Harbor District', description: 'Signal relays and courier routes.' },
];
scenario.world.core.customWorldSections = [
  {
    id: uid('wcs'),
    title: 'Rumor Net',
    type: 'structured',
    items: [{ id: uid('wci'), label: 'Current Whisper', value: 'The eclipse will awaken dormant wards.' }],
  },
  {
    id: uid('wcs'),
    title: 'Forbidden Lore',
    type: 'freeform',
    items: [],
    freeformValue: 'Only moonlight reveals the true ink beneath redacted passages.',
  },
];
scenario.characters = [mkMainCharacter(), mkUserCharacter()];
scenario.sideCharacters = [mkSideCharacter()];
scenario.scenes = [{ id: uid('scene'), url: '', title: 'Clocktower', tags: ['mystery', 'eclipse'], createdAt: now() }];

const prompt = getSystemInstruction(scenario, 4, 'night');

const customWorldStart = prompt.indexOf('CUSTOM WORLD CONTENT:');
const castStart = prompt.indexOf('CAST:');
const sceneStart = prompt.indexOf('AVAILABLE SCENES:');

const customWorldBlock = customWorldStart >= 0 && castStart > customWorldStart
  ? prompt.slice(customWorldStart, castStart).trim()
  : 'CUSTOM WORLD CONTENT block not found';

const castBlock = castStart >= 0 && sceneStart > castStart
  ? prompt.slice(castStart, sceneStart).trim()
  : 'CAST block not found';

printBlock('CUSTOM WORLD CONTENT BLOCK', customWorldBlock);
printBlock('CAST BLOCK', castBlock);

console.log('\n==================== ASSERTIONS ====================');
const checks = [
  expectContains(prompt, '[Forbidden Lore]:', 'World freeform section title serialized'),
  expectContains(prompt, 'Forbidden Lore Notes: Only moonlight reveals the true ink beneath redacted passages.', 'World freeform value serialized into labeled row'),
  expectContains(prompt, '[Private Notes]:\n      - Private Notes Notes: She records every omen in a cipher only she can read.', 'Character freeform custom section serialized'),
  expectContains(prompt, 'PHYSICAL APPEARANCE:\n      - Hair Color: Black with silver streaks', 'Hardcoded character fields serialized under headings'),
  expectContains(prompt, 'USER CHARACTER REFERENCE (READ-ONLY CONTEXT):', 'User-controlled character reference included'),
  expectContains(prompt, 'SIDE CHARACTER REFERENCE:', 'Side-character reference included'),
  expectContains(prompt, 'CUSTOM TRAITS / CUSTOM CONTENT:\n    [User Notes]:\n      - User Notes Notes: Rowan keeps hidden routes mapped in charcoal notebooks.', 'User freeform custom section serialized'),
];

const failed = checks.filter((ok) => !ok).length;
if (failed > 0) {
  console.error(`\nVerification failed: ${failed} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nAll checks passed.');
}
