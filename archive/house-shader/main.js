import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let camera, scene, renderer, composer;
let object;
let isDragging = false;
let infoDiv;
let normalTarget, worldNormalMaterial; // Moved to global scope
const previousMousePosition = {
    x: 0,
    y: 0
};

init();
animate();

function init() {
    infoDiv = document.getElementById('info');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White background

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 0, 0);
    camera.lookAt(scene.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); // Handle high-DPI screens
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting (basic pipeline: ambient + directional)
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8); // Slightly brighter ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    // Material (basic MeshStandardMaterial)
    const material = new THREE.MeshStandardMaterial({
        color: 0x909090, // Gray
        roughness: 0.8,
        metalness: 0.1
    });

    // OBJ Loader
    const loader = new OBJLoader();
    const placeholderObjName = 'house_shader_test.obj';

    loader.load(
        placeholderObjName,
        function (loadedObject) {
            object = loadedObject;
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = material;
                    // Ensure normals are computed (helps with edge detection)
                    child.geometry.computeVertexNormals();
                }
            });
            scene.add(object);
        },
        function (xhr) { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
        function (error) {
            console.log('An error happened while loading the model.');
            const geometry = new THREE.BoxGeometry(20, 20, 20);
            object = new THREE.Mesh(geometry, material);
            scene.add(object);
        }
    );

    // Post-processing setup (only for stylized edge highlighting)
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Render target for normals (initialized here)
    normalTarget = new THREE.WebGLRenderTarget(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);

    // Custom material to render WORLD-SPACE normals (for view-independent effect)
    worldNormalMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vWorldNormal;
            void main() {
                vWorldNormal = mat3(modelMatrix) * normal; // Transform to world space
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vWorldNormal;
            void main() {
                vec3 n = normalize(vWorldNormal);
                gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); // Pack to [0,1] RGB
            }
        `
    });

    // Custom shader for stylized edge highlighting (based on normal dot products)
    const edgeShader = {
        uniforms: {
            tDiffuse: { value: null }, // Color texture from render pass
            tNormal: { value: null }, // We'll set this dynamically to avoid cloning error
            resolution: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
            radius: { value: 5.0 } // Larger radius for better edge capture
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform sampler2D tNormal;
            uniform vec2 resolution;
            uniform float radius;
            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                vec3 centerNormal = texture2D(tNormal, vUv).rgb * 2.0 - 1.0; // Unpack to [-1,1]

                // Skip if no geometry (e.g., background) to avoid tinting empty space
                if (length(centerNormal) < 0.1) {
                    gl_FragColor = color;
                    return;
                }

                float edgeStrength = 0.0;
                int sampleCount = 0;
                vec2 pixelSize = 1.0 / resolution;

                for (float dx = -radius; dx <= radius; dx += 1.0) {
                    for (float dy = -radius; dy <= radius; dy += 1.0) {
                        if (dx*dx + dy*dy > radius*radius) continue; // Circular kernel
                        vec2 offset = vec2(dx, dy) * pixelSize;
                        vec3 sampleNormal = texture2D(tNormal, vUv + offset).rgb * 2.0 - 1.0;

                        // Optional: For strict per-model edges (add object ID texture and check here)
                        // if (texture2D(tObjectID, vUv + offset).r != texture2D(tObjectID, vUv).r) continue;

                        float dotProd = dot(centerNormal, sampleNormal);
                        edgeStrength += (1.0 - max(dotProd, 0.0)); // Low dot → high edge strength
                        sampleCount++;
                    }
                }

                edgeStrength /= float(sampleCount);
                float highlight = smoothstep(0.1, 0.6, edgeStrength) * 1.0; // Lower threshold, higher strength for visibility

                // Debug: Uncomment to visualize edgeStrength as grayscale (black = no edge, white = strong)
                // color.rgb = vec3(edgeStrength);

                // Add blue-tinted brightness ONLY to edges
                color.rgb += vec3(highlight * 0.2, highlight * 0.2, highlight * 0.8); // Subtle blue glow; adjust for tint/strength

                gl_FragColor = color;
            }
        `
    };

    const edgePass = new ShaderPass(edgeShader);
    composer.addPass(edgePass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseout', onMouseUp);

    onWindowResize(); // Call once to set initial debug info
}

function onMouseDown(e) {
    isDragging = true;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
}

function onMouseMove(e) {
    if (!isDragging || !object) return;
    const deltaMove = { x: e.clientX - previousMousePosition.x, y: e.clientY - previousMousePosition.y };
    const rotationSpeed = 0.005;
    object.rotation.y += deltaMove.x * rotationSpeed;
    object.rotation.x += deltaMove.y * rotationSpeed;
    const clampAngle = 10 * Math.PI / 180;
    object.rotation.x = Math.max(-clampAngle, Math.min(clampAngle, object.rotation.x));
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
}

function onMouseUp() {
    isDragging = false;
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const dpr = window.devicePixelRatio;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);

    // Resize normal target (now accessible globally)
    normalTarget.setSize(width * dpr, height * dpr);
    composer.passes[1].uniforms.resolution.value.set(width * dpr, height * dpr);

    // Update debug info
    infoDiv.innerHTML = `Logical: ${width}x${height}<br>DPR: ${dpr.toFixed(2)}<br>Physical: ${Math.round(width * dpr)}x${Math.round(height * dpr)}`;
}

function animate() {
    requestAnimationFrame(animate);

    // Render WORLD-SPACE normals to target (override materials temporarily)
    scene.overrideMaterial = worldNormalMaterial;
    renderer.setRenderTarget(normalTarget);
    renderer.render(scene, camera);
    scene.overrideMaterial = null; // Reset

    // Dynamically set the normal texture uniform to avoid cloning error
    composer.passes[1].uniforms.tNormal.value = normalTarget.texture;

    composer.render();
}
