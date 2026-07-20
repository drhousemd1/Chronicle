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

export type RoleplayRegressionArtifactAssertion = {
  id: string;
  label: string;
  evaluate: (artifact: RoleplayRegressionArtifact) => boolean;
  failureMessage?: string;
};

export type RoleplayRegressionAssertionResult = {
  id: string;
  label: string;
  passed: boolean;
  failureMessage?: string;
};

export type RoleplayRegressionFixture = {
  id: string;
  issueNumber: number;
  issueTitle: string;
  validationPhase: string;
  commandOrFixture: string;
  manualReview: string;
  timeoutMs?: number;
  createArtifact: () => RoleplayRegressionArtifact | Promise<RoleplayRegressionArtifact>;
  positiveAssertions: RoleplayRegressionPositiveAssertion[];
  negativeAssertions: RoleplayRegressionNegativeAssertion[];
  artifactAssertions?: RoleplayRegressionArtifactAssertion[];
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
  assertionInventory: string[];
  assertionResults: RoleplayRegressionAssertionResult[];
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

const DEFAULT_FIXTURE_TIMEOUT_MS = 10_000;
const MAX_FIXTURE_TIMEOUT_MS = 120_000;

function assertionId(prefix: string, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}:${slug || 'assertion'}`;
}

function validateArtifact(value: unknown): asserts value is RoleplayRegressionArtifact {
  if (!value || typeof value !== 'object' || typeof (value as { text?: unknown }).text !== 'string') {
    throw new Error('Fixture returned a malformed artifact; expected an object with a string text field.');
  }
}

async function createArtifactWithTimeout(fixture: RoleplayRegressionFixture): Promise<RoleplayRegressionArtifact> {
  const timeoutMs = fixture.timeoutMs ?? DEFAULT_FIXTURE_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_FIXTURE_TIMEOUT_MS) {
    throw new Error(`Fixture timeout must be between 1 and ${MAX_FIXTURE_TIMEOUT_MS} milliseconds.`);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const artifact = await Promise.race([
      Promise.resolve().then(() => fixture.createArtifact()),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Fixture timed out after ${timeoutMs} milliseconds.`)), timeoutMs);
      }),
    ]);
    validateArtifact(artifact);
    return artifact;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function evaluateFixture(fixture: RoleplayRegressionFixture, artifact: RoleplayRegressionArtifact): Omit<RoleplayRegressionFixtureResult, 'executionId'> {
  const passedAssertions: string[] = [];
  const failedAssertions: string[] = [];
  const assertionResults: RoleplayRegressionAssertionResult[] = [];

  const record = (result: RoleplayRegressionAssertionResult) => {
    assertionResults.push(result);
    if (result.passed) passedAssertions.push(result.label);
    else failedAssertions.push(result.label);
  };

  for (const assertion of fixture.positiveAssertions) {
    const passed = artifact.text.includes(assertion.includes);
    record({
      id: assertionId('includes', assertion.label),
      label: assertion.label,
      passed,
      failureMessage: passed ? undefined : `Artifact did not include required text: ${assertion.includes}`,
    });
  }

  for (const assertion of fixture.negativeAssertions) {
    const passed = !artifact.text.includes(assertion.excludes);
    record({
      id: assertionId('excludes', assertion.label),
      label: assertion.label,
      passed,
      failureMessage: passed ? undefined : `Artifact included forbidden text: ${assertion.excludes}`,
    });
  }

  for (const assertion of fixture.artifactAssertions ?? []) {
    const passed = assertion.evaluate(artifact);
    record({
      id: assertion.id,
      label: assertion.label,
      passed,
      failureMessage: passed ? undefined : assertion.failureMessage,
    });
  }

  if (assertionResults.length === 0) {
    throw new Error(`Fixture has no assertions: ${fixture.id}`);
  }
  const assertionIds = assertionResults.map((assertion) => assertion.id);
  if (new Set(assertionIds).size !== assertionIds.length) {
    throw new Error(`Fixture contains duplicate assertion identities: ${fixture.id}`);
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
    assertionInventory: assertionIds,
    assertionResults,
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
      result = evaluateFixture(fixture, await createArtifactWithTimeout(fixture));
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
