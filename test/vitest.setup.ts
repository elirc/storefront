// Global Vitest setup. `@testing-library/jest-dom/vitest` augments `expect` with DOM matchers
// (toBeInTheDocument, toHaveAccessibleName, ...) — the vocabulary S02's component tests use to
// assert *behavior and accessibility*, not markup.
import "@testing-library/jest-dom/vitest";

// Unmount and clear the DOM between tests. RTL auto-registers this only when Vitest's globals are
// enabled; we keep explicit imports in tests instead, so register cleanup here — otherwise renders
// pile up in one jsdom document and `getAllByRole` sees the previous test's nodes too.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
