import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest is the unit + component runner: pure `lib/` and services with fakes for every
// port, and (from S02) Testing Library component tests. Zero DB, zero network — fast enough
// to run on save. Playwright's browser specs live under e2e/ and are excluded here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only`'s default export throws (it guards the real bundle). In Node/Vitest that
      // would blow up any test importing a service, so we alias it to a no-op here — the mapping
      // logic is testable, and the ESLint boundaries rule still enforces the seam in `pnpm lint`.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
