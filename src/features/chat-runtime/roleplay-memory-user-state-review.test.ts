import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { reviewRoleplayMemoryExtractionEvents } from './roleplay-memory-user-state-review';

const userSource = {
  id: 'user-1',
  generationId: 'user-generation-1',
  text: 'I want Mara to know that I am afraid of the cellar.',
};
const assistantSource = {
  id: 'assistant-1',
  generationId: 'assistant-generation-1',
  text: 'A visible shiver ran through Avery as Mara opened the cellar door.',
};
const userCharacters = [{ id: 'avery', name: 'Avery' }];
const noDuplicate = () => false;

describe('roleplay memory user-state review', () => {
  it('preserves explicit user-authored state as a durable raw user fact', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['Avery told Mara that they were afraid of the cellar.'],
      userStateReviews: [{
        eventIndex: 0,
        event: 'Avery told Mara that they were afraid of the cellar.',
        appliesToUserCharacter: true,
        userCharacterName: 'Avery',
        claimType: 'emotion',
        sourceRole: 'user',
        evidenceBasis: 'explicit_user_authorship',
        evidence: 'I am afraid of the cellar',
        reason: 'The user explicitly stated this fear.',
      }],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters,
      isNearDuplicate: noDuplicate,
    });

    expect(review.acceptedEvents).toHaveLength(1);
    expect(review.candidateReviews[0]).toMatchObject({
      accepted: true,
      authority: 'raw_user_fact',
      modelFacingAction: 'allow_as_fact',
      sourceMessageId: 'user-1',
    });
  });

  it('allows a supported bodily observation without upgrading it into private state', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['Avery visibly shivered when the cellar opened.'],
      userStateReviews: [{
        eventIndex: 0,
        event: 'Avery visibly shivered when the cellar opened.',
        appliesToUserCharacter: true,
        userCharacterName: 'Avery',
        claimType: 'bodily_reaction',
        sourceRole: 'assistant',
        evidenceBasis: 'accepted_visible_observation',
        evidence: 'A visible shiver ran through Avery',
        reason: 'The accepted response visibly described the reaction.',
      }],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters,
      isNearDuplicate: noDuplicate,
    });

    expect(review.candidateReviews[0]).toMatchObject({
      accepted: true,
      authority: 'accepted_assistant_observable_change',
      modelFacingAction: 'allow_as_observation',
    });
  });

  it('rejects assistant interpretation, unsupported action, and malformed coverage', () => {
    const reviews = reviewRoleplayMemoryExtractionEvents({
      events: [
        'Avery secretly wanted Mara.',
        'Avery chose to enter the cellar.',
        'Avery consented to Mara.',
      ],
      userStateReviews: [
        {
          eventIndex: 0,
          event: 'Avery secretly wanted Mara.',
          appliesToUserCharacter: true,
          userCharacterName: 'Avery',
          claimType: 'intent',
          sourceRole: 'assistant',
          evidenceBasis: 'in_character_interpretation',
          evidence: 'A visible shiver ran through Avery',
          reason: 'The assistant inferred hidden desire.',
        },
        {
          eventIndex: 1,
          event: 'Avery chose to enter the cellar.',
          appliesToUserCharacter: true,
          userCharacterName: 'Avery',
          claimType: 'voluntary_action',
          sourceRole: 'assistant',
          evidenceBasis: 'accepted_visible_observation',
          evidence: 'A visible shiver ran through Avery',
          reason: 'The assistant assigned the action.',
        },
      ],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters,
      isNearDuplicate: noDuplicate,
    });

    expect(reviews.acceptedEvents).toEqual([]);
    expect(reviews.candidateReviews).toEqual([
      expect.objectContaining({ accepted: false, authority: 'assistant_interpretation' }),
      expect.objectContaining({ accepted: false, modelFacingAction: 'reject_from_persistence' }),
      expect.objectContaining({ accepted: false, reason: 'missing_source_authority_review' }),
    ]);
  });

  it('fails closed when evidence is attributed to the wrong source or a review is duplicated', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['Avery was afraid.', 'Avery shivered.'],
      userStateReviews: [
        {
          eventIndex: 0,
          event: 'Avery was afraid.',
          appliesToUserCharacter: true,
          userCharacterName: 'Avery',
          claimType: 'emotion',
          sourceRole: 'user',
          evidenceBasis: 'explicit_user_authorship',
          evidence: 'A visible shiver ran through Avery',
          reason: 'Wrong source.',
        },
        {
          eventIndex: 1,
          event: 'Avery shivered.',
          appliesToUserCharacter: true,
          userCharacterName: 'Avery',
          claimType: 'bodily_reaction',
          sourceRole: 'assistant',
          evidenceBasis: 'accepted_visible_observation',
          evidence: 'A visible shiver ran through Avery',
          reason: 'First review.',
        },
        {
          eventIndex: 1,
          event: 'Avery shivered.',
          appliesToUserCharacter: true,
          userCharacterName: 'Avery',
          claimType: 'bodily_reaction',
          sourceRole: 'assistant',
          evidenceBasis: 'accepted_visible_observation',
          evidence: 'A visible shiver ran through Avery',
          reason: 'Duplicate review.',
        },
      ],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters,
      isNearDuplicate: noDuplicate,
    });

    expect(review.candidateReviews.map((row) => row.reason)).toEqual([
      'source_evidence_not_found',
      'duplicate_source_authority_review',
    ]);
  });

  it('does not let the worker bypass authority review by mislabeling a named user character', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['Avery consented to Mara.'],
      userStateReviews: [{
        eventIndex: 0,
        event: 'Avery consented to Mara.',
        appliesToUserCharacter: false,
        userCharacterName: null,
        claimType: null,
        sourceRole: 'assistant',
        evidenceBasis: 'not_applicable',
        evidence: 'A visible shiver ran through Avery',
        reason: 'Incorrectly labeled as non-user state.',
      }],
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters,
      isNearDuplicate: noDuplicate,
    });

    expect(review.acceptedEvents).toEqual([]);
    expect(review.candidateReviews[0]).toMatchObject({
      accepted: false,
      reason: 'user_character_subject_mislabeled',
    });
  });

  it('enforces the same identity boundary for non-Latin user-character names', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['Юлия consented to Mara.'],
      userStateReviews: [{
        eventIndex: 0,
        event: 'Юлия consented to Mara.',
        appliesToUserCharacter: false,
        userCharacterName: null,
        claimType: null,
        sourceRole: 'assistant',
        evidenceBasis: 'not_applicable',
        evidence: 'Юлия consented to Mara',
        reason: 'Incorrectly labeled as non-user state.',
      }],
      userSourceMessage: userSource,
      assistantSourceMessage: {
        ...assistantSource,
        text: 'Юлия consented to Mara.',
      },
      assistantSourceAccepted: true,
      userCharacters: [{ id: 'julia', name: 'Юлия' }],
      isNearDuplicate: noDuplicate,
    });

    expect(review.acceptedEvents).toEqual([]);
    expect(review.candidateReviews[0]).toMatchObject({
      accepted: false,
      reason: 'user_character_subject_mislabeled',
    });
  });

  it('enforces the same identity boundary for symbol-only user-character names', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['♥ consented to Mara.'],
      userStateReviews: [{
        eventIndex: 0,
        event: '♥ consented to Mara.',
        appliesToUserCharacter: false,
        userCharacterName: null,
        claimType: null,
        sourceRole: 'assistant',
        evidenceBasis: 'not_applicable',
        evidence: '♥ consented to Mara',
        reason: 'Incorrectly labeled as non-user state.',
      }],
      userSourceMessage: userSource,
      assistantSourceMessage: {
        ...assistantSource,
        text: '♥ consented to Mara.',
      },
      assistantSourceAccepted: true,
      userCharacters: [{ id: 'heart', name: '♥' }],
      isNearDuplicate: noDuplicate,
    });

    expect(review.acceptedEvents).toEqual([]);
    expect(review.candidateReviews[0]).toMatchObject({
      accepted: false,
      reason: 'user_character_subject_mislabeled',
    });
  });

  it('preserves non-user durable events and reports duplicates separately', () => {
    const review = reviewRoleplayMemoryExtractionEvents({
      events: ['Mara opened the cellar.', 'Mara opened the cellar.'],
      userStateReviews: [0, 1].map((eventIndex) => ({
        eventIndex,
        event: 'Mara opened the cellar.',
        appliesToUserCharacter: false,
        userCharacterName: null,
        claimType: null,
        sourceRole: 'assistant',
        evidenceBasis: 'not_applicable',
        evidence: 'Mara opened the cellar door',
        reason: 'This concerns Mara and the scene, not user-owned state.',
      })),
      userSourceMessage: userSource,
      assistantSourceMessage: assistantSource,
      assistantSourceAccepted: true,
      userCharacters,
      isNearDuplicate: (accepted, candidate) => accepted.includes(candidate),
    });

    expect(review.acceptedEvents).toEqual(['Mara opened the cellar.']);
    expect(review.omittedCandidates).toEqual([expect.objectContaining({
      reason: 'near_duplicate_existing_memory',
      sourceMessageId: 'assistant-1',
    })]);
  });

  it('locks the existing edge response to one structured authority review collection', () => {
    const edgeSource = readFileSync('supabase/functions/extract-memory-events/index.ts', 'utf8');
    expect(edgeSource).toContain('userStateReviews');
    expect(edgeSource).toContain('appliesToUserCharacter');
    expect(edgeSource).toContain('accepted_visible_observation');
    expect(edgeSource).toContain('in_character_interpretation');
    expect(edgeSource).toContain('sourceRole');
    expect(edgeSource).toContain('evidenceBasis');
    expect(edgeSource.match(/callXaiResponses\(/g)).toHaveLength(1);
  });
});
