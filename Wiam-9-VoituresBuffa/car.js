// car.js — Car extends Vehicle : une voiture pilotée par un réseau de neurones.
//
// Capteurs (entrées du réseau) : n rayons répartis devant la voiture, chacun
// donne 1 si un mur est collé, 0 si rien n'est vu jusqu'à `sight` pixels ;
// plus la vitesse actuelle (Buffa ne la donnait pas : sans elle, le réseau ne
// peut pas savoir s'il doit freiner avant un virage).
// Sorties : direction (angle relatif à la voiture) et vitesse souhaitées.
// Ces deux sorties deviennent une VITESSE DÉSIRÉE, puis une force de steering
// (désirée − actuelle) : c'est le lien entre le cours de Reynolds et l'IA.

class Car extends Vehicle {
  constructor(track, params, brain = null, hue = random(360)) {
    super(track.start.x, track.start.y);
    this.track = track;
    this.params = params;
    this.maxSpeed = 5;
    this.maxForce = 0.2;
    // petite vitesse initiale dans le sens du circuit
    this.vel = p5.Vector.fromAngle(track.startHeading).mult(1);

    // rayons répartis de -75° à +75°
    this.rays = [];
    const n = params.nbRayons;
    for (let k = 0; k < n; k++) {
      const a = n === 1 ? 0 : map(k, 0, n - 1, -75, 75);
      this.rays.push(new Ray(radians(a)));
    }
    this.lectures = new Array(n).fill(0);
    this.impacts = new Array(n).fill(null);

    this.brain = brain ? brain.copy() : new NeuralNetwork([n + 1, params.neuronesCaches, 2]);
    this.hue = (hue + 360) % 360;
    this.elite = false;

    this.index = 1; // prochain checkpoint à franchir
    this.progress = 0; // checkpoints franchis
    this.steps = 0;
    this.sansCheckpoint = 0;
    this.dead = false;
    this.finished = false;
    this.lapSteps = []; // durée de chaque tour, en pas de simulation
    this.debutTour = 0;
    this.fitness = 0;
  }

  // Un pas de simulation : percevoir, décider, bouger, vérifier.
  step() {
    if (this.dead || this.finished) {
      return;
    }
    this.applyForce(this.think());
    this.update();
    this.check();
    this.steps++;
    this.sansCheckpoint++;
    if (this.sansCheckpoint > this.params.dureeDeVie) {
      this.dead = true;
    }
  }

  sense() {
    const murs = this.track.wallsNear(this.index - 1, 4);
    const sight = this.params.portee;
    const inputs = [];
    for (let k = 0; k < this.rays.length; k++) {
      const ray = this.rays[k];
      ray.rotate(this.vel.heading());
      let record = sight;
      let impact = null;
      for (const mur of murs) {
        const pt = ray.cast(this.pos, mur);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            impact = pt;
          }
        }
      }
      this.impacts[k] = impact;
      this.lectures[k] = 1 - record / sight;
      inputs.push(this.lectures[k]);
    }
    inputs.push(this.vel.mag() / this.maxSpeed);

    // collision : distance réelle aux murs les plus proches (plus fiable
    // que les rayons, qui ne voient pas sur les côtés ni derrière)
    for (const mur of this.track.wallsNear(this.index - 1, 1)) {
      if (mur.distanceTo(this.pos) < 3) {
        this.dead = true;
      }
    }
    return inputs;
  }

  think() {
    const out = this.brain.predict(this.sense());
    const angle = this.vel.heading() + map(out[0], 0, 1, -HALF_PI, HALF_PI);
    const vitesse = map(out[1], 0, 1, 0, this.maxSpeed);
    const desiree = p5.Vector.fromAngle(angle).mult(vitesse);
    return this.steer(desiree);
  }

  check() {
    const total = this.track.total;
    const cp = this.track.checkpoints[this.index % total];
    if (cp.distanceTo(this.pos) < 6) {
      this.progress++;
      this.sansCheckpoint = 0;
      if (this.index % total === 0) {
        // un tour complet
        this.lapSteps.push(this.steps - this.debutTour);
        this.debutTour = this.steps;
      }
      this.index++;
      if (this.progress >= this.params.tours * total) {
        this.finished = true;
      }
    }
  }

  // Fitness : progression au carré (une voiture qui va 2× plus loin vaut
  // 4× plus), multipliée par un bonus de rapidité (checkpoints par pas).
  // Buffa utilise 2^progression : après ~1000 checkpoints cela vaut
  // Infinity et la normalisation donne NaN (sélection cassée).
  calculateFitness() {
    const vitesse = this.progress / max(1, this.steps);
    this.fitness = this.progress * this.progress * (1 + 10 * vitesse);
    if (this.finished) {
      this.fitness *= 2;
    }
    return this.fitness;
  }

  // part du circuit parcourue (1 = toute la course)
  ratio() {
    return this.progress / (this.params.tours * this.track.total);
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    colorMode(HSB);
    noStroke();
    fill(this.hue, 70, 100, this.elite ? 1 : 0.55);
    rectMode(CENTER);
    rect(0, 0, 12, 6, 2);
    pop();
    if (Vehicle.debug) {
      this.drawRays(40);
      this.drawVelocity();
    }
  }

  drawRays(alpha) {
    push();
    for (let k = 0; k < this.rays.length; k++) {
      const p = this.impacts[k];
      const end = p || p5.Vector.add(this.pos, p5.Vector.mult(this.rays[k].dir, this.params.portee));
      stroke(p ? color(255, 80, 120, alpha * 4) : color(120, 255, 180, alpha));
      strokeWeight(1);
      line(this.pos.x, this.pos.y, end.x, end.y);
      if (p) {
        noStroke();
        fill(255, 80, 120);
        circle(p.x, p.y, 4);
      }
    }
    pop();
  }

  // le champion de la génération : plus gros, rayons visibles, couronne
  highlight() {
    this.drawRays(90);
    push();
    translate(this.pos.x, this.pos.y);
    push();
    rotate(this.vel.heading());
    colorMode(HSB);
    stroke(0, 0, 100);
    strokeWeight(2);
    fill(this.hue, 80, 100);
    rectMode(CENTER);
    rect(0, 0, 20, 10, 3);
    pop();
    textAlign(CENTER, CENTER);
    textSize(16);
    noStroke();
    text('👑', 0, -16);
    pop();
  }
}
