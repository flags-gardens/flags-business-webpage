# Web 3D Flag Maker

Real-time 3D waving flag rendered with Three.js, replacing the pre-rendered Blender video.

## Quick Start

### Swap the flag image

1. Drop your image (PNG/JPG) into `assets/flag-textures/`
2. Open `modules/flag3d/flagConfig.js`
3. Set `flag.texture` to the path:
   ```js
   texture: 'assets/flag-textures/your-image.png',
   ```
4. Save — Vite hot-reloads automatically

### Use a solid color instead

Set `flag.texture` to `null` and change `flag.color`:
```js
texture: null,
color: '#E8D44D',   // any hex color
```

### Swap texture from browser console

```js
window.__flag3d.setTexture('assets/flag-textures/new-logo.png');
```

---

## File Structure

```
modules/flag3d/
  flagConfig.js        — All tweakable parameters
  Flag3DScene.js       — Scene orchestrator (init, animate, resize, dispose)
  FlagMesh.js          — Flag geometry + ShaderMaterial
  PoleMesh.js          — Pole, crown ball, base
  flagShaders.js       — GLSL vertex + fragment shaders
  windSimulation.js    — CPU-side gust timing

assets/flag-textures/  — Drop flag images here
```

---

## Configuration Reference

All parameters live in `modules/flag3d/flagConfig.js`.

### flag

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `shape` | `'pennant'` \| `'rectangular'` | `'pennant'` | Flag shape (pennant = triangular taper) |
| `width` | number | `3.0` | Width in world units (pole to tip) |
| `height` | number | `2.2` | Height in world units |
| `segmentsX` | number | `40` | Horizontal subdivisions (more = smoother wave) |
| `segmentsY` | number | `30` | Vertical subdivisions |
| `texture` | string \| null | `null` | Path to flag image, or null for solid color |
| `color` | hex string | `'#E8D44D'` | Solid color fallback when texture is null |
| `doubleSided` | boolean | `true` | Render both sides of the flag |
| `opacity` | number (0-1) | `1.0` | Flag transparency |
| `backsideDarken` | number (0-1) | `0.7` | How much to darken the backside |

### pole

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | number | `12.0` | Total pole length |
| `radius` | number | `0.045` | Pole thickness |
| `segments` | number | `12` | Radial smoothness |
| `color` | hex string | `'#A0A0A0'` | Pole color |
| `metalness` | number (0-1) | `0.8` | Metal look |
| `roughness` | number (0-1) | `0.25` | Surface roughness |

### crown

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `shape` | `'sphere'` \| `'none'` | `'sphere'` | Ball at top of pole |
| `radius` | number | `0.09` | Ball size |
| `color` / `metalness` / `roughness` | — | same as pole | Material properties |

### base

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `shape` | `'cylinder'` \| `'box'` \| `'none'` | `'none'` | Base at bottom of pole |
| `width` | number | `0.3` | Base diameter/width |
| `height` | number | `0.15` | Base height |

### lighting

```js
lighting: {
  ambient: { color: '#FFFFFF', intensity: 0.65 },
  directional: { color: '#FFF8E7', intensity: 0.9, position: { x: 3, y: 5, z: 7 } },
  point: null,  // or { color, intensity, position: {x,y,z}, distance }
}
```

### camera

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `'perspective'` \| `'orthographic'` | `'perspective'` | Camera projection |
| `fov` | number | `28` | Field of view (narrow = flatter look) |
| `position` | `{x, y, z}` | `{0.5, -0.5, 12}` | Camera position |
| `lookAt` | `{x, y, z}` | `{0.5, -0.5, 0}` | Where camera points |

### wind

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `strength` | number | `0.35` | Main wave amplitude |
| `speed` | number | `1.2` | Wave frequency (higher = faster) |
| `direction` | `{x, y}` | `{1.0, 0.0}` | Wind direction (normalized) |
| `noiseScale` | number | `2.5` | Turbulence noise scale |
| `noiseStrength` | number | `0.12` | Turbulence amplitude |
| `gustInterval` | number | `4.0` | Seconds between gusts |
| `gustStrength` | number | `0.25` | Extra amplitude during gust |
| `gustDuration` | number | `1.5` | How long a gust lasts |

---

## How It Works

### Vertex Shader (flagShaders.js)
The flag is a subdivided plane (40x30 grid = 1,200 vertices). Each frame, the **vertex shader** runs on the GPU and displaces each vertex along the Z axis using:
- **Primary wave**: sine function traveling along the wind direction
- **Secondary ripple**: higher-frequency sine for detail
- **Noise layer**: pseudo-random turbulence for organic movement
- **Gust pulse**: periodic intensity boost controlled from JavaScript

Vertices near the pole (left edge) are **pinned** — they don't move. Movement increases quadratically toward the tip.

### Fragment Shader (flagShaders.js)
Colors each pixel by sampling the flag texture (or solid color), then applying diffuse lighting. The backside is automatically darkened for realism.

### Wind Simulation (windSimulation.js)
Runs on the CPU. Tracks a timer and produces periodic "gusts" — smooth bell-curve intensity spikes that feed into the shader.

---

## Troubleshooting

### Flag appears too dark/bright
Adjust `lighting.ambient.intensity` and `lighting.directional.intensity` in the config.

### Transparent background shows dark fringing
Try setting `renderer.alpha: true` (already default). If issues persist, the Three.js renderer uses `premultipliedAlpha: true` by default which should handle compositing correctly.

### Low FPS on mobile
Reduce `flag.segmentsX` and `flag.segmentsY` (e.g., 20x15). The `renderer.maxPixelRatio` is already capped at 2.

### Flag texture looks stretched on pennant
The pennant shape tapers the geometry, so the texture naturally compresses at the tip. If you need uniform texture distribution, switch to `flag.shape: 'rectangular'`.
