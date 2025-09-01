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

// Edge indicators logic: One dynamic indicator per off-screen element
let indicatorPool = []; // Reuse pool for efficiency

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
    const offScreenData = [];

    hiddenElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;

        // Only process if fully off-screen
        const isOffTop = rect.bottom < 0;
        const isOffBottom = rect.top > viewportHeight;
        const isOffLeft = rect.right < 0;
        const isOffRight = rect.left > viewportWidth;

        if (isOffTop || isOffBottom || isOffLeft || isOffRight) {
            // Calculate vector from viewport center to target center
            const dx = targetCenterX - centerX;
            const dy = targetCenterY - centerY;

            // Determine the edge and intersection point
            let edge, posX, posY;
            if (Math.abs(dy) > Math.abs(dx)) {
                // Vertical edges (top/bottom)
                const t = dy > 0 ? (viewportHeight / 2) / Math.abs(dy) : (-viewportHeight / 2) / Math.abs(dy);
                posX = centerX + dx * t;
                posX = Math.max(padding + indicatorSize / 2, Math.min(posX, viewportWidth - padding - indicatorSize / 2)); // Clamp
                posY = dy > 0 ? viewportHeight - padding - indicatorSize : padding; // Bottom or top edge
                edge = dy > 0 ? 'bottom' : 'top';
            } else {
                // Horizontal edges (left/right)
                const t = dx > 0 ? (viewportWidth / 2) / Math.abs(dx) : (-viewportWidth / 2) / Math.abs(dx);
                posY = centerY + dy * t;
                posY = Math.max(padding + indicatorSize / 2, Math.min(posY, viewportHeight - padding - indicatorSize / 2)); // Clamp
                posX = dx > 0 ? viewportWidth - padding - indicatorSize : padding; // Right or left edge
                edge = dx > 0 ? 'right' : 'left';
            }
            offScreenData.push({ edge, posX, posY });
        }
    });

    // Manage indicators: One per off-screen element
    const numNeeded = offScreenData.length;
    while (indicatorPool.length < numNeeded) {
        indicatorPool.push(createIndicator());
    }

    // Position and show active indicators (position only, no scale)
    offScreenData.forEach((data, index) => {
        const indicator = indicatorPool[index];
        gsap.to(indicator, {
            left: data.posX - indicatorSize / 2,
            top: data.posY - indicatorSize / 2,
            duration: 0.5
        });
        gsap.to(indicator, { 
            display: 'block', 
            opacity: 1, 
            duration: 0.5,
            ease: 'power1.inOut'
        });
    });

    // Hide excess indicators (no scale)
    for (let i = numNeeded; i < indicatorPool.length; i++) {
        gsap.to(indicatorPool[i], { 
            opacity: 0, 
            duration: 0.5, 
            onComplete: function() {
                indicatorPool[i].style.display = 'none'; // Fixed: Direct reference, no param
            }
        });
    }

    // Debugging: Log number of active indicators
    if (numNeeded !== indicatorPool.filter(ind => ind.style.display !== 'none').length) {
        console.log(`Updated indicators: ${numNeeded} active (one per off-screen element)`);
    }
}

// Event listeners
window.addEventListener('scroll', updateEdgeIndicators);
root.addEventListener('scroll', updateEdgeIndicators);
window.addEventListener('resize', updateEdgeIndicators);
updateEdgeIndicators(); // Initial check

// Make hidden elements visible for testing
document.querySelectorAll('.hidden-element').forEach(el => el.style.display = 'block');
