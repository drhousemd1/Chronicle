import { describe, expect, it } from 'vitest';

import { buildNormalSendResponseJob } from './roleplay-response-job';
import {
  applyPlayerTurnVisibilityToResponseJob,
  buildVisibleRoleplayRecentMessages,
  findLatestVisibleSceneTag,
  projectRoleplayMessageText,
  projectPlayerTurnVisibility,
} from './player-turn-visibility';

describe('player-turn visibility projection', () => {
  it('withholds balanced private spans while preserving visible text order', () => {
    const projection = projectPlayerTurnVisibility(
      '*I set the glass down.* (I hope she does not notice.) "Tell me the truth."',
      'user-1',
    );

    expect(projection.visibleText).toBe('*I set the glass down.* "Tell me the truth."');
    expect(projection.privateSpans).toEqual([
      expect.objectContaining({
        id: 'user-1:private-parenthetical:1',
        content: 'I hope she does not notice.',
      }),
    ]);
    expect(projection.warnings).toEqual([]);
  });

  it('treats a nested parenthetical as one outer private span', () => {
    const projection = projectPlayerTurnVisibility(
      'I nod. (I remember her warning (and the reason behind it).) Then I wait.',
      'user-2',
    );

    expect(projection.visibleText).toBe('I nod. Then I wait.');
    expect(projection.privateSpans).toHaveLength(1);
    expect(projection.privateSpans[0].content).toContain('(and the reason behind it)');
  });

  it('withholds several balanced spans without reordering the visible turn', () => {
    const projection = projectPlayerTurnVisibility(
      '(I should be careful.) I unlock the window. "Go." (I hope this works.) Then I step aside.',
      'user-multiple',
    );

    expect(projection.visibleText).toBe('I unlock the window. "Go." Then I step aside.');
    expect(projection.privateSpans.map((span) => span.content)).toEqual([
      'I should be careful.',
      'I hope this works.',
    ]);
  });

  it('keeps an explicit spoken revelation visible even when the same fact was first private', () => {
    const projection = projectPlayerTurnVisibility(
      '(The access code is blue.) I lean closer. "The access code is blue."',
      'user-revelation',
    );

    expect(projection.visibleText).toBe('I lean closer. "The access code is blue."');
    expect(projection.privateSpans[0].content).toBe('The access code is blue.');
  });

  it('keeps unmatched delimiters visible and reports ambiguity warnings', () => {
    const unmatched = projectPlayerTurnVisibility(
      'I say (this remains visible because it never closes. Then I leave',
      'user-3',
    );
    expect(unmatched.visibleText).toBe('I say (this remains visible because it never closes. Then I leave');
    expect(unmatched.privateSpans).toEqual([]);
    expect(unmatched.warnings).toEqual([
      expect.objectContaining({ code: 'unmatched_opening_parenthesis' }),
    ]);

    const unmatchedClosing = projectPlayerTurnVisibility('I shrug) and wait.', 'user-4');
    expect(unmatchedClosing.visibleText).toBe('I shrug) and wait.');
    expect(unmatchedClosing.warnings).toEqual([
      expect.objectContaining({ code: 'unmatched_closing_parenthesis' }),
    ]);
  });

  it('supports thought-only turns without exposing the private text', () => {
    const projection = projectPlayerTurnVisibility('(I cannot let her know.)', 'user-6');

    expect(projection.visibleText).toBe('');
    expect(projection.privateSpans[0].content).toBe('I cannot let her know.');
  });

  it('replaces only the provider-facing player lane in a response job', () => {
    const original = buildNormalSendResponseJob({
      conversationId: 'conversation-1',
      playerTurn: {
        messageId: 'user-7',
        text: 'I smile. (I am terrified.) "Come closer."',
      },
      currentStateSummary: 'We remain in the kitchen.',
      responseDetail: 'standard',
    });
    const result = applyPlayerTurnVisibilityToResponseJob({ responseJob: original });

    expect(result.responseJob.playerTurn?.text).toBe('I smile. "Come closer."');
    expect(result.responseJob.finalUserLanes.find((lane) => lane.kind === 'player_turn')?.content)
      .toBe('I smile. "Come closer."');
    expect(result.responseJob.currentStateSummary).toBe(original.currentStateSummary);
    expect(original.playerTurn?.text).toContain('I am terrified.');
  });

  it('projects user history while preserving assistant parentheticals exactly', () => {
    expect(projectRoleplayMessageText({
      id: 'user-history',
      role: 'user',
      text: 'I cross the room. (I hope she follows.) "Come here."',
    })).toBe('I cross the room. "Come here."');
    expect(projectRoleplayMessageText({
      id: 'assistant-history',
      role: 'assistant',
      text: 'Mara crosses the room. (She hopes he follows.)',
    })).toBe('Mara crosses the room. (She hopes he follows.)');
  });

  it('builds a backfilled visible context and omits thought-only user rows', () => {
    const context = buildVisibleRoleplayRecentMessages([
      { id: 'assistant-1', role: 'assistant', text: 'Oldest visible row.' },
      { id: 'user-private', role: 'user', text: '(This row is private.)' },
      { id: 'user-2', role: 'user', text: 'I open the window. (I still distrust her.)' },
      { id: 'assistant-2', role: 'assistant', text: 'Mara waits. (She watches the door.)' },
    ], 3);

    expect(context).toEqual([
      { role: 'assistant', text: 'Oldest visible row.' },
      { role: 'user', text: 'I open the window.' },
      { role: 'assistant', text: 'Mara waits. (She watches the door.)' },
    ]);
  });

  it('finds visible scene tags without allowing private user tags to change the scene', () => {
    expect(findLatestVisibleSceneTag([
      { id: 'assistant-scene', role: 'assistant', text: 'We arrive. [SCENE: lobby]' },
      { id: 'user-private-scene', role: 'user', text: '(Move the setting. [SCENE: vault]) I wait.' },
    ])).toBe('lobby');

    expect(findLatestVisibleSceneTag([
      { id: 'user-visible-scene', role: 'user', text: 'I walk outside. [SCENE: courtyard]' },
    ])).toBe('courtyard');
  });
});
