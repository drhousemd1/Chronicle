import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROLEPLAY_PIPELINE_LEDGER_DEV_PATH, type ValidationEvidenceLedgerSnapshot } from '@/features/validation-evidence/ledger';
import { getRoleplayValidationGate } from '@/features/validation-evidence/roleplay-gates';
import ValidationEvidenceLedgerPage from './validation-evidence-ledger';

describe('ValidationEvidenceLedgerPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders derived gate status from the local development ledger endpoint', async () => {
    const definition = getRoleplayValidationGate('issue-01-contract-unit-tests');
    if (!definition) throw new Error('Missing test gate.');
    const snapshot: ValidationEvidenceLedgerSnapshot = {
      schemaVersion: 1,
      generatedAt: '2026-07-10T12:00:00.000Z',
      activeScopeId: 'roleplay-restart-v1',
      sourceRevision: null,
      sourceState: 'dirty',
      summary: {
        activeGates: 1,
        passing: 0,
        failing: 0,
        errors: 0,
        notRun: 1,
        expectedRedDemonstrated: 0,
        manualPending: 0,
        manualApproved: 0,
        manualRejected: 0,
        freshnessCurrent: 0,
        freshnessStale: 0,
        freshnessUnknown: 1,
        orphanedLegacyEvidence: 0,
      },
      gates: [{
        definition,
        state: 'not_run',
        stateLabel: 'Not Run',
        freshness: 'unknown',
        latestExecution: null,
        executionHistory: [],
        latestManualReview: null,
        manualReviewHistory: [],
      }],
      reconciliation: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<MemoryRouter><ValidationEvidenceLedgerPage /></MemoryRouter>);

    expect(await screen.findByText('Issue #1: First-Class Response Job Contract')).toBeInTheDocument();
    expect(screen.getByText('Validation Phase 1: Contract Unit Tests')).toBeInTheDocument();
    expect(screen.getAllByText('Not Run').length).toBeGreaterThan(0);
    expect(screen.getByText(/dirty; exact revision unavailable/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(ROLEPLAY_PIPELINE_LEDGER_DEV_PATH, { cache: 'no-store' });
  });
});
