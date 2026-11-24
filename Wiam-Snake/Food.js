// Food.js
// Perle lumineuse à manger. Elle dérive doucement (wander), puis est aspirée
// vers la tête d'un serpent qui passe tout près (seek).

class Food extends Vehicle {
  static COLORS = ['#ff4fa3', '#ff9de2', '#b388ff', '#7fc8ff', '#5ff5d2',
    '#ffe066', '#ffb38a', '#ffffff'];

  constructor(x, y, options = {}) {
    super(x, y, {
      vel: p5.Vector.random2D().mult(0.2),
      maxSpeed: 0.3,
      maxForce: 0.03,
      r: options.r ?? random(4, 7),
    });
    this.hex = options.hex ?? random(Food.COLORS);
    this.value = options.value ?? 1;
    this.phase = random(TWO_PI);
    this.wanderDistance = 20;
    this.wanderRadius = 10;
    this.attractor = null;
    this.eaten = false;
  }

  applyBehaviors(snakes) {
    this.attractor = null;
    let best = Infinity;
    snakes.forEach((snake) => {
      if (snake.alive === false) {
        return;
      }
      let d = p5.Vector.dist(this.pos, snake.pos);
      let range = snake.r * 2.2 + 40;
      if (d < range && d < best) {
        best = d;
        this.attractor = snake;
      }
    });

    if (this.attractor !== null) {
      this.maxSpeed = 10;
      this.maxForce = 2;
      this.applyForce(this.seek(this.attractor.pos));
    } else {
      this.maxSpeed = 0.3;
      this.maxForce = 0.03;
      this.applyForce(this.wander());
    }
  }

  // Mangée si elle touche la tête de son attracteur.
  isEatenBy() {
    if (this.attractor === null) {
      return null;
    }
    if (p5.Vector.dist(this.pos, this.attractor.pos) < this.attractor.r) {
      return this.attractor;
    }
    return null;
  }

  show() {
    let pulse = 1 + 0.18 * sin(frameCount * 0.08 + this.phase);
    let size = SpriteFactory.drawSize(this.r * 1.6 * pulse);
    image(SpriteFactory.orb(this.hex), this.pos.x, this.pos.y, size, size);
  }
}
