// supporterPopout.js (modified with smoother color transitions)

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Scroll resistance and overlay trigger using supporter-container
const supporterContainer = document.getElementById('supporter-container');
const scrollOverlay = document.getElementById('scroll-overlay');
let overscrollAmount = 0;
const RESISTANCE_THRESHOLD = 100;
const RESISTANCE_FACTOR = 0.6; // Adjust for sensitivity
const DECAY_RATE = 0.3; // Slightly reduced for smoother decay (less jerky steps)
const COLOR_TWEEN_DURATION = 0.1; // Short duration for smooth color updates

let sentenceTriggered = false;
let resetTimeout = null;
let colorTween = null; // Track active color tween to overwrite

// PERFORMANCE: GSAP quickSetters for direct, fast updates
const setBackgroundColor = gsap.quickSetter(supporterContainer, "backgroundColor");

// Function to check if at bottom of scroll
function isAtBottom() {
    return Math.abs(root.scrollHeight - root.scrollTop - root.clientHeight) < 5;
}

// Helper to get interpolated RGBA based on progress (0-1)
function getInterpolatedColor(progress) {
    const alpha = 0.1176 + progress * (1 - 0.1176); // From ~0.1176 (1e hex) to 1
    return `rgba(255, 255, 255, ${alpha})`;
}

// Smoothly tween to new color based on current overscrollAmount
function updateColor() {
    const progress = overscrollAmount / RESISTANCE_THRESHOLD;
    const targetColor = getInterpolatedColor(progress);
    
    // Kill any existing tween and start a new short one for smoothness
    if (colorTween) colorTween.kill();
    colorTween = gsap.to(supporterContainer, {
        backgroundColor: targetColor,
        duration: COLOR_TWEEN_DURATION,
        ease: "power1.out",
        overwrite: "auto"
    });
}

// Function to reset with fast snap-back animation
function resetSupporter() {
    if (sentenceTriggered) return;
    
    overscrollAmount = 0;
    if (colorTween) colorTween.kill();
    gsap.to(supporterContainer, {
        backgroundColor: '#ffffff1e', // Reset to original pale white
        duration: 0.1, // Slightly longer for smoother reset
        ease: "power2.out",
        overwrite: true
    });
}

// Debounced reset (now less necessary with decay, but kept for full reset)
function scheduleReset(delay = 200) {
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
        if (!sentenceTriggered && overscrollAmount > 0) {
            resetSupporter();
        }
    }, delay);
}

// Decay function (runs every frame via GSAP ticker)
function decayOverscroll() {
    if (!sentenceTriggered && overscrollAmount > 0) {
        overscrollAmount = Math.max(0, overscrollAmount - DECAY_RATE);
        updateColor();
        
        if (overscrollAmount <= 0) {
            resetSupporter();
        }
    }
}

// Add to GSAP ticker for per-frame updates
gsap.ticker.add(decayOverscroll);

// Unified handler for wheel and touch
function handleOverscroll(delta) {
    if (!isAtBottom() || sentenceTriggered) return;
    
    // Only accumulate if delta is positive (downward overscroll)
    if (delta > 0) {
        overscrollAmount = Math.min(overscrollAmount + delta * RESISTANCE_FACTOR, RESISTANCE_THRESHOLD);
        updateColor();
        
        if (overscrollAmount >= RESISTANCE_THRESHOLD) {
            triggerSupporterPopout();
        } else {
            scheduleReset();
        }
    }
}

// Wheel event (throttled via RAF)
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
        // If scrolling up, accelerate decay or reset
        overscrollAmount = Math.max(0, overscrollAmount + deltaY * RESISTANCE_FACTOR); // deltaY negative will subtract
        updateColor();
    }
}, { passive: false });

// Touch events (fixed for incremental delta)
let lastY = 0;

root.addEventListener('touchstart', (e) => {
    lastY = e.touches[0].clientY;
});

root.addEventListener('touchmove', (e) => {
    if (!isAtBottom() || sentenceTriggered) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = lastY - currentY; // Positive if moving finger up (scroll down)
    
    handleOverscroll(deltaY);
    
    lastY = currentY; // Update for next incremental delta
}, { passive: false });

root.addEventListener('touchend', () => {
    if (!sentenceTriggered && overscrollAmount > 0) {
        scheduleReset();
    }
});

// Trigger popout
function triggerSupporterPopout() {
    if (sentenceTriggered) return;
    sentenceTriggered = true;
    
    clearTimeout(resetTimeout);
    
    // Ensure color is updated to full before showing overlay
    updateColor(); // Force one last update to match overscrollAmount
    
    // Instantly set to full opaque as a fallback
    gsap.set(supporterContainer, {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        overwrite: true
    });
    
    // Show the overlay (no additional animation on container)
    scrollOverlay.classList.add('active');
}

// Reset trigger
function resetSupporterTrigger() {
    sentenceTriggered = false;
    overscrollAmount = 0;
    scrollOverlay.classList.remove('active');
    
    clearTimeout(resetTimeout);
    
    gsap.to(supporterContainer, {
        backgroundColor: '#ffffff1e', // Reset to pale
        duration: 0.1,
        ease: "power2.inOut",
        overwrite: true
    });
}

// Close overlay
const closeOverlay = document.getElementById('close-overlay');
if (closeOverlay) {
    closeOverlay.addEventListener('click', resetSupporterTrigger);
}

scrollOverlay.addEventListener('click', (e) => {
    if (e.target === scrollOverlay) {
        resetSupporterTrigger();
    }
});
