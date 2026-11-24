// RainbowGradient.js
// Dégradé radial arc-en-ciel animé. C'est un Vehicle : son centre suit la
// souris avec le comportement Arrival (il ralentit en approchant).

class RainbowGradient extends Vehicle {
  constructor(x, y, options = {}) {
    super(x, y, {
      maxSpeed: 12,
      maxForce: 0.8,
      slowingDistance: 200,
      vel: createVector(0, 0),
      ...options,
    });

    // Paramètres visuels (pilotés par les curseurs).
    this.radius = 450;
    this.bands = 12;
    this.repeats = 1;
    this.hueSpeed = 1.5;
    this.saturation = 90;
    this.lightness = 55;
    this.alpha = 1;
    this.pulseAmount = 0.1;
    this.pulseSpeed = 0.03;
    this.hardEdges = false;
    this.fadeOut = true;

    // État de l'animation.
    this.hueOffset = 0;
    this.phase = 0;
    this.target = createVector(x, y);
  }

  setTarget(x, y) {
    this.target.set(x, y);
  }

  applyBehaviors() {
    this.applyForce(this.arrive(this.target));
  }

  update() {
    super.update();
    this.hueOffset = (this.hueOffset + this.hueSpeed + 360) % 360;
    this.phase += this.pulseSpeed;
  }

  currentRadius() {
    let pulse = 1 + this.pulseAmount * sin(this.phase);
    return max(1, this.radius * pulse);
  }

  // Couleur CSS hsla() pour une position t ∈ [0, 1] le long du rayon.
  hueAt(t) {
    return (this.hueOffset + t * 360 * this.repeats) % 360;
  }

  cssColor(hue, alpha) {
    return `hsla(${hue.toFixed(1)}, ${this.saturation}%, ${this.lightness}%, ${alpha})`;
  }

  show() {
    let ctx = drawingContext;
    let r = this.currentRadius();
    let gradient = ctx.createRadialGradient(
      this.pos.x, this.pos.y, 0,
      this.pos.x, this.pos.y, r,
    );

    for (let i = 0; i < this.bands; i += 1) {
      let start = i / this.bands;
      let end = (i + 1) / this.bands;
      let alpha = this.alpha;
      if (this.fadeOut === true) {
        // Fondu quadratique : couleurs vives au centre, transparent au bord.
        alpha = this.alpha * (1 - start * start);
      }
      let colorText = this.cssColor(this.hueAt(start), alpha);
      gradient.addColorStop(start, colorText);

      // Bandes nettes : on répète la couleur juste avant la frontière.
      if (this.hardEdges === true) {
        gradient.addColorStop(max(start, end - 0.0001), colorText);
      }
    }
    let lastAlpha = this.fadeOut === true ? 0 : this.alpha;
    let lastHue = this.hardEdges === true
      ? this.hueAt((this.bands - 1) / this.bands)
      : this.hueAt(1);
    gradient.addColorStop(1, this.cssColor(lastHue, lastAlpha));

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (Vehicle.debug === true) {
      this.drawDebug();
    }
  }

  drawDebug() {
    super.drawDebug();
    push();
    noFill();
    stroke(255, 160);
    strokeWeight(1);
    drawingContext.setLineDash([4, 6]);
    circle(this.pos.x, this.pos.y, this.slowingDistance * 2);
    drawingContext.setLineDash([]);
    stroke(255);
    line(this.target.x - 6, this.target.y, this.target.x + 6, this.target.y);
    line(this.target.x, this.target.y - 6, this.target.x, this.target.y + 6);
    circle(this.pos.x, this.pos.y, this.currentRadius() * 2);
    pop();
  }
}
