const express = require('express');
const crypto = require('crypto');

const app = express();

app.set('trust proxy', true);

const MIN_BYTES = 64 * 1024; // 64KB
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

// Generated once at startup; reused for every /api/download response.
const DOWNLOAD_BUFFER = crypto.randomBytes(MAX_BYTES);

app.use(express.static(__dirname));

app.get('/api/ping', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(204).end();
});

app.get('/api/download', (req, res) => {
  let bytes = parseInt(req.query.bytes, 10);
  if (!Number.isFinite(bytes)) bytes = MIN_BYTES;
  bytes = Math.min(Math.max(bytes, MIN_BYTES), MAX_BYTES);

  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': bytes,
    'Cache-Control': 'no-store',
  });
  res.end(DOWNLOAD_BUFFER.subarray(0, bytes));
});

app.post('/api/upload', (req, res) => {
  let bytesReceived = 0;
  req.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });
  req.on('end', () => {
    res.set('Cache-Control', 'no-store');
    res.json({ bytesReceived });
  });
});

app.get('/api/ip', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    ip: req.ip,
    server: process.env.SERVER_LABEL || 'gcp-showcase (us-central1)',
  });
});

const PORT = process.env.PORT || 8082;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Speed test server listening on port ${PORT}`);
  });
}

module.exports = app;
