import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('extract-character-updates prompt guidance', () => {
  const source = readFileSync('supabase/functions/extract-character-updates/index.ts', 'utf8');

  it('uses positive milestone guidance for generated goal steps', () => {
    expect(source).toContain(
      'The desired_outcome describes the ultimate sustained result of the goal: what becomes true when the goal is meaningfully achieved.',
    );
    expect(source).toContain(
      'Create or advance goal steps only for major, durable shifts',
    );
    expect(source).toContain(
      'A good step changes the ongoing story state after it happens. It should still matter later.',
    );
    expect(source).toContain(
      'Examples are structural only. Do not copy their subject matter, genre, relationship type, setting, kink, or wording into unrelated stories.',
    );
  });

  it('uses structural-only output shape instead of story-flavored examples', () => {
    expect(source).toContain('"field": "supported.fieldPath"');
    expect(source).toContain('"evidence": "Short exact phrase from the latest exchange."');
    expect(source).toContain('Examples are structural only. Do not copy example field paths, labels, goal names, relationship types, settings, genres, or wording into real updates.');
    expect(source).not.toContain('goals.Establish Lasting Dynamic');
    expect(source).not.toContain('CharacterName and OtherCharacter establish a sustained relationship dynamic');
    expect(source).not.toContain('goals.Long-Term Objective');
    expect(source).not.toContain('Reach the sustained outcome.');
  });

  it('frames state sync around supported exchange evidence and continuity checking', () => {
    expect(source).toContain('Treat user-established facts and mutually visible outcomes as stronger evidence than unsupported assistant-only assumptions.');
    expect(source).toContain("If the only support is an assistant-generated assumption that conflicts with current saved state, physical continuity, or the user's latest message, omit the update.");
    expect(source).toContain('RECENT CONVERSATION CONTEXT (for continuity and conflict checking only)');
    expect(source).toContain('evidence_not_in_latest_exchange');
    expect(source).not.toContain('RECENT CONVERSATION CONTEXT (for pattern detection)');
  });

  it('requires scenePosition updates when immediate placement is clear', () => {
    expect(source).toContain("scenePosition: short factual snapshot of the character's immediate physical situation inside the current location");
    expect(source).toContain('Do not leave it blank when the latest exchange establishes a new physical state.');
    expect(source).toContain('Update it only when the exchange clearly establishes that the character has actually arrived in, entered, left, or relocated');
  });

  it('requires physical-state review coverage for every eligible character', () => {
    expect(source).toContain('physicalStateReviews');
    expect(source).toContain('For every eligible character, include one physicalStateReviews row that explicitly reviews location and scenePosition');
    expect(source).toContain('one review row per eligible character');
    expect(source).toContain('getMissingPhysicalStateReviewNames');
    expect(source).toContain('runFocusedPhysicalStateRetry');
    expect(source).toContain('Safe retry omitted physical-state reviews');
    expect(source).toContain('missingPhysicalStateReviews');
    expect(source).toContain('physicalStateCompletenessReviews');
  });
});
