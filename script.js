import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling setup
const root = document.getElementById('root');
const postcard = document.getElementById('postcard');
const fadeOverlay = document.getElementById('fade-overlay'); // New: Reference to fade overlay
const mainText = document.getElementById('main-text');
const topFade = document.getElementById('progressive-blur-top');
const mainFlag = document.getElementById('main-flag-container');


// gsap.to(root, {
//     y: () => - (root.scrollHeight - window.innerHeight) + 'px',
//     ease: 'none',
//     scrollTrigger: {
//         trigger: root,
//         start: 'top top',
//         end: 'bottom bottom',
//         scrub: false,
//         invalidateOnRefresh: true
//     }
// });


gsap.from('#postcard', {
    y: -200,
    opacity: 0,
    scale: 0.5,
    ease: 'power2.out',
    duration: 2,
    scrollTrigger: {
        scroller: '#root',  // Fix: Track on #root
        trigger: '#main-text',
        start: 'top bottom',
        toggleActions: 'play none none reverse'
    }
});



// Create a timeline for the postcard animation (shrink, move up, and adjust y for alignment)
const postcardTl = gsap.timeline({
    scrollTrigger: {
        trigger: mainText,
        scroller: '#root',  // Track scrolling on #root (not window)
        start: 'top bottom-=200',  // Starts when mainText top hits viewport bottom (immediate on scroll start)
        end: 'top 20%',       // Ends when mainText top is at 20% from viewport top (adjust this to control the scroll distance; e.g., 'top top' for full viewport height)
        scrub: true,          // Scrubs animation with scroll (reversible on scroll up)
        markers: false,        // Uncomment for visual debug markers
        invalidateOnRefresh: true,  // Handle resizes better
    }
});

// Animate postcard: move up to 20px from top, adjust y to 0 (since transform-origin is top center), and shrink
postcardTl.to(postcard, {
    top: '400px',  // Final position: 20px from top edge
    scale: 0.1,   // Shrink to 20% size (adjust as needed)
    ease: 'none', // Linear with scroll (no easing for scrub)
    duration: 0.5   // Relative duration (1 = full timeline)
},0);

postcardTl.from(mainFlag, {
    y: 600,
    ease: 'power2.out', // Linear with scroll (no easing for scrub)
    opacity: 0,
    duration: 0.3   // Relative duration (1 = full timeline)
}, 0);

postcardTl.to(topFade, {
    '--gradient-start': 0,
    '--gradient-end': 0,
    ease: 'none',
    duration: 0.5
}, 0); 


// Starts at the same time as the postcard animation

// // New: Scale and pin postcard as it approaches top (starts immediately on scroll)
// ScrollTrigger.create({
//     trigger: mainText,
//     scroller: '#root',  // Track scrolling on #root (not window)
//     start: 'top bottom-=200px',  // Changed: Starts as soon as postcard top hits viewport bottom (immediate on scroll start)
//     end: 'top bottom-=300px',     // Ends when at 20px from top (px-based, close to edge)
//     markers: true,
//     scrub: true,
//     invalidateOnRefresh: true,  // Handle resizes better
//     // markers: true,  // Uncomment for visual debug markers
//     onUpdate: (self) => {
//         const progress = self.progress;  // 0 at start, 1 at end
//         const scale = 1 - (progress * 0.8);  // Linear scale from 1 to 0.2
//         const postcardTop = postcard.getBoundingClientRect().top;  // Current top position relative to viewport
//         const postcardNewTop = '50vh' * (1 - progress) 
//         const calculatedLeft = '50%';  // Centered (vw-relative implicitly via %)
//         const currentOpacity = parseFloat(window.getComputedStyle(postcard).opacity);  // For greying debug

//         // Enhanced Debugging: Log left values, opacity, and more
//         console.log('Postcard ScrollTrigger Update:', {
//             progress: progress.toFixed(2),
//             calculatedScale: scale.toFixed(2),
//             postcardTop: postcardTop.toFixed(0) + 'px',
//             currentOpacity: currentOpacity.toFixed(2) + ' (if <1, may appear grey in inspector)',
//             calculatedLeft: calculatedLeft,
//             windowInnerWidth: window.innerWidth,
//             currentParent: postcard.parentNode.id || 'body',  // Track if it's in #root or body
//             isPinned: progress >= 1
//         });
//         gsap.to(postcard, {
//             scale: scale,
//             top: postcardNewTop, 
//             duration: 0.5,  // Swift update
//             ease: 'power2.out',
//             overwrite: 'auto'
//         });

//         // New: Fade in the overlay based on same progress (0 to 0.8 opacity)
//         gsap.to(fadeOverlay, {
//             opacity: 0.8 - (progress * 0.8),
//             duration: 0.5,
//             ease: 'power2.out',
//             overwrite: 'auto'
//         });
//     },
//     toggleActions: 'play none none reverse'  // Enable full reversal on scroll up (scales back up and unpinns)
// });

// Edge indicators logic: One dynamic indicator per off-screen element, bound by ID
const indicatorMap = new Map(); // Key: hidden element ID, Value: indicator element
let isInitialLoad = true; // Flag for one-time load animation
let prevScrollTop = 0; // Track for size changes
const smallSize = 12; // Small diameter (px)
const fullSize = 40; // Full diameter (px)
const scrollThreshold = 30; // px from top for small size

function createIndicator(elId) {  // Pass elId to allow custom images if needed
    const indicator = document.createElement('div');
    indicator.className = 'edge-indicator';

    // Add image inside
    const img = document.createElement('img');
    img.src = 'assets/flag_icon.png';  // Placeholder; replace with actual. For per-indicator images: if (elId === 'hidden-1') img.src = 'assets/flag1.png'; etc.
    img.style.width = '100%';
    img.style.height = '50px';
    img.style.objectFit = 'contain';  // Or 'cover' – adjust as needed
    indicator.appendChild(img);

    // Start hidden and at small size for load
    gsap.set(indicator, { display: 'none', opacity: 0, scale: 0, width: smallSize, height: smallSize });
    gsap.set(img, { display: 'none' });  // Initially hide image
    document.body.appendChild(indicator);
    return indicator;
}

function updateEdgeIndicators() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const padding = 16; // Distance from edges
    const currentScrollTop = root.scrollTop;

    const hiddenElements = document.querySelectorAll('.edge-flag');
    const activeIndicators = []; // For load animation

    hiddenElements.forEach(el => {
        const elId = el.id;
        const rect = el.getBoundingClientRect();
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;

        // Check if fully off-screen
        const isOffTop = rect.bottom < 0;
        const isOffBottom = rect.top > viewportHeight;
        const isOffLeft = rect.right < 0;
        const isOffRight = rect.left > viewportWidth;

        if (isOffTop || isOffBottom || isOffLeft || isOffRight) {
            // Get or create bound indicator
            if (!indicatorMap.has(elId)) {
                indicatorMap.set(elId, createIndicator(elId));
            }
            const indicator = indicatorMap.get(elId);

            // Calculate vector and position
            const dx = targetCenterX - centerX;
            const dy = targetCenterY - centerY;

            let posX, posY, indicatorSize = (currentScrollTop <= scrollThreshold) ? smallSize : fullSize;
            if (Math.abs(dy) > Math.abs(dx)) {
                // Vertical edges
                const t = dy > 0 ? (viewportHeight / 2) / Math.abs(dy) : (-viewportHeight / 2) / Math.abs(dy);
                posX = centerX + dx * t;
                posX = Math.max(padding + indicatorSize / 2, Math.min(posX, viewportWidth - padding - indicatorSize / 2));
                posY = dy > 0 ? viewportHeight - padding - indicatorSize : padding;
            } else {
                // Horizontal edges
                const t = dx > 0 ? (viewportWidth / 2) / Math.abs(dx) : (-viewportWidth / 2) / Math.abs(dx);
                posY = centerY + dy * t;
                posY = Math.max(padding + indicatorSize / 2, Math.min(posY, viewportHeight - padding - indicatorSize / 2));
                posX = dx > 0 ? viewportWidth - padding - indicatorSize : padding;
            }

            // Set position instantly on init, animate on updates
            if (isInitialLoad) {
                gsap.set(indicator, {
                    left: posX - indicatorSize / 2,
                    top: posY - indicatorSize / 2
                });
            } else {
                gsap.to(indicator, {
                    left: posX - indicatorSize / 2,
                    top: posY - indicatorSize / 2,
                    duration: 0.5
                });
            }

            // Handle size change if scroll crossed threshold
            const shouldBeSmall = currentScrollTop <= scrollThreshold;
            if ((shouldBeSmall && prevScrollTop > scrollThreshold) || (!shouldBeSmall && prevScrollTop <= scrollThreshold)) {
                gsap.to(indicator, {
                    width: shouldBeSmall ? smallSize : fullSize,
                    height: shouldBeSmall ? smallSize : fullSize,
                    duration: 0.3,
                    ease: 'power1.inOut'
                });
            }

            // Toggle image visibility based on size (collapsed = hide image)
            const img = indicator.querySelector('img');
            if (shouldBeSmall) {
                gsap.set(img, { display: 'none' });
            } else {
                gsap.set(img, { display: 'block' });
            }

            // Collect for load animation
            activeIndicators.push(indicator);

            // Show (but keep hidden until animation)
            gsap.set(indicator, { display: 'block' });
        }
    });

    // Hide indicators for non-active (on-screen) elements
    indicatorMap.forEach((indicator, elId) => {
        const isActive = Array.from(hiddenElements).some(el => el.id === elId); // Simplified check
        if (!isActive) {
            gsap.to(indicator, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => { gsap.set(indicator, { display: 'none' }); }
            });
        }
    });

    // One-time load animation: Pop up with scale, staggered (starts small)
    if (isInitialLoad && activeIndicators.length > 0) {
        gsap.to(activeIndicators, {
            opacity: 1,
            scale: 1.2, // Grow beyond current (small) size
            duration: 0.3,
            stagger: 0.05, // 50ms between each
            ease: 'power1.out',
            onComplete: () => {
                gsap.to(activeIndicators, {
                    scale: 1, // Back to current (small) size
                    duration: 0.2,
                    stagger: 0.05,
                    ease: 'power1.in'
                });
            }
        });
        isInitialLoad = false; // Prevent re-run
    }

    // Update prevScrollTop for next call
    prevScrollTop = currentScrollTop;

    // Debugging: Log active indicators and size state
    console.log(`Updated indicators: ${activeIndicators.length} active (bound by ID), size: ${(currentScrollTop <= scrollThreshold) ? 'small (12px)' : 'full (40px)'}`);
}

function updateHouseWidth() {
    const mainText = document.getElementById('main-text');
    const mainTextWidth = mainText.offsetWidth;
    console.log(`Main text width: ${mainTextWidth}px`);
    // Set CSS custom property based on main-text width
    document.documentElement.style.setProperty('--house-width', `${mainTextWidth * 2.2}px`);
    console.log(`Updated --house-width to ${mainTextWidth * 1.5}px`);
}

window.addEventListener('load', updateHouseWidth);
window.addEventListener('resize', updateHouseWidth);

gsap.ticker.add(updateEdgeIndicators); // Calls on every frame (~60fps)
window.addEventListener('resize', updateEdgeIndicators);
updateEdgeIndicators(); // Initial check

