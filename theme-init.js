// Resolve theme before paint to avoid a light/dark flash. Mirrors the pattern
// in personal-website/assets/js/theme.js. Must run synchronously in <head>
// (no defer/async) so data-resolved-theme is set before the first paint.
(() => {
  try {
    var stored = localStorage.getItem('speedtest.theme') || 'system';
    var resolved =
      stored === 'light' || stored === 'dark'
        ? stored
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.dataset.resolvedTheme = resolved;
  } catch (_) {
    document.documentElement.dataset.resolvedTheme = 'light';
  }
})();
