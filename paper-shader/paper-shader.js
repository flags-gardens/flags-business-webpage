import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

async function init() {
    // Load shaders from files
    const vertexResponse = await fetch('./vertex.glsl');
    const vertexShader = await vertexResponse.text();

    const fragmentResponse = await fetch('./fragment.glsl');
    const fragmentShader = await fragmentResponse.text();

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

    // NEW: Rotating point light (circles above the paper)
    const rotatingLight = new THREE.PointLight(0xffaa00, 1.5, 50); // Orange tint for visibility
    rotatingLight.position.set(0, 5, 0); // Start position (above center)
    scene.add(rotatingLight);

    // Create paper geometry: thin box with segments for smooth displacement
    const paperWidth = 10;
    const paperHeight = 0.1; // Thickness
    const paperDepth = 5;
    const geometry = new THREE.BoxGeometry(paperWidth, paperHeight, paperDepth, 64, 1, 64); // Added segments
    geometry.computeTangents(); // Required for TBN (tangent space)

    // Custom shader material (using loaded shaders)
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(paperWidth, paperDepth) },
            embossStrength: { value: 1.0 },
            grainScale: { value: 100.0 },
            patternScale: { value: 0.5 },
            invertEmboss: { value: false },
            debugNormals: { value: false },
            debugHeight: { value: false },
            // For procedural normal bump
            bumpPosition: { value: new THREE.Vector2(0.5, 0.5) }, // UV placement
            bumpSize: { value: 0.2 }, // Radius
            bumpFalloff: { value: 0.1 }, // Softness
            bumpStrength: { value: 1.0 } // Intensity of procedural bump
        },
        vertexShader, // Loaded from file
        fragmentShader, // Loaded from file
        side: THREE.DoubleSide,
        wireframe: false
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
            material.uniforms.invertEmboss.value = !material.uniforms.invertEmboss.value; // Toggle inversion
            material.needsUpdate = true;
            console.log('Invert Emboss:', material.uniforms.invertEmboss.value);
        } else if (event.key === 'h') {
            material.uniforms.debugHeight.value = !material.uniforms.debugHeight.value; // Toggle height map
            material.needsUpdate = true;
            console.log('Debug Height:', material.uniforms.debugHeight.value);
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        material.uniforms.time.value += 0.01; // Subtle animation for quirky waves

        // NEW: Rotate the light (circles around Y-axis at radius 5, height 5)
        const radius = 5; // Circle radius
        const lightSpeed = 0.5; // Rotation speed
        rotatingLight.position.x = Math.sin(material.uniforms.time.value * lightSpeed) * radius;
        rotatingLight.position.z = Math.cos(material.uniforms.time.value * lightSpeed) * radius;
        rotatingLight.position.y = 5; // Fixed height above paper

        renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Call to initialize (handles async loading)
init().catch(error => console.error('Error loading shaders:', error));
