import { describe, expect, it } from 'vitest';
import type { ScenarioData } from '@/types';
import { getSystemInstruction } from '@/services/llm';
import {
  selectRoleplayGoalsForTurn,
  type RoleplayGoalExposureDecision,
} from './roleplay-goal-selector';

function fixture(): ScenarioData {
  return {
    version: 1,
    characters: [
      {
        id: 'character-sarah',
        name: 'Sarah',
        controlledBy: 'AI',
        characterRole: 'Main',
        location: 'Workshop',
        goals: [
          {
            id: 'character-goal-repair',
            title: 'Repair the transmitter',
            desiredOutcome: 'Restore the transmitter before nightfall.',
            currentStatus: 'The power board is exposed.',
            progress: 25,
            steps: [{ id: 'repair-step', description: 'Replace the damaged power board.', completed: false }],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'character-goal-leave',
            title: 'Leave the settlement',
            desiredOutcome: 'Depart after the winter supply is secured.',
            currentStatus: 'Long-range planning only.',
            progress: 0,
            steps: [{ id: 'leave-step', description: 'Secure winter provisions.', completed: false }],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'character-goal-inspect',
            title: 'Inspect the transmitter',
            desiredOutcome: 'Understand the transmitter failure.',
            currentStatus: 'Diagnostic work has not begun.',
            progress: 0,
            steps: [{ id: 'inspect-step', description: 'Review the transmission logs.', completed: false }],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'character-goal-complete',
            title: 'Open the archive',
            desiredOutcome: 'Read the sealed archive.',
            currentStatus: 'Finished.',
            progress: 100,
            steps: [{ id: 'archive-step', description: 'Unlock the sealed archive.', completed: true }],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: 'character-goal-owner-only',
            title: 'Sally',
            desiredOutcome: 'Keep Sarah central to the story.',
            currentStatus: '',
            progress: 0,
            steps: [],
            flexibility: 'normal',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        nicknames: 'Sally', age: '', sexType: '', sexualOrientation: '', scenePosition: '',
        roleDescription: '', tags: '', avatarDataUrl: '', physicalAppearance: {} as never,
        currentlyWearing: {} as never, preferredClothing: {} as never, sections: [], createdAt: 1, updatedAt: 1,
      },
    ],
    sideCharacters: [],
    world: {
      core: {
        scenarioName: 'Signal', briefDescription: '', storyPremise: '', dialogFormatting: '',
        storyGoals: [
          {
            id: 'story-goal-storm',
            title: 'Survive the storm',
            desiredOutcome: 'Keep the settlement safe during the storm.',
            currentStatus: 'The storm remains several days away.',
            steps: [{ id: 'storm-step', description: 'Reinforce the outer wall.', completed: false }],
            flexibility: 'normal', createdAt: 1, updatedAt: 1,
          },
          {
            id: 'story-goal-hidden',
            title: 'Find the hidden vault',
            desiredOutcome: 'Discover a vault unknown to the characters.',
            steps: [], flexibility: 'normal',
            alignment: {
              goalId: 'story-goal-hidden', goalKind: 'story', score: 0, status: 'dropped',
              trend: 'falling', supportCount: 0, resistanceCount: 1, driftCount: 1,
              lastSignal: 'resistance', updatedAt: 1,
            },
            createdAt: 1, updatedAt: 1,
          },
          {
            id: 'story-goal-escape',
            title: 'Escape',
            desiredOutcome: 'Get clear of the settlement.',
            steps: [], flexibility: 'normal',
            createdAt: 1, updatedAt: 1,
          },
        ],
        structuredLocations: [], customWorldSections: [],
      },
      entries: [],
    },
    story: { openingDialog: {} as never },
    scenes: [], conversations: [],
  } as ScenarioData;
}

function select(
  latestPlayerTurn: string,
  mode: 'normal_send' | 'retry_regenerate' | 'continue_assistant_tail' = 'normal_send',
  appData = fixture(),
): RoleplayGoalExposureDecision {
  return selectRoleplayGoalsForTurn({
    appData,
    latestPlayerTurn,
    sourceMessageId: 'message-player-current',
    mode,
  });
}

function goal(receipt: RoleplayGoalExposureDecision, goalId: string) {
  return receipt.decisions.find((row) => row.goalId === goalId);
}

describe('selectRoleplayGoalsForTurn', () => {
  it('activates only the goal explicitly invoked by the latest player turn', () => {
    const receipt = select('Sarah, replace the damaged transmitter power board now.');

    expect(receipt.mode).toBe('normal_send');
    expect(receipt.receiptId).toMatch(/^goal-exposure:normal_send:/);
    expect(goal(receipt, 'character-goal-repair')).toMatchObject({
      tier: 'active',
      reason: 'directly_requested_in_latest_player_turn',
      evidenceConfidence: 'explicit',
      renderDetail: 'full',
      openMilestoneId: 'repair-step',
      partialProgress: 'debug_only',
    });
    expect(goal(receipt, 'character-goal-leave')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'no_strong_current_turn_evidence',
      renderDetail: 'debug_only',
    });
    expect(goal(receipt, 'character-goal-inspect')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'no_strong_current_turn_evidence',
    });
    expect(goal(receipt, 'story-goal-storm')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'no_strong_current_turn_evidence',
    });
  });

  it('does not activate goals from an owner name, common words, or scene tags', () => {
    const receipt = select('Sarah stays near me and asks what we should do next. [SCENE: Outer Wall Storm]');

    expect(receipt.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({ goalId: 'character-goal-repair', tier: 'hidden_this_turn' }),
      expect.objectContaining({ goalId: 'character-goal-leave', tier: 'hidden_this_turn' }),
      expect.objectContaining({ goalId: 'story-goal-storm', tier: 'hidden_this_turn' }),
    ]));
    expect(receipt.decisions.some((row) => row.evidence.some((entry) => entry.includes('active_scene')))).toBe(false);
  });

  it('does not treat a direct request containing only the owner name as goal evidence', () => {
    const receipt = select('We need Sally here.');

    expect(goal(receipt, 'character-goal-owner-only')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'no_strong_current_turn_evidence',
    });
  });

  it('accepts a direct latest-player request for an exact one-word goal', () => {
    const receipt = select("Let's escape.");

    expect(goal(receipt, 'story-goal-escape')).toMatchObject({
      tier: 'active',
      reason: 'directly_requested_in_latest_player_turn',
      evidence: expect.arrayContaining([
        'latest_player_turn_direct_request',
        'latest_player_turn_goal_phrase:escape',
      ]),
    });
  });

  it('uses distinctive phrases to separate goals that share the same entity', () => {
    const vague = select('The transmitter is making noise again.');
    const direct = select('We need to inspect the transmitter before anything else.');

    expect(goal(vague, 'character-goal-repair')?.tier).toBe('hidden_this_turn');
    expect(goal(vague, 'character-goal-inspect')?.tier).toBe('hidden_this_turn');
    expect(goal(direct, 'character-goal-repair')?.tier).toBe('hidden_this_turn');
    expect(goal(direct, 'character-goal-inspect')).toMatchObject({
      tier: 'active',
      reason: 'directly_requested_in_latest_player_turn',
      evidence: expect.arrayContaining([
        'latest_player_turn_goal_phrase:inspect the transmitter',
      ]),
    });
  });

  it('lets existing alignment and completed steps veto exposure but never activate a goal', () => {
    const receipt = select('Please find the hidden vault, then unlock the sealed archive.');

    expect(goal(receipt, 'story-goal-hidden')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'alignment_not_writer_visible',
    });
    expect(goal(receipt, 'character-goal-complete')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'goal_completed',
    });
  });

  it('makes the same exposure decision for Normal Send, Retry, and Continue', () => {
    const latestPlayerTurn = 'Sarah, replace the damaged transmitter power board now.';
    const normal = select(latestPlayerTurn, 'normal_send');
    const retry = select(latestPlayerTurn, 'retry_regenerate');
    const continuation = select(latestPlayerTurn, 'continue_assistant_tail');

    expect(retry.decisions).toEqual(normal.decisions);
    expect(continuation.decisions).toEqual(normal.decisions);
    expect(retry.mode).toBe('retry_regenerate');
    expect(continuation.mode).toBe('continue_assistant_tail');
  });

  it('renders only active goals and keeps unsupported goals out of provider prose', () => {
    const appData = fixture();
    const receipt = select('Sarah, replace the damaged transmitter power board now.', 'normal_send', appData);
    const prompt = getSystemInstruction(appData, 1, 'day', [], true, null, receipt.decisions);

    expect(prompt).toContain('CHARACTER GOAL: Repair the transmitter');
    expect(prompt).toContain('Current open milestone: Replace the damaged power board');
    expect(prompt).not.toContain('Leave the settlement');
    expect(prompt).not.toContain('Survive the storm');
    expect(prompt).not.toContain('Find the hidden vault');
    expect(prompt).not.toContain('Background context only');
  });

  it.each([
    'Do not repair the transmitter.',
    'Please stay here. I refuse to repair anything.',
    'Can you hear that? The transmitter does not need repair.',
    'I am not going to repair the transmitter.',
    'There is no way I will repair the transmitter.',
    'Do anything except repair the transmitter.',
    'Repair the transmitter? No.',
    "I'm not going to repair the transmitter.",
    "We aren't going to inspect the transmitter.",
    "It isn't time to repair the transmitter.",
    "I wasn't going to repair the transmitter.",
    "They weren't going to inspect the transmitter.",
    'I cannot repair the transmitter.',
    'I can’t repair the transmitter.',
    'Repair the transmitter? No way.',
    'Repair the transmitter? Never.',
    'Repair the transmitter? I refuse.',
    "Let's not escape.",
    'Let us not repair the transmitter.',
    "I'm really not going to repair the transmitter.",
    'Repair the transmitter? I won’t.',
    'Please inspect the transmitter, not repair the transmitter.',
    "Let's inspect the transmitter instead of repair the transmitter.",
    'Please tell Mara not to repair the transmitter.',
    'Can you promise not to repair the transmitter?',
    'Repair the transmitter? Not a chance.',
    'Repair the transmitter? Absolutely never.',
    'Repair the transmitter? I refuse to.',
    "Repair the transmitter? I won’t do it.",
    'Repair the transmitter? No thanks.',
    'Repair the transmitter? I absolutely refuse.',
    'Repair the transmitter? No, absolutely not.',
    'Please ask Mara not ever to repair the transmitter.',
    'Anything but repair the transmitter.',
    'Repair the transmitter? I refuse to do it.',
    'Repair the transmitter? Not in a million years.',
    "Repair the transmitter? I don't think so.",
    'Please repair anything other than the transmitter.',
    "Repair the transmitter? I definitely won't.",
    'Repair the transmitter? Not on your life.',
    'Repair the transmitter? Definitely not.',
    'Please repair every device apart from the transmitter.',
    'Repair the transmitter? I decline.',
    'Repair the transmitter? No chance.',
    'Repair the transmitter? Forget about it.',
    'Repair the transmitter? We reject that.',
    'Please repair every device other than the transmitter.',
    'Please repair all equipment with the exception of the transmitter.',
    'Please repair every device save the transmitter.',
    'Please repair each device excepting the transmitter.',
    'Repair the transmitter? “No.”',
    'Repair the transmitter? "Absolutely not."',
    'Repair the transmitter? «I refuse.»',
    'Repair the transmitter? 「No chance.」',
    'Please repair every device barring the transmitter.',
    'Please repair every device sans the transmitter.',
    'Please repair every device minus the transmitter.',
    'Please repair every device not the transmitter.',
  ])('does not activate a negated or refused goal from: %s', (latestPlayerTurn) => {
    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode), 'character-goal-repair')).toMatchObject({
        tier: 'hidden_this_turn',
        reason: 'no_strong_current_turn_evidence',
        evidenceConfidence: 'none',
      });
    }
  });

  it.each([
    'Please inspect the control panel while Mara discusses how to repair the transmitter.',
    'Please inspect the control panel as Mara discusses how to repair the transmitter.',
    'Please inspect the control panel when Mara discusses how to repair the transmitter.',
    'Please inspect the control panel before Mara discusses how to repair the transmitter.',
    'Please inspect the control panel: Mara discusses how to repair the transmitter.',
    'Please inspect the control panel — Mara discusses how to repair the transmitter.',
    'I remember Mara saying, “Please repair the transmitter.”',
    '“Please repair the transmitter,” Mara said.',
    '“Repair the transmitter,” Mara ordered.',
    '"Could you repair the transmitter?" Mara asked.',
    '“Repair the transmitter,” Mara demanded.',
    '“Please repair the transmitter,” Mara insisted.',
    '“Could you repair the transmitter?” Mara pleaded.',
    '“Repair the transmitter,” Mara commanded.',
    '“Repair the transmitter,” Mara muttered.',
    '“Repair the transmitter,” came Mara’s reply.',
    '‘Repair the transmitter’ — Mara’s command.',
    '‘Repair the transmitter,’ Mara’s exact words.',
    '«Repair the transmitter» — from Mara.',
    '「Repair the transmitter」 — Mara’s instruction.',
    'Please repair the console beside the transmitter.',
    'Please repair the console and tell me why the transmitter failed.',
    'Please repair the console or inspect the transmitter.',
    'Please repair the console next to the transmitter.',
    'Please repair the console, which is connected to the transmitter.',
    'Please repair the console and explain how to repair the transmitter.',
    'Please repair the console (not the transmitter).',
    'Please repair the console under the transmitter.',
    "Please repair the console with the transmitter's spare parts.",
    'Please repair the console using the transmitter manual.',
    'Please repair the console to test the transmitter.',
    'Please repair the console without touching the transmitter.',
    'Please repair the transmitter replica.',
    'Please inspect the transmitter-shaped sculpture.',
    'Please find the hidden vault map.',
  ])('does not extend a request signal into narration or reported speech: %s', (latestPlayerTurn) => {
    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      const receipt = select(latestPlayerTurn, mode);

      expect(goal(receipt, 'character-goal-repair')).toMatchObject({
        tier: 'hidden_this_turn',
        reason: 'no_strong_current_turn_evidence',
        evidenceConfidence: 'none',
      });
    }
  });

  it.each([
    ['Escape', 'Escape routes are marked in red.'],
    ['Escape', 'Escape routes collapsed overnight.'],
    ['Escape', 'Escape routes collapse overnight.'],
    ['Escape', 'Escape plans change daily.'],
    ['Escape', 'Escape failed yesterday.'],
    ['Escape', 'Escape often fails.'],
    ['Escape', 'Escape usually fails.'],
    ['Escape', 'Escape, however, remains unlikely.'],
    ['Escape', 'Escape: status remains uncertain.'],
    ['Escape', 'Escape — a distant possibility.'],
    ['Escape', 'Escape; unlikely for now.'],
    ['Escape', 'Escape and repair plans change daily.'],
    ['Escape', 'Escape or shelter options remain available.'],
    ['Repair', 'Repair plans change daily.'],
    ['Repair the transmitter', 'Repair of the transmitter will take several days.'],
    ['Hugging Mara tightly', 'Hugging Mara tightly, I close my eyes.'],
    ['Bent over the console', 'Bent over the console, I watched Mara.'],
  ])('does not classify noun- or gerund-led narration as an imperative: %s :: %s', (title, latestPlayerTurn) => {
    const appData = fixture();
    const character = appData.characters[0];
    character.name = 'Mara';
    character.goals = [{
      ...character.goals![0],
      id: 'declarative-goal-probe',
      title,
      desiredOutcome: title,
      steps: [],
    }];

    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode, appData), 'declarative-goal-probe')).toMatchObject({
        tier: 'hidden_this_turn',
        reason: 'no_strong_current_turn_evidence',
        evidenceConfidence: 'none',
      });
    }
  });

  it.each([
    ['character-goal-repair', 'Please repair that transmitter.'],
    ['character-goal-complete', 'Open the archive.'],
    ['character-goal-leave', "Let's leave the settlement."],
  ])('preserves an unambiguous exact request for %s', (goalId, latestPlayerTurn) => {
    const appData = fixture();
    const selectedGoal = appData.characters[0].goals?.find((entry) => entry.id === goalId);
    if (!selectedGoal) throw new Error('Missing exact request fixture goal: ' + goalId);
    selectedGoal.progress = 0;
    for (const step of selectedGoal.steps || []) step.completed = false;

    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode, appData), goalId)).toMatchObject({
        tier: 'active',
        reason: 'directly_requested_in_latest_player_turn',
        evidenceConfidence: 'explicit',
      });
    }
  });

  it('activates only the requested object head when goals overlap', () => {
    const appData = fixture();
    const character = appData.characters[0];
    character.goals = [
      {
        ...character.goals![0],
        id: 'repair-transmitter',
        title: 'Repair the transmitter',
        steps: [],
      },
      {
        ...character.goals![0],
        id: 'repair-transmitter-replica',
        title: 'Repair the transmitter replica',
        steps: [],
      },
    ];

    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      const receipt = select('Please repair the transmitter replica.', mode, appData);
      expect(goal(receipt, 'repair-transmitter')).toMatchObject({
        tier: 'hidden_this_turn',
        evidenceConfidence: 'none',
      });
      expect(goal(receipt, 'repair-transmitter-replica')).toMatchObject({
        tier: 'active',
        evidenceConfidence: 'explicit',
      });
    }
  });

  it.each([
    'Please repair the transmitter — no, the replica.',
    'Please repair the transmitter: actually, repair the replica.',
    'Please repair the transmitter; ignore that instruction.',
    'Please repair the transmitter (not the actual one).',
    'Please repair the transmitter, which is a replica.',
    'Please repair the transmitter, actually repair the replica.',
    'Please repair the transmitter, not the real one.',
    'Please repair the transmitter, a decoy rather than the real unit.',
  ])('fails closed when a structural tail can change the requested object: %s', (latestPlayerTurn) => {
    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode), 'character-goal-repair')).toMatchObject({
        tier: 'hidden_this_turn',
        evidenceConfidence: 'none',
      });
    }
  });

  it.each([
    'Please repair the toy transmitter.',
    'Please repair a different transmitter.',
    'Please repair another transmitter.',
    'Please repair the decoy transmitter.',
  ])('does not erase identity-changing object modifiers: %s', (latestPlayerTurn) => {
    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode), 'character-goal-repair')).toMatchObject({
        tier: 'hidden_this_turn',
        evidenceConfidence: 'none',
      });
    }
  });

  it('requires the milestone compound object rather than one incidental modifier', () => {
    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(
        select('Please repair the damaged notice board.', mode),
        'character-goal-repair',
      )).toMatchObject({
        tier: 'hidden_this_turn',
        evidenceConfidence: 'none',
      });
    }
  });

  it.each([
    'Please quickly repair the transmitter.',
    'Sarah, quickly repair the transmitter.',
  ])('accepts an unambiguous command with a pre-action adverb: %s', (latestPlayerTurn) => {
    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode), 'character-goal-repair')).toMatchObject({
        tier: 'active',
        evidenceConfidence: 'explicit',
      });
    }
  });

  it.each([
    ['Escape from the prison', 'Please escape from the prison.'],
    ['Turn on the generator', 'Please turn on the generator.'],
    ['Look for the brass key', 'Could you look for the brass key?'],
    ['Speak with Mara', 'Please speak with Mara.'],
  ])('preserves direct requests with phrasal or prepositional complements: %s', (title, latestPlayerTurn) => {
    const appData = fixture();
    appData.characters[0].goals = [{
      ...appData.characters[0].goals![0],
      id: 'phrasal-goal',
      title,
      steps: [],
    }];

    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode, appData), 'phrasal-goal')).toMatchObject({
        tier: 'active',
        evidenceConfidence: 'explicit',
      });
    }
  });

  it('keeps request and evidence in the same non-negated clause', () => {
    const receipt = select('Please inspect the transmitter, but do not repair it.');

    expect(goal(receipt, 'character-goal-inspect')).toMatchObject({
      tier: 'active',
      reason: 'directly_requested_in_latest_player_turn',
      evidenceConfidence: 'explicit',
    });
    expect(goal(receipt, 'character-goal-repair')).toMatchObject({
      tier: 'hidden_this_turn',
      evidenceConfidence: 'none',
    });
  });

  it('keeps a rather-than alternative out without resolving an ambiguous pronoun', () => {
    const receipt = select("Rather than repair the transmitter, let's inspect it.");

    expect(goal(receipt, 'character-goal-repair')).toMatchObject({
      tier: 'hidden_this_turn',
      evidenceConfidence: 'none',
    });
    expect(goal(receipt, 'character-goal-inspect')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'no_strong_current_turn_evidence',
      evidenceConfidence: 'none',
    });
  });

  it('preserves a positive request next to a separately negated action', () => {
    const receipt = select("Please inspect the transmitter, and don't repair it.");

    expect(goal(receipt, 'character-goal-inspect')).toMatchObject({
      tier: 'active',
      reason: 'directly_requested_in_latest_player_turn',
    });
    expect(goal(receipt, 'character-goal-repair')).toMatchObject({
      tier: 'hidden_this_turn',
      evidenceConfidence: 'none',
    });
  });

  it('does not let a weak one-term request activate a multi-term goal', () => {
    const receipt = select('Please repair.');

    expect(goal(receipt, 'character-goal-repair')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'no_strong_current_turn_evidence',
    });
  });

  it('ignores identity words and generic roleplay actions as exposure evidence', () => {
    const receipt = select('I talk with Sarah. I kiss Sally softly.');

    expect(receipt.decisions.every((decision) => decision.tier === 'hidden_this_turn')).toBe(true);
  });

  it('does not activate goals from inflected generic narration plus identity words', () => {
    const appData = fixture();
    const character = appData.characters[0];
    character.name = 'Mara';
    character.nicknames = 'Red';
    character.goals = [
      {
        ...character.goals![0],
        id: 'character-goal-holding',
        title: 'Holding Mara softly',
        desiredOutcome: 'Remain close to Mara.',
        steps: [],
      },
      {
        ...character.goals![1],
        id: 'character-goal-walking',
        title: 'Walking beside Red',
        desiredOutcome: 'Remain beside Red.',
        steps: [],
      },
    ];

    const receipt = select("I'm holding Mara softly. I am walking beside Red.", 'normal_send', appData);

    expect(receipt.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({ goalId: 'character-goal-holding', tier: 'hidden_this_turn' }),
      expect.objectContaining({ goalId: 'character-goal-walking', tier: 'hidden_this_turn' }),
    ]));
  });

  it.each([
    ['Sit beside Mara', 'I sit beside Mara.'],
    ['Sitting near Mara', 'I am sitting near Mara.'],
    ['Lying beside Red', 'I am lying beside Red.'],
    ['Running toward Mara', 'I am running toward Mara.'],
  ])('does not treat ordinary movement as distinctive goal evidence: %s', (title, latestPlayerTurn) => {
    const appData = fixture();
    const character = appData.characters[0];
    character.name = 'Mara';
    character.nicknames = 'Red';
    character.goals = [{
      ...character.goals![0],
      id: 'ordinary-movement-goal',
      title,
      desiredOutcome: title,
      steps: [],
    }];

    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode, appData), 'ordinary-movement-goal')).toMatchObject({
        tier: 'hidden_this_turn',
        reason: 'no_strong_current_turn_evidence',
        evidenceConfidence: 'none',
      });
    }
  });

  it.each([
    ['Hug Mara tightly', 'I hug Mara tightly.'],
    ['Kiss Mara hard and fast', 'I kiss Mara hard and fast.'],
    ['Touch Mara slowly and firmly', 'I touch Mara slowly and firmly.'],
    ['Lean against Mara', 'I lean against Mara.'],
    ['Kneel before Mara', 'I kneel before Mara.'],
    ['Rest against Mara', 'I rest against Mara.'],
  ])('does not promote ordinary narration into a goal invocation: %s', (title, latestPlayerTurn) => {
    const appData = fixture();
    const character = appData.characters[0];
    character.name = 'Mara';
    character.goals = [{
      ...character.goals![0],
      id: 'ordinary-narration-goal',
      title,
      desiredOutcome: title,
      steps: [],
    }];

    for (const mode of ['normal_send', 'retry_regenerate', 'continue_assistant_tail'] as const) {
      expect(goal(select(latestPlayerTurn, mode, appData), 'ordinary-narration-goal')).toMatchObject({
        tier: 'hidden_this_turn',
        reason: 'no_strong_current_turn_evidence',
        evidenceConfidence: 'none',
      });
    }
  });

  it('treats a progress-complete goal with no authored steps as completed', () => {
    const appData = fixture();
    const completedGoal = appData.characters[0]?.goals?.find((entry) => entry.id === 'character-goal-leave');
    if (!completedGoal) throw new Error('Missing completed character fixture goal.');
    completedGoal.steps = [];
    completedGoal.progress = 100;

    const receipt = select("Let's leave the settlement.", 'normal_send', appData);

    expect(goal(receipt, 'character-goal-leave')).toMatchObject({
      tier: 'hidden_this_turn',
      reason: 'goal_completed',
      evidence: ['goal_progress_complete'],
    });
  });

  it('fails closed when selector decisions are absent or not active', () => {
    const appData = fixture();
    const withoutDecisions = getSystemInstruction(appData, 1, 'day', [], true, null);
    const withNonActiveDecision = getSystemInstruction(
      appData,
      1,
      'day',
      [],
      true,
      null,
      [{
        ...goal(select('No goal evidence here.'), 'character-goal-repair'),
        tier: 'hidden_this_turn',
        renderDetail: 'debug_only',
      } as NonNullable<ReturnType<typeof goal>>],
    );

    expect(withoutDecisions).not.toContain('CHARACTER GOAL:');
    expect(withoutDecisions).not.toContain('STORY GOAL:');
    expect(withNonActiveDecision).not.toContain('Repair the transmitter');
    expect(withNonActiveDecision).not.toContain('Background context only');
  });

  it('binds receipt identity to the source turn and open milestone', () => {
    const firstData = fixture();
    const secondData = fixture();
    const repairGoal = secondData.characters[0].goals?.find((entry) => entry.id === 'character-goal-repair');
    if (!repairGoal?.steps?.[0]) throw new Error('Missing repair fixture milestone.');
    repairGoal.steps[0].id = 'repair-step-revised';
    repairGoal.steps[0].description = 'Install the revised power board.';

    const first = selectRoleplayGoalsForTurn({
      appData: firstData,
      latestPlayerTurn: 'Repair the transmitter power board.',
      sourceMessageId: 'message-player-one',
      mode: 'normal_send',
    });
    const differentMilestone = selectRoleplayGoalsForTurn({
      appData: secondData,
      latestPlayerTurn: 'Repair the transmitter power board.',
      sourceMessageId: 'message-player-one',
      mode: 'normal_send',
    });
    const differentSource = selectRoleplayGoalsForTurn({
      appData: firstData,
      latestPlayerTurn: 'Repair the transmitter power board.',
      sourceMessageId: 'message-player-two',
      mode: 'normal_send',
    });

    expect(first.sourceMessageId).toBe('message-player-one');
    expect(goal(first, 'character-goal-repair')).toMatchObject({
      sourceMessageId: 'message-player-one',
      evidenceConfidence: 'explicit',
      openMilestoneId: 'repair-step',
      openMilestoneDescription: 'Replace the damaged power board.',
    });
    expect(differentMilestone.receiptId).not.toBe(first.receiptId);
    expect(differentSource.receiptId).not.toBe(first.receiptId);
  });
});
