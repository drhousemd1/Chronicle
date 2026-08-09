import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('src/App.tsx', 'utf8');

describe('App internal tool route authorization', () => {
  it('protects current operator routes and omits retired documentation routes', () => {
    expect(source).toContain('const AdminOnlyRoute = ({ children }: { children: ReactNode }) => {');
    expect(source).toContain('checkIsAdmin(user?.id)');
    expect(source).toContain('writeCachedAdminState(isAllowed)');
    expect(source).toContain('if (!isAuthenticated) return <Navigate to="/?auth=1" replace />;');
    expect(source).toContain('if (isAdmin === false) return <Navigate to="/" replace />;');
    expect(source).toContain('<Route path="/style-guide/ui-audit" element={<AdminOnlyRoute><UiAuditPage key="quality-hub-normal" /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/ui-audit/changelog-migration-capture" element={<AdminOnlyRoute><UiAuditPage key="quality-hub-changelog-migration-capture" migrationCaptureMode /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/chronicle-knowledge-base/archive/:projectId" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/chronicle-knowledge-base" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/changelog/:recordId" element={<AdminOnlyRoute><ChangelogRecordPage /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/validation-evidence-ledger" element={<AdminOnlyRoute><ValidationEvidenceLedgerPage /></AdminOnlyRoute>} />');
    expect(source).not.toContain('const ApiInspectorPage = lazy(');
    expect(source).not.toContain('<Route path="/style-guide/api-inspector"');
    expect(source).not.toContain('const AppArchitecturePage = lazy(');
    expect(source).not.toContain('<Route path="/style-guide/app-architecture"');
  });
});
