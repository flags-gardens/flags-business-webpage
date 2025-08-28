varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vHeight;
varying mat3 vTBN; // For tangent space in fragment

uniform float time;
uniform float embossStrength;
uniform vec2 resolution;
uniform float grainScale;
uniform float patternScale;
uniform bool invertEmboss;
uniform bool enableDisplacement; // NEW: Toggle for displacement

attribute vec4 tangent; // Declare tangent attribute

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

    // Compute TBN matrix
    vec3 t = normalize(tangent.xyz);
    vec3 n = normalize(normal);
    vec3 b = normalize(cross(n, t) * tangent.w); // Bitangent with handedness
    vTBN = mat3(t, b, n);

    // Apply displacement for emboss (only on top face, y > 0)
    vec3 pos = position;
    float height = 0.0;
    if (normal.y > 0.5 && enableDisplacement) { // NEW: Conditional toggle
        float pattern = quirkyEmboss(uv);
        height = invertEmboss ? (1.0 - pattern) * embossStrength : pattern * embossStrength;
        height += paperNoise(uv) * 0.1; // Updated multiplier
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
    vHeight = height / embossStrength; // Normalized for debug visualization
    vPosition = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
