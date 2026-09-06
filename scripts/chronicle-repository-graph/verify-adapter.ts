import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { runPinnedGraphifyExtraction } from "./graphify-adapter";

async function main() {
  const repositoryRoot = process.cwd();
  const root = await mkdtemp("/private/tmp/chronicle-graphify-adapter-check-");
  const corpus = path.join(root, "corpus");
  const work = path.join(root, "private");
  try {
    await mkdir(path.join(corpus, "src"), { recursive: true, mode: 0o700 });
    await mkdir(work, { recursive: true, mode: 0o700 });
    await writeFile(
      path.join(corpus, "src/a.ts"),
      [
        "export function first() { return second(); }",
        "export function second() { return 2; }",
        "",
      ].join("\n"),
      { mode: 0o600 },
    );
    const result = await runPinnedGraphifyExtraction({ repositoryRoot, stagedCorpusRoot: corpus, privateWorkRoot: work });
    const extraction = result.extraction as { nodes?: unknown[]; edges?: unknown[] };
    const clustered = result.clustered as { nodes?: Array<{ community?: unknown }> };
    if (!Array.isArray(extraction.nodes) || extraction.nodes.length === 0) throw new Error("Pinned Graphify adapter produced no nodes.");
    if (!Array.isArray(extraction.edges)) throw new Error("Pinned Graphify adapter did not produce a directed edge collection.");
    if (!Array.isArray(clustered.nodes) || clustered.nodes.length !== extraction.nodes.length) {
      throw new Error("Pinned Graphify clustering did not preserve the extraction node set.");
    }
    console.log(JSON.stringify({
      result: "passed",
      nodes: extraction.nodes.length,
      edges: extraction.edges.length,
      clusteredNodes: clustered.nodes.length,
      extractionProcess: result.receipts.extraction,
      clusterProcess: result.receipts.cluster,
    }, null, 2));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
