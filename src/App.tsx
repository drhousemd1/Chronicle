import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ArtStylesProvider } from "@/contexts/ArtStylesContext";
import Index from "./pages/Index";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";
import UiAuditPage from "./pages/style-guide/ui-audit";
import ApiInspectorPage from "./pages/style-guide/api-inspector";
import AppArchitecturePage from "./pages/style-guide/app-architecture";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ArtStylesProvider>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
        </BrowserRouter>
      </TooltipProvider>
    </ArtStylesProvider>
  </QueryClientProvider>
);

export default App;
