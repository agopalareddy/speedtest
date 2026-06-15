# Research: Network Speed Test Website

## Decision: Measurement transport — plain HTTP via `fetch`, no WebSocket/WebRTC

**Rationale**: The site must work in modern browsers with no plugins/accounts and tolerate privacy extensions/ad blockers (edge case in spec). Plain `fetch`/XHR requests to same-origin endpoints are the most broadly compatible option, pass through Nginx with zero extra config, and are simple to implement and reason about. WebSocket/WebRTC add server and proxy complexity for no measurable accuracy benefit at this scale.

**Alternatives considered**:
- WebSocket streaming: more complex Nginx/PM2 setup (upgrade headers, keepalive), no real accuracy gain for simple throughput tests.
- WebRTC data channels: designed for peer-to-peer; massive overkill and harder to debug for a single-server test.

## Decision: Download measurement — server streams a fixed-size generated buffer

**Rationale**: `/api/download?bytes=N` streams `N` bytes (capped, e.g. 25MB max) of pre-generated, non-compressible data (random bytes generated once at server start and repeated/sliced) with `Cache-Control: no-store` and `Content-Encoding` left untouched (compression disabled for this route) so the wire size matches `N`. The frontend reads the response body via the Streams API (`response.body.getReader()`), accumulating bytes received and timestamps to compute live and final Mbps.

**Alternatives considered**:
- Generating fresh random bytes per request with `crypto.randomBytes`: unnecessary CPU cost; reused buffer is indistinguishable for throughput purposes and avoids blocking the event loop on large requests.
- Serving a static file: works, but a static asset could be cached/compressed by Nginx unless special-cased — a dedicated route keeps cache/compression control in the app.

## Decision: Upload measurement — client streams a generated Blob to `POST /api/upload`

**Rationale**: The frontend generates an in-memory `Blob`/`ArrayBuffer` of a target size and `fetch`/XHR POSTs it to `/api/upload`. XHR's `upload.onprogress` gives periodic progress events (≥1/sec) for the live reading; the server reads and discards the body (counting bytes) and responds with `{ bytesReceived }`. `fetch` is used where `ReadableStream` request bodies are supported, falling back to XHR for `upload.onprogress` (XHR's progress event is the most broadly supported way to get live upload progress across target browsers).

**Alternatives considered**:
- Chunked `fetch` with a `ReadableStream` body for progress: not yet supported in all target browsers (notably Safari); XHR progress events are simpler and universally supported.

## Decision: Ping measurement — repeated small round trips to `/api/ping`

**Rationale**: The frontend issues several (e.g. 5) sequential `fetch` requests to a trivial `GET /api/ping` (returns `204 No Content` immediately, `Cache-Control: no-store`), times each round trip, discards the first (connection warm-up), and reports the median of the rest as the ping in ms.

**Alternatives considered**:
- Single ping: too noisy/unreliable for a representative number.
- ICMP ping: not available from browser JS; HTTP round-trip is the standard substitute used by browser-based speed tests.

## Decision: Public IP and server identity — derived from the request on the server

**Rationale**: `GET /api/ip` returns `{ ip, server }`. `ip` is taken from `req.ip` with Express `trust proxy` enabled (so the real client IP is read from `X-Forwarded-For`, set by Nginx) — this matches the existing reverse-proxy deployment. `server` is a small static label (e.g. hostname/location string) read from an environment variable or hard-coded constant, since the spec only requires showing "which server they were tested against," not a dynamic multi-server registry.

**Alternatives considered**:
- Calling an external "what's my IP" API from the browser: adds an external dependency and a third-party request, which the spec doesn't require since the server already sees the client's IP on every request.

## Decision: Disable compression/caching for measurement routes

**Rationale**: If Nginx or `compression` middleware gzips the download payload or caches responses, measured throughput would no longer reflect real transfer size (violating SC-002). The Express app will not use `compression` middleware (or will explicitly bypass it for `/api/*` routes), and all measurement responses set `Cache-Control: no-store`. The Nginx config for this site should also avoid `gzip` on the `/api/download` path — to be confirmed/documented during implementation against the actual Nginx config for this host.

**Alternatives considered**: None — this is a correctness requirement, not a choice.

## Decision: Testing approach — `node --test` for API contracts, manual quickstart for UI

**Rationale**: Matches "no new dependencies" preference of sibling projects (no Jest/Mocha installed elsewhere in the workspace). Node's built-in test runner is sufficient to assert `/api/ping`, `/api/download`, `/api/upload`, `/api/ip` return correct status codes, headers, and payload sizes. End-to-end UI behavior (live updates, error states, responsive layout) is validated manually via `quickstart.md`, consistent with the small scale of this project.

**Alternatives considered**: Adding Playwright/Jest — extra dependencies and CI setup not justified for a single-page personal project.
