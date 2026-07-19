import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('src/App.tsx', 'utf8');

describe('App internal tool route authorization', () => {
  it('wraps standalone style-guide operator routes in the admin-only route guard', () => {
    expect(source).toContain('const AdminOnlyRoute = ({ children }: { children: ReactNode }) => {');
    expect(source).toContain('checkIsAdmin(user?.id)');
    expect(source).toContain('writeCachedAdminState(isAllowed)');
    expect(source).toContain('if (!isAuthenticated) return <Navigate to="/?auth=1" replace />;');
    expect(source).toContain('if (isAdmin === false) return <Navigate to="/" replace />;');
    expect(source).toContain('<Route path="/style-guide/ui-audit" element={<AdminOnlyRoute><UiAuditPage /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/api-inspector" element={<AdminOnlyRoute><ApiInspectorPage /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/app-architecture" element={<AdminOnlyRoute><AppArchitecturePage /></AdminOnlyRoute>} />');
    expect(source).toContain('<Route path="/style-guide/validation-evidence-ledger" element={<AdminOnlyRoute><ValidationEvidenceLedgerPage /></AdminOnlyRoute>} />');
  });
});
