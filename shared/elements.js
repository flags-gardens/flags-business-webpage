// shared/elements.js
// Using getters to ensure fresh DOM references
export const elements = {
  // Core containers
  get root() { return document.getElementById("root"); },
  get mainContainer() { return document.getElementById("main-container"); },
  
  // Main components
  get postcard() { return document.getElementById("postcard"); },
  get mainText() { return document.getElementById("main-text"); },
  get mainFlag() { return document.getElementById("main-flag-container"); },
  get mainFlagVideo() { return document.getElementById("main-flag-video"); },
  
  // Effects
  get topGradient() { return document.getElementById("top-gradient"); },
  get progressiveBlur() { return document.getElementById("progressive-blur"); },
  get bottomGradient() { return document.getElementById("bottom-gradient"); },
  get fadeOverlay() { return document.getElementById("fade-overlay"); },
  
  // Bottom elements
  get bottomHouse() { return document.getElementById("bottom-house-image"); },
  
  // Overlays
  get impressumLink() { return document.getElementById("impressum-link"); },
  get impressumOverlay() { return document.getElementById("impressum-overlay"); },
  get scrollOverlay() { return document.getElementById("scroll-overlay"); },
  get loader() { return document.getElementById("loader"); },
  
  // Supporter
  get supporterContainer() { return document.getElementById("supporter-container"); },
  get supporterText() { return document.getElementById("supporter-text"); },

  // Signup Card
  get inlineSignupBanner() { return document.getElementById("inline-signup-banner"); },
  get signupCardImage() { return document.querySelector("#inline-signup-banner img"); },
  get realSignupCardContainer() { return document.getElementById("real-signup-card-container"); },
  get realSignupCard() { return document.querySelector("#real-signup-card-container .badge-card"); },
  get cardOverlay() { return document.getElementById("card-overlay"); },
  
  // Collections (cached since NodeLists don't change)
  get signatures() { return document.querySelectorAll(".signature"); },
  get edgeFlags() { return document.querySelectorAll(".edge-flag"); },
  get stemExtensions() { return document.querySelectorAll(".stem-extension"); }
};
