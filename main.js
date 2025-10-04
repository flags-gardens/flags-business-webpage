// main.js
import { initScrollAnimations } from './modules/animations/scrollAnimations.js';
import { initPostcardInteraction } from './modules/animations/postcardInteraction.js';
import { initEdgeIndicators } from './modules/animations/edgeIndicators.js';
import { initSignatures, initSignupCardAnimation } from './modules/animations/signatures.js';
import { initImpressum } from './modules/interactions/impressum.js';
import { initSupporterPopout } from './modules/interactions/supporterPopout.js';
import { initNewsletter } from './modules/interactions/newsletter.js';
import { initSignupCard } from './modules/interactions/signupCard.js';
import { initLayoutUpdates } from './modules/utils/layout.js';

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize animations
  const { postcardTl } = initScrollAnimations();
  initPostcardInteraction(postcardTl);
  initEdgeIndicators();
  initSignatures();
  initSignupCardAnimation();
  
  // Initialize interactions
  initImpressum();
  initSupporterPopout();
  initNewsletter();
  initSignupCard();
  
  // Initialize layout utilities
  initLayoutUpdates();
});
