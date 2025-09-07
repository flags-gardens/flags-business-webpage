// shared/device.js
import { config } from './config.js';
import { elements } from './elements.js';

export const isMobile = () => window.innerWidth <= config.mobileBreakpoint;
export const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export const isAtBottom = () => {
  const root = elements.root;
  return Math.abs(root.scrollHeight - root.scrollTop - root.clientHeight) < 5;
};

export const getViewportDimensions = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight / 2
});
