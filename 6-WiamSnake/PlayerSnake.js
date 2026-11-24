// PlayerSnake.js
// Le serpent de Wiam : il file vers le cœur (la souris) avec seek, et porte
// un nœud rose. Il vise un point loin devant, dans la direction du cœur :
// il ne « freine » jamais dessus, donc il ne tourne pas en rond ni ne tremble.

class PlayerSnake extends Snake {
  constructor(x, y) {
    super(x, y, {
      name: 'Wiam ♡',
      palette: ['#ff4fa3', '#ffb3dc', '#ff85c2', '#ffe0f0'],
      baseSpeed: 4.8,
      boostSpeed: 9,
      maxForce: 0.9,
      startLength: 12,
    });
    this.target = createVector(x + 100, y);
  }

  setTarget(x, y) {
    this.lookTarget = createVector(x, y);
    let toHeart = p5.Vector.sub(this.lookTarget, this.pos);
    // Cœur posé sur la tête : on garde le cap actuel.
    if (toHeart.mag() < this.r * 1.5) {
      toHeart = this.vel.copy();
    }
    toHeart.setMag(300);
    this.target = p5.Vector.add(this.pos, toHeart);
  }

  decide() {
    return this.seek(this.target);
  }

  // Nœud rose posé derrière les yeux.
  drawAccessory(r, heading) {
    let center = p5.Vector.fromAngle(heading + PI, r * 0.45);
    push();
    translate(this.pos.x + center.x, this.pos.y + center.y);
    rotate(heading + HALF_PI);
    drawingContext.shadowColor = '#ff2e88';
    drawingContext.shadowBlur = 14;
    noStroke();
    fill('#ff2e88');
    triangle(0, 0, -r * 0.75, -r * 0.42, -r * 0.75, r * 0.42);
    triangle(0, 0, r * 0.75, -r * 0.42, r * 0.75, r * 0.42);
    fill('#ff8cc6');
    circle(0, 0, r * 0.36);
    pop();
  }
}
