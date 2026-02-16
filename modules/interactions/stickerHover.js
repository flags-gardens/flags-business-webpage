// modules/interactions/stickerHover.js
import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';

// Hover state positions (offsets from initial)
const expandedPositions = {
  'sticker-sandwich': { x: -65, y: -120, rotation: -15, scale: 1.2 },
  'sticker-curry':    { x: 0,   y: -180, rotation: 8,   scale: 1.2 },
  'sticker-granita':  { x: 80,  y: -135, rotation: 12,  scale: 1.2 },
  'photo-left':       { x: -190, y: 20,  rotation: -14, scale: 1.1 },
  'photo-right':      { x: 150,  y: -20,  rotation: 12,  scale: 1.1 },
  'photo-bottom':     { x: 20,   y: 180,  rotation: 5,  scale: 1.1 },
  'card-image':       { x: 0,   y: 0,   rotation: -4,  scale: 1.1 },
};

// Feature label expanded positions (offsets from CSS position)
const labelPositions = {
  'feature-label-tl': { x: -180, y: -50, rotation: -10},
  'feature-label-tr': { x: 200,  y: -90, rotation: 10 },
  'feature-label-bl': { x: -110, y: 90, rotation: 10 },
  'feature-label-br': { x: 140,  y: 110, rotation: -10 },
};

export function initStickerHover() {
  const cardScene = elements.cardScene;
  if (!cardScene) return;

  const items = cardScene.querySelectorAll('.sticker, .photo, .card-image');

  // Capture each element's initial rotation + scale from CSS so we can return to it
  const initialState = new Map();
  items.forEach((item) => {
    const key = [...item.classList].find((c) => expandedPositions[c]);
    if (!key) return;
    const initRotation = gsap.getProperty(item, 'rotation') || 0;
    const initScale = gsap.getProperty(item, 'scaleX') || 1;
    initialState.set(item, { key, rotation: initRotation, scale: initScale });
  });

  const title = document.getElementById('card-scene-title');
  const featureLabels = cardScene.querySelectorAll('.feature-label');
  const cardSceneInner = cardScene.querySelector('.card-scene-inner');

  // Create blur backdrops at the final expanded positions (they don't move, just fade)
  const blurEls = [];
  featureLabels.forEach((label) => {
    const key = [...label.classList].find((c) => labelPositions[c]);
    if (!key) return;
    const pos = labelPositions[key];

    const blurEl = document.createElement('div');
    blurEl.className = 'feature-blur';

    // Position at the label's final expanded location
    const cs = getComputedStyle(label);
    const pad = 40; // how far blur extends beyond text
    blurEl.style.width = (label.offsetWidth + pad * 2) + 'px';
    blurEl.style.height = (label.offsetHeight + pad * 2) + 'px';

    if (cs.left !== 'auto') {
      blurEl.style.left = (parseFloat(cs.left) + pos.x - pad) + 'px';
    } else {
      blurEl.style.right = (parseFloat(cs.right) - pos.x - pad) + 'px';
    }
    if (cs.top !== 'auto') {
      blurEl.style.top = (parseFloat(cs.top) + pos.y - pad) + 'px';
    } else {
      blurEl.style.bottom = (parseFloat(cs.bottom) - pos.y - pad) + 'px';
    }

    cardSceneInner.appendChild(blurEl);
    blurEls.push(blurEl);
  });

  cardScene.addEventListener('mouseenter', () => {
    initialState.forEach(({ key }, item) => {
      const pos = expandedPositions[key];
      gsap.to(item, {
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        scale: pos.scale,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: true,
      });
    });
    if (title) gsap.to(title, { opacity: 0.1, duration: 0.4, ease: 'power2.out' });

    // Animate feature labels outward and fade in
    featureLabels.forEach((label) => {
      const key = [...label.classList].find((c) => labelPositions[c]);
      if (!key) return;
      const pos = labelPositions[key];
      gsap.to(label, {
        x: pos.x,
        y: pos.y,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: true,
      });
    });

    // Fade in blur backdrops
    blurEls.forEach((el) => {
      gsap.to(el, { opacity: 1, duration: 0.6, ease: 'power2.out', overwrite: true });
    });
  });

  cardScene.addEventListener('mouseleave', () => {
    initialState.forEach(({ rotation, scale }, item) => {
      gsap.to(item, {
        x: 0,
        y: 0,
        rotation: rotation,
        scale: scale,
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        overwrite: true,
      });
      item.style.filter = '';
    });
    if (title) gsap.to(title, { opacity: 1, duration: 0.4, ease: 'power2.out' });

    // Animate feature labels back to center and fade out
    featureLabels.forEach((label) => {
      gsap.to(label, {
        x: 0,
        y: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        overwrite: true,
      });
    });

    // Fade out blur backdrops
    blurEls.forEach((el) => {
      gsap.to(el, { opacity: 0, duration: 0.5, ease: 'power2.inOut', overwrite: true });
    });
  });
}
