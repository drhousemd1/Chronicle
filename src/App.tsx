import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ArtStylesProvider } from "@/contexts/ArtStylesContext";
import Index from "./pages/Index";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const UiAuditPage = lazy(() => import("./pages/style-guide/ui-audit"));
const ApiInspectorPage = lazy(() => import("./pages/style-guide/api-inspector"));
const AppArchitecturePage = lazy(() => import("./pages/style-guide/app-architecture"));

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
              <Route path="/style-guide/ui-audit" element={<UiAuditPage />} />
              <Route path="/style-guide/api-inspector" element={<ApiInspectorPage />} />
              <Route path="/style-guide/app-architecture" element={<AppArchitecturePage />} />
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
