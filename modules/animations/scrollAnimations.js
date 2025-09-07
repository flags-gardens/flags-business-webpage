// modules/animations/scrollAnimations.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { elements } from '../../shared/elements.js';
import { isMobile } from '../../shared/device.js';
import { config } from '../../shared/config.js';

gsap.registerPlugin(ScrollTrigger);

let postcardTl;
let miscTl;

// Function to update postcard interactivity
function updatePostcardInteractivity(progress) {
  const postcard = elements.postcard;
  if (progress >= config.postcardMinimizedThreshold) {
    postcard.style.pointerEvents = 'auto';
    postcard.style.cursor = 'pointer';
  } else {
    postcard.style.pointerEvents = 'none';
    postcard.style.cursor = 'default';
  }
}

export function initScrollAnimations() {
  const mobile = isMobile();
  
  // Misc animations timeline
  miscTl = gsap.timeline({
    scrollTrigger: {
      trigger: elements.mainText,
      scroller: elements.root,
      start: "top bottom-=200",
      end: "top 30%",
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
    },
  });
  
  // Postcard timeline
  postcardTl = gsap.timeline({
    scrollTrigger: {
      trigger: elements.mainText,
      scroller: elements.root,
      start: "top bottom-=200",
      end: "top 10%",
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        updatePostcardInteractivity(self.progress);
        console.log(`Scroll progress: ${self.progress}`);
      },
    },
  });
  
  // Postcard animation
  postcardTl.to(
    elements.postcard,
    {
      top: mobile ? "200px" : "400px",
      scale: 0.1,
      ease: "back.inOut",
      duration: 2,
    },
    0
  );
  
  postcardTl.to(
    elements.mainText,
    {
      ease: "power1.out",
      opacity: 1,
      duration: 1,
    },
    0.5
  );
  
  // Flag animation
  miscTl.from(
    elements.mainFlag,
    {
      y: 600,
      ease: "power2.out",
      opacity: 0,
      duration: 2,
    },
    2.5
  );
  
  // Top gradient animation
  miscTl.to(
    elements.topGradient,
    {
      "--gradient-point-start": '0%',
      "--gradient-point-end": '10%',
      ease: "none",
      duration: 3,
    },
    0
  );
  
  // Initial check
  updatePostcardInteractivity(postcardTl.scrollTrigger ? postcardTl.scrollTrigger.progress : 0);
  
  // Handle resize
  window.addEventListener('resize', () => {
    updatePostcardInteractivity(postcardTl.scrollTrigger.progress);
  });
  
  window.addEventListener('load', () => {
    updatePostcardInteractivity(postcardTl.scrollTrigger.progress);
  });
  
  return { postcardTl, miscTl };
}
