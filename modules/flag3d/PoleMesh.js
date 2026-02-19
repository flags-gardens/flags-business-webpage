// modules/flag3d/PoleMesh.js
import * as THREE from 'three';

/**
 * Creates the flag pole assembly: pole cylinder, crown (ball top), and optional base.
 * Returns a THREE.Group positioned relative to the flag (flag attaches at x=0).
 */
export function createPoleGroup(config) {
  const group = new THREE.Group();
  const { pole, crown, base, flag } = config;

  // ── Pole ──
  const poleGeo = new THREE.CylinderGeometry(
    pole.radius, pole.radius,
    pole.height,
    pole.segments
  );
  const poleMat = new THREE.MeshStandardMaterial({
    color: pole.color,
    metalness: pole.metalness,
    roughness: pole.roughness,
  });
  const poleMesh = new THREE.Mesh(poleGeo, poleMat);
  // Position: top of pole aligns with top of flag area
  // Flag is centered at y=0, so top = flag.height/2
  // Pole center = top - poleHeight/2
  const poleTop = flag.height / 2;
  poleMesh.position.set(0, poleTop - pole.height / 2, 0);
  group.add(poleMesh);

  // ── Crown (ball at top of pole) ──
  if (crown.shape === 'sphere') {
    const crownGeo = new THREE.SphereGeometry(crown.radius, 16, 16);
    const crownMat = new THREE.MeshStandardMaterial({
      color: crown.color,
      metalness: crown.metalness,
      roughness: crown.roughness,
    });
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.set(0, poleTop + crown.radius * 0.5, 0);
    group.add(crownMesh);
  }

  // ── Base ──
  if (base.shape && base.shape !== 'none') {
    let baseGeo;
    if (base.shape === 'cylinder') {
      baseGeo = new THREE.CylinderGeometry(base.width, base.width, base.height, 16);
    } else {
      baseGeo = new THREE.BoxGeometry(base.width, base.height, base.width);
    }
    const baseMat = new THREE.MeshStandardMaterial({
      color: base.color,
      metalness: base.metalness,
      roughness: base.roughness,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    const poleBottom = poleTop - pole.height;
    baseMesh.position.set(0, poleBottom - base.height / 2, 0);
    group.add(baseMesh);
  }

  return group;
}
