varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vHeight;
varying mat3 vTBN; // For tangent space

uniform float time;
uniform float grainScale;
uniform bool debugNormals;
uniform bool debugHeight;
uniform vec2 bumpPosition; // For procedural bump
uniform float bumpSize;
uniform float bumpFalloff;
uniform float bumpStrength;

// Reuse noise from vertex (simplified here)
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float paperNoise(vec2 uv) {
    vec2 p = uv * grainScale;
    float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125 + noise(p * 8.0) * 0.0625;
    return n * 0.1 + 0.9; // Stronger contrast for visible grain
}

// Procedural SDF for circle bump
float sdfCircle(vec2 p, vec2 center, float radius) {
    return length(p - center) - radius;
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

    // Procedural normal computation
    vec2 placedUV = vUv;
    float dist = sdfCircle(placedUV, bumpPosition, bumpSize);
    float height = smoothstep(bumpFalloff, 0.0, dist) * bumpStrength; // Raised bump with falloff

    // Derive tangent-space normal from height gradients
    float offset = 0.001;
    float h1 = smoothstep(bumpFalloff, 0.0, sdfCircle(placedUV + vec2(offset, 0.0), bumpPosition, bumpSize)) * bumpStrength;
    float h2 = smoothstep(bumpFalloff, 0.0, sdfCircle(placedUV + vec2(0.0, offset), bumpPosition, bumpSize)) * bumpStrength;
    vec3 tangentNormal = normalize(vec3((height - h1) / offset, (height - h2) / offset, 1.0)); // X/Y from derivs, Z=base up

    // Transform to world space
    vec3 worldNormal = normalize(vTBN * tangentNormal);

    // Simple lighting for emboss shadows
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float lighting = max(0.5, dot(worldNormal, lightDir));

    // Darken sides for thickness visibility
    if (abs(vNormal.y) < 0.1) { // Side faces
        color *= 0.8;
    }

    gl_FragColor = vec4(color * lighting, 1.0);
}
