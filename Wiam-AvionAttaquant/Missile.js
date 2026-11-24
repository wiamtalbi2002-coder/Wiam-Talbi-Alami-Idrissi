// Missile.js
// Missile qui poursuit sa cible (pursue) jusqu'à l'impact ou jusqu'à
// épuisement de son carburant (lifetime en frames). En 3D, son altitude z
// rejoint progressivement celle de sa cible.
// owner : 'plane' (tiré par l'avion, blanc) ou 'target' (riposte d'un
// char sur l'avion, vert).

class Missile extends Vehicle {
  constructor(x, y, target, options = {}) {
    super(x, y, { r: 5, maxSpeed: 7, maxForce: 0.2, ...options });
    this.target = target;
    this.owner = options.owner ?? 'plane';
    this.lifetime = options.lifetime ?? 180;
    this.z = options.z ?? 0;
    this.pitch = 0;
    this.age = 0;
    this.hasHit = false;
  }

  applyBehaviors() {
    this.applyForce(this.pursue(this.target, 20));
  }

  // Altitude visée : le centre de la cible.
  targetAltitude() {
    return (this.target.z ?? 0) + 8;
  }

  update() {
    super.update();
    this.age += 1;
    let distance = p5.Vector.dist(this.pos, this.target.pos);
    let targetZ = this.targetAltitude();
    let blend = min(1, this.vel.mag() / max(distance, 1));
    let dz = (targetZ - this.z) * blend;
    this.pitch = atan2(dz, max(this.vel.mag(), 0.1));
    this.z += dz;
    if (distance < this.r + this.target.r && abs(this.z - targetZ) < 30) {
      this.hasHit = true;
    }
  }

  isDead() {
    return this.hasHit === true || this.age > this.lifetime;
  }

  show() {
    let r = this.r;

    // Ombre au sol.
    push();
    translate(this.pos.x, this.pos.y, 0.5);
    rotateZ(this.vel.heading());
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(0, 0, r * 3, r * 1.1);
    pop();

    push();
    translate(this.pos.x, this.pos.y, this.z);
    rotateZ(this.vel.heading());
    rotateY(-this.pitch);
    noStroke();
    // Corps : blanc pour l'avion, vert pour les chars.
    if (this.owner === 'target') {
      fill(80, 210, 110);
    } else {
      fill(235);
    }
    box(r * 2.6, r * 0.6, r * 0.6);
    // Ailerons.
    fill(90);
    push();
    translate(-r * 1.1, 0, 0);
    box(r * 0.5, r * 1.5, r * 0.12);
    pop();
    // Flamme du moteur.
    fill(255, 170, 40);
    emissiveMaterial(255, 150, 30);
    push();
    translate(-r * 1.6, 0, 0);
    sphere(r * random(0.35, 0.55), 6, 4);
    pop();
    pop();

    if (Vehicle.debug === true) {
      push();
      translate(0, 0, this.z);
      this.drawDebug();
      pop();
    }
  }
}
