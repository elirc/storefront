// A no-op stand-in for the `server-only` marker package, aliased in vitest.config.ts.
//
// `server-only` exists to make a build FAIL if server code is imported into a Client Component:
// its `default` export throws. That is exactly what we want in the app — but Vitest runs services
// in plain Node (no `react-server` condition), so the real module would throw the moment a test
// imports `server/services/*`. Aliasing it to this empty module lets us unit-test the service's
// mapping logic directly, while the real guard still protects the real bundle. (The layering
// ESLint rule is the static half of that guard and runs unchanged in `pnpm lint`.)
export {};
