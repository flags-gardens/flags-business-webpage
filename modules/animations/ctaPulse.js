// modules/animations/ctaPulse.js
// Periodic shimmer on the CTA button (paused while hovering)

export function initCtaPulse() {
  const cta = document.getElementById('feature-list-cta');
  if (!cta) return;

  let hovered = false;

  cta.addEventListener('mouseenter', () => {
    hovered = true;
    cta.classList.remove('shimmer');
  });

  cta.addEventListener('mouseleave', () => {
    hovered = false;
  });

  function shimmer() {
    if (hovered) return;
    cta.classList.add('shimmer');
    cta.addEventListener('animationend', () => {
      cta.classList.remove('shimmer');
    }, { once: true });
  }

  // Shimmer every 5 seconds, starting after 3s
  setTimeout(() => {
    shimmer();
    setInterval(shimmer, 5000);
  }, 3000);
}
