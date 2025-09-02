gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling setup
const root = document.getElementById('root');
const mainContainer = document.getElementById('main-container');

// Set up smooth scroll using GSAP
gsap.to(root, {
    y: () => - (root.scrollHeight - window.innerHeight) + 'px',
    ease: 'none',
    scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true
    }
});

// Animate postcard on scroll
gsap.from('#postcard', {
    y: -100,
    opacity: 0,
    duration: 1,
    scrollTrigger: {
        trigger: '#main-text',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    }
});

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

    const hiddenElements = document.querySelectorAll('.hidden-element');
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

// Event listeners
window.addEventListener('scroll', updateEdgeIndicators);
root.addEventListener('scroll', updateEdgeIndicators);
window.addEventListener('resize', updateEdgeIndicators);
updateEdgeIndicators(); // Initial check

// Make hidden elements visible for testing
document.querySelectorAll('.hidden-element').forEach(el => el.style.display = 'block');
