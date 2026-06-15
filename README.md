# Speed Test

A simple, single-page network speed test. Measures download speed, upload
speed, and ping against the server hosting this site, with live-updating
results and connection details (your IP and the test server's identity).

## Features

- Download, upload, and ping measurements (Mbps / ms)
- Live progress updates at least once per second during transfer phases
- Connection details (your public IP and the test server's location)
- Responsive layout (320px and up)
- Clear error/retry state if a test fails

## Setup

Requires Node.js 20+.

```bash
npm install
npm start
```

The server starts on `http://localhost:8082` (or `$PORT` if set) and serves
the page and API from the same origin.

## Configuration

- `PORT` — port to listen on (default `8082`)
- `SERVER_LABEL` — label shown to visitors identifying this server/location
  (default `gcp-showcase (us-central1)`)

## Testing

```bash
npm test
```

Runs the `node --test` API contract tests against `/api/ping`,
`/api/download`, `/api/upload`, and `/api/ip`.

For end-to-end UI validation, see
[`specs/001-speed-test-website/quickstart.md`](specs/001-speed-test-website/quickstart.md).

## How it works

- **Ping**: 5 sequential requests to `/api/ping`, discarding the first
  (connection warm-up) and reporting the median round-trip time.
- **Download**: streams a generated payload from `/api/download`, reading it
  incrementally via the Streams API to compute live and final throughput.
- **Upload**: sends a generated payload to `/api/upload` via `XMLHttpRequest`,
  using `upload.onprogress` for live throughput readings.
- **Connection details**: `/api/ip` returns the visitor's public IP (via
  Express `trust proxy`) and a static server label.

## License

[MIT](LICENSE)
