// confetti.js — Confetti extends Vehicle : fête quand le record est battu.
// Gravité + un peu de wander : ce sont aussi des forces de steering.

class Confetti extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 7));
    this.maxSpeed = 8;
    this.couleur = color(random(['#ff5fb4', '#ffd84d', '#7df0c0', '#8fb8ff', '#ffffff']));
    this.vie = 90;
    this.angle = random(TWO_PI);
  }

  step() {
    this.applyForce(createVector(random(-0.05, 0.05), 0.12));
    this.update();
    this.vel.mult(0.98);
    this.angle += 0.2;
    this.vie--;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    fill(red(this.couleur), green(this.couleur), blue(this.couleur), this.vie * 3);
    rect(-4, -2, 8, 4);
    pop();
  }
}
