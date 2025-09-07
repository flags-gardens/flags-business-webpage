// main.js
import { initScrollAnimations } from './modules/animations/scrollAnimations.js';
import { initPostcardInteraction } from './modules/animations/postcardInteraction.js';
import { initEdgeIndicators } from './modules/animations/edgeIndicators.js';
import { initSignatures } from './modules/animations/signatures.js';
import { initImpressum } from './modules/interactions/impressum.js';
import { initSupporterPopout } from './modules/interactions/supporterPopout.js';
import { initLayoutUpdates } from './modules/utils/layout.js';

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize animations
  const { postcardTl } = initScrollAnimations();
  initPostcardInteraction(postcardTl);
  initEdgeIndicators();
  initSignatures();
  
  // Initialize interactions
  initImpressum();
  initSupporterPopout();
  
  // Initialize layout utilities
  initLayoutUpdates();
});
