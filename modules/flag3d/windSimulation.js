// modules/flag3d/windSimulation.js

/**
 * CPU-side wind gust simulation.
 * Produces a gustFactor (0–1) that ramps up and down periodically,
 * fed into the vertex shader as a uniform.
 */
export class WindSimulation {
  constructor(windConfig) {
    this.config = windConfig;
    this.gustTimer = 0;
    this.gustActive = false;
    this.gustFactor = 0;
  }

  update(deltaTime) {
    this.gustTimer += deltaTime;

    if (!this.gustActive && this.gustTimer >= this.config.gustInterval) {
      this.gustActive = true;
      this.gustTimer = 0;
    }

    if (this.gustActive) {
      const progress = this.gustTimer / this.config.gustDuration;
      if (progress >= 1.0) {
        this.gustActive = false;
        this.gustFactor = 0;
        this.gustTimer = 0;
      } else {
        // Smooth bell curve: sin(pi * progress) peaks at 0.5
        this.gustFactor = Math.sin(Math.PI * progress) * this.config.gustStrength;
      }
    }

    return this.gustFactor;
  }
}
