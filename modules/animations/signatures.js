// modules/animations/signatures.js
import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';
import { isTouchDevice } from '../../shared/device.js';

export function initSignatures() {
  const touchDevice = isTouchDevice();
  
  elements.signatures.forEach((signature) => {
    const hoverTl = gsap.timeline({ paused: true });
    hoverTl.to(signature, {
      scale: 1.1,
      y: -10,
      duration: 0.3,
      rotation: 5,
      ease: "back.out(4)",
    });
    
    const clickTl = gsap.timeline({ paused: true });
    clickTl
      .to(signature, {
        scale: 0.9,
        duration: 0.05,
        ease: "power3.in",
      })
      .to(signature, {
        scale: 1.0,
        duration: 0.3,
        ease: "back.inOut(8)",
      });
    
    if (!touchDevice) {
      signature.addEventListener("mouseenter", () => {
        hoverTl.timeScale(1);
        hoverTl.play();
      });
      
      signature.addEventListener("mouseleave", () => {
        hoverTl.timeScale(1.5);
        hoverTl.reverse();
      });
      
      signature.addEventListener("mousedown", () => clickTl.restart());
    }
    
    signature.addEventListener("touchstart", () => clickTl.restart());
  });
}

export function initSignupCardAnimation() {
    const signupBanner = document.querySelector("#inline-signup-banner");
    const signupCard = document.querySelector("#inline-signup-banner img");

    if (signupBanner && signupCard) {
        // Looping animation
        const loopTl = gsap.to(signupCard, {
            y: -10,
            rotation: 7,
            duration: 4,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true,
            repeatDelay: 1,
        });

        // Hover animation
        const hoverTl = gsap.timeline({ paused: true });
        hoverTl.to(signupCard, {
            y: -35, // Move it up further
            rotation: 3,            
            duration: 0.3,
            ease: "power2.out",
        });

        signupBanner.addEventListener("mouseenter", () => {
            loopTl.pause();
            hoverTl.play();
        });

        signupBanner.addEventListener("mouseleave", () => {
            hoverTl.reverse();
            // Resume the looping animation after the hover animation is complete
            gsap.delayedCall(hoverTl.duration(), () => {
                loopTl.play();
            });
        });
    }
}
