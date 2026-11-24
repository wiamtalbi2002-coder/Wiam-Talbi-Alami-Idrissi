// rainbowGradient.js
// Tâche 2 : dégradé radial arc-en-ciel animé. C'est un Vehicle : son centre
// suit la souris avec le comportement arrive (il ralentit en approchant).
// Les véhicules de la Tâche 1 font seek vers ce centre.

class RainbowGradient extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 12;
    this.maxForce = 0.8;
    this.slowingDistance = 200;

    // Paramètres réglables avec les curseurs.
    this.radius = 400;
    this.bands = 12;
    this.repeats = 1;
    this.hueSpeed = 1.5;
    this.saturation = 90;
    this.lightness = 55;
    this.alpha = 0.9;
    this.pulseAmount = 0.1;
    this.pulseSpeed = 0.03;

    this.hueOffset = 0;
    this.phase = 0;
    this.target = createVector(x, y);
  }

  applyBehaviors(target) {
    this.target = target;
    this.applyForce(this.arrive(target, this.slowingDistance));
  }

  update() {
    super.update();
    this.hueOffset = (this.hueOffset + this.hueSpeed + 360) % 360;
    this.phase += this.pulseSpeed;
  }

  currentRadius() {
    return max(1, this.radius * (1 + this.pulseAmount * sin(this.phase)));
  }

  hslaAt(t) {
    let hue = (this.hueOffset + t * 360 * this.repeats) % 360;
    let alpha = this.alpha * (1 - t * t);
    return `hsla(${hue.toFixed(1)}, ${this.saturation}%, ${this.lightness}%, ${alpha})`;
  }

  show() {
    let r = this.currentRadius();
    let ctx = drawingContext;
    let gradient = ctx.createRadialGradient(
      this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, r,
    );
    for (let i = 0; i <= this.bands; i += 1) {
      let t = i / this.bands;
      gradient.addColorStop(t, this.hslaAt(t));
    }
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (Vehicle.debug === true) {
      // Vecteur vitesse (rouge), zone de freinage et cible.
      this.drawVelocityVector();
      push();
      noFill();
      stroke(255, 160);
      strokeWeight(1);
      circle(this.pos.x, this.pos.y, this.slowingDistance * 2);
      line(this.target.x - 6, this.target.y, this.target.x + 6, this.target.y);
      line(this.target.x, this.target.y - 6, this.target.x, this.target.y + 6);
      pop();
    }
  }
}
