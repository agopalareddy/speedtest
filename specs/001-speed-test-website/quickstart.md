# Quickstart: Network Speed Test Website

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:8082` (or `$PORT` if set), serving the page and API from the same origin.

## Validate User Story 1 — Run a speed test (P1)

1. Open `http://localhost:8082` in a browser.
2. Click "Start Test".
3. Wait for the run to finish (under ~30s).
4. **Expected**: download Mbps, upload Mbps, and ping (ms) are all displayed.
5. Click "Start Test" again.
6. **Expected**: previous results are replaced by a fresh measurement (spec Acceptance Scenario 2).
7. Resize the browser window down to 320px wide (or open on a phone).
8. **Expected**: no horizontal scrolling, all controls and results remain usable (spec Acceptance Scenario 3 / SC-003).

## Validate User Story 2 — Live progress (P2)

1. Start a test and watch the displayed value during the download phase.
2. **Expected**: the number updates at least once per second while data is being received (FR-004).
3. Watch the transition from download to upload.
4. **Expected**: the UI clearly indicates which phase ("Download" vs "Upload") is currently running.

## Validate User Story 3 — Connection details (P3)

1. Complete a test.
2. **Expected**: the results view shows the visitor's public IP address and the test server's name/location, per `GET /api/ip`.

## Validate edge cases

- **Network failure mid-test**: stop the server (`Ctrl+C`) while a test is running, or block requests via browser devtools (Network → offline).
  - **Expected**: the UI shows a clear error/retry message instead of hanging (FR-008).
- **Reload mid-test**: start a test, then reload the page before it finishes.
  - **Expected**: the page resets to the start state with no partial result shown.

## API contract checks

```bash
node --test
```

Runs the endpoint contract tests covering `/api/ping`, `/api/download`, `/api/upload`, and `/api/ip` against `contracts/api.md`.
