import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@tanstack/react-query")) return "vendor-query";
            if (id.includes("recharts")) return "vendor-charts";
            if (
              id.includes("marked") ||
              id.includes("turndown") ||
              id.includes("react-markdown") ||
              id.includes("remark-") ||
              id.includes("rehype-") ||
              id.includes("highlight.js")
            ) {
              return "vendor-markdown";
            }
            return "vendor-misc";
          }

          if (id.includes("/src/components/admin/") || id.includes("/src/pages/style-guide/")) {
            return "admin-tools";
          }

          if (
            id.includes("/src/components/chronicle/ChatInterfaceTab") ||
            id.includes("/src/features/story-builder/") ||
            id.includes("/src/features/character-builder/") ||
            id.includes("/src/features/character-editor-modal/")
          ) {
            return "builder-chat";
          }
        },
      },
    },
  },
}));
