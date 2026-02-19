// modules/interactions/balatroTilt.js
// Balatro-style 3D tilt effect with specular shine on stickers
import { gsap } from 'gsap';

const MAX_ANGLE = 15; // max tilt degrees
const SCALE_BUMP = 1.1; // scale on hover
const TILT_DELAY = 0; // ms before tilt tracking kicks in
const CARD_SCENE_TILT_DELAY = 100; // ms — wait for stickerHover expansion to finish

export function initBalatroTilt() {
  const items = document.querySelectorAll('#card-scene .sticker, #card-scene .photo, #card-scene .card-image, .testimonial-logo-wrap');

  items.forEach((item) => {
    let tiltEnabled = false;
    let tiltTimer = null;
    let rect = null;
    let requestRef = null;
    const originalScale = gsap.getProperty(item, 'scaleX') || 1;
    let shineEl = null;

    const isSticker = item.classList.contains('sticker');
    const isPhoto = item.classList.contains('photo');
    const isHoloLogo = item.classList.contains('testimonial-logo-wrap');
    const isCardSceneItem = !!item.closest('#card-scene');
    const needsShine = isSticker || isPhoto || isHoloLogo;

    // Determine if this logo should get rainbow (CeeCee) or masked white (Floris)
    const isCeeCeeLogo = isHoloLogo && !!item.closest('#testimonial-1');
    const isMaskedLogo = isHoloLogo && !isCeeCeeLogo;

    // Create shine overlay
    if (needsShine) {
      shineEl = document.createElement('div');
      let maskCss = '';

      if (isSticker || isMaskedLogo) {
        // Use the image as a mask so shimmer follows the sticker/logo shape
        const imgEl = isMaskedLogo ? item.querySelector('img') : item;
        const stickerSrc = imgEl ? imgEl.src : '';
        maskCss = `
          inset: 0;
          -webkit-mask-image: url('${stickerSrc}');
          mask-image: url('${stickerSrc}');
          -webkit-mask-size: contain;
          mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
        `;
      } else if (isCeeCeeLogo) {
        maskCss = `
          inset: 0;
          border-radius: 22px;
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
      const shineParent = (isCeeCeeLogo) ? item : (isMaskedLogo ? item : item.parentElement);
      shineParent.appendChild(shineEl);
    }

    // Sync shine overlay to match the item's position + GSAP transforms
    function syncShineToSticker() {
      if (!shineEl) return;

      // Logo wrappers: shine is inside the wrapper with inset:0, no sync needed
      if (isHoloLogo) return;

      const cs = getComputedStyle(item);
      {
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

      // Card scene items: stickerHover already handles scale, so skip the bump
      if (!isCardSceneItem) {
        gsap.to(item, {
          scale: originalScale * SCALE_BUMP,
          transformPerspective: 1000,
          duration: 0.4,
          ease: 'back.out(1.7)',
          overwrite: false,
        });
      } else {
        gsap.set(item, { transformPerspective: 1000 });
      }
      item.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))';

      if (shineEl) {
        syncShineToSticker();
        gsap.to(shineEl, { opacity: 1, duration: 0.3 });
      }

      // Wait longer for card scene items so hover expansion finishes first
      const delay = isCardSceneItem ? CARD_SCENE_TILT_DELAY : TILT_DELAY;
      tiltTimer = setTimeout(() => {
        rect = item.getBoundingClientRect(); // re-measure after expansion
        tiltEnabled = true;
      }, delay);
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

          if (isCeeCeeLogo) {
            // Holographic rainbow for CeeCee
            const hueShift = (percentX + 1) * 180;
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
      if (!isCardSceneItem) {
        gsap.to(item, {
          scale: originalScale,
          transformPerspective: 0,
          duration: 0.4,
          ease: 'power3.out',
          overwrite: false,
        });
      } else {
        gsap.set(item, { transformPerspective: 0 });
      }
      item.style.filter = '';

      if (shineEl) {
        gsap.to(shineEl, { opacity: 0, duration: 0.3 });
      }
    });
  });
}
