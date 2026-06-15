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

test('GET /api/ping returns 204 with no-store', async () => {
  const res = await fetch(`${baseUrl}/api/ping`);
  assert.strictEqual(res.status, 204);
  assert.strictEqual(res.headers.get('cache-control'), 'no-store');
});

test('GET /api/download clamps below the minimum to 64KB', async () => {
  const res = await fetch(`${baseUrl}/api/download?bytes=1000`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'application/octet-stream');
  assert.strictEqual(res.headers.get('cache-control'), 'no-store');
  assert.strictEqual(res.headers.get('content-length'), String(64 * 1024));
  const buf = await res.arrayBuffer();
  assert.strictEqual(buf.byteLength, 64 * 1024);
});

test('GET /api/download clamps above the maximum to 25MB', async () => {
  const res = await fetch(`${baseUrl}/api/download?bytes=999999999`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-length'), String(25 * 1024 * 1024));
});

test('POST /api/upload counts received bytes', async () => {
  const body = new Uint8Array(2048);
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body,
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('cache-control'), 'no-store');
  const json = await res.json();
  assert.strictEqual(json.bytesReceived, 2048);
});

test('GET /api/ip returns ip and server', async () => {
  const res = await fetch(`${baseUrl}/api/ip`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('cache-control'), 'no-store');
  const json = await res.json();
  assert.ok(typeof json.ip === 'string');
  assert.ok(typeof json.server === 'string');
});
