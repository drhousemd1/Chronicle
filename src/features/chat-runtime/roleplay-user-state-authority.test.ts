import { describe, expect, it } from 'vitest';

import {
  ROLEPLAY_USER_STATE_AUTHORITIES,
  ROLEPLAY_USER_STATE_CLAIM_TYPES,
  buildRoleplayUserStateAuthorityDebugSummary,
  classifyRoleplayUserStateClaim,
  collectPersistedRoleplayUserStateAuthorityDecisions,
  isPersistedRoleplayUserStateAuthorityDecision,
  mergeRoleplayUserStateAuthorityDecisions,
} from './roleplay-user-state-authority';

describe('roleplay user-state source authority', () => {
  it('locks the stable authority and claim-type vocabularies', () => {
    expect(ROLEPLAY_USER_STATE_AUTHORITIES).toEqual([
      'raw_user_fact',
      'accepted_assistant_observable_change',
      'assistant_interpretation',
      'unsupported_overreach',
    ]);
    expect(ROLEPLAY_USER_STATE_CLAIM_TYPES).toEqual([
      'emotion',
      'intent',
      'arousal',
      'consent',
      'bodily_reaction',
      'preference',
      'voluntary_action',
      'dialogue_assignment',
      'internal_thought',
    ]);
  });

  it.each(ROLEPLAY_USER_STATE_CLAIM_TYPES)(
    'keeps explicit user-authored %s state authoritative without sanitizing content',
    (claimType) => {
      expect(classifyRoleplayUserStateClaim({
        claim: 'I want this, I consent, and I am aroused.',
        userCharacterId: 'player-character',
        claimType,
        sourceMessageId: 'user-message-1',
        sourceRole: 'user',
        evidenceBasis: 'explicit_user_authorship',
        intendedUse: 'prompt',
      })).toMatchObject({
        authority: 'raw_user_fact',
        modelFacingAction: 'allow_as_fact',
        reason: 'explicit_user_authorship',
      });
    },
  );

  it('keeps an accepted visible physical change as observation rather than hidden state', () => {
    expect(classifyRoleplayUserStateClaim({
      claim: 'The player character trembles visibly.',
      userCharacterId: 'player-character',
      claimType: 'bodily_reaction',
      sourceMessageId: 'assistant-message-1',
      sourceGenerationId: 'assistant-generation-1',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'prompt',
    })).toMatchObject({
      authority: 'accepted_assistant_observable_change',
      modelFacingAction: 'allow_as_observation',
    });
  });

  it.each(['emotion', 'intent', 'arousal', 'consent', 'preference', 'internal_thought'] as const)(
    'does not upgrade assistant-authored %s into directly observable user state',
    (claimType) => {
      expect(classifyRoleplayUserStateClaim({
        claim: 'The assistant claims a private player state.',
        claimType,
        sourceMessageId: 'assistant-message-2',
        sourceGenerationId: 'assistant-generation-2',
        sourceRole: 'assistant',
        sourceGenerationAccepted: true,
        evidenceBasis: 'accepted_visible_observation',
        intendedUse: 'prompt',
      })).toMatchObject({
        authority: 'assistant_interpretation',
        modelFacingAction: 'allow_as_character_interpretation',
        reason: 'user_owned_state_requires_user_authorship',
      });
    },
  );

  it('does not treat assistant-authored voluntary action as an accepted observation', () => {
    expect(classifyRoleplayUserStateClaim({
      claim: 'The assistant makes the player character step closer.',
      claimType: 'voluntary_action',
      sourceMessageId: 'assistant-message-action',
      sourceGenerationId: 'assistant-generation-action',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'persistence',
    })).toMatchObject({
      authority: 'assistant_interpretation',
      modelFacingAction: 'reject_from_persistence',
      reason: 'user_owned_state_requires_user_authorship',
    });
  });

  it('rejects assistant interpretation from persistence while preserving it as interpretation in prompts', () => {
    const base = {
      claim: 'She probably wants him to continue.',
      claimType: 'intent' as const,
      sourceMessageId: 'assistant-message-3',
      sourceGenerationId: 'assistant-generation-3',
      sourceRole: 'assistant' as const,
      sourceGenerationAccepted: true,
      evidenceBasis: 'in_character_interpretation' as const,
    };
    expect(classifyRoleplayUserStateClaim({ ...base, intendedUse: 'prompt' })).toMatchObject({
      authority: 'assistant_interpretation',
      modelFacingAction: 'allow_as_character_interpretation',
    });
    expect(classifyRoleplayUserStateClaim({ ...base, intendedUse: 'persistence' })).toMatchObject({
      authority: 'assistant_interpretation',
      modelFacingAction: 'reject_from_persistence',
    });
  });

  it('rejects replaced assistant generations and missing source lineage', () => {
    expect(classifyRoleplayUserStateClaim({
      claim: 'A visible reaction from a replaced response.',
      claimType: 'bodily_reaction',
      sourceMessageId: 'assistant-message-4',
      sourceGenerationId: 'replaced-generation',
      sourceRole: 'assistant',
      sourceGenerationAccepted: false,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'persistence',
    })).toMatchObject({
      authority: 'unsupported_overreach',
      modelFacingAction: 'reject_from_persistence',
      reason: 'assistant_generation_not_accepted',
    });
    expect(classifyRoleplayUserStateClaim({
      claim: 'A claim with no traceable source.',
      claimType: 'emotion',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'in_character_interpretation',
      intendedUse: 'debug',
    })).toMatchObject({
      authority: 'unsupported_overreach',
      modelFacingAction: 'debug_only',
      reason: 'missing_source_message_id',
    });
    expect(classifyRoleplayUserStateClaim({
      claim: 'An assistant claim with no generation identity.',
      claimType: 'bodily_reaction',
      sourceMessageId: 'assistant-message-no-generation',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'persistence',
    })).toMatchObject({
      authority: 'unsupported_overreach',
      modelFacingAction: 'reject_from_persistence',
      reason: 'missing_source_generation_id',
    });
  });

  it('builds debug-only selected, downgraded, and rejected counts without enforcing behavior', () => {
    const decisions = [
      classifyRoleplayUserStateClaim({
        claim: 'I refuse.',
        claimType: 'consent',
        sourceMessageId: 'user-message-1',
        sourceRole: 'user',
        evidenceBasis: 'explicit_user_authorship',
        intendedUse: 'debug',
      }),
      classifyRoleplayUserStateClaim({
        claim: 'The player character shivers visibly.',
        claimType: 'bodily_reaction',
        sourceMessageId: 'assistant-message-1',
        sourceGenerationId: 'assistant-generation-1',
        sourceRole: 'assistant',
        sourceGenerationAccepted: true,
        evidenceBasis: 'accepted_visible_observation',
        intendedUse: 'debug',
      }),
      classifyRoleplayUserStateClaim({
        claim: 'She probably wants more.',
        claimType: 'intent',
        sourceMessageId: 'assistant-message-1',
        sourceGenerationId: 'assistant-generation-1',
        sourceRole: 'assistant',
        sourceGenerationAccepted: true,
        evidenceBasis: 'in_character_interpretation',
        intendedUse: 'debug',
      }),
      classifyRoleplayUserStateClaim({
        claim: 'She consents even though the user never said so.',
        claimType: 'consent',
        sourceMessageId: 'assistant-message-2',
        sourceGenerationId: 'replaced-generation',
        sourceRole: 'assistant',
        sourceGenerationAccepted: false,
        evidenceBasis: 'unsupported',
        intendedUse: 'debug',
      }),
    ];

    expect(decisions.every((decision) => decision.modelFacingAction === 'debug_only')).toBe(true);
    expect(buildRoleplayUserStateAuthorityDebugSummary(decisions)).toEqual({
      total: 4,
      selected: 2,
      downgraded: 1,
      rejected: 1,
      byAuthority: {
        raw_user_fact: 1,
        accepted_assistant_observable_change: 1,
        assistant_interpretation: 1,
        unsupported_overreach: 1,
      },
    });
  });

  it('merges current decisions without retaining superseded user or assistant generations', () => {
    const userDecision = classifyRoleplayUserStateClaim({
      claim: 'I move to the window.',
      claimType: 'voluntary_action',
      sourceMessageId: 'user-message-1',
      sourceGenerationId: 'user-generation-current',
      sourceRole: 'user',
      evidenceBasis: 'explicit_user_authorship',
      intendedUse: 'persistence',
    });
    const staleUserDecision = classifyRoleplayUserStateClaim({
      claim: 'I stay beside the door.',
      claimType: 'voluntary_action',
      sourceMessageId: 'user-message-stale',
      sourceGenerationId: 'user-generation-old',
      sourceRole: 'user',
      evidenceBasis: 'explicit_user_authorship',
      intendedUse: 'persistence',
    });
    const staleAssistantDecision = classifyRoleplayUserStateClaim({
      claim: 'The player moves to the door.',
      claimType: 'voluntary_action',
      sourceMessageId: 'assistant-message-1',
      sourceGenerationId: 'generation-old',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'persistence',
    });
    const currentAssistantDecision = classifyRoleplayUserStateClaim({
      claim: 'The player trembles visibly.',
      claimType: 'bodily_reaction',
      sourceMessageId: 'assistant-message-2',
      sourceGenerationId: 'generation-current',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'prompt',
    });

    expect(mergeRoleplayUserStateAuthorityDecisions({
      existing: [staleAssistantDecision, staleUserDecision, userDecision],
      incoming: [userDecision, currentAssistantDecision],
      isSourceCurrent: (messageId, generationId) => (
        (messageId === 'assistant-message-2' && generationId === 'generation-current')
        || (messageId === 'user-message-1' && generationId === 'user-generation-current')
      ),
    })).toEqual([userDecision, currentAssistantDecision]);
  });

  it('rehydrates only valid authority decisions stored with durable state metadata', () => {
    const persisted = classifyRoleplayUserStateClaim({
      claim: 'Avery is at the kitchen.',
      userCharacterId: 'avery',
      claimType: 'voluntary_action',
      sourceMessageId: 'user-message-1',
      sourceGenerationId: 'user-generation-1',
      sourceRole: 'user',
      evidenceBasis: 'explicit_user_authorship',
      intendedUse: 'persistence',
    });

    expect(collectPersistedRoleplayUserStateAuthorityDecisions([{
      location: {
        fieldPath: 'location',
        storyDay: 1,
        timeOfDay: 'day',
        sourceMessageId: 'assistant-message-1',
        sourceGenerationId: 'assistant-generation-1',
        updatedAt: 1,
        userStateAuthorityDecision: {
          ...persisted,
          sourceMessageId: 'user-message-1',
          sourceGenerationId: 'user-generation-1',
          sourceRole: 'user',
          evidenceBasis: 'explicit_user_authorship',
        },
      },
      scenePosition: {
        fieldPath: 'scenePosition',
        storyDay: 1,
        timeOfDay: 'day',
        sourceMessageId: 'assistant-message-1',
        sourceGenerationId: 'assistant-generation-1',
        updatedAt: 1,
        userStateAuthorityDecision: {
          ...persisted,
          authority: 'invented_authority',
        } as never,
      },
    }])).toEqual([persisted]);
  });

  it('fails closed when persisted authority metadata is incomplete or semantically impossible', () => {
    const validUserDecision = classifyRoleplayUserStateClaim({
      claim: 'Avery moves to the kitchen.',
      userCharacterId: 'avery',
      claimType: 'voluntary_action',
      sourceMessageId: 'user-message-1',
      sourceGenerationId: 'user-generation-1',
      sourceRole: 'user',
      evidenceBasis: 'explicit_user_authorship',
      intendedUse: 'persistence',
    });
    const validAssistantDecision = classifyRoleplayUserStateClaim({
      claim: 'Avery trembles visibly.',
      userCharacterId: 'avery',
      claimType: 'bodily_reaction',
      sourceMessageId: 'assistant-message-1',
      sourceGenerationId: 'assistant-generation-1',
      sourceRole: 'assistant',
      sourceGenerationAccepted: true,
      evidenceBasis: 'accepted_visible_observation',
      intendedUse: 'persistence',
    });

    expect(isPersistedRoleplayUserStateAuthorityDecision(validUserDecision)).toBe(true);
    expect(isPersistedRoleplayUserStateAuthorityDecision(validAssistantDecision)).toBe(true);
    expect(isPersistedRoleplayUserStateAuthorityDecision({
      ...validUserDecision,
      sourceGenerationId: undefined,
    })).toBe(false);
    expect(isPersistedRoleplayUserStateAuthorityDecision({
      ...validUserDecision,
      sourceRole: 'assistant',
    })).toBe(false);
    expect(isPersistedRoleplayUserStateAuthorityDecision({
      ...validAssistantDecision,
      authority: 'assistant_interpretation',
      modelFacingAction: 'reject_from_persistence',
    })).toBe(false);
  });
});
