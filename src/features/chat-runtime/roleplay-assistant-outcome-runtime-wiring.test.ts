import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
const llmSource = readFileSync('src/services/llm.ts', 'utf8');
const recentHistorySource = readFileSync(
  'src/features/chat-runtime/roleplay-recent-history.ts',
  'utf8',
);

describe('assistant outcome runtime wiring', () => {
  it('builds records from durable runtime artifacts and shared authority evidence', () => {
    expect(source).toContain('const buildCurrentAssistantOutcomeRecords = useCallback((');
    expect(source).toContain('characterSnapshots: characterStateSnapshotsRef.current.filter');
    expect(source).toContain('sideCharacterSnapshots: sideCharacterSnapshotsRef.current.filter');
    expect(source).toContain('memories: memories.filter');
    expect(source).toContain('goalStepDerivations: goalStepDerivations.filter');
    expect(source).toContain('userStateAuthorityDecisions: authorityDecisions');
    expect(source).toContain('supportReviewEnvelopes: getCurrentSupportReviewEnvelopes()');
  });

  it('routes the same outcome contract through Normal Send, Retry, and Continue', () => {
    expect(source.match(/assistantOutcomeRecords: buildCurrentAssistantOutcomeRecords\(/g) ?? [])
      .toHaveLength(3);
    expect(source.match(/userStateAuthorityDecisions: currentAuthorityDecisions/g) ?? [])
      .toHaveLength(3);
    expect(llmSource).toContain('assistantOutcomeRecords: options.assistantOutcomeRecords');
    expect(llmSource).toContain('assistantOutcomeRecords: input.assistantOutcomeRecords');
  });

  it('keeps exact latest assistant continuity while omitting untrusted older prose', () => {
    expect(recentHistorySource).toContain("reason: 'latest_accepted_assistant_continuity'");
    expect(recentHistorySource).toContain("? 'older_assistant_without_safe_persisted_outcome_omitted'");
    expect(recentHistorySource).toContain(": 'older_assistant_without_outcome_record_omitted'");
    expect(recentHistorySource).not.toContain("reason: 'accepted_assistant_history'");
  });
});
