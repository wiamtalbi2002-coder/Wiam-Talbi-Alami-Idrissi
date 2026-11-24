// target.js
// Target : sous-classe de Vehicle. Elle avance dans une direction
// aléatoire et réapparaît de l'autre côté de l'écran (edges).
// Exercice « champ de vision » : elle a un cercle de détection de rayon
// rayonDetection ; elle ne s'évade (evade) que si le poursuiveur le plus
// proche entre dans ce cercle.

class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(6);
    this.maxSpeed = 6;
    this.maxForce = 0.3;

    // propriété de la target
    this.rayonDetection = 150;
    this.enFuite = false;
  }

  // pursuers : tableau des poursuiveurs ; seul le plus proche compte.
  applyBehaviors(pursuers, frames = 10, proportional = false) {
    this.enFuite = false;
    let closest = null;
    let best = Infinity;
    pursuers.forEach((pursuer) => {
      let d = this.pos.dist(pursuer.pos);
      if (d < best) {
        best = d;
        closest = pursuer;
      }
    });
    if (closest !== null && best < this.rayonDetection) {
      this.enFuite = true;
      this.applyForce(this.evade(closest, frames, proportional));
    } else {
      // Hors danger : elle garde sa vitesse de croisière.
      let cruise = this.vel.copy().setMag(this.maxSpeed);
      this.applyForce(p5.Vector.sub(cruise, this.vel).limit(this.maxForce));
    }
  }

  respawn() {
    this.pos.set(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(this.maxSpeed);
  }

  show() {
    push();

    // On dessine le cercle de détection (rouge quand elle s'évade)
    push();
    noFill();
    stroke(this.enFuite ? 'red' : 'white');
    strokeWeight(this.enFuite ? 2 : 1);
    circle(this.pos.x, this.pos.y, this.rayonDetection * 2);
    pop();

    // on dessine la target
    stroke("white");
    strokeWeight(2);
    fill("pink");
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);

    pop();
  }
}
