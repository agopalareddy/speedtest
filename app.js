(() => {
  const startBtn = document.getElementById('start-btn');
  const retryBtn = document.getElementById('retry-btn');
  const phaseEl = document.getElementById('phase');
  const liveEl = document.getElementById('live-reading');
  const resultsEl = document.getElementById('results');
  const errorEl = document.getElementById('error');

  const DOWNLOAD_BYTES = 10 * 1024 * 1024; // 10MB
  const UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
  const PING_COUNT = 5;
  const PROGRESS_INTERVAL_MS = 1000;

  const state = {
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    ip: null,
    server: null,
  };

  function mbps(bytes, ms) {
    return (bytes * 8) / (ms / 1000) / 1e6;
  }

  function setPhase(phase) {
    phaseEl.textContent = phase;
  }

  function setLive(value) {
    liveEl.textContent = value;
  }

  function resetUI() {
    errorEl.hidden = true;
    retryBtn.hidden = true;
    startBtn.hidden = false;
    resultsEl.hidden = true;
    setLive('');
    setPhase('Idle');
  }

  function showError(message) {
    setPhase('Idle');
    setLive('');
    errorEl.textContent = message;
    errorEl.hidden = false;
    retryBtn.hidden = false;
    startBtn.hidden = true;
  }

  function showResults() {
    resultsEl.querySelector('[data-field="download"]').textContent = state.downloadMbps.toFixed(2);
    resultsEl.querySelector('[data-field="upload"]').textContent = state.uploadMbps.toFixed(2);
    resultsEl.querySelector('[data-field="ping"]').textContent = state.pingMs.toFixed(0);
    resultsEl.querySelector('[data-field="ip"]').textContent = state.ip;
    resultsEl.querySelector('[data-field="server"]').textContent = state.server;
    resultsEl.hidden = false;
  }

  async function measurePing() {
    setPhase('Ping');
    const times = [];
    for (let i = 0; i < PING_COUNT; i++) {
      const start = performance.now();
      const res = await fetch('api/ping', { cache: 'no-store' });
      if (!res.ok) throw new Error('Ping failed');
      times.push(performance.now() - start);
    }
    times.shift(); // discard first round trip (connection warm-up)
    times.sort((a, b) => a - b);
    state.pingMs = times[Math.floor(times.length / 2)];
  }

  async function measureDownload() {
    setPhase('Download');
    const start = performance.now();
    const res = await fetch(`api/download?bytes=${DOWNLOAD_BYTES}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Download failed');

    const reader = res.body.getReader();
    let received = 0;
    let lastUpdate = start;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;

      const now = performance.now();
      if (now - lastUpdate >= PROGRESS_INTERVAL_MS) {
        setLive(`${mbps(received, now - start).toFixed(2)} Mbps`);
        lastUpdate = now;
      }
    }

    state.downloadMbps = mbps(received, performance.now() - start);
  }

  function measureUpload() {
    return new Promise((resolve, reject) => {
      setPhase('Upload');
      const data = new Uint8Array(UPLOAD_BYTES);
      const start = performance.now();
      let lastUpdate = start;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'api/upload');
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        const now = performance.now();
        if (now - lastUpdate >= PROGRESS_INTERVAL_MS) {
          setLive(`${mbps(e.loaded, now - start).toFixed(2)} Mbps`);
          lastUpdate = now;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          state.uploadMbps = mbps(UPLOAD_BYTES, performance.now() - start);
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(data);
    });
  }

  async function fetchConnectionInfo() {
    const res = await fetch('api/ip', { cache: 'no-store' });
    if (!res.ok) throw new Error('IP lookup failed');
    const data = await res.json();
    state.ip = data.ip;
    state.server = data.server;
  }

  async function startTest() {
    resetUI();
    startBtn.disabled = true;
    try {
      await measurePing();
      await measureDownload();
      await measureUpload();
      await fetchConnectionInfo();
      setPhase('Done');
      setLive('');
      showResults();
    } catch (err) {
      showError('Something went wrong running the test. Please try again.');
    } finally {
      startBtn.disabled = false;
    }
  }

  startBtn.addEventListener('click', startTest);
  retryBtn.addEventListener('click', startTest);
})();
