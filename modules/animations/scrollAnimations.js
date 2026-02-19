// modules/animations/scrollAnimations.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { elements } from '../../shared/elements.js';
import { config } from '../../shared/config.js';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
  const root = elements.root;

  // ── Parallax sky background ──
  // Move sky-bg at 50% scroll speed via GSAP
  gsap.to(elements.skyBg, {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: elements.mainContainer,
      scroller: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  // ── Top gradient fade-out ──
  gsap.to(elements.topGradient, {
    '--gradient-point-start': '0%',
    '--gradient-point-end': '5%',
    ease: 'none',
    scrollTrigger: {
      trigger: elements.heroSection,
      scroller: root,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  // ── Flag entrance ──
  gsap.from(elements.mainFlag, {
    y: 600,
    opacity: 0,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: elements.heroSection,
      scroller: root,
      start: 'top bottom-=100',
      end: 'top 40%',
      scrub: true,
    },
  });

  // ── Hero text fade-out ──
  gsap.to(elements.heroSection, {
    opacity: 0,
    y: -60,
    ease: 'none',
    scrollTrigger: {
      trigger: elements.heroSection,
      scroller: root,
      start: 'top 18%',
      end: 'top -10%',
      scrub: true,
    },
  });

  // ── Section parade — each section fades in from below, fades out upward ──
  // Uses a single timeline per section to avoid conflicting scrubbed tweens
  // on the same properties (opacity, y).
  const sections = [
    elements.testimonial1,
    elements.testimonial2,
    elements.cardScene,
    elements.featureList,
  ];

  sections.forEach((section) => {
    if (section !== elements.featureList) {
      // Full range: top 85% → top -5% (90vp of scroll distance)
      // Fade-in:  0–39  (top 85% → top 50%)  = 35/90 ≈ 39%
      // Hold:    39–67  (top 50% → top 25%)
      // Fade-out: 67–100 (top 25% → top -5%) = 30/90 ≈ 33%
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          scroller: root,
          start: 'top 85%',
          end: 'top -5%',
          scrub: true,
        },
      });
      tl.fromTo(section,
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 39, ease: 'none' },
        0
      );
      tl.to(section,
        { opacity: 0, y: -80, duration: 33, ease: 'none' },
        67
      );
    } else {
      // Feature list: only fade in, no fade out (last section before house)
      gsap.fromTo(section,
        { opacity: 0, y: 100 },
        {
          opacity: 1, y: 0, ease: 'none',
          scrollTrigger: {
            trigger: section,
            scroller: root,
            start: 'top 85%',
            end: 'top 50%',
            scrub: true,
          },
        }
      );
    }
  });

  // ── Feature labels fly out of card scene on scroll ──
  const featureLabels = elements.featureLabels;
  featureLabels.forEach((label, i) => {
    // Phase 1: reveal the label (fade in + slight outward push)
    gsap.to(label, {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: elements.cardScene,
        scroller: root,
        start: `bottom 70%`,
        end: `bottom 55%`,
        scrub: true,
      },
    });

    // Phase 2: fly the label downward out of the card scene
    gsap.to(label, {
      y: 300 + i * 60,
      x: 0,
      opacity: 0,
      ease: 'power1.in',
      scrollTrigger: {
        trigger: elements.cardScene,
        scroller: root,
        start: `bottom ${50 - i * 5}%`,
        end: `bottom ${25 - i * 5}%`,
        scrub: true,
      },
    });
  });

  // ── Feature list items stagger in alongside section fade ──
  elements.featureListItems.forEach((item, i) => {
    gsap.fromTo(item,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: {
          trigger: elements.featureList,
          scroller: root,
          start: `top ${80 - i * 8}%`,
          end: `top ${55 - i * 8}%`,
          scrub: true,
        },
      }
    );
  });

  // ── Supporter container — show at bottom of page ──
  ScrollTrigger.create({
    trigger: elements.bottomHouse,
    scroller: root,
    start: 'top bottom',
    onEnter: () => {
      gsap.to(elements.supporterContainer, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          elements.supporterContainer.style.pointerEvents = 'auto';
        },
      });
    },
    onLeaveBack: () => {
      gsap.to(elements.supporterContainer, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
      elements.supporterContainer.style.pointerEvents = 'none';
    },
  });

  // ── Flag max-height — extend pole as page grows ──
  const updateFlagHeight = () => {
    const mainContainer = elements.mainContainer;
    const flagContainer = elements.mainFlag;
    if (mainContainer && flagContainer) {
      const maxHeight = mainContainer.offsetHeight - flagContainer.offsetTop;
      flagContainer.style.maxHeight = `${maxHeight}px`;
    }
  };

  updateFlagHeight();
  window.addEventListener('resize', updateFlagHeight);
  ScrollTrigger.addEventListener('refresh', updateFlagHeight);
}
