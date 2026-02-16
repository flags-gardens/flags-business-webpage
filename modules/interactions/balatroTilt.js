// modules/interactions/balatroTilt.js
// Balatro-style 3D tilt effect with specular shine on stickers
import { gsap } from 'gsap';

const MAX_ANGLE = 15; // max tilt degrees
const SCALE_BUMP = 1.1; // scale on hover
const TILT_DELAY = 200; // ms before tilt tracking kicks in

export function initBalatroTilt() {
  const items = document.querySelectorAll('#card-scene .sticker, #card-scene .photo, #card-scene .card-image, .testimonial-logo');

  items.forEach((item) => {
    let tiltEnabled = false;
    let tiltTimer = null;
    let rect = null;
    let requestRef = null;
    let baseScale = 1;
    let shineEl = null;

    const isSticker = item.classList.contains('sticker');
    const isPhoto = item.classList.contains('photo');
    const isHoloLogo = item.classList.contains('testimonial-logo');
    const needsShine = isSticker || isPhoto || isHoloLogo;

    // Create shine overlay
    if (needsShine) {
      shineEl = document.createElement('div');
      let maskCss = '';

      if (isSticker) {
        const stickerSrc = item.src;
        maskCss = `
          -webkit-mask-image: url('${stickerSrc}');
          mask-image: url('${stickerSrc}');
          -webkit-mask-size: contain;
          mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
        `;
      } else if (isHoloLogo) {
        const logoSrc = item.src;
        maskCss = `
          -webkit-mask-image: url('${logoSrc}');
          mask-image: url('${logoSrc}');
          -webkit-mask-size: 80% 80%;
          mask-size: 80% 80%;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          overflow: hidden;
        `;
      } else {
        maskCss = `
          border-radius: 4px;
          overflow: hidden;
        `;
      }

      shineEl.style.cssText = `
        position: absolute;
        pointer-events: none;
        opacity: 0;
        background: radial-gradient(
          circle at 50% 50%,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(255, 255, 255, 0.2) 30%,
          transparent 60%
        );
        mix-blend-mode: soft-light;
        z-index: 10;
        ${maskCss}
      `;
      item.parentElement.appendChild(shineEl);
    }

    // Sync shine overlay to match the item's position + GSAP transforms
    function syncShineToSticker() {
      if (!shineEl) return;
      const cs = getComputedStyle(item);

      if (isHoloLogo) {
        // For inline/flex items: use bounding rect relative to parent
        const parentRect = item.parentElement.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        shineEl.style.top = (itemRect.top - parentRect.top) + 'px';
        shineEl.style.left = (itemRect.left - parentRect.left) + 'px';
        shineEl.style.right = 'auto';
        shineEl.style.bottom = 'auto';
        shineEl.style.width = itemRect.width + 'px';
        shineEl.style.height = itemRect.height + 'px';
      } else {
        // For absolutely positioned items: copy CSS position
        shineEl.style.top = cs.top;
        shineEl.style.left = cs.left;
        shineEl.style.right = cs.right;
        shineEl.style.bottom = cs.bottom;
        shineEl.style.width = cs.width;
        shineEl.style.height = cs.height;
      }
      // Copy GSAP-managed transforms so shine sits exactly on top
      const tx = gsap.getProperty(item, 'x') || 0;
      const ty = gsap.getProperty(item, 'y') || 0;
      const rot = gsap.getProperty(item, 'rotation') || 0;
      const sc = gsap.getProperty(item, 'scaleX') || 1;
      const rx = gsap.getProperty(item, 'rotateX') || 0;
      const ry = gsap.getProperty(item, 'rotateY') || 0;
      shineEl.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc}) perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      shineEl.style.transformOrigin = cs.transformOrigin;
    }

    item.style.pointerEvents = 'auto';

    item.addEventListener('mouseenter', () => {
      rect = item.getBoundingClientRect();
      baseScale = gsap.getProperty(item, 'scaleX') || 1;

      gsap.to(item, {
        scale: baseScale * SCALE_BUMP,
        transformPerspective: 1000,
        duration: 0.4,
        ease: 'back.out(1.7)',
        overwrite: false,
      });
      item.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))';

      if (shineEl) {
        syncShineToSticker();
        gsap.to(shineEl, { opacity: 1, duration: 0.3 });
      }

      tiltTimer = setTimeout(() => {
        tiltEnabled = true;
      }, TILT_DELAY);
    });

    item.addEventListener('mousemove', (e) => {
      if (!tiltEnabled || !rect) return;

      if (requestRef) cancelAnimationFrame(requestRef);

      requestRef = requestAnimationFrame(() => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;

        const rotateX = -percentY * MAX_ANGLE;
        const rotateY = percentX * MAX_ANGLE;

        gsap.set(item, {
          rotateX: rotateX,
          rotateY: rotateY,
        });

        // Fixed light source (top-left) — shine shifts based on tilt angle
        if (shineEl) {
          syncShineToSticker();
          const shineX = 30 - (rotateY / MAX_ANGLE) * 35;
          const shineY = 25 - (rotateX / MAX_ANGLE) * 35;
          const tiltTowardLight = Math.max(0, (-percentX + -percentY) / 2);
          const intensity = 0.4 + tiltTowardLight * 0.6;

          if (isHoloLogo) {
            // Holographic rainbow — hue shifts as the tilt angle changes
            const hueShift = (percentX + 1) * 180; // 0-360 based on horizontal tilt
            const a = intensity;
            shineEl.style.background = `
              linear-gradient(
                ${130 + percentX * 40}deg,
                hsla(${hueShift}deg, 100%, 75%, ${a * 0.7}) 0%,
                hsla(${hueShift + 60}deg, 100%, 70%, ${a * 0.5}) 20%,
                hsla(${hueShift + 120}deg, 100%, 75%, ${a * 0.6}) 40%,
                hsla(${hueShift + 180}deg, 100%, 70%, ${a * 0.5}) 60%,
                hsla(${hueShift + 240}deg, 100%, 75%, ${a * 0.4}) 80%,
                hsla(${hueShift + 300}deg, 100%, 70%, ${a * 0.3}) 100%
              )
            `;
            shineEl.style.mixBlendMode = 'color-dodge';
          } else {
            shineEl.style.background = `radial-gradient(
              ellipse at ${shineX}% ${shineY}%,
              rgba(255, 255, 255, ${intensity}) 0%,
              rgba(255, 255, 255, ${intensity * 0.4}) 20%,
              rgba(255, 255, 255, ${intensity * 0.05}) 45%,
              transparent 65%
            )`;
          }
        }
      });
    });

    item.addEventListener('mouseleave', () => {
      clearTimeout(tiltTimer);
      if (requestRef) cancelAnimationFrame(requestRef);
      tiltEnabled = false;

      gsap.set(item, { rotateX: 0, rotateY: 0 });
      gsap.to(item, {
        scale: baseScale,
        transformPerspective: 0,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: false,
      });
      item.style.filter = '';

      if (shineEl) {
        gsap.to(shineEl, { opacity: 0, duration: 0.3 });
      }
    });
  });
}
