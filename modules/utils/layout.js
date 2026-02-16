// modules/utils/layout.js
import { elements } from '../../shared/elements.js';

export function updateHouseWidth() {
  const contentSpine = elements.contentSpine;
  if (!contentSpine) return;

  const spineWidth = contentSpine.offsetWidth;
  document.documentElement.style.setProperty(
    '--house-width',
    `${spineWidth * 2.2}px`
  );
}

export function initLayoutUpdates() {
  updateHouseWidth();

  window.addEventListener('load', updateHouseWidth);
  window.addEventListener('resize', updateHouseWidth);
}
