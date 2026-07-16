// Ambient declarations that let `tsc --noEmit` (the `typecheck` gate) resolve Next's
// non-TS imports — CSS side-effect imports (`import "./globals.css"`) and static assets —
// WITHOUT depending on the build-generated `next-env.d.ts`.
//
// WHY: CI runs `pnpm typecheck` BEFORE `pnpm build`, and `next-env.d.ts` is gitignored
// (Next regenerates it on build). This committed file gives the typechecker the same
// ambient `next` types up front, so the gate is deterministic and build-order-independent.
/// <reference types="next" />
/// <reference types="next/image-types/global" />
