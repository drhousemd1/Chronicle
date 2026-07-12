import { access } from 'node:fs/promises';

import { buildValidationEvidenceLedgerSnapshot } from '../src/features/validation-evidence/ledger-file.ts';
import { reconcileLegacyValidationEvidence } from '../src/features/validation-evidence/reconciliation.ts';
import { readValidationSourceIdentity } from '../src/features/validation-evidence/source-identity.ts';

const publicLedgerPath = 'public/validation-evidence/generated/roleplay-pipeline-ledger.json';
const archivedLedgerPath = '.validation-evidence/roleplay-pipeline/legacy-source-public/generated/roleplay-pipeline-ledger.json';
const hasPublicSource = await access(publicLedgerPath).then(() => true).catch(() => false);
const report = await reconcileLegacyValidationEvidence(hasPublicSource ? {} : {
  ledgerPath: archivedLedgerPath,
  reportDirectory: '.validation-evidence/roleplay-pipeline/legacy-source-public/reports',
});
await buildValidationEvidenceLedgerSnapshot(await readValidationSourceIdentity());

console.log(JSON.stringify({
  totalRows: report.totalRows,
  matched: report.matched,
  orphaned: report.orphaned,
  malformed: report.malformed,
  duplicateIds: report.duplicateIds,
  missingReports: report.missingReports,
  orphanReports: report.orphanReports,
}, null, 2));

if (report.malformed > 0 || report.duplicateIds.length > 0 || report.missingReports.length > 0) {
  process.exitCode = 1;
}
