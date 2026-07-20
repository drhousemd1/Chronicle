import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { validationEvidenceDevPlugin } from "./src/features/validation-evidence/dev-middleware";

function packageChunk(id: string) {
  if (!id.includes("node_modules")) return undefined;

  if (id.includes("@supabase")) return "vendor-supabase";
  if (id.includes("recharts")) return "vendor-charts";
  if (id.includes("/compromise/")) return "vendor-nlp";

  if (
    id.includes("react-dom") ||
    id.includes("/react/") ||
    id.includes("scheduler") ||
    id.includes("@radix-ui") ||
    id.includes("@floating-ui") ||
    id.includes("lucide-react") ||
    id.includes("sonner") ||
    id.includes("cmdk") ||
    id.includes("vaul") ||
    id.includes("react-remove-scroll") ||
    id.includes("react-remove-scroll-bar") ||
    id.includes("react-style-singleton") ||
    id.includes("use-callback-ref") ||
    id.includes("use-sidecar") ||
    id.includes("tailwind-merge") ||
    id.includes("class-variance-authority") ||
    id.includes("clsx")
  ) {
    return "vendor-core";
  }

  if (
    id.includes("react-router") ||
    id.includes("@remix-run/router")
  ) {
    return "vendor-router";
  }

  if (id.includes("jszip") || id.includes("turndown")) {
    return "vendor-doc-transfer";
  }

  if (id.includes("zod")) return "vendor-validation";

  if (id.includes("@tanstack")) return "vendor-query";

  return "vendor-core";
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), validationEvidenceDevPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: packageChunk,
      },
    },
  },
}));
