// ray.js — capteur de la voiture (lancer de rayon, vidéo de Daniel Shiffman).
// angle : angle du rayon par rapport à la direction de la voiture.

class Ray {
  constructor(angle) {
    this.angle = angle;
    this.dir = p5.Vector.fromAngle(angle);
  }

  rotate(heading) {
    this.dir = p5.Vector.fromAngle(this.angle + heading);
  }

  // Point d'intersection avec le mur (ou undefined)
  cast(origin, wall) {
    const x1 = wall.a.x, y1 = wall.a.y, x2 = wall.b.x, y2 = wall.b.y;
    const x3 = origin.x, y3 = origin.y;
    const x4 = origin.x + this.dir.x, y4 = origin.y + this.dir.y;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) {
      return undefined;
    }
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
    return undefined;
  }
}
