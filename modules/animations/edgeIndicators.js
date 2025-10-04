// modules/animations/edgeIndicators.js
import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';
import { config } from '../../shared/config.js';
import { flagIcons, defaultFlagIcon } from '../../shared/assets.js';
import { getViewportDimensions } from '../../shared/device.js';

const indicatorMap = new Map();
let isInitialLoad = true;
let prevScrollTop = 0;

function createIndicator(elId) {
  const indicator = document.createElement("div");
  indicator.className = "edge-indicator";
  
  const img = document.createElement("img");
  img.src = flagIcons[elId] || defaultFlagIcon;
  img.style.width = "100%";
  img.style.height = "40px";
  img.style.objectFit = "contain";
  indicator.appendChild(img);
  
  gsap.set(indicator, {
    display: "none",
    opacity: 0,
    scale: 0,
    width: config.indicatorSmallSize,
    height: config.indicatorSmallSize,
  });
  gsap.set(img, { display: "none" });
  document.body.appendChild(indicator);
  return indicator;
}

function updateEdgeIndicators() {
  const { width, height, centerX, centerY } = getViewportDimensions();
  const currentScrollTop = elements.root.scrollTop;
  const hiddenElements = elements.edgeFlags;
  const activeIndicators = [];
  
  hiddenElements.forEach((el) => {
    const elId = el.id;
    const rect = el.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.bottom;
    
    const isOffTop = rect.bottom < 0;
    const isOffBottom = rect.top > height;
    const isOffLeft = rect.right < 0;
    const isOffRight = rect.left > width;
    
    const isPartiallyVisible = 
      rect.bottom > 0 && 
      rect.top < height && 
      rect.right > 0 && 
      rect.left < width;
    
    if ((isOffTop || isOffBottom || isOffLeft || isOffRight) && !isPartiallyVisible) {
      if (!indicatorMap.has(elId)) {
        indicatorMap.set(elId, createIndicator(elId));
      }
      const indicator = indicatorMap.get(elId);
      
      const dx = targetCenterX - centerX;
      const dy = targetCenterY - centerY;
      const angle = Math.atan2(dy, dx);
      
      const indicatorSize = currentScrollTop <= config.scrollThreshold ? 
        config.indicatorSmallSize : config.indicatorFullSize;
      
      const halfSize = indicatorSize / 2;
      const maxX = width - config.edgePadding - halfSize;
      const minX = config.edgePadding + halfSize;
      const maxY = height - config.edgePadding - halfSize;
      const minY = config.edgePadding + halfSize;
      
      let posX, posY;
      
      const absCosThetaX = Math.abs((maxX - centerX) / Math.cos(angle));
      const absCosThetaY = Math.abs((maxY - centerY) / Math.sin(angle));
      
      if (absCosThetaX < absCosThetaY) {
        posX = dx > 0 ? maxX : minX;
        posY = centerY + Math.tan(angle) * (posX - centerX);
        posY = Math.max(minY, Math.min(posY, maxY));
      } else {
        posY = dy > 0 ? maxY : minY;
        posX = centerX + (posY - centerY) / Math.tan(angle);
        posX = Math.max(minX, Math.min(posX, maxX));
      }
      
      if (isInitialLoad) {
        gsap.set(indicator, {
          left: posX - halfSize,
          top: posY - halfSize,
        });
      } else {
        gsap.to(indicator, {
          left: posX - halfSize,
          top: posY - halfSize,
          duration: 0.5,
          opacity: 1,
          scale: 1,
        });
      }
      
      const shouldBeSmall = currentScrollTop <= config.scrollThreshold;
      if (
        (shouldBeSmall && prevScrollTop > config.scrollThreshold) ||
        (!shouldBeSmall && prevScrollTop <= config.scrollThreshold)
      ) {
        gsap.to(indicator, {
          width: indicatorSize,
          height: indicatorSize,
          duration: 0.3,
          ease: "power1.inOut",
        });
      }
      
      const img = indicator.querySelector("img");
      gsap.set(img, { display: shouldBeSmall ? "none" : "block" });
      
      activeIndicators.push(indicator);
      gsap.set(indicator, { display: "block" });
    } else {
      if (indicatorMap.has(elId)) {
        const indicator = indicatorMap.get(elId);
        gsap.to(indicator, {
          opacity: 0,
          scale: 0.5,
          duration: 0.3,
          onComplete: () => {
            gsap.set(indicator, { display: "none" });
          },
        });
      }
    }
  });
  
  if (isInitialLoad && activeIndicators.length > 0) {
    gsap.to(activeIndicators, {
      opacity: 1,
      scale: 1.2,
      duration: 0.2,
      stagger: 0.05,
      ease: "power1.out",
      onComplete: () => {
        gsap.to(activeIndicators, {
          scale: 1,
          duration: 0.2,
          stagger: 0.05,
          ease: "power1.in",
        });
      },
    });
    isInitialLoad = false;
  }
  
  prevScrollTop = currentScrollTop;
  
  console.log(
    `Updated indicators: ${activeIndicators.length} active, size: ${
      currentScrollTop <= config.scrollThreshold ? "small" : "full"
    }`
  );
}

export function initEdgeIndicators() {
  gsap.ticker.add(updateEdgeIndicators);
  window.addEventListener("resize", updateEdgeIndicators);
  updateEdgeIndicators();
}
