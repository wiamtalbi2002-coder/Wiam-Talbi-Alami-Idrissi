// Particle.js
// Particule d'explosion ou de traînée en 3D : un petit Vehicle à durée de
// vie limitée, freiné par une force de frottement (drag) dans le plan, avec
// une altitude z (le feu et la fumée montent, les éclats retombent).
// Types : 'fire', 'smoke', 'dust' (poussière), 'spark' (étincelle),
// 'debris' (éclat qui tourne), 'shockwave' (onde de choc au sol).

class Particle extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { r: 2, maxSpeed: 20, maxForce: 1, ...options });
    this.type = options.type ?? 'smoke';
    this.lifetime = options.lifetime ?? 40;
    this.size = options.size ?? 10;
    this.growth = options.growth ?? 0.3;
    this.drag = options.drag ?? 0.06;
    this.spin = options.spin ?? random(-0.3, 0.3);
    this.angle = random(TWO_PI);
    this.z = options.z ?? 0;
    this.vz = options.vz ?? 0;
    this.age = 0;
    if (options.vel === undefined) {
      this.vel.mult(0);
    }
  }

  // Seule force dans le plan : le frottement, opposé à la vitesse.
  applyBehaviors() {
    let friction = p5.Vector.mult(this.vel, -this.drag * this.mass);
    this.applyForce(friction);
  }

  update() {
    super.update();
    this.age += 1;
    this.size += this.growth;
    this.angle += this.spin;

    // Mouvement vertical : poussée d'Archimède ou gravité.
    if (this.type === 'fire') {
      this.vz = this.vz * 0.95 + 0.06;
    } else if (this.type === 'smoke' || this.type === 'dust') {
      this.vz = this.vz * 0.96 + 0.03;
    } else if (this.type === 'spark' || this.type === 'debris') {
      this.vz -= 0.18;
    }
    this.z += this.vz;
    if (this.z < 0) {
      this.z = 0;
      this.vz = 0;
      this.vel.mult(0.6);
    }
  }

  isDead() {
    return this.age > this.lifetime;
  }

  // Dessinée sans lumières (couleurs « émissives » du feu).
  show() {
    let life = 1 - this.age / this.lifetime;
    push();
    translate(this.pos.x, this.pos.y, this.z);
    if (this.type === 'fire') {
      noStroke();
      let g = map(life, 0, 1, 40, 220);
      fill(255, g, 30 * life, 230 * life);
      sphere(this.size / 2, 6, 4);
    } else if (this.type === 'smoke') {
      noStroke();
      fill(62, 60, 56, 150 * life);
      sphere(this.size / 2, 6, 4);
    } else if (this.type === 'dust') {
      noStroke();
      fill(130, 110, 80, 140 * life);
      sphere(this.size / 2, 5, 4);
    } else if (this.type === 'spark') {
      stroke(255, 240, 170, 255 * life);
      strokeWeight(2);
      line(0, 0, 0, -this.vel.x * 2, -this.vel.y * 2, -this.vz * 2);
    } else if (this.type === 'debris') {
      noStroke();
      fill(40, 36, 30, 255 * min(1, life * 2));
      rotateZ(this.angle);
      rotateX(this.angle * 0.7);
      box(this.size, this.size / 2, this.size / 3);
    } else if (this.type === 'shockwave') {
      noFill();
      stroke(255, 230, 190, 200 * life);
      strokeWeight(3 * life + 1);
      translate(0, 0, 1);
      circle(0, 0, this.size);
    }
    pop();
    // Pas de vecteurs de debug : des centaines de particules rendraient
    // l'affichage illisible.
  }
}
