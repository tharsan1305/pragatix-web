// Weak JS-based fallback for clickjacking protection.
// Real protection requires an HTTP-level X-Frame-Options or CSP frame-ancestors header.
// This fallback can be disabled by attacker-controlled pages and is NOT equivalent to header-based enforcement.
if (window.top !== window.self) {
  window.top.location = window.self.location;
}

window.addEventListener('load', () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.4s ease';
      setTimeout(() => loader.remove(), 400);
    }, 300);
  }
});
