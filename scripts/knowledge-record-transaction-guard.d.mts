export type KnowledgeTransactionGuardStatus = Readonly<{
  ok: boolean;
  repositoryRoot: string;
  gitDirectory: string;
  transactionRoot: string;
  writerLockPresent: boolean;
  activeCertificationLeaseCount: number;
  unfinishedTransactionIds: readonly string[];
  recoveryArtifactsPresent: boolean;
}>;

export function inspectKnowledgeTransactionGuard(options: Readonly<{
  repoRoot: string;
}>): KnowledgeTransactionGuardStatus;

export type ActiveKnowledgeCertificationContext = Readonly<{
  repositoryRoot: string;
  leaseId: string;
  command: string;
}>;

export function assertActiveKnowledgeCertificationContext(options: Readonly<{
  repoRoot: string;
  expectedCommand: string;
}>): ActiveKnowledgeCertificationContext;

export function assertNoUnfinishedKnowledgeTransaction(options: Readonly<{
  repoRoot: string;
}>): KnowledgeTransactionGuardStatus;
