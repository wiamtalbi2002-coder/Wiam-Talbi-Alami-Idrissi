// Soldier.js
// Fantassin au sol. En temps normal il marche en escorte autour de son char
// (arrive vers un point décalé du char) en gardant ses distances
// (separation) et tire de temps en temps au fusil vers l'avion. Quand
// l'avion fond sur lui ou qu'une explosion éclate près de lui, il panique :
// il court en fuyant (evade de l'avion, flee de l'explosion).

class Soldier extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { r: 4, maxSpeed: 0.9, maxForce: 0.15, ...options });
    this.leader = options.leader ?? null;
    this.offset = p5.Vector.random2D().mult(random(26, 46));
    this.walkSpeed = 0.9;
    this.runSpeed = 2.8;
    this.panic = 0;
    this.alive = true;
    this.deathAge = 0;
    this.fallAngle = 0;
    this.step = random(TWO_PI);
    this.facing = this.vel.heading();
    this.fireInterval = floor(random(90, 180));
    this.lastShot = frameCount + floor(random(120));
    this.z = 0;
  }

  // Sélection d'action : fuir (panique) ou escorter le char.
  applyBehaviors(plane, soldiers, blasts, leaderAlive) {
    if (this.alive === false) {
      this.applyForce(p5.Vector.mult(this.vel, -0.2));
      return;
    }

    let blast = null;
    blasts.forEach((b) => {
      if (p5.Vector.dist(this.pos, b.pos) < 220) {
        blast = b;
      }
    });
    let planeDistance = p5.Vector.dist(this.pos, plane.pos);
    if (planeDistance < 240 || blast !== null) {
      this.panic = 90;
    }

    if (this.panic > 0) {
      this.panic -= 1;
      this.maxSpeed = this.runSpeed;
      if (blast !== null) {
        this.applyForce(this.flee(blast.pos).mult(1.5));
      } else {
        this.applyForce(this.evade(plane).mult(1.2));
      }
    } else {
      this.maxSpeed = this.walkSpeed;
      if (leaderAlive === true) {
        let post = p5.Vector.add(this.leader.pos, this.offset);
        this.applyForce(this.arrive(post));
      } else {
        this.applyForce(this.wander());
      }
    }
    this.applyForce(this.separation(soldiers, 12).mult(1.5));
    this.applyForce(this.boundaries(50).mult(2));
  }

  isPanicking() {
    return this.alive === true && this.panic > 0;
  }

  // Tir de fusil vers l'avion (traçante sans dégâts), ou null.
  tryShoot(plane) {
    if (this.alive === false || this.panic > 0) {
      return null;
    }
    let distance = p5.Vector.dist(this.pos, plane.pos);
    if (distance > 380 || frameCount - this.lastShot < this.fireInterval) {
      return null;
    }
    this.lastShot = frameCount;
    let speed = 9;
    let travelTime = distance / speed;
    let direction = p5.Vector.sub(plane.pos, this.pos);
    direction.rotate(random(-0.08, 0.08));
    direction.setMag(speed);
    return new Bullet(this.pos.x, this.pos.y, {
      vel: direction,
      z: 10,
      vz: (plane.z - 10) / travelTime,
      lifetime: travelTime + 10,
      owner: 'soldier',
    });
  }

  die() {
    this.alive = false;
  }

  update() {
    super.update();
    if (this.vel.mag() > 0.1) {
      this.facing = this.vel.heading();
    }
    this.step += this.vel.mag() * 0.35;
    if (this.alive === false) {
      this.deathAge += 1;
      this.fallAngle = min(HALF_PI, this.fallAngle + 0.12);
    }
  }

  isGone() {
    return this.alive === false && this.deathAge > 400;
  }

  show() {
    let fade = 255;
    if (this.alive === false) {
      fade = map(this.deathAge, 250, 400, 255, 0, true);
    }
    let swing = this.alive === true ? sin(this.step) * 1.6 : 0;

    push();
    translate(this.pos.x, this.pos.y, 0);
    rotateZ(this.facing);
    noStroke();

    // Ombre.
    fill(0, 0, 0, 60 * fade / 255);
    push();
    translate(0, 0, 0.4);
    ellipse(0, 0, 9, 6);
    pop();

    // Chute : pivot aux pieds.
    rotateY(this.fallAngle);

    // Jambes.
    fill(60, 66, 44, fade);
    push();
    translate(swing, -1, 2.5);
    box(1.5, 1.4, 5);
    pop();
    push();
    translate(-swing, 1, 2.5);
    box(1.5, 1.4, 5);
    pop();

    // Torse.
    fill(88, 98, 62, fade);
    push();
    translate(0, 0, 7.5);
    box(2.6, 3.6, 5);
    pop();

    // Fusil.
    fill(35, 30, 25, fade);
    push();
    translate(1.6, 1.8, 8);
    box(5.5, 0.6, 0.6);
    pop();

    // Tête et casque.
    fill(214, 170, 130, fade);
    push();
    translate(0, 0, 11.3);
    sphere(1.6, 6, 5);
    pop();
    fill(70, 80, 50, fade);
    push();
    translate(0, 0, 12.2);
    ellipsoid(2, 2, 1.1, 6, 4);
    pop();
    pop();

    if (Vehicle.debug === true && this.alive === true) {
      this.drawDebug();
    }
  }
}
