# Sprint 10 — Image Upload & Processing/Variants

**Goal:** sellers upload product images to object storage; the app generates sized variants
(thumbnail/card/detail) and serves them responsively. No real cloud credentials — MinIO/filesystem.

## Scope

**In:** the `ObjectStore` port (`put`, `get`, `signedUrl`) with an S3/MinIO adapter and a filesystem
adapter (both credential-free locally/CI); an admin upload UI (drag-drop, progress, reorder, set
primary) — a client island posting to a server action / route handler; **image processing** with
`sharp` on upload to produce `thumb`/`card`/`detail` variants; validation (type, dimensions, size
cap); storefront serves via `next/image` with correct `sizes` and the primary as the LCP `priority`
image; cleanup of orphaned objects when an image is removed.

**Out:** a CDN, background/queue processing (processing is inline for now — noted as a scale seam),
video, AI tagging.

## Teaching focus

File upload end-to-end; the `ObjectStore` **port** so storage is a swap, not a rewrite; image variants
and responsive `sizes`; the same three states (uploading/error/empty) for an async UI; keeping the
LCP image un-lazy.

## Commit narrative (sketch)

1. `feat(port+adapters): ObjectStore + S3/MinIO + filesystem adapters (+ fakes)`
2. `feat(service): upload → validate → sharp variants → persist ProductImage`
3. `feat(admin): upload UI — drag-drop, progress, reorder, set primary`
4. `feat(storefront): responsive next/image with generated variants`
5. `test: upload validation, variant generation (in-memory store), orphan cleanup`
6. `docs: ADR-0011 object storage behind a port; concepts/images-and-lcp.md`

## Teaching placements

- 📘 the `ObjectStore` port: the app never imports the S3 SDK outside the adapter — same discipline as
  the payment gateway. 🔗 mirrors the S05 `PaymentGateway` seam.
- ⚠️ validate type/size **on the server** — a client accept-filter is a convenience, not a control.
- 🔍 generate variants once on upload, not per request; serve the right one via `sizes`.

## Debate

`[Reviewer]`: "Process images inline in the request? That'll block and time out on big uploads — queue
it." `[Author]`: inline is honest for the course's scale and keeps CI dependency-free; the **service
boundary** means moving to a queue later changes one call site. **Resolution (Reviewer wins a
follow-up):** inline now, but structure `processImage` as a standalone unit and record in ADR-0011 that
S13/S15 may move it behind a job runner if traces justify it. (A real Reviewer-wins concession.)

## Exercises

- Upload a 6000×6000 image. Do the generated `card`/`thumb` variants come out right, and is the LCP
  image un-lazy? Check the network waterfall.
- Swap the `ObjectStore` adapter from filesystem to MinIO with only an env change. What in the app had
  to change? (Nothing — that's the point.)
- Remove an image and confirm the orphaned objects are cleaned up.
