// ScorePopup.js
// Texte « +10 » qui s'envole (arrive vers un point au-dessus) et s'efface.

class ScorePopup extends Vehicle {
  constructor(x, y, label, hex, size = 18) {
    super(x, y, {
      vel: createVector(random(-0.5, 0.5), -2),
      maxSpeed: 3,
      maxForce: 0.3,
    });
    this.label = label;
    this.hex = hex;
    this.size = size;
    this.target = createVector(x, y - 70);
    this.slowingDistance = 60;
    this.life = 1;
  }

  applyBehaviors() {
    this.applyForce(this.arrive(this.target));
  }

  update() {
    super.update();
    this.life -= 0.018;
  }

  isDead() {
    return this.life <= 0;
  }

  show() {
    push();
    drawingContext.globalAlpha = max(this.life, 0);
    drawingContext.shadowColor = this.hex;
    drawingContext.shadowBlur = 14;
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(this.size);
    fill(255);
    stroke(this.hex);
    strokeWeight(3);
    text(this.label, this.pos.x, this.pos.y);
    pop();
  }
}
