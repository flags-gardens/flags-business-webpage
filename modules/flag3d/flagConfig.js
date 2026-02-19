// modules/flag3d/flagConfig.js
// All tweakable parameters for the 3D flag scene.
// To change the flag image, update flag.texture to a new path.

export const flagConfig = {

  // ── Flag ──
  flag: {
    shape: 'rectangular',       // 'rectangular' | 'pennant'
    width: 3.0,                 // world units (X axis, from pole outward)
    height: 2.04,               // world units (Y axis) — matches 956:652 image ratio
    segmentsX: 25,              // cloth simulation grid X (more = smoother but heavier)
    segmentsY: 18,              // cloth simulation grid Y
    texture: 'assets/images/Frame 5118.png',
    color: '#fcf7eb',           // flag background color
    doubleSided: true,
    opacity: 1.0,
    poleOffset: -0.1,             // vertical offset from pole top (negative = below crown)
  },

  // ── Pole ──
  pole: {
    height: 30.0,
    radius: 0.045,
    segments: 12,
    color: '#cdcdcd',
    metalness: .6,
    roughness: 0.5,
  },

  // ── Crown (top of pole) ──
  crown: {
    shape: 'sphere',
    radius: 0.09,
    color: '#cdcdcd',
    metalness: 0.6,
    roughness: 0.5,
  },

  // ── Base ──
  base: {
    shape: 'none',
    width: 0.3,
    height: 0.15,
    color: '#a1a1a1',
    metalness: 0.5,
    roughness: 0.5,
  },

  // ── Lighting ──
  lighting: {
    ambient: {
      color: '#FFFFFF',
      intensity: 1.9
    },
    directional: {
      color: '#FFF8E7',
      intensity: 0.9,
      position: { x: 3, y: 5, z: 7 },
    },
    point: null,
  },

  // ── Camera ──
  camera: {
    fov: 28,
    near: -50,
    far: 100,
    padLeft: 0.4,
    padRight: 0.3,
  },

  // ── Wind ──
  // Wind is now a real physics force applied to the cloth simulation.
  // Gravity is hardcoded (9.8 m/s²). Adjust strength to control
  // how much the wind fights gravity.
  wind: {
    strength: 0.55,             // wind force magnitude
    direction: { x: 1.0, y: 0.0 },
    gustInterval: 3.5,          // seconds between gusts
    gustStrength: 0.3,          // additional force during gust
    gustDuration: 1.5,          // how long a gust lasts
  },

  // ── Renderer ──
  renderer: {
    antialias: true,
    alpha: true,
    maxPixelRatio: 2,
  },
};
