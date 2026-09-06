import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

const rawSelectedFiles = process.env.CHRONICLE_PRODUCT_TEST_FILES;
if (!rawSelectedFiles) {
  throw new Error(
    "Product test config requires the fail-closed npm run test:product runner.",
  );
}
const selectedFiles = JSON.parse(rawSelectedFiles) as unknown;
if (
  !Array.isArray(selectedFiles) ||
  selectedFiles.length === 0 ||
  selectedFiles.some((filePath) => typeof filePath !== "string")
) {
  throw new Error("Product test runner supplied an invalid exact-file selection.");
}

/**
 * This standalone harness is itself part of the source graph checked by
 * run-product-tests.ts. The exact validated files are supplied as `include`,
 * so Vitest does not reinterpret them as substring CLI filters.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: selectedFiles,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
