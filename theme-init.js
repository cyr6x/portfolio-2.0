// Applies the saved (or system) theme before first paint so light-mode visitors never see
// the dark default fade out. Kept external and synchronous: the CSP forbids inline scripts.
(function () {
  var theme;
  try { theme = localStorage.getItem('cosmic-theme'); } catch (_) { /* storage blocked */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.dataset.theme = theme;
})();
