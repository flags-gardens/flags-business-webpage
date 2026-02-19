// modules/flag3d/ClothSimulation.js
// Verlet integration cloth simulation for realistic flag physics.
// Based on the classic Three.js cloth example, modernized for BufferGeometry.

import * as THREE from 'three';

const DAMPING = 0.97;
const CONSTRAINT_ITERATIONS = 12;
const CLOTH_THICKNESS = 0.08;    // minimum separation distance for self-collision
const COLLISION_STIFFNESS = 0.5; // how strongly colliding particles are pushed apart
const HASH_CELL_SIZE = 0.15;     // spatial hash cell size (≥ CLOTH_THICKNESS)

// ─── Particle ───

class Particle {
  constructor(x, y, z, mass) {
    this.position = new THREE.Vector3(x, y, z);
    this.previous = new THREE.Vector3(x, y, z);
    this.original = new THREE.Vector3(x, y, z);
    this.acceleration = new THREE.Vector3();
    this.mass = mass;
    this.invMass = 1 / mass;
    this.pinned = false;
  }

  addForce(force) {
    // F = ma → a = F/m
    this.acceleration.addScaledVector(force, this.invMass);
  }

  integrate(dt2) {
    if (this.pinned) return;

    // Verlet integration: newPos = pos + (pos - prev) * damping + accel * dt²
    const newPos = new THREE.Vector3();
    newPos.subVectors(this.position, this.previous);
    newPos.multiplyScalar(DAMPING);
    newPos.add(this.position);
    newPos.addScaledVector(this.acceleration, dt2);

    this.previous.copy(this.position);
    this.position.copy(newPos);

    // Reset acceleration for next frame
    this.acceleration.set(0, 0, 0);
  }
}

// ─── Constraint ───

class Constraint {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.restDistance = p1.position.distanceTo(p2.position);
  }

  satisfy() {
    const diff = new THREE.Vector3().subVectors(this.p2.position, this.p1.position);
    const currentDist = diff.length();
    if (currentDist === 0) return;

    const correction = diff.multiplyScalar(1 - this.restDistance / currentDist);

    if (!this.p1.pinned && !this.p2.pinned) {
      this.p1.position.addScaledVector(correction, 0.5);
      this.p2.position.addScaledVector(correction, -0.5);
    } else if (this.p1.pinned) {
      this.p2.position.addScaledVector(correction, -1.0);
    } else if (this.p2.pinned) {
      this.p1.position.addScaledVector(correction, 1.0);
    }
  }
}

// ─── ClothSimulation ───

export class ClothSimulation {
  /**
   * @param {number} segsX - horizontal segments
   * @param {number} segsY - vertical segments
   * @param {number} width - flag width in world units
   * @param {number} height - flag height in world units
   */
  constructor(segsX, segsY, width, height, poleOffset = 0) {
    this.segsX = segsX;
    this.segsY = segsY;
    this.width = width;
    this.height = height;
    this.poleOffset = poleOffset;
    this.particles = [];
    this.constraints = [];

    this._tmpForce = new THREE.Vector3();
    this._tmpDiff1 = new THREE.Vector3();
    this._tmpDiff2 = new THREE.Vector3();
    this._tmpNormal = new THREE.Vector3();
    this._tmpCollision = new THREE.Vector3();

    // Neighbor set: particle pairs connected by constraints (skip during collision)
    this._neighbors = new Set();

    // Spatial hash for broad-phase collision detection
    this._hashMap = new Map();

    this._init();
  }

  _init() {
    const { segsX, segsY, width, height } = this;

    // Create particle grid
    // x: 0 (pole) to width (tip)
    // y: shifted down by poleOffset so flag hangs below the crown
    for (let j = 0; j <= segsY; j++) {
      for (let i = 0; i <= segsX; i++) {
        const x = (i / segsX) * width;
        const y = (j / segsY - 0.5) * height + this.poleOffset;
        const z = 0;

        const particle = new Particle(x, y, z, 1.0);
        particle.index = this.particles.length;

        // Pin the left column (pole attachment)
        if (i === 0) {
          particle.pinned = true;
        }

        this.particles.push(particle);
      }
    }

    // Create constraints (structural + shear for stability)
    const w = segsX + 1;

    for (let j = 0; j <= segsY; j++) {
      for (let i = 0; i <= segsX; i++) {
        const idx = j * w + i;

        // Structural: horizontal
        if (i < segsX) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + 1]
          ));
        }

        // Structural: vertical
        if (j < segsY) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + w]
          ));
        }

        // Shear: diagonal (prevents the cloth from collapsing diagonally)
        if (i < segsX && j < segsY) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + w + 1]
          ));
          this.constraints.push(new Constraint(
            this.particles[idx + 1],
            this.particles[idx + w]
          ));
        }

        // Bend: skip-one structural (resists bending, adds stiffness)
        if (i < segsX - 1) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + 2]
          ));
        }
        if (j < segsY - 1) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + w * 2]
          ));
        }
      }
    }

    // Build neighbor set from constraints (for self-collision exclusion)
    for (const c of this.constraints) {
      const i1 = c.p1.index;
      const i2 = c.p2.index;
      const key = i1 < i2 ? `${i1}:${i2}` : `${i2}:${i1}`;
      this._neighbors.add(key);
    }
  }

  /**
   * Get particle at grid position (i, j).
   */
  getParticle(i, j) {
    return this.particles[j * (this.segsX + 1) + i];
  }

  /**
   * Step the simulation forward.
   * @param {number} dt - timestep in seconds
   * @param {THREE.Vector3} gravity - gravity force vector
   * @param {THREE.Vector3} windDir - wind direction (normalized)
   * @param {number} windStrength - wind force magnitude
   * @param {number} gustFactor - additional gust multiplier (0-1)
   */
  simulate(dt, gravity, windDir, windStrength, gustFactor) {
    const dt2 = dt * dt;
    const w = this.segsX + 1;
    const totalWind = windStrength + gustFactor;

    // Apply gravity to all particles
    for (let k = 0; k < this.particles.length; k++) {
      this.particles[k].addForce(gravity);
    }

    // Apply wind force per triangle (based on face normal dot wind direction)
    // This creates the realistic "catching" effect
    for (let j = 0; j < this.segsY; j++) {
      for (let i = 0; i < this.segsX; i++) {
        const p00 = this.particles[j * w + i];
        const p10 = this.particles[j * w + i + 1];
        const p01 = this.particles[(j + 1) * w + i];
        const p11 = this.particles[(j + 1) * w + i + 1];

        // Triangle 1: p00, p10, p01
        this._applyWindToTriangle(p00, p10, p01, windDir, totalWind);
        // Triangle 2: p10, p11, p01
        this._applyWindToTriangle(p10, p11, p01, windDir, totalWind);
      }
    }

    // Integrate all particles
    for (let k = 0; k < this.particles.length; k++) {
      this.particles[k].integrate(dt2);
    }

    // Satisfy constraints (multiple iterations for stability)
    for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      for (let k = 0; k < this.constraints.length; k++) {
        this.constraints[k].satisfy();
      }
    }

    // Self-collision: prevent cloth from passing through itself
    this._selfCollision();
  }

  /**
   * Spatial hash key for a 3D position.
   */
  _hashKey(x, y, z) {
    const cx = Math.floor(x / HASH_CELL_SIZE);
    const cy = Math.floor(y / HASH_CELL_SIZE);
    const cz = Math.floor(z / HASH_CELL_SIZE);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Self-collision detection and response using spatial hashing.
   * Non-neighbor particles closer than CLOTH_THICKNESS are pushed apart.
   */
  _selfCollision() {
    const particles = this.particles;
    const n = particles.length;
    const hashMap = this._hashMap;
    hashMap.clear();

    // Build spatial hash
    for (let k = 0; k < n; k++) {
      const p = particles[k].position;
      const key = this._hashKey(p.x, p.y, p.z);
      let bucket = hashMap.get(key);
      if (!bucket) {
        bucket = [];
        hashMap.set(key, bucket);
      }
      bucket.push(k);
    }

    const thickness2 = CLOTH_THICKNESS * CLOTH_THICKNESS;

    // Check each particle against particles in its cell and 26 neighboring cells
    for (let k = 0; k < n; k++) {
      const pk = particles[k];
      if (pk.pinned) continue;

      const px = pk.position.x;
      const py = pk.position.y;
      const pz = pk.position.z;

      const cx = Math.floor(px / HASH_CELL_SIZE);
      const cy = Math.floor(py / HASH_CELL_SIZE);
      const cz = Math.floor(pz / HASH_CELL_SIZE);

      // Check 3x3x3 neighborhood of cells
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          for (let dk = -1; dk <= 1; dk++) {
            const key = `${cx + di},${cy + dj},${cz + dk}`;
            const bucket = hashMap.get(key);
            if (!bucket) continue;

            for (let b = 0; b < bucket.length; b++) {
              const m = bucket[b];
              if (m <= k) continue; // avoid duplicate checks

              // Skip neighbor pairs (connected by constraint)
              const nKey = k < m ? `${k}:${m}` : `${m}:${k}`;
              if (this._neighbors.has(nKey)) continue;

              const pm = particles[m];
              this._tmpCollision.subVectors(pm.position, pk.position);
              const dist2 = this._tmpCollision.lengthSq();

              if (dist2 < thickness2 && dist2 > 0) {
                const dist = Math.sqrt(dist2);
                const overlap = (CLOTH_THICKNESS - dist) * COLLISION_STIFFNESS;
                this._tmpCollision.multiplyScalar(overlap / dist);

                if (!pm.pinned) {
                  pm.position.addScaledVector(this._tmpCollision, 0.5);
                  pk.position.addScaledVector(this._tmpCollision, -0.5);
                } else {
                  pk.position.addScaledVector(this._tmpCollision, -1.0);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Apply wind force to a triangle based on how much it faces the wind.
   */
  _applyWindToTriangle(p1, p2, p3, windDir, strength) {
    this._tmpDiff1.subVectors(p2.position, p1.position);
    this._tmpDiff2.subVectors(p3.position, p1.position);
    this._tmpNormal.crossVectors(this._tmpDiff1, this._tmpDiff2).normalize();

    // Force proportional to how much the triangle faces the wind
    const dot = this._tmpNormal.dot(windDir);
    // Use abs so both sides catch wind (flag can billow both ways)
    const forceMagnitude = Math.abs(dot) * strength;

    this._tmpForce.copy(windDir).multiplyScalar(forceMagnitude / 3);

    p1.addForce(this._tmpForce);
    p2.addForce(this._tmpForce);
    p3.addForce(this._tmpForce);

    // Also add a small normal-direction force for volume/billowing
    this._tmpForce.copy(this._tmpNormal).multiplyScalar(dot * strength * 0.3 / 3);
    p1.addForce(this._tmpForce);
    p2.addForce(this._tmpForce);
    p3.addForce(this._tmpForce);
  }

  /**
   * Copy particle positions into a BufferGeometry's position attribute.
   */
  updateGeometry(geometry) {
    const positions = geometry.attributes.position;

    for (let k = 0; k < this.particles.length; k++) {
      const p = this.particles[k].position;
      positions.setXYZ(k, p.x, p.y, p.z);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
