// Obstacle.js
// Un obstacle est un Vehicle : immobile par défaut (maxSpeed = 0), il peut
// être animé à tout moment en lui donnant une vitesse et des comportements.

class Obstacle extends Vehicle {
  constructor(x, y, r = 30, options = {}) {
    super(x, y, {
      r,
      maxSpeed: 0,
      maxForce: 0,
      vel: createVector(0, 0),
      ...options,
    });
    this.color = options.color ?? color(90, 110, 140);
  }

  // Immobile par défaut : aucun comportement.
  applyBehaviors() {}

  show() {
    push();
    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }
}
