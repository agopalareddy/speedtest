# Data Model: Speed Test Enhancements

All state is client-side (in-memory + `sessionStorage`); no database or server-side model changes.

## Test Result

Represents one completed run of the test, shown as the current result and/or as an entry in the history list.

| Field | Type | Notes |
|-------|------|-------|
| `downloadMbps` | number | Median of 3 download samples |
| `uploadMbps` | number | Median of 3 upload samples |
| `pingMs` | number | Median of ping samples (after warm-up discard) |
| `jitterMs` | number | max - min of post-warm-up ping samples |
| `ip` | string | From `/api/ip` |
| `server` | string | From `/api/ip` |
| `qualityLabel` | string | Derived from `downloadMbps` via the tiers in research.md (FR-004) |
| `timestamp` | number (epoch ms) | Set client-side when the run completes; used for display ordering |

### Validation / derivation rules

- `downloadMbps`, `uploadMbps`, `pingMs`, `jitterMs` MUST be non-negative finite numbers; a failed/aborted run does not produce a `Test Result` (existing error-path behavior unchanged).
- `qualityLabel` is computed purely from `downloadMbps` — no persistence of the tier thresholds themselves.

### Lifecycle

- On test completion, the `Test Result` becomes the "current result" displayed in the results card, AND is appended to the front of the history array stored in `sessionStorage` (key e.g. `speedtest.history`).
- History array is capped only by session lifetime; cleared automatically when the tab/session ends (sessionStorage semantics satisfy FR-006).
