import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, cp, mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import {
  verifyGraphifyToolchain,
  verifyGraphifyPyvenvConfig,
  verifyInstalledGraphifyBytes,
  verifyInstalledDistributionBytes,
  verifyNoUnexpectedGraphifyEnvironmentEntries,
} from "../../../scripts/chronicle-repository-graph/verify-toolchain";
import { setupGraphifyEnvironment } from "../../../scripts/chronicle-repository-graph/setup-toolchain";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
// The private Python installation is optional on a fresh application checkout.
// If present, its integrity checks must run and expose partial or damaged installs.
const hasLocalGraphifyEnvironment = existsSync(path.join(repositoryRoot, "tools/graphify/.venv"));

async function copyFixture() {
  const target = await mkdtemp(path.join(os.tmpdir(), "chronicle-graphify-toolchain-"));
  await mkdir(path.join(target, "vendor/graphify"), { recursive: true });
  await mkdir(path.join(target, "tools"), { recursive: true });
  await cp(path.join(repositoryRoot, "vendor/graphify/0.9.52"), path.join(target, "vendor/graphify/0.9.52"), { recursive: true });
  await cp(path.join(repositoryRoot, "tools/graphify"), path.join(target, "tools/graphify"), {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.venv${path.sep}`) && !source.endsWith(`${path.sep}.venv`),
  });
  await writeFile(path.join(target, "AGENTS.md"), "Chronicle project instructions.\n");
  return target;
}

async function copyInstalledDistributionFixture(
  distInfo: string,
  packagePaths: readonly string[],
  binPaths: readonly string[] = [],
) {
  const target = await mkdtemp(path.join(os.tmpdir(), "chronicle-installed-graphify-"));
  const sourceEnvironment = path.join(repositoryRoot, "tools/graphify/.venv");
  const targetEnvironment = path.join(target, "tools/graphify/.venv");
  const sitePackages = "lib/python3.12/site-packages";
  await mkdir(path.join(targetEnvironment, sitePackages), { recursive: true });
  await mkdir(path.join(targetEnvironment, "bin"), { recursive: true });
  for (const packagePath of packagePaths) {
    await cp(path.join(sourceEnvironment, sitePackages, packagePath), path.join(targetEnvironment, sitePackages, packagePath), { recursive: true });
  }
  for (const binPath of binPaths) {
    await cp(path.join(sourceEnvironment, "bin", binPath), path.join(targetEnvironment, "bin", binPath));
  }
  await cp(path.join(sourceEnvironment, sitePackages, distInfo), path.join(targetEnvironment, sitePackages, distInfo), { recursive: true });
  return target;
}

describe("Chronicle Graphify toolchain custody", () => {
  it("verifies the pinned inactive upstream source and lockfile", async () => {
    await expect(verifyGraphifyToolchain(repositoryRoot)).resolves.toMatchObject({
      version: "0.9.52",
      pinnedFiles: 12,
      environmentChecked: false,
    });
  });

  it("rejects changed upstream bytes", async () => {
    const fixture = await copyFixture();
    const sourcePath = path.join(fixture, "vendor/graphify/0.9.52/codex-skill-source/skill-codex.md");
    await writeFile(sourcePath, `${await readFile(sourcePath, "utf8")}\nchanged\n`);
    await expect(verifyGraphifyToolchain(fixture)).rejects.toThrow("Pinned upstream hash changed");
  });

  it("rejects changes to the checksum manifest and dependency lock", async () => {
    const checksumFixture = await copyFixture();
    await writeFile(path.join(checksumFixture, "vendor/graphify/0.9.52/SHA256SUMS"), "changed\n");
    await expect(verifyGraphifyToolchain(checksumFixture)).rejects.toThrow("checksum manifest identity changed");

    const lockFixture = await copyFixture();
    const lockPath = path.join(lockFixture, "tools/graphify/uv.lock");
    await writeFile(lockPath, `${await readFile(lockPath, "utf8")}\nchanged\n`);
    await expect(verifyGraphifyToolchain(lockFixture)).rejects.toThrow("lockfile identity changed");
  });

  it("rejects skill activation in a discovered agent path", async () => {
    const fixture = await copyFixture();
    const skillPath = path.join(fixture, ".agents/skills/graphify/SKILL.md");
    await mkdir(path.dirname(skillPath), { recursive: true });
    await writeFile(skillPath, "# Graphify\n");
    await expect(verifyGraphifyToolchain(fixture)).rejects.toThrow("active instruction or hook path");
  });

  it("allows project instructions to explain the approved Graphify map", async () => {
    const fixture = await copyFixture();
    await writeFile(path.join(fixture, "AGENTS.md"),
      "Read relevant Graphify relationships with npm run graph:query. Do not enable a global Graphify skill or hooks.\n");
    await expect(verifyGraphifyToolchain(fixture)).resolves.toMatchObject({ version: "0.9.52" });
  });

  it("still rejects a Graphify executable hook", async () => {
    const fixture = await copyFixture();
    const hook = path.join(fixture, ".githooks/pre-commit");
    await mkdir(path.dirname(hook), { recursive: true });
    await writeFile(hook, "#!/bin/sh\ngraphify update\n");
    await expect(verifyGraphifyToolchain(fixture)).rejects.toThrow("active instruction or hook path");
  });

  it("rejects an active skill filename inside inert vendor custody", async () => {
    const fixture = await copyFixture();
    await writeFile(path.join(fixture, "vendor/graphify/0.9.52/SKILL.md"), "# Graphify\n");
    await expect(verifyGraphifyToolchain(fixture)).rejects.toThrow("active skill filename");
  });

  it.skipIf(!hasLocalGraphifyEnvironment)("verifies every installed Graphify wheel file and rejects tampering", async () => {
    const fixture = await copyInstalledDistributionFixture("graphifyy-0.9.52.dist-info", ["graphify"], ["graphify", "graphify-mcp"]);
    const environmentRoot = path.join(fixture, "tools/graphify/.venv");
    const identity = {
      name: "graphifyy",
      version: "0.9.52",
      distInfo: "graphifyy-0.9.52.dist-info",
      recordSha256: "421c89eb0bdb8ff0f8c1d8064f127ddc9f411a340bb1bfc74d54d4b8e3de87a2",
      recordEntries: 231,
    } as const;
    await expect(verifyInstalledDistributionBytes(environmentRoot, identity)).resolves.toMatchObject({ verifiedFiles: 230 });
    const sourcePath = path.join(fixture, "tools/graphify/.venv/lib/python3.12/site-packages/graphify/__init__.py");
    await writeFile(sourcePath, `${await readFile(sourcePath, "utf8")}\nchanged\n`);
    await expect(verifyInstalledDistributionBytes(environmentRoot, identity)).rejects.toThrow("Installed graphifyy bytes changed");
  });

  it.skipIf(!hasLocalGraphifyEnvironment)("verifies a non-Graphify dependency record and rejects altered dependency bytes", async () => {
    const fixture = await copyInstalledDistributionFixture("networkx-3.6.1.dist-info", ["networkx"]);
    const environmentRoot = path.join(fixture, "tools/graphify/.venv");
    const identity = {
      name: "networkx",
      version: "3.6.1",
      distInfo: "networkx-3.6.1.dist-info",
      recordSha256: "f6833bb525b720a7809dd6280817601af3dbd78efef02d9e55d4b887ec1f52da",
      recordEntries: 603,
    } as const;
    await expect(verifyInstalledDistributionBytes(environmentRoot, identity)).resolves.toMatchObject({ verifiedFiles: 602 });
    const sourcePath = path.join(fixture, "tools/graphify/.venv/lib/python3.12/site-packages/networkx/__init__.py");
    await writeFile(sourcePath, `${await readFile(sourcePath, "utf8")}\nchanged\n`);
    await expect(verifyInstalledDistributionBytes(environmentRoot, identity)).rejects.toThrow("Installed networkx bytes changed");
  });

  it.skipIf(!hasLocalGraphifyEnvironment)("verifies the complete local dependency closure", async () => {
    await expect(verifyInstalledGraphifyBytes(repositoryRoot)).resolves.toMatchObject({ distributions: 31 });
  });

  it.each([
    "lib/python3.12/site-packages/extra.pth",
    "lib/python3.12/site-packages/sitecustomize.py",
    "lib/python3.12/site-packages/example/__pycache__/module.cpython-312.pyc",
  ])("rejects unowned executable Python environment file %s", async (relativePath) => {
    const environmentRoot = await mkdtemp(path.join(os.tmpdir(), "chronicle-graphify-extra-"));
    const target = path.join(environmentRoot, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "unverified\n");
    await expect(verifyNoUnexpectedGraphifyEnvironmentEntries(environmentRoot, [])).rejects.toThrow("unverified files");
  });

  it("accepts a host-specific Python home when the pinned runtime semantics are unchanged", () => {
    const source = [
      "home = /another/host/python",
      "implementation = CPython",
      "uv = 0.12.7",
      "version_info = 3.12.14",
      "include-system-site-packages = false",
      "prompt = chronicle-graphify-toolchain",
    ].join("\n");
    expect(verifyGraphifyPyvenvConfig(source)).toEqual({ python: "3.12.14", uv: "0.12.7" });
  });

  it("creates the replacement environment at its final path so installed launchers remain usable", async () => {
    const toolRoot = await mkdtemp(path.join(os.tmpdir(), "chronicle-graphify-setup-success-"));
    const oldEnvironment = path.join(toolRoot, ".venv");
    await mkdir(oldEnvironment, { recursive: true });
    await writeFile(path.join(oldEnvironment, "old-marker"), "old environment\n");

    await setupGraphifyEnvironment({
      toolRoot,
      transactionId: "success",
      syncEnvironment: async (environmentRoot) => {
        const launcher = path.join(environmentRoot, "bin/graphify");
        await mkdir(path.dirname(launcher), { recursive: true });
        await writeFile(launcher, `#!/bin/sh\nprintf 'graphify 0.9.52 from %s\\n' ${JSON.stringify(environmentRoot)}\n`);
        await chmod(launcher, 0o755);
      },
      verifyEnvironment: async () => undefined,
      verifyFinal: async () => {
        const launcher = path.join(toolRoot, ".venv/bin/graphify");
        expect(execFileSync(launcher, ["--version"], { encoding: "utf8" }).trim()).toBe(
          `graphify 0.9.52 from ${path.join(toolRoot, ".venv")}`,
        );
        expect(await readFile(launcher, "utf8")).not.toContain(".venv.setup-");
        return { toolchainIdentitySha256: "verified" };
      },
    });

    expect(await readdir(toolRoot)).toEqual([".venv"]);
  });

  it("restores the exact previous environment when final verification fails", async () => {
    const toolRoot = await mkdtemp(path.join(os.tmpdir(), "chronicle-graphify-setup-rollback-"));
    const oldEnvironment = path.join(toolRoot, ".venv");
    const oldBytes = Buffer.from([0, 1, 2, 3, 255]);
    await mkdir(oldEnvironment, { recursive: true });
    await writeFile(path.join(oldEnvironment, "old-marker"), oldBytes);

    await expect(
      setupGraphifyEnvironment({
        toolRoot,
        transactionId: "rollback",
        syncEnvironment: async (environmentRoot) => {
          await mkdir(path.join(environmentRoot, "bin"), { recursive: true });
          await writeFile(path.join(environmentRoot, "bin/graphify"), "new environment\n");
        },
        verifyEnvironment: async () => undefined,
        verifyFinal: async () => {
          throw new Error("injected post-creation verification failure");
        },
      }),
    ).rejects.toThrow("injected post-creation verification failure");

    expect(await readFile(path.join(toolRoot, ".venv/old-marker"))).toEqual(oldBytes);
    expect(await readdir(toolRoot)).toEqual([".venv"]);
  });

  it("imports the Vite graph middleware without executing a graph command", async () => {
    const probeRoot = await mkdtemp(path.join(os.tmpdir(), "chronicle-graph-import-probe-"));
    const probePath = path.join(probeRoot, "probe.ts");
    const middlewareUrl = pathToFileURL(path.join(repositoryRoot, "scripts/chronicle-repository-graph/dev-middleware.ts")).href;
    await writeFile(probePath, `await import(${JSON.stringify(middlewareUrl)}); console.log("import-ok");\n`);
    const output = execFileSync(path.join(repositoryRoot, "node_modules/.bin/vite-node"), ["--script", probePath], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    expect(output.trim()).toBe("import-ok");
  });
});
