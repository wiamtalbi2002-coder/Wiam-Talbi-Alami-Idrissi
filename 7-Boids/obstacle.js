// obstacle.js
// Obstacle circulaire. Règle du projet : un élément fixe qui pourrait
// bouger est un véhicule, donc Obstacle hérite de Boid (vitesse nulle).
// Les boids l'évitent (comportement avoid) ; touche 'o' = nouvel obstacle.

class Obstacle extends Boid {
  constructor(x, y, r, couleur) {
    super(x, y);
    this.vel.set(0, 0);
    this.maxSpeed = 0;
    this.r = r;
    this.color = couleur;
  }

  show() {
    push();
    fill(this.color);
    stroke(0);
    strokeWeight(3);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    fill(0);
    ellipse(this.pos.x, this.pos.y, 10);
    pop();
  }
}
