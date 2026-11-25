// wiamConfetti.js — (ajout de Wiam) confettis quand un record tombe.
// Mouvement par forces (gravité + petit hasard), comme un steering.

class WiamConfetti {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 7));
    this.couleur = random(['#ff5fb4', '#ffd84d', '#7df0c0', '#8fb8ff', '#ffffff']);
    this.vie = 90;
    this.angle = random(TWO_PI);
  }

  step() {
    this.vel.add(createVector(random(-0.05, 0.05), 0.12));
    this.vel.mult(0.98);
    this.pos.add(this.vel);
    this.angle += 0.2;
    this.vie--;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    const c = color(this.couleur);
    fill(red(c), green(c), blue(c), this.vie * 3);
    rect(-4, -2, 8, 4);
    pop();
  }
}
