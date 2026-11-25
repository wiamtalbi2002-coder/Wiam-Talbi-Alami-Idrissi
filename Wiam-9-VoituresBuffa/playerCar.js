// playerCar.js — PlayerCar extends Vehicle : TA voiture (flèches du clavier).
// Elle utilise la même physique que les voitures de l'IA (steering) :
// les flèches gauche / droite tournent le cap, haut accélère, bas freine ;
// la vitesse désirée est dans le cap, et force = désirée − actuelle.
// Toucher un mur : retour au dernier checkpoint et 1 s de pénalité.

class PlayerCar extends Vehicle {
  constructor(track) {
    super(track.start.x, track.start.y);
    this.maxSpeed = 5;
    this.maxForce = 0.25;
    this.reset(track);
    this.meilleurTour = null;
  }

  reset(track) {
    this.track = track;
    this.pos = track.start.copy();
    this.cap = track.startHeading;
    this.vel = createVector(0, 0);
    this.index = 1;
    this.steps = 0;
    this.debutTour = 0;
    this.penalite = 0;
    this.crash = 0;
    this.tours = 0;
    this.flash = 0;
  }

  step() {
    if (this.penalite > 0) {
      this.penalite--;
      this.steps++;
      return;
    }
    if (keyIsDown(LEFT_ARROW)) this.cap -= 0.07;
    if (keyIsDown(RIGHT_ARROW)) this.cap += 0.07;
    let vitesseVoulue = this.vel.mag() * 0.98;
    if (keyIsDown(UP_ARROW)) vitesseVoulue = this.maxSpeed;
    if (keyIsDown(DOWN_ARROW)) vitesseVoulue = 0;
    this.applyForce(this.steer(p5.Vector.fromAngle(this.cap).mult(vitesseVoulue)));
    this.update();
    this.steps++;

    for (const mur of this.track.wallsNear(this.index - 1, 1)) {
      if (mur.distanceTo(this.pos) < 4) {
        this.crasher();
        return;
      }
    }
    const total = this.track.total;
    const cp = this.track.checkpoints[this.index % total];
    if (cp.distanceTo(this.pos) < 8) {
      if (this.index % total === 0) {
        const t = this.steps - this.debutTour;
        this.tours++;
        if (this.meilleurTour === null || t < this.meilleurTour) {
          this.meilleurTour = t;
        }
        this.debutTour = this.steps;
      }
      this.index++;
    }
  }

  crasher() {
    const total = this.track.total;
    const dernier = this.track.checkpoints[(this.index - 1) % total];
    const suivant = this.track.checkpoints[this.index % total];
    this.pos = dernier.midpoint();
    this.cap = p5.Vector.sub(suivant.midpoint(), this.pos).heading();
    this.vel.set(0, 0);
    this.penalite = 60;
    this.crash++;
    this.flash = 20;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.cap);
    stroke(255);
    strokeWeight(2);
    fill(this.penalite > 0 && frameCount % 10 < 5 ? 80 : color(255, 60, 170));
    rectMode(CENTER);
    rect(0, 0, 22, 11, 4);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(9);
    rotate(HALF_PI);
    text('W', 0, 0);
    pop();
    if (this.flash > 0) {
      push();
      noFill();
      stroke(255, 60, 170, this.flash * 12);
      strokeWeight(3);
      circle(this.pos.x, this.pos.y, 60 - this.flash * 2);
      pop();
      this.flash--;
    }
    if (Vehicle.debug) {
      this.drawVelocity();
    }
  }
}
