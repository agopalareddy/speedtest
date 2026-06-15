(() => {
  const startBtn = document.getElementById('start-btn');
  const retryBtn = document.getElementById('retry-btn');
  const phaseEl = document.getElementById('phase');
  const liveEl = document.getElementById('live-reading');
  const resultsEl = document.getElementById('results');
  const errorEl = document.getElementById('error');
  const qualityEl = document.getElementById('quality');
  const historyEl = document.getElementById('history');
  const historyListEl = document.getElementById('history-list');
  const gaugeNeedle = document.getElementById('gauge-needle');
  const chartCanvas = document.getElementById('chart');
  const chartCtx = chartCanvas.getContext('2d');

  const DOWNLOAD_CHUNK_BYTES = 20 * 1024 * 1024; // 20MB per chunk request
  const UPLOAD_CHUNK_BYTES = 5 * 1024 * 1024; // 5MB per chunk request
  const AUTO_MIN_MS = 5000;
  const AUTO_MAX_MS = 30000;
  const STABILITY_WINDOW = 3;
  const STABILITY_THRESHOLD = 0.1; // last samples within ±10% of their median = stable
  const PING_COUNT = 7;
  const PROGRESS_INTERVAL_MS = 1000;
  const GAUGE_MAX_MBPS = 200;
  const HISTORY_KEY = 'speedtest.history';

  const QUALITY_TIERS = [
    { max: 5, label: 'Browsing & email' },
    { max: 25, label: 'HD streaming' },
    { max: 100, label: '4K streaming & video calls' },
    { max: Infinity, label: 'Gaming & heavy multi-device use' },
  ];

  const state = {
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    ip: null,
    server: null,
    testDurationS: null,
  };

  function getTestMode() {
    const value = document.getElementById('duration').value;
    return value === 'auto' ? { auto: true, capMs: AUTO_MAX_MS } : { auto: false, capMs: Number(value) * 1000 };
  }

  // True once the last STABILITY_WINDOW samples agree within STABILITY_THRESHOLD of their median.
  function isStable(samples) {
    if (samples.length < STABILITY_WINDOW) return false;
    const recent = samples.slice(-STABILITY_WINDOW);
    const m = median(recent);
    if (m === 0) return false;
    return Math.max(...recent) - Math.min(...recent) <= m * STABILITY_THRESHOLD;
  }

  function mbps(bytes, ms) {
    return (bytes * 8) / (ms / 1000) / 1e6;
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  function qualityLabel(downloadMbps) {
    return QUALITY_TIERS.find((tier) => downloadMbps < tier.max).label;
  }

  function setPhase(phase) {
    phaseEl.textContent = phase;
  }

  function setLive(value) {
    liveEl.textContent = value;
  }

  function setGauge(currentMbps) {
    const ratio = Math.min(Math.max(currentMbps / GAUGE_MAX_MBPS, 0), 1);
    const angle = -90 + ratio * 180;
    gaugeNeedle.setAttribute('transform', `rotate(${angle} 100 100)`);
  }

  let chartSamples = [];

  function pushChartSample(value) {
    chartSamples.push(value);
    drawChart();
  }

  function drawChart() {
    const { width: w, height: h } = chartCanvas;
    chartCtx.clearRect(0, 0, w, h);
    if (chartSamples.length < 2) return;
    const max = Math.max(...chartSamples, 1);
    chartCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    chartSamples.forEach((value, i) => {
      const x = (i / (chartSamples.length - 1)) * w;
      const y = h - (value / max) * h;
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();
  }

  function resetUI() {
    errorEl.hidden = true;
    retryBtn.hidden = true;
    startBtn.hidden = false;
    resultsEl.hidden = true;
    setLive('');
    setGauge(0);
    setPhase('Idle');
    chartSamples = [];
    drawChart();
  }

  function showError(message) {
    setPhase('Idle');
    setLive('');
    setGauge(0);
    errorEl.textContent = message;
    errorEl.hidden = false;
    retryBtn.hidden = false;
    startBtn.hidden = true;
  }

  function renderHistory() {
    const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
    const previous = history.slice(1); // most recent is shown as the current result
    historyListEl.innerHTML = '';
    for (const entry of previous) {
      const li = document.createElement('li');
      li.textContent =
        `${new Date(entry.timestamp).toLocaleTimeString()} — ` +
        `${entry.downloadMbps.toFixed(2)} / ${entry.uploadMbps.toFixed(2)} Mbps, ` +
        `${entry.pingMs.toFixed(0)} ms ping (±${entry.jitterMs.toFixed(0)}), ${entry.qualityLabel} ` +
        `[${entry.testDurationS}s test]`;
      historyListEl.appendChild(li);
    }
    historyEl.hidden = previous.length === 0;
  }

  function saveToHistory(result) {
    const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift(result);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function showResults() {
    resultsEl.querySelector('[data-field="download"]').textContent = state.downloadMbps.toFixed(2);
    resultsEl.querySelector('[data-field="upload"]').textContent = state.uploadMbps.toFixed(2);
    resultsEl.querySelector('[data-field="ping"]').textContent = state.pingMs.toFixed(0);
    resultsEl.querySelector('[data-field="jitter"]').textContent = state.jitterMs.toFixed(0);
    resultsEl.querySelector('[data-field="duration"]').textContent = state.testDurationS;
    resultsEl.querySelector('[data-field="ip"]').textContent = state.ip;
    resultsEl.querySelector('[data-field="server"]').textContent = state.server;
    qualityEl.textContent = qualityLabel(state.downloadMbps);
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
    state.jitterMs = times[times.length - 1] - times[0];
  }

  async function measureDownload(mode) {
    setPhase('Download');
    const samples = [];
    const overallStart = performance.now();
    let lastSampleTime = overallStart;
    let lastSampleBytes = 0;
    let totalReceived = 0;
    let stop = false;

    while (!stop && performance.now() - overallStart < mode.capMs) {
      const remaining = mode.capMs - (performance.now() - overallStart);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);

      try {
        const res = await fetch(`api/download?bytes=${DOWNLOAD_CHUNK_BYTES}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Download failed');

        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalReceived += value.length;

          const now = performance.now();
          if (now - lastSampleTime >= PROGRESS_INTERVAL_MS) {
            const current = mbps(totalReceived - lastSampleBytes, now - lastSampleTime);
            samples.push(current);
            setLive(`${current.toFixed(2)} Mbps`);
            setGauge(current);
            pushChartSample(current);
            lastSampleTime = now;
            lastSampleBytes = totalReceived;

            const usable = samples.length > 1 ? samples.slice(1) : samples;
            if (mode.auto && now - overallStart >= AUTO_MIN_MS && isStable(usable)) {
              stop = true;
              controller.abort();
              break;
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    // drop the first sample (connection warm-up) when we have enough data
    const usable = samples.length > 1 ? samples.slice(1) : samples;
    state.downloadMbps = usable.length ? median(usable) : mbps(totalReceived, performance.now() - overallStart);
    state.downloadDurationS = (performance.now() - overallStart) / 1000;
  }

  function uploadChunk(remainingMs, onSample) {
    return new Promise((resolve, reject) => {
      const data = new Uint8Array(UPLOAD_CHUNK_BYTES);
      const start = performance.now();
      let lastUpdate = start;
      let lastBytes = 0;
      let sampled = false;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'api/upload');
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      const timer = setTimeout(() => xhr.abort(), remainingMs);

      xhr.upload.onprogress = (e) => {
        const now = performance.now();
        if (now - lastUpdate >= PROGRESS_INTERVAL_MS) {
          const current = mbps(e.loaded - lastBytes, now - lastUpdate);
          lastUpdate = now;
          lastBytes = e.loaded;
          sampled = true;
          if (onSample(current)) xhr.abort();
        }
      };

      xhr.onload = () => {
        clearTimeout(timer);
        if (xhr.status >= 200 && xhr.status < 300) {
          // Fast (e.g. localhost) uploads can finish before any progress event
          // fires a second time; fall back to a whole-request sample.
          if (!sampled) onSample(mbps(UPLOAD_CHUNK_BYTES, performance.now() - start));
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onabort = () => {
        clearTimeout(timer);
        resolve();
      };

      xhr.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Upload failed'));
      };

      xhr.send(data);
    });
  }

  async function measureUpload(mode) {
    setPhase('Upload');
    const samples = [];
    const overallStart = performance.now();
    let stop = false;

    while (!stop && performance.now() - overallStart < mode.capMs) {
      const remaining = mode.capMs - (performance.now() - overallStart);
      await uploadChunk(remaining, (current) => {
        samples.push(current);
        setLive(`${current.toFixed(2)} Mbps`);
        setGauge(current);
        pushChartSample(current);

        const usable = samples.length > 1 ? samples.slice(1) : samples;
        const elapsed = performance.now() - overallStart;
        stop = mode.auto && elapsed >= AUTO_MIN_MS && isStable(usable);
        return stop;
      });
    }

    const usable = samples.length > 1 ? samples.slice(1) : samples;
    state.uploadMbps = usable.length ? median(usable) : 0;
    state.uploadDurationS = (performance.now() - overallStart) / 1000;
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
      const mode = getTestMode();
      await measurePing();
      await measureDownload(mode);
      await measureUpload(mode);
      state.testDurationS = Math.round(state.downloadDurationS + state.uploadDurationS);
      await fetchConnectionInfo();
      setPhase('Done');
      setLive('');
      setGauge(0);
      showResults();
      saveToHistory({ ...state, timestamp: Date.now(), qualityLabel: qualityLabel(state.downloadMbps) });
      renderHistory();
    } catch (err) {
      showError('Something went wrong running the test. Please try again.');
    } finally {
      startBtn.disabled = false;
    }
  }

  startBtn.addEventListener('click', startTest);
  retryBtn.addEventListener('click', startTest);

  renderHistory();
})();
