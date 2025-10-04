// modules/interactions/supporterPopout.js
import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';
import { config } from '../../shared/config.js';
import { isMobile, isAtBottom } from '../../shared/device.js';

let overscrollAmount = 0;
let sentenceTriggered = false;
let resetTimeout = null;

let closeOnScrollHandler = null;
let closeOnTouchMoveHandler = null;
let closeOnTouchStartHandler = null;
let touchStartY = 0;

const setBackgroundColor = gsap.quickSetter(elements.supporterContainer, "backgroundColor");

function getInterpolatedColor(progress) {
  const alpha = 0.1176 + progress * (1 - 0.1176);
  return `rgba(255, 255, 255, ${alpha})`;
}

function updateColor() {
  const progress = overscrollAmount / config.resistanceThreshold;
  const targetColor = getInterpolatedColor(progress);
  
  gsap.set(elements.supporterContainer, {
    backgroundColor: targetColor,
    scale: 1 + progress * 0.08,
  });
}

function resetSupporter() {
  if (sentenceTriggered) return;
  
  overscrollAmount = 0;
  gsap.to(elements.supporterContainer, {
    backgroundColor: '#ffffff1e',
    duration: 0.1,
    scale: 1,
    ease: "power2.out",
    overwrite: true
  });
}

function scheduleReset(delay = 200) {
  clearTimeout(resetTimeout);
  resetTimeout = setTimeout(() => {
    if (!sentenceTriggered && overscrollAmount > 0) {
      resetSupporter();
    }
  }, delay);
}

function decayOverscroll() {
  if (!sentenceTriggered && overscrollAmount > 0) {
    overscrollAmount = Math.max(0, overscrollAmount - config.decayRate);
    updateColor();
    
    if (overscrollAmount <= 0) {
      resetSupporter();
    }
  }
}

function handleOverscroll(delta) {
  if (!isAtBottom() || sentenceTriggered) return;
  
  if (delta > 0) {
    overscrollAmount = Math.min(
      overscrollAmount + delta * config.resistanceFactor, 
      config.resistanceThreshold
    );
    updateColor();
    
    if (overscrollAmount >= config.resistanceThreshold) {
      triggerSupporterPopout();
    } else {
      scheduleReset();
    }
  }
}

function triggerSupporterPopout() {
  if (sentenceTriggered) return;
  sentenceTriggered = true;
  
  clearTimeout(resetTimeout);
  updateColor();
  
  gsap.set(elements.supporterContainer, {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    overwrite: true
  });
  
  elements.scrollOverlay.classList.add('active');

  closeOnScrollHandler = (e) => {
    if (e.deltaY < 0) {
      resetSupporterTrigger();
    }
  };
  elements.scrollOverlay.addEventListener('wheel', closeOnScrollHandler);

  closeOnTouchStartHandler = (e) => {
    touchStartY = e.touches[0].clientY;
  };
  elements.scrollOverlay.addEventListener('touchstart', closeOnTouchStartHandler);

  closeOnTouchMoveHandler = (e) => {
    const currentY = e.touches[0].clientY;
    if (currentY > touchStartY) { // Swiping down
      resetSupporterTrigger();
    }
  };
  elements.scrollOverlay.addEventListener('touchmove', closeOnTouchMoveHandler);
}

function resetSupporterTrigger() {
  sentenceTriggered = false;
  overscrollAmount = 0;
  elements.scrollOverlay.classList.remove('active');
  
  clearTimeout(resetTimeout);
  
  gsap.to(elements.supporterContainer, {
    backgroundColor: '#ffffff1e',
    duration: 0.1,
    scale: 1,
    ease: "power2.inOut",
    overwrite: true
  });

  if (closeOnScrollHandler) {
    elements.scrollOverlay.removeEventListener('wheel', closeOnScrollHandler);
    closeOnScrollHandler = null;
  }
  if (closeOnTouchStartHandler) {
    elements.scrollOverlay.removeEventListener('touchstart', closeOnTouchStartHandler);
    closeOnTouchStartHandler = null;
  }
  if (closeOnTouchMoveHandler) {
    elements.scrollOverlay.removeEventListener('touchmove', closeOnTouchMoveHandler);
    closeOnTouchMoveHandler = null;
  }
}

export function initSupporterPopout() {
  if (isMobile()) return;

  const root = elements.root;
  
  gsap.ticker.add(decayOverscroll);
  
  // Wheel events
  let wheelDelta = 0;
  let wheelTicking = false;
  
  root.addEventListener('wheel', (e) => {
    const deltaY = e.deltaY;
    
    if (deltaY > 0) {
      wheelDelta += deltaY;
      if (!wheelTicking) {
        requestAnimationFrame(() => {
          handleOverscroll(wheelDelta);
          wheelDelta = 0;
          wheelTicking = false;
        });
        wheelTicking = true;
      }
    } else if (overscrollAmount > 0) {
      overscrollAmount = Math.max(0, overscrollAmount + deltaY * config.resistanceFactor);
      updateColor();
    }
  }, { passive: false });
  
  // Touch events
  let lastY = 0;
  
  root.addEventListener('touchstart', (e) => {
    lastY = e.touches[0].clientY;
  });
  
  root.addEventListener('touchmove', (e) => {
    if (!isAtBottom() || sentenceTriggered) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = lastY - currentY;
    
    handleOverscroll(deltaY);
    lastY = currentY;
  }, { passive: false });
  
  root.addEventListener('touchend', () => {
    if (!sentenceTriggered && overscrollAmount > 0) {
      scheduleReset();
    }
  });
  
  // Close overlay
  elements.scrollOverlay.addEventListener('click', (e) => {
    if (e.target === elements.scrollOverlay) {
      resetSupporterTrigger();
    }
  });
}
