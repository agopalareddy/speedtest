# Data Model: Network Speed Test Website

No database or server-side persistence is used (per spec Assumptions). The entities below exist only transiently — server-side for the duration of a single request, or client-side (in browser memory/JS variables) for the duration of a visit.

## Speed Test Result (client-side, in-memory)

Represents the outcome of a single test run, held in the browser until the page is closed or a new test starts.

| Field         | Type     | Notes |
|---------------|----------|-------|
| downloadMbps  | number   | Computed from bytes received / elapsed time during the download phase |
| uploadMbps    | number   | Computed from bytes sent / elapsed time during the upload phase |
| pingMs        | number   | Median of round-trip times to `/api/ping` |
| timestamp     | string   | ISO 8601 time the test completed (client clock) |
| server        | string   | Label of the server tested against, from `/api/ip` |

- Not persisted: a page reload or new test discards the previous result (FR-005, Edge Cases).
- Exactly one result is "current" at a time — starting a new test replaces it.

## Client Connection Info (client-side, derived from `/api/ip`)

Supplementary info shown alongside results (User Story 3).

| Field   | Type   | Notes |
|---------|--------|-------|
| ip      | string | Visitor's public IP as seen by the server (`req.ip`, with `trust proxy` enabled) |
| server  | string | Static label identifying the test server/location (config constant or env var) |

## Server-side request state (transient, per-request only)

No entity is persisted across requests. For `/api/upload`, the server tracks `bytesReceived` only for the lifetime of that single request/response cycle, then discards it.
