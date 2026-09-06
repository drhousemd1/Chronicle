import {
  isChronicleCapabilityId,
  type ChronicleCapabilityId,
} from "../../src/data/chronicle-knowledge-base/capability-ids";
import {
  loadCanonicalRepositoryGraphHistory,
  queryCanonicalRepositoryGraphHistory,
} from "./historian";

function optionalArgumentValue(args: readonly string[], flag: string) {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  if (index === args.length - 1) throw new Error(`Missing ${flag} argument.`);
  return args[index + 1];
}

function positionalArguments(args: readonly string[]) {
  const flagsWithValues = new Set(["--capability", "--source", "--limit"]);
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (flagsWithValues.has(args[index])) {
      index += 1;
      continue;
    }
    values.push(args[index]);
  }
  return values;
}

export async function runRepositoryGraphHistoryCommand(repositoryRoot: string, args: readonly string[]) {
  const capability = optionalArgumentValue(args, "--capability");
  const sourcePath = optionalArgumentValue(args, "--source");
  const literal = positionalArguments(args).join(" ").trim();
  const limitValue = optionalArgumentValue(args, "--limit");
  const limit = limitValue === undefined ? undefined : Number.parseInt(limitValue, 10);
  if (!capability && !sourcePath && !literal) {
    throw new Error("Repository graph history requires a capability, source path, or literal search so canonical history is not dumped without a purpose.");
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
    throw new Error("Repository graph history --limit must be an integer from 1 through 50.");
  }
  if (capability && !isChronicleCapabilityId(capability)) {
    throw new Error(`Repository graph history received an unknown Chronicle capability ${JSON.stringify(capability)}.`);
  }
  const entries = await loadCanonicalRepositoryGraphHistory(
    repositoryRoot,
    capability as ChronicleCapabilityId | undefined,
  );
  const results = queryCanonicalRepositoryGraphHistory(entries, { literal, sourcePath, limit });
  console.log(JSON.stringify({
    authority: "canonical-chronicle-changelog",
    limitations: "This command reports recorded Chronicle history. It does not infer history from Git, use Graphify memory, or treat historical Quality Hub status as modern acceptance.",
    capability: capability ?? null,
    literal: literal || null,
    sourcePath: sourcePath ?? null,
    totalInScope: entries.length,
    shown: results.length,
    results,
  }, null, 2));
}
