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

function createIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'edge-indicator';
    document.body.appendChild(indicator);
    return indicator;
}

function updateEdgeIndicators() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const padding = 16; // Distance from edges
    const indicatorSize = 40; // For clamping

    const hiddenElements = document.querySelectorAll('.hidden-element');
    const activeIds = new Set(); // Track active (off-screen) IDs this update

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
            activeIds.add(elId);

            // Get or create bound indicator
            if (!indicatorMap.has(elId)) {
                indicatorMap.set(elId, createIndicator());
            }
            const indicator = indicatorMap.get(elId);

            // Calculate vector and position
            const dx = targetCenterX - centerX;
            const dy = targetCenterY - centerY;

            let posX, posY;
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

            // Position and show
            gsap.to(indicator, {
                left: posX - indicatorSize / 2,
                top: posY - indicatorSize / 2,
                duration: 0.5
            });
            gsap.to(indicator, { 
                display: 'block', 
                opacity: 1, 
                duration: 0.5,
                ease: 'power1.inOut'
            });
        }
    });

    // Hide indicators for non-active (on-screen) elements
    indicatorMap.forEach((indicator, elId) => {
        if (!activeIds.has(elId)) {
            gsap.to(indicator, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => { indicator.style.display = 'none'; }
            });
        }
    });

    // Debugging: Log active indicators
    console.log(`Updated indicators: ${activeIds.size} active (bound by ID)`);
}

// Event listeners
window.addEventListener('scroll', updateEdgeIndicators);
root.addEventListener('scroll', updateEdgeIndicators);
window.addEventListener('resize', updateEdgeIndicators);
updateEdgeIndicators(); // Initial check

// Make hidden elements visible for testing
document.querySelectorAll('.hidden-element').forEach(el => el.style.display = 'block');
