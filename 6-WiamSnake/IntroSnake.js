// IntroSnake.js
// Serpent de l'écran d'accueil : il suit une boucle en forme de « 8 » qui
// traverse le prénom WIAM, de point de passage en point de passage (seek).

class IntroSnake extends Snake {
  constructor(waypoints) {
    let start = waypoints[0];
    super(start.x, start.y, {
      name: 'Wiam',
      palette: ['#ff4fa3', '#ffb3dc', '#b388ff', '#ffe0f0'],
      baseSpeed: 5.5,
      maxForce: 0.7,
      startLength: 34,
    });
    this.waypoints = waypoints;
    this.current = 1;
  }

  decide() {
    let target = this.waypoints[this.current];
    if (p5.Vector.dist(this.pos, target) < 40) {
      this.current = (this.current + 1) % this.waypoints.length;
    }
    this.lookTarget = this.waypoints[(this.current + 3) % this.waypoints.length];
    return this.seek(target);
  }

  drawAccessory(r, heading) {
    PlayerSnake.prototype.drawAccessory.call(this, r, heading);
  }

  // Boucle de Bernoulli (lemniscate) centrée sur (cx, cy).
  static figureEight(cx, cy, a, b, count = 48) {
    let points = [];
    for (let i = 0; i < count; i += 1) {
      let t = (i / count) * TWO_PI;
      let d = 1 + sin(t) * sin(t);
      points.push(createVector(cx + (a * cos(t)) / d,
        cy + (b * sin(t) * cos(t)) / d));
    }
    return points;
  }
}
