import { gsap } from 'gsap';
import { elements } from '../../shared/elements.js';

function closeSignupCard() {
    const { realSignupCard, realSignupCardContainer, cardOverlay, inlineSignupBanner } = elements;

    gsap.to(realSignupCard, {
        y: "100vh",
        scale: 0.8,
        opacity: 0,
        duration: 0.1,
        onComplete: () => {
            gsap.set(realSignupCardContainer, { display: "none" });
            // Reset the card's position for the next time it opens
            gsap.set(realSignupCard, { y: 0, scale: 1, opacity: 1 });
        }
    });

    gsap.to(cardOverlay, { opacity: 0, onComplete: () => gsap.set(cardOverlay, { display: "none" }) });


}

export function initSignupCard() {
    const { inlineSignupBanner, realSignupCardContainer, realSignupCard, cardOverlay } = elements;

    if (inlineSignupBanner && realSignupCardContainer && realSignupCard && cardOverlay) {
        inlineSignupBanner.addEventListener("click", () => {
            // Make the real card and overlay visible
            gsap.set(realSignupCardContainer, { display: "block", pointerEvents: "auto" });
            gsap.to(cardOverlay, { 
                display: "block",
                opacity: 1,
                duration: 0.05 
            });


            // Animate the card
            gsap.from(realSignupCard, {
                y: "100vh", // Start from the bottom of the screen
                scale: 0.8, // Start smaller
                opacity: 0,
                duration: 0.6,
                ease: "elastic.out(1, 1.3)", // A nice bouncy ease
            });
        });

        window.addEventListener("click", (e) => {
            if (realSignupCardContainer.style.display === "block") {
                if (!realSignupCard.contains(e.target) && e.target !== inlineSignupBanner && !inlineSignupBanner.contains(e.target)) {
                    closeSignupCard();
                }
            }
        });

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && realSignupCardContainer.style.display === "block") {
                closeSignupCard();
            }
        });

        const emailInput = document.getElementById("EMAIL");

        if (emailInput) {
            emailInput.addEventListener("focus", () => {
                if (window.innerWidth < 900) { // Only on mobile
                    setTimeout(() => {
                        realSignupCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 500); // Delay to allow keyboard to appear
                }
            });
        }
    }
}
