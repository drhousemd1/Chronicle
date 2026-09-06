import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const GRAPHIFY_VERSION = "0.9.52";
const GRAPHIFY_COMMIT = "680e3ed8edd3dc1fa1961050912941880b778207";
const WHEEL_SHA256 = "5588ea9af433a8cf74ada89dfc0b981abf596a1327a1375fdaf661905562bf44";
const SDIST_SHA256 = "3e3a5e1048bde70136a362043a774af908b0a1f4d2b66811fe1966c4ebee0cf5";
const VENDOR_ROOT = `vendor/graphify/${GRAPHIFY_VERSION}`;
const PINNED_INPUT_SHA256 = Object.freeze({
  checksumManifest: "01492b678cfe1dd87f7de827064b381668ca9e12aff1788b4e331593de1aa742",
  upstreamReceipt: "da32433c7bbf2ef6dd838e5829952068e4534a5aec8f57724b28164292954de7",
  pyproject: "4ba91ef8567d318aaefc7e4b130338ea676e9d9f398a1767db93c225ad27dcd4",
  lockfile: "bf393b6b0281a2b134c8a68c22d19731ae1f839fa2344a9c02eb7b1900672b2b",
});

export type InstalledDistributionIdentity = Readonly<{
  name: string;
  version: string;
  distInfo: string;
  recordSha256: string;
  recordEntries: number;
}>;

const EXPECTED_DISTRIBUTIONS: readonly InstalledDistributionIdentity[] = Object.freeze([
  { name: "graphifyy", version: "0.9.52", distInfo: "graphifyy-0.9.52.dist-info", recordSha256: "421c89eb0bdb8ff0f8c1d8064f127ddc9f411a340bb1bfc74d54d4b8e3de87a2", recordEntries: 231 },
  { name: "networkx", version: "3.6.1", distInfo: "networkx-3.6.1.dist-info", recordSha256: "f6833bb525b720a7809dd6280817601af3dbd78efef02d9e55d4b887ec1f52da", recordEntries: 603 },
  { name: "numpy", version: "2.5.2", distInfo: "numpy-2.5.2.dist-info", recordSha256: "ee89cf31007c4d4ab91d9193d5dd7453ac35d34fc5ef47bed651abfde89f4643", recordEntries: 927 },
  { name: "RapidFuzz", version: "3.14.5", distInfo: "rapidfuzz-3.14.5.dist-info", recordSha256: "6670f95d86f55879e0fa04243c8c19bf2b6b0436500da62f152feee984a095f8", recordEntries: 66 },
  { name: "tree-sitter", version: "0.25.2", distInfo: "tree_sitter-0.25.2.dist-info", recordSha256: "bdc74800ae3c07fd7c8ddf05d64306a642a23e60ac5a9eb78fe701debcfaf408", recordEntries: 11 },
  { name: "tree-sitter-bash", version: "0.25.1", distInfo: "tree_sitter_bash-0.25.1.dist-info", recordSha256: "3d92b48eba1d9e3d2bd79ffb3809f8ba2e46c7e1b7f81d5dd2d4138a818134d0", recordEntries: 13 },
  { name: "tree-sitter-c", version: "0.24.2", distInfo: "tree_sitter_c-0.24.2.dist-info", recordSha256: "41c704d018598e752cbeaf0b6227d01be14d496d3645ebb46dc334decd5ddf7d", recordEntries: 14 },
  { name: "tree-sitter-c-sharp", version: "0.23.5", distInfo: "tree_sitter_c_sharp-0.23.5.dist-info", recordSha256: "09660b40dca024f15e3af1791aa9397e528ac92887a3da51b14df2cd086e4b86", recordEntries: 14 },
  { name: "tree-sitter-cpp", version: "0.23.4", distInfo: "tree_sitter_cpp-0.23.4.dist-info", recordSha256: "9c19269f4310ff6fde2486cc9286082607a5b80b59d005b7fb424f18d32505d5", recordEntries: 15 },
  { name: "tree-sitter-elixir", version: "0.3.5", distInfo: "tree_sitter_elixir-0.3.5.dist-info", recordSha256: "b69cc06902de0311125bd8cc03c6073e80368e211b6ad09be25aba5f4b8fc50a", recordEntries: 16 },
  { name: "tree-sitter-fortran", version: "0.6.0", distInfo: "tree_sitter_fortran-0.6.0.dist-info", recordSha256: "907c2e3627dcf3c6be1221876bb8b1b71f3676a5f9485fc72563e308595c6035", recordEntries: 17 },
  { name: "tree-sitter-go", version: "0.25.0", distInfo: "tree_sitter_go-0.25.0.dist-info", recordSha256: "11f6aa837df0ff973f07894fb5e9663e6932a08434c8bd06b17a324b5930a267", recordEntries: 14 },
  { name: "tree-sitter-groovy", version: "0.1.2", distInfo: "tree_sitter_groovy-0.1.2.dist-info", recordSha256: "d243e24bc8f075f2ad849442263f12299991ddc3d987cfe9386b31988451743c", recordEntries: 11 },
  { name: "tree-sitter-java", version: "0.23.5", distInfo: "tree_sitter_java-0.23.5.dist-info", recordSha256: "ff83a19c3a8b44d2e09bbe98c858bad97e488f2baa70e479aa4ec0afa3f10f73", recordEntries: 14 },
  { name: "tree-sitter-javascript", version: "0.25.0", distInfo: "tree_sitter_javascript-0.25.0.dist-info", recordSha256: "2e68eac416d3003920f0bc91ed80b50c3cb3403a8985c5ca5454d952db49c14a", recordEntries: 18 },
  { name: "tree-sitter-json", version: "0.24.8", distInfo: "tree_sitter_json-0.24.8.dist-info", recordSha256: "27e7f8f17c96f6275b956aa1fa5b8df7a2b03a4d40b71a3f84095272e8eb8a95", recordEntries: 13 },
  { name: "tree-sitter-julia", version: "0.23.1", distInfo: "tree_sitter_julia-0.23.1.dist-info", recordSha256: "06135123b734b3a98edd86ff77ad445822908f33de05d5b56e1e2244744a17f9", recordEntries: 13 },
  { name: "tree-sitter-kotlin", version: "1.1.0", distInfo: "tree_sitter_kotlin-1.1.0.dist-info", recordSha256: "96fc8f06979c20faceefe0976f136766248cc6e5b9169f322a7b305aeb18d526", recordEntries: 12 },
  { name: "tree-sitter-lua", version: "0.5.0", distInfo: "tree_sitter_lua-0.5.0.dist-info", recordSha256: "8d81ecba6520e257fd430d64bef1c10e84bc388548b2cbc9e976f2e86d40390d", recordEntries: 16 },
  { name: "tree-sitter-objc", version: "3.0.2", distInfo: "tree_sitter_objc-3.0.2.dist-info", recordSha256: "ff02fbf6e67ed40114fedc8525e59ecf2d4f04c3a8dc2eb1159596f6e81f376d", recordEntries: 17 },
  { name: "tree-sitter-php", version: "0.24.1", distInfo: "tree_sitter_php-0.24.1.dist-info", recordSha256: "d6ddc6b3ae24770f507360c03a8d9ebfa21f66539c2233c269f763ba209971dd", recordEntries: 16 },
  { name: "tree-sitter-powershell", version: "0.26.4", distInfo: "tree_sitter_powershell-0.26.4.dist-info", recordSha256: "5750ceccbeba5df6620c16ae59dd4aeb365374ac199f9672f9f52e5cd529f38e", recordEntries: 13 },
  { name: "tree-sitter-python", version: "0.25.0", distInfo: "tree_sitter_python-0.25.0.dist-info", recordSha256: "78b8b622109f1a3e4a47dbabe7d1f08ac45485bb023f085a1f70a033af5c2141", recordEntries: 14 },
  { name: "tree-sitter-ruby", version: "0.23.1", distInfo: "tree_sitter_ruby-0.23.1.dist-info", recordSha256: "4b05441cca11ce7dc4a41f9dd00c2029f64e6be8b8a21f58cdadf8b2dd70c6b1", recordEntries: 15 },
  { name: "tree-sitter-rust", version: "0.24.2", distInfo: "tree_sitter_rust-0.24.2.dist-info", recordSha256: "50b69ef3624961ee4ce4a61edf3306cea5cd13d23300e8bab5f76bbaf259d865", recordEntries: 15 },
  { name: "tree-sitter-scala", version: "0.26.2", distInfo: "tree_sitter_scala-0.26.2.dist-info", recordSha256: "00933ee96bc5360e815a28de45e6445098a70abe9e9bb0c6e0094f9aac84cf12", recordEntries: 16 },
  { name: "tree-sitter-sql", version: "0.3.11", distInfo: "tree_sitter_sql-0.3.11.dist-info", recordSha256: "6eb726bb420f7735198c8a35f3ae3506b0abfcfca0fa04eb44ab3b7b53d2a1c6", recordEntries: 14 },
  { name: "tree-sitter-swift", version: "0.7.3", distInfo: "tree_sitter_swift-0.7.3.dist-info", recordSha256: "8c617943a8c9faa4dadd8366eafae3727e7111afde22c2f62848c3d4cdb61758", recordEntries: 20 },
  { name: "tree-sitter-typescript", version: "0.23.2", distInfo: "tree_sitter_typescript-0.23.2.dist-info", recordSha256: "48d8ddad634240a6733db5dcedc3bb4a273d4dc1b76840e89967281fc97adf2f", recordEntries: 15 },
  { name: "tree-sitter-verilog", version: "1.0.3", distInfo: "tree_sitter_verilog-1.0.3.dist-info", recordSha256: "1102692a6559564e8e20b24eec641197abf93c92a0547599feca257aa5498414", recordEntries: 12 },
  { name: "tree-sitter-zig", version: "1.1.2", distInfo: "tree_sitter_zig-1.1.2.dist-info", recordSha256: "3bfed998d373135af8d1db4a2468f69a94ea0a3c0f4e044f2d8cb4d4a80bf087", recordEntries: 16 },
]);

const EXPECTED_RUNTIME_FILES = Object.freeze([
  { path: "lib/python3.12/site-packages/_virtualenv.pth", sha256: "69ac3d8f27e679c81b94ab30b3b56e9cd138219b1ba94a1fa3606d5a76a1433d" },
  { path: "lib/python3.12/site-packages/_virtualenv.py", sha256: "cfb3db86aaa53bb62b5ff764970bec2d71c9228590a0ebec57f6ec926cc0bf1a" },
]);

const EXPECTED_RUNTIME_SCAFFOLD = Object.freeze([
  ".gitignore",
  ".lock",
  "CACHEDIR.TAG",
  "bin/activate",
  "bin/activate.bat",
  "bin/activate.csh",
  "bin/activate.fish",
  "bin/activate.nu",
  "bin/activate.ps1",
  "bin/activate.xsh",
  "bin/activate_this.py",
  "bin/deactivate.bat",
  "bin/pydoc.bat",
  "bin/python",
  "bin/python3",
  "bin/python3.12",
  "lib/python3.12/site-packages/_virtualenv.pth",
  "lib/python3.12/site-packages/_virtualenv.py",
  "pyvenv.cfg",
]);

export const GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256 = sha256(JSON.stringify({
  python: "3.12.14",
  inputs: PINNED_INPUT_SHA256,
  distributions: EXPECTED_DISTRIBUTIONS,
  runtimeFiles: EXPECTED_RUNTIME_FILES,
  runtimeScaffold: EXPECTED_RUNTIME_SCAFFOLD,
  runtimeContract: { python: "3.12.14", implementation: "CPython", uv: "0.12.7", includeSystemSitePackages: false },
}));

const activeInstructionPaths = [
  "AGENTS.md",
  ".codex",
  ".agents",
  ".claude",
  ".cursor",
  ".githooks",
] as const;

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Base64Url(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("base64url");
}

export async function verifyInstalledDistributionBytes(
  environmentRoot: string,
  distribution: InstalledDistributionIdentity,
) {
  const sitePackages = path.join(environmentRoot, "lib/python3.12/site-packages");
  const recordPath = path.join(sitePackages, distribution.distInfo, "RECORD");
  const recordBytes = await readFile(recordPath);
  if (sha256(recordBytes) !== distribution.recordSha256) {
    throw new Error(`The installed ${distribution.name} wheel record differs from the pinned environment record.`);
  }
  const metadata = await readFile(path.join(sitePackages, distribution.distInfo, "METADATA"), "utf8");
  if (!metadata.includes(`\nName: ${distribution.name}\n`) || !metadata.includes(`\nVersion: ${distribution.version}\n`)) {
    throw new Error(`The installed ${distribution.name} metadata does not match the pinned environment.`);
  }
  let verifiedFiles = 0;
  let sawSelfRecord = false;
  const rows = recordBytes.toString("utf8").trimEnd().split("\n");
  if (rows.length !== distribution.recordEntries) {
    throw new Error(`The installed ${distribution.name} wheel record has the wrong number of entries.`);
  }
  for (const line of rows) {
    const columns = line.split(",");
    if (columns.length !== 3) throw new Error(`The installed ${distribution.name} wheel record is malformed.`);
    const [relativePath, recordedHash, recordedSize] = columns;
    if (relativePath === `${distribution.distInfo}/RECORD`) {
      if (recordedHash !== "" || recordedSize !== "") throw new Error(`The installed ${distribution.name} self-record is malformed.`);
      sawSelfRecord = true;
      continue;
    }
    if (!recordedHash.startsWith("sha256=") || !/^\d+$/.test(recordedSize)) {
      throw new Error(`The installed ${distribution.name} wheel record is missing an identity for ${relativePath}.`);
    }
    const target = path.resolve(sitePackages, relativePath);
    if (target !== environmentRoot && !target.startsWith(`${environmentRoot}${path.sep}`)) {
      throw new Error(`The installed ${distribution.name} wheel record escapes its private environment: ${relativePath}.`);
    }
    const bytes = await readFile(target);
    if (bytes.byteLength !== Number(recordedSize) || sha256Base64Url(bytes) !== recordedHash.slice("sha256=".length)) {
      throw new Error(`Installed ${distribution.name} bytes changed for ${relativePath}.`);
    }
    verifiedFiles += 1;
  }
  if (!sawSelfRecord || verifiedFiles < 1) throw new Error(`The installed ${distribution.name} wheel record did not enumerate its installed files.`);
  const ownedPaths = rows.map((line) => {
    const relativePath = line.split(",")[0];
    return path.relative(environmentRoot, path.resolve(sitePackages, relativePath)).split(path.sep).join("/");
  });
  return Object.freeze({ recordSha256: distribution.recordSha256, verifiedFiles, ownedPaths: Object.freeze(ownedPaths) });
}

async function walkEnvironmentEntries(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walkEnvironmentEntries(root, absolute)));
    else if (entry.isFile() || entry.isSymbolicLink()) results.push(path.relative(root, absolute).split(path.sep).join("/"));
    else throw new Error(`The private Graphify environment contains an unsupported entry: ${path.relative(root, absolute)}.`);
  }
  return results.sort();
}

export function verifyGraphifyPyvenvConfig(source: string) {
  const fields = new Map(source.split("\n").map((line) => line.split(" = ", 2)).filter((row) => row.length === 2) as Array<[string, string]>);
  const expected = {
    implementation: "CPython",
    uv: "0.12.7",
    version_info: "3.12.14",
    "include-system-site-packages": "false",
    prompt: "chronicle-graphify-toolchain",
  } as const;
  for (const [key, value] of Object.entries(expected)) {
    if (fields.get(key) !== value) throw new Error(`The private Graphify Python environment has the wrong ${key}.`);
  }
  return Object.freeze({ python: expected.version_info, uv: expected.uv });
}

export async function verifyNoUnexpectedGraphifyEnvironmentEntries(
  environmentRoot: string,
  ownedPaths: readonly string[],
) {
  const allowed = new Set([...ownedPaths, ...EXPECTED_RUNTIME_SCAFFOLD]);
  const unexpected = (await walkEnvironmentEntries(environmentRoot)).filter((entry) => !allowed.has(entry));
  if (unexpected.length > 0) {
    throw new Error(`The private Graphify environment contains unverified files: ${unexpected.slice(0, 10).join(", ")}.`);
  }
  return Object.freeze({ files: allowed.size });
}

export async function verifyInstalledGraphifyEnvironment(environmentRoot: string) {
  environmentRoot = path.resolve(environmentRoot);
  const sitePackages = path.join(environmentRoot, "lib/python3.12/site-packages");
  const installedDistInfo = (await readdir(sitePackages, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(".dist-info"))
    .map((entry) => entry.name)
    .sort();
  const expectedDistInfo = EXPECTED_DISTRIBUTIONS.map((entry) => entry.distInfo).sort();
  if (JSON.stringify(installedDistInfo) !== JSON.stringify(expectedDistInfo)) {
    throw new Error("The installed Graphify dependency closure differs from the pinned environment.");
  }
  let verifiedFiles = 0;
  const ownedPaths: string[] = [];
  for (const distribution of EXPECTED_DISTRIBUTIONS) {
    const receipt = await verifyInstalledDistributionBytes(environmentRoot, distribution);
    verifiedFiles += receipt.verifiedFiles;
    ownedPaths.push(...receipt.ownedPaths);
  }
  for (const runtimeFile of EXPECTED_RUNTIME_FILES) {
    const actual = sha256(await readFile(path.join(environmentRoot, runtimeFile.path)));
    if (actual !== runtimeFile.sha256) throw new Error(`The private Python runtime file changed: ${runtimeFile.path}.`);
    verifiedFiles += 1;
  }
  verifyGraphifyPyvenvConfig(await readFile(path.join(environmentRoot, "pyvenv.cfg"), "utf8"));
  await verifyNoUnexpectedGraphifyEnvironmentEntries(environmentRoot, ownedPaths);
  return Object.freeze({
    environmentSha256: GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256,
    distributions: EXPECTED_DISTRIBUTIONS.length,
    verifiedFiles,
  });
}

export async function verifyInstalledGraphifyBytes(repositoryRoot: string) {
  return verifyInstalledGraphifyEnvironment(path.resolve(repositoryRoot, "tools/graphify/.venv"));
}

async function walkFiles(root: string): Promise<string[]> {
  if (!existsSync(root)) return [];
  const rootState = await lstat(root);
  if (rootState.isFile()) return [root];
  if (!rootState.isDirectory()) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files.sort();
}

export async function verifyGraphifyToolchain(
  repositoryRoot: string,
  options: Readonly<{ checkEnvironment?: boolean }> = {},
) {
  const errors: string[] = [];
  const vendorRoot = path.join(repositoryRoot, VENDOR_ROOT);
  const checksumBytes = await readFile(path.join(vendorRoot, "SHA256SUMS"));
  if (sha256(checksumBytes) !== PINNED_INPUT_SHA256.checksumManifest) {
    errors.push("The vendored Graphify checksum manifest identity changed.");
  }
  const checksumSource = checksumBytes.toString("utf8");
  const checksumRows = checksumSource
    .trim()
    .split("\n")
    .map((line) => line.match(/^([a-f0-9]{64}) {2}(.+)$/))
    .filter((match): match is RegExpMatchArray => match !== null);
  if (checksumRows.length !== 12) {
    errors.push(`Expected 12 pinned upstream files, found ${checksumRows.length}.`);
  }
  for (const row of checksumRows) {
    const target = path.join(vendorRoot, row[2]);
    if (!existsSync(target)) {
      errors.push(`Missing pinned upstream file ${row[2]}.`);
      continue;
    }
    const actual = sha256(await readFile(target));
    if (actual !== row[1]) errors.push(`Pinned upstream hash changed for ${row[2]}.`);
  }

  for (const file of await walkFiles(vendorRoot)) {
    if (path.basename(file).toLowerCase() === "skill.md") {
      errors.push(`Vendored Graphify reference uses the active skill filename: ${path.relative(repositoryRoot, file)}.`);
    }
  }

  for (const activePath of activeInstructionPaths) {
    const absolute = path.join(repositoryRoot, activePath);
    for (const file of await walkFiles(absolute)) {
      const source = await readFile(file, "utf8").catch(() => "");
      if (/\bgraphify\b/i.test(source)) {
        errors.push(`Graphify appears in active instruction or hook path ${path.relative(repositoryRoot, file)}.`);
      }
    }
    if (existsSync(absolute) && !((await readdir(path.dirname(absolute), { withFileTypes: true })).find((entry) => entry.name === path.basename(absolute))?.isDirectory())) {
      const source = await readFile(absolute, "utf8").catch(() => "");
      if (/\bgraphify\b/i.test(source)) {
        errors.push(`Graphify appears in active instruction path ${activePath}.`);
      }
    }
  }

  const upstreamBytes = await readFile(path.join(vendorRoot, "UPSTREAM.json"));
  if (sha256(upstreamBytes) !== PINNED_INPUT_SHA256.upstreamReceipt) errors.push("The Graphify upstream receipt identity changed.");
  const upstream = JSON.parse(upstreamBytes.toString("utf8")) as {
    package?: { version?: string; wheel?: { sha256?: string }; source_archive?: { sha256?: string } };
    upstream?: { commit?: string };
    custody?: { active_skill?: boolean };
  };
  if (upstream.package?.version !== GRAPHIFY_VERSION) errors.push("UPSTREAM.json has the wrong package version.");
  if (upstream.package?.wheel?.sha256 !== WHEEL_SHA256) errors.push("UPSTREAM.json has the wrong wheel hash.");
  if (upstream.package?.source_archive?.sha256 !== SDIST_SHA256) errors.push("UPSTREAM.json has the wrong source hash.");
  if (upstream.upstream?.commit !== GRAPHIFY_COMMIT) errors.push("UPSTREAM.json has the wrong attested commit.");
  if (upstream.custody?.active_skill !== false) errors.push("Graphify reference custody must remain inactive.");

  const pyprojectBytes = await readFile(path.join(repositoryRoot, "tools/graphify/pyproject.toml"));
  if (sha256(pyprojectBytes) !== PINNED_INPUT_SHA256.pyproject) errors.push("The Graphify pyproject identity changed.");
  const pyproject = pyprojectBytes.toString("utf8");
  if (!pyproject.includes('requires-python = ">=3.12,<3.13"')) errors.push("Graphify Python range is not pinned to 3.12.");
  if (!pyproject.includes('"graphifyy[sql]==0.9.52"')) errors.push("Graphify dependency is not exactly pinned with only the SQL extra.");
  const lockBytes = await readFile(path.join(repositoryRoot, "tools/graphify/uv.lock"));
  if (sha256(lockBytes) !== PINNED_INPUT_SHA256.lockfile) errors.push("The Graphify lockfile identity changed.");
  const lock = lockBytes.toString("utf8");
  for (const expected of [
    'name = "graphifyy"',
    'version = "0.9.52"',
    `hash = "sha256:${WHEEL_SHA256}"`,
    `hash = "sha256:${SDIST_SHA256}"`,
    'name = "tree-sitter-sql"',
  ]) {
    if (!lock.includes(expected)) errors.push(`Graphify lockfile is missing ${expected}.`);
  }
  for (const forbidden of ["mcp", "psycopg", "watchdog", "openai", "anthropic", "httpx", "requests"]) {
    if (new RegExp(`^name = "${forbidden}"$`, "m").test(lock)) {
      errors.push(`Forbidden Graphify integration dependency is locked: ${forbidden}.`);
    }
  }

  if (options.checkEnvironment) {
    const python = path.join(repositoryRoot, "tools/graphify/.venv/bin/python");
    const cli = path.join(repositoryRoot, "tools/graphify/.venv/bin/graphify");
    if (!existsSync(python) || !existsSync(cli)) {
      errors.push("The local Graphify environment is missing; run the pinned uv sync first.");
    } else {
      try {
        await verifyInstalledGraphifyBytes(repositoryRoot);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
      const cleanPythonEnvironment = {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: "1",
        PYTHONNOUSERSITE: "1",
      };
      const environmentReceipt = execFileSync(
        python,
        [
          "-c",
          [
            "from importlib import metadata, util",
            "from pathlib import Path",
            "import graphify, tree_sitter_sql, sys",
            `root=Path(${JSON.stringify(path.join(repositoryRoot, "tools/graphify/.venv"))}).resolve()`,
            "assert sys.version_info[:3] == (3, 12, 14)",
            "assert metadata.version('graphifyy') == '0.9.52'",
            "assert Path(graphify.__file__).resolve().is_relative_to(root)",
            "assert Path(tree_sitter_sql.__file__).resolve().is_relative_to(root)",
            "assert not any(util.find_spec(name) for name in ['mcp','psycopg','watchdog','openai','anthropic','httpx','requests'])",
            "print(metadata.version('graphifyy'))",
          ].join(";"),
        ],
        { encoding: "utf8", env: cleanPythonEnvironment },
      ).trim();
      if (environmentReceipt !== GRAPHIFY_VERSION) errors.push("The local Graphify import identity is invalid.");
      const versionOutput = execFileSync(cli, ["--version"], { encoding: "utf8", env: cleanPythonEnvironment }).trim();
      if (versionOutput !== `graphify ${GRAPHIFY_VERSION}`) errors.push("The local Graphify CLI identity is invalid.");
    }
  }

  if (errors.length > 0) throw new Error(errors.join("\n"));
  return Object.freeze({
    version: GRAPHIFY_VERSION,
    upstreamCommit: GRAPHIFY_COMMIT,
    pinnedFiles: checksumRows.length,
    environmentChecked: options.checkEnvironment === true,
    toolchainIdentitySha256: GRAPHIFY_ENVIRONMENT_IDENTITY_SHA256,
  });
}
