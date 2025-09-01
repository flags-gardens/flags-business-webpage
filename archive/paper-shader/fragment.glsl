varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition; // Now world space
varying float vHeight;
varying mat3 vTBN; // For tangent space

uniform float time;
uniform float grainScale;
uniform bool debugNormals;
uniform bool debugHeight;
uniform vec2 resolution; // For aspect correction
uniform vec3 rotatingLightPos; // World position of rotating light
uniform vec3 rotatingLightColor; // Light color (normalized)
uniform float rotatingLightIntensity; // Light intensity

// For ring shape
uniform vec2 ringCenter; // UV position of ring center
uniform float ringRadius; // Distance from center to ring stroke
uniform float ringThickness; // Width of the stroke (diameter of half-circle)
uniform float ringFalloff; // Softness of edges
uniform float ringWaveCount; // Number of waves around the ring
uniform float ringWaveSpeed; // Animation speed for waves
uniform float ringHeightMin; // Min height (low points)
uniform float ringHeightMax; // Max height (embossed peaks)
uniform float ringWavePower; // Controls curvature of waves along ring

// Reuse noise from vertex (simplified here)
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float paperNoise(vec2 uv) {
    vec2 p = uv * grainScale;
    float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125 + noise(p * 8.0) * 0.0625;
    return n * 0.1 + 0.9; // Stronger contrast for visible grain
}

// Procedural SDF for ring (torus)
float sdfRing(vec2 p, vec2 center, float radius, float thickness) {
    vec2 toPoint = p - center;
    float angle = atan(toPoint.y, toPoint.x); // Angular position for height variation
    float distToCircle = length(toPoint) - radius; // Distance to ring's center line
    return abs(distToCircle) - thickness * 0.5; // Tubular stroke (negative inside stroke)
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

    // Procedural ring computation with height variation
    vec2 placedUV = vUv;
    placedUV.x *= resolution.x / resolution.y; // Aspect correction
    float dist = sdfRing(placedUV, ringCenter, ringRadius, ringThickness);

    // Half-circle curvature across stroke thickness (smooth reverse U, no plateau)
    float halfThick = ringThickness * 0.5; // Radius of the half-circle arc
    float baseHeight = 0.0;
    if (abs(dist) < halfThick) { // Only compute inside stroke
        baseHeight = sqrt(pow(halfThick, 2.0) - pow(dist, 2.0)); // Upper half-circle equation
        baseHeight /= halfThick; // Normalize to 0-1 (peak=1 in middle)
    }
    baseHeight = smoothstep(0.0, ringFalloff, baseHeight); // Optional soft blend at base (minimal for sharp U)

    // Vary height along the ring with smooth curved waves
    vec2 toPoint = placedUV - ringCenter;
    float angle = atan(toPoint.y, toPoint.x) + time * ringWaveSpeed; // Angular position + animation
    float phase = angle * ringWaveCount; // Phase for wave
    float wave = pow(0.5 * (1.0 + cos(phase)), ringWavePower); // Raised cosine for curved hump (0 to 1)
    float variedHeight = mix(ringHeightMin, ringHeightMax, wave); // Interpolate min-max with curved wave
    float height = baseHeight * variedHeight; // Combine cross-section curvature with along-wave variation

    // Derive tangent-space normal from height gradients
    float offset = 0.001;
    // Recompute for offsets (full recalc for accuracy)
    vec2 offsetUV1 = placedUV + vec2(offset, 0.0);
    float dist1 = sdfRing(offsetUV1, ringCenter, ringRadius, ringThickness);
    float baseHeight1 = 0.0;
    if (abs(dist1) < halfThick) {
        baseHeight1 = sqrt(pow(halfThick, 2.0) - pow(dist1, 2.0)) / halfThick;
    }
    baseHeight1 = smoothstep(0.0, ringFalloff, baseHeight1);
    float angle1 = atan(offsetUV1.y - ringCenter.y, offsetUV1.x - ringCenter.x) + time * ringWaveSpeed;
    float phase1 = angle1 * ringWaveCount;
    float wave1 = pow(0.5 * (1.0 + cos(phase1)), ringWavePower);
    float variedHeight1 = mix(ringHeightMin, ringHeightMax, wave1);
    float h1 = baseHeight1 * variedHeight1;

    vec2 offsetUV2 = placedUV + vec2(0.0, offset);
    float dist2 = sdfRing(offsetUV2, ringCenter, ringRadius, ringThickness);
    float baseHeight2 = 0.0;
    if (abs(dist2) < halfThick) {
        baseHeight2 = sqrt(pow(halfThick, 2.0) - pow(dist2, 2.0)) / halfThick;
    }
    baseHeight2 = smoothstep(0.0, ringFalloff, baseHeight2);
    float angle2 = atan(offsetUV2.y - ringCenter.y, offsetUV2.x - ringCenter.x) + time * ringWaveSpeed;
    float phase2 = angle2 * ringWaveCount;
    float wave2 = pow(0.5 * (1.0 + cos(phase2)), ringWavePower);
    float variedHeight2 = mix(ringHeightMin, ringHeightMax, wave2);
    float h2 = baseHeight2 * variedHeight2;

    vec3 tangentNormal = normalize(vec3((height - h1) / offset, (height - h2) / offset, 1.0)); // X/Y from derivs, Z=base up

    // Transform to world space
    vec3 worldNormal = normalize(vTBN * tangentNormal);

    // Dynamic lighting from rotating point light
    vec3 toLight = rotatingLightPos - vPosition; // Vector from fragment to light
    float distance = length(toLight); // Distance for attenuation
    vec3 lightDir = normalize(toLight); // Normalized direction
    float attenuation = rotatingLightIntensity / (1.0 + distance * distance); // Simple quadratic falloff
    float diffuse = max(0.0, dot(worldNormal, lightDir)) * attenuation; // Diffuse term

    // Combine with base color (add ambient for visibility)
    vec3 lightingColor = color * (diffuse * rotatingLightColor + vec3(0.2)); // Ambient 0.2

    // Darken sides for thickness visibility
    if (abs(vNormal.y) < 0.1) { // Side faces
        lightingColor *= 0.8;
    }

    gl_FragColor = vec4(lightingColor, 1.0);
}
