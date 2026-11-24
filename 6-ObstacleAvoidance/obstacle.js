// obstacle.js
// Obstacle circulaire : une position (pos), un rayon et une couleur.
// enCollision passe à true pendant une frame quand un véhicule risque de
// le percuter : il est alors dessiné en rouge (exercice).

class Obstacle {
  constructor(x, y, r, couleur) {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = couleur;
    this.enCollision = false;
  }

  show() {
    push();
    fill(this.enCollision ? 'red' : this.color);
    stroke(0);
    strokeWeight(3);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    fill(0);
    ellipse(this.pos.x, this.pos.y, 10);
    pop();
    this.enCollision = false;
  }
}
