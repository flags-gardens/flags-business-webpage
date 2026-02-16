// shared/elements.js
export const elements = {
  // Core containers
  get root() { return document.getElementById("root"); },
  get mainContainer() { return document.getElementById("main-container"); },

  // Background
  get skyBg() { return document.getElementById("sky-bg"); },

  // Flag
  get mainFlag() { return document.getElementById("main-flag-container"); },
  get mainFlagVideo() { return document.getElementById("main-flag-video"); },

  // Content sections
  get contentSpine() { return document.getElementById("content-spine"); },
  get heroSection() { return document.getElementById("hero-section"); },
  get heroLogo() { return document.getElementById("hero-logo"); },
  get heroSubtitle() { return document.getElementById("hero-subtitle"); },
  get testimonial1() { return document.getElementById("testimonial-1"); },
  get testimonial2() { return document.getElementById("testimonial-2"); },
  get cardScene() { return document.getElementById("card-scene"); },
  get featureLabels() { return document.querySelectorAll(".feature-label"); },
  get featureList() { return document.getElementById("feature-list"); },
  get featureListItems() { return document.querySelectorAll(".feature-list-item"); },

  // Effects
  get topGradient() { return document.getElementById("top-gradient"); },

  // Bottom elements
  get bottomHouse() { return document.getElementById("bottom-house-image"); },

  // Overlays
  get scrollOverlay() { return document.getElementById("scroll-overlay"); },
  get loader() { return document.getElementById("loader"); },

  // Supporter
  get supporterContainer() { return document.getElementById("supporter-container"); },
  get supporterText() { return document.getElementById("supporter-text"); },

  // Collections
  get stickers() { return document.querySelectorAll(".sticker"); },
  get photos() { return document.querySelectorAll(".photo"); },
  get stemExtensions() { return document.querySelectorAll(".stem-extension"); },
};
