# API Contracts: Network Speed Test Website

All endpoints are same-origin, served by the same Express app as the static frontend. All responses include `Cache-Control: no-store` and are excluded from any response-compression middleware so payload sizes on the wire match the values described below.

## GET /api/ping

Used by the client to measure latency (FR-003).

- **Request**: no parameters.
- **Response**: `204 No Content`, empty body, returned as fast as possible.
- **Headers**: `Cache-Control: no-store`.

## GET /api/download

Used by the client to measure download throughput (FR-001, FR-004).

- **Query parameters**:
  - `bytes` (integer, optional): number of bytes to stream. Server clamps to a sane range (e.g. min 64KB, max 25MB) to bound test duration (Edge Cases: slow connections must still complete).
- **Response**: `200 OK`, `Content-Type: application/octet-stream`, `Content-Length: <bytes>`, body is `<bytes>` bytes of non-compressible data, sent as a stream so the client can read it incrementally for live progress.
- **Headers**: `Cache-Control: no-store`, no `Content-Encoding`.

## POST /api/upload

Used by the client to measure upload throughput (FR-002, FR-004).

- **Request**: `Content-Type: application/octet-stream`, body is a client-generated payload of arbitrary size (client controls size to bound duration).
- **Response**: `200 OK`, JSON body `{ "bytesReceived": <number> }` — the server reads and discards the request body, counting bytes.
- **Headers**: `Cache-Control: no-store`.

## GET /api/ip

Used to populate connection details after a test (FR-006, User Story 3).

- **Request**: no parameters.
- **Response**: `200 OK`, JSON body:
  ```json
  { "ip": "203.0.113.42", "server": "gcp-showcase (us-central1)" }
  ```
  - `ip`: the visitor's public IP as seen by the server (`req.ip` with Express `trust proxy` enabled, reading `X-Forwarded-For` from Nginx).
  - `server`: static label identifying this test server/location.
- **Headers**: `Cache-Control: no-store`.

## Error behavior (all endpoints)

If a request to any of the above fails or times out, the frontend treats it as a test failure and shows the error/retry state described in FR-008 — no endpoint-specific error payload is required beyond standard HTTP error status codes (e.g. `500` on unexpected server error).
