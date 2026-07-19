import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
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
      value: 'Guarded; intensely observant.',
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
        value: 'Likes · verbally · dominant · sex.',
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
      value: 'Likes · verbally · dominant · sex.',
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
    expect(rendered).toContain('- Sexual preferences: Control: Likes · verbally · dominant · sex.');
    expect(rendered).not.toContain('Likes being verbally dominant during sex.');
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
      { id: 'extra-1', label: 'Eye color duplicate', value: 'Grey' },
    ];

    const rendered = renderCharacterPromptFacts(character);

    expect(rendered.match(/Grey/g)).toHaveLength(1);

    const selected = selectCharacterPromptFactsForRendering(character);
    expect(selected.filter((fact) => fact.value === 'Grey')).toEqual([
      expect.objectContaining({ modelFacing: true, disposition: 'included' }),
      expect.objectContaining({
        modelFacing: false,
        disposition: 'suppressed',
        reason: expect.stringContaining('duplicate_model_facing_value_suppressed'),
      }),
    ]);
  });

  it('summarizes duplicate-source and legacy-heading copy risk without changing fact policy', () => {
    const character = characterFixture();
    character.physicalAppearance._extras = [
      { id: 'extra-1', label: 'Eye color duplicate', value: 'Grey' },
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
});
