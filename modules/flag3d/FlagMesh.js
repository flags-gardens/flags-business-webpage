// modules/flag3d/FlagMesh.js
import * as THREE from 'three';

const FLAG_THICKNESS = 0.025; // visual thickness (half-thickness offset from center)

/**
 * Creates the flag as a Group with three meshes:
 *   1. Front face — textured, positions from cloth sim
 *   2. Back face  — offset along -normal by FLAG_THICKNESS
 *   3. Edge strip — connects front and back along the flag perimeter
 *
 * Physics only drives the front face vertices. The back face and edge strip
 * are derived each frame in updateFlagThickness().
 */
export function createFlagMesh(config) {
  const { flag } = config;
  const segsX = flag.segmentsX;
  const segsY = flag.segmentsY;
  const width = flag.width;
  const height = flag.height;

  // ── Shared texture ──
  let map = null;
  if (flag.texture) {
    const loader = new THREE.TextureLoader();
    map = loader.load(flag.texture);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
  }

  // ── Front face ──
  const frontGeo = _buildPlaneGeometry(segsX, segsY, width, height);
  const frontMat = new THREE.MeshStandardMaterial({
    map: map,
    color: flag.color,
    side: THREE.FrontSide,
    roughness: 0.85,
    metalness: 0.0,
  });
  const frontMesh = new THREE.Mesh(frontGeo, frontMat);

  // ── Back face ──
  const backGeo = _buildPlaneGeometry(segsX, segsY, width, height, true);
  const backMat = new THREE.MeshStandardMaterial({
    map: map,
    color: flag.color,
    side: THREE.FrontSide,
    roughness: 0.85,
    metalness: 0.0,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);

  // ── Edge strip ──
  const edgeGeo = _buildEdgeGeometry(segsX, segsY);
  const edgeMat = new THREE.MeshStandardMaterial({
    color: flag.color,
    side: THREE.DoubleSide,
    roughness: 0.85,
    metalness: 0.0,
  });
  const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);

  // ── Group ──
  const group = new THREE.Group();
  group.add(frontMesh);
  group.add(backMesh);
  group.add(edgeMesh);

  // Store references for updateFlagThickness
  group.userData.frontMesh = frontMesh;
  group.userData.backMesh = backMesh;
  group.userData.edgeMesh = edgeMesh;
  group.userData.segsX = segsX;
  group.userData.segsY = segsY;

  return group;
}

/**
 * Build a plane geometry with vertices in cloth-sim order.
 * If flipped=true, winding order is reversed (for back face).
 */
function _buildPlaneGeometry(segsX, segsY, width, height, flipped = false) {
  const geometry = new THREE.BufferGeometry();
  const vertexCount = (segsX + 1) * (segsY + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  let vIdx = 0;
  let uvIdx = 0;

  for (let j = 0; j <= segsY; j++) {
    for (let i = 0; i <= segsX; i++) {
      positions[vIdx++] = (i / segsX) * width;
      positions[vIdx++] = (j / segsY - 0.5) * height;
      positions[vIdx++] = 0;

      uvs[uvIdx++] = i / segsX;
      uvs[uvIdx++] = j / segsY;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const indices = [];
  const w = segsX + 1;

  for (let j = 0; j < segsY; j++) {
    for (let i = 0; i < segsX; i++) {
      const a = j * w + i;
      const b = j * w + i + 1;
      const c = (j + 1) * w + i;
      const d = (j + 1) * w + i + 1;

      if (flipped) {
        indices.push(a, c, b);
        indices.push(b, c, d);
      } else {
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
  }

  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Build edge strip geometry connecting front and back faces along the perimeter.
 * Perimeter order: bottom edge (left→right), right edge (bottom→top),
 *                  top edge (right→left), left edge (top→bottom).
 */
function _buildEdgeGeometry(segsX, segsY) {
  const perimCount = 2 * (segsX + segsY);

  // 2 vertices per perimeter point (front + back)
  const positions = new Float32Array(perimCount * 2 * 3);
  const indices = [];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Build index buffer: quad strip around perimeter (closed loop)
  for (let i = 0; i < perimCount; i++) {
    const next = (i + 1) % perimCount;
    const f0 = i * 2;
    const b0 = i * 2 + 1;
    const f1 = next * 2;
    const b1 = next * 2 + 1;

    indices.push(f0, f1, b0);
    indices.push(b0, f1, b1);
  }

  geometry.setIndex(indices);
  return geometry;
}

/**
 * Returns the perimeter grid indices in order around the flag border.
 */
function _getPerimeterIndices(segsX, segsY) {
  const w = segsX + 1;
  const indices = [];

  // Bottom edge: j=0, i=0..segsX
  for (let i = 0; i <= segsX; i++) indices.push(i);
  // Right edge: i=segsX, j=1..segsY
  for (let j = 1; j <= segsY; j++) indices.push(j * w + segsX);
  // Top edge: j=segsY, i=segsX-1..0
  for (let i = segsX - 1; i >= 0; i--) indices.push(segsY * w + i);
  // Left edge: i=0, j=segsY-1..1
  for (let j = segsY - 1; j >= 1; j--) indices.push(j * w);

  return indices;
}

/**
 * Update back face and edge strip positions from front face + normals.
 * Call this every frame after cloth simulation updates the front geometry.
 */
export function updateFlagThickness(flagGroup) {
  const { frontMesh, backMesh, edgeMesh, segsX, segsY } = flagGroup.userData;

  const frontPos = frontMesh.geometry.attributes.position;
  const backPos = backMesh.geometry.attributes.position;

  // Compute front face normals first
  frontMesh.geometry.computeVertexNormals();
  const frontNormals = frontMesh.geometry.attributes.normal;

  // Offset back face along -normal
  for (let k = 0; k < frontPos.count; k++) {
    const nx = frontNormals.getX(k);
    const ny = frontNormals.getY(k);
    const nz = frontNormals.getZ(k);

    backPos.setXYZ(
      k,
      frontPos.getX(k) - nx * FLAG_THICKNESS,
      frontPos.getY(k) - ny * FLAG_THICKNESS,
      frontPos.getZ(k) - nz * FLAG_THICKNESS
    );
  }

  backPos.needsUpdate = true;
  backMesh.geometry.computeVertexNormals();

  // Update edge strip
  const perimIndices = _getPerimeterIndices(segsX, segsY);
  const edgePos = edgeMesh.geometry.attributes.position;

  for (let i = 0; i < perimIndices.length; i++) {
    const vi = perimIndices[i];

    // Front vertex
    edgePos.setXYZ(
      i * 2,
      frontPos.getX(vi),
      frontPos.getY(vi),
      frontPos.getZ(vi)
    );

    // Back vertex
    edgePos.setXYZ(
      i * 2 + 1,
      backPos.getX(vi),
      backPos.getY(vi),
      backPos.getZ(vi)
    );
  }

  edgePos.needsUpdate = true;
  edgeMesh.geometry.computeVertexNormals();
}
