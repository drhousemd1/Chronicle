import { describe, expect, it } from 'vitest';

import {
  evaluateRoleplayCandidateBehavior,
  roleplayCandidateBehaviorThresholds,
} from './roleplay-candidate-behavior';
import { projectPlayerTurnVisibility } from './player-turn-visibility';

describe('evaluateRoleplayCandidateBehavior', () => {
  it('passes a Retry candidate only when it uses a materially different response shape and new development', () => {
    const evaluation = evaluateRoleplayCandidateBehavior({
      criterion: 'retry_strategy_difference',
      mode: 'retry_regenerate',
      playerTurn: 'I place the sealed folder between us and wait.',
      referenceResponse: '"I promise I am here for you." She offers a quiet smile. "What do you want to do?"',
      candidateResponse: '*She rotates the sealed folder and points to the unsigned page.* "Choose which clause we challenge first."',
      requiredFacts: ['sealed folder'],
      requiredDevelopments: ['unsigned page'],
    });

    expect(evaluation.result).toBe('pass');
    expect(evaluation.signals.hasNewMessageUnit).toBe(true);
    expect(evaluation.signals.openingShapeChanged).toBe(true);
  });

  it('fails a near-copy and a six-word source anchor', () => {
    const referenceResponse = 'She steadies the folder with one hand and asks which clause should be challenged first.';
    const evaluation = evaluateRoleplayCandidateBehavior({
      criterion: 'retry_strategy_difference',
      mode: 'retry_regenerate',
      playerTurn: 'I wait for her decision.',
      referenceResponse,
      candidateResponse: `${referenceResponse} She waits.`,
    });

    expect(evaluation.result).toBe('fail');
    expect(evaluation.reasons).toContain('six_word_source_anchor_reused');
  });

  it('does not pass a paraphrased reassurance and closing-question loop', () => {
    const evaluation = evaluateRoleplayCandidateBehavior({
      criterion: 'retry_strategy_difference',
      mode: 'retry_regenerate',
      playerTurn: 'I admit that I do not know what to do next.',
      referenceResponse: '"You are not alone, and I will stay with you. What would help right now?"',
      candidateResponse: '"I am here beside you, and we can face this together. How can I support you?"',
    });

    expect(evaluation.result).toBe('review_required');
    expect(evaluation.reasons).toContain('semantic_difference_requires_curated_development');
  });

  it('fails when a replacement takes over the player action', () => {
    const evaluation = evaluateRoleplayCandidateBehavior({
      criterion: 'retry_strategy_difference',
      mode: 'retry_regenerate',
      playerTurn: 'I lift the sealed folder and slide it slowly across the table.',
      referenceResponse: 'She studies the player without touching the documents.',
      candidateResponse: '*I lift the sealed folder and slide it slowly across the table.* She nods.',
    });

    expect(evaluation.result).toBe('fail');
    expect(evaluation.reasons).toContain('player_turn_source_anchor_reused');
  });

  it('requires Continue to add a new observable unit instead of rewriting the accepted tail', () => {
    const acceptedTail = 'She turns the folder toward the player and taps the unsigned clause.';
    const rewrite = evaluateRoleplayCandidateBehavior({
      criterion: 'continue_advancement',
      mode: 'continue_assistant_tail',
      playerTurn: '',
      referenceResponse: acceptedTail,
      candidateResponse: `${acceptedTail} She pauses.`,
    });
    const extension = evaluateRoleplayCandidateBehavior({
      criterion: 'continue_advancement',
      mode: 'continue_assistant_tail',
      playerTurn: '',
      referenceResponse: acceptedTail,
      candidateResponse: '*A second page slips free from the folder.* "This signature changes our next move."',
      requiredDevelopments: ['second page slips free'],
    });

    expect(rewrite.result).toBe('fail');
    expect(extension.result).toBe('pass');
  });

  it('fails exact private leakage and routes ambiguous mirroring to review', () => {
    const exactLeak = evaluateRoleplayCandidateBehavior({
      criterion: 'private_information_leakage',
      mode: 'normal_send',
      playerTurn: 'I keep my concern private.',
      candidateResponse: 'She knows I am terrified the group will abandon me.',
      forbiddenPhrases: ['I am terrified the group will abandon me'],
    });
    const ambiguousMirror = evaluateRoleplayCandidateBehavior({
      criterion: 'private_information_leakage',
      mode: 'normal_send',
      playerTurn: 'I keep my concern private.',
      candidateResponse: 'The group might abandon her, and she seems terrified.',
      forbiddenPhrases: ['I am terrified the group will abandon me'],
    });

    expect(exactLeak.result).toBe('fail');
    expect(ambiguousMirror.result).toBe('review_required');
  });

  it('marks a response that answers a withheld parenthetical concern as a privacy failure', () => {
    const projection = projectPlayerTurnVisibility(
      'I slide the envelope across the table. (I am afraid she will leave if she reads it.) "Open it."',
      'user-private-candidate',
    );
    const evaluation = evaluateRoleplayCandidateBehavior({
      criterion: 'private_information_leakage',
      mode: 'normal_send',
      playerTurn: projection.visibleText,
      candidateResponse: 'She covers my hand, somehow knowing I am afraid she will leave if she reads it.',
      forbiddenPhrases: projection.privateSpans.map((span) => span.content),
    });

    expect(projection.visibleText).not.toContain('afraid she will leave');
    expect(evaluation.result).toBe('fail');
    expect(evaluation.reasons).toContain('forbidden_phrase_present');
  });

  it('fails response development that only restates its reference', () => {
    const evaluation = evaluateRoleplayCandidateBehavior({
      criterion: 'response_development',
      mode: 'normal_send',
      playerTurn: 'I ask her to make a concrete choice.',
      referenceResponse: 'She carefully opens the sealed folder and places the contract flat on the table.',
      candidateResponse: 'She carefully opens the sealed folder and places the contract flat on the table. Then she waits.',
    });

    expect(evaluation.result).toBe('fail');
    expect(evaluation.reasons).toContain('response_restates_reference_instead_of_developing');
  });

  it('routes low-overlap same-function Retry and Continue paraphrases to review', () => {
    const retry = evaluateRoleplayCandidateBehavior({
      criterion: 'retry_strategy_difference',
      mode: 'retry_regenerate',
      playerTurn: 'I admit that I feel lost.',
      referenceResponse: '"I am beside you. What do you need?"',
      candidateResponse: '"You are not facing this alone. Tell me how I can help."',
    });
    const continuation = evaluateRoleplayCandidateBehavior({
      criterion: 'continue_advancement',
      mode: 'continue_assistant_tail',
      playerTurn: '',
      referenceResponse: 'She opens the folder and points to the clause.',
      candidateResponse: 'She unfolds the packet and indicates the provision.',
    });

    expect(retry.result).toBe('review_required');
    expect(continuation.result).toBe('review_required');
    expect(retry.reasons).toContain('semantic_difference_requires_curated_development');
    expect(continuation.reasons).toContain('semantic_difference_requires_curated_development');
  });

  it('passes concise action-only and dialogue-only development when a curated fixture proves the new development', () => {
    const actionOnly = evaluateRoleplayCandidateBehavior({
      criterion: 'response_development',
      mode: 'normal_send',
      playerTurn: 'I ask her to finalize the decision.',
      candidateResponse: '*She stamps the release and slides the signed copy forward.*',
      requiredDevelopments: ['signed copy'],
    });
    const dialogueOnly = evaluateRoleplayCandidateBehavior({
      criterion: 'response_development',
      mode: 'normal_send',
      playerTurn: 'I ask whether she will act.',
      candidateResponse: '"I will testify tomorrow, and I have already called the clerk."',
      requiredDevelopments: ['called the clerk'],
    });

    expect(actionOnly.result).toBe('pass');
    expect(dialogueOnly.result).toBe('pass');
  });

  it('flags length increase without development and repeated closing function independently of word count', () => {
    const padded = evaluateRoleplayCandidateBehavior({
      criterion: 'response_development',
      mode: 'normal_send',
      playerTurn: 'I wait for a decision.',
      referenceResponse: 'She remains silent beside the sealed case.',
      candidateResponse: 'She remains silent beside the sealed case. She remains silent beside the sealed case. She remains silent beside the sealed case.',
    });
    const repeatedQuestion = evaluateRoleplayCandidateBehavior({
      criterion: 'response_development',
      mode: 'normal_send',
      playerTurn: 'I ask which route remains open.',
      referenceResponse: '"Which route will you take?"',
      candidateResponse: '"The east route closes at dusk. Which path will you choose?"',
      requiredDevelopments: ['east route closes'],
    });

    expect(padded.result).toBe('fail');
    expect(padded.warnings).toContain('length_increase_without_new_development');
    expect(repeatedQuestion.result).toBe('pass');
    expect(repeatedQuestion.warnings).toContain('repeated_closing_function');
  });

  it('classifies useful, absent, restated, repeated, stitched, adjacent, empty, and leaked thought functions', () => {
    const useful = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I ask why she hesitated.',
      candidateResponse: '*She folds the ledger shut.* (If I reveal it now, my partner will know I betrayed the council.)',
      requiredDevelopments: ['betrayed the council'],
    });
    const absent = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I wait.',
      candidateResponse: '*She sets the key on the table.* "Take it."',
    });
    const visibleRestatement = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I watch the lock.',
      candidateResponse: '*She closes the iron latch and slides the bolt into place.* (She closes the iron latch and slides the bolt into place.)',
    });
    const repeatedRealization = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I offer him the key.',
      referenceResponse: '*She studies him.* (I cannot trust him with the key.)',
      candidateResponse: '*She leaves the key untouched.* (I cannot trust him with the key.)',
    });
    const stitched = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I open the door.',
      candidateResponse: '*She steps inside.* (I fear the storm and want the crown.)',
    });
    const adjacent = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I wait.',
      candidateResponse: '*She looks away.* (I should confess.) (Perhaps he already knows.)',
    });
    const empty = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I wait.',
      candidateResponse: '*She looks away.* ( )',
    });
    const leaked = evaluateRoleplayCandidateBehavior({
      criterion: 'thought_function',
      mode: 'normal_send',
      playerTurn: 'I keep my concern private.',
      candidateResponse: '*She watches me.* (He is terrified the group will abandon him.)',
      withheldPlayerText: ['I am terrified the group will abandon me'],
    });

    expect(useful.result).toBe('pass');
    expect(absent.result).toBe('pass');
    expect(absent.reasons).toContain('internal_thought_not_required');
    expect(visibleRestatement.reasons).toContain('internal_thought_restates_visible_action');
    expect(repeatedRealization.reasons).toContain('internal_thought_repeats_prior_realization');
    expect(stitched.reasons).toContain('internal_thought_stitches_unrelated_concerns');
    expect(adjacent.reasons).toContain('internal_thoughts_are_back_to_back');
    expect(empty.reasons).toContain('empty_internal_thought_unit');
    expect(leaked.reasons).toContain('internal_thought_reuses_withheld_player_text');
  });

  it('exposes versioned calibration thresholds', () => {
    expect(roleplayCandidateBehaviorThresholds()).toEqual({
      version: 'candidate-behavior-v2',
      clearDuplicateTrigramJaccard: 0.72,
      clearDistinctTrigramJaccard: 0.35,
      hardSharedContentSpanWords: 6,
    });
  });
});
