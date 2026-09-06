import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ArtStylesProvider } from "@/contexts/ArtStylesContext";
import { useAuth } from "@/hooks/use-auth";
import { checkIsAdmin, writeCachedAdminState } from "@/services/app-settings";
import Index from "./pages/Index";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const UiAuditPage = lazy(() => import("./pages/style-guide/ui-audit"));
const ChronicleKnowledgeBasePage = lazy(() => import("./pages/style-guide/chronicle-knowledge-base"));
const ChangelogRecordPage = lazy(() => import("./pages/style-guide/changelog-record"));
const ValidationEvidenceLedgerPage = lazy(() => import("./pages/style-guide/validation-evidence-ledger"));
const SupabaseSchemaReferencePage = lazy(() => import("./pages/style-guide/supabase-schema-reference"));

export const AdminOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const requestedUserId = user?.id ?? null;
  const [adminState, setAdminState] = useState<{ userId: string | null; isAdmin: boolean | null }>({
    userId: null,
    isAdmin: null,
  });
  const isAdmin = adminState.userId === requestedUserId ? adminState.isAdmin : null;

  useEffect(() => {
    let cancelled = false;

    if (loading) {
      return () => {
        cancelled = true;
      };
    }

    if (!isAuthenticated || !user?.id) {
      writeCachedAdminState(false);
      setAdminState({ userId: requestedUserId, isAdmin: false });
      return () => {
        cancelled = true;
      };
    }

    setAdminState({ userId: requestedUserId, isAdmin: null });
    checkIsAdmin(user?.id).then((isAllowed) => {
      if (cancelled) return;
      writeCachedAdminState(isAllowed);
      setAdminState({ userId: requestedUserId, isAdmin: isAllowed });
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading, requestedUserId, user?.id]);

  if (loading || (isAuthenticated && isAdmin === null)) return null;
  if (!isAuthenticated) return <Navigate to="/?auth=1" replace />;
  if (isAdmin === false) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ArtStylesProvider>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Navigate to="/?auth=1" replace />} />
              <Route path="/creator/:userId" element={<CreatorProfile />} />
              <Route path="/style-guide/ui-audit" element={<AdminOnlyRoute><UiAuditPage key="quality-hub-normal" /></AdminOnlyRoute>} />
              <Route path="/style-guide/ui-audit/changelog-migration-capture" element={<AdminOnlyRoute><UiAuditPage key="quality-hub-changelog-migration-capture" migrationCaptureMode /></AdminOnlyRoute>} />
              <Route path="/style-guide/chronicle-knowledge-base/archive/:projectId" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />
              <Route path="/style-guide/chronicle-knowledge-base/work-manual" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />
              <Route path="/style-guide/chronicle-knowledge-base/work-manual/:chapterId" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />
              <Route path="/style-guide/chronicle-knowledge-base" element={<AdminOnlyRoute><ChronicleKnowledgeBasePage /></AdminOnlyRoute>} />
              <Route path="/style-guide/changelog/:recordId" element={<AdminOnlyRoute><ChangelogRecordPage /></AdminOnlyRoute>} />
              <Route path="/style-guide/validation-evidence-ledger" element={<AdminOnlyRoute><ValidationEvidenceLedgerPage /></AdminOnlyRoute>} />
              <Route path="/style-guide/supabase-schema-reference" element={<AdminOnlyRoute><SupabaseSchemaReferencePage /></AdminOnlyRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster richColors position="top-right" closeButton />
      </TooltipProvider>
    </ArtStylesProvider>
  </QueryClientProvider>
);

export default App;
