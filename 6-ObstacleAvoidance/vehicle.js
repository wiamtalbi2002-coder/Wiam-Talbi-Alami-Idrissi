/*
  Calcule la projection orthogonale du point a sur le vecteur b
  a et b sont des vecteurs calculés comme ceci :
  let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

// vehicle.js — 6-ObstacleAvoidance (voir 6-Specification.md).
// Exercices : comportement avoid avec deux vecteurs ahead / ahead2 et la
// position du véhicule, longueur dynamique selon la vitesse, véhicules qui
// déambulent (wander) en évitant les obstacles, cercle englobant, véhicules
// qui s'évitent entre eux (en tenant compte de leur position future),
// séparation.

class Vehicle {
  static debug = false;

  constructor(x, y, type = 'suiveur') {
    // position, vitesse, accélération du véhicule
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;

    // 'suiveur' : arrive sur la souris ; 'wander' : déambule
    this.type = type;
    this.color = type === 'wander' ? 'lightgreen' : 'white';

    this.r_pourDessin = 16;
    // rayon du cercle englobant (pour l'évitement)
    this.r = this.r_pourDessin * 1.5;

    // Pour évitement d'obstacle : distance où l'on regarde devant
    // (à vitesse maximale) et largeur de la zone devant le vaisseau.
    this.distanceAhead = 120;
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;

    // pour comportement wander
    this.distanceCercle = 100;
    this.wanderRadius = 40;
    this.wanderTheta = random(TWO_PI);
    this.displaceRange = 0.3;

    // Poids des comportements (réglés par les curseurs du sketch)
    this.poids = { arrive: 0.1, wander: 0.3, avoid: 0.3, separate: 0.2, boundaries: 1 };

    // chemin derrière vaisseaux
    this.path = [];
    this.pathMaxLength = 30;
  }

  // Combine les comportements selon le type du véhicule.
  // obstaclesVehicules : les autres véhicules vus comme des obstacles
  // (cercle englobant à leur position future), si l'option est cochée.
  applyBehaviors(target, obstacles, vehicules, obstaclesVehicules = []) {
    let tous = obstacles.concat(obstaclesVehicules.filter((o) => o.owner !== this));
    let avoidForce = this.avoid(tous);
    let separateForce = this.separate(vehicules);
    avoidForce.mult(this.poids.avoid);
    separateForce.mult(this.poids.separate);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);

    if (this.type === 'wander') {
      this.applyForce(this.wander().mult(this.poids.wander));
    } else {
      this.applyForce(this.arrive(target).mult(this.poids.arrive));
      let boundariesForce = this.boundaries(0, 0, width, height, 25);
      this.applyForce(boundariesForce.mult(this.poids.boundaries));
    }
  }

  /* Évitement d'obstacle amélioré (avoidAmeliore du transparent) :
     - on regarde avec deux vecteurs : ahead, et ahead2 deux fois plus
       court, plus la position du véhicule lui-même (cas du véhicule
       déjà dans l'obstacle) ;
     - la longueur de ahead dépend de la vitesse :
       dynamic_length = length(velocity) / MAX_VELOCITY
       ahead = position + normalize(velocity) * dynamic_length
       (multiplié ici par distanceAhead, en pixels) ;
     - s'il y a collision possible avec l'obstacle le plus proche, la
       force pousse du centre de l'obstacle vers le point menacé.
  */
  avoid(obstacles) {
    if (obstacles.length === 0 || this.vel.mag() < 0.01) {
      return createVector(0, 0);
    }
    let dynamicLength = this.vel.mag() / this.maxSpeed;
    let ahead = this.vel.copy().normalize().mult(dynamicLength * this.distanceAhead);
    let ahead2 = ahead.copy().mult(0.5);
    let pointAhead = p5.Vector.add(this.pos, ahead);
    let pointAhead2 = p5.Vector.add(this.pos, ahead2);

    // L'obstacle le plus proche du véhicule
    let obstacle = this.getObstacleLePlusProche(obstacles);

    // On garde le point (ahead, ahead2 ou pos) le plus proche de son centre
    let candidats = [pointAhead, pointAhead2, this.pos];
    let pointMenace = candidats[0];
    let distance = Infinity;
    candidats.forEach((p) => {
      let d = p.dist(obstacle.pos);
      if (d < distance) {
        distance = d;
        pointMenace = p;
      }
    });

    let collision = distance < obstacle.r + this.largeurZoneEvitementDevantVaisseau;
    if (obstacle.enCollision !== undefined && collision) {
      // l'obstacle se dessine en rouge (exercice : « dessiner le cercle en rouge »)
      obstacle.enCollision = true;
    }

    if (Vehicle.debug) {
      this.drawVector(this.pos, ahead, 'yellow');
      this.drawVector(this.pos, ahead2, 'purple');
      push();
      noStroke();
      fill('red');
      circle(pointAhead.x, pointAhead.y, 8);
      fill('lightblue');
      circle(pointAhead2.x, pointAhead2.y, 8);
      // zone d'évitement devant le vaisseau
      stroke(255, 40);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau * 2);
      line(this.pos.x, this.pos.y, pointAhead.x, pointAhead.y);
      // vecteur vers le centre de l'obstacle le plus proche
      stroke(collision ? 'red' : 'gray');
      strokeWeight(1);
      line(this.pos.x, this.pos.y, obstacle.pos.x, obstacle.pos.y);
      pop();
    }

    if (collision === false) {
      return createVector(0, 0);
    }
    let desired = p5.Vector.sub(pointMenace, obstacle.pos);
    if (desired.mag() < 0.001) {
      desired = createVector(-this.vel.y, this.vel.x);
    }
    if (Vehicle.debug) {
      this.drawVector(obstacle.pos, desired.copy().setMag(obstacle.r + 20), 'orange');
    }
    desired.setMag(this.maxSpeed);
    let force = p5.Vector.sub(desired, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  // Wander (vu dans 4-Wander) : point sur un cercle devant le véhicule.
  wander() {
    let pointDevant = this.vel.copy().setMag(this.distanceCercle).add(this.pos);
    let theta = this.wanderTheta + this.vel.heading();
    let pointSurLeCercle = createVector(
      this.wanderRadius * cos(theta), this.wanderRadius * sin(theta)).add(pointDevant);
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);
    if (Vehicle.debug) {
      push();
      noFill();
      stroke(255, 80);
      circle(pointDevant.x, pointDevant.y, this.wanderRadius * 2);
      fill('lime');
      noStroke();
      circle(pointSurLeCercle.x, pointSurLeCercle.y, 8);
      pop();
    }
    return this.seek(pointSurLeCercle);
  }

  // Le véhicule vu comme un obstacle pour les autres : cercle englobant
  // placé à sa position FUTURE (amélioration : prédiction de `frames`).
  commeObstacle(frames) {
    let futur = p5.Vector.add(this.pos, p5.Vector.mult(this.vel, frames));
    return { pos: futur, r: this.r, owner: this };
  }

  // Bords repoussants (comportement boundaries de Reynolds, containment).
  // Correction : la version de départ renvoyait la vitesse désirée au
  // lieu de la force (désirée - actuelle).
  boundaries(bx, by, bw, bh, d) {
    let vitesseDesiree = null;
    if (this.pos.x < bx + d) {
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > bx + bw - d) {
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
    }
    if (this.pos.y < by + d) {
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > by + bh - d) {
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
    }
    if (vitesseDesiree === null) {
      return createVector(0, 0);
    }
    vitesseDesiree.setMag(this.maxSpeed);
    let force = p5.Vector.sub(vitesseDesiree, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = Infinity;
    let obstacleLePlusProche = undefined;
    obstacles.forEach((o) => {
      // distance au BORD de l'obstacle (un gros obstacle compte plus)
      const distance = this.pos.dist(o.pos) - o.r;
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });
    return obstacleLePlusProche;
  }

  arrive(target) {
    return this.seek(target, true);
  }

  seek(target, arrival = false) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    if (arrival) {
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      }
    }
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  // Séparation : garder ses distances avec les autres véhicules.
  // Correction : la version de départ utilisait this.maxspeed,
  // this.velocity et this.maxforce (qui n'existent pas) : la force
  // devenait NaN dès que deux véhicules se rapprochaient.
  separate(vehicules) {
    let desiredseparation = this.r * 2;
    let steer = createVector(0, 0);
    let count = 0;
    vehicules.forEach((other) => {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredseparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    });
    if (count > 0) {
      steer.div(count);
    }
    if (steer.mag() > 0) {
      steer.setMag(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
    this.ajoutePosAuPath();
  }

  ajoutePosAuPath() {
    this.path.push(this.pos.copy());
    if (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  show() {
    this.drawPath();
    this.drawVehicle();
  }

  drawVehicle() {
    push();
    stroke(255);
    strokeWeight(2);
    fill(this.color);
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    triangle(-this.r_pourDessin, -this.r_pourDessin / 2,
      -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
    pop();

    // Cercle englobant (exercice : « associez à chaque véhicule un cercle
    // englobant que vous dessinerez »)
    push();
    noFill();
    stroke(this.type === 'wander' ? 'rgba(144,238,144,0.5)' : 'rgba(255,255,255,0.35)');
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }

  drawPath() {
    push();
    noStroke();
    fill(this.color);
    this.path.forEach((p, index) => {
      if (!(index % 5)) {
        circle(p.x, p.y, 2);
      }
    });
    pop();
  }

  drawVector(pos, v, color) {
    push();
    strokeWeight(3);
    stroke(color);
    fill(color);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    let arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  // Les véhicules qui déambulent réapparaissent de l'autre côté.
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}
