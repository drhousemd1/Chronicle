import { recordFixtureExecution } from '@/features/validation-evidence/runner';
import { getRoleplayValidationGate } from '@/features/validation-evidence/roleplay-gates';

export type RoleplayRegressionArtifact = {
  text: string;
  metadata?: unknown;
};

export type RoleplayRegressionPositiveAssertion = {
  label: string;
  includes: string;
};

export type RoleplayRegressionNegativeAssertion = {
  label: string;
  excludes: string;
};

export type RoleplayRegressionFixture = {
  id: string;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
  commandOrFixture: string;
  manualReview: string;
  createArtifact: () => RoleplayRegressionArtifact | Promise<RoleplayRegressionArtifact>;
  positiveAssertions: RoleplayRegressionPositiveAssertion[];
  negativeAssertions: RoleplayRegressionNegativeAssertion[];
};

export type RoleplayRegressionFixtureResult = {
  id: string;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
  commandOrFixture: string;
  result: 'pass' | 'fail';
  passedAssertions: string[];
  failedAssertions: string[];
  manualReview: string;
  artifactPreview: string;
  metadata: unknown;
  executionId: string;
};

export type RoleplayRegressionFixtureRunSummary = {
  total: number;
  passed: number;
  failed: number;
};

export type RunRoleplayRegressionFixturesOptions = {
  fixtures: RoleplayRegressionFixture[];
  gateIds?: string[];
  exactCommand?: string;
  recordExecution?: typeof recordFixtureExecution;
};

export type RoleplayRegressionFixtureRun = {
  results: RoleplayRegressionFixtureResult[];
  summary: RoleplayRegressionFixtureRunSummary;
};

function evaluateFixture(fixture: RoleplayRegressionFixture, artifact: RoleplayRegressionArtifact): Omit<RoleplayRegressionFixtureResult, 'executionId'> {
  const passedAssertions: string[] = [];
  const failedAssertions: string[] = [];

  for (const assertion of fixture.positiveAssertions) {
    if (artifact.text.includes(assertion.includes)) {
      passedAssertions.push(assertion.label);
    } else {
      failedAssertions.push(assertion.label);
    }
  }

  for (const assertion of fixture.negativeAssertions) {
    if (artifact.text.includes(assertion.excludes)) {
      failedAssertions.push(assertion.label);
    } else {
      passedAssertions.push(assertion.label);
    }
  }

  return {
    id: fixture.id,
    issueNumber: fixture.issueNumber,
    issueTitle: fixture.issueTitle,
    validationPhase: fixture.validationPhase,
    commandOrFixture: fixture.commandOrFixture,
    result: failedAssertions.length > 0 ? 'fail' : 'pass',
    passedAssertions,
    failedAssertions,
    manualReview: fixture.manualReview,
    artifactPreview: artifact.text,
    metadata: artifact.metadata ?? null,
  };
}

export async function runRoleplayRegressionFixtures({
  fixtures,
  gateIds,
  exactCommand,
  recordExecution = recordFixtureExecution,
}: RunRoleplayRegressionFixturesOptions): Promise<RoleplayRegressionFixtureRun> {
  const results: RoleplayRegressionFixtureResult[] = [];
  const selectedFixtures = gateIds?.length
    ? fixtures.filter((fixture) => gateIds.includes(fixture.id))
    : fixtures;

  if (gateIds?.some((gateId) => !selectedFixtures.some((fixture) => fixture.id === gateId))) {
    throw new Error('Requested fixture gate is not part of this validation batch.');
  }

  for (const fixture of selectedFixtures) {
    const gate = getRoleplayValidationGate(fixture.id);
    if (!gate || gate.evidenceKind !== 'fixture' || gate.runner.kind !== 'fixture') {
      throw new Error(`Fixture has no predefined validation gate: ${fixture.id}`);
    }
    if (
      gate.issueNumber !== fixture.issueNumber
      || gate.issueTitle !== fixture.issueTitle
      || gate.validationPhase !== fixture.validationPhase
      || gate.runner.fixtureId !== fixture.id
    ) {
      throw new Error(`Fixture metadata does not match its predefined gate: ${fixture.id}`);
    }
    const startedAt = Date.now();
    let result: Omit<RoleplayRegressionFixtureResult, 'executionId'>;
    try {
      result = evaluateFixture(fixture, await fixture.createArtifact());
    } catch (error) {
      const failureCause = error instanceof Error ? error.message : String(error);
      await recordExecution({
        gateId: fixture.id,
        result: 'error',
        failureCause,
        report: {
          fixtureId: fixture.id,
          result: 'error',
          failureCause,
        },
        exactCommand: exactCommand ?? fixture.commandOrFixture,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
    const execution = await recordExecution({
      gateId: fixture.id,
      result: result.result,
      failureCause: result.failedAssertions.join('; '),
      report: result,
      exactCommand: exactCommand ?? fixture.commandOrFixture,
      durationMs: Date.now() - startedAt,
    });
    results.push({ ...result, executionId: execution.executionId });
  }

  return {
    results,
    summary: {
      total: results.length,
      passed: results.filter((result) => result.result === 'pass').length,
      failed: results.filter((result) => result.result === 'fail').length,
    },
  };
}
