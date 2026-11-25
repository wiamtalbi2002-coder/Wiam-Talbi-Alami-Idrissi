// wiamPlayerCar.js — (ajout de Wiam) TA voiture, aux flèches, sur le circuit
// de Bruno, pour faire la course contre ses voitures.
// Même formule de steering que ses voitures : vitesse désirée dans le cap
// choisi au clavier, force = désirée − vitesse, limitée à maxForce.
// Exception assumée à la règle « sous-classe de Vehicle » : le Vehicle de
// Bruno crée un réseau TensorFlow dans son constructeur, inutile ici.

class WiamPlayerCar {
  constructor(track) {
    this.maxSpeed = 4;
    this.maxForce = 0.25;
    this.meilleurTour = null;
    this.reset(track);
  }

  reset(track) {
    this.track = track;
    const cps = track.checkpoints;
    this.pos = (track.start || cps[0].midpoint()).copy();
    this.cap = p5.Vector.sub(cps[1].midpoint(), cps[0].midpoint()).heading();
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.index = 1;
    this.steps = 0;
    this.debutTour = 0;
    this.tours = 0;
    this.crash = 0;
    this.penalite = 0;
    this.flash = 0;
  }

  static distanceSegment(p, a, b) {
    const ab = p5.Vector.sub(b, a);
    const t = constrain(p5.Vector.sub(p, a).dot(ab) / ab.magSq(), 0, 1);
    return p5.Vector.dist(p, p5.Vector.add(a, ab.mult(t)));
  }

  step() {
    this.steps++;
    if (this.penalite > 0) {
      this.penalite--;
      return;
    }
    if (keyIsDown(LEFT_ARROW)) this.cap -= 0.07;
    if (keyIsDown(RIGHT_ARROW)) this.cap += 0.07;
    let voulue = this.vel.mag() * 0.98;
    if (keyIsDown(UP_ARROW)) voulue = this.maxSpeed;
    if (keyIsDown(DOWN_ARROW)) voulue = 0;
    const desiree = p5.Vector.fromAngle(this.cap).mult(voulue);
    const force = p5.Vector.sub(desiree, this.vel).limit(this.maxForce);
    this.vel.add(force).limit(this.maxSpeed);
    this.pos.add(this.vel);

    // hors piste ? (distance signée de Bruno : négative = dehors)
    if (this.track.distance(this.pos) < 2) {
      this.crasher();
      return;
    }
    const cps = this.track.checkpoints;
    const cp = cps[this.index % cps.length];
    if (WiamPlayerCar.distanceSegment(this.pos, cp.a, cp.b) < 6) {
      if (this.index % cps.length === 0) {
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
    const cps = this.track.checkpoints;
    const dernier = cps[(this.index - 1) % cps.length];
    const suivant = cps[this.index % cps.length];
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
    rect(0, 0, 20, 10, 4);
    pop();
    if (this.flash > 0) {
      push();
      noFill();
      stroke(255, 60, 170, this.flash * 12);
      strokeWeight(3);
      ellipse(this.pos.x, this.pos.y, 60 - this.flash * 2);
      pop();
      this.flash--;
    }
  }
}
