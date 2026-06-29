const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();

// Trust the first upstream hop (GCP load balancer). `true` would trust any
// X-Forwarded-For value, which is client-controlled and let any caller spoof
// their IP into /api/ip.
app.set('trust proxy', 1);

const MIN_BYTES = 64 * 1024; // 64KB
const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const UPLOAD_MAX_BYTES = 16 * 1024 * 1024; // 16MB — matches frontend chunk size

// Generated once at startup; reused for every /api/download response.
const DOWNLOAD_BUFFER = crypto.randomBytes(MAX_BYTES);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  // CSP: lock the app down. Google Fonts is the only external origin we need.
  // style-src 'unsafe-inline' because the gauge SVG sets inline stroke colors.
  "Content-Security-Policy":
    "default-src 'self'; " +
    "img-src 'self' data:; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "script-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'",
};

app.use((_req, res, next) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  next();
});

// CORS is off by default — the app is same-origin. Set CORS_ORIGIN to a
// comma-separated list of origins to allow cross-origin API consumption
// (e.g. an external dashboard pulling the same endpoints). Empty default
// means no Access-Control-Allow-Origin header is ever sent.
if (process.env.CORS_ORIGIN) {
  const allow = process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: allow, methods: ['GET', 'POST'] }));
}

// Speed-test endpoints are bursty by design: a single full test issues
// 7 pings + a few hundred /api/download fetches + a handful of /api/upload
// XHRs, all from one IP. 600/min ≈ 10/s sustained, enough for one
// concurrent full test with headroom for the next start.
const speedtestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

const staticLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Whitelist the assets the browser actually needs. Without this, express.static
// happily serves server.js, test/, specs/, .git/, .claude/, .specify/, etc.
const STATIC_ALLOWLIST = new Set(['', '/', '/index.html', '/style.css', '/app.js', '/theme-init.js', '/favicon.ico']);
app.use((req, res, next) => {
  // Only GET/HEAD on the allowlist, or anything under /api/* or /healthz.
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (STATIC_ALLOWLIST.has(req.path)) return next();
    if (req.path.startsWith('/api/') || req.path === '/healthz') return next();
    return res.status(404).end();
  }
  next();
});
app.use(
  express.static(__dirname, {
    index: 'index.html',
    dotfiles: 'deny',
    redirect: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        // index.html must revalidate so deploys roll out fast. Other assets
        // are content-hashed by their filename (we never use query strings).
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }),
);

app.get('/api/ping', speedtestLimiter, (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(204).end();
});

app.get('/api/download', speedtestLimiter, (req, res) => {
  // Reject non-numeric / negative / NaN / Infinity / floating-point.
  // `req.query.bytes` is a string in Express 5; coerce first, then validate.
  const parsed = Number(req.query.bytes);
  let bytes = Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
  if (!Number.isFinite(bytes) || bytes < 0) bytes = MIN_BYTES;
  bytes = Math.min(Math.max(bytes, MIN_BYTES), MAX_BYTES);

  // Honor Range: bytes=start-end so HEAD probes / partial readers work. The
  // speed test client doesn't actually use this, but it's cheap and correct.
  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] === '' ? bytes - 1 : Math.min(Number(match[2]), bytes - 1);
      if (start >= 0 && start <= end) {
        const length = end - start + 1;
        res.status(206);
        res.set({
          'Content-Type': 'application/octet-stream',
          'Content-Length': length,
          'Content-Range': `bytes ${start}-${end}/${bytes}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
        });
        return res.end(DOWNLOAD_BUFFER.subarray(start, end + 1));
      }
    }
    res.status(416).set('Content-Range', `bytes */${bytes}`).end();
    return;
  }

  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': bytes,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });
  res.end(DOWNLOAD_BUFFER.subarray(0, bytes));
});

// Bound upload size so a misbehaving (or hostile) client can't stream forever.
// express.raw() parses the body into a Buffer; once it exceeds `limit`,
// the request emits an 'error' and the body is dropped.
app.post(
  '/api/upload',
  speedtestLimiter,
  express.raw({ limit: UPLOAD_MAX_BYTES + 1024, type: 'application/octet-stream' }),
  (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf)) {
      return res.status(400).json({ error: 'Expected application/octet-stream body.' });
    }
    if (buf.length > UPLOAD_MAX_BYTES) {
      return res.status(413).json({ error: `Upload exceeds ${UPLOAD_MAX_BYTES} bytes.` });
    }
    res.set('Cache-Control', 'no-store');
    res.json({ bytesReceived: buf.length });
  },
);

// Reject non-POST on /api/upload so the speed-test path stays one-method.
app.all('/api/upload', (req, res, next) => {
  if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').end();
  next();
});

app.get('/api/ip', speedtestLimiter, (req, res) => {
  // req.ip can be a string IPv4/IPv6, or a malformed header. Sanity-check it
  // before returning — we'd rather omit the field than hand back a junk value.
  const ip = typeof req.ip === 'string' && /^[\d:a-fA-F.]+$/.test(req.ip) ? req.ip : null;
  res.set('Cache-Control', 'no-store');
  res.json({
    ip,
    server: process.env.SERVER_LABEL || 'gcp-showcase (us-central1)',
  });
});

app.get('/healthz', staticLimiter, (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Express's body-parser throws PayloadTooLargeError when the body exceeds
// the limit declared in express.raw(). Convert it to a clean 413 response
// instead of letting Express's default handler dump a stack to stderr.
app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large.' });
  }
  if (err && err.status === 429) {
    return res.status(429).json({ error: 'Too many requests.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 8082;

function start() {
  return app.listen(PORT, () => {
    console.log(`Speed test server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  const server = start();
  // Graceful shutdown so the load balancer drains in-flight requests
  // before the process exits on SIGTERM (containers, systemd, k8s).
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      console.log(`Got ${sig}, draining...`);
      server.close(() => process.exit(0));
      // Hard exit if close() hangs on a stuck connection.
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}

module.exports = app;
app.start = start;
