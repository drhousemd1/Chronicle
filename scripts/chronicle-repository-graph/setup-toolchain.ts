import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { verifyGraphifyToolchain, verifyInstalledGraphifyEnvironment } from "./verify-toolchain";

const REQUIRED_UV_VERSION = "0.12.7";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

type SetupGraphifyEnvironmentOptions = {
  toolRoot: string;
  syncEnvironment: (environmentRoot: string) => Promise<void>;
  verifyEnvironment: (environmentRoot: string) => Promise<unknown>;
  verifyFinal: () => Promise<{ toolchainIdentitySha256: string }>;
  transactionId?: string;
};

export async function setupGraphifyEnvironment({
  toolRoot,
  syncEnvironment,
  verifyEnvironment,
  verifyFinal,
  transactionId = String(process.pid),
}: SetupGraphifyEnvironmentOptions) {
  const environmentRoot = path.join(toolRoot, ".venv");
  const backupEnvironment = path.join(toolRoot, `.venv.backup-${transactionId}`);
  await rm(backupEnvironment, { recursive: true, force: true });
  let previousMoved = false;
  try {
    if (existsSync(environmentRoot)) {
      await rename(environmentRoot, backupEnvironment);
      previousMoved = true;
    }
    await syncEnvironment(environmentRoot);
    await verifyEnvironment(environmentRoot);
    const receipt = await verifyFinal();
    await rm(backupEnvironment, { recursive: true, force: true });
    return receipt;
  } catch (error) {
    await rm(environmentRoot, { recursive: true, force: true });
    if (previousMoved && existsSync(backupEnvironment)) {
      await rename(backupEnvironment, environmentRoot);
    }
    throw error;
  }
}

async function main() {
  const version = spawnSync("uv", ["--version"], { encoding: "utf8" });
  if (version.error || version.status !== 0) {
    throw new Error(`Chronicle Graphify setup requires uv ${REQUIRED_UV_VERSION} on PATH.`);
  }
  if (version.stdout.trim() !== `uv ${REQUIRED_UV_VERSION}`) {
    throw new Error(`Chronicle Graphify setup requires uv ${REQUIRED_UV_VERSION}; found ${version.stdout.trim() || "an unknown version"}.`);
  }

  const toolRoot = path.join(repositoryRoot, "tools/graphify");
  const receipt = await setupGraphifyEnvironment({
    toolRoot,
    syncEnvironment: async (environmentRoot) => {
      const synced = spawnSync(
        "uv",
        ["sync", "--project", toolRoot, "--frozen", "--no-dev", "--python", "3.12"],
        {
          cwd: repositoryRoot,
          encoding: "utf8",
          stdio: "inherit",
          env: { ...process.env, UV_PROJECT_ENVIRONMENT: environmentRoot, UV_LINK_MODE: "copy" },
        },
      );
      if (synced.error) throw synced.error;
      if (synced.status !== 0) throw new Error(`Pinned Graphify environment setup failed with exit status ${synced.status ?? "unknown"}.`);
    },
    verifyEnvironment: verifyInstalledGraphifyEnvironment,
    verifyFinal: () => verifyGraphifyToolchain(repositoryRoot, { checkEnvironment: true }),
  });
  console.log(`Chronicle Graphify environment ready: ${receipt.toolchainIdentitySha256}.`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) await main();
