import { describe, expect, it } from 'vitest';

import { buildCurrentTurnStateDigest, buildRoleplayApiMessages, EXECUTION_BRIEF_TEXT, getSystemInstruction, REGENERATION_DIRECTIVE_TEXT } from '@/services/llm';
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
        items: [
          { id: uid('witem'), label: 'Treaty', value: 'One breach means war.' },
          { id: uid('witem'), label: 'Legacy Notes', value: ['First pressure point.', 'Second pressure point.'] as any },
        ],
      },
      {
        id: uid('wsec'),
        title: 'Atmosphere',
        items: [],
        type: 'freeform',
        freeformValue: ['Moonlit dread.', 'Restrained courtly etiquette.'] as any,
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
    expect(prompt).toContain('Legacy Notes: First pressure point.\nSecond pressure point.');
    expect(prompt).toContain('Moonlit dread.\nRestrained courtly etiquette.');
    expect(prompt).toContain('Political Stakes\n- Treaty: One breach means war.\n- Legacy Notes: First pressure point.\nSecond pressure point.\n\nAtmosphere\n- Atmosphere Notes: Moonlit dread.\nRestrained courtly etiquette.');
    expect(prompt).not.toContain('war.,Atmosphere');
    expect(prompt).not.toContain('First pressure point., Second pressure point.');
    expect(prompt).not.toContain('Moonlit dread., Restrained courtly etiquette.');

    expect(prompt).toContain('MAIN STORY GOALS');
    expect(prompt).toContain('STORY GOAL: Secure lasting peace');
    expect(prompt).toContain('Long-range direction: Both courts ratify treaty without bloodshed.');
    expect(prompt).toContain('Current progress: Negotiations stalled by mistrust. 0/1 milestones complete.');
    expect(prompt).toContain('Current open milestone: Hold midnight summit.');
    expect(prompt).toContain('Use this goal as background direction for realistic long-term progression.');
    expect(prompt).toContain('--- STORY THEMES ---');
    expect(prompt).toContain('Treat these as content permission, background emphasis, and thematic direction, not as a checklist to force into every response.');
    expect(prompt).toContain("Selected story themes are creator-approved direction for the scenario.");
    expect(prompt).toContain('- NSFW: This is an ADULT (NSFW) scenario.');
    expect(prompt).toContain('- Romance: May center the narrative around romantic relationships.');
    expect(prompt).toContain('- BDSM: May incorporate BDSM dynamics');
    expect(prompt).toContain('- forbidden attraction: Treat this as a welcomed story element when it fits naturally in the scene.');
    expect(prompt).not.toContain('Canon events');
    expect(prompt).not.toContain('--- STORY THEMES THE WRITERS HAVE OPTED INTO ---');
    expect(prompt).not.toContain('CORE INVITED CONTENT / BOUNDARIES:');
    expect(prompt).not.toContain('WELCOMED THEMES TO LEAN INTO WHEN NATURAL:');
    expect(prompt).not.toContain('ADDITIONAL USER-REQUESTED THEMES:');
    expect(prompt).not.toContain('LIGHT STORY FLAVOR');
    expect(prompt).not.toContain('MANDATORY CONTENT DIRECTIVES');
    expect(prompt).not.toContain('[Trigger Warnings]');

    expect(prompt).toContain('STORY AND CHARACTER CARD REFERENCE RULE');
    expect(prompt).toContain('provided as reference context');
    expect(prompt).toContain("relationships, history, and each character's current state");
    expect(prompt).toContain('do not keep restating an established detail with the same wording or descriptive focus');
    expect(prompt).toContain('write what changes, what it causes, or how characters respond to it');
    expect(prompt).toContain('World locations, supplies, and custom world content are creator reference, not automatic character knowledge.');

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
    expect(prompt).toContain('CHARACTER GOAL: Protect Feyre');
    expect(prompt).toContain('Long-range direction: Keep her away from political threats.');
    expect(prompt).toContain('Current progress: Actively watching court movements. 1/1 milestones complete.');
    expect(prompt).toContain('SECTION 5 - USER-CONTROLLED CHARACTER CARD INFORMATION');
    expect(prompt).toContain('USER-CONTROLLED CHARACTERS DO NOT GENERATE FOR');
    expect(prompt).toContain('- Feyre');
    expect(prompt).toContain('CONTROLLED BY: User');
    expect(prompt).toContain('SECTION 7 - DIALOG FORMATTING AND ROLEPLAY RULES');
    expect(prompt).toContain('--- DIALOG FORMATTING RULES ---');
    expect(prompt).toContain("Every AI-written character block must begin with that character's exact card NAME followed by a colon.");
    expect(prompt).toContain("These are formatting tools, not required ingredients.");
    expect(prompt).toContain('Do not default to the same action -> dialogue -> internal thought order.');
    expect(prompt).not.toContain('Avoid repetitive formatting from one message to another.');
    expect(prompt).toContain('the response should include external dialogue');
    expect(prompt).toContain('External dialogue must have a clear conversational purpose in the current exchange.');
    expect(prompt).toContain('If a spoken line sounds vague, circular, or semantically unclear, rewrite it before output.');
    expect(prompt).toContain('A character block should follow one clear conversational thread.');
    expect(prompt).toContain('--- USER-DEFINED DIALOG FORMATTING FROM STORY BUILDER ---');
    expect(prompt).toContain('--- INTERNAL THOUGHTS ---');
    expect(prompt).toContain('Use internal thoughts only when they reveal private conflict');
    expect(prompt).toContain('Each internal thought should read as one coherent, private thought about only one particular issue or concern at a time');
    expect(prompt).toContain('Do not combine or stitch multiple unrelated internal thoughts together inside one parenthetical.');
    expect(prompt).toContain('If a character has more than one internal thought in one character block');
    expect(prompt).toContain('Do not chain multiple internal thoughts back-to-back.');
    expect(prompt).toContain('Internal thoughts must follow the established facts of the current scene, character card data, and story card data');
    expect(prompt).toContain('Do not use thoughts to introduce unsupported facts, assume off-screen actions, summarize events that have not happened, repeat obvious facts');
    expect(prompt).toContain('--- PHYSICAL LOGIC, VISIBILITY, AND CONTINUITY ---');
    expect(prompt).toContain('Suspicion, possibility, fear, partial visibility, or hidden detail is not confirmation.');
    expect(prompt).toContain('Covered, concealed, off-screen, or otherwise unperceived details cannot be named as exact facts');
    expect(prompt).toContain('When the latest user message establishes a physical change, the next response must continue from that established physical state.');
    expect(prompt).toContain('User control is about authorship, not contact.');
    expect(prompt).toContain('AI-controlled characters can create AI-owned actions that externally affect a user-controlled character');
    expect(prompt).toContain("Do not author the user character's response to that change.");
    expect(prompt).toContain("When the next meaningful moment depends on the user character's response");
    expect(EXECUTION_BRIEF_TEXT).toContain('Continue from the latest established scene change.');
    expect(EXECUTION_BRIEF_TEXT).toContain('Recent messages provide story state and continuity, not a template for response length or structure.');
    expect(EXECUTION_BRIEF_TEXT).toContain('Follow the active Response Detail setting.');
    expect(EXECUTION_BRIEF_TEXT).toContain("Develop the AI-controlled character's side of the current exchange before stopping for the user.");
    expect(EXECUTION_BRIEF_TEXT).toContain('Stop before narrating any user-owned response');
    expect(REGENERATION_DIRECTIVE_TEXT).toContain('Change the execution rather than the situation');
    expect(REGENERATION_DIRECTIVE_TEXT).not.toContain('action-led opening');
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

  it('builds a compact current-turn state digest from known runtime state', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    aiCharacter.name = 'Sarah';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.location = 'Abandoned cabin interior';
    aiCharacter.scenePosition = 'Standing beside the hearth with one hand on the blanket';
    aiCharacter.currentMood = 'focused and worried';
    userCharacter.name = 'James';
    userCharacter.controlledBy = 'User';
    userCharacter.location = 'Abandoned cabin interior';
    userCharacter.scenePosition = 'Near Sarah by the fireplace';
    appData.characters = [aiCharacter, userCharacter];

    const digest = buildCurrentTurnStateDigest({
      appData,
      currentDay: 2,
      currentTimeOfDay: 'night',
      activeScene: { id: uid('scene'), url: '', title: 'Cabin Shelter', tags: ['cabin'], createdAt: now() },
      memories: [
        { id: uid('memory'), conversationId: 'conv', content: 'Sarah already knows the hidden clothing detail.', day: 2, timeOfDay: 'night', source: 'message', entryType: 'bullet', createdAt: 1, updatedAt: 1 },
      ],
      memoriesEnabled: true,
    });

    expect(digest).toContain('[CURRENT TURN STATE]');
    expect(digest).toContain('Use this as the active scene anchor.');
    expect(digest).toContain('Story clock: Day 2');
    expect(digest).toContain('Active scene: Cabin Shelter tags=cabin');
    expect(digest).toContain('Sarah (AI): location=Abandoned cabin interior; position=Standing beside the hearth');
    expect(digest).toContain('James (User): location=Abandoned cabin interior; position=Near Sarah by the fireplace');
    expect(digest).toContain('Current-day memory anchors: Sarah already knows the hidden clothing detail.');
    expect(digest).not.toContain('[CURRENT SCENE SNAPSHOT]');
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

  it('frames AI-controlled side characters as active supporting participants', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Mara';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.characterRole = 'Main';
    userCharacter.name = 'Theo';
    userCharacter.controlledBy = 'User';
    userCharacter.characterRole = 'Main';

    appData.characters = [aiCharacter, userCharacter];
    appData.sideCharacters = [
      {
        id: uid('side'),
        name: 'Iris',
        nicknames: '',
        age: '31',
        sexType: 'Female',
        sexualOrientation: '',
        location: 'Roadside',
        currentMood: 'Watchful',
        controlledBy: 'AI',
        characterRole: 'Side',
        roleDescription: 'A scout traveling with the group.',
        physicalAppearance: { ...aiCharacter.physicalAppearance },
        currentlyWearing: { ...aiCharacter.currentlyWearing },
        preferredClothing: { ...aiCharacter.preferredClothing },
        background: {
          relationshipStatus: '',
          residence: '',
          educationLevel: '',
        },
        personality: {
          traits: ['observant'],
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

    expect(prompt).toContain('SECTION 4 - SIDE AI CHARACTER CARD INFORMATION');
    expect(prompt).toContain('Side characters are supporting participants, not passive background.');
    expect(prompt).toContain('Keep the main AI character as the default focus');
    expect(prompt).toContain('let present side characters speak or act when their established role in the current scene gives them a clear reason to contribute');
    expect(prompt).toContain('Do not let side characters take over the response unless the current scene has naturally shifted focus to them.');
    expect(prompt).toContain('CHARACTER: Iris');
    expect(prompt).toContain('CONTROLLED BY: AI');
    expect(prompt).not.toContain('do take somewhat of a back seat');
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
      nsfwIntensity: 'high',
      responseVerbosity: 'detailed',
      realismMode: true,
    };

    const prompt = getSystemInstruction(appData, 1, 'night', [], true, null);

    expect(prompt).toContain('NARRATIVE POV: First Person');
    expect(prompt).toContain('CHARACTER INTRODUCTION DURING ROLEPLAY');
    expect(prompt).toContain('Keep focus on established characters unless the current scene genuinely requires another participant to make the situation coherent.');
    expect(prompt).toContain('For stories based on established media, use established source characters only when the story setup already makes them part of the active situation.');
    expect(prompt).not.toContain('makes their presence useful');
    expect(prompt).not.toContain('make their presence fitting');
    expect(prompt).toContain('NSFW INTENSITY: High');
    expect(prompt).toContain('Use explicit, profane, anatomical, and erotic language when it fits the character and moment.');
    expect(prompt).toContain('RESPONSE DETAIL: Detailed');
    expect(prompt).toContain('RESPONSE DETAIL / DEVELOPMENT LEVEL');
    expect(prompt).toContain('Develop the AI-controlled side of the current exchange fully');
    expect(prompt).toContain('Do not concentrate most of the detail in one opening narration section');
    expect(prompt).toContain('Description should support what is changing, being interacted with, being decided, or being felt now.');
    expect(prompt).toContain("Build out the AI-controlled character's action and dialogue before stopping for the user.");
    expect(prompt).not.toContain('Target: usually 3-5 paragraphs per character block.');
    expect(prompt).toContain('REALISM MODE: On');
    expect(prompt).not.toContain('NARRATIVE POV: Third Person');
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
      expect(prompt).toContain('This POV setting controls pronouns only.');
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

    expect(prompt).toContain('STORY GOAL: Survive the storm');
    expect(prompt).toContain('Long-range direction: Reach shelter and keep everyone alive.');
    expect(prompt).toContain('Current progress: Searching for warmth. 0/1 milestones complete.');
    expect(prompt).toContain('Current open milestone: Make the shelter safe enough to rest.');
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

  it('renders all eligible goals while exposing only each goal next unfinished milestone', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Rowan';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.goals = [
      {
        id: uid('cgoal-a'),
        title: 'Build trust',
        desiredOutcome: 'Earn enough trust for honest cooperation.',
        currentStatus: 'They are still guarded around each other.',
        progress: 0,
        flexibility: 'normal',
        steps: [
          { id: uid('cstep-a1'), description: 'First character open milestone', completed: false },
          { id: uid('cstep-a2'), description: 'Second character milestone that should stay hidden', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uid('cgoal-b'),
        title: 'Hold boundaries',
        desiredOutcome: 'Keep emotional pressure from becoming reckless.',
        currentStatus: 'Boundaries have been stated once.',
        progress: 20,
        flexibility: 'rigid',
        steps: [
          { id: uid('cstep-b1'), description: 'Completed character milestone', completed: true },
          { id: uid('cstep-b2'), description: 'Next character open milestone', completed: false },
          { id: uid('cstep-b3'), description: 'Later character milestone that should stay hidden', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    userCharacter.name = 'Mira';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.storyGoals = [
      {
        id: uid('sgoal-a'),
        title: 'Stabilize the city',
        desiredOutcome: 'Keep the city from collapsing into faction conflict.',
        currentStatus: 'The first negotiations are incomplete.',
        flexibility: 'normal',
        steps: [
          { id: uid('sstep-a1'), description: 'First story open milestone', completed: false },
          { id: uid('sstep-a2'), description: 'Second story milestone that should stay hidden', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uid('sgoal-b'),
        title: 'Expose the conspiracy',
        desiredOutcome: 'Reveal the hidden faction without rushing the investigation.',
        currentStatus: 'One clue has been confirmed.',
        flexibility: 'flexible',
        steps: [
          { id: uid('sstep-b1'), description: 'Completed story milestone', completed: true },
          { id: uid('sstep-b2'), description: 'Next story open milestone', completed: false },
          { id: uid('sstep-b3'), description: 'Later story milestone that should stay hidden', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const prompt = getSystemInstruction(appData, 1, 'day', [], true, null);

    expect(prompt).toContain('STORY GOAL: Stabilize the city');
    expect(prompt).toContain('STORY GOAL: Expose the conspiracy');
    expect(prompt).toContain('CHARACTER GOAL: Build trust');
    expect(prompt).toContain('CHARACTER GOAL: Hold boundaries');
    expect(prompt).toContain('Current open milestone: First story open milestone.');
    expect(prompt).toContain('Current open milestone: Next story open milestone.');
    expect(prompt).toContain('Current open milestone: First character open milestone.');
    expect(prompt).toContain('Current open milestone: Next character open milestone.');
    expect(prompt).not.toContain('Second story milestone that should stay hidden');
    expect(prompt).not.toContain('Later story milestone that should stay hidden');
    expect(prompt).not.toContain('Second character milestone that should stay hidden');
    expect(prompt).not.toContain('Later character milestone that should stay hidden');
  });

  it('omits dropped goals from the rendered writer prompt and skips blank open milestones', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();

    aiCharacter.name = 'Rowan';
    aiCharacter.controlledBy = 'AI';
    aiCharacter.goals = [
      {
        id: uid('dropped-character-goal'),
        title: 'Dropped character goal',
        desiredOutcome: 'This should not reach the writer.',
        currentStatus: '',
        progress: 0,
        flexibility: 'rigid',
        alignment: {
          goalId: 'dropped-character-goal',
          goalKind: 'character',
          characterId: aiCharacter.id,
          score: 0,
          status: 'dropped',
          trend: 'falling',
          supportCount: 0,
          resistanceCount: 6,
          driftCount: 0,
          lastSignal: 'resistance',
        },
        steps: [{ id: uid('hidden-cstep'), description: 'Hidden dropped character milestone', completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uid('blank-character-goal'),
        title: 'Blank first character step',
        desiredOutcome: 'Keep the valid milestone visible.',
        currentStatus: '',
        progress: 0,
        flexibility: 'normal',
        steps: [
          { id: uid('blank-cstep'), description: '   ', completed: false },
          { id: uid('valid-cstep'), description: 'Valid character milestone after blank step', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    userCharacter.name = 'Mira';
    userCharacter.controlledBy = 'User';
    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.storyGoals = [
      {
        id: uid('dropped-story-goal'),
        title: 'Dropped story goal',
        desiredOutcome: 'This should not reach the writer.',
        currentStatus: '',
        flexibility: 'rigid',
        alignment: {
          goalId: 'dropped-story-goal',
          goalKind: 'story',
          score: 0,
          status: 'dropped',
          trend: 'falling',
          supportCount: 0,
          resistanceCount: 6,
          driftCount: 0,
          lastSignal: 'resistance',
        },
        steps: [{ id: uid('hidden-sstep'), description: 'Hidden dropped story milestone', completed: false }],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uid('blank-story-goal'),
        title: 'Blank first story step',
        desiredOutcome: 'Keep the valid story milestone visible.',
        currentStatus: '',
        flexibility: 'normal',
        steps: [
          { id: uid('blank-sstep'), description: '', completed: false },
          { id: uid('valid-sstep'), description: 'Valid story milestone after blank step', completed: false },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ];

    const prompt = getSystemInstruction(appData, 1, 'day', [], true, null);

    expect(prompt).not.toContain('Dropped story goal');
    expect(prompt).not.toContain('Hidden dropped story milestone');
    expect(prompt).not.toContain('Dropped character goal');
    expect(prompt).not.toContain('Hidden dropped character milestone');
    expect(prompt).toContain('STORY GOAL: Blank first story step');
    expect(prompt).toContain('Current open milestone: Valid story milestone after blank step.');
    expect(prompt).toContain('CHARACTER GOAL: Blank first character step');
    expect(prompt).toContain('Current open milestone: Valid character milestone after blank step.');
  });

  it('builds API Call 1 messages with five prior roleplay messages and excludes local notices', () => {
    const messages = Array.from({ length: 8 }, (_, index) => ({
      id: uid('msg'),
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      text: `history ${index + 1}`,
      createdAt: now() + index,
    }));
    messages.splice(5, 0, {
      id: uid('notice'),
      role: 'assistant',
      text: 'Chronicle: The model provider blocked this turn. Try editing.',
      localNotice: 'content_filter',
      createdAt: now() + 99,
    } as any);

    const built = buildRoleplayApiMessages({
      conversationMessages: messages as any,
      systemInstruction: 'SYSTEM',
      userMessage: 'latest user text',
      sessionMessageCount: 12,
      currentTurnStateDigest: '[CURRENT TURN STATE]\n- Sarah: location=Room',
    });

    expect(built.historyLimit).toBe(5);
    expect(built.historyMessages.map((message) => message.text)).toEqual([
      'history 4',
      'history 5',
      'history 6',
      'history 7',
      'history 8',
    ]);
    expect(built.messages).toHaveLength(7);
    expect(built.messages[0]).toEqual({ role: 'system', content: 'SYSTEM' });
    expect(built.messages.slice(1, 6).map((message) => message.content)).toEqual([
      'history 4',
      'history 5',
      'history 6',
      'history 7',
      'history 8',
    ]);
    expect(built.finalUserContent).toContain('[SESSION: Message 12 of current session]');
    expect(built.finalUserContent).toContain('[CURRENT TURN STATE]');
    expect(built.finalUserContent).toContain('Sarah: location=Room');
    expect(built.finalUserContent).not.toContain('[CURRENT SCENE SNAPSHOT]');
    expect(built.finalUserContent).not.toContain('[STYLE ADJUSTMENT FOR THIS TURN]');
    expect(built.finalUserContent).not.toContain('[STYLE CORRECTION]');
    expect(built.finalUserContent).not.toContain('[OUTPUT REVISION REQUIRED]');
    expect(built.finalUserContent).toContain('[APP TURN CONTROLS]');
    expect(built.finalUserContent).toContain('[PLAYER TURN]');
    expect(built.finalUserContent).toContain('latest user text');
    expect(built.finalUserContent).toContain('[EXECUTION BRIEF]');
    expect(built.finalUserContent.indexOf('[APP TURN CONTROLS]')).toBeLessThan(built.finalUserContent.indexOf('[PLAYER TURN]'));
    expect(built.finalUserContent.indexOf('[EXECUTION BRIEF]')).toBeLessThan(built.finalUserContent.indexOf('[PLAYER TURN]'));
    expect(built.messages[6]).toEqual({ role: 'user', content: built.finalUserContent });
    expect(built.messages.map((message) => message.content).join('\n')).not.toContain('Chronicle: The model provider blocked');
  });

  it('omits empty world placeholders from API Call 1 prompt output', () => {
    const appData = createDefaultScenarioData();
    const [aiCharacter, userCharacter] = getHardcodedTestCharacters();
    appData.characters = [aiCharacter, userCharacter];
    appData.world.core.scenarioName = '';
    appData.world.core.briefDescription = '';
    appData.world.core.storyPremise = '';
    appData.world.core.structuredLocations = [];
    appData.world.core.customWorldSections = [];
    appData.world.entries = [];
    appData.scenes = [{
      id: uid('scene'),
      url: '',
      tags: [],
      isStartingScene: true,
      title: 'Untitled Scene',
      createdAt: now(),
    }];

    const prompt = getSystemInstruction(appData, 1, 'day', [], true, appData.scenes[0]);

    expect(prompt).not.toContain('STORY NAME: Not specified');
    expect(prompt).not.toContain('BRIEF DESCRIPTION: Not specified');
    expect(prompt).not.toContain('STORY PREMISE: Not specified');
    expect(prompt).not.toContain('--- LOCATIONS ---\n\n- Not specified');
    expect(prompt).not.toContain('Active Scene Tag: Not tagged');
    expect(prompt).not.toContain('Scene Tags: Not specified');
  });
});
