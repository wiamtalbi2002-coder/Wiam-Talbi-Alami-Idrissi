// boundary.js — un segment de mur ou de checkpoint (de a vers b).

class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  midpoint() {
    return createVector((this.a.x + this.b.x) * 0.5, (this.a.y + this.b.y) * 0.5);
  }

  // Distance d'un point au SEGMENT (Buffa utilisait la distance à la droite
  // infinie : une voiture loin du checkpoint, mais alignée avec lui, pouvait
  // le valider).
  distanceTo(p) {
    const ab = p5.Vector.sub(this.b, this.a);
    const t = constrain(p5.Vector.sub(p, this.a).dot(ab) / ab.magSq(), 0, 1);
    const proche = p5.Vector.add(this.a, ab.mult(t));
    return p5.Vector.dist(p, proche);
  }

  show() {
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}
