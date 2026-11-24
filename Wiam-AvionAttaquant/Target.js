// Target.js
// Cible : un char blindé en 3D (4 points de vie).
// Tâche 3 : il erre et devient rouge quand l'avion le détecte.
// Tâche 4 (canDefend = true) : si l'avion ou un missile de l'avion entre
// dans son propre rayon de détection, il s'échappe (evade + dodge) ; si
// c'est l'avion, sa tourelle et son canon le suivent et il riposte avec
// ses missiles.

class Target extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { r: 16, maxSpeed: 4, maxForce: 0.5, ...options });
    this.detectionRadius = options.detectionRadius ?? 200;
    this.fireInterval = options.fireInterval ?? 120;
    this.canDefend = options.canDefend ?? true;
    this.maxHealth = options.maxHealth ?? 4;
    this.health = this.maxHealth;
    this.detected = false;
    this.threat = null;
    this.flash = 0;
    this.lastShot = frameCount + floor(random(this.fireInterval));
    this.turretAngle = this.vel.heading();
    this.barrelPitch = 0.05;
    this.z = 0;
  }

  // Menace la plus urgente dans le rayon de détection : celle qui
  // m'atteindrait le plus vite (distance / vitesse). Un missile rapide passe
  // donc avant l'avion, même s'il est un peu plus loin.
  // Les missiles des chars (owner 'target') ne sont jamais des menaces.
  findThreat(threats) {
    let mostUrgent = null;
    let shortestTime = Infinity;
    threats.forEach((threat) => {
      if (threat.owner === 'target') {
        return;
      }
      let distance = p5.Vector.dist(this.pos, threat.pos);
      if (distance > this.detectionRadius) {
        return;
      }
      let time = distance / max(threat.vel.mag(), 0.1);
      if (time < shortestTime) {
        mostUrgent = threat;
        shortestTime = time;
      }
    });
    return mostUrgent;
  }

  // Sélection d'action : fuir la menace (Tâche 4) ou errer.
  applyBehaviors(threats) {
    this.threat = null;
    if (this.canDefend === true) {
      this.threat = this.findThreat(threats);
    }

    if (this.threat !== null) {
      this.applyForce(this.evade(this.threat, 30).mult(2));
      this.applyForce(this.dodge(this.threat).mult(3));
    } else {
      this.applyForce(this.wander());
    }
    this.applyForce(this.boundaries(80).mult(3));
  }

  // Complément d'evade : un missile (rapide) se fuit mal en ligne droite.
  // Quand il est proche, on s'écarte perpendiculairement à sa trajectoire,
  // du côté où l'on se trouve déjà.
  dodge(threat, dodgeDistance = 150) {
    if (threat.vel.mag() === 0
      || p5.Vector.dist(this.pos, threat.pos) > dodgeDistance) {
      return createVector(0, 0);
    }
    let side = createVector(-threat.vel.y, threat.vel.x);
    let toMe = p5.Vector.sub(this.pos, threat.pos);
    if (side.dot(toMe) < 0) {
      side.mult(-1);
    }
    side.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(side, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // La tourelle et le canon suivent l'avion quand il est proche, sinon la
  // tourelle reprend le sens de marche.
  updateTurret(plane) {
    let desired = this.vel.heading();
    let desiredPitch = 0.05;
    let distance = p5.Vector.dist(this.pos, plane.pos);
    if (this.canDefend === true && distance < this.detectionRadius * 1.5) {
      desired = p5.Vector.sub(plane.pos, this.pos).heading();
      desiredPitch = atan2(plane.z, max(distance, 1));
    }
    let diff = desired - this.turretAngle;
    diff = atan2(sin(diff), cos(diff));
    this.turretAngle += diff * 0.15;
    this.barrelPitch = lerp(this.barrelPitch, desiredPitch, 0.1);
  }

  // Riposte (Tâche 4) : renvoie un Missile vert visant l'avion si celui-ci
  // est dans le rayon de détection et que la cadence le permet, sinon null.
  tryFire(plane, missileOptions = {}) {
    this.updateTurret(plane);
    if (this.canDefend === false) {
      return null;
    }
    if (p5.Vector.dist(this.pos, plane.pos) > this.detectionRadius) {
      return null;
    }
    if (frameCount - this.lastShot < this.fireInterval) {
      return null;
    }
    this.lastShot = frameCount;
    let muzzle = p5.Vector.fromAngle(this.turretAngle, this.r * 1.6);
    let start = p5.Vector.add(this.pos, muzzle);
    return new Missile(start.x, start.y, plane, {
      vel: muzzle.copy().setMag(3),
      z: this.r * 1.0,
      ...missileOptions,
      owner: 'target',
    });
  }

  // Encaisse des dégâts. Renvoie true si le char est détruit.
  takeDamage(amount) {
    this.health -= amount;
    this.flash = 6;
    return this.health <= 0;
  }

  update() {
    super.update();
    if (this.flash > 0) {
      this.flash -= 1;
    }
  }

  show() {
    let r = this.r;
    let hull = color(92, 104, 62);
    if (this.detected === true) {
      hull = color(168, 48, 40);
    }
    if (this.flash > 0) {
      hull = color(255);
    }

    // Ombre au sol.
    push();
    translate(this.pos.x + 4, this.pos.y + 6, 0.5);
    rotateZ(this.vel.heading());
    noStroke();
    fill(0, 0, 0, 70);
    rect(-r * 1.2, -r * 0.95, r * 2.4, r * 1.9, 3);
    pop();

    // Châssis et chenilles, orientés dans le sens de marche.
    push();
    translate(this.pos.x, this.pos.y, 0);
    rotateZ(this.vel.heading());
    noStroke();
    fill(34, 36, 30);
    push();
    translate(0, -r * 0.68, r * 0.26);
    box(r * 2.3, r * 0.45, r * 0.52);
    pop();
    push();
    translate(0, r * 0.68, r * 0.26);
    box(r * 2.3, r * 0.45, r * 0.52);
    pop();
    fill(hull);
    push();
    translate(0, 0, r * 0.55);
    box(r * 2.05, r * 1.15, r * 0.5);
    pop();
    pop();

    // Tourelle et canon.
    push();
    translate(this.pos.x, this.pos.y, r * 0.98);
    rotateZ(this.turretAngle);
    noStroke();
    fill(red(hull) * 0.8, green(hull) * 0.8, blue(hull) * 0.8);
    box(r * 1.05, r * 0.92, r * 0.42);
    rotateY(-this.barrelPitch);
    fill(30, 32, 26);
    push();
    translate(r * 1.05, 0, 0);
    box(r * 1.3, r * 0.16, r * 0.16);
    pop();
    pop();

    push();
    // Anneau d'alerte au sol quand le char se défend.
    if (this.threat !== null) {
      noFill();
      stroke(255, 210, 60, 180);
      strokeWeight(1.5);
      translate(0, 0, 1);
      circle(this.pos.x, this.pos.y, r * 2 + 22);
    }
    pop();

    // Barre de vie flottante (des boîtes : visibles sous tous les angles).
    if (this.health < this.maxHealth) {
      let barWidth = r * 2;
      let ratio = this.health / this.maxHealth;
      push();
      translate(this.pos.x, this.pos.y, r * 2.4);
      noStroke();
      fill(0, 0, 0, 180);
      box(barWidth, 3, 3);
      fill(240, 200, 60);
      translate(-barWidth * (1 - ratio) / 2, 0, 0.5);
      box(barWidth * ratio, 3.4, 3.4);
      pop();
    }

    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }

  drawDebug() {
    push();
    noFill();
    stroke(255, 210, 60, 130);
    strokeWeight(1);
    translate(0, 0, 1);
    circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    pop();
    super.drawDebug();
  }
}
