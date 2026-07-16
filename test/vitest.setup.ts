// Global Vitest setup. `@testing-library/jest-dom/vitest` augments `expect` with DOM
// matchers (toBeInTheDocument, toHaveAccessibleName, ...) — the vocabulary S02's component
// tests use to assert *behavior and accessibility*, not markup.
import "@testing-library/jest-dom/vitest";
