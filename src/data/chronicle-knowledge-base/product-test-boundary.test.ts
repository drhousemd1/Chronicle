import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  parseProductTestArguments,
  PRODUCT_TEST_HARNESS_SOURCES,
  validateProductTestSelection,
  verifyProductTestSelection,
} from "../../../scripts/product-test-boundary";

const ROOT = process.cwd();
const temporaryRoots: string[] = [];

async function fixture(source: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), "chronicle-product-tests-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "src", "test"), { recursive: true });
  await writeFile(path.join(root, "vitest.product.config.ts"), "export default {};\n");
  await writeFile(path.join(root, "src", "test", "setup.ts"), "export {};\n");
  await writeFile(path.join(root, "src", "feature.test.ts"), source);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, {
    recursive: true,
    force: true,
  })));
});

describe("product-only test boundary", () => {
  it("accepts an explicit runtime test with a statically bounded import graph", async () => {
    const selection = await validateProductTestSelection(ROOT, [
      "src/services/gallery-data.test.ts",
    ]);
    expect(selection.selectedPaths).toEqual(["src/services/gallery-data.test.ts"]);
    expect(selection.sourceFingerprints.length).toBeGreaterThan(2);
    await expect(verifyProductTestSelection(ROOT, selection)).resolves.toBeUndefined();
  });

  it("checks every implicit config and setup source used by the product runner", async () => {
    expect(PRODUCT_TEST_HARNESS_SOURCES).toEqual([
      "vitest.product.config.ts",
      "src/test/setup.ts",
    ]);
    const config = await readFile("vitest.product.config.ts", "utf8");
    expect(config).toContain('setupFiles: ["./src/test/setup.ts"]');
    expect(config).toContain("include: selectedFiles");
    const runner = await readFile("scripts/run-product-tests.ts", "utf8");
    expect(runner).toContain("CHRONICLE_PRODUCT_TEST_FILES: JSON.stringify(selection.selectedPaths)");
    expect(runner).toContain('"vitest.product.config.ts",');
    expect(runner).toContain("...parsedArguments.vitestArguments");
    expect(runner).not.toContain("...selectedPaths]");
  });

  it("separates exact test files from the optional Vitest name filter", () => {
    expect(parseProductTestArguments([
      "--",
      "src/services/gallery-data.test.ts",
      "-t",
      "returns the visible error state",
    ])).toEqual({
      requestedPaths: ["src/services/gallery-data.test.ts"],
      vitestArguments: ["-t", "returns the visible error state"],
    });

    expect(parseProductTestArguments([
      "src/services/gallery-data.test.ts",
      "--testNamePattern=visible error",
    ])).toEqual({
      requestedPaths: ["src/services/gallery-data.test.ts"],
      vitestArguments: ["-t", "visible error"],
    });
  });

  it("rejects unsupported product-test runner flags", () => {
    expect(() => parseProductTestArguments([
      "src/services/gallery-data.test.ts",
      "--coverage",
    ])).toThrow(/allow only exact test files/);
    expect(() => parseProductTestArguments([
      "src/services/gallery-data.test.ts",
      "-t",
    ])).toThrow(/requires an exact test-name pattern/);
    expect(() => parseProductTestArguments([
      "src/services/gallery-data.test.ts",
      "-t",
      "   ",
    ])).toThrow(/requires an exact test-name pattern/);
    expect(() => parseProductTestArguments([
      "src/services/gallery-data.test.ts",
      "--testNamePattern=   ",
    ])).toThrow(/requires an exact test-name pattern/);
  });

  it("rejects missing, patterned, non-test, and Knowledge-bearing selections", async () => {
    await expect(validateProductTestSelection(ROOT, [])).rejects.toThrow(
      /require one or more explicit test files/,
    );
    await expect(validateProductTestSelection(ROOT, ["src/services/*.test.ts"]))
      .rejects.toThrow(/exact files/);
    await expect(validateProductTestSelection(ROOT, ["src/services/gallery-data.ts"]))
      .rejects.toThrow(/not an exact Chronicle test file/);
    await expect(validateProductTestSelection(ROOT, [
      "src/data/chronicle-knowledge-base/manifest.test.ts",
    ])).rejects.toThrow(/reaches Chronicle Knowledge source/);
  });

  it("fails closed when a selected graph can load arbitrary repository sources", async () => {
    await expect(validateProductTestSelection(ROOT, [
      "src/App.test.tsx",
    ])).rejects.toThrow(/read or spawn arbitrary repository sources/);
  });

  it("rejects unresolved, dynamic, raw, and child-process source loading", async () => {
    const unresolved = await fixture('import "./missing";\n');
    await expect(validateProductTestSelection(unresolved, ["src/feature.test.ts"]))
      .rejects.toThrow(/could not be resolved/);

    const dynamic = await fixture('const modules = import.meta.glob("./*.ts");\n');
    await expect(validateProductTestSelection(dynamic, ["src/feature.test.ts"]))
      .rejects.toThrow(/dynamic source-loading mechanism/);

    const raw = await fixture('import content from "./contract.md?raw";\n');
    await expect(validateProductTestSelection(raw, ["src/feature.test.ts"]))
      .rejects.toThrow(/dynamic source-loading mechanism/);

    const childProcess = await fixture('import { spawn } from "node:child_process";\nvoid spawn;\n');
    await expect(validateProductTestSelection(childProcess, ["src/feature.test.ts"]))
      .rejects.toThrow(/read or spawn arbitrary repository sources/);
  });

  it("cannot escape the repository through an exact-looking path", async () => {
    const outside = path.relative(ROOT, "/private/tmp/fake.test.ts");
    await expect(validateProductTestSelection(ROOT, [outside]))
      .rejects.toThrow(/not an exact Chronicle test file/);
  });

  it("rejects a selected graph that changes after it was checked", async () => {
    const root = await fixture("export {};\n");
    const selection = await validateProductTestSelection(root, ["src/feature.test.ts"]);
    await writeFile(path.join(root, "src", "feature.test.ts"), 'import "./later";\n');
    await expect(verifyProductTestSelection(root, selection))
      .rejects.toThrow(/changed after boundary validation/);
  });
});
