

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import flagIcon1 from "./assets/edge_indicators/flag_icon_1.png";
import flagIcon2 from "./assets/edge_indicators/flag_icon_2.png";
import flagIcon3 from "./assets/edge_indicators/flag_icon_3.png";
import flagIcon4 from "./assets/edge_indicators/flag_icon_4.png";

gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling setup
const root = document.getElementById("root");
const postcard = document.getElementById("postcard");
const fadeOverlay = document.getElementById("fade-overlay"); // New: Reference to fade overlay
const mainText = document.getElementById("main-text");
const topFade = document.getElementById("top-gradient");
const mainFlag = document.getElementById("main-flag-container");

const isMobile = window.innerWidth <= 900;


// gsap.to(root, {
//   y: () => -(root.scrollHeight - window.innerHeight) + "px",
//   ease: "none",
//   scrollTrigger: {
//     trigger: root,
//     start: "top top",
//     end: "bottom bottom",
//     scrub: false,
//     invalidateOnRefresh: true,
//   },
// });

// gsap.from("#postcard", {
//   y: -200,
//   opacity: 0,
//   scale: 0.5,
//   ease: "power2.out",
//   duration: 2,
//   scrollTrigger: {
//     scroller: "#root", // Fix: Track on #root
//     trigger: "#main-text",
//     start: "top bottom",
//     toggleActions: "play none none reverse",
//   },
// });

// Create a timeline for the postcard animation (shrink, move up, and adjust y for alignment)

const miscTl = gsap.timeline({
  scrollTrigger: {
    trigger: mainText,
    scroller: "#root", // Track scrolling on #root (not window)
    start: "top bottom-=200", // Starts when mainText top hits viewport bottom (immediate on scroll start)
    end: "top 30%", // Ends when mainText top is at 20% from viewport top (adjust this to control the scroll distance; e.g., 'top top' for full viewport height)
    scrub: true, // Scrubs animation with scroll (reversible on scroll up)
    markers: false, // Uncomment for visual debug markers
    invalidateOnRefresh: true, // Handle resizes better
  },
});


const postcardTl = gsap.timeline({
  scrollTrigger: {
    trigger: mainText,
    scroller: "#root", // Track scrolling on #root (not window)
    start: "top bottom-=200", // Starts when mainText top hits viewport bottom (immediate on scroll start)
    end: "top 10%", // Ends when mainText top is at 20% from viewport top (adjust this to control the scroll distance; e.g., 'top top' for full viewport height)
    scrub: true, // Scrubs animation with scroll (reversible on scroll up)
    markers: false, // Uncomment for visual debug markers
    invalidateOnRefresh: true, // Handle resizes better
    onUpdate: (self) => {  
      updatePostcardInteractivity(self.progress);  // Check on every scrub update
      console.log(`Scroll progress: ${self.progress}`);
    },
  },
});

// Animate postcard: move up to 20px from top, adjust y to 0 (since transform-origin is top center), and shrink
postcardTl.to(
  postcard,
  {
    top: isMobile ? "200px" : "400px",  // Smaller value for mobile
    scale: 0.1, // Shrink to 20% size (adjust as needed)
    ease: "back.inOut", // Linear with scroll (no easing for scrub)
    duration: 2, // Relative duration (1 = full timeline)
  },
  0,
);

postcardTl.to(
  '#main-text',
  {
    ease: "power1.out", 
    opacity: 1,
    duration: 1,
  },
  0.5,
);


miscTl.from(
  mainFlag,
  {
    y: 600,
    ease: "power2.out", // Linear with scroll (no easing for scrub)
    opacity: 0,
    duration: 2, // Relative duration (1 = full timeline)
  },
  2.5,
);

miscTl.to(
  topFade,
  {
    "--gradient-point-start": '0%',
    "--gradient-point-end": '10%',
    ease: "none",
    duration: 3,
  },
  0,
);

// Edge indicators logic: One dynamic indicator per off-screen element, bound by ID
const indicatorMap = new Map(); // Key: hidden element ID, Value: indicator element
let isInitialLoad = true; // Flag for one-time load animation
let prevScrollTop = 0; // Track for size changes
const smallSize = 12; // Small diameter (px)
const fullSize = 40; // Full diameter (px)
const scrollThreshold = 160; // px from top for small size

function createIndicator(elId) {
  const indicator = document.createElement("div");
  indicator.className = "edge-indicator";

  // Add image inside
  const img = document.createElement("img");

  // ✅ Map different images to different element IDs
  const imageMap = {
    "edge-flag-1": flagIcon1,
    "edge-flag-2": flagIcon2,
    "edge-flag-3": flagIcon3,
    "edge-flag-4": flagIcon4,
  };

  // Use specific image or fallback to default
  img.src = imageMap[elId] || "assets/flag_icon.png";

  img.style.width = "100%";
  img.style.height = "40px";
  img.style.objectFit = "contain";
  indicator.appendChild(img);

  gsap.set(indicator, {
    display: "none",
    opacity: 0,
    scale: 0,
    width: smallSize,
    height: smallSize,
  });
  gsap.set(img, { display: "none" });
  document.body.appendChild(indicator);
  return indicator;
}

function updateEdgeIndicators() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const padding = 24; // Distance from edges
  const currentScrollTop = root.scrollTop;

  const hiddenElements = document.querySelectorAll(".edge-flag");
  const activeIndicators = []; // For load animation

  hiddenElements.forEach((el) => {
    const elId = el.id;
    const rect = el.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;

    // Check if fully off-screen
    const isOffTop = rect.bottom < 0;
    const isOffBottom = rect.top > viewportHeight;
    const isOffLeft = rect.right < 0;
    const isOffRight = rect.left > viewportWidth;

    // Check if ANY part is visible (for fading when even partially on-screen)
    const isPartiallyVisible =
      rect.bottom > 0 &&
      rect.top < viewportHeight &&
      rect.right > 0 &&
      rect.left < viewportWidth;

    if ((isOffTop || isOffBottom || isOffLeft || isOffRight) && !isPartiallyVisible) {
      // Get or create bound indicator
      if (!indicatorMap.has(elId)) {
        indicatorMap.set(elId, createIndicator(elId));
      }
      const indicator = indicatorMap.get(elId);

      // Improved calculation with clamping
      const dx = targetCenterX - centerX;
      const dy = targetCenterY - centerY;
      const angle = Math.atan2(dy, dx);

      let posX, posY;
      let indicatorSize = currentScrollTop <= scrollThreshold ? smallSize : fullSize;

      // Calculate edge position more accurately
      const halfSize = indicatorSize / 2;
      const maxX = viewportWidth - padding - halfSize;
      const minX = padding + halfSize;
      const maxY = viewportHeight - padding - halfSize;
      const minY = padding + halfSize;

      // Determine which edge to place indicator on
      const absCosThetaX = Math.abs((maxX - centerX) / Math.cos(angle));
      const absCosThetaY = Math.abs((maxY - centerY) / Math.sin(angle));

      if (absCosThetaX < absCosThetaY) {
        // Hit left or right edge first
        posX = dx > 0 ? maxX : minX;
        posY = centerY + Math.tan(angle) * (posX - centerX);
        posY = Math.max(minY, Math.min(posY, maxY));
      } else {
        // Hit top or bottom edge first
        posY = dy > 0 ? maxY : minY;
        posX = centerX + (posY - centerY) / Math.tan(angle);
        posX = Math.max(minX, Math.min(posX, maxX));
      }

      // Set position instantly on init, animate on updates
      if (isInitialLoad) {
        gsap.set(indicator, {
          left: posX - halfSize,
          top: posY - halfSize,
        });
      } else {
        gsap.to(indicator, {
          left: posX - halfSize,
          top: posY - halfSize,
          duration: 0.5,
          opacity: 1,
          scale: 1,
        });
      }

      // Handle size change if scroll crossed threshold
      const shouldBeSmall = currentScrollTop <= scrollThreshold;
      if (
        (shouldBeSmall && prevScrollTop > scrollThreshold) ||
        (!shouldBeSmall && prevScrollTop <= scrollThreshold)
      ) {
        gsap.to(indicator, {
          width: shouldBeSmall ? smallSize : fullSize,
          height: shouldBeSmall ? smallSize : fullSize,
          duration: 0.3,
          ease: "power1.inOut",
        });
      }

      // Toggle image visibility based on size (collapsed = hide image)
      const img = indicator.querySelector("img");
      if (shouldBeSmall) {
        gsap.set(img, { display: "none" });
      } else {
        gsap.set(img, { display: "block" });
      }

      // Collect for load animation
      activeIndicators.push(indicator);

      // Show (but keep hidden until animation)
      gsap.set(indicator, { display: "block" });
    } else {
      // Element is partially or fully visible - fade out indicator if it exists
      if (indicatorMap.has(elId)) {
        const indicator = indicatorMap.get(elId);
        gsap.to(indicator, {
          opacity: 0,
          scale: 0.5,
          duration: 0.3,
          onComplete: () => {
            gsap.set(indicator, { display: "none" });
          },
        });
      }
    }
  });

  // Hide indicators for non-active (on-screen) elements
  indicatorMap.forEach((indicator, elId) => {
    const isActive = Array.from(hiddenElements).some((el) => el.id === elId); // Simplified check
    if (!isActive) {
      gsap.to(indicator, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          gsap.set(indicator, { display: "none" });
        },
      });
    }
  });

  // One-time load animation: Pop up with scale, staggered (starts small)
  if (isInitialLoad && activeIndicators.length > 0) {
    gsap.to(activeIndicators, {
      opacity: 1,
      scale: 1.2, // Grow beyond current (small) size
      duration: 0.2,
      stagger: 0.05, // 50ms between each
      ease: "power1.out",
      onComplete: () => {
        gsap.to(activeIndicators, {
          scale: 1, // Back to current (small) size
          duration: 0.2,
          stagger: 0.05,
          ease: "power1.in",
        });
      },
    });
    isInitialLoad = false; // Prevent re-run
  }

  // Update prevScrollTop for next call
  prevScrollTop = currentScrollTop;

  // Debugging: Log active indicators and size state
  console.log(
    `Updated indicators: ${activeIndicators.length} active (bound by ID), size: ${currentScrollTop <= scrollThreshold ? "small (12px)" : "full (40px)"}`,
  );
}


function updateHouseWidth() {
  const mainText = document.getElementById("main-text");
  const mainTextWidth = mainText.offsetWidth;
  console.log(`Main text width: ${mainTextWidth}px`);
  // Set CSS custom property based on main-text width
  document.documentElement.style.setProperty(
    "--house-width",
    `${mainTextWidth * 2.2}px`,
  );
  console.log(`Updated --house-width to ${mainTextWidth * 1.5}px`);
}

function updateFlagMaxHeight() {
  const mainContainer = document.getElementById("main-container");
  const mainFlagContainer = document.getElementById("main-flag-container");

  if (mainContainer && mainFlagContainer) {
    const mainHeight = mainContainer.offsetHeight;
    const flagTopOffset = mainFlagContainer.offsetTop; // Y position relative to its offset parent

    const maxHeight = mainHeight - flagTopOffset;
    mainFlagContainer.style.maxHeight = `${maxHeight}px`;

    console.log(
      `Main height: ${mainHeight}px, Flag top offset: ${flagTopOffset}px, Max height: ${maxHeight}px`,
    );
  }
}




// Function to enable/disable postcard clickability based on minimization state
function updatePostcardInteractivity(progress) {
  if (progress >= 0.95) {  // Consider "minimized" at ~95% timeline progress (adjust threshold as needed)
    postcard.style.pointerEvents = 'auto';  // Enable clicks
    postcard.style.cursor = 'pointer';  // Ensure cursor is visible
  } else {
    postcard.style.pointerEvents = 'none';  // Disable clicks
    postcard.style.cursor = 'default';  // Reset cursor
  }
}

// Initial check (in case page loads with scroll already applied)
updatePostcardInteractivity(postcardTl.scrollTrigger ? postcardTl.scrollTrigger.progress : 0);

// Click event: Animate scroll to top
postcard.addEventListener('mouseenter', () => {
  if (postcardTl.scrollTrigger.progress < 0.95) return; // Only if minimized
  gsap.to(postcard, {
    scale: 0.115,
    duration: 0.3,
    ease: "power1.out",
  });
});

postcard.addEventListener('mouseleave', () => {
  if (postcardTl.scrollTrigger.progress < 0.95) return; // Only if minimized
  gsap.to(postcard, {
    scale: 0.1,
    duration: 0.3,
    ease: "power1.out",
  });
});

postcard.addEventListener('click', () => {
  // Only proceed if minimized (double-check to be safe)
  if (postcardTl.scrollTrigger.progress < 0.95) return;

  // Temporarily disable pointer-events to prevent multiple clicks
  postcard.style.pointerEvents = 'none';

  // Animate root.scrollTop to 0 over 300ms
  gsap.to(root, {
    scrollTop: 0,  // Tween to top
    duration: 0.9,  // 300ms
    ease: 'power1.inOut',  // Soft, smooth easing
    onComplete: () => {
      // Re-enable interactivity (will be disabled by updatePostcardInteractivity if not minimized)
      updatePostcardInteractivity(postcardTl.scrollTrigger.progress);
    },
  });
});




// Handle resize/load to re-check interactivity
window.addEventListener('resize', () => updatePostcardInteractivity(postcardTl.scrollTrigger.progress));
window.addEventListener('load', () => updatePostcardInteractivity(postcardTl.scrollTrigger.progress));

// More elegant GSAP approach
document.querySelectorAll(".signature").forEach((signature) => {
  const wrapper = signature.parentElement;
  const textElement = wrapper.querySelector(".signature-text");
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Create reusable timeline
  const hoverTl = gsap.timeline({ paused: true });
  hoverTl
    .to(signature, {
      scale: 1.1,
      y: -10,
      duration: 0.3,
      transform: 'rotate(5deg)',
      ease: "back.out(4)",
    })

  const clickTl = gsap.timeline({ paused: true });
  clickTl
    .to(signature, {
      scale: 0.9,
      duration: 0.05,

      ease: "power3.in",
    })
    .to(signature, {
      scale: 1.00,
      duration: 0.3,
      ease: "back.inOut(8)",
    })


  // Control timeline with events
  // Only add hover events on non-touch devices
  if (!isTouchDevice) {
    
    signature.addEventListener("mouseenter", () => {
      hoverTl.timeScale(1); // Normal speed
      hoverTl.play();
    });

    signature.addEventListener("mouseleave", () => {
      hoverTl.timeScale(1.5); // Normal speed
      hoverTl.reverse();
    });
    
    signature.addEventListener("mousedown", () => clickTl.restart());
  }
  signature.addEventListener("touchstart", () => clickTl.restart());
});

// Call on load and resize
window.addEventListener("load", updateFlagMaxHeight);
window.addEventListener("resize", updateFlagMaxHeight);
// If content changes dynamically, call updateFlagMaxHeight() after updates

window.addEventListener("load", updateHouseWidth);
window.addEventListener("resize", updateHouseWidth);

gsap.ticker.add(updateEdgeIndicators); // Calls on every frame (~60fps)
window.addEventListener("resize", updateEdgeIndicators);
updateEdgeIndicators(); // Initial check

const impressumLink = document.getElementById("impressum-link");
const impressumOverlay = document.getElementById("impressum-overlay");

impressumLink.addEventListener("click", (e) => {
    e.preventDefault();
    impressumOverlay.classList.add("visible");
});

impressumOverlay.addEventListener("click", () => {
    impressumOverlay.classList.remove("visible");
});



// Add this after your existing impressum overlay code

