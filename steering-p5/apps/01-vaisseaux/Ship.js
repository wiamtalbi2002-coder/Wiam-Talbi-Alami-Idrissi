// Ship.js
// Vaisseau spatial : sous-classe de Vehicle qui erre (wander), reste dans
// l'écran (containment) et garde ses distances (separation).

class Ship extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { r: 9, ...options });
    this.hue = options.hue ?? random(170, 230);
  }

  // Sélection d'action : combinaison pondérée des comportements.
  applyBehaviors(ships) {
    let wander = this.wander();
    let contain = this.boundaries(60);
    let separate = this.separation(ships, this.r * 3);

    this.applyForce(wander.mult(1));
    this.applyForce(contain.mult(3));
    this.applyForce(separate.mult(1.5));
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    colorMode(HSB, 360, 100, 100, 1);
    stroke(this.hue, 40, 100);
    strokeWeight(1.2);
    fill(this.hue, 70, 55, 0.9);
    beginShape();
    vertex(this.r * 1.4, 0);
    vertex(-this.r, -this.r * 0.8);
    vertex(-this.r * 0.5, 0);
    vertex(-this.r, this.r * 0.8);
    endShape(CLOSE);

    // Flamme du réacteur proportionnelle à la vitesse.
    let flame = map(this.vel.mag(), 0, max(this.maxSpeed, 0.0001), 0, this.r);
    noStroke();
    fill(30, 90, 100, 0.8);
    triangle(-this.r * 0.5, -this.r * 0.25, -this.r * 0.5, this.r * 0.25,
      -this.r * 0.5 - flame, 0);
    pop();

    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }
}
