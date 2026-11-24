// ScorePopup.js
// Score animé (« +100 ») qui s'élève en 3D au-dessus d'une cible détruite
// et s'efface. C'est un Vehicle : sa montée est pilotée par une force
// d'arrivée verticale (vers une altitude cible). Le texte est dessiné une
// fois dans une petite image (createGraphics), affichée face à la caméra.

class ScorePopup extends Vehicle {
  // Inclinaison du panneau vers la caméra (réglée par le sketch).
  static tilt = 0;

  constructor(x, y, label, options = {}) {
    super(x, y, { r: 1, maxSpeed: 0, maxForce: 0, ...options });
    this.vel.mult(0);
    this.label = label;
    this.lifetime = options.lifetime ?? 80;
    this.z = options.z ?? 30;
    this.targetZ = this.z + 70;
    this.vz = 0;
    this.age = 0;
    this.image = null;
  }

  // Arrivée verticale : monte vite puis ralentit.
  applyBehaviors() {
    let desired = constrain((this.targetZ - this.z) * 0.05, 0, 1.6);
    this.vz += constrain(desired - this.vz, -0.06, 0.06);
  }

  update() {
    super.update();
    this.z += this.vz;
    this.age += 1;
  }

  isDead() {
    return this.age > this.lifetime;
  }

  // Libère l'image du texte.
  dispose() {
    if (this.image !== null) {
      this.image.remove();
      this.image = null;
    }
  }

  show() {
    if (this.image === null) {
      this.image = createGraphics(200, 60);
      this.image.pixelDensity(1);
      this.image.textAlign(CENTER, CENTER);
      this.image.textStyle(BOLD);
      this.image.textSize(40);
      this.image.stroke(0);
      this.image.strokeWeight(6);
      this.image.fill(255, 215, 60);
      this.image.text(this.label, 100, 32);
    }
    let life = 1 - this.age / this.lifetime;
    push();
    translate(this.pos.x, this.pos.y, this.z);
    rotateX(ScorePopup.tilt);
    scale(1, -1, 1); // la texture serait sinon à l'envers
    noStroke();
    tint(255, 255 * life);
    texture(this.image);
    plane(80, 24);
    pop();
  }
}
