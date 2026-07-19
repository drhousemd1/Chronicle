import { describe, expect, it } from 'vitest';
import { listActiveRoleplayValidationGates, ROLEPLAY_VALIDATION_GATES } from './roleplay-gates';

describe('roleplay validation gate catalog', () => {
  it('uses unique stable gate identities', () => {
    const gateIds = ROLEPLAY_VALIDATION_GATES.map((gate) => gate.gateId);
    expect(new Set(gateIds).size).toBe(gateIds.length);
  });

  it('covers every roleplay issue with at least one active formal gate', () => {
    const coveredIssues = new Set(listActiveRoleplayValidationGates().map((gate) => gate.issueNumber));
    expect([...coveredIssues].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 28 }, (_, index) => index + 1),
    );
  });

  it('keeps automated commands predefined and shell-free', () => {
    for (const gate of ROLEPLAY_VALIDATION_GATES) {
      if (gate.runner.kind !== 'command') continue;
      expect(gate.runner.executable).toBe('node');
      expect(gate.runner.workingDirectory).toBe('repo-root');
      expect(gate.runner.args[0]).toMatch(/^node_modules\//);
      expect(gate.runner.args.join(' ')).not.toMatch(/[;&|`$<>]/);
    }
  });

  it('keeps manual reviews as separate manual gates', () => {
    const manualGates = ROLEPLAY_VALIDATION_GATES.filter((gate) => gate.evidenceKind === 'manual');
    expect(manualGates.length).toBeGreaterThan(0);
    for (const gate of manualGates) {
      expect(gate.runner.kind).toBe('manual');
      expect(gate.manualReviewRequired).toBe(true);
    }
  });

  it('requires live terminal database review separately from local mood-removal tests', () => {
    expect(ROLEPLAY_VALIDATION_GATES).toContainEqual(expect.objectContaining({
      gateId: 'issue-16-terminal-database-manual-review',
      issueNumber: 16,
      validationPhase: 'Validation Phase 5: Terminal Database Verification',
      evidenceKind: 'manual',
      manualReviewRequired: true,
      runner: { kind: 'manual' },
    }));
  });
});
