// main.js
import { initSupporterPopout } from './modules/interactions/supporterPopout.js';
import { initLayoutUpdates } from './modules/utils/layout.js';
import { initScrollAnimations } from './modules/animations/scrollAnimations.js';
import { initStickerHover } from './modules/interactions/stickerHover.js';
import { initBalatroTilt } from './modules/interactions/balatroTilt.js';
import { initCtaPulse } from './modules/animations/ctaPulse.js';
import { initFlag3D } from './modules/flag3d/Flag3DScene.js';

document.addEventListener('DOMContentLoaded', () => {
  initLayoutUpdates();
  initScrollAnimations();
  initStickerHover();
  initBalatroTilt();
  initSupporterPopout();
  initCtaPulse();
  initFlag3D();
});
