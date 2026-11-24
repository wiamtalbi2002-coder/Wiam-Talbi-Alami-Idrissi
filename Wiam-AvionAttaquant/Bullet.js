// Bullet.js
// Balle traçante en 3D. Trajectoire balistique : elle part à pleine vitesse
// vers le point visé (plan + altitude) et ne pilote plus (aucune force de
// steering), jusqu'à l'impact, le sol ou la fin de portée.
// owner : 'plane' (mitrailleuse de l'avion, 1 dégât) ou 'soldier' (fusil
// d'un fantassin vers l'avion, sans dégâts : ambiance).

class Bullet extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { r: 2, maxSpeed: 20, maxForce: 0, ...options });
    this.owner = options.owner ?? 'plane';
    this.lifetime = options.lifetime ?? 45;
    this.damage = options.damage ?? 1;
    this.z = options.z ?? 0;
    this.vz = options.vz ?? 0;
    this.age = 0;
    this.hasHit = false;
    this.hitGround = false;
  }

  // Projectile : pas de pilotage.
  applyBehaviors() {}

  update() {
    super.update();
    this.z += this.vz;
    this.age += 1;
    if (this.z <= 0) {
      this.z = 0;
      this.hitGround = true;
    }
  }

  isDead() {
    let outside = this.pos.x < -20 || this.pos.x > width + 20
      || this.pos.y < -20 || this.pos.y > height + 20;
    return this.hasHit === true || this.hitGround === true
      || this.age > this.lifetime || outside;
  }

  show() {
    push();
    if (this.owner === 'soldier') {
      stroke(255, 140, 90, 170);
      strokeWeight(1.5);
    } else {
      stroke(255, 225, 120);
      strokeWeight(2.5);
    }
    let k = 1.3;
    line(this.pos.x - this.vel.x * k, this.pos.y - this.vel.y * k,
      this.z - this.vz * k, this.pos.x, this.pos.y, this.z);
    pop();
    if (Vehicle.debug === true) {
      push();
      translate(0, 0, this.z);
      this.drawDebug();
      pop();
    }
  }
}
