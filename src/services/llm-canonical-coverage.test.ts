import { describe, expect, it } from 'vitest';

import { ASSISTANT_STRUCTURE_REMINDER_TEXT, getSystemInstruction, RESPONSE_PRIORITY_CHECK_TEXT } from '@/services/llm';
import { createDefaultScenarioData, getHardcodedTestCharacters, now, uid } from '@/utils';

describe('llm canonical prompt coverage', () => {
  it('serializes canonical story + character authored fields, including custom/freeform values', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Tamlin';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.characterRole = 'Main';
    aiCharacter.age = '27';
    aiCharacter.roleDescription = 'High fae ruler trying to protect his court.';
    aiCharacter.physicalAppearance = {
      ...aiCharacter.physicalAppearance,
      hairColor: 'Golden',
      eyeColor: 'Green',
      build: 'Athletic',
      _extras: [{ id: uid('extra'), label: 'Distinct Mark', value: 'Golden mask scars' }],
    };
    aiCharacter.currentlyWearing = {
      ...aiCharacter.currentlyWearing,
      top: 'Green tunic',
      bottom: 'Dark trousers',
      _extras: [{ id: uid('extra'), label: 'Accessory', value: 'Court signet ring' }],
    };
    aiCharacter.preferredClothing = {
      ...aiCharacter.preferredClothing,
      casual: 'Simple linen shirt',
      work: 'Regal court attire',
      _extras: [{ id: uid('extra'), label: 'Cape', value: 'Emerald travel cape' }],
    };
    (aiCharacter as any).background = {
      ...aiCharacter.background,
      residence: 'Spring Court manor',
      motivation: 'Keep his people safe',
      _extras: [{ id: uid('extra'), label: 'Legacy', value: 'Inherited ancient obligations' }],
    };
    aiCharacter.tone = {
      _extras: [{ id: uid('extra'), label: 'Voice', value: 'Measured and restrained' }],
    };
    aiCharacter.sections = [
      {
        id: uid('sec'),
        title: 'Kinks',
        items: [],
        freeformValue: 'Control dynamics and slow-burn teasing.',
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    (aiCharacter as any).goals = [
      {
        id: uid('goal'),
        title: 'Protect Feyre',
        desiredOutcome: 'Keep her away from political threats.',
        currentStatus: 'Actively watching court movements.',
        flexibility: 'normal',
        steps: [
          { id: uid('step'), description: 'Assign palace guards', completed: true },
        ],
        createdAt: now(),
        updatedAt: now(),
        progress: 50,
      },
    ];

    userCharacter.name = 'Feyre';
    userCharacter.controlledBy = 'User';
    userCharacter.characterRole = 'Main';

    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.scenarioName = "Ashley's Secret";
    appData.world.core.briefDescription = 'A tense romance under political pressure.';
    appData.world.core.storyPremise = 'Two courts negotiate peace while private desires threaten alliances.';
    appData.world.core.structuredLocations = [
      { id: uid('loc'), label: 'Spring Court', description: 'Palace with hidden corridors.' },
    ];
    appData.world.core.dialogFormatting = 'Keep dialogue elegant and concise.';
    appData.world.core.customWorldSections = [
      {
        id: uid('wsec'),
        title: 'Political Stakes',
        items: [{ id: uid('witem'), label: 'Treaty', value: 'One breach means war.' }],
      },
      {
        id: uid('wsec'),
        title: 'Atmosphere',
        items: [],
        type: 'freeform',
        freeformValue: 'Moonlit dread with restrained courtly etiquette.',
      },
    ];
    appData.world.core.storyGoals = [
      {
        id: uid('sgoal'),
        title: 'Secure lasting peace',
        desiredOutcome: 'Both courts ratify treaty without bloodshed.',
        currentStatus: 'Negotiations stalled by mistrust.',
        flexibility: 'normal',
        steps: [{ id: uid('sstep'), description: 'Hold midnight summit', completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
    ];
    appData.contentThemes = {
      characterTypes: [],
      storyType: 'NSFW',
      genres: ['Romance'],
      origin: [],
      triggerWarnings: ['BDSM'],
      customTags: ['forbidden attraction'],
    };

    appData.scenes = [
      {
        id: uid('scene'),
        url: 'https://example.com/scene.jpg',
        tags: ['palace', 'night'],
        isStartingScene: true,
        title: 'Balcony Summit',
        createdAt: now(),
      },
    ];

    const prompt = getSystemInstruction(appData, 4, 'night', [], true, appData.scenes[0]);

    expect(prompt.indexOf('SECTION 1 - CORE ROLE LOGIC')).toBeLessThan(prompt.indexOf('SECTION 2 - STORY AND WORLD CONTEXT'));
    expect(prompt.indexOf('SECTION 2 - STORY AND WORLD CONTEXT')).toBeLessThan(prompt.indexOf('SECTION 3 - MAIN AI CHARACTER CARD INFORMATION'));
    expect(prompt.indexOf('SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES')).toBeLessThan(prompt.indexOf('SECTION 8 - CHAT SETTINGS PER USER PREFERENCE'));

    expect(prompt).toContain("STORY NAME: Ashley's Secret");
    expect(prompt).toContain('BRIEF DESCRIPTION: A tense romance under political pressure.');
    expect(prompt).toContain('STORY PREMISE: Two courts negotiate peace while private desires threaten alliances.');
    expect(prompt).toContain('--- LOCATIONS ---');
    expect(prompt).toContain('- Spring Court: Palace with hidden corridors.');
    expect(prompt).toContain('--- CUSTOM WORLD CONTENT ---');
    expect(prompt).toContain('Treaty: One breach means war.');
    expect(prompt).toContain('Moonlit dread with restrained courtly etiquette.');

    expect(prompt).toContain('MAIN STORY GOALS');
    expect(prompt).toContain('Secure lasting peace.');
    expect(prompt).toContain('Longer view: Both courts ratify treaty without bloodshed.');
    expect(prompt).toContain('Current state: Negotiations stalled by mistrust.');
    expect(prompt).toContain('Open milestone (background context, not a task command): Hold midnight summit.');
    expect(prompt).toContain('This milestone describes long-range direction and may not apply to the current response.');
    expect(prompt).toContain('--- STORY THEMES ---');
    expect(prompt).toContain('Treat these as content permission, background emphasis, and thematic direction, not as a checklist to force into every response.');
    expect(prompt).toContain('- NSFW: This is an ADULT (NSFW) scenario.');
    expect(prompt).toContain('- Romance: Center the narrative around romantic relationships.');
    expect(prompt).toContain('- BDSM: Incorporate BDSM dynamics');
    expect(prompt).toContain('- forbidden attraction: Treat this as a welcomed story element when it fits naturally in the scene.');
    expect(prompt).not.toContain('--- STORY THEMES THE WRITERS HAVE OPTED INTO ---');
    expect(prompt).not.toContain('CORE INVITED CONTENT / BOUNDARIES:');
    expect(prompt).not.toContain('WELCOMED THEMES TO LEAN INTO WHEN NATURAL:');
    expect(prompt).not.toContain('ADDITIONAL USER-REQUESTED THEMES:');
    expect(prompt).not.toContain('LIGHT STORY FLAVOR');
    expect(prompt).not.toContain('MANDATORY CONTENT DIRECTIVES');
    expect(prompt).not.toContain('[Trigger Warnings]');

    expect(prompt).toContain('STORY AND CHARACTER CARD REFERENCE RULE');
    expect(prompt).toContain('provided as reference context');
    expect(prompt).toContain('Do not treat any card field as a checklist of details');

    expect(prompt).toContain('SECTION 3 - MAIN AI CHARACTER CARD INFORMATION');
    expect(prompt).toContain('CHARACTER: Tamlin');
    expect(prompt).toContain('AGE: 27');
    expect(prompt).toContain('ROLE DESCRIPTION: High fae ruler trying to protect his court.');
    expect(prompt).toContain('CONTROLLED BY: AI');
    expect(prompt).toContain('Tamlin PHYSICAL APPEARANCE');
    expect(prompt).toContain('Hair Color: Golden');
    expect(prompt).toContain('Tamlin CURRENTLY WEARING');
    expect(prompt).toContain('Top: Green tunic');
    expect(prompt).toContain('Tamlin PREFERRED CLOTHING');
    expect(prompt).toContain('Casual: Simple linen shirt');
    expect(prompt).toContain('Tamlin CUSTOM CONTENT');
    expect(prompt).toContain('Control dynamics and slow-burn teasing.');
    expect(prompt).toContain('Tamlin GOALS');
    expect(prompt).toContain('Protect Feyre.');
    expect(prompt).toContain('Longer view: Keep her away from political threats.');
    expect(prompt).toContain('Current state: Actively watching court movements.');
    expect(prompt).toContain('SECTION 5 - USER-CONTROLLED CHARACTER CARD INFORMATION');
    expect(prompt).toContain('USER-CONTROLLED CHARACTERS DO NOT GENERATE FOR');
    expect(prompt).toContain('- Feyre');
    expect(prompt).toContain('CONTROLLED BY: User');
    expect(prompt).toContain('SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES');
    expect(prompt).toContain('--- DIALOG FORMATTING RULES ---');
    expect(prompt).toContain("Every AI-written character block must begin with that character's exact card NAME followed by a colon.");
    expect(prompt).toContain("These are formatting tools, not required ingredients.");
    expect(prompt).toContain("Compare against your own previous 2-3 assistant character blocks, not the user's message");
    expect(prompt).not.toContain('Avoid repetitive formatting from one message to another.');
    expect(prompt).toContain("Do not default to action -> dialogue -> internal thought");
    expect(prompt).toContain('--- USER-DEFINED DIALOG FORMATTING FROM STORY BUILDER ---');
    expect(prompt).toContain('--- INTERNAL THOUGHTS ---');
    expect(prompt).toContain('Use them only when they reveal private conflict');
    expect(prompt).toContain('Do not use internal thoughts to repeat obvious facts');
    expect(prompt).toContain('--- PHYSICAL LOGIC, VISIBILITY, AND CONTINUITY ---');
    expect(prompt).toContain('If the user frames something as uncertain, partial, distant, suspected, or not yet confirmed');
    expect(prompt).toContain("If the user's message clearly indicates that only a specific character or set of characters can hear");
    expect(prompt).toContain("The user's action verb is canon, not a paraphrase target.");
    expect(RESPONSE_PRIORITY_CHECK_TEXT).toContain('Write the next response from the immediate scene first.');
    expect(RESPONSE_PRIORITY_CHECK_TEXT).toContain('Use story cards, character cards, memories, and goals as supporting context');
    expect(ASSISTANT_STRUCTURE_REMINDER_TEXT).toContain('Avoid repeating the same structure across your own recent AI responses.');
    expect(ASSISTANT_STRUCTURE_REMINDER_TEXT).toContain("Compare against your own previous 2-3 assistant character blocks, not the user's message.");
    expect(prompt).toContain('SECTION 8 - CHAT SETTINGS PER USER PREFERENCE');
    expect(prompt).toContain('NARRATIVE POV: Third Person');
    expect(prompt).toContain('NSFW INTENSITY: Normal');
    expect(prompt).toContain('RESPONSE DETAIL: Balanced');
    expect(prompt).toContain('REALISM MODE: Off');
    expect(prompt).not.toContain('STRICT WRITING CONTRACT:');
    expect(prompt).not.toContain('Character sheets, goal context, tags, scene labels, and setup themes are reference context, not story vocabulary.');
    expect(prompt).not.toContain('Natural speech may include short fragments');
    expect(prompt).not.toContain('Spoken lines may use short fragments');
    expect(prompt).not.toContain('Within a single response, narration and thought move forward in time only.');
    expect(prompt).not.toContain('Cooperative physical action is the narrow exception');

    expect(prompt).toContain('--- ACTIVE SCENE CONTEXT ---');
    expect(prompt).toContain('- Scene Title: Balcony Summit');
    expect(prompt).toContain('- Active Scene Tag: palace');
  });

  it('treats side-character control assignments as real prompt exclusions/reference context', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Sarah';
    aiCharacter.controlledBy = 'AI';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';

    appData.characters = [aiCharacter, userCharacter];
    appData.sideCharacters = [
      {
        id: uid('side'),
        name: 'Ashley',
        nicknames: '',
        age: '19',
        sexType: 'Female',
        sexualOrientation: '',
        location: 'Cabin',
        currentMood: 'Anxious',
        controlledBy: 'User',
        characterRole: 'Side',
        roleDescription: 'Sarah’s daughter.',
        physicalAppearance: { ...aiCharacter.physicalAppearance },
        currentlyWearing: { ...aiCharacter.currentlyWearing },
        preferredClothing: { ...aiCharacter.preferredClothing },
        background: {
          relationshipStatus: '',
          residence: '',
          educationLevel: '',
        },
        personality: {
          traits: ['guarded'],
          miscellaneous: '',
          secrets: '',
          fears: '',
          kinksFantasies: '',
          desires: '',
        },
        sections: [],
        avatarDataUrl: '',
        firstMentionedIn: uid('conversation'),
        extractedTraits: [],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const prompt = getSystemInstruction(appData, 1, 'night', [], true, null);

    expect(prompt).toContain('USER-CONTROLLED CHARACTERS DO NOT GENERATE FOR');
    expect(prompt).toContain('- James');
    expect(prompt).toContain('- Ashley');
    expect(prompt).toContain('SECTION 5 - USER-CONTROLLED CHARACTER CARD INFORMATION');
    expect(prompt).toContain('CHARACTER: Ashley');
    expect(prompt).toContain('CONTROLLED BY: User');
    expect(prompt).not.toContain('SECTION 4 - SIDE AI CHARACTER CARD INFORMATION');
  });

  it('does not inject trait weighting explanations into the writer-facing personality block', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Ashley';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.characterRole = 'Main';
    aiCharacter.personality = {
      traits: [
        {
          id: uid('trait'),
          label: 'Guarded',
          value: 'Keeps her real feelings hidden until trust has been earned.',
          flexibility: 'rigid',
          adherenceScore: 95,
          scoreTrend: 'rising',
        },
      ],
    } as any;
    appData.characters = [aiCharacter];

    const prompt = getSystemInstruction(appData, 1, 'night', [], true, null);

    expect(prompt).toContain('Ashley PERSONALITY');
    expect(prompt).toContain('- Guarded: Keeps her real feelings hidden until trust has been earned.');
    expect(prompt).not.toContain('This is a stable tendency');
    expect(prompt).not.toContain('This is a core trait');
    expect(prompt).not.toContain('It should strongly color');
    expect(prompt).not.toContain('Let it shape behavior');
    expect(prompt).not.toContain('It is currently reinforcing');
  });

  it('injects only the selected chat setting branches', () => {
    const appData = createDefaultScenarioData();
    appData.uiSettings = {
      ...appData.uiSettings!,
      narrativePov: 'first',
      proactiveCharacterDiscovery: false,
      proactiveNarrative: false,
      nsfwIntensity: 'high',
      responseVerbosity: 'detailed',
      realismMode: true,
    };

    const prompt = getSystemInstruction(appData, 1, 'night', [], true, null);

    expect(prompt).toContain('NARRATIVE POV: First Person');
    expect(prompt).toContain('CHARACTER DISCOVERY: Strict');
    expect(prompt).toContain('PROACTIVE AI MODE: Off');
    expect(prompt).toContain('NSFW INTENSITY: High');
    expect(prompt).toContain('Use explicit, profane, anatomical, and erotic language when it fits the character and moment.');
    expect(prompt).toContain('RESPONSE DETAIL: Detailed');
    expect(prompt).toContain('detailed mode does not mean every character block should be the same length.');
    expect(prompt).not.toContain('Target: usually 3-5 paragraphs per character block.');
    expect(prompt).toContain('REALISM MODE: On');
    expect(prompt).not.toContain('NARRATIVE POV: Third Person');
    expect(prompt).not.toContain('CHARACTER DISCOVERY: Proactive');
    expect(prompt).not.toContain('PROACTIVE AI MODE: On');
    expect(prompt).not.toContain('NSFW INTENSITY: Normal');
    expect(prompt).not.toContain('RESPONSE DETAIL: Concise');
    expect(prompt).not.toContain('RESPONSE DETAIL: Balanced');
    expect(prompt).not.toContain('REALISM MODE: Off');
  });

  it('keeps narrative POV examples generic and story-agnostic', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Mara';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.characterRole = 'Main';
    aiCharacter.roleDescription = 'A guide traveling with the group.';
    aiCharacter.tags = 'guide, practical';
    aiCharacter.location = 'Roadside';
    aiCharacter.currentMood = 'Focused';
    aiCharacter.physicalAppearance = {
      ...aiCharacter.physicalAppearance,
      hairColor: 'Black',
      eyeColor: 'Brown',
      breastSize: '',
      genitalia: '',
    };
    aiCharacter.currentlyWearing = {
      ...aiCharacter.currentlyWearing,
      top: 'Travel jacket',
      bottom: 'Work pants',
      undergarments: '',
      miscellaneous: '',
    };
    aiCharacter.preferredClothing = {
      ...aiCharacter.preferredClothing,
      casual: 'Layered travel clothes',
      work: '',
      sleep: '',
      undergarments: '',
      miscellaneous: '',
    };
    aiCharacter.sections = [];

    userCharacter.name = 'Theo';
    userCharacter.controlledBy = 'User';
    userCharacter.characterRole = 'Main';
    userCharacter.roleDescription = 'The user-controlled traveler.';
    userCharacter.tags = 'traveler';
    userCharacter.sections = [];

    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.scenarioName = 'Neutral Route';
    appData.world.core.briefDescription = 'A group travels through a quiet region.';
    appData.world.core.storyPremise = 'The scene follows cautious movement and ordinary decisions.';
    appData.world.core.structuredLocations = [];
    appData.world.core.storyGoals = [];
    appData.world.core.customWorldSections = [];
    appData.contentThemes = {
      characterTypes: [],
      storyType: null,
      genres: [],
      origin: [],
      triggerWarnings: [],
      customTags: [],
    };
    appData.scenes = [];

    const thirdPersonPrompt = getSystemInstruction(
      { ...appData, uiSettings: { ...appData.uiSettings!, narrativePov: 'third' } },
      1,
      'day',
      [],
      true,
      null,
    );
    const firstPersonPrompt = getSystemInstruction(
      { ...appData, uiSettings: { ...appData.uiSettings!, narrativePov: 'first' } },
      1,
      'day',
      [],
      true,
      null,
    );

    for (const prompt of [thirdPersonPrompt, firstPersonPrompt]) {
      expect(prompt).toContain('Format pattern: CharacterName');
      expect(prompt).not.toContain('Correct example: Ashley');
      expect(prompt).not.toContain("I'm here!");
      expect(prompt).not.toMatch(/\bAshley\b|\bSarah\b|\bJames\b/);
      expect(prompt).not.toMatch(/fought against the wind|lost sight/i);
    }
  });

  it('keeps mechanical planning labels out of the writer-facing system prompt', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Sarah';
    aiCharacter.controlledBy = 'AI';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.storyGoals = [
      {
        id: uid('sgoal'),
        title: 'Survive the storm',
        desiredOutcome: 'Reach shelter and keep everyone alive.',
        currentStatus: 'Searching for warmth.',
        flexibility: 'rigid',
        steps: [{ id: uid('sstep'), description: 'Make the shelter safe enough to rest', completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const prompt = getSystemInstruction(appData, 1, 'sunset', [], true, null);

    expect(prompt).toContain('Survive the storm.');
    expect(prompt).toContain('Longer view: Reach shelter and keep everyone alive.');
    expect(prompt).toContain('Current state: Searching for warmth.');
    expect(prompt).toContain('Open milestone (background context, not a task command): Make the shelter safe enough to rest.');
    expect(prompt).toContain('Goal strength: Rigid.');
    expect(prompt).not.toContain('Next open step');
    expect(prompt).not.toContain('ACTIVE GOALS & STEPS');
    expect(prompt).not.toContain('PENDING STEP');
    expect(prompt).not.toContain('CURRENT STEP');
    expect(prompt).not.toContain('TURN PROGRESSION CONTRACT');
    expect(prompt).not.toContain('CONCRETE SCENE DELTA');
    expect(prompt).not.toContain('DIRECTIVE:');
    expect(prompt).not.toContain('Guidance:');
    expect(prompt).not.toContain('Survival priority');
    expect(prompt).not.toContain('Priority is');
    expect(prompt).not.toContain('The desired outcome is');
    expect(prompt).not.toContain('Right now,');
  });
});
