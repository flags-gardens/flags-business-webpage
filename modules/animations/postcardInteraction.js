// modules/animations/postcardInteraction.js
import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';
import { config } from '../../shared/config.js';

export function initPostcardInteraction(postcardTl) {
  const postcard = elements.postcard;
  const root = elements.root;
  
  postcard.addEventListener('mouseenter', () => {
    if (postcardTl.scrollTrigger.progress < config.postcardMinimizedThreshold) return;
    gsap.to(postcard, {
      scale: 0.115,
      duration: 0.3,
      ease: "power1.out",
    });
  });
  
  postcard.addEventListener('mouseleave', () => {
    if (postcardTl.scrollTrigger.progress < config.postcardMinimizedThreshold) return;
    gsap.to(postcard, {
      scale: 0.1,
      duration: 0.3,
      ease: "power1.out",
    });
  });
  
  postcard.addEventListener('click', () => {
    if (postcardTl.scrollTrigger.progress < config.postcardMinimizedThreshold) return;
    
    postcard.style.pointerEvents = 'none';
    
    gsap.to(root, {
      scrollTop: 0,
      duration: 0.9,
      ease: 'power1.inOut',
      onComplete: () => {
        const progress = postcardTl.scrollTrigger.progress;
        if (progress >= config.postcardMinimizedThreshold) {
          postcard.style.pointerEvents = 'auto';
          postcard.style.cursor = 'pointer';
        }
      },
    });
  });
}
