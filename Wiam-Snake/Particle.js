// Particle.js
// Étincelle ou petit cœur : projeté puis freiné par une force opposée à sa
// vitesse, il s'efface peu à peu.

class Particle extends Vehicle {
  constructor(x, y, hex, options = {}) {
    let speed = options.speed ?? random(1, 6);
    super(x, y, {
      vel: options.vel ?? p5.Vector.random2D().mult(speed),
      maxSpeed: 12,
      maxForce: 2,
      r: options.r ?? random(2, 6),
    });
    this.hex = hex;
    this.heart = options.heart ?? false;
    this.gravity = options.gravity ?? 0;
    this.life = 1;
    this.decay = options.decay ?? random(0.012, 0.03);
  }

  applyBehaviors() {
    this.applyForce(this.vel.copy().mult(-0.05));
    if (this.gravity !== 0) {
      this.applyForce(createVector(0, this.gravity));
    }
  }

  update() {
    super.update();
    this.life -= this.decay;
  }

  isDead() {
    return this.life <= 0;
  }

  show() {
    push();
    drawingContext.globalAlpha = max(this.life, 0);
    if (this.heart === true) {
      Particle.drawHeart(this.pos.x, this.pos.y, this.r * 2.4, this.hex);
    } else {
      let size = SpriteFactory.drawSize(this.r * (0.6 + this.life));
      image(SpriteFactory.orb(this.hex), this.pos.x, this.pos.y, size, size);
    }
    pop();
  }

  static drawHeart(x, y, size, hex) {
    // Tracé direct sur le canvas 2D (rapide, indépendant de la version de p5).
    let ctx = drawingContext;
    let s = size / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = hex;
    ctx.shadowBlur = 12;
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.6);
    ctx.bezierCurveTo(-s * 1.4, -s * 0.3, -s * 0.6, -s * 1.3, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.6, -s * 1.3, s * 1.4, -s * 0.3, 0, s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
