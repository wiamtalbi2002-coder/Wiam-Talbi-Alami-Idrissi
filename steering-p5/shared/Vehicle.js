// Vehicle.js
// Modèle de véhicule simple de Craig Reynolds, « Steering Behaviors For
// Autonomous Characters » (GDC 1999) : https://www.red3d.com/cwr/steer/gdc99/
//
// Hiérarchie du mouvement (Reynolds) :
//   1. Sélection d'action : la sous-classe décide QUOI faire (applyBehaviors).
//   2. Pilotage (steering) : chaque comportement renvoie une force (ce fichier).
//   3. Locomotion : update() intègre la force (Euler) et déplace le véhicule.
//
// Locomotion (intégration d'Euler) :
//   steeringForce = truncate(steering, maxForce)
//   acceleration  = steeringForce / mass
//   velocity      = truncate(velocity + acceleration, maxSpeed)
//   position      = position + velocity
//
// Convention : chaque méthode de comportement est PURE (elle ne modifie pas le
// véhicule) et RENVOIE un p5.Vector. La combinaison se fait dans
// applyBehaviors() des sous-classes, avec des poids ou une priorité.

class Vehicle {
  // Interrupteur global du mode debug, partagé par tous les véhicules.
  static debug = false;

  constructor(x, y, options = {}) {
    this.pos = createVector(x, y);
    this.vel = options.vel ? options.vel.copy() : p5.Vector.random2D();
    this.acc = createVector(0, 0);

    // Paramètres physiques du modèle de Reynolds.
    this.mass = options.mass ?? 1;
    this.maxSpeed = options.maxSpeed ?? 4;
    this.maxForce = options.maxForce ?? 0.2;

    // Rayon de la sphère englobante (collisions, évitement).
    this.r = options.r ?? 8;
    this.color = options.color ?? color(255);

    // Paramètres d'arrival.
    this.slowingDistance = options.slowingDistance ?? 100;

    // Paramètres de wander (cercle projeté devant le véhicule).
    this.wanderDistance = options.wanderDistance ?? 80;
    this.wanderRadius = options.wanderRadius ?? 40;
    this.wanderJitter = options.wanderJitter ?? 0.3;
    this.wanderTheta = random(TWO_PI);

    // Rayon de perception pour les comportements de groupe.
    this.perceptionRadius = options.perceptionRadius ?? 60;

    // Distance d'anticipation (obstacles, chemins).
    this.lookAhead = options.lookAhead ?? 60;

    // Informations de debug remplies par les comportements.
    this.debugInfo = {};
  }

  // ---------------------------------------------------------------------------
  // Locomotion
  // ---------------------------------------------------------------------------

  // Ajoute une force au cumul de la frame (F = m·a).
  applyForce(force) {
    let acceleration = p5.Vector.div(force, this.mass);
    this.acc.add(acceleration);
  }

  // Intègre l'accélération puis remet le cumul à zéro.
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  // Réapparaît de l'autre côté quand le véhicule sort entièrement du canvas.
  wrapEdges() {
    if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    } else if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    }
    if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    } else if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    }
  }

  // ---------------------------------------------------------------------------
  // Comportements individuels
  // ---------------------------------------------------------------------------

  /**
   * @behavior Seek — se diriger vers une cible à vitesse maximale.
   */
  seek(target, arrival = false) {
    let desired = p5.Vector.sub(target, this.pos);
    let distance = desired.mag();
    let speed = this.maxSpeed;
    if (arrival === true && distance < this.slowingDistance) {
      speed = map(distance, 0, this.slowingDistance, 0, this.maxSpeed);
    }
    desired.setMag(speed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /**
   * @behavior Flee — s'éloigner d'une cible (option : distance de panique).
   */
  flee(target, panicDistance = Infinity) {
    if (p5.Vector.dist(this.pos, target) > panicDistance) {
      return createVector(0, 0);
    }
    return this.seek(target).mult(-1);
  }

  /**
   * @behavior Arrival — comme Seek mais ralentit dans slowingDistance.
   */
  arrive(target) {
    this.debugInfo.arriveTarget = target.copy();
    return this.seek(target, true);
  }

  // Position future d'un véhicule, prédite en T = distance / vitesse.
  predictPosition(other, maxPrediction = 60) {
    let distance = p5.Vector.dist(this.pos, other.pos);
    let speed = max(this.maxSpeed, 0.0001);
    let prediction = min(distance / speed, maxPrediction);
    let future = p5.Vector.mult(other.vel, prediction);
    return future.add(other.pos);
  }

  /**
   * @behavior Pursuit — seek vers la position future d'un véhicule mobile.
   */
  pursue(other, maxPrediction = 60) {
    let future = this.predictPosition(other, maxPrediction);
    this.debugInfo.pursueTarget = future.copy();
    return this.seek(future);
  }

  /**
   * @behavior Evasion — flee depuis la position future d'un véhicule.
   */
  evade(other, maxPrediction = 60) {
    return this.pursue(other, maxPrediction).mult(-1);
  }

  /**
   * @behavior Offset pursuit — suivre un véhicule à un décalage local.
   */
  offsetPursuit(leader, localOffset) {
    let worldOffset = localOffset.copy().rotate(leader.vel.heading());
    let point = p5.Vector.add(leader.pos, worldOffset);
    let distance = p5.Vector.dist(this.pos, point);
    let prediction = distance / max(this.maxSpeed, 0.0001);
    point.add(p5.Vector.mult(leader.vel, prediction));
    return this.arrive(point);
  }

  /**
   * @behavior Wander — errance via un cercle projeté devant le véhicule.
   */
  wander() {
    this.wanderTheta += random(-this.wanderJitter, this.wanderJitter);
    let center = this.vel.copy();
    if (center.mag() === 0) {
      center = p5.Vector.random2D();
    }
    center.setMag(this.wanderDistance);
    center.add(this.pos);
    let angle = this.wanderTheta + this.vel.heading();
    let offset = p5.Vector.fromAngle(angle, this.wanderRadius);
    let target = p5.Vector.add(center, offset);
    this.debugInfo.wander = { center, target };
    return this.seek(target);
  }

  /**
   * @behavior Containment — rester dans un rectangle (marge en pixels).
   */
  boundaries(margin = 50, x = 0, y = 0, w = width, h = height) {
    let desired = null;
    if (this.pos.x < x + margin) {
      desired = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > x + w - margin) {
      desired = createVector(-this.maxSpeed, this.vel.y);
    }
    if (this.pos.y < y + margin) {
      desired = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > y + h - margin) {
      desired = createVector(this.vel.x, -this.maxSpeed);
    }
    if (desired === null) {
      return createVector(0, 0);
    }
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /**
   * @behavior Obstacle avoidance — cylindre d'anticipation devant le véhicule.
   */
  avoidObstacles(obstacles) {
    let speed = this.vel.mag();
    if (speed === 0) {
      return createVector(0, 0);
    }
    let forward = this.vel.copy().normalize();
    let corridor = this.lookAhead * (speed / max(this.maxSpeed, 0.0001));
    let closest = null;
    let closestAlong = Infinity;
    let closestLateral = null;

    obstacles.forEach((obstacle) => {
      let toObstacle = p5.Vector.sub(obstacle.pos, this.pos);
      let along = toObstacle.dot(forward);
      if (along < 0 || along > corridor + obstacle.r) {
        return;
      }
      let lateral = p5.Vector.sub(toObstacle, p5.Vector.mult(forward, along));
      if (lateral.mag() > obstacle.r + this.r) {
        return;
      }
      if (along < closestAlong) {
        closest = obstacle;
        closestAlong = along;
        closestLateral = lateral;
      }
    });

    this.debugInfo.avoid = { corridor, closest };
    if (closest === null) {
      return createVector(0, 0);
    }

    // Force latérale opposée à l'obstacle, plus forte s'il est proche.
    let away = closestLateral.copy().mult(-1);
    if (away.mag() < 0.0001) {
      away = createVector(-forward.y, forward.x);
    }
    let urgency = 1 - closestAlong / (corridor + closest.r);
    away.setMag(this.maxForce * (1 + urgency));
    return away;
  }

  /**
   * @behavior Path following — rester dans le tube d'un Path.
   */
  followPath(path, predictDistance = 25) {
    let future = this.vel.copy();
    if (future.mag() === 0) {
      future = p5.Vector.random2D();
    }
    future.setMag(predictDistance);
    future.add(this.pos);

    let best = path.closestPoint(future);
    this.debugInfo.path = { future, normal: best.point, target: best.target };
    if (best.distance > path.radius) {
      return this.seek(best.target);
    }
    return createVector(0, 0);
  }

  /**
   * @behavior Flow field following — aligner la vitesse sur un FlowField.
   */
  followFlowField(field) {
    let desired = field.lookup(this.pos).copy();
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /**
   * @behavior Unaligned collision avoidance — éviter les futurs croisements.
   */
  avoidCollisions(vehicles, maxTime = 60) {
    let soonest = Infinity;
    let threat = null;
    let myFutureAtThreat = null;
    let threatFuture = null;

    vehicles.forEach((other) => {
      if (other === this) {
        return;
      }
      let relPos = p5.Vector.sub(other.pos, this.pos);
      let relVel = p5.Vector.sub(other.vel, this.vel);
      let relSpeedSq = relVel.magSq();
      if (relSpeedSq === 0) {
        return;
      }
      let time = -relPos.dot(relVel) / relSpeedSq;
      if (time < 0 || time > maxTime || time >= soonest) {
        return;
      }
      let myFuture = p5.Vector.add(this.pos, p5.Vector.mult(this.vel, time));
      let otherFuture = p5.Vector.add(other.pos, p5.Vector.mult(other.vel, time));
      if (p5.Vector.dist(myFuture, otherFuture) < (this.r + other.r) * 2) {
        soonest = time;
        threat = other;
        myFutureAtThreat = myFuture;
        threatFuture = otherFuture;
      }
    });

    if (threat === null) {
      return createVector(0, 0);
    }
    let desired = p5.Vector.sub(myFutureAtThreat, threatFuture);
    if (desired.mag() < 0.0001) {
      desired = createVector(-this.vel.y, this.vel.x);
    }
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // ---------------------------------------------------------------------------
  // Comportements de groupe (boids)
  // ---------------------------------------------------------------------------

  // Voisins dans le rayon de perception (le véhicule lui-même exclu).
  neighbors(vehicles, radius = this.perceptionRadius) {
    return vehicles.filter((other) => {
      return other !== this && p5.Vector.dist(this.pos, other.pos) < radius;
    });
  }

  /**
   * @behavior Separation — s'écarter des voisins trop proches (force en 1/d).
   */
  separation(vehicles, desiredSeparation = this.r * 3) {
    let sum = createVector(0, 0);
    let count = 0;
    vehicles.forEach((other) => {
      let distance = p5.Vector.dist(this.pos, other.pos);
      if (other !== this && distance > 0 && distance < desiredSeparation) {
        let away = p5.Vector.sub(this.pos, other.pos);
        away.setMag(1 / distance);
        sum.add(away);
        count += 1;
      }
    });
    if (count === 0) {
      return createVector(0, 0);
    }
    sum.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(sum, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /**
   * @behavior Alignment — adopter la direction moyenne des voisins.
   */
  alignment(vehicles, radius = this.perceptionRadius) {
    let neighbors = this.neighbors(vehicles, radius);
    if (neighbors.length === 0) {
      return createVector(0, 0);
    }
    let average = createVector(0, 0);
    neighbors.forEach((other) => average.add(other.vel));
    average.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(average, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  /**
   * @behavior Cohesion — se diriger vers le centre des voisins.
   */
  cohesion(vehicles, radius = this.perceptionRadius) {
    let neighbors = this.neighbors(vehicles, radius);
    if (neighbors.length === 0) {
      return createVector(0, 0);
    }
    let center = createVector(0, 0);
    neighbors.forEach((other) => center.add(other.pos));
    center.div(neighbors.length);
    return this.seek(center);
  }

  /**
   * @behavior Flocking — séparation + alignement + cohésion pondérés.
   */
  flock(vehicles, weights = {}) {
    let separationWeight = weights.separation ?? 1.5;
    let alignmentWeight = weights.alignment ?? 1;
    let cohesionWeight = weights.cohesion ?? 1;
    let force = createVector(0, 0);
    force.add(this.separation(vehicles).mult(separationWeight));
    force.add(this.alignment(vehicles).mult(alignmentWeight));
    force.add(this.cohesion(vehicles).mult(cohesionWeight));
    return force;
  }

  /**
   * @behavior Leader following — arrival derrière le leader, s'écarter devant.
   */
  followLeader(leader, vehicles, distanceBehind = 40, sightRadius = 50) {
    let heading = leader.vel.copy();
    if (heading.mag() === 0) {
      heading = createVector(1, 0);
    }
    heading.setMag(distanceBehind);
    let behind = p5.Vector.sub(leader.pos, heading);
    let ahead = p5.Vector.add(leader.pos, heading);

    let force = this.arrive(behind);
    if (p5.Vector.dist(this.pos, ahead) < sightRadius
      || p5.Vector.dist(this.pos, leader.pos) < sightRadius) {
      force.add(this.evade(leader).mult(2));
    }
    force.add(this.separation(vehicles));
    return force;
  }

  // ---------------------------------------------------------------------------
  // Combinaison de comportements
  // ---------------------------------------------------------------------------

  // Combinaison par priorité (Reynolds) : les forces sont ajoutées dans
  // l'ordre jusqu'à épuiser le budget maxForce. Les plus urgentes d'abord.
  prioritized(forces) {
    let total = createVector(0, 0);
    let budget = this.maxForce;
    forces.forEach((force) => {
      if (budget <= 0) {
        return;
      }
      let magnitude = force.mag();
      if (magnitude > budget) {
        total.add(force.copy().setMag(budget));
        budget = 0;
      } else {
        total.add(force);
        budget -= magnitude;
      }
    });
    return total;
  }

  // Sélection d'action : à redéfinir dans chaque sous-classe.
  applyBehaviors() {
    this.applyForce(this.wander());
  }

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    noStroke();
    fill(this.color);
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();
    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }

  // Vecteur vitesse en rouge (convention du projet).
  drawDebug() {
    this.drawVector(this.pos, p5.Vector.mult(this.vel, 10), color(255, 0, 0));
  }

  // Flèche utilitaire : origine, vecteur, couleur.
  drawVector(origin, vector, arrowColor) {
    if (vector.mag() < 0.5) {
      return;
    }
    push();
    stroke(arrowColor);
    strokeWeight(2);
    fill(arrowColor);
    translate(origin.x, origin.y);
    line(0, 0, vector.x, vector.y);
    rotate(vector.heading());
    translate(vector.mag(), 0);
    triangle(0, 0, -7, -3.5, -7, 3.5);
    pop();
  }
}
