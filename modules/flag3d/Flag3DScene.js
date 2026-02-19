// modules/flag3d/Flag3DScene.js
import * as THREE from 'three';
import { flagConfig } from './flagConfig.js';
import { createFlagMesh, updateFlagThickness } from './FlagMesh.js';
import { createPoleGroup } from './PoleMesh.js';
import { ClothSimulation } from './ClothSimulation.js';
import { WindSimulation } from './windSimulation.js';

// Physics constants
const TIMESTEP = 1 / 60;
const GRAVITY = new THREE.Vector3(0, -9.8, 0);

class Flag3DScene {
  constructor(containerEl, config = flagConfig) {
    this.container = containerEl;
    this.config = config;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.flagMesh = null;
    this.poleGroup = null;
    this.cloth = null;
    this.wind = null;
    this.clock = new THREE.Clock();
    this.animationId = null;

    // Wind direction vector
    this.windDir = new THREE.Vector3(
      config.wind.direction.x,
      0.2, // slight upward component so wind lifts the flag
      config.wind.direction.y * 0.5
    ).normalize();
  }

  init() {
    const { config, container } = this;

    // ── Scene ──
    this.scene = new THREE.Scene();

    // ── Camera ──
    this.camera = this._createCamera();

    // ── Renderer ──
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.renderer.antialias,
      alpha: config.renderer.alpha,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, config.renderer.maxPixelRatio)
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const canvas = this.renderer.domElement;
    canvas.id = 'flag-3d-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(
      config.lighting.ambient.color,
      config.lighting.ambient.intensity
    );
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      config.lighting.directional.color,
      config.lighting.directional.intensity
    );
    dirLight.position.set(
      config.lighting.directional.position.x,
      config.lighting.directional.position.y,
      config.lighting.directional.position.z
    );
    this.scene.add(dirLight);

    if (config.lighting.point) {
      const pointLight = new THREE.PointLight(
        config.lighting.point.color,
        config.lighting.point.intensity,
        config.lighting.point.distance || 0
      );
      pointLight.position.set(
        config.lighting.point.position.x,
        config.lighting.point.position.y,
        config.lighting.point.position.z
      );
      this.scene.add(pointLight);
    }

    // ── Cloth simulation ──
    this.cloth = new ClothSimulation(
      config.flag.segmentsX,
      config.flag.segmentsY,
      config.flag.width,
      config.flag.height,
      config.flag.poleOffset || 0
    );

    // ── Flag mesh ──
    this.flagMesh = createFlagMesh(config);
    this.scene.add(this.flagMesh);

    // ── Pole group ──
    this.poleGroup = createPoleGroup(config);
    this.scene.add(this.poleGroup);

    // ── Wind gust simulation ──
    this.wind = new WindSimulation(config.wind);

    // ── Resize handler ──
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    // Start animation
    this.animate();
  }

  _createCamera() {
    const { config, container } = this;
    const { flag, camera: camCfg } = config;

    const worldWidth = camCfg.padLeft + flag.width + camCfg.padRight;
    const aspect = container.clientWidth / container.clientHeight;
    const worldHeight = worldWidth / aspect;

    const left = -camCfg.padLeft;
    const right = flag.width + camCfg.padRight;
    const top = flag.height / 2 + 0.5;
    const bottom = top - worldHeight;

    const cam = new THREE.OrthographicCamera(
      left, right, top, bottom,
      camCfg.near, camCfg.far
    );
    // Slightly angled to see depth and thickness
    cam.position.set(0.3, 0.4, 10);
    cam.lookAt(0.3, -0.2, 0);

    return cam;
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update wind gust
    const gustFactor = this.wind.update(delta);

    // Vary wind direction slightly over time for organic movement
    const time = this.clock.getElapsedTime();
    const windVariation = Math.sin(time * 0.3) * 0.1;
    this.windDir.set(
      this.config.wind.direction.x,
      0.3 + windVariation,
      0.3 + Math.sin(time * 0.5) * 0.15
    ).normalize();

    // Step physics simulation
    this.cloth.simulate(
      TIMESTEP,
      GRAVITY,
      this.windDir,
      this.config.wind.strength * 25, // scale up for physics units
      gustFactor * 20
    );

    // Copy particle positions to front face geometry
    const frontGeo = this.flagMesh.userData.frontMesh.geometry;
    this.cloth.updateGeometry(frontGeo);

    // Update back face and edge strip from front face + normals
    updateFlagThickness(this.flagMesh);

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const { container, renderer } = this;
    this.camera = this._createCamera();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  setTexture(path) {
    const loader = new THREE.TextureLoader();
    loader.load(path, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      const { frontMesh, backMesh } = this.flagMesh.userData;
      frontMesh.material.map = texture;
      frontMesh.material.needsUpdate = true;
      backMesh.material.map = texture;
      backMesh.material.needsUpdate = true;
    });
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this._onResize);

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });

    this.renderer.dispose();
    const canvas = this.renderer.domElement;
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}

/**
 * Initialize the 3D flag in #main-flag-container.
 */
export function initFlag3D() {
  const container = document.getElementById('main-flag-container');
  if (!container) return;

  const scene = new Flag3DScene(container);
  scene.init();

  // Expose for debugging / texture swapping from console
  window.__flag3d = scene;
}
