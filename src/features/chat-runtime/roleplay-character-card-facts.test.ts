import { describe, expect, it } from 'vitest';
import type { Character, SideCharacter } from '@/types';
import {
  compileCharacterPromptFacts,
  buildCharacterPromptOutputCopyMetric,
  buildCharacterPromptFactReviewSummary,
  createCharacterPromptFact,
  renderCharacterPromptFacts,
  selectCharacterPromptFactsForRendering,
  type CreateCharacterPromptFactInput,
} from './roleplay-character-card-facts';

function factInput(
  overrides: Partial<CreateCharacterPromptFactInput> = {},
): CreateCharacterPromptFactInput {
  return {
    characterId: 'character-1',
    characterName: 'Mara',
    sourceSurface: 'main_character_cards',
    sourceField: 'personality.coreTraits[0].description',
    sourceValue: '  Guarded\n\nbut intensely observant.  ',
    promptValue: 'Guarded; intensely observant.',
    runtimeUse: 'stable_reference',
    authority: 'saved_card_reference',
    relevance: 'conditional',
    visibility: 'character_knowledge',
    wordingPolicy: 'voice_affordance',
    disposition: 'transformed',
    reason: 'creator-authored personality informs voice without reusable prose',
    ...overrides,
  };
}

function characterFixture(): Character {
  return {
    id: 'character-1',
    name: 'Mara',
    nicknames: 'Mars',
    age: '34',
    sexType: 'Woman',
    sexualOrientation: 'Bisexual',
    location: 'Old saved bedroom',
    scenePosition: 'Sitting on the bed',
    controlledBy: 'AI',
    characterRole: 'Main',
    roleDescription: 'A private investigator with a blunt manner.',
    tags: 'noir, investigator',
    avatarDataUrl: '',
    physicalAppearance: {
      hairColor: 'Black',
      eyeColor: 'Grey',
      build: 'Lean',
      bodyHair: '',
      height: 'Tall',
      breastSize: '',
      genitalia: '',
      skinTone: 'Olive',
      makeup: '',
      bodyMarkings: '',
      temporaryConditions: '',
    },
    currentlyWearing: {
      top: 'Open white shirt',
      bottom: 'Black trousers',
      undergarments: 'Black lace bra',
      miscellaneous: '',
    },
    preferredClothing: {
      casual: 'Dark jeans and fitted shirts',
      work: 'Tailored charcoal suit',
      sleep: '',
      undergarments: '',
      miscellaneous: '',
    },
    personality: {
      splitMode: false,
      traits: [{
        id: 'trait-1',
        label: 'Guarded',
        value: 'Deflects personal questions with dry humor.',
        flexibility: 'normal',
      }],
      outwardTraits: [],
      inwardTraits: [],
    },
    goals: [{
      id: 'goal-1',
      title: 'Solve the case',
      desiredOutcome: 'Identify who planted the evidence.',
      currentStatus: 'Following a new lead.',
      progress: 20,
      steps: [{
        id: 'step-1',
        description: 'Interview the witness.',
        completed: false,
      }],
      createdAt: 1,
      updatedAt: 1,
    }],
    background: {
      jobOccupation: 'Private investigator',
      educationLevel: '',
      residence: '',
      hobbies: '',
      financialStatus: '',
      motivation: 'Protect vulnerable clients.',
    },
    relationships: {
      _extras: [{ id: 'relationship-1', label: 'Avery', value: 'Distrust mixed with attraction.' }],
    },
    secrets: {
      _extras: [{ id: 'secret-1', label: 'Hidden debt', value: 'Owes money to the suspect.' }],
    },
    fears: {},
    sections: [{
      id: 'section-1',
      title: 'Sexual preferences',
      items: [{
        id: 'item-1',
        label: 'Control',
        value: 'Likes being verbally dominant during sex.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }],
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('createCharacterPromptFact', () => {
  it('creates a traceable prompt-facing fact without inventing field policy', () => {
    const fact = createCharacterPromptFact(factInput());

    expect(fact).toEqual({
      characterId: 'character-1',
      characterName: 'Mara',
      sourceField: 'personality.coreTraits[0].description',
      sourceLabel: undefined,
      sourceValue: '  Guarded\n\nbut intensely observant.  ',
      sourceSurface: 'main_character_cards',
      value: 'Guarded; intensely observant.',
      semanticKey: 'character-1:stable_reference:personality behavior:guarded intensely observant',
      runtimeUse: 'stable_reference',
      authority: 'saved_card_reference',
      relevance: 'conditional',
      visibility: 'character_knowledge',
      wordingPolicy: 'voice_affordance',
      modelFacing: true,
      disposition: 'transformed',
      reason: 'creator-authored personality informs voice without reusable prose',
    });
  });

  it('normalizes only the prompt-facing copy and preserves the caller source data', () => {
    const savedCardField = Object.freeze({
      path: 'appearance.customSections[0].freeformValue',
      value: '  Explicit creator-authored\ncontent stays exactly here.  ',
    });
    const input = Object.freeze(factInput({
      sourceField: savedCardField.path,
      sourceValue: savedCardField.value,
      promptValue: 'Compact\n prompt-facing copy.',
      wordingPolicy: 'compact_fact',
    }));

    const fact = createCharacterPromptFact(input);

    expect(fact.value).toBe('Compact prompt-facing copy.');
    expect(fact.sourceField).toBe(savedCardField.path);
    expect(savedCardField.value).toBe('  Explicit creator-authored\ncontent stays exactly here.  ');
    expect(input.sourceValue).toBe(savedCardField.value);
    expect(Object.isFrozen(fact)).toBe(true);
  });

  it.each([
    ['included', true],
    ['transformed', true],
    ['suppressed', false],
    ['debug_only', false],
  ] as const)('derives model-facing status from the %s disposition', (disposition, modelFacing) => {
    const fact = createCharacterPromptFact(factInput({ disposition }));

    expect(fact.modelFacing).toBe(modelFacing);
  });

  it('classifies identity and descriptive card fields without rendering raw labeled blocks', () => {
    const facts = compileCharacterPromptFacts(characterFixture());

    expect(facts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceField: 'name',
        value: 'Mara',
        runtimeUse: 'identity',
        authority: 'saved_card_identity',
        wordingPolicy: 'compact_fact',
        modelFacing: true,
      }),
      expect.objectContaining({
        sourceField: 'personality.traits[0].value',
        runtimeUse: 'stable_reference',
        wordingPolicy: 'voice_affordance',
        disposition: 'transformed',
      }),
      expect.objectContaining({
        sourceField: 'relationships._extras[0].value',
        runtimeUse: 'relationship',
        wordingPolicy: 'compact_fact',
      }),
      expect.objectContaining({
        sourceField: 'sections[0].items[0].value',
        sourceLabel: 'Sexual preferences: Control',
        sourceValue: 'Likes being verbally dominant during sex.',
        value: 'Sexual preferences: Control: Mara likes being verbally dominant during sex.',
        wordingPolicy: 'do_not_copy_phrase',
        modelFacing: true,
      }),
    ]));
    expect(facts.some((fact) => fact.value.includes('CHARACTER BASICS'))).toBe(false);
  });

  it('keeps mutable, goal, private, and metadata fields out of the model-facing card lane', () => {
    const facts = compileCharacterPromptFacts(characterFixture());
    const byPath = new Map(facts.map((fact) => [fact.sourceField, fact]));

    expect(byPath.get('location')).toEqual(expect.objectContaining({
      runtimeUse: 'current_state',
      authority: 'current_state',
      disposition: 'debug_only',
      modelFacing: false,
    }));
    expect(byPath.get('currentlyWearing.top')).toEqual(expect.objectContaining({
      runtimeUse: 'current_state',
      modelFacing: false,
    }));
    expect(byPath.get('goals[0].desiredOutcome')).toEqual(expect.objectContaining({
      runtimeUse: 'goal',
      authority: 'goal_selector',
      modelFacing: false,
    }));
    expect(byPath.get('secrets._extras[0].value')).toEqual(expect.objectContaining({
      runtimeUse: 'private_reference',
      authority: 'visibility_policy',
      modelFacing: false,
    }));
    expect(byPath.get('tags')).toEqual(expect.objectContaining({
      runtimeUse: 'debug_only',
      modelFacing: false,
    }));
  });

  it('does not mutate or sanitize explicit creator-authored card content', () => {
    const character = characterFixture();
    const original = structuredClone(character);

    const facts = compileCharacterPromptFacts(character);

    expect(character).toEqual(original);
    expect(facts).toContainEqual(expect.objectContaining({
      sourceField: 'sections[0].items[0].value',
      sourceValue: 'Likes being verbally dominant during sex.',
      value: 'Sexual preferences: Control: Mara likes being verbally dominant during sex.',
    }));
  });

  it('renders only model-facing facts in compact policy groups', () => {
    const rendered = renderCharacterPromptFacts(characterFixture());

    expect(rendered).toContain('CHARACTER: Mara');
    expect(rendered).toContain('IDENTITY FACTS');
    expect(rendered).toContain('- Age: 34');
    expect(rendered).toContain('CREATOR REFERENCE FACTS');
    expect(rendered).toContain('do not copy creator wording into narration or dialogue');
    expect(rendered).toContain('VOICE AND BEHAVIOR AFFORDANCES');
    expect(rendered).toContain('- Sexual preferences: Control: Mara likes being verbally dominant during sex.');
    expect(rendered).not.toContain('\n- Likes being verbally dominant during sex.');
    expect(rendered).not.toContain(' · ');
    expect(rendered).not.toContain('Old saved bedroom');
    expect(rendered).not.toContain('Open white shirt');
    expect(rendered).not.toContain('Identify who planted the evidence.');
    expect(rendered).not.toContain('Owes money to the suspect.');
    expect(rendered).not.toContain('noir, investigator');
  });

  it('renders an exact normalized descriptor only once across duplicate source fields', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'extra-1', label: 'Eye color', value: 'Grey' },
    ];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered.match(/grey/gi)).toHaveLength(1);

    const selected = selectCharacterPromptFactsForRendering(character);
    expect(selected.filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField === 'physicalAppearance._extras[0].value'
    ))).toEqual([
      expect.objectContaining({
        semanticKey: expect.stringContaining(':eye color:grey'),
        modelFacing: true,
        disposition: 'transformed',
      }),
      expect.objectContaining({
        semanticKey: expect.stringContaining(':eye color:grey'),
        modelFacing: false,
        disposition: 'suppressed',
        reason: expect.stringContaining('duplicate_model_facing_value_suppressed'),
      }),
    ]);
  });

  it('keeps relationship direction in semantic identity instead of sorting its words', () => {
    const character = characterFixture();
    character.relationships = {
      _extras: [
        { id: 'relationship-1', label: 'Trust', value: 'Mara trusts Avery.' },
        { id: 'relationship-2', label: 'Trust', value: 'Avery trusts Mara.' },
      ],
    };

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField.startsWith('relationships.')
    ));
    const rendered = renderCharacterPromptFacts(character);

    expect(selected).toHaveLength(2);
    expect(selected.every((fact) => fact.modelFacing)).toBe(true);
    expect(selected[0].semanticKey).not.toBe(selected[1].semanticKey);
    expect(rendered).toContain('Mara trusts Avery.');
    expect(rendered).toContain('Avery trusts Mara.');
  });

  it('preserves complete physical facts without changing another person\'s ownership', () => {
    const character = characterFixture();
    character.physicalAppearance.hairColor = 'Long red hair worn in a braid';
    character.physicalAppearance.eyeColor = 'Her eyes are green.';
    character.physicalAppearance.bodyMarkings = 'A scar crosses her cheek where his blade struck.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara has long red hair worn in a braid.');
    expect(rendered).toContain("Mara's eyes are green.");
    expect(rendered).toContain("A scar crosses Mara's cheek where his blade struck.");
    expect(rendered).not.toContain("Mara's blade struck");
  });

  it('renders concise roles, side-character fears, and multi-sentence boundaries grammatically', () => {
    const character = characterFixture();
    character.roleDescription = 'Private investigator with a blunt manner.';
    character.sections = [{
      id: 'section-consent',
      title: 'Intimacy',
      items: [{
        id: 'item-consent',
        label: 'Consent',
        value: 'Likes rough sex. Requires a safeword.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];
    const sideCharacter = {
      ...characterFixture(),
      id: 'side-character-1',
      name: 'Iris',
      personality: {
        traits: [],
        miscellaneous: '',
        fears: 'Being abandoned after trusting someone.',
        secrets: '',
        kinksFantasies: '',
        desires: '',
      },
      background: { relationshipStatus: '', residence: '', educationLevel: '' },
      firstMentionedIn: 'conversation-1',
      extractedTraits: [],
    } as unknown as SideCharacter;

    const characterPrompt = renderCharacterPromptFacts(character);
    const sidePrompt = renderCharacterPromptFacts(sideCharacter);

    expect(characterPrompt).toContain('Mara serves in the role of private investigator with a blunt manner.');
    expect(characterPrompt).toContain('Mara likes rough sex. Mara requires a safeword.');
    expect(sidePrompt).toContain('Iris fears being abandoned after trusting someone.');
    expect(sidePrompt).not.toContain("Iris' behavior is being abandoned");
  });

  it('preserves decimals and handles article exceptions without corrupting acronyms', () => {
    const character = characterFixture();
    character.physicalAppearance.height = '5.8 feet tall';
    character.roleDescription = 'University professor and union organizer.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara is 5.8 feet tall.');
    expect(rendered).toContain('Mara serves in the role of University professor and union organizer.');
    expect(rendered).not.toContain('5. 8 feet');

    character.roleDescription = 'FBI liaison.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara serves in the role of FBI liaison.');
  });

  it('turns modal, finite, fear, history, and hobby clauses into grammatical facts', () => {
    const character = characterFixture();
    character.background!.hobbies = 'Paints miniature figures.';
    character.keyLifeEvents = {
      _extras: [{ id: 'event-1', label: 'Family loss', value: 'Lost her mother at five.' }],
    };
    character.fears = {
      _extras: [
        { id: 'fear-1', label: 'Abandonment', value: 'Fear of abandonment.' },
        { id: 'fear-2', label: 'Rejection', value: 'Her greatest fear is rejection.' },
      ],
    };
    character.sections = [{
      id: 'section-intimacy',
      title: 'Intimacy',
      items: [
        {
          id: 'item-boundary',
          label: 'Boundary',
          value: 'Must use a safeword.',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-consent',
          label: 'Consent',
          value: 'Consents only with explicit trust.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's hobbies: Paints miniature figures.");
    expect(rendered).toContain('Mara lost her mother at five.');
    expect(rendered).toContain('Mara fears abandonment.');
    expect(rendered).toContain('Mara fears rejection.');
    expect(rendered).toContain('Mara must use a safeword.');
    expect(rendered).toContain('Mara consents only with explicit trust.');
    expect(rendered).not.toContain('fears of abandonment');
    expect(rendered).not.toContain('is must use');
  });

  it('suppresses equivalent physical facts even when the creator phrases them differently', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'extra-1', label: 'Eye color', value: 'Her eyes are grey.' },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField === 'physicalAppearance._extras[0].value'
    ));
    const rendered = renderCharacterPromptFacts(character);

    expect(selected).toHaveLength(2);
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(selected[0].semanticKey).toBe(selected[1].semanticKey);
    expect(rendered.match(/grey/gi)).toHaveLength(1);
  });

  it('preserves every proposition in a long structured value rather than trimming a later clause', () => {
    const character = characterFixture();
    character.roleDescription = [
      'University professor, union organizer, community advocate, and veteran labor mediator',
      'who coordinates a sprawling network of organizers while privately investigating corruption across several institutions.',
    ].join(' ');

    const selected = selectCharacterPromptFactsForRendering(character);
    const roleFact = selected.find((fact) => fact.sourceField === 'roleDescription');
    const rendered = renderCharacterPromptFacts(character);

    expect(roleFact).toEqual(expect.objectContaining({
      modelFacing: true,
      disposition: 'transformed',
      reason: expect.stringContaining('creator_reference_already_concise'),
    }));
    expect(rendered).toContain('Mara serves in the role of University professor, union organizer, community advocate, and veteran labor mediator who coordinates a sprawling network of organizers while privately investigating corruption across several institutions.');
  });

  it('preserves a long sexual boundary in full instead of dropping it from model evidence', () => {
    const character = characterFixture();
    character.sections = [{
      id: 'section-boundaries',
      title: 'Sexual boundaries',
      items: [{
        id: 'boundary-1',
        label: 'Consent boundary',
        value: 'Enjoys prolonged power exchange when trust is explicit and communication remains active throughout the scene. She never consents to penetration without an agreed safeword and a direct confirmation in the current exchange.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const fact = compileCharacterPromptFacts(character)
      .find((entry) => entry.sourceField === 'sections[0].items[0].value');
    const rendered = renderCharacterPromptFacts(character);

    expect(fact).toEqual(expect.objectContaining({
      modelFacing: true,
      disposition: 'transformed',
      sourceValue: expect.stringContaining('never consents'),
      reason: expect.stringContaining('creator_reference_preserved_at_complete_sentence_boundaries'),
    }));
    expect(rendered).toContain('Mara enjoys prolonged power exchange');
    expect(rendered).toContain('Mara never consents to penetration');
  });

  it('does not mistake noun, adjective, or adverb phrases for finite predicates', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Eyes green with gold flecks';
    character.preferredClothing.casual = 'Pants and blouse';
    character.tone = {
      _extras: [{ id: 'tone-1', label: 'Speaking style', value: 'Always gentle after sex' }],
    };
    character.sections = [{
      id: 'section-boundaries',
      title: 'Intimacy',
      items: [{
        id: 'boundary-1',
        label: 'Boundary',
        value: 'Never anal sex',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's eyes are green with gold flecks.");
    expect(rendered).toContain("Mara's casual clothing: Pants and blouse.");
    expect(rendered).toContain("Mara's speaking style is always gentle after sex.");
    expect(rendered).toContain('Intimacy: Boundary: Never anal sex.');
    expect(rendered).not.toContain('Mara eyes green');
    expect(rendered).not.toContain('mara pants');
    expect(rendered).not.toContain('mara always');
    expect(rendered).not.toContain('Mara never anal sex');
  });

  it('distinguishes past events from adjectival and passive background phrases', () => {
    const character = characterFixture();
    character.background!.jobOccupation = 'Retired detective';
    character.background!.educationLevel = 'Advanced degree';
    character.keyLifeEvents = {
      _extras: [{ id: 'event-1', label: 'Childhood', value: 'Abandoned by her parents at five.' }],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara works in the role of retired detective.');
    expect(rendered).toContain("Mara's recorded education level is \"Advanced degree\".");
    expect(rendered).toContain('Mara was abandoned by her parents at five.');
    expect(rendered).not.toContain('Mara retired detective.');
    expect(rendered).not.toContain('Mara advanced degree.');
    expect(rendered).not.toContain('Mara abandoned by');
  });

  it('avoids pronunciation guesses by using a grammatical role template for acronyms', () => {
    const character = characterFixture();

    character.roleDescription = 'NATO officer.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara serves in the role of NATO officer.');

    character.roleDescription = 'UN envoy.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara serves in the role of UN envoy.');

    character.roleDescription = 'U.S. Marshal.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara serves in the role of U.S. Marshal.');

    character.roleDescription = 'FBI liaison.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara serves in the role of FBI liaison.');
  });

  it('uses parsed sentence roles instead of a scenario-specific verb whitelist', () => {
    const character = characterFixture();
    character.roleDescription = 'Commands the city watch.';
    character.background!.hobbies = 'Reads poetry.';
    character.background!.motivation = 'Seeks justice.';
    character.sections = [{
      id: 'section-boundaries',
      title: 'Intimacy',
      items: [{
        id: 'boundary-1',
        label: 'Boundary',
        value: 'Rejects breath play.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara commands the city watch.');
    expect(rendered).toContain('Mara reads poetry.');
    expect(rendered).toContain('Mara seeks justice.');
    expect(rendered).toContain('Intimacy: Boundary: Rejects breath play.');
    expect(rendered).not.toContain("Mara's hobbies include reads poetry");
    expect(rendered).not.toContain("Mara's motivation is seeks justice");
  });

  it('keeps role, job, and hobby noun phrases out of the predicate path', () => {
    const character = characterFixture();
    character.roleDescription = 'Systems engineer.';
    character.background!.jobOccupation = 'Sales manager.';
    character.background!.hobbies = 'Sports photography.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara serves in the role of systems engineer.');
    expect(rendered).toContain('Mara works in the role of sales manager.');
    expect(rendered).toContain("Mara's hobbies: Sports photography.");
    expect(rendered).not.toContain('Mara systems engineer.');
    expect(rendered).not.toContain('Mara sales manager.');
    expect(rendered).not.toContain('Mara sports photography.');
  });

  it('keeps ambiguous occupational and activity noun phrases out of the predicate path', () => {
    const character = characterFixture();
    character.roleDescription = 'Works council representative.';
    character.background!.jobOccupation = 'Claims adjuster.';
    character.background!.hobbies = 'Couples photography.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's role description: Works council representative.");
    expect(rendered).toContain("Mara's occupation: Claims adjuster.");
    expect(rendered).toContain("Mara's hobbies: Couples photography.");
    expect(rendered).not.toContain('Mara works council representative.');
    expect(rendered).not.toContain('Mara claims adjuster.');
    expect(rendered).not.toContain('Mara couples photography.');
  });

  it('keeps active clauses, passive fragments, negative fears, complete genital predicates, and proper names grammatical', () => {
    const character = characterFixture();
    character.roleDescription = 'Values loyalty.';
    character.background!.jobOccupation = 'Practices law.';
    character.background!.motivation = 'House Veyra approval.';
    character.preferredClothing.casual = 'Corset, stockings, and heels.';
    character.physicalAppearance.bodyMarkings = 'Not tattooed.';
    character.physicalAppearance.genitalia = 'Genitals include a penis and testicles.';
    character.relationships = {
      _extras: [{ id: 'relationship-xanthera', label: 'Avery', value: 'Xanthera associate.' }],
    };
    character.fears = {
      _extras: [
        { id: 'fear-none', label: 'Pain', value: 'No fear whatsoever of pain.' },
        { id: 'fear-xanthera', label: 'Xanthera', value: 'Fear of Xanthera.' },
      ],
    };
    character.sections = [{
      id: 'section-status',
      title: 'Status',
      items: [{
        id: 'status-reputation',
        label: 'Reputation',
        value: 'Widely respected.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's role description: Values loyalty.");
    expect(rendered).toContain("Mara's occupation: Practices law.");
    expect(rendered).toContain("Mara's motivation: House Veyra approval.");
    expect(rendered).toContain("Mara's casual clothing: Corset, stockings, and heels.");
    expect(rendered).toContain('Mara is not tattooed.');
    expect(rendered).toContain("Mara's genitals include a penis and testicles.");
    expect(rendered).toContain("Mara's relationship with Avery is Xanthera associate.");
    expect(rendered).toContain('Mara has no fear whatsoever of pain.');
    expect(rendered).toContain('Mara fears Xanthera.');
    expect(rendered).toContain('Status: Reputation: Mara is widely respected.');
    expect(rendered).not.toContain('role of values loyalty');
    expect(rendered).not.toContain('role of practices law');
    expect(rendered).not.toContain('motivated to House');
    expect(rendered).not.toContain('a stockings');
    expect(rendered).not.toContain('Mara not tattooed');
    expect(rendered).not.toContain('genitalia is genitals include');
    expect(rendered).not.toContain('fears no fear');
    expect(rendered).not.toContain('xanthera associate');
  });

  it('keeps ambiguous role nouns, motivations, passives, negative fears, anatomy, clothing, and Unicode names grammatical', () => {
    const character = characterFixture();
    character.roleDescription = 'Respects consent.';
    character.background!.jobOccupation = 'Works council chair.';
    character.background!.motivation = 'Protect patients.';
    character.preferredClothing.casual = 'Boots with a leather skirt and silk blouse.';
    character.preferredClothing.miscellaneous = 'Hosiery and jewelry.';
    character.physicalAppearance.genitalia = 'Labia include a pierced clitoris.';
    character.relationships = {
      _extras: [{ id: 'relationship-elara', label: 'Avery', value: 'Élara associate.' }],
    };
    character.fears = {
      _extras: [
        { id: 'fear-lacking', label: 'Pain', value: 'Lacking any fear of pain.' },
        { id: 'fear-does-not', label: 'Pain response', value: "Doesn't fear pain." },
        { id: 'fear-elara', label: 'Élara', value: 'Fear of Élara.' },
      ],
    };
    character.sections = [{
      id: 'section-reputation',
      title: 'Reputation',
      items: [
        { id: 'known', label: 'Reach', value: 'Known everywhere.', createdAt: 1, updatedAt: 1 },
        { id: 'bound', label: 'Duty', value: 'Bound forever.', createdAt: 1, updatedAt: 1 },
        { id: 'respected', label: 'Standing', value: 'Respected universally.', createdAt: 1, updatedAt: 1 },
      ],
      createdAt: 1,
      updatedAt: 1,
    }];

    const first = renderCharacterPromptFacts(character);

    expect(first).toContain("Mara's role description: Respects consent.");
    expect(first).toContain("Mara's occupation: Works council chair.");
    expect(first).toContain('Mara is motivated to protect patients.');
    expect(first).toContain('Mara is known everywhere.');
    expect(first).toContain('Mara is bound forever.');
    expect(first).toContain('Mara is respected universally.');
    expect(first).toContain('Mara lacks any fear of pain.');
    expect(first).toContain("Mara doesn't fear pain.");
    expect(first).toContain('Mara fears Élara.');
    expect(first).toContain("Mara's relationship with Avery is Élara associate.");
    expect(first).toContain("Mara's labia include a pierced clitoris.");
    expect(first).toContain("Mara's casual clothing: Boots with a leather skirt and silk blouse.");
    expect(first).toContain("Mara's preferred clothing: Hosiery and jewelry.");
    expect(first).not.toContain('role of respects consent');
    expect(first).not.toContain('Mara works council chair');
    expect(first).not.toContain('Mara fears lacking');
    expect(first).not.toContain("Mara fears doesn't");
    expect(first).not.toContain('genitalia is Labia include');
    expect(first).not.toContain('a Hosiery');
    expect(first).not.toContain('élara');

    character.background!.motivation = 'Works council recognition.';
    character.physicalAppearance.genitalia = 'The genitals include a penis and testicles.';
    const second = renderCharacterPromptFacts(character);

    expect(second).toContain("Mara's motivation: Works council recognition.");
    expect(second).toContain("Mara's genitals include a penis and testicles.");
    expect(second).not.toContain('Mara works council recognition');
    expect(second).not.toContain('genitalia is the genitals include');
  });

  it('preserves uncertain creator phrases without guessing their grammar or inverting meaning', () => {
    const character = characterFixture();
    character.roleDescription = 'Studies behavior.';
    character.background!.jobOccupation = 'Claims office nurse.';
    character.background!.hobbies = 'Games design.';
    character.background!.motivation = 'Claims department approval.';
    character.preferredClothing.casual = 'Denim and lace.';
    character.preferredClothing.miscellaneous = 'Swimwear and sandals.';
    character.physicalAppearance.genitalia = 'The outer labia include a piercing.';
    character.fears = {
      _extras: [
        { id: 'fear-free', label: 'Fear', value: 'Is free of fear.' },
        { id: 'fear-zero', label: 'Pain', value: 'Has zero fear of pain.' },
        { id: 'fear-not-afraid', label: 'Pain response', value: "Isn't afraid of pain." },
      ],
    };
    character.keyLifeEvents = {
      _extras: [
        { id: 'event-elara', label: 'Order', value: 'Élara founded the order.' },
        { id: 'event-r2', label: 'Rescue', value: 'R2-D2 rescued Mara.' },
      ],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's role description: Studies behavior.");
    expect(rendered).toContain("Mara's occupation: Claims office nurse.");
    expect(rendered).toContain("Mara's hobbies: Games design.");
    expect(rendered).toContain("Mara's motivation: Claims department approval.");
    expect(rendered).toContain("Mara's casual clothing: Denim and lace.");
    expect(rendered).toContain("Mara's preferred clothing: Swimwear and sandals.");
    expect(rendered).toContain("Mara's outer labia include a piercing.");
    expect(rendered).toContain('Mara is free of fear.');
    expect(rendered).toContain('Mara has zero fear of pain.');
    expect(rendered).toContain("Mara isn't afraid of pain.");
    expect(rendered).toContain('Élara founded the order.');
    expect(rendered).toContain('R2-D2 rescued Mara.');
    expect(rendered).not.toContain('serves in the role of studies behavior');
    expect(rendered).not.toContain('Mara claims office nurse');
    expect(rendered).not.toContain('Mara fears is free');
    expect(rendered).not.toContain('Mara fears has zero');
    expect(rendered).not.toContain("Mara fears isn't");
    expect(rendered).not.toContain('élara founded');
    expect(rendered).not.toContain('r2-D2 rescued');
  });

  it('renders passive fragments, alternative clothing lists, and coordinated genital predicates safely', () => {
    const character = characterFixture();
    character.roleDescription = 'Loyal.';
    character.preferredClothing.casual = 'Boots, a skirt, or a dress.';
    character.physicalAppearance.genitalia = 'Are both pierced.';

    let rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara is loyal.');
    expect(rendered).toContain("Mara's casual clothing: Boots, a skirt, or a dress.");
    expect(rendered).toContain("Mara's genitalia are both pierced.");

    character.roleDescription = 'Held rigid.';
    rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara is held rigid.');

    character.roleDescription = 'Known worldwide.';
    rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara is known worldwide.');
  });

  it('preserves ambiguous compound roles and common list syntax without inventing grammar', () => {
    const character = characterFixture();
    character.roleDescription = 'Detective. Sales manager.';
    character.background!.jobOccupation = 'Works council and labor liaison.';
    character.preferredClothing.casual = 'Boots / skirt / dress.';
    character.preferredClothing.miscellaneous = 'Denim & lace.';
    character.physicalAppearance.genitalia = 'Have multiple piercings.';
    character.fears = {
      _extras: [
        { id: 'fear-free-from', label: 'Pain', value: 'Free from fear of pain.' },
        { id: 'fear-devoid', label: 'Pain response', value: 'Devoid of fear of pain.' },
      ],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's role description: Detective. Sales manager.");
    expect(rendered).toContain("Mara's occupation: Works council and labor liaison.");
    expect(rendered).toContain("Mara's casual clothing: Boots / skirt / dress.");
    expect(rendered).toContain("Mara's preferred clothing: Denim & lace.");
    expect(rendered).toContain("Mara's genitalia have multiple piercings.");
    expect(rendered).toContain('Mara is free from fear of pain.');
    expect(rendered).toContain('Mara is devoid of fear of pain.');
    expect(rendered).not.toContain('Mara works council and labor liaison.');
    expect(rendered).not.toContain('Mara boots / skirt / dress.');
    expect(rendered).not.toContain("includes a Denim & lace");
    expect(rendered).not.toContain('genitalia are have');
    expect(rendered).not.toContain('Mara fears free from');
    expect(rendered).not.toContain('Mara fears devoid of');
  });

  it('fails closed when ordinary creator prose exceeds the field compaction boundary', () => {
    const longValue = [
      'Coordinates a community clinic serving vulnerable residents across several districts.',
      'Maintains confidential support networks and documents recurring institutional failures.',
      'Protects patients who cannot safely advocate for themselves while training new volunteers.',
      'Refuses pressure to trade patient safety for political convenience.',
    ].join(' ');
    const fieldCases = [
      ['roleDescription', (character: Character) => { character.roleDescription = longValue; }],
      ['background.jobOccupation', (character: Character) => { character.background!.jobOccupation = longValue; }],
      ['background.hobbies', (character: Character) => { character.background!.hobbies = longValue; }],
      ['background.motivation', (character: Character) => { character.background!.motivation = longValue; }],
    ] as const;

    for (const [sourceField, assign] of fieldCases) {
      const character = characterFixture();
      assign(character);
      const fact = selectCharacterPromptFactsForRendering(character)
        .find((entry) => entry.sourceField === sourceField);
      expect(fact).toEqual(expect.objectContaining({
        modelFacing: false,
        disposition: 'debug_only',
        reason: expect.stringContaining('creator_reference_too_dense_for_safe_deterministic_compaction'),
      }));
    }
  });

  it('deduplicates iris aliases against the structured eye-color field', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'extra-iris', label: 'Iris color', value: 'Grey' },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField === 'physicalAppearance._extras[0].value'
    ));
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(selected[0].semanticKey).toBe(selected[1].semanticKey);
  });

  it('preserves auxiliaries and negation in passive, adjectival, and fear facts', () => {
    const character = characterFixture();
    character.roleDescription = 'Only aroused when praised.';
    character.fears = {
      _extras: [
        { id: 'fear-1', label: 'Pain', value: 'Does not fear pain.' },
        { id: 'fear-2', label: 'Pain response', value: 'Is not afraid of pain.' },
      ],
    };
    character.sections = [{
      id: 'section-trust',
      title: 'Trust',
      items: [{
        id: 'item-trust',
        label: 'Safeword',
        value: 'Required whenever trust breaks.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara is only aroused when praised.');
    expect(rendered).toContain('Trust: Safeword: Mara is required whenever trust breaks.');
    expect(rendered).toContain('Mara does not fear pain.');
    expect(rendered).toContain('Mara is not afraid of pain.');
    expect(rendered).not.toContain('Mara fears does not fear');
    expect(rendered).not.toContain('Mara fears is not afraid');
  });

  it('preserves custom labels without duplicate copulas or redundant embedded labels', () => {
    const character = characterFixture();
    character.sections = [{
      id: 'section-intimacy',
      title: 'Intimacy',
      items: [
        {
          id: 'item-safeword',
          label: 'Safeword',
          value: 'Safeword: The safeword is Crimson.',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-sex',
          label: 'During sex',
          value: 'During sex: Anal only.',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-enjoys',
          label: 'What she enjoys',
          value: 'What she enjoys: Being watched.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Intimacy: Safeword: The safeword is Crimson.');
    expect(rendered).toContain('Intimacy: During sex: Anal only.');
    expect(rendered).toContain('Intimacy: What she enjoys: Being watched.');
    expect(rendered).not.toContain('safeword is the safeword is');
    expect(rendered).not.toContain("what she enjoys include being watched");
  });

  it('uses clothing head number, genital head number, and creator capitalization safely', () => {
    const character = characterFixture();
    character.roleDescription = 'Dior designer.';
    character.background!.residence = 'Xanthera';
    character.preferredClothing.casual = 'Black boots with a red coat.';
    character.preferredClothing.miscellaneous = 'Leather collar with steel rings.';
    character.physicalAppearance.genitalia = 'An uncircumcised penis.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara serves in the role of Dior designer.');
    expect(rendered).toContain('Mara lives in Xanthera.');
    expect(rendered).toContain("Mara's casual clothing includes black boots with a red coat.");
    expect(rendered).toContain("Mara's preferred clothing: Leather collar with steel rings.");
    expect(rendered).toContain("Mara's genitalia include an uncircumcised penis.");
    expect(rendered).not.toContain('a black boots');
    expect(rendered).not.toContain('genitalia are an uncircumcised penis');

    character.background!.residence = 'Coruscant';
    expect(renderCharacterPromptFacts(character)).toContain('Mara lives in Coruscant.');
  });

  it('uses complete field predicates without wrapping them in noun templates', () => {
    const character = characterFixture();
    character.preferredClothing.casual = 'Wears jeans and a blouse.';
    character.tone = {
      _extras: [{ id: 'tone-softly', label: 'Delivery', value: 'Speaks softly.' }],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara wears jeans and a blouse.');
    expect(rendered).toContain('Mara speaks softly.');
    expect(rendered).not.toContain('includes wears jeans');
    expect(rendered).not.toContain('speaking style is speaks softly');
  });

  it('handles structurally valid third-person predicates that are absent from the parser lexicon', () => {
    const character = characterFixture();
    character.background!.hobbies = 'Cosplays on weekends.';
    character.background!.jobOccupation = 'Works as a detective.';
    character.sections = [{
      id: 'section-intimacy',
      title: 'Intimacy',
      items: [{
        id: 'item-preference',
        label: 'Preference',
        value: 'Deepthroats trusted partners.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara cosplays on weekends.');
    expect(rendered).toContain('Mara works as a detective.');
    expect(rendered).toContain('Mara deepthroats trusted partners.');
    expect(rendered).not.toContain("Mara's hobbies include cosplays");
    expect(rendered).not.toContain('works in the role of works as');
    expect(rendered).not.toContain('preference is deepthroats');
  });

  it('keeps role clauses grammatical and preserves an ambiguous custom boundary as labeled source text', () => {
    const character = characterFixture();
    character.roleDescription = 'Detective. Protects witnesses.';
    character.sections = [{
      id: 'section-intimacy',
      title: 'Intimacy',
      items: [{
        id: 'item-boundary',
        label: 'Preference',
        value: 'Enjoys restraint. No humiliation.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const facts = compileCharacterPromptFacts(character);
    const boundary = facts.find((fact) => fact.sourceField === 'sections[0].items[0].value');
    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara serves in the role of detective. Mara protects witnesses.');
    expect(boundary).toEqual(expect.objectContaining({
      modelFacing: true,
      disposition: 'transformed',
      sourceValue: 'Enjoys restraint. No humiliation.',
      reason: expect.stringContaining('creator_reference_preserved_as_labeled_complete_sentences'),
    }));
    expect(rendered).toContain('Intimacy: Preference: Enjoys restraint. No humiliation.');
  });

  it('adds the required auxiliary to passive card predicates', () => {
    const character = characterFixture();
    character.relationships = {
      _extras: [{
        id: 'relationship-1',
        label: 'Avery',
        value: 'Trusted by Avery, but does not trust her.',
      }],
    };
    character.roleDescription = 'Bound by an oath.';
    character.sections = [{
      id: 'section-reputation',
      title: 'Reputation',
      items: [{
        id: 'item-reputation',
        label: 'City guard',
        value: 'Feared by the city guard.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara is trusted by Avery, but does not trust her.');
    expect(rendered).toContain('Mara is bound by an oath.');
    expect(rendered).toContain('Mara is feared by the city guard.');
    expect(rendered).not.toContain('Mara trusted by');
    expect(rendered).not.toContain('Mara bound by');
    expect(rendered).not.toContain('Mara feared by');
  });

  it('keeps passive auxiliaries after leading modifiers and non-by complements', () => {
    const character = characterFixture();
    character.relationships = {
      _extras: [{ id: 'relationship-1', label: 'Avery', value: 'Widely trusted by Avery.' }],
    };
    character.roleDescription = 'Bound under an oath.';
    character.sections = [{
      id: 'section-reputation',
      title: 'Reputation',
      items: [{
        id: 'item-reputation',
        label: 'City guard',
        value: 'Not feared by the city guard.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara is widely trusted by Avery.');
    expect(rendered).toContain('Mara is bound under an oath.');
    expect(rendered).toContain('Reputation: City guard: Mara is not feared by the city guard.');
  });

  it('preserves proper-noun capitalization in field-owned fallback sentences', () => {
    const character = characterFixture();
    character.background!.residence = 'New York City';

    expect(renderCharacterPromptFacts(character)).toContain('Mara lives in New York City.');

    character.background!.residence = 'Spring Court manor';
    expect(renderCharacterPromptFacts(character)).toContain('Mara lives in Spring Court manor.');

    character.background!.residence = 'Paris';
    character.preferredClothing.casual = 'Dior dress';
    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara lives in Paris.');
    expect(rendered).toContain("Mara's casual clothing includes a Dior dress.");
  });

  it('keeps prepositional role titles distinct from active predicates', () => {
    const character = characterFixture();

    character.roleDescription = 'Works of art conservator.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's role description: Works of art conservator.",
    );

    character.roleDescription = 'Couples in crisis therapist.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's role description: Couples in crisis therapist.",
    );

    character.roleDescription = 'Detective. Protects witnesses.';
    expect(renderCharacterPromptFacts(character)).toContain(
      'Mara serves in the role of detective. Mara protects witnesses.',
    );

    character.roleDescription = 'Account director. Manages accounts.';
    expect(renderCharacterPromptFacts(character)).toContain(
      'Mara serves in the role of Account director. Mara manages accounts.',
    );

    character.roleDescription = 'Seeks justice.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara seeks justice.');

    character.roleDescription = 'Teaches history.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara teaches history.');

    character.roleDescription = 'Specializes in trauma therapy.';
    expect(renderCharacterPromptFacts(character)).toContain('Mara specializes in trauma therapy.');
  });

  it('preserves passive markings, creator names, and negative fear meaning', () => {
    const character = characterFixture();
    character.physicalAppearance.bodyMarkings = 'Covered in tattoos.';
    character.physicalAppearance.eyeColor = 'Dior blue.';
    character.tone = {
      _extras: [{ id: 'tone-dior', label: 'Diction', value: 'Dior diction.' }],
    };
    character.fears = {
      _extras: [
        { id: 'fear-none', label: 'Pain', value: 'No fear of pain.' },
        { id: 'fear-without', label: 'Pain response', value: 'Without fear of pain.' },
      ],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara is covered in tattoos.');
    expect(rendered).toContain("Mara's eyes are Dior blue.");
    expect(rendered).toContain("Mara's speaking style is Dior diction.");
    expect(rendered).toContain('Mara has no fear of pain.');
    expect(rendered).toContain('Mara is without fear of pain.');
    expect(rendered).not.toContain('Mara fears no fear');
    expect(rendered).not.toContain('Mara fears without fear');

    for (const marking of [
      'Completely tattooed.',
      'Heavily scarred.',
      'Tattooed head to toe.',
      'Covered head to toe in tattoos.',
    ]) {
      character.physicalAppearance.bodyMarkings = marking;
      expect(renderCharacterPromptFacts(character)).toContain(
        `Mara is ${marking[0].toLocaleLowerCase()}${marking.slice(1)}`,
      );
    }

    character.fears = {
      _extras: [
        { id: 'fear-no-real', label: 'Pain', value: 'No real fear of pain.' },
        { id: 'fear-without-any', label: 'Pain response', value: 'Without any fear of pain.' },
        { id: 'fear-is-without', label: 'Pain response', value: 'Is without fear of pain.' },
        { id: 'fear-lacks', label: 'Pain response', value: 'Lacks fear of pain.' },
        { id: 'fear-shows-none', label: 'Pain response', value: 'Shows no fear of pain.' },
      ],
    };
    const negativeFearRendered = renderCharacterPromptFacts(character);
    expect(negativeFearRendered).toContain('Mara has no real fear of pain.');
    expect(negativeFearRendered).toContain('Mara is without any fear of pain.');
    expect(negativeFearRendered).toContain('Mara is without fear of pain.');
    expect(negativeFearRendered).toContain('Mara lacks fear of pain.');
    expect(negativeFearRendered).toContain('Mara shows no fear of pain.');
  });

  it('uses the first coordinated phrase head for clothing and genital agreement', () => {
    const character = characterFixture();
    character.preferredClothing.casual = 'Black skirt and red heels.';
    character.preferredClothing.miscellaneous = 'Leather collar and steel cuffs.';
    character.physicalAppearance.genitalia = 'A penis with prominent veins.';

    let rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's casual clothing: Black skirt and red heels.");
    expect(rendered).toContain("Mara's preferred clothing: Leather collar and steel cuffs.");
    expect(rendered).toContain("Mara's genitalia include a penis with prominent veins.");

    character.physicalAppearance.genitalia = 'Pierced labia with a small ring.';
    rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's genitalia include pierced labia with a small ring.");

    character.physicalAppearance.genitalia = 'Has a penis with prominent veins.';
    character.preferredClothing.casual = 'Leather pants and red blouse.';
    character.preferredClothing.miscellaneous = 'Black skirt, red heels, and silk gloves.';
    rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara has a penis with prominent veins.');
    expect(rendered).toContain("Mara's casual clothing: Leather pants and red blouse.");
    expect(rendered).toContain("Mara's preferred clothing: Black skirt, red heels, and silk gloves.");
  });

  it('preserves creator capitalization in clothing, motivation, and financial state', () => {
    const character = characterFixture();
    character.preferredClothing.casual = 'Dior-inspired dress.';
    character.background!.motivation = 'Xanthera.';
    character.background!.financialStatus = 'Dior-funded.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's casual clothing includes a Dior-inspired dress.");
    expect(rendered).toContain("Mara's motivation is Xanthera.");
    expect(rendered).toContain("Mara's financial situation is Dior-funded.");
  });

  it('renders active and passive life events without inventing a malformed subject', () => {
    const character = characterFixture();
    character.keyLifeEvents = {
      _extras: [
        { id: 'event-1', label: 'Career', value: 'Founded a company at twenty.' },
        { id: 'event-2', label: 'Origin', value: 'Born in London.' },
      ],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara founded a company at twenty.');
    expect(rendered).toContain('Mara was born in London.');
    expect(rendered).not.toContain("Mara's history includes founded");
    expect(rendered).not.toContain("Mara's history includes born");
  });

  it('normalizes subject-owned appearance clauses and fear phrases', () => {
    const character = characterFixture();
    character.physicalAppearance.breastSize = 'breasts are large';
    character.physicalAppearance.hairColor = 'hair is black and shoulder-length';
    character.fears = {
      _extras: [{ id: 'fear-1', label: 'Abandonment', value: 'Afraid of abandonment' }],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara's breasts are large.");
    expect(rendered).toContain("Mara's hair is black and shoulder-length.");
    expect(rendered).toContain('Mara fears abandonment.');
    expect(rendered).not.toContain('Mara has breasts are large');
    expect(rendered).not.toContain('Mara has hair is black');
    expect(rendered).not.toContain('Mara fears afraid of abandonment');
  });

  it('rewrites embedded first-person ownership after replacing the card subject', () => {
    const character = characterFixture();
    character.physicalAppearance.hairColor = 'I keep my hair dyed red.';
    character.physicalAppearance.genitalia = 'I keep my penis shaved.';

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain("Mara keeps Mara's hair dyed red.");
    expect(rendered).toContain("Mara keeps Mara's penis shaved.");
    expect(rendered).not.toContain('Mara keeps my');
  });

  it('preserves newline-delimited relationship and fear clauses as complete facts', () => {
    const character = characterFixture();
    character.relationships = {
      _extras: [{
        id: 'relationship-multiline',
        label: 'Avery',
        value: 'Distrusts Avery\nProtects her',
      }],
    };
    character.fears = {
      _extras: [{
        id: 'fear-multiline',
        label: 'Pain and fire',
        value: 'Fear of pain\nAvoids fire',
      }],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Mara distrusts Avery. Mara protects her.');
    expect(rendered).toContain('Mara fears pain. Mara avoids fire.');
    expect(rendered).not.toContain('Distrusts Avery Protects her');
    expect(rendered).not.toContain('Fear of pain Avoids fire');
  });

  it('preserves noun-led fear statements instead of treating fear as a command verb', () => {
    const character = characterFixture();
    character.fears = {
      _extras: [{
        id: 'fear-withdrawal',
        label: 'Withdrawal',
        value: 'Fear makes her withdraw before intimacy.',
      }],
    };

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Fear makes her withdraw before intimacy.');
    expect(rendered).not.toContain('Mara fears makes');
  });

  it('uses the same role template for word acronyms and initialisms', () => {
    const character = characterFixture();
    const roles = ['UNESCO analyst', 'NCAA coach', 'UCLA graduate', 'USDA inspector', 'RAM specialist'];

    for (const role of roles) {
      character.roleDescription = role;
      expect(renderCharacterPromptFacts(character)).toContain(`Mara serves in the role of ${role}.`);
    }
  });

  it('deduplicates a self-contained preference repeated under different custom labels', () => {
    const character = characterFixture();
    character.sections = [
      {
        id: 'section-1',
        title: 'Intimacy',
        items: [{
          id: 'item-1',
          label: 'Preference',
          value: 'Prefers explicit verbal dominance during sex.',
          createdAt: 1,
          updatedAt: 1,
        }],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'section-2',
        title: 'Sexual preferences',
        items: [{
          id: 'item-2',
          label: 'Control',
          value: 'Prefers explicit verbal dominance during sex.',
          createdAt: 1,
          updatedAt: 1,
        }],
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField.startsWith('sections[')
    ));
    const rendered = renderCharacterPromptFacts(character);

    expect(selected).toHaveLength(2);
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(rendered).toContain('Intimacy: Preference: Mara prefers explicit verbal dominance during sex.');
    expect(rendered).not.toContain('Sexual preferences: Control: Mara prefers explicit verbal dominance during sex.');
  });

  it('deduplicates rendered custom meaning without merging different labeled facts', () => {
    const character = characterFixture();
    character.sections = [{
      id: 'section-details',
      title: 'Details',
      items: [
        {
          id: 'item-color',
          label: 'Favorite color',
          value: 'Red',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-safeword',
          label: 'Safeword',
          value: 'Red',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-preference-1',
          label: 'Preference',
          value: 'Prefers explicit verbal dominance.',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-preference-2',
          label: 'Preference',
          value: 'Mara prefers explicit verbal dominance.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    }];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField.startsWith('sections[')
    ));
    const rendered = renderCharacterPromptFacts(character);

    expect(rendered).toContain('Details: Favorite color: Red.');
    expect(rendered).toContain('Details: Safeword: Red.');
    expect(rendered.match(/Details: Preference: Mara prefers explicit verbal dominance\./g)).toHaveLength(1);
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(3);
  });

  it('deduplicates equivalent first-person and subjectless custom preferences', () => {
    const character = characterFixture();
    character.sections = [{
      id: 'section-preferences',
      title: 'Preferences',
      items: [
        {
          id: 'item-first-person',
          label: 'Control',
          value: 'I prefer explicit verbal dominance.',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item-subjectless',
          label: 'Control',
          value: 'Prefers explicit verbal dominance.',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    }];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField.startsWith('sections[')
    ));
    const rendered = renderCharacterPromptFacts(character);

    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(rendered.match(/explicit verbal dominance\./g)).toHaveLength(1);
  });

  it('keeps situational custom labels when the underlying predicate is identical', () => {
    const character = characterFixture();
    character.sections = [
      {
        id: 'section-public',
        title: 'Public behavior',
        items: [],
        freeformValue: 'Speaks softly.',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'section-sex',
        title: 'During sex',
        items: [],
        freeformValue: 'Speaks softly.',
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField.startsWith('sections[')
    ));
    const rendered = renderCharacterPromptFacts(character);

    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(2);
    expect(rendered).toContain('Public behavior: Mara speaks softly.');
    expect(rendered).toContain('During sex: Mara speaks softly.');
  });

  it('normalizes physical aliases before duplicate suppression', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'extra-1', label: 'Eyes', value: 'Grey eyes' },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField === 'physicalAppearance._extras[0].value'
    ));

    expect(selected).toHaveLength(2);
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(selected[0].semanticKey).toBe(selected[1].semanticKey);
  });

  it('suppresses a trailing physical-field alias in an equivalent descriptor', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'extra-1', label: 'Eye color', value: 'Grey eyes' },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField === 'physicalAppearance._extras[0].value'
    ));

    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(selected[0].semanticKey).toBe(selected[1].semanticKey);
  });

  it('builds grammatical semantic facts from a dense explicit card without leaking private or mutable state', () => {
    const character = characterFixture();
    character.roleDescription = 'A private investigator working to expose the city patronage network while protecting vulnerable clients.';
    character.physicalAppearance.bodyMarkings = [
      'A narrow scar crosses her left eyebrow.',
      'A second old scar remains hidden under clothing in ordinary scenes.',
    ].join(' ');
    character.relationships = {
      _extras: [{
        id: 'relationship-1',
        label: 'Avery',
        value: 'Does not trust Avery, but still protects her when she is threatened.',
      }],
    };
    character.fears = {
      _extras: [{
        id: 'fear-1',
        label: 'Abandonment',
        value: 'Being abandoned after allowing someone close.',
      }],
    };
    character.secrets = {
      _extras: [{
        id: 'secret-1',
        label: 'Private motive',
        value: 'She secretly wants the investigation to destroy her own employer.',
      }],
    };
    character.sections = [
      {
        id: 'section-1',
        title: 'Intimacy',
        items: [
          {
            id: 'item-1',
            label: 'Preference',
            value: 'Prefers explicit verbal dominance during sex.',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'item-2',
            label: 'Boundary',
            value: 'Does not enjoy humiliation from strangers.',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'section-2',
        title: 'Unstructured notes',
        items: [],
        freeformValue: 'This single unbroken creator paragraph intentionally contains too many distinct instructions and contextual claims for a deterministic transformer to shorten safely without changing who knows what or why the information matters in future scenes',
        createdAt: 1,
        updatedAt: 1,
      },
    ];

    const original = structuredClone(character);
    const facts = compileCharacterPromptFacts(character);
    const rendered = renderCharacterPromptFacts(character);
    const byPath = new Map(facts.map((fact) => [fact.sourceField, fact]));

    expect(character).toEqual(original);
    expect(rendered).toContain('Mara serves in the role of private investigator. Mara aims to expose the city patronage network while protecting vulnerable clients.');
    expect(rendered).toContain("A narrow scar crosses Mara's left eyebrow.");
    expect(rendered).toContain('A second old scar remains hidden under clothing in ordinary scenes.');
    expect(rendered).toContain('Mara does not trust Avery, but still protects her when she is threatened.');
    expect(rendered).toContain('Mara prefers explicit verbal dominance during sex.');
    expect(rendered).toContain('Mara does not enjoy humiliation from strangers.');
    expect(rendered).toContain('Mara fears being abandoned after allowing someone close.');
    expect(rendered).not.toContain('destroy her own employer');
    expect(rendered).not.toContain('Old saved bedroom');
    expect(rendered).not.toContain('Sitting on the bed');
    expect(rendered).not.toContain('Open white shirt');
    expect(rendered).not.toContain(' · ');
    expect(rendered).not.toMatch(/[,;]\s*[.!?]/);

    expect(byPath.get('physicalAppearance.bodyMarkings')).toEqual(expect.objectContaining({
      sourceValue: expect.stringContaining('A second old scar'),
      value: "A narrow scar crosses Mara's left eyebrow. A second old scar remains hidden under clothing in ordinary scenes.",
      disposition: 'transformed',
    }));
    expect(byPath.get('sections[1].freeformValue')).toEqual(expect.objectContaining({
      disposition: 'transformed',
      modelFacing: true,
      reason: expect.stringContaining('creator_reference_preserved_as_labeled_fact'),
    }));
    expect(rendered).toContain('Unstructured notes: This single unbroken creator paragraph');
    expect(byPath.get('secrets._extras[0].value')).toEqual(expect.objectContaining({
      disposition: 'debug_only',
      visibility: 'private_reference',
      modelFacing: false,
    }));
  });

  it('summarizes duplicate-source and legacy-heading copy risk without changing fact policy', () => {
    const character = characterFixture();
    character.physicalAppearance._extras = [
      { id: 'extra-1', label: 'Eye color', value: 'Grey' },
    ];
    const rendered = `${renderCharacterPromptFacts(character)}\nCHARACTER BASICS`;

    const summary = buildCharacterPromptFactReviewSummary(character, rendered);

    expect(summary.totalFacts).toBeGreaterThan(0);
    expect(summary.modelFacingFacts).toBeGreaterThan(0);
    expect(summary.debugOnlyFacts).toBeGreaterThan(0);
    expect(summary.suppressedFacts).toBe(1);
    expect(summary.duplicateSourceGroups).toContainEqual(expect.objectContaining({
      value: 'Grey',
      renderedOccurrences: 1,
      sourceFields: expect.arrayContaining([
        'physicalAppearance.eyeColor',
        'physicalAppearance._extras[0].value',
      ]),
    }));
    expect(summary.repeatedRenderedValues).toEqual([]);
    expect(summary.legacyRawHeadingsPresent).toEqual(['CHARACTER BASICS']);
  });

  it('reports exact raw card phrase and creator-label copies in assistant output', () => {
    const character = characterFixture();
    const metric = buildCharacterPromptOutputCopyMetric(
      character,
      'Mara: *She smiles.* Sexual preferences: Control: Likes being verbally dominant during sex.',
    );

    expect(metric.factSource).toBe('current_card_fallback');
    expect(metric.exactSourceValueCopies).toContainEqual(expect.objectContaining({
      sourceField: 'sections[0].items[0].value',
      sourceValue: 'Likes being verbally dominant during sex.',
    }));
    expect(metric.copiedSourceLabels).toContainEqual({
      sourceField: 'sections[0].items[0].value',
      sourceLabel: 'Sexual preferences: Control',
    });
  });

  it('does not flag a short occupational title as copied creator prose', () => {
    const character = characterFixture();
    character.background!.jobOccupation = 'Director of Operations';

    const metric = buildCharacterPromptOutputCopyMetric(
      character,
      'Mara is the Director of Operations and likes being verbally dominant during sex.',
    );

    expect(metric.exactSourceValueCopies).not.toContainEqual(expect.objectContaining({
      sourceField: 'background.jobOccupation',
    }));
    expect(metric.exactSourceValueCopies).toContainEqual(expect.objectContaining({
      sourceField: 'sections[0].items[0].value',
      sourceValue: 'Likes being verbally dominant during sex.',
    }));
  });

  it('preserves ambiguous multi-sentence role descriptions as one labeled source fact', () => {
    const character = characterFixture();

    character.roleDescription = 'Works as a detective. Sales manager.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's role description: Works as a detective. Sales manager.",
    );

    character.roleDescription = 'Detective. Works council chair.';
    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's role description: Detective. Works council chair.");
    expect(rendered).not.toContain('Mara works council chair.');
  });

  it('preserves mixed multi-sentence occupations and motivations instead of guessing', () => {
    const character = characterFixture();
    character.background!.jobOccupation = 'Works as a detective. Sales manager.';
    character.background!.motivation = 'Protects patients. Works council recognition.';

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain(
      "Mara's occupation: Works as a detective. Sales manager.",
    );
    expect(rendered).toContain(
      "Mara's motivation: Protects patients. Works council recognition.",
    );
    expect(rendered).not.toContain('role of works as');
    expect(rendered).not.toContain('Mara works council recognition.');
  });

  it('preserves qualified negative fears and complete genital predicates', () => {
    const character = characterFixture();
    character.fears = {
      _extras: [
        { id: 'fear-little', label: 'Pain', value: 'Has little fear of pain.' },
        { id: 'fear-hardly', label: 'Pain response', value: 'Is hardly afraid of pain.' },
        { id: 'fear-feels', label: 'Pain response', value: 'Feels little fear of pain.' },
        { id: 'fear-appears', label: 'Pain response', value: 'Appears hardly afraid of pain.' },
      ],
    };

    let rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara has little fear of pain.');
    expect(rendered).toContain('Mara is hardly afraid of pain.');
    expect(rendered).toContain('Mara feels little fear of pain.');
    expect(rendered).toContain('Mara appears hardly afraid of pain.');

    character.physicalAppearance.genitalia = 'Remain completely unpierced.';
    rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's genitalia remain completely unpierced.");

    character.physicalAppearance.genitalia = 'Do not have any piercings.';
    rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's genitalia do not have any piercings.");
    expect(rendered).not.toContain('genitalia are do not');

    for (const [source, expected] of [
      ['Contain no piercings.', "Mara's genitalia contain no piercings."],
      ['Include a hood piercing.', "Mara's genitalia include a hood piercing."],
      ['Stay completely unpierced.', "Mara's genitalia stay completely unpierced."],
      ['Lack visible scarring.', "Mara's genitalia lack visible scarring."],
      ['Large penis with a ring.', "Mara's genitalia include a large penis with a ring."],
      ['Both.', "Mara's genitalia: Both."],
    ] as const) {
      character.physicalAppearance.genitalia = source;
      expect(renderCharacterPromptFacts(character)).toContain(expected);
    }
  });

  it('keeps semicolon clothing lists and ambiguous custom roles under their source labels', () => {
    const character = characterFixture();
    character.preferredClothing.casual = 'Boots; skirt; hosiery.';
    character.sections = [{
      id: 'career-details',
      title: 'Career details',
      items: [{
        id: 'recorded-role',
        label: 'Recorded role',
        value: 'Works council chair.',
        createdAt: 1,
        updatedAt: 1,
      }],
      createdAt: 1,
      updatedAt: 1,
    }];

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's casual clothing: Boots; skirt; hosiery.");
    expect(rendered).toContain('Career details: Recorded role: Works council chair.');
    expect(rendered).not.toContain('Mara works council chair.');

    character.preferredClothing.casual = 'Boots + skirt + hosiery.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's casual clothing: Boots + skirt + hosiery.",
    );

    character.sections![0].items[0].value = 'Summary. Seeks justice. Works council chair.';
    const mixedCustom = renderCharacterPromptFacts(character);
    expect(mixedCustom).toContain(
      'Career details: Recorded role: Summary. Seeks justice. Works council chair.',
    );
    expect(mixedCustom).not.toContain('Mara works council chair.');
  });

  it('retains distinct extra-field labels and creator proper-name capitalization', () => {
    const character = characterFixture();
    character.preferredClothing._extras = [
      { id: 'ceremonial', label: 'Ceremonial', value: 'Silk robe & gold chains.' },
    ];
    character.tone = {
      _extras: [
        { id: 'public', label: 'Public behavior', value: 'Whispers softly.' },
        { id: 'sex', label: 'During sex', value: 'Whispers softly.' },
      ],
    };
    character.background!._extras = [
      { id: 'patronage', label: 'Dior Patronage', value: 'Funds the clinic.' },
    ];
    character.physicalAppearance._extras = [
      { id: 'sigil', label: 'Élara Sigil', value: 'Glows violet under moonlight.' },
    ];

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('For Mara, Ceremonial: Silk robe & gold chains.');
    expect(rendered).not.toContain('ceremonial clothing clothing');
    expect(rendered).toContain('For Mara, Public behavior: Whispers softly.');
    expect(rendered).toContain('For Mara, During sex: Whispers softly.');
    expect(rendered).toContain('For Mara, Dior Patronage: Funds the clinic.');
    expect(rendered).toContain('For Mara, Élara Sigil: Glows violet under moonlight.');
  });

  it('deduplicates iris-shade and eye-hue aliases against structured eye color', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'iris-shade', label: 'Iris shade', value: 'Grey' },
      { id: 'eye-hue', label: 'Eye hue', value: 'Grey' },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField.startsWith('physicalAppearance._extras[')
    ));

    expect(selected).toHaveLength(3);
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(new Set(selected.map((fact) => fact.semanticKey))).toHaveLength(1);
  });

  it('preserves labeled personality contexts instead of emitting duplicate unlabeled predicates', () => {
    const character = characterFixture();
    character.personality!.traits = [
      { id: 'public', label: 'Public behavior', value: 'Whispers softly.', flexibility: 'normal' },
      { id: 'sex', label: 'During sex', value: 'Whispers softly.', flexibility: 'normal' },
    ];

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('For Mara, Public behavior: Mara whispers softly.');
    expect(rendered).toContain('For Mara, During sex: Mara whispers softly.');
    expect(rendered.match(/Mara whispers softly\./g) ?? []).toHaveLength(2);
  });

  it('keeps semicolon-delimited role and motivation clauses under truthful field labels', () => {
    const character = characterFixture();
    character.roleDescription = 'Investigates fraud; Union relations specialist.';
    character.background!.jobOccupation = 'Investigates fraud; union relations specialist.';
    character.background!.motivation = 'Protect patients; Works council recognition.';

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain("Mara's role description: Investigates fraud; Union relations specialist.");
    expect(rendered).toContain("Mara's occupation: Investigates fraud; union relations specialist.");
    expect(rendered).toContain("Mara's motivation: Protect patients; Works council recognition.");
    expect(rendered).not.toContain('role of investigates fraud');
    expect(rendered).not.toContain('serves in the role of investigates fraud');

    character.roleDescription = 'Investigates fraud; protects witnesses.';
    const activeClauses = renderCharacterPromptFacts(character);
    expect(activeClauses).toContain('Mara investigates fraud. Mara protects witnesses.');
    expect(activeClauses).not.toContain('serves in the role of investigates fraud');
  });

  it('renders bare qualified fears and genital shorthand as grammatical facts', () => {
    const character = characterFixture();
    character.fears = {
      _extras: [
        { id: 'almost-none', label: 'Pain', value: 'Almost no fear of pain.' },
        { id: 'hardly', label: 'Pain response', value: 'Hardly afraid of pain.' },
        { id: 'little', label: 'Pain threshold', value: 'Very little fear of pain.' },
        { id: 'rarely', label: 'Pain avoidance', value: 'Rarely afraid of pain.' },
        { id: 'a-little', label: 'Pain threshold', value: 'A little fear of pain.' },
        { id: 'sometimes', label: 'Pain avoidance', value: 'Sometimes afraid of pain.' },
      ],
    };

    let rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara has almost no fear of pain.');
    expect(rendered).toContain('Mara is hardly afraid of pain.');
    expect(rendered).toContain('Mara has very little fear of pain.');
    expect(rendered).toContain('Mara is rarely afraid of pain.');
    expect(rendered).toContain('Mara has a little fear of pain.');
    expect(rendered).toContain('Mara is sometimes afraid of pain.');

    for (const [source, expected] of [
      ['No piercings.', "Mara's genitalia have no piercings."],
      ['Circumcised penis.', "Mara's genitalia include a circumcised penis."],
      ['Feels sensitive after sex.', "Mara's genitalia feel sensitive after sex."],
      ['Does not have any piercings.', "Mara's genitalia do not have any piercings."],
      ["Doesn't have any piercings.", "Mara's genitalia do not have any piercings."],
      ['Looks completely unpierced.', "Mara's genitalia look completely unpierced."],
      ['Becomes erect when aroused.', "Mara's genitalia become erect when aroused."],
      ['Without visible piercings.', "Mara's genitalia: Without visible piercings."],
      ['Completely unpierced.', "Mara's genitalia: Completely unpierced."],
    ] as const) {
      character.physicalAppearance.genitalia = source;
      rendered = renderCharacterPromptFacts(character);
      expect(rendered).toContain(expected);
    }
  });

  it('keeps pipe and multiline clothing lists under the clothing field label', () => {
    const character = characterFixture();
    character.preferredClothing.casual = 'Boots | skirt | hosiery.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's casual clothing: Boots | skirt | hosiery.",
    );

    character.preferredClothing.casual = 'Boots\nskirt\nhosiery.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's casual clothing: Boots; skirt; hosiery.",
    );

    character.preferredClothing.casual = 'Boots • skirt • hosiery.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's casual clothing: Boots • skirt • hosiery.",
    );

    for (const list of ['Boots - skirt - hosiery.', 'Boots — skirt — hosiery.']) {
      character.preferredClothing.casual = list;
      expect(renderCharacterPromptFacts(character)).toContain(
        `Mara's casual clothing: ${list}`,
      );
    }

    character.preferredClothing.casual = '- Boots\n- skirt\n- hosiery.';
    expect(renderCharacterPromptFacts(character)).toContain(
      "Mara's casual clothing: Boots; skirt; hosiery.",
    );
  });

  it('normalizes safe first-person card prose without changing tense or ownership', () => {
    const character = characterFixture();
    character.roleDescription = 'I am a detective.';
    character.background!.motivation = 'I want to protect patients.';
    character.fears = {
      _extras: [{ id: 'fear-first-person', label: 'Pain', value: 'I do not fear pain.' }],
    };
    character.keyLifeEvents = {
      _extras: [{ id: 'past-first-person', label: 'Oath', value: 'I was sworn into the order.' }],
    };

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara is a detective.');
    expect(rendered).toContain('Mara wants to protect patients.');
    expect(rendered).toContain('Mara does not fear pain.');
    expect(rendered).toContain('Mara was sworn into the order.');
    expect(rendered).not.toContain('Mara do not');
    expect(rendered).not.toMatch(/\bi\s+(?:am|want)\b/iu);
  });

  it('preserves newline-delimited role, occupation, and motivation boundaries', () => {
    const character = characterFixture();
    character.roleDescription = 'Investigates fraud\nProtects witnesses';
    character.background!.jobOccupation = 'Investigates fraud\nUnion relations specialist';
    character.background!.motivation = 'Protect patients\nWorks council recognition';

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara investigates fraud. Mara protects witnesses.');
    expect(rendered).toContain("Mara's occupation: Investigates fraud; Union relations specialist.");
    expect(rendered).toContain("Mara's motivation: Protect patients; Works council recognition.");
    expect(rendered).not.toContain('fraud Union');
    expect(rendered).not.toContain('patients Works');
  });

  it('conjugates safe genital predicates and keeps ownership on the genital field', () => {
    const character = characterFixture();
    for (const [source, expected] of [
      ['Uses a ring.', "Mara's genitalia use a ring."],
      ['Closes after arousal.', "Mara's genitalia close after arousal."],
      ['Was pierced.', "Mara's genitalia were pierced."],
      ["Wasn't pierced.", "Mara's genitalia were not pierced."],
      ['Has been pierced.', "Mara's genitalia have been pierced."],
      ["Hasn't been pierced.", "Mara's genitalia have not been pierced."],
    ] as const) {
      character.physicalAppearance.genitalia = source;
      const rendered = renderCharacterPromptFacts(character);
      expect(rendered).toContain(expected);
      expect(rendered).not.toContain('genitalia us ');
      expect(rendered).not.toContain('genitalia clos ');
      expect(rendered).not.toContain('Mara has been pierced');
    }
  });

  it('uses an explicit fear transform only when the whole fear proposition is safe', () => {
    const character = characterFixture();
    character.fears = {
      _extras: [
        { id: 'fear-copula', label: 'Abandonment', value: 'Fear is abandonment.' },
        { id: 'fear-greatest', label: 'Isolation', value: 'Greatest fear is isolation.' },
        { id: 'fear-mixed', label: 'Intimacy', value: 'Abandonment. Avoids intimacy.' },
      ],
    };

    const rendered = renderCharacterPromptFacts(character);
    expect(rendered).toContain('Mara fears abandonment.');
    expect(rendered).toContain('Mara fears isolation.');
    expect(rendered).toContain('For Mara, Intimacy: Abandonment. Avoids intimacy.');
    expect(rendered).not.toContain('Mara fears is abandonment');
    expect(rendered).not.toContain('Mara fears greatest fear');
    expect(rendered).not.toContain('Mara fears abandonment. Avoids intimacy.');
  });

  it('withholds overlong custom prose instead of expanding it into the provider packet', () => {
    const character = characterFixture();
    character.sections = [{
      id: 'long-custom',
      title: 'Unstructured notes',
      items: [],
      freeformValue: 'A'.repeat(2_049),
      createdAt: 1,
      updatedAt: 1,
    }];

    const fact = selectCharacterPromptFactsForRendering(character)
      .find((entry) => entry.sourceField === 'sections[0].freeformValue');
    const rendered = renderCharacterPromptFacts(character);
    expect(fact).toEqual(expect.objectContaining({
      modelFacing: false,
      disposition: 'debug_only',
      reason: expect.stringContaining('creator_reference_too_dense_for_safe_deterministic_compaction'),
    }));
    expect(rendered).not.toContain('A'.repeat(200));
  });

  it('does not treat a relationship target used as a dialogue heading as copied creator prose', () => {
    const character = characterFixture();
    character.relationships = {
      _extras: [{ id: 'relationship-name', label: 'Avery', value: 'Trusted colleague.' }],
    };

    const metric = buildCharacterPromptOutputCopyMetric(
      character,
      'Avery: *She folds her arms and waits.*',
    );
    expect(metric.copiedSourceLabels).not.toContainEqual(expect.objectContaining({
      sourceLabel: 'Avery',
    }));
  });

  it('deduplicates British-spelling iris labels against structured eye color', () => {
    const character = characterFixture();
    character.physicalAppearance.eyeColor = 'Grey';
    character.physicalAppearance._extras = [
      { id: 'iris-colour', label: 'Iris colour', value: 'Iris colour: Grey' },
    ];

    const selected = selectCharacterPromptFactsForRendering(character).filter((fact) => (
      fact.sourceField === 'physicalAppearance.eyeColor'
      || fact.sourceField.startsWith('physicalAppearance._extras[')
    ));
    expect(selected.filter((fact) => fact.modelFacing)).toHaveLength(1);
    expect(new Set(selected.map((fact) => fact.semanticKey))).toHaveLength(1);
  });
});
