#!/usr/bin/env node

import path from "node:path";

import {
  applyKnowledgeRecordTransaction,
  getKnowledgeRecordEngineStatus,
  prepareKnowledgeRecordTransaction,
  recoverKnowledgeRecordTransaction,
  type KnowledgeRecordEngineDependencies,
  type KnowledgeRecordMutationPhase,
} from "./knowledge-records/engine";
import type {
  CanonicalFilesystemMutationEvent,
  CanonicalFilesystemPrimitiveEvent,
} from "./knowledge-records/canonical-files";
import type { KnowledgeRecordRequestKind } from "./knowledge-records/request-contract";
import type {
  TransactionStoreMutationEvent,
} from "./knowledge-records/transaction-store";

const PREPARE_KINDS = new Set<KnowledgeRecordRequestKind>([
  "project-create",
  "project-update",
  "issue-create",
  "issue-update",
  "legacy-import",
  "correction",
  "closeout",
]);

function usage() {
  return [
    "Usage:",
    "  npm run knowledge:records -- status",
    "  npm run knowledge:records -- prepare project-create --request <request.json>",
    "  npm run knowledge:records -- prepare project-update --request <request.json>",
    "  npm run knowledge:records -- prepare issue-create --request <request.json>",
    "  npm run knowledge:records -- prepare issue-update --request <request.json>",
    "  npm run knowledge:records -- prepare legacy-import --request <request.json>",
    "  npm run knowledge:records -- prepare correction --request <request.json>",
    "  npm run knowledge:records -- prepare closeout --request <request.json>",
    "  npm run knowledge:records -- apply --transaction <transaction-id>",
    "  npm run knowledge:records -- recover --transaction <transaction-id>",
  ].join("\n");
}

function exactOption(args: readonly string[], option: string) {
  const index = args.indexOf(option);
  if (index < 0 || index === args.length - 1) {
    throw new Error(`Missing required ${option} value.\n${usage()}`);
  }
  if (args.indexOf(option, index + 1) >= 0) {
    throw new Error(`Option ${option} may be provided only once.`);
  }
  return args[index + 1];
}

function assertExactArguments(actual: readonly string[], expected: readonly string[]) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(`Unsupported command arguments.\n${usage()}`);
  }
}

function repositoryRoot() {
  const override = process.env.CHRONICLE_KNOWLEDGE_TEST_REPO_ROOT;
  if (!override) return process.cwd();
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.CHRONICLE_KNOWLEDGE_TEST_MODE !== "1"
  ) {
    throw new Error("The Knowledge record repository override is test-only.");
  }
  return path.resolve(override);
}

function testDependencies(): KnowledgeRecordEngineDependencies {
  const phase = process.env.CHRONICLE_KNOWLEDGE_TEST_CRASH_PHASE;
  const mutation = process.env.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_MUTATION;
  const canonicalFailpoint =
    process.env.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_MUTATION;
  const canonicalPrimitiveFailpoint =
    process.env.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_CANONICAL_PRIMITIVE;
  const storeFailpoint =
    process.env.CHRONICLE_KNOWLEDGE_TEST_CRASH_AFTER_STORE_MUTATION;
  if (
    !phase &&
    !mutation &&
    !canonicalFailpoint &&
    !canonicalPrimitiveFailpoint &&
    !storeFailpoint
  ) return {};
  if (
    process.env.NODE_ENV !== "test" ||
    process.env.CHRONICLE_KNOWLEDGE_TEST_MODE !== "1"
  ) {
    throw new Error("Invalid or unauthorized Knowledge record crash failpoint.");
  }

  const dependencies: {
    afterCanonicalMutation?: KnowledgeRecordEngineDependencies["afterCanonicalMutation"];
    canonicalFiles?: KnowledgeRecordEngineDependencies["canonicalFiles"];
    store?: KnowledgeRecordEngineDependencies["store"];
  } = {};

  if (phase || mutation) {
    if (
      !["apply", "rollback", "recover"].includes(String(phase)) ||
      !/^\d+$/.test(String(mutation)) ||
      Number(mutation) < 1
    ) {
      throw new Error("Invalid or unauthorized Knowledge record crash failpoint.");
    }
    const crashPhase = phase as KnowledgeRecordMutationPhase;
    const crashAfter = Number(mutation);
    dependencies.afterCanonicalMutation = (event) => {
      if (event.phase === crashPhase && event.mutationCount === crashAfter) {
        process.exit(86);
      }
    };
  }

  if (canonicalFailpoint) {
    const match = canonicalFailpoint.match(
      /^(apply|restore|cleanup):([a-z-]+):([a-z-]+):([1-9]\d*)$/,
    );
    if (!match) {
      throw new Error("Invalid or unauthorized Knowledge record canonical failpoint.");
    }
    const [, expectedPhase, expectedStage, expectedRole, occurrenceText] = match;
    let occurrence = 0;
    dependencies.canonicalFiles = {
      afterFilesystemMutation(event: CanonicalFilesystemMutationEvent) {
        if (
          event.phase === expectedPhase &&
          event.stage === expectedStage &&
          event.artifactRole === expectedRole
        ) {
          occurrence += 1;
          if (occurrence === Number(occurrenceText)) process.exit(86);
        }
      },
    };
  }

  if (canonicalPrimitiveFailpoint) {
    const match = canonicalPrimitiveFailpoint.match(
      /^(apply|restore|cleanup):(create|write|chmod|link|rename|unlink):([a-z-]+):([a-z-]+):([1-9]\d*)$/,
    );
    if (!match) {
      throw new Error("Invalid or unauthorized Knowledge record canonical primitive failpoint.");
    }
    const [
      ,
      expectedPhase,
      expectedPrimitive,
      expectedStage,
      expectedRole,
      occurrenceText,
    ] = match;
    let occurrence = 0;
    const existing = dependencies.canonicalFiles;
    dependencies.canonicalFiles = {
      ...existing,
      afterFilesystemPrimitive(event: CanonicalFilesystemPrimitiveEvent) {
        existing?.afterFilesystemPrimitive?.(event);
        if (
          event.phase === expectedPhase &&
          event.primitive === expectedPrimitive &&
          event.stage === expectedStage &&
          event.artifactRole === expectedRole
        ) {
          occurrence += 1;
          if (occurrence === Number(occurrenceText)) process.exit(86);
        }
      },
    };
  }

  if (storeFailpoint) {
    const match = storeFailpoint.match(
      /^(writer-lock|transaction-prepare|transaction-control|certification-lease|journal):([a-z-]+):([1-9]\d*)$/,
    );
    if (!match) {
      throw new Error("Invalid or unauthorized Knowledge record store failpoint.");
    }
    const [, expectedScope, expectedKind, occurrenceText] = match;
    let occurrence = 0;
    dependencies.store = {
      afterStoreMutation(event: TransactionStoreMutationEvent) {
        if (event.scope === expectedScope && event.kind === expectedKind) {
          occurrence += 1;
          if (occurrence === Number(occurrenceText)) process.exit(86);
        }
      },
    };
  }

  return dependencies;
}

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];
  const repoRoot = repositoryRoot();
  const dependencies = testDependencies();

  if (command === "status") {
    assertExactArguments(args, ["status"]);
    const status = await getKnowledgeRecordEngineStatus({ repoRoot });
    process.stdout.write(
      `${JSON.stringify(
        {
          transactionInventoryReadable: status.transactionInventoryReadable,
          control: status.control,
          unfinishedTransactionIds: status.unfinishedTransactionIds,
          transactions: status.transactions.map((transaction) => ({
            transactionId: transaction.transactionId,
            kind: transaction.kind,
            operationCount: transaction.operationCount,
            unfinished: transaction.unfinished,
            terminalOutcome: transaction.terminalOutcome,
          })),
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  if (command === "prepare") {
    const kind = args[1] as KnowledgeRecordRequestKind | undefined;
    if (!kind || !PREPARE_KINDS.has(kind)) {
      throw new Error(`Unsupported prepare kind.\n${usage()}`);
    }
    const requestPath = exactOption(args, "--request");
    assertExactArguments(args, ["prepare", kind, "--request", requestPath]);
    const result = await prepareKnowledgeRecordTransaction({
      repoRoot,
      requestPath,
      expectedKind: kind,
      dependencies,
    });
    process.stdout.write(
      `Prepared ${result.kind} transaction ${result.transactionId} with ${result.operationCount} operation(s).\n`,
    );
    return;
  }

  if (command === "apply" || command === "recover") {
    const transactionId = exactOption(args, "--transaction");
    assertExactArguments(args, [command, "--transaction", transactionId]);
    const result =
      command === "apply"
        ? await applyKnowledgeRecordTransaction({ repoRoot, transactionId, dependencies })
        : await recoverKnowledgeRecordTransaction({ repoRoot, transactionId, dependencies });
    process.stdout.write(
      `Transaction ${result.transactionId}: ${result.outcome}${
        result.validationSha256 ? ` (${result.validationSha256})` : ""
      }.\n`,
    );
    return;
  }

  throw new Error(usage());
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
