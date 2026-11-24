// Path.js
// Chemin polyligne avec un rayon (« tube ») pour le comportement Path following.
// Ce n'est pas un Vehicle : c'est un repère géométrique, pas un agent.

class Path {
  constructor(radius = 20) {
    this.radius = radius;
    this.points = [];
  }

  addPoint(x, y) {
    this.points.push(createVector(x, y));
  }

  // Point du chemin le plus proche de `position`, et cible un peu plus loin
  // sur le même segment (lookAhead pixels) pour anticiper.
  closestPoint(position, lookAhead = 25) {
    let best = { point: null, target: null, distance: Infinity };
    for (let i = 0; i < this.points.length - 1; i += 1) {
      let start = this.points[i];
      let end = this.points[i + 1];
      let normal = Path.projectOnSegment(position, start, end);
      let distance = p5.Vector.dist(position, normal);
      if (distance < best.distance) {
        let direction = p5.Vector.sub(end, start).setMag(lookAhead);
        best = {
          point: normal,
          target: p5.Vector.add(normal, direction),
          distance,
        };
      }
    }
    return best;
  }

  // Projection orthogonale d'un point sur un segment [start, end].
  static projectOnSegment(position, start, end) {
    let segment = p5.Vector.sub(end, start);
    let lengthSq = segment.magSq();
    if (lengthSq === 0) {
      return start.copy();
    }
    let t = p5.Vector.sub(position, start).dot(segment) / lengthSq;
    t = constrain(t, 0, 1);
    return p5.Vector.add(start, segment.mult(t));
  }

  show() {
    push();
    noFill();
    strokeJoin(ROUND);
    stroke(255, 40);
    strokeWeight(this.radius * 2);
    beginShape();
    this.points.forEach((point) => vertex(point.x, point.y));
    endShape();
    stroke(255, 160);
    strokeWeight(1);
    beginShape();
    this.points.forEach((point) => vertex(point.x, point.y));
    endShape();
    pop();
  }
}
