import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  apiInspectorLiveSections,
  type ApiInspectorFileRef,
} from "./api-inspector-live-map";
import { apiInspectorCodeTruthRegistry } from "./api-inspector-code-truth-registry";
import { apiInspectorLineMap } from "./api-inspector-line-map";
import {
  API_USAGE_VALIDATION_ROW_BY_ID,
  API_USAGE_VALIDATION_ROW_IDS,
} from "./api-usage-validation-registry";
import { manualArchitectureFileByPath } from "./app-architecture-manual";

type LiveRef = ApiInspectorFileRef & {
  owner: string;
};

function toRepoPath(sourcePath: string): string {
  return join(process.cwd(), sourcePath.replace(/^\//, ""));
}

function collectLiveRefs(): LiveRef[] {
  const refs: LiveRef[] = [];

  for (const section of apiInspectorLiveSections) {
    for (const phase of section.phases) {
      for (const group of phase.groups) {
        refs.push({
          ...group.primaryRef,
          owner: `${section.id} > ${phase.id} > ${group.id} primaryRef`,
        });

        for (const item of group.items) {
          for (const fileRef of item.fileRefs) {
            refs.push({
              ...fileRef,
              owner: `${section.id} > ${phase.id} > ${group.id} > ${item.id}`,
            });
          }
        }
      }
    }
  }

  return refs;
}

function parseLineMapKey(key: string): { sourcePath: string; locator: string } {
  const separatorIndex = key.indexOf("|");
  if (separatorIndex === -1) {
    throw new Error(`Line-map key is missing "|" separator: ${key}`);
  }

  return {
    sourcePath: key.slice(0, separatorIndex),
    locator: key.slice(separatorIndex + 1),
  };
}

function parseLineSpans(lineSpec: string): Array<{ start: number; end: number }> {
  return lineSpec.split(",").map((rawPart) => {
    const part = rawPart.trim();
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid line-map range: ${lineSpec}`);
    }

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    return { start, end };
  });
}

describe("api inspector source-truth references", () => {
  it("points visible Roleplay Pipeline file refs at existing repo files", () => {
    const missingRefs = collectLiveRefs()
      .filter((fileRef) => !existsSync(toRepoPath(fileRef.path)))
      .map((fileRef) => `${fileRef.owner}: ${fileRef.path}`);

    expect(missingRefs).toEqual([]);
  });

  it("resolves every locator-backed live ref through the line map", () => {
    const missingLineMapKeys = collectLiveRefs()
      .filter((fileRef) => Boolean(fileRef.locator))
      .map((fileRef) => ({
        owner: fileRef.owner,
        key: `${fileRef.path}|${fileRef.locator}`,
      }))
      .filter(({ key }) => !apiInspectorLineMap[key])
      .map(({ owner, key }) => `${owner}: ${key}`);

    expect(missingLineMapKeys).toEqual([]);
  });

  it("keeps line-map paths and numeric spans inside current file bounds", () => {
    const issues: string[] = [];

    for (const [key, lineSpec] of Object.entries(apiInspectorLineMap)) {
      const { sourcePath } = parseLineMapKey(key);
      const absolutePath = toRepoPath(sourcePath);

      if (!existsSync(absolutePath)) {
        issues.push(`${key}: missing path ${sourcePath}`);
        continue;
      }

      const lineCount = readFileSync(absolutePath, "utf8").split(/\r?\n/).length;
      for (const { start, end } of parseLineSpans(lineSpec)) {
        if (start < 1 || end < start || end > lineCount) {
          issues.push(`${key}: range ${start}-${end} exceeds file length ${lineCount}`);
        }
      }
    }

    expect(issues).toEqual([]);
  });

  it("keeps API usage validation row IDs unique", () => {
    const duplicateRowIds = API_USAGE_VALIDATION_ROW_IDS.filter(
      (rowId, index, rowIds) => rowIds.indexOf(rowId) !== index,
    );

    expect(duplicateRowIds).toEqual([]);
  });

  it("registers every runtime validation row emitted by roleplay character updates", () => {
    const chatInterfaceSource = readFileSync(
      toRepoPath("/src/components/chronicle/ChatInterfaceTab.tsx"),
      "utf8",
    );
    const emittedCharacterUpdateRows = Array.from(
      chatInterfaceSource.matchAll(/['"](call2\.character_updates\.[^'"]+)['"]/g),
      (match) => match[1],
    );
    const missingRows = Array.from(new Set(emittedCharacterUpdateRows))
      .filter((rowId) => !API_USAGE_VALIDATION_ROW_BY_ID[rowId]);

    expect(missingRows).toEqual([]);
  });

  it("registers every runtime validation row emitted by roleplay memory compression", () => {
    const chatInterfaceSource = readFileSync(
      toRepoPath("/src/components/chronicle/ChatInterfaceTab.tsx"),
      "utf8",
    );
    const emittedMemoryCompressionRows = Array.from(
      chatInterfaceSource.matchAll(/['"](call2\.memory_compress\.[^'"]+)['"]/g),
      (match) => match[1],
    );
    const missingRows = Array.from(new Set(emittedMemoryCompressionRows))
      .filter((rowId) => !API_USAGE_VALIDATION_ROW_BY_ID[rowId]);

    expect(missingRows).toEqual([]);
  });

  it("keeps the API Call 1 collector ownership split explicit in source-truth surfaces", () => {
    const liveMapText = JSON.stringify(apiInspectorLiveSections);
    const codeTruthText = JSON.stringify(apiInspectorCodeTruthRegistry);
    const collectorProfile = manualArchitectureFileByPath.get(
      "/src/features/chat-runtime/collect-roleplay-response.ts",
    );
    const architectureProfileText = JSON.stringify(collectorProfile);

    expect(collectorProfile).toBeDefined();
    for (const sourceText of [liveMapText, codeTruthText, architectureProfileText]) {
      expect(sourceText).toContain("collect-roleplay-response.ts");
    }

    expect(liveMapText).toContain("The UI still commits only the completed parsed response");
    expect(liveMapText).toContain("returned to the caller, which commits them only after the relevant live-state guard passes");
    expect(codeTruthText).toContain("collects one live response through the shared collector");
    expect(codeTruthText).toContain("browser parser and shared response collector expect Chat Completions-style SSE events");
    expect(architectureProfileText).toContain("Browser-side collector for one streamed roleplay response");
    expect(architectureProfileText).toContain("partial rendering cannot bypass the final sanitizer");
  });
});
