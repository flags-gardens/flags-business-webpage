import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Set up scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Dark background for contrast (DEBUG)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Add point light for dramatic shadows
const pointLight = new THREE.PointLight(0xffffff, 1, 50);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

// Create paper geometry: thin box with segments for smooth displacement
const paperWidth = 10;
const paperHeight = 0.1; // Thickness
const paperDepth = 5;
const geometry = new THREE.BoxGeometry(paperWidth, paperHeight, paperDepth, 64, 1, 64); // Added segments

// Custom shader material for generative paper texture and quirky emboss
const material = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(paperWidth, paperDepth) }, // For noise scaling
        embossStrength: { value: 1.0 }, // Exaggerated for debugging
        grainScale: { value: 100.0 }, // Denser grain
        patternScale: { value: 0.5 }, // Scale of the smiley motif (adjust for size)
        invertEmboss: { value: false }, // NEW: Toggle to invert (true = raise shape, false = raise background)
        debugNormals: { value: false }, // Toggle for normal coloring (DEBUG)
        debugHeight: { value: false } // NEW: Toggle for height map visualization (DEBUG)
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight; // NEW: Pass height for debug

        uniform float time;
        uniform float embossStrength;
        uniform vec2 resolution;
        uniform float grainScale;
        uniform float patternScale;
        uniform bool invertEmboss;

        // Simple noise function
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Multi-octave noise for paper grain
        float paperNoise(vec2 uv) {
            vec2 p = uv * grainScale;
            float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125 + noise(p * 8.0) * 0.0625;
            return n * 0.05 + 0.95; // Subtle grain (light paper)
        }

        // Quirky emboss pattern: simple smiley-like shape (circle + eyes + mouth) with wavy distortion
        float quirkyEmboss(vec2 uv) {
            uv = uv * 2.0 - 1.0; // Center UV [-1,1]
            uv.x *= resolution.x / resolution.y; // Aspect correction
            uv *= patternScale; // Scale the UV space (shrinks/enlarges the motif)

            // Main face circle (increased influence)
            float face = 1.0 - smoothstep(0.7, 0.75, length(uv)); // Slightly smaller for visibility

            // Eyes (larger for prominence)
            vec2 eyeOffset = vec2(0.3, 0.3);
            float leftEye = 1.0 - smoothstep(0.15, 0.2, length(uv + eyeOffset));
            float rightEye = 1.0 - smoothstep(0.15, 0.2, length(uv + vec2(-0.3, 0.3)));

            // Mouth (adjusted for raised ridge, not pit)
            float mouthDist = abs(uv.y + 0.3 - sin(uv.x * 2.0) * 0.2 - 0.2);
            float mouth = 1.0 - smoothstep(0.0, 0.05, mouthDist); // Inverted to make line raised

            // Combine (use max for union, but boost face/eyes)
            float pattern = max(face * 0.7, max(leftEye + rightEye, mouth)); // Increased face weight

            // Add quirky wave distortion
            float wave = sin(uv.x * 10.0 + time) * 0.02 + cos(uv.y * 10.0 + time) * 0.02;
            return pattern * (1.0 + wave);
        }

        void main() {
            vUv = uv;
            vNormal = normal;

            // Apply displacement for emboss (only on top face, y > 0)
            vec3 pos = position;
            float height = 0.0;
            if (normal.y > 0.5) { // Top face
                float pattern = quirkyEmboss(uv);
                height = invertEmboss ? (1.0 - pattern) * embossStrength : pattern * embossStrength; // NEW: Conditional inversion
                height += paperNoise(uv) * 0.1; // Your updated multiplier
                pos.y += height;

                // Perturb normals for displaced surface (finite difference)
                float offset = 0.01; // Small offset for sampling
                vec3 posX = pos; posX.x += offset;
                posX.y += quirkyEmboss(uv + vec2(offset / resolution.x, 0.0)) + paperNoise(uv + vec2(offset / resolution.x, 0.0)) * 0.1;
                
                vec3 posZ = pos; posZ.z += offset;
                posZ.y += quirkyEmboss(uv + vec2(0.0, offset / resolution.y)) + paperNoise(uv + vec2(0.0, offset / resolution.y)) * 0.1;
                
                vec3 tangent = normalize(posX - pos);
                vec3 bitangent = normalize(posZ - pos);
                vec3 perturbedNormal = normalize(cross(tangent, bitangent));
                
                vNormal = perturbedNormal; // Use perturbed normal for better lighting
            }
            vHeight = height / embossStrength; // NEW: Normalized for debug visualization
            vPosition = pos;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight; // NEW: For height debug

        uniform float time;
        uniform float grainScale;
        uniform bool debugNormals;
        uniform bool debugHeight; // NEW: Toggle for height map

        // Reuse noise from vertex (simplified here)
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float paperNoise(vec2 uv) {
            vec2 p = uv * grainScale;
            float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125 + noise(p * 8.0) * 0.0625;
            return n * 0.1 + 0.9; // Stronger contrast for visible grain
        }

        void main() {
            if (debugHeight) {
                gl_FragColor = vec4(vec3(vHeight), 1.0); // Grayscale height map (white = raised, black = low)
                return;
            }
            if (debugNormals) {
                gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0); // Color normals for visualization
                return;
            }

            // Generative paper color: off-white with grain
            float grain = paperNoise(vUv);
            vec3 color = vec3(0.95, 0.93, 0.9) * grain; // Yellowish paper tint

            // Simple lighting for emboss shadows
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
            float lighting = max(0.5, dot(vNormal, lightDir));

            // Darken sides for thickness visibility
            if (abs(vNormal.y) < 0.1) { // Side faces
                color *= 0.8;
            }

            gl_FragColor = vec4(color * lighting, 1.0);
        }
    `,
    side: THREE.DoubleSide, // Render both sides
    wireframe: false, // Toggleable below (DEBUG)
});

// Log for debugging
console.log('Material created:', material);
console.log('Shader compiled successfully (check for errors in console if not)');

// Create mesh and add to scene
const paper = new THREE.Mesh(geometry, material);
scene.add(paper);
console.log('Mesh added to scene:', paper); // DEBUG: Confirm one mesh

// Position camera for better view
camera.position.set(0, 5, 5); // Closer and angled
camera.lookAt(0, 0, 0);

// Key listener for debugging toggles
window.addEventListener('keydown', (event) => {
    if (event.key === 'w') {
        material.wireframe = !material.wireframe; // Toggle wireframe
        material.needsUpdate = true;
    } else if (event.key === 'n') {
        material.uniforms.debugNormals.value = !material.uniforms.debugNormals.value; // Toggle normal coloring
        material.needsUpdate = true;
    } else if (event.key === 'i') {
        material.uniforms.invertEmboss.value = !material.uniforms.invertEmboss.value; // NEW: Toggle inversion
        material.needsUpdate = true;
        console.log('Invert Emboss:', material.uniforms.invertEmboss.value);
    } else if (event.key === 'h') {
        material.uniforms.debugHeight.value = !material.uniforms.debugHeight.value; // NEW: Toggle height map
        material.needsUpdate = true;
        console.log('Debug Height:', material.uniforms.debugHeight.value);
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    material.uniforms.time.value += 0.01; // Subtle animation for quirky waves
    renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
