// Snake.js
// Serpent : la tête est ce Vehicle, le corps est une liste de Segment
// (eux aussi des Vehicle). Les sous-classes choisissent la direction en
// redéfinissant decide() : PlayerSnake, EnemySnake, IntroSnake.

class Snake extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, { maxSpeed: 4, maxForce: 0.35, r: 12, ...options });
    this.name = options.name ?? 'Snake';
    this.palette = options.palette ?? ['#ff5fa2', '#ffc2dc'];
    this.baseSpeed = options.baseSpeed ?? 4;
    this.boostSpeed = options.boostSpeed ?? 7.5;
    this.boosting = false;
    this.boostTimer = 0;
    this.alive = true;
    this.growth = 0;
    this.segments = [];
    this.lookTarget = null;
    this.vel.setMag(this.baseSpeed);
    let startLength = options.startLength ?? 10;
    this.r = this.thickness(startLength);
    for (let i = 0; i < startLength; i += 1) {
      this.addSegment();
    }
  }

  get length() {
    return this.segments.length;
  }

  colorFor(index) {
    return this.palette[floor(index / 3) % this.palette.length];
  }

  // Le serpent s'épaissit en grandissant.
  thickness(length = this.segments.length) {
    return 10 + min(sqrt(length) * 1.25, 18);
  }

  spacing() {
    return this.r * 0.55;
  }

  addSegment() {
    let n = this.segments.length;
    let leader = n > 0 ? this.segments[n - 1] : this;
    let before = n > 1 ? this.segments[n - 2] : this;
    let back = leader === this
      ? this.vel.copy().mult(-1)
      : p5.Vector.sub(leader.pos, before.pos);
    if (back.magSq() < 0.0001) {
      back = p5.Vector.random2D();
    }
    back.setMag(this.spacing());
    let p = p5.Vector.add(leader.pos, back);
    this.segments.push(new Segment(p.x, p.y, this, n));
  }

  grow(amount) {
    this.growth += amount;
  }

  // Containment circulaire : revenir vers le centre près du bord.
  stayInArena(radius, margin = 260) {
    let distance = this.pos.mag();
    if (distance < radius - margin) {
      return createVector(0, 0);
    }
    let strength = constrain((distance - (radius - margin)) / margin, 0, 1);
    return this.seek(createVector(0, 0)).mult(1 + strength * 2);
  }

  // Sélection d'action : à redéfinir dans les sous-classes.
  decide() {
    return this.wander();
  }

  applyBehaviors(world) {
    this.applyForce(this.decide(world));

    // Poussée vers l'avant : un serpent ne s'arrête jamais.
    let thrust = this.vel.copy();
    if (thrust.magSq() < 0.0001) {
      thrust = p5.Vector.random2D();
    }
    thrust.setMag(this.maxForce * 0.6);
    this.applyForce(thrust);
  }

  update(world) {
    let canBoost = this.boosting === true && this.segments.length > 8;
    this.maxSpeed = canBoost ? this.boostSpeed : this.baseSpeed;
    super.update();

    if (this.growth > 0) {
      this.addSegment();
      this.growth -= 1;
    }
    this.r = lerp(this.r, this.thickness(), 0.1);

    let leader = this;
    let spacing = this.spacing();
    this.segments.forEach((segment) => {
      segment.r = this.r;
      segment.applyBehaviors(leader, spacing);
      segment.update();
      leader = segment;
    });

    // Le boost coûte de la longueur et sème des perles.
    if (canBoost === true) {
      this.boostTimer += 1;
      if (this.boostTimer % 9 === 0 && world) {
        let tail = this.segments.pop();
        world.dropFood(tail.pos, tail.hex, 1);
      }
    }
  }

  // Rayon dessiné : la queue s'affine sur les derniers anneaux.
  radiusAt(index) {
    let n = this.segments.length;
    let taper = 8;
    if (index > n - taper) {
      return this.r * map(index, n - taper, n, 1, 0.45);
    }
    return this.r;
  }

  isVisible(x, y, view, margin = 60) {
    return x > view.left - margin && x < view.right + margin
      && y > view.top - margin && y < view.bottom + margin;
  }

  show(view) {
    imageMode(CENTER);
    let shadowSprite = SpriteFactory.shadow();
    let n = this.segments.length;

    // Ombres portées, puis anneaux de la queue vers la tête.
    for (let i = n - 1; i >= 0; i -= 1) {
      let segment = this.segments[i];
      if (this.isVisible(segment.pos.x, segment.pos.y, view) === false) {
        continue;
      }
      let rr = this.radiusAt(i);
      let size = SpriteFactory.drawSize(rr * 1.2);
      image(shadowSprite, segment.pos.x + rr * 0.35,
        segment.pos.y + rr * 0.6, size, size);
    }
    for (let i = n - 1; i >= 0; i -= 1) {
      let segment = this.segments[i];
      if (this.isVisible(segment.pos.x, segment.pos.y, view) === false) {
        continue;
      }
      let size = SpriteFactory.drawSize(this.radiusAt(i));
      image(SpriteFactory.sphere(segment.hex), segment.pos.x, segment.pos.y,
        size, size);
    }
    if (this.isVisible(this.pos.x, this.pos.y, view) === true) {
      this.drawHead();
    }
    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }

  drawHead() {
    let r = this.r * 1.18;
    let heading = this.vel.heading();
    let shadowSize = SpriteFactory.drawSize(r * 1.2);
    image(SpriteFactory.shadow(), this.pos.x + r * 0.35,
      this.pos.y + r * 0.6, shadowSize, shadowSize);
    let size = SpriteFactory.drawSize(r);
    image(SpriteFactory.sphere(this.palette[0]), this.pos.x, this.pos.y,
      size, size);

    push();
    translate(this.pos.x, this.pos.y);
    noStroke();

    // Joues roses.
    fill(255, 120, 170, 120);
    [-1, 1].forEach((side) => {
      let cheek = p5.Vector.fromAngle(heading + side * 1.25, r * 0.62);
      ellipse(cheek.x, cheek.y, r * 0.42, r * 0.3);
    });

    // Grands yeux brillants qui regardent la cible.
    let look = this.lookTarget
      ? p5.Vector.sub(this.lookTarget, this.pos).heading()
      : heading;
    [-1, 1].forEach((side) => {
      let eye = p5.Vector.fromAngle(heading + side * 0.62, r * 0.5);
      fill(255);
      circle(eye.x, eye.y, r * 0.7);
      let pupil = p5.Vector.fromAngle(look, r * 0.1);
      fill(40, 10, 60);
      circle(eye.x + pupil.x, eye.y + pupil.y, r * 0.42);
      fill(255);
      circle(eye.x + pupil.x - r * 0.08, eye.y + pupil.y - r * 0.1, r * 0.15);
    });
    pop();
    this.drawAccessory(r, heading);
  }

  // Décoration de la tête (nœud, couronne…) : vide par défaut.
  drawAccessory() {}

  // Petit nom au-dessus de la tête.
  drawName() {
    push();
    textAlign(CENTER, BOTTOM);
    textSize(13);
    noStroke();
    fill(255, 255, 255, 170);
    text(this.name, this.pos.x, this.pos.y - this.r * 1.9);
    pop();
  }
}
