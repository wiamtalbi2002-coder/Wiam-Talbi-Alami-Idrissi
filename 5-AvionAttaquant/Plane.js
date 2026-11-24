// Plane.js
// Avion d'attaque piloté « comme un humain » :
// - patrouille (wander) en altitude tant qu'aucune cible n'est détectée ;
// - attaque : poursuit (pursue) la cible verrouillée en piquant vers le sol,
//   mitraille en tir anticipé et lance un missile une fois le verrouillage
//   acquis (temps de réaction) ;
// - dégagement : arrivé trop près, il remonte et s'écarte (seek vers un
//   point de dégagement), puis revient pour une nouvelle passe.
// Virages larges (force limitée), inclinaison dans les virages. Il reste
// « pas intelligent » : il n'esquive pas les missiles. Il est invincible.

class Plane extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { r: 14, maxSpeed: 5, maxForce: 0.2, ...options });
    this.detectionRadius = options.detectionRadius ?? 600;

    // Missiles.
    this.fireInterval = options.fireInterval ?? 90;
    this.missileRange = options.missileRange ?? 500;
    this.missileCone = options.missileCone ?? 0.7; // radians
    this.lockDelay = options.lockDelay ?? 25; // frames de verrouillage
    this.lastShot = -Infinity;

    // Mitrailleuse.
    this.gunInterval = options.gunInterval ?? 5;
    this.gunRange = options.gunRange ?? 320;
    this.gunCone = options.gunCone ?? 0.3; // radians
    this.bulletSpeed = options.bulletSpeed ?? 14;
    this.gunSpread = options.gunSpread ?? 0.045; // main humaine
    this.lastGunShot = -Infinity;

    // Pilotage humain : passes d'attaque.
    this.state = 'patrol'; // 'patrol' | 'attack' | 'breakaway'
    this.breakDistance = options.breakDistance ?? 110;
    this.breakPoint = null;
    this.breakTimer = 0;
    this.lockTime = 0;

    // Altitude (axe z), pilotée par une force verticale bornée.
    this.z = 150;
    this.vz = 0;
    this.pitch = 0;
    this.bank = 0;
    this.lastHeading = this.vel.heading();

    this.lockedTarget = null;
    this.justLocked = false;
    this.flash = 0;
    // Vrai pendant la frame où une nouvelle cible entre dans le rayon.
    this.newDetection = false;
    // Une autre cible doit être 30 % plus proche pour changer de verrou.
    this.switchRatio = options.switchRatio ?? 0.7;
  }

  // Une cible est détectée dès que son bord entre dans le rayon.
  canSee(target) {
    return p5.Vector.dist(this.pos, target.pos)
      < this.detectionRadius + target.r;
  }

  // Cible à attaquer : la plus proche des cibles détectées, mais on garde
  // la cible verrouillée tant qu'elle reste visible et qu'aucune autre
  // n'est nettement plus proche (évite de changer de cible à chaque frame).
  findTarget(targets) {
    let closest = null;
    let closestDistance = Infinity;
    targets.forEach((target) => {
      if (target.detected !== true) {
        return;
      }
      let distance = p5.Vector.dist(this.pos, target.pos);
      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    });

    let locked = this.lockedTarget;
    if (locked !== null && targets.includes(locked)
      && locked.detected === true && closest !== locked) {
      let lockedDistance = p5.Vector.dist(this.pos, locked.pos);
      if (closestDistance > lockedDistance * this.switchRatio) {
        return locked;
      }
    }
    return closest;
  }

  // Sélection d'action : patrouille, attaque ou dégagement.
  // Toutes les cibles dans le rayon de détection sont marquées (rouges).
  applyBehaviors(targets) {
    this.newDetection = false;
    targets.forEach((target) => {
      let visible = this.canSee(target);
      if (visible === true && target.detected !== true) {
        this.newDetection = true;
      }
      target.detected = visible;
    });

    let previous = this.lockedTarget;
    this.lockedTarget = this.findTarget(targets);
    this.justLocked = this.lockedTarget !== null
      && this.lockedTarget !== previous;
    if (this.lockedTarget !== null && this.lockedTarget === previous) {
      this.lockTime += 1;
    } else {
      this.lockTime = 0;
    }

    if (this.state === 'breakaway') {
      this.breakTimer -= 1;
      if (this.breakTimer <= 0) {
        this.state = 'patrol';
      }
    }
    if (this.state !== 'breakaway') {
      this.state = this.lockedTarget !== null ? 'attack' : 'patrol';
    }
    if (this.state === 'attack'
      && p5.Vector.dist(this.pos, this.lockedTarget.pos)
        < this.breakDistance) {
      this.startBreakaway();
    }

    if (this.state === 'attack') {
      this.applyForce(this.pursue(this.lockedTarget));
    } else if (this.state === 'breakaway') {
      this.applyForce(this.seek(this.breakPoint));
    } else {
      this.applyForce(this.wander());
    }
    this.applyForce(this.boundaries(80).mult(2));
  }

  // Dégagement : remonter et s'écarter sur le côté, puis revenir.
  startBreakaway() {
    this.state = 'breakaway';
    this.breakTimer = 75;
    let side = random() < 0.5 ? -1 : 1;
    let away = p5.Vector.fromAngle(this.vel.heading() + side * 0.6, 320);
    this.breakPoint = p5.Vector.add(this.pos, away);
    this.breakPoint.x = constrain(this.breakPoint.x, 100, width - 100);
    this.breakPoint.y = constrain(this.breakPoint.y, 100, height - 100);
  }

  // Altitude voulue : croisière, piqué d'attaque, remontée de dégagement.
  desiredAltitude() {
    if (this.state === 'breakaway') {
      return 230;
    }
    if (this.state === 'attack') {
      let distance = p5.Vector.dist(this.pos, this.lockedTarget.pos);
      return map(distance, 120, 500, 55, 150, true);
    }
    return 160;
  }

  // Vrai si au moins une cible est détectée.
  isDetecting() {
    return this.lockedTarget !== null;
  }

  // Angle (radians, 0 à PI) entre le nez de l'avion et la cible.
  aimError(target) {
    let toTarget = p5.Vector.sub(target.pos, this.pos);
    let diff = toTarget.heading() - this.vel.heading();
    return abs(atan2(sin(diff), cos(diff)));
  }

  nosePosition() {
    let nose = p5.Vector.fromAngle(this.vel.heading(), this.r * 1.5);
    return nose.add(this.pos);
  }

  // Renvoie un nouveau Missile si l'avion peut tirer, sinon null.
  // Il faut être en attaque, verrouillé depuis lockDelay frames, à portée
  // et dans l'axe.
  tryFire(missileOptions = {}) {
    let target = this.lockedTarget;
    if (target === null || this.state !== 'attack'
      || this.lockTime < this.lockDelay) {
      return null;
    }
    if (frameCount - this.lastShot < this.fireInterval) {
      return null;
    }
    if (p5.Vector.dist(this.pos, target.pos) > this.missileRange
      || this.aimError(target) > this.missileCone) {
      return null;
    }
    this.lastShot = frameCount;
    let nose = this.nosePosition();
    return new Missile(nose.x, nose.y, target, {
      vel: this.vel.copy(),
      z: this.z - 4,
      ...missileOptions,
      owner: 'plane',
    });
  }

  // Renvoie une Bullet si la mitrailleuse peut tirer, sinon null.
  // Tir anticipé : on vise là où la cible sera quand la balle arrivera.
  tryGun() {
    let target = this.lockedTarget;
    if (target === null || this.state !== 'attack') {
      return null;
    }
    if (frameCount - this.lastGunShot < this.gunInterval) {
      return null;
    }
    let distance = p5.Vector.dist(this.pos, target.pos);
    if (distance > this.gunRange || this.aimError(target) > this.gunCone) {
      return null;
    }
    this.lastGunShot = frameCount;
    let nose = this.nosePosition();
    let travelTime = distance / this.bulletSpeed;
    let aimPoint = p5.Vector.mult(target.vel, travelTime).add(target.pos);
    let direction = p5.Vector.sub(aimPoint, nose);
    direction.rotate(random(-this.gunSpread, this.gunSpread));
    direction.setMag(this.bulletSpeed);
    return new Bullet(nose.x, nose.y, {
      vel: direction,
      z: this.z,
      vz: (8 - this.z) / max(travelTime, 1),
      lifetime: travelTime * 1.6 + 10,
    });
  }

  // Touché par un missile de char : il clignote, sans jamais mourir.
  takeHit() {
    this.flash = 30;
  }

  update() {
    super.update();

    // Altitude : force verticale bornée vers l'altitude voulue.
    let desiredVz = constrain((this.desiredAltitude() - this.z) * 0.04,
      -2.2, 2.2);
    this.vz += constrain(desiredVz - this.vz, -0.08, 0.08);
    this.z += this.vz;
    this.pitch = atan2(this.vz, max(this.vel.mag(), 0.1));

    // Inclinaison proportionnelle à la vitesse de virage.
    let heading = this.vel.heading();
    let turn = atan2(sin(heading - this.lastHeading),
      cos(heading - this.lastHeading));
    this.bank = lerp(this.bank, constrain(turn * 14, -1, 1), 0.12);
    this.lastHeading = heading;

    if (this.flash > 0) {
      this.flash -= 1;
    }
  }

  show() {
    let r = this.r;
    this.drawDetection();

    // Ombre portée au sol, décalée par le soleil selon l'altitude.
    push();
    translate(this.pos.x + this.z * 0.25, this.pos.y + this.z * 0.35, 0.6);
    rotateZ(this.vel.heading());
    noStroke();
    fill(0, 0, 0, 80);
    this.drawShadowShape(r);
    pop();

    push();
    translate(this.pos.x, this.pos.y, this.z);
    rotateZ(this.vel.heading());
    rotateY(-this.pitch);
    rotateX(this.bank);
    noStroke();

    let skin = color(140, 152, 128);
    if (this.flash > 0 && frameCount % 6 < 3) {
      skin = color(255, 90, 90);
    }
    fill(skin);
    // Fuselage.
    ellipsoid(r * 1.6, r * 0.3, r * 0.3, 12, 8);
    // Ailes.
    push();
    translate(-r * 0.1, 0, 0);
    box(r * 0.75, r * 2.7, r * 0.08);
    pop();
    // Empennage horizontal et dérive.
    push();
    translate(-r * 1.25, 0, 0);
    box(r * 0.35, r * 1.1, r * 0.06);
    pop();
    push();
    translate(-r * 1.25, 0, r * 0.35);
    box(r * 0.45, r * 0.06, r * 0.65);
    pop();
    // Missiles sous les ailes.
    fill(230);
    push();
    translate(0, -r * 0.8, -r * 0.12);
    box(r * 0.9, r * 0.12, r * 0.12);
    translate(0, r * 1.6, 0);
    box(r * 0.9, r * 0.12, r * 0.12);
    pop();
    // Cockpit.
    fill(60, 120, 170);
    specularMaterial(200);
    push();
    translate(r * 0.6, 0, r * 0.2);
    ellipsoid(r * 0.45, r * 0.17, r * 0.14, 8, 6);
    pop();
    // Flamme du réacteur.
    fill(255, 160, 50);
    emissiveMaterial(255, 140, 30);
    push();
    translate(-r * 1.65, 0, 0);
    sphere(r * random(0.18, 0.28), 6, 4);
    pop();
    pop();

    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }

  // Silhouette plate pour l'ombre (repère local, nez vers +x).
  drawShadowShape(r) {
    beginShape();
    vertex(r * 1.5, 0);
    vertex(r * 0.4, -r * 0.2);
    vertex(-r * 0.1, -r * 1.3);
    vertex(-r * 0.5, -r * 1.3);
    vertex(-r * 0.3, -r * 0.2);
    vertex(-r, -r * 0.5);
    vertex(-r * 1.4, -r * 0.5);
    vertex(-r * 1.4, r * 0.5);
    vertex(-r, r * 0.5);
    vertex(-r * 0.3, r * 0.2);
    vertex(-r * 0.5, r * 1.3);
    vertex(-r * 0.1, r * 1.3);
    vertex(r * 0.4, r * 0.2);
    endShape(CLOSE);
  }

  // Visible hors debug : quand une cible est détectée, le rayon de
  // détection pulse en rouge au sol, une ligne relie l'avion à la cible
  // verrouillée et un viseur tourne autour d'elle.
  drawDetection() {
    let target = this.lockedTarget;
    if (target === null) {
      return;
    }
    push();
    let pulse = 0.5 + 0.5 * sin(frameCount * 0.15);
    noFill();
    stroke(255, 70, 70, 40 + 60 * pulse);
    strokeWeight(2);
    translate(0, 0, 1.5);
    circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    pop();

    push();
    stroke(255, 80, 80, 150);
    strokeWeight(1);
    line(this.pos.x, this.pos.y, this.z, target.pos.x, target.pos.y, 10);
    translate(target.pos.x, target.pos.y, 2);
    rotateZ(frameCount * 0.05);
    noFill();
    // Le viseur devient vert quand le verrouillage missile est acquis.
    if (this.lockTime >= this.lockDelay) {
      stroke(120, 255, 120, 220);
    } else {
      stroke(255, 80, 80, 200);
    }
    strokeWeight(2);
    let size = target.r + 10;
    circle(0, 0, size * 2);
    for (let i = 0; i < 4; i += 1) {
      line(size - 5, 0, size + 7, 0);
      rotateZ(HALF_PI);
    }
    pop();
  }

  drawDebug() {
    push();
    noFill();
    strokeWeight(1);
    translate(0, 0, 1);
    stroke(255, 255, 255, 90);
    circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    // Portées des armes.
    stroke(255, 225, 120, 70);
    circle(this.pos.x, this.pos.y, this.missileRange * 2);
    circle(this.pos.x, this.pos.y, this.gunRange * 2);
    if (this.state === 'breakaway' && this.breakPoint !== null) {
      stroke(120, 200, 255, 160);
      circle(this.breakPoint.x, this.breakPoint.y, 20);
    }
    pop();
    push();
    translate(0, 0, this.z);
    super.drawDebug();
    pop();
  }
}
