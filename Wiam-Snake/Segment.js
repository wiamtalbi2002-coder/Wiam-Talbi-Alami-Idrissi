// Segment.js
// Anneau du corps d'un serpent. C'est un Vehicle : il suit l'anneau devant
// lui avec Arrival, en visant un point situé à `spacing` pixels derrière.

class Segment extends Vehicle {
  constructor(x, y, snake, index) {
    super(x, y, {
      vel: createVector(0, 0),
      maxSpeed: 20,
      maxForce: 40,
      r: snake.r,
    });
    this.snake = snake;
    this.hex = snake.colorFor(index);
  }

  applyBehaviors(leader, spacing) {
    let away = p5.Vector.sub(this.pos, leader.pos);
    if (away.magSq() < 0.0001) {
      away = leader.vel.copy().mult(-1);
    }
    away.setMag(spacing);
    let target = p5.Vector.add(leader.pos, away);

    // Très réactif : l'anneau rattrape presque tout l'écart à chaque frame,
    // ce qui donne un corps souple mais qui ne se disloque pas.
    this.maxSpeed = this.snake.maxSpeed * 2.5 + 2;
    this.maxForce = this.maxSpeed * 2;
    this.slowingDistance = this.maxSpeed * 1.4;
    this.applyForce(this.arrive(target));
  }
}
