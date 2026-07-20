import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { manualArchitectureFiles } from "./index";

function repositoryPaths() {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: process.cwd(), encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((path) => existsSync(resolve(process.cwd(), path)))
    .map((path) => `/${path}`)
    .sort((a, b) => a.localeCompare(b));
}

function logicalLineCount(path: string) {
  const source = readFileSync(resolve(process.cwd(), path.slice(1)), "utf8");
  if (source.length === 0) return 0;
  const newlineCount = source.match(/\n/g)?.length ?? 0;
  return Math.max(1, newlineCount);
}

describe("manual App Architecture registry", () => {
  it("covers every repository file exactly once", () => {
    const repository = repositoryPaths();
    const manual: string[] = manualArchitectureFiles.map((file) => file.path).sort((a, b) => a.localeCompare(b));

    expect(new Set(manual).size).toBe(manual.length);
    expect(manual.filter((path) => !repository.includes(path))).toEqual([]);
    expect(repository.filter((path) => !manual.includes(path))).toEqual([]);
  });

  it("keeps text-file metrics synchronized within the trailing-newline convention", () => {
    const mismatches = manualArchitectureFiles.flatMap((file) => {
      const match = file.metric.match(/^([\d,]+) lines$/);
      if (!match) return [];
      const documented = Number(match[1].replace(/,/g, ""));
      const actual = logicalLineCount(file.path);
      // Some historical files omit a terminal newline, so wc-style and logical-line counts differ by one.
      return Math.abs(documented - actual) <= 1 ? [] : [{ path: file.path, documented, actual }];
    });

    expect(mismatches).toEqual([]);
  });

  it("rejects generic, duplicate, or placeholder architecture prose", () => {
    const forbidden = [
      /responsibilities and data flow/i,
      /part of the Chronicle source tree/i,
      /this React component is responsible for/i,
      /todo|tbd|placeholder description/i,
    ];
    const problems: string[] = [];
    const rowIds = new Set<string>();
    const descriptions = new Map<string, string>();

    manualArchitectureFiles.forEach((file) => {
      const normalizedDescription = file.description.replace(/\s+/g, " ").trim();
      if (file.description.trim().length < 60) {
        problems.push(`${file.path}: description is too short`);
      }
      if (forbidden.some((pattern) => pattern.test(file.description))) {
        problems.push(`${file.path}: generic or placeholder description`);
      }
      const priorDescriptionPath = descriptions.get(normalizedDescription);
      if (priorDescriptionPath) {
        problems.push(`${file.path}: repeats description from ${priorDescriptionPath}`);
      }
      descriptions.set(normalizedDescription, file.path);

      file.rows.forEach((row) => {
        if (rowIds.has(row.id)) problems.push(`${file.path}: duplicate row id ${row.id}`);
        rowIds.add(row.id);
        if (row.summary.trim() === file.description.trim()) {
          problems.push(`${file.path}: row repeats the file description`);
        }
        if (forbidden.some((pattern) => pattern.test(`${row.title} ${row.summary}`))) {
          problems.push(`${file.path}: generic or placeholder row ${row.id}`);
        }
      });
    });

    expect(problems).toEqual([]);
  });
});
