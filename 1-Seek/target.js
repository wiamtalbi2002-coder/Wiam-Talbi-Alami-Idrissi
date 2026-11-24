// target.js
// Exercice : une Target est un Vehicle (sous-classe) de forme circulaire
// qui part dans une direction aléatoire et réapparaît du côté opposé quand
// elle quitte le canvas (edges() hérité de Vehicle).
// Pour que sa trajectoire ne soit pas une ligne droite parfaite, elle
// change un peu de cap avec une petite force de pilotage (seek vers un
// point devant elle, légèrement décalé au hasard) : on reste dans la
// logique des steering behaviors, on ne modifie jamais vel à la main.

class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 28;
    this.maxSpeed = random(2, 4);
    this.maxForce = 0.05;
    this.vel = p5.Vector.random2D().setMag(this.maxSpeed);
    this.angleOffset = 0;
    this.couleur = color(random(150, 255), random(80, 200), random(150, 255));
  }

  // Petit changement de direction aléatoire, par steering.
  applyBehaviors() {
    this.angleOffset += random(-0.15, 0.15);
    this.angleOffset = constrain(this.angleOffset, -0.8, 0.8);
    let pointDevant = this.vel.copy().setMag(80);
    pointDevant.rotate(this.angleOffset);
    pointDevant.add(this.pos);
    this.applyForce(this.seek(pointDevant));
  }

  // Réapparition aléatoire (variante de l'exercice).
  respawn() {
    this.pos.set(random(width), random(height));
    this.vel = p5.Vector.random2D().setMag(this.maxSpeed);
  }

  show() {
    push();
    noStroke();
    fill(this.couleur);
    circle(this.pos.x, this.pos.y, this.r * 2);
    fill(255, 255, 255, 120);
    circle(this.pos.x - this.r * 0.3, this.pos.y - this.r * 0.3, this.r * 0.5);
    pop();
    if (Vehicle.debug === true) {
      this.drawVelocityVector();
    }
  }
}
