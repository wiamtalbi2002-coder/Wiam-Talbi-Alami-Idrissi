// bouncingBall.js
// Exercice : BouncingBall, sous-classe de Target, une balle qui rebondit
// sur les bords de l'écran (au lieu de réapparaître de l'autre côté).
// Chaque balle reçoit une vitesse différente.

class BouncingBall extends Target {
  constructor(x, y) {
    super(x, y);
    this.r = 10;
    this.maxSpeed = random(2, 9);
    this.vel = p5.Vector.random2D().mult(this.maxSpeed);
    this.couleur = color(random(120, 255), random(120, 255), random(120, 255));
  }

  // Une balle ne fuit pas : elle garde sa vitesse et rebondit.
  applyBehaviors() {}

  update() {
    // tient compte des comportements (forces appliquées)
    super.update();

    // teste la collision avec les bords du canvas
    this.testeCollisionAvecBordsDuCanvas();
  }

  // Pas de réapparition de l'autre côté pour une balle.
  edges() {}

  testeCollisionAvecBordsDuCanvas() {
    // si on atteint le bord droit, on rebondit
    if (this.pos.x + this.r >= width) {
      // on se remet au point de contact
      this.pos.x = width - this.r;
      this.vel.x = -this.vel.x;
    }
    if (this.pos.x - this.r <= 0) {
      this.pos.x = this.r;
      this.vel.x = -this.vel.x;
    }
    if (this.pos.y + this.r >= height) {
      this.pos.y = height - this.r;
      this.vel.y = -this.vel.y;
    }
    if (this.pos.y - this.r <= 0) {
      this.pos.y = this.r;
      this.vel.y = -this.vel.y;
    }
  }

  show() {
    push();
    noStroke();
    fill(this.couleur);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}
