// predator.js
// Prédateur (exercice) : sous-classe de Vehicle. Il poursuit (pursue)
// l'individu le plus proche en visant sa position future, et le mange
// quand il le touche. Il a faim : sa santé baisse, chaque proie lui
// rend de la vie ; à zéro il meurt. Sans proie en vue, il déambule.

class Predator extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 9;
    this.maxSpeed = 3.5;
    this.vitesseBase = this.maxSpeed;
    this.maxForce = 0.25;
    this.health = 1;
    this.faim = 0.0015;
    this.rayonChasse = 180;
    this.framesPrediction = 8;
    this.wanderTheta = 0;
    this.nbMangés = 0;
  }

  // poursuite : seek de la position future de la cible
  pursue(cible) {
    const futur = p5.Vector.add(cible.pos, p5.Vector.mult(cible.vel, this.framesPrediction));
    if (Vehicle.debug) {
      push();
      fill('lime');
      noStroke();
      circle(futur.x, futur.y, 8);
      stroke(255, 165, 0, 120);
      line(this.pos.x, this.pos.y, futur.x, futur.y);
      pop();
    }
    return this.seek(futur);
  }

  wander() {
    const centre = this.vel.copy().setMag(80).add(this.pos);
    const angle = this.vel.heading() + this.wanderTheta;
    const point = createVector(30 * cos(angle), 30 * sin(angle)).add(centre);
    this.wanderTheta += random(-0.3, 0.3);
    return this.seek(point);
  }

  // chasse : renvoie les proies restantes (celles mangées sont retirées)
  chasser(proies) {
    let plusProche = null;
    let record = this.rayonChasse;
    proies.forEach((p) => {
      const d = this.pos.dist(p.pos);
      if (d < record) {
        record = d;
        plusProche = p;
      }
    });
    if (plusProche === null) {
      this.applyForce(this.wander().mult(0.5));
      return;
    }
    this.applyForce(this.pursue(plusProche));
    if (record < this.r + plusProche.r * 2) {
      // miam : la proie meurt, le prédateur reprend des forces
      plusProche.health = -1;
      this.health = min(this.health + 0.4, 1.5);
      this.nbMangés++;
    }
  }

  update() {
    super.update();
    // super.update() retire 0.005 ; un prédateur a moins faim
    this.health += 0.005 - this.faim;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() + PI / 2);
    if (Vehicle.debug) {
      noFill();
      stroke(255, 165, 0, 120);
      ellipse(0, 0, this.rayonChasse * 2);
    }
    const col = lerpColor(color(90, 40, 0), color(255, 140, 0), constrain(this.health, 0, 1));
    fill(col);
    stroke(255);
    strokeWeight(1.5);
    beginShape();
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(0, this.r);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);
    pop();
  }

  // un prédateur ne se clone pas tout seul
  clone() {
    return null;
  }
}
