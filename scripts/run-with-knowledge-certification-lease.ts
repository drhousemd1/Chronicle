#!/usr/bin/env node

import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  acquireKnowledgeCertificationLease,
  attachKnowledgeCertificationLeaseProtectedProcess,
  listUnfinishedKnowledgeTransactionIds,
  releaseKnowledgeCertificationLease,
} from "./knowledge-records/transaction-store";

const CERTIFICATION_LEASE_ENVIRONMENT_KEY =
  "CHRONICLE_KNOWLEDGE_CERTIFICATION_LEASE_ID";
const CHILD_SUPERVISOR = fileURLToPath(
  new URL("./knowledge-certification-child-supervisor.mjs", import.meta.url),
);

function usage() {
  return "Usage: vite-node scripts/run-with-knowledge-certification-lease.ts <label> -- <command> [arguments...]";
}

function parseArguments(args: readonly string[]) {
  const separator = args.indexOf("--");
  const commandIndex = separator === -1 ? 1 : separator + 1;
  if (
    (separator !== -1 && separator !== 1) ||
    args.length <= commandIndex ||
    args[0].length === 0 ||
    args[commandIndex].length === 0
  ) {
    throw new Error(usage());
  }
  return Object.freeze({
    label: args[0],
    command: args[commandIndex],
    commandArguments: Object.freeze(args.slice(commandIndex + 1)),
  });
}

function supervisorExit(child: ChildProcess) {
  return new Promise<Readonly<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
  }>>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode, signal) => resolve({ exitCode, signal }));
  });
}

function waitForSupervisorReady(child: ChildProcess) {
  return new Promise<number>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Knowledge certification child supervisor did not become ready."));
    }, 10_000);
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("message", onMessage);
      child.off("error", onError);
      child.off("exit", onExit);
      child.off("disconnect", onDisconnect);
    };
    const onMessage = (message: unknown) => {
      if (
        !message ||
        typeof message !== "object" ||
        !("type" in message) ||
        message.type !== "ready" ||
        !("pid" in message) ||
        !Number.isSafeInteger(message.pid) ||
        message.pid !== child.pid
      ) {
        cleanup();
        reject(new Error("Knowledge certification child supervisor sent an invalid ready message."));
        return;
      }
      cleanup();
      resolve(message.pid as number);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onExit = () => {
      cleanup();
      reject(new Error("Knowledge certification child supervisor exited before attachment."));
    };
    const onDisconnect = () => {
      cleanup();
      reject(new Error("Knowledge certification child supervisor disconnected before attachment."));
    };
    child.on("message", onMessage);
    child.once("error", onError);
    child.once("exit", onExit);
    child.once("disconnect", onDisconnect);
  });
}

function startSupervisorCommand(
  child: ChildProcess,
  command: string,
  args: readonly string[],
) {
  return new Promise<void>((resolve, reject) => {
    if (!child.connected) {
      reject(new Error("Knowledge certification child supervisor is not connected."));
      return;
    }
    child.send(
      { type: "start", command, arguments: [...args] },
      (error) => (error ? reject(error) : resolve()),
    );
  });
}

async function stopUnstartedSupervisor(child: ChildProcess) {
  if (child.connected) child.disconnect();
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
}

async function runChild(
  command: string,
  args: readonly string[],
  lease: Awaited<ReturnType<typeof acquireKnowledgeCertificationLease>>,
) {
  const supervisor = spawn(process.execPath, [CHILD_SUPERVISOR], {
    cwd: process.cwd(),
    detached: true,
    env: {
      ...process.env,
      [CERTIFICATION_LEASE_ENVIRONMENT_KEY]: lease.leaseId,
    },
    shell: false,
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  const exit = supervisorExit(supervisor);
  const forwardedSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];
  const handlers = new Map<NodeJS.Signals, () => void>();
  for (const signal of forwardedSignals) {
    const handler = () => {
      if (supervisor.exitCode === null && supervisor.signalCode === null) {
        supervisor.kill(signal);
      }
    };
    handlers.set(signal, handler);
    process.on(signal, handler);
  }

  let started = false;
  try {
    const supervisorPid = await waitForSupervisorReady(supervisor);
    await attachKnowledgeCertificationLeaseProtectedProcess({
      lease,
      protectedChildPid: supervisorPid,
      protectedProcessGroupId: supervisorPid,
      recoveryCapable: true,
    });
    await startSupervisorCommand(supervisor, command, args);
    started = true;
    return await exit;
  } finally {
    for (const [signal, handler] of handlers) process.off(signal, handler);
    if (!started) {
      await stopUnstartedSupervisor(supervisor);
      await exit.catch(() => undefined);
    }
  }
}

async function releaseLeaseAfterConcurrentReaders(
  lease: Awaited<ReturnType<typeof acquireKnowledgeCertificationLease>>,
) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      await releaseKnowledgeCertificationLease(lease, { recoveryCapable: true });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const concurrentCertificationOperation = isTransientCertificationContention(message);
      if (!concurrentCertificationOperation || attempt === 99) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}

function isTransientCertificationContention(message: string) {
  return [
    "writer lock is held by a live process",
    "writer-lock publication still belongs to a live process",
    "Interrupted writer-lock recovery still belongs to a live process",
    "Interrupted certification lease transition still belongs to a live process",
    "writes are blocked by a live scoped writer",
    "Knowledge certification lease cannot be released while its protected process is alive",
  ].some((fragment) => message.includes(fragment));
}

async function acquireLeaseAfterConcurrentReaders(label: string) {
  const contentionDeadline = Date.now() + 4_000;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      return await acquireKnowledgeCertificationLease({
        repoRoot: process.cwd(),
        command: label,
        recoveryCapable: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isTransientCertificationContention(message)) {
        throw error;
      }
      if (attempt === 199 || Date.now() >= contentionDeadline) {
        throw new Error(
          `Timed out waiting for active Knowledge record work before starting ${label}.`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw new Error("Knowledge certification lease acquisition did not finish.");
}

async function run() {
  const { label, command, commandArguments } = parseArguments(process.argv.slice(2));
  const lease = await acquireLeaseAfterConcurrentReaders(label);

  let childResult: Awaited<ReturnType<typeof runChild>> | null = null;
  let commandError: unknown = null;
  try {
    const unfinished = await listUnfinishedKnowledgeTransactionIds({
      repoRoot: process.cwd(),
    });
    if (unfinished.length > 0) {
      throw new Error(
        `Knowledge record checks are blocked because recovery is required for ${unfinished.join(", ")}.`,
      );
    }
    childResult = await runChild(command, commandArguments, lease);
  } catch (error) {
    commandError = error;
  }

  let releaseError: unknown = null;
  try {
    await releaseLeaseAfterConcurrentReaders(lease);
  } catch (error) {
    releaseError = error;
  }

  if (commandError && releaseError) {
    throw new Error(
      `Protected command failed and its certification lease could not be released: ${
        commandError instanceof Error ? commandError.message : String(commandError)
      }; ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`,
    );
  }
  if (releaseError) throw releaseError;
  if (commandError) throw commandError;
  if (!childResult) throw new Error("Protected command did not report an exit result.");

  if (childResult.signal) {
    process.kill(process.pid, childResult.signal);
    return;
  }
  process.exitCode = childResult.exitCode ?? 1;
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
