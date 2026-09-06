import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, lstat, mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { createServer } from "node:net";
import path from "node:path";

import { verifyGraphifyToolchain } from "./verify-toolchain";

async function walkFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    const state = await lstat(absolute);
    if (state.isSymbolicLink()) throw new Error(`Graphify created a forbidden symlink: ${path.relative(root, absolute)}.`);
    if (state.isDirectory()) files.push(...(await walkFiles(absolute)));
    else if (state.isFile()) files.push(absolute);
    else throw new Error(`Graphify created a forbidden special file: ${path.relative(root, absolute)}.`);
  }
  return files.sort();
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function denyOutsideAllowed(operation: "file-read*" | "file-write*", sensitiveRoot: string, allowedRoots: readonly string[]) {
  const exceptions = allowedRoots
    .filter((allowedRoot) => allowedRoot === sensitiveRoot || allowedRoot.startsWith(`${sensitiveRoot}${path.sep}`))
    .map((allowedRoot) => `(require-not (subpath ${JSON.stringify(allowedRoot)}))`)
    .join(" ");
  return `(deny ${operation} (require-all (subpath ${JSON.stringify(sensitiveRoot)})${exceptions ? ` ${exceptions}` : ""}))`;
}

function summarizeProcessFailure(stdout: Buffer, stderr: Buffer, privateWorkRoot: string) {
  const source = `${stdout.toString("utf8")}\n${stderr.toString("utf8")}`;
  const lines = source
    .split("\n")
    .map((line) => line
      .split(privateWorkRoot).join("<private-work>")
      .split(homedir()).join("<home>")
      .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, "<redacted-token>")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "<redacted-email>")
      .slice(0, 500))
    .filter((line) => line.trim().length > 0);
  const selected = lines.length <= 50 ? lines : [...lines.slice(0, 25), "<middle omitted>", ...lines.slice(-25)];
  return selected.join("\n").slice(0, 8000);
}

function runGraphify(
  sandboxProfilePath: string,
  cliPath: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv,
  privateWorkRoot: string,
  workingDirectory: string,
  label: "extract" | "cluster",
) {
  const result = spawnSync(
    "/bin/sh",
    [
      "-c",
      // macOS expresses `ulimit -f` in 512-byte blocks. The child may need a
      // graph as large as 100 MiB, while stdout/stderr are separately bounded
      // by Node's 20 MiB maxBuffer below.
      'ulimit -f 204800; exec /usr/bin/sandbox-exec "$@"',
      `chronicle-graphify-${label}`,
      "-f",
      sandboxProfilePath,
      cliPath,
      ...args,
    ],
    {
      cwd: workingDirectory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: null,
      maxBuffer: 20 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
    },
  );
  const stdout = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.alloc(0);
  const stderr = Buffer.isBuffer(result.stderr) ? result.stderr : Buffer.alloc(0);
  const receipt = Object.freeze({
    stdoutSha256: sha256(stdout),
    stdoutBytes: stdout.byteLength,
    stderrSha256: sha256(stderr),
    stderrBytes: stderr.byteLength,
  });
  if (result.error) {
    const code = "code" in result.error ? String(result.error.code) : "spawn-error";
    throw new Error(`Graphify process failed before completion (${code}); raw process output was discarded.`);
  }
  if (result.status !== 0) {
    const summary = summarizeProcessFailure(stdout, stderr, privateWorkRoot);
    throw new Error(
      `Graphify command failed with exit status ${result.status ?? "none"}${result.signal ? ` and signal ${result.signal}` : ""}; ` +
        `stdout ${receipt.stdoutSha256} (${receipt.stdoutBytes} bytes), stderr ${receipt.stderrSha256} (${receipt.stderrBytes} bytes); raw process output was discarded.` +
        (summary ? `\nSanitized failure summary:\n${summary}` : ""),
    );
  }
  return receipt;
}

async function verifySandboxContainment(
  sandboxProfilePath: string,
  repositoryRoot: string,
  privateWorkRoot: string,
  environment: NodeJS.ProcessEnv,
) {
  const forbiddenRead = spawnSync(
    "/usr/bin/sandbox-exec",
    ["-f", sandboxProfilePath, "/bin/cat", path.join(repositoryRoot, "package.json")],
    { cwd: privateWorkRoot, env: environment, stdio: "ignore", timeout: 5000 },
  );
  if (forbiddenRead.status === 0) throw new Error("Graphify containment preflight could read a non-staged Chronicle source file.");

  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Graphify containment preflight could not allocate a loopback probe.");
    const forbiddenNetwork = spawnSync(
      "/usr/bin/sandbox-exec",
      ["-f", sandboxProfilePath, "/usr/bin/nc", "-z", "-w", "1", "127.0.0.1", String(address.port)],
      { cwd: privateWorkRoot, env: environment, stdio: "ignore", timeout: 5000 },
    );
    if (forbiddenNetwork.status === 0) throw new Error("Graphify containment preflight could open a network connection.");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

export async function runPinnedGraphifyExtraction({
  repositoryRoot,
  stagedCorpusRoot,
  privateWorkRoot,
}: Readonly<{
  repositoryRoot: string;
  stagedCorpusRoot: string;
  privateWorkRoot: string;
}>) {
  const toolchain = await verifyGraphifyToolchain(repositoryRoot, { checkEnvironment: true });
  const canonicalStagedCorpusRoot = await realpath(stagedCorpusRoot);
  const canonicalPrivateWorkRoot = await realpath(privateWorkRoot);
  // Graphify always searches upward for a VCS boundary, even when
  // --no-gitignore is set. An empty marker keeps that metadata probe inside the
  // already-private staged copy instead of exposing checkout parent paths.
  await mkdir(path.join(canonicalStagedCorpusRoot, ".git"), { mode: 0o700 });
  // Its JavaScript resolver separately searches parent directories for a
  // workspace manifest. Pin that search to the staged copy as well; the empty
  // workspace declares no extra packages and is excluded by --code-only.
  await writeFile(path.join(canonicalStagedCorpusRoot, "pnpm-workspace.yaml"), "packages: []\n", {
    flag: "wx",
    mode: 0o600,
  });
  const cliPath = path.join(repositoryRoot, "tools/graphify/.venv/bin/graphify");
  await access(cliPath, constants.X_OK);
  const pythonRealPath = await realpath(path.join(repositoryRoot, "tools/graphify/.venv/bin/python"));
  const pythonRuntimeRoot = path.dirname(path.dirname(pythonRealPath));
  const canonicalHome = await realpath(homedir());
  const venvRoot = path.join(repositoryRoot, "tools/graphify/.venv");
  const home = path.join(canonicalPrivateWorkRoot, "home");
  const guard = path.join(canonicalPrivateWorkRoot, "network-guard");
  const extractionRoot = path.join(canonicalPrivateWorkRoot, "raw-extraction");
  const clusterRoot = path.join(canonicalPrivateWorkRoot, "structural-clusters");
  const sandboxProfilePath = path.join(canonicalPrivateWorkRoot, "sandbox.sb");
  await mkdir(home, { recursive: true, mode: 0o700 });
  await mkdir(guard, { recursive: true, mode: 0o700 });
  await mkdir(extractionRoot, { recursive: true, mode: 0o700 });
  await mkdir(path.join(clusterRoot, "graphify-out"), { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(guard, "sitecustomize.py"),
    [
      "import socket",
      "def _chronicle_network_blocked(*args, **kwargs):",
      "    raise RuntimeError('Chronicle Graphify extraction forbids network access')",
      "socket.create_connection = _chronicle_network_blocked",
      "_OriginalSocket = socket.socket",
      "class _ChronicleDeniedSocket(_OriginalSocket):",
      "    def connect(self, *args, **kwargs):",
      "        return _chronicle_network_blocked(*args, **kwargs)",
      "    def connect_ex(self, *args, **kwargs):",
      "        return _chronicle_network_blocked(*args, **kwargs)",
      "socket.socket = _ChronicleDeniedSocket",
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  const environment: NodeJS.ProcessEnv = {
    HOME: home,
    PATH: "/usr/bin:/bin",
    TMPDIR: path.join(privateWorkRoot, "tmp"),
    GRAPHIFY_QUERY_LOG_DISABLE: "1",
    PYTHONNOUSERSITE: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONPATH: guard,
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    NO_PROXY: "*",
    no_proxy: "*",
    PYTHONHASHSEED: "0",
  };
  await mkdir(environment.TMPDIR!, { recursive: true, mode: 0o700 });
  await writeFile(
    sandboxProfilePath,
    [
      "(version 1)",
      "(allow default)",
      "(deny network*)",
      denyOutsideAllowed("file-read*", canonicalHome, [venvRoot, pythonRuntimeRoot, canonicalStagedCorpusRoot, canonicalPrivateWorkRoot]),
      denyOutsideAllowed("file-read*", "/private/tmp", [canonicalStagedCorpusRoot, canonicalPrivateWorkRoot]),
      denyOutsideAllowed("file-read*", "/private/var/folders", [canonicalStagedCorpusRoot, canonicalPrivateWorkRoot]),
      '(deny file-read* (subpath "/Volumes"))',
      '(deny file-read* (subpath "/Network"))',
      denyOutsideAllowed("file-write*", canonicalHome, [canonicalPrivateWorkRoot]),
      denyOutsideAllowed("file-write*", "/private/tmp", [canonicalPrivateWorkRoot]),
      denyOutsideAllowed("file-write*", "/private/var/folders", [canonicalPrivateWorkRoot]),
      '(deny file-write* (subpath "/Volumes"))',
      '(deny file-write* (subpath "/Network"))',
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  await verifySandboxContainment(sandboxProfilePath, repositoryRoot, canonicalPrivateWorkRoot, environment);
  const extractionReceipt = runGraphify(
    sandboxProfilePath,
    cliPath,
    [
      "extract",
      canonicalStagedCorpusRoot,
      "--code-only",
      "--no-gitignore",
      "--no-cluster",
      "--max-workers",
      "1",
      "--out",
      extractionRoot,
    ],
    environment,
    canonicalPrivateWorkRoot,
    canonicalStagedCorpusRoot,
    "extract",
  );
  const extractionPath = path.join(extractionRoot, "graphify-out/graph.json");
  const clusterPath = path.join(clusterRoot, "graphify-out/graph.json");
  const extractionState = await stat(extractionPath);
  if (!extractionState.isFile() || extractionState.size > 100 * 1024 * 1024) {
    throw new Error("Graphify extraction output is missing or exceeds the 100 MB private normalization limit.");
  }
  await copyFile(extractionPath, clusterPath);
  const clusterReceipt = runGraphify(
    sandboxProfilePath,
    cliPath,
    [
      "cluster-only",
      path.dirname(clusterPath),
      "--no-viz",
      "--no-label",
      "--graph",
      clusterPath,
    ],
    environment,
    canonicalPrivateWorkRoot,
    canonicalStagedCorpusRoot,
    "cluster",
  );
  const files = await walkFiles(canonicalPrivateWorkRoot);
  const allowedFiles = new Set([
    "network-guard/sitecustomize.py",
    "sandbox.sb",
    "raw-extraction/graphify-out/.graphify_build.json",
    "raw-extraction/graphify-out/.graphify_root",
    "raw-extraction/graphify-out/cache/stat-index.json",
    "raw-extraction/graphify-out/graph.json",
    "raw-extraction/graphify-out/manifest.json",
    "structural-clusters/graphify-out/.graphify_analysis.json",
    "structural-clusters/graphify-out/.graphify_root",
    "structural-clusters/graphify-out/GRAPH_REPORT.md",
    "structural-clusters/graphify-out/graph.json",
  ]);
  let totalPrivateBytes = 0;
  for (const file of files) {
    const relative = path.relative(canonicalPrivateWorkRoot, file).split(path.sep).join("/");
    if (/(?:^|\/)(?:memory|reflections)(?:\/|$)|graphify-queries\.log$|global-graph\.json$/i.test(relative)) {
      throw new Error(`Graphify created forbidden persistent state: ${relative}.`);
    }
    const isPinnedAstCache = /^raw-extraction\/graphify-out\/cache\/ast\/v0\.9\.52-s2\/[a-f0-9]{64}\.json$/.test(relative);
    if (!allowedFiles.has(relative) && !isPinnedAstCache) {
      throw new Error(`Graphify created an unexpected private output: ${relative}.`);
    }
    const state = await stat(file);
    totalPrivateBytes += state.size;
    if (state.size > 100 * 1024 * 1024) throw new Error(`Graphify private output exceeds the 100 MB per-file limit: ${relative}.`);
  }
  if (totalPrivateBytes > 250 * 1024 * 1024) throw new Error("Graphify private outputs exceed the 250 MB aggregate limit.");
  const clusterState = await stat(clusterPath);
  if (!clusterState.isFile() || clusterState.size > 100 * 1024 * 1024) {
    throw new Error("Graphify cluster output is missing or exceeds the 100 MB private normalization limit.");
  }
  return Object.freeze({
    extraction: JSON.parse(await readFile(extractionPath, "utf8")) as unknown,
    clustered: JSON.parse(await readFile(clusterPath, "utf8")) as unknown,
    toolchainIdentitySha256: toolchain.toolchainIdentitySha256,
    receipts: Object.freeze({ extraction: extractionReceipt, cluster: clusterReceipt }),
  });
}
