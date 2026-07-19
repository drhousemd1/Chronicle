import { appendManualReview, buildValidationEvidenceLedgerSnapshot } from '../src/features/validation-evidence/ledger-file.ts';
import { readValidationSourceIdentity } from '../src/features/validation-evidence/source-identity.ts';

type ParsedArgs = {
  gateId: string;
  outcome: 'approved' | 'rejected';
  reviewer: string;
  notes: string;
  evidenceReferences: string[];
};

function parseArgs(args: string[]): ParsedArgs {
  const values = new Map<string, string[]>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('Manual review arguments must be supplied as --name value pairs.');
    }
    const existing = values.get(key) ?? [];
    existing.push(value);
    values.set(key, existing);
  }
  const allowed = new Set(['--gate', '--outcome', '--reviewer', '--notes', '--evidence']);
  for (const key of values.keys()) {
    if (!allowed.has(key)) throw new Error(`Unsupported manual review argument: ${key}`);
  }
  const gateId = values.get('--gate')?.[0] ?? '';
  const outcome = values.get('--outcome')?.[0];
  const reviewer = values.get('--reviewer')?.[0] ?? '';
  const notes = values.get('--notes')?.[0] ?? '';
  if (!gateId || (outcome !== 'approved' && outcome !== 'rejected') || !reviewer || !notes) {
    throw new Error('Usage: npm run validation:manual-review -- --gate <id> --outcome <approved|rejected> --reviewer <name> --notes <text> [--evidence <reference>]');
  }
  return {
    gateId,
    outcome,
    reviewer,
    notes,
    evidenceReferences: values.get('--evidence') ?? [],
  };
}

const review = await appendManualReview(parseArgs(process.argv.slice(2)));
await buildValidationEvidenceLedgerSnapshot(await readValidationSourceIdentity());
console.log(`Manual validation review recorded: ${review.reviewId}`);
