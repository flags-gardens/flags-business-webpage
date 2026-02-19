// modules/flag3d/flagShaders.js
// GLSL shaders for the waving flag, stored as template literals.

export const flagVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindSpeed;
  uniform float uNoiseScale;
  uniform float uNoiseStrength;
  uniform float uGustFactor;
  uniform float uGravity;
  uniform float uFlagWidth;
  uniform float uFlagHeight;
  uniform vec2  uWindDirection;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal_ws;
  // Pass normalized distance from pole to fragment shader (for edge detection)
  varying float vDist;
  varying float vIsEdge;

  // ─── Noise ───

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Turbulence: abs(noise) creates sharp fabric creases
  float turbulence(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      val += amp * abs(noise2D(p) * 2.0 - 1.0);
      p *= 2.0;
      amp *= 0.5;
    }
    return val;
  }

  // ─── Displacement ───
  //
  // Uses POSITION (not UV) for calculations so all faces of the
  // thick slab (front, back, edges) deform identically.
  //
  // Physics model:
  // - Gravity pulls the flag down (strong Y droop as default)
  // - Wind lifts portions of the flag up against gravity
  // - Z waves create depth ripples (visible via lighting)
  // - NO X stretching — fabric maintains its width

  vec2 calcDisplacement(float dist, float yNorm, float time) {
    // dist: 0 at pole, 1 at tip (normalized x position)
    // yNorm: -0.5 to 0.5 (normalized y position on flag)
    // Returns vec2(yDisp, zDisp) — NO x displacement

    // Pin: vertices at the pole stay fixed
    float pin = smoothstep(0.0, 0.1, dist);

    // Non-linear stiffness: stiff near pole, loose at tip
    float stiffness = pow(dist, 1.8);

    float t = time * uWindSpeed;

    // Edge factor: top/bottom edges flutter more
    float edgeDist = abs(yNorm) * 2.0;
    float edgeFlutter = 0.7 + pow(edgeDist, 2.0) * 0.3;

    // ═══ GRAVITY: flag hangs down ═══
    // Strong droop that increases toward the tip.
    // This is the "rest state" — without wind the flag would hang limp.
    float gravityDroop = -uGravity * stiffness * pin;

    // ═══ WIND LIFT: fights gravity, lifts the flag ═══
    // Slow, large-scale lift — the main "being blown" motion
    float lift1 = sin(dist * 5.0 - t * 0.8) * 0.5 + 0.5; // 0 to 1
    float lift2 = sin(dist * 3.0 - t * 0.5 + 0.7) * 0.3 + 0.3;
    float windLift = (lift1 + lift2) * uWindStrength * stiffness * pin;

    // ═══ Y FLUTTER: small vertical oscillations ═══
    float yFlutter1 = sin(dist * 12.0 - t * 1.2 + yNorm * 4.0) * 0.12;
    float yFlutter2 = sin(dist * 20.0 - t * 0.8 + yNorm * 7.0) * 0.05 * edgeFlutter;
    float yTurb = (turbulence(vec2(dist, yNorm + 0.5) * uNoiseScale + time * 0.3) - 0.5)
                * uNoiseStrength * 0.6;
    float yFlutter = (yFlutter1 + yFlutter2 + yTurb)
                   * uWindStrength * pin * stiffness * edgeFlutter;

    // Gust adds extra lift
    float gustLift = sin(dist * 4.0 - t * 2.0) * uGustFactor * stiffness * pin * 0.6;

    float yTotal = gravityDroop + windLift + yFlutter + gustLift;

    // ═══ Z: DEPTH WAVES (visible through lighting/shadow) ═══
    // Traveling waves pole→tip (minus sign = correct propagation direction)
    float z1 = sin(dist * 8.0 - t * 1.0) * 0.8;
    float z2 = sin(dist * 16.0 - t * 0.7 + yNorm * 3.0) * 0.3;
    float z3 = sin(dist * 28.0 - t * 0.5 + yNorm * 6.0) * 0.1;

    // Snap at the tip: sharp peaks
    float snapZone = smoothstep(0.4, 0.9, dist);
    float rawSnap = sin(dist * 20.0 - t * 1.8);
    float z4 = sign(rawSnap) * pow(abs(rawSnap), 3.0) * 0.12 * snapZone;

    float zTurb = (turbulence(vec2(dist, yNorm + 0.5) * uNoiseScale * 1.2 + time * 0.25 + 50.0) - 0.5)
                * uNoiseStrength;

    float zGust = sin(dist * 6.0 - t * 2.5) * uGustFactor * 0.5;

    float zTotal = (z1 + z2 + z3 + z4 + zTurb + zGust)
                 * uWindStrength * pin * stiffness * edgeFlutter;

    return vec2(yTotal, zTotal);
  }

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Compute normalized coordinates from POSITION (works for all box faces)
    float dist = clamp(pos.x / uFlagWidth, 0.0, 1.0);
    float yNorm = pos.y / uFlagHeight; // -0.5 to 0.5

    vDist = dist;

    // Detect if this vertex is on a side edge (thin face of the slab)
    // Side edges have normals pointing mostly in X or Y, not Z
    vec3 origNormal = normalize(normal);
    vIsEdge = step(0.5, abs(origNormal.x) + abs(origNormal.y));

    // Compute displacement (Y and Z only — no X stretching)
    vec2 disp = calcDisplacement(dist, yNorm, uTime);
    pos.y += disp.x;
    pos.z += disp.y;

    // Compute perturbed normal via finite differences
    float eps = 0.01;
    vec2 dispDx = calcDisplacement(dist + eps, yNorm, uTime);
    vec2 dispDy = calcDisplacement(dist, yNorm + eps, uTime);

    // Tangent vectors: base plane is XY, displacement adds to Y and Z
    vec3 tangentU = vec3(uFlagWidth * eps, dispDx.x - disp.x, dispDx.y - disp.y);
    vec3 tangentV = vec3(0.0, uFlagHeight * eps + (dispDy.x - disp.x), dispDy.y - disp.y);
    vec3 perturbedNormal = normalize(cross(normalize(tangentU), normalize(tangentV)));

    // For edge vertices, blend between perturbed and original normal
    // so edges keep their thickness look
    vec3 finalNormal = mix(perturbedNormal, origNormal, vIsEdge * 0.7);

    vNormal_ws = normalize((modelMatrix * vec4(finalNormal, 0.0)).xyz);
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const flagFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform bool uHasTexture;
  uniform vec3 uColor;
  uniform vec3 uEdgeColor;
  uniform float uOpacity;
  uniform float uBacksideDarken;

  uniform vec3 uAmbientColor;
  uniform float uAmbientIntensity;
  uniform vec3 uDirLightColor;
  uniform float uDirLightIntensity;
  uniform vec3 uDirLightPos;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal_ws;
  varying float vDist;
  varying float vIsEdge;

  void main() {
    // Base color: use edge color for side faces, texture for front/back
    vec3 baseRGB;

    if (vIsEdge > 0.5) {
      // Side edge of the thick slab — solid edge color
      baseRGB = uEdgeColor;
    } else if (uHasTexture) {
      vec4 texSample = texture2D(uTexture, vUv);
      baseRGB = mix(uColor, texSample.rgb, texSample.a);
    } else {
      baseRGB = uColor;
    }

    // Lighting
    vec3 N = normalize(vNormal_ws);
    if (!gl_FrontFacing) N = -N;

    vec3 lightDir = normalize(uDirLightPos - vWorldPos);
    float diff = max(dot(N, lightDir), 0.0);

    vec3 lighting = uAmbientColor * uAmbientIntensity
                  + uDirLightColor * uDirLightIntensity * diff;

    vec3 finalColor = baseRGB * lighting;

    // Darken backside
    if (!gl_FrontFacing) {
      finalColor *= uBacksideDarken;
    }

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;
