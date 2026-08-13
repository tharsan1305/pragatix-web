// Automatic Cache Buster & Service Worker Purge for New Deploys
// This file is loaded as a separate script so the CSP can avoid 'unsafe-inline'.
(function () {
  var CURRENT_APP_BUILD = '2026-08-06-v2';
  var storedBuild = localStorage.getItem('pragatix_build_ver');
  if (storedBuild !== CURRENT_APP_BUILD) {
    localStorage.setItem('pragatix_build_ver', CURRENT_APP_BUILD);
    if ('caches' in window) {
      caches.keys().then(function (names) {
        names.forEach(function (name) {
          caches.delete(name);
        });
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        registrations.forEach(function (r) {
          r.unregister();
        });
      });
    }
  }
})();
