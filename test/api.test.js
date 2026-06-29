const test = require('node:test');
const assert = require('node:assert');
const app = require('../server.js');

let server;
let baseUrl;

test.before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => {
  server.close();
});

const noStore = (res) => assert.strictEqual(res.headers.get('cache-control'), 'no-store');
const securityHeaders = (res) => {
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('referrer-policy'), 'no-referrer');
  assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
  assert.ok(res.headers.get('content-security-policy').includes("default-src 'self'"));
};

test('GET /api/ping returns 204 with no-store', async () => {
  const res = await fetch(`${baseUrl}/api/ping`);
  assert.strictEqual(res.status, 204);
  noStore(res);
  securityHeaders(res);
});

test('GET /api/download clamps below the minimum to 64KB', async () => {
  const res = await fetch(`${baseUrl}/api/download?bytes=1000`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'application/octet-stream');
  noStore(res);
  assert.strictEqual(res.headers.get('content-length'), String(64 * 1024));
  const buf = await res.arrayBuffer();
  assert.strictEqual(buf.byteLength, 64 * 1024);
});

test('GET /api/download clamps above the maximum to 25MB', async () => {
  const res = await fetch(`${baseUrl}/api/download?bytes=999999999`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-length'), String(25 * 1024 * 1024));
});

test('GET /api/download defaults to 64KB when bytes is missing', async () => {
  const res = await fetch(`${baseUrl}/api/download`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-length'), String(64 * 1024));
});

test('GET /api/download falls back to default on non-numeric / negative bytes', async () => {
  for (const v of ['abc', '-1', 'NaN', '1.5', '0x10']) {
    const res = await fetch(`${baseUrl}/api/download?bytes=${encodeURIComponent(v)}`);
    assert.strictEqual(res.status, 200, `bytes=${v}`);
    assert.strictEqual(res.headers.get('content-length'), String(64 * 1024), `bytes=${v}`);
  }
});

test('GET /api/download advertises byte range support', async () => {
  const res = await fetch(`${baseUrl}/api/download?bytes=4096`);
  assert.strictEqual(res.headers.get('accept-ranges'), 'bytes');
});

test('GET /api/download honors Range: bytes=START-END with 206 + Content-Range', async () => {
  // Request above the 64KB minimum so it doesn't get clamped.
  const res = await fetch(`${baseUrl}/api/download?bytes=131072`, {
    headers: { Range: 'bytes=100-199' },
  });
  assert.strictEqual(res.status, 206);
  assert.strictEqual(res.headers.get('content-length'), '100');
  assert.strictEqual(res.headers.get('content-range'), 'bytes 100-199/131072');
  const buf = new Uint8Array(await res.arrayBuffer());
  assert.strictEqual(buf.length, 100);
});

test('GET /api/download returns 416 for out-of-range Range header', async () => {
  const res = await fetch(`${baseUrl}/api/download?bytes=131072`, {
    headers: { Range: 'bytes=99999999-' },
  });
  assert.strictEqual(res.status, 416);
  assert.ok(res.headers.get('content-range').startsWith('bytes */'));
});

test('POST /api/upload counts received bytes', async () => {
  const body = new Uint8Array(2048);
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body,
  });
  assert.strictEqual(res.status, 200);
  noStore(res);
  const json = await res.json();
  assert.strictEqual(json.bytesReceived, 2048);
});

test('POST /api/upload returns 413 when body exceeds 16MB', async () => {
  // 17 MB of zeros — over the 16 MB limit. The server should reject before
  // buffering the entire body (express.raw limit kicks in mid-stream).
  const body = new Uint8Array(17 * 1024 * 1024);
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body,
  });
  assert.ok(res.status === 413 || res.status === 400, `expected 413 or 400, got ${res.status}`);
});

test('GET /api/upload returns 405 with Allow: POST', async () => {
  const res = await fetch(`${baseUrl}/api/upload`);
  assert.strictEqual(res.status, 405);
  assert.strictEqual(res.headers.get('allow'), 'POST');
});

test('GET /api/ip returns ip and server', async () => {
  const res = await fetch(`${baseUrl}/api/ip`);
  assert.strictEqual(res.status, 200);
  noStore(res);
  const json = await res.json();
  assert.ok('ip' in json);
  assert.ok('server' in json);
  assert.ok(typeof json.server === 'string' && json.server.length > 0);
});

test('GET /healthz returns ok with uptime', async () => {
  const res = await fetch(`${baseUrl}/healthz`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.ok, true);
  assert.ok(typeof json.uptime === 'number' && json.uptime >= 0);
});

test('Source tree is not served over HTTP (no source leak)', async () => {
  // Static dir must not expose the source tree, .git, or any non-asset file.
  for (const path of ['server.js', 'package.json', 'test/api.test.js', '.git/HEAD', 'specs/']) {
    const res = await fetch(`${baseUrl}/${path}`);
    assert.ok(
      res.status === 404 || res.status === 403,
      `${path} should be blocked, got ${res.status}`
    );
  }
});
