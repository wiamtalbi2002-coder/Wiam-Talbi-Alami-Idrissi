// vehicle.js — classe de base de tout ce qui bouge (règle du projet).
// Physique de Reynolds : force = vitesse désirée − vitesse, limitée à maxForce.

class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 5;
    this.maxForce = 0.2;
  }

  // Steering : on veut aller à `vitesseDesiree` ; la force est la
  // différence avec la vitesse actuelle.
  steer(vitesseDesiree) {
    const force = p5.Vector.sub(vitesseDesiree, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  // vecteur vitesse en rouge (mode debug)
  drawVelocity() {
    push();
    stroke('red');
    strokeWeight(2);
    line(this.pos.x, this.pos.y, this.pos.x + this.vel.x * 8, this.pos.y + this.vel.y * 8);
    pop();
  }
}
