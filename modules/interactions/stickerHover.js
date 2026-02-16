// modules/interactions/stickerHover.js
import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';

// Hover state positions (offsets from initial)
const expandedPositions = {
  'sticker-sandwich': { x: -65, y: -120, rotation: -15, scale: 1.2 },
  'sticker-curry':    { x: 0,   y: -180, rotation: 8,   scale: 1.2 },
  'sticker-granita':  { x: 80,  y: -135, rotation: 12,  scale: 1.2 },
  'photo-left':       { x: -150, y: 20,  rotation: -14, scale: 1.1 },
  'photo-right':      { x: 120,  y: 10,  rotation: 12,  scale: 1.1 },
  'photo-bottom':     { x: 20,   y: 120,  rotation: 5,  scale: 1.1 },
  'card-image':       { x: 0,   y: 0,   rotation: -4,  scale: 1.1 },
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
  });
}
