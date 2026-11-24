// NameDot.js
// Perle lumineuse qui forme une lettre du prénom WIAM sur l'écran d'accueil.
// Elle revient toujours à sa place (arrive) et s'écarte de la tête du
// serpent quand il passe à travers le prénom (flee), puis revient.

class NameDot extends Vehicle {
  constructor(homeX, homeY, hex) {
    super(random(width), random(height), {
      vel: p5.Vector.random2D().mult(random(2, 6)),
      maxSpeed: 9,
      maxForce: 0.6,
      r: 3.4,
    });
    this.home = createVector(homeX, homeY);
    this.hex = hex;
    this.slowingDistance = 120;
    this.phase = random(TWO_PI);
  }

  applyBehaviors(snake) {
    this.applyForce(this.arrive(this.home));
    if (snake) {
      this.applyForce(this.flee(snake.pos, snake.r * 3.5).mult(3));
    }
  }

  show() {
    let twinkle = 1 + 0.25 * sin(frameCount * 0.1 + this.phase);
    let size = SpriteFactory.drawSize(this.r * 1.6 * twinkle);
    image(SpriteFactory.orb(this.hex), this.pos.x, this.pos.y, size, size);
  }
}
