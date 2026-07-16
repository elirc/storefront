import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// 🔗 [Author] This file IS the layering rule — architecture you can *fail* (see ADR-0001).
// The Storefront thesis is "the server owns the truth; the client owns the experience," and
// the seam between them is where real apps break. `eslint-plugin-boundaries` turns that seam
// into a lint error: a Client Component that reaches for the database, or a service that
// imports `next/*`, fails `pnpm lint` exactly like a broken test. It is never weakened to
// pass a sprint — if it fights the design, the design changes and we record it in an ADR.
//
// The allowed import directions below are the table in docs/curriculum/SPEC.md §5, verbatim.
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "db/prisma/migrations/**",
      "next-env.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Next.js rules (react-hooks, jsx-a11y, @next/next) via FlatCompat, since
  // eslint-config-next still ships as an eslintrc-style config.
  ...compat.extends("next/core-web-vitals"),

  // ---- The layering fitness rule ---------------------------------------------------------
  {
    plugins: { boundaries },
    settings: {
      // Each architectural layer is an "element", identified purely by its path.
      "boundaries/elements": [
        { type: "lib", pattern: "lib/**" },
        { type: "ports", pattern: "server/ports/**" },
        { type: "data", pattern: "server/data/**" },
        { type: "services", pattern: "server/services/**" },
        { type: "adapters", pattern: "server/adapters/**" },
        { type: "actions", pattern: "server/actions/**" },
        { type: "app", pattern: "app/**" },
        { type: "components", pattern: "components/**" },
      ],
      // Resolve the `@/*` path alias so boundaries can map an import to its element.
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      // Who-may-import-whom, between our own layers.
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: ["lib"], allow: ["lib"] },
            { from: ["ports"], allow: ["lib", "ports"] },
            { from: ["data"], allow: ["lib", "ports", "data"] },
            // services: NOTE the absence of `adapters` — services depend on ports, not
            // concretions. And see boundaries/external below: no next/*, React, or Prisma.
            { from: ["services"], allow: ["lib", "ports", "data", "services"] },
            { from: ["adapters"], allow: ["lib", "ports", "adapters"] },
            { from: ["actions"], allow: ["lib", "ports", "services", "actions"] },
            // The browser-facing layer. It may call services (RSC reads) and actions
            // (writes), and use ports as *types* — but it may NEVER import `data` or
            // `adapters`. That is the client↔server leak this whole rule exists to stop.
            {
              from: ["app", "components"],
              allow: ["lib", "services", "actions", "ports", "app", "components"],
            },
          ],
        },
      ],
      // Which third-party packages a layer may touch.
      "boundaries/external": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["lib"],
              disallow: ["next", "next/*", "react", "react-dom", "@prisma/client", "server-only"],
              message: "lib/ is a framework-free leaf — '{{dep}}' does not belong here.",
            },
            {
              // 🔍 [Reviewer] The rule that keeps the domain pure: a service is business
              // logic, testable with fakes and zero framework. Reaching for next/*, React,
              // Prisma, or a vendor SDK here is the smell this line makes fail CI.
              from: ["services"],
              disallow: [
                "next",
                "next/*",
                "react",
                "react-dom",
                "@prisma/client",
                "stripe",
                "@stripe/*",
                "@aws-sdk/*",
              ],
              message:
                "server/services must not import next/*, React, Prisma, or a vendor SDK ('{{dep}}'). Depend on a port instead.",
            },
            {
              from: ["ports"],
              disallow: ["next", "next/*", "react", "react-dom", "@prisma/client"],
              message: "server/ports are pure interfaces — '{{dep}}' does not belong here.",
            },
          ],
        },
      ],
    },
  },

  // Config/build scripts and test tooling are not application layers.
  {
    files: [
      "*.config.{ts,mjs,js}",
      "vitest.config.ts",
      "playwright.config.ts",
      "db/prisma/seed.ts",
      "test/**",
      "e2e/**",
    ],
    rules: {
      "boundaries/element-types": "off",
      "boundaries/external": "off",
    },
  },

  // Prettier last: turn off stylistic rules that would fight the formatter.
  prettier,
);
