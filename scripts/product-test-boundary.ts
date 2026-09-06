import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

import { KNOWLEDGE_SOURCE_BOUNDARIES } from "./knowledge-command-boundaries";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const UNSAFE_DYNAMIC_SOURCE = [
  /\bimport\s*\(/,
  /\brequire\s*\(/,
  /import\.meta\.glob/,
  /\?(?:raw|url)(?:["'])/,
];
const UNSAFE_NODE_IMPORTS = new Set([
  "node:child_process",
  "node:fs",
  "node:fs/promises",
  "child_process",
  "fs",
  "fs/promises",
]);
export const PRODUCT_TEST_HARNESS_SOURCES = Object.freeze([
  "vitest.product.config.ts",
  "src/test/setup.ts",
] as const);

export function parseProductTestArguments(arguments_: readonly string[]) {
  const requestedPaths: string[] = [];
  const vitestArguments: string[] = [];

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--") continue;
    if (argument === "-t" || argument === "--testNamePattern") {
      const pattern = arguments_[index + 1];
      if (!pattern?.trim() || pattern === "--") {
        throw new Error(`${argument} requires an exact test-name pattern.`);
      }
      vitestArguments.push("-t", pattern);
      index += 1;
      continue;
    }
    if (argument.startsWith("--testNamePattern=")) {
      const pattern = argument.slice("--testNamePattern=".length);
      if (!pattern.trim()) {
        throw new Error("--testNamePattern requires an exact test-name pattern.");
      }
      vitestArguments.push("-t", pattern);
      continue;
    }
    if (argument.startsWith("-")) {
      throw new Error(
        `Product-only tests allow only exact test files and an optional -t/--testNamePattern filter: ${argument}`,
      );
    }
    requestedPaths.push(argument);
  }

  return Object.freeze({
    requestedPaths: Object.freeze(requestedPaths),
    vitestArguments: Object.freeze(vitestArguments),
  });
}

function sourceHash(source: string) {
  return createHash("sha256").update(source).digest("hex");
}

async function existingFile(filePath: string) {
  try {
    await access(filePath);
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function repositoryPath(root: string, filePath: string) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function isKnowledgeSource(root: string, filePath: string) {
  const relative = repositoryPath(root, filePath).replace(/\.[^.]+$/, "");
  return KNOWLEDGE_SOURCE_BOUNDARIES.some(
    (boundary) => relative === boundary || relative.startsWith(`${boundary}/`),
  );
}

async function resolveLocalImport(root: string, importer: string, request: string) {
  let base: string | null = null;
  if (request.startsWith("@/")) base = path.join(root, "src", request.slice(2));
  if (request.startsWith(".")) base = path.resolve(path.dirname(importer), request);
  if (!base) return null;
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
  for (const candidate of candidates) {
    if (await existingFile(candidate)) return candidate;
  }
  throw new Error(
    `Product-only test import could not be resolved: ${repositoryPath(root, importer)} -> ${request}`,
  );
}

export async function validateProductTestSelection(
  repositoryRoot: string,
  requestedPaths: readonly string[],
) {
  if (requestedPaths.length === 0) {
    throw new Error(
      "Product-only tests require one or more explicit test files. Example: npm run test:product -- src/services/gallery-data.test.ts",
    );
  }

  const entryPoints: string[] = [];
  for (const requestedPath of requestedPaths) {
    if (/[*?{}[\]]/.test(requestedPath)) {
      throw new Error("Product-only tests require exact files, not globs or patterns.");
    }
    const absolutePath = path.resolve(repositoryRoot, requestedPath);
    const relative = repositoryPath(repositoryRoot, absolutePath);
    if (
      relative.startsWith("..") ||
      !relative.startsWith("src/") ||
      !/\.(?:test|spec)\.(?:ts|tsx)$/.test(relative) ||
      !(await existingFile(absolutePath))
    ) {
      throw new Error(`Product-only test path is not an exact Chronicle test file: ${requestedPath}`);
    }
    entryPoints.push(absolutePath);
  }

  const harnessPaths = PRODUCT_TEST_HARNESS_SOURCES.map((sourcePath) =>
    path.resolve(repositoryRoot, sourcePath),
  );
  for (const harnessPath of harnessPaths) {
    if (!(await existingFile(harnessPath))) {
      throw new Error(
        `Product-only test harness source is missing: ${repositoryPath(repositoryRoot, harnessPath)}`,
      );
    }
  }

  const pending = [...entryPoints, ...harnessPaths];
  const visited = new Set<string>();
  const fingerprints = new Map<string, string>();
  while (pending.length > 0) {
    const filePath = pending.pop();
    if (!filePath || visited.has(filePath)) continue;
    visited.add(filePath);
    if (isKnowledgeSource(repositoryRoot, filePath)) {
      throw new Error(
        `Product-only test reaches Chronicle Knowledge source: ${repositoryPath(repositoryRoot, filePath)}`,
      );
    }
    const source = await readFile(filePath, "utf8");
    fingerprints.set(repositoryPath(repositoryRoot, filePath), sourceHash(source));
    if (UNSAFE_DYNAMIC_SOURCE.some((pattern) => pattern.test(source))) {
      throw new Error(
        `Product-only test graph uses a dynamic source-loading mechanism that cannot be certified safely: ${repositoryPath(repositoryRoot, filePath)}`,
      );
    }
    const imports = ts.preProcessFile(source, true, true).importedFiles;
    for (const imported of imports) {
      if (UNSAFE_NODE_IMPORTS.has(imported.fileName)) {
        throw new Error(
          `Product-only test graph can read or spawn arbitrary repository sources: ${repositoryPath(repositoryRoot, filePath)} imports ${imported.fileName}`,
        );
      }
      const resolved = await resolveLocalImport(repositoryRoot, filePath, imported.fileName);
      if (resolved) pending.push(resolved);
    }
  }

  return Object.freeze({
    selectedPaths: Object.freeze(
      entryPoints.map((filePath) => repositoryPath(repositoryRoot, filePath)),
    ),
    sourceFingerprints: Object.freeze(
      [...fingerprints.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([sourcePath, sha256]) => Object.freeze({ sourcePath, sha256 })),
    ),
  });
}

export async function verifyProductTestSelection(
  repositoryRoot: string,
  selection: Awaited<ReturnType<typeof validateProductTestSelection>>,
) {
  for (const fingerprint of selection.sourceFingerprints) {
    const current = await readFile(path.resolve(repositoryRoot, fingerprint.sourcePath), "utf8");
    if (sourceHash(current) !== fingerprint.sha256) {
      throw new Error(
        `Product-only test source changed after boundary validation: ${fingerprint.sourcePath}`,
      );
    }
  }
}
