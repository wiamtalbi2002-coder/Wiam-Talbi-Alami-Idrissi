// sketch.js — Tâche 2 : dégradé radial arc-en-ciel qui suit la souris.
// Le centre du dégradé est un Vehicle (Arrival vers la souris).
// Debug : touche D ou case à cocher (synchronisées).

let gradientVehicle;
let panel;

function setup() {
  createCanvas(windowWidth, windowHeight);
  gradientVehicle = new RainbowGradient(width / 2, height / 2);

  panel = new ControlPanel('Tâche 2 — Dégradé arc-en-ciel', {
    homeHref: '../../index.html',
  });
  let g = gradientVehicle;

  // Apparence.
  panel.addSlider('Rayon', 50, 1500, g.radius, 1, (v) => {
    g.radius = v;
  });
  panel.addSlider('Bandes', 2, 48, g.bands, 1, (v) => {
    g.bands = v;
  });
  panel.addSlider('Répétitions', 1, 10, g.repeats, 1, (v) => {
    g.repeats = v;
  });
  panel.addSlider('Saturation %', 0, 100, g.saturation, 1, (v) => {
    g.saturation = v;
  });
  panel.addSlider('Luminosité %', 0, 100, g.lightness, 1, (v) => {
    g.lightness = v;
  });
  panel.addSlider('Opacité', 0, 1, g.alpha, 0.01, (v) => {
    g.alpha = v;
  });

  // Animation.
  panel.addSlider('Défilement teinte', -10, 10, g.hueSpeed, 0.1, (v) => {
    g.hueSpeed = v;
  });
  panel.addSlider('Pulsation', 0, 0.5, g.pulseAmount, 0.01, (v) => {
    g.pulseAmount = v;
  });
  panel.addSlider('Vitesse pulsation', 0, 0.2, g.pulseSpeed, 0.001, (v) => {
    g.pulseSpeed = v;
  });

  // Steering (suivi de la souris).
  panel.addSlider('Vitesse max', 0, 40, g.maxSpeed, 0.1, (v) => {
    g.maxSpeed = v;
  });
  panel.addSlider('Accélération max', 0, 5, g.maxForce, 0.01, (v) => {
    g.maxForce = v;
  });
  panel.addSlider('Freinage (px)', 1, 800, g.slowingDistance, 1, (v) => {
    g.slowingDistance = v;
  });

  panel.addCheckbox('Bandes nettes', g.hardEdges, (on) => {
    g.hardEdges = on;
  });
  panel.addCheckbox('Fondu vers le bord', g.fadeOut, (on) => {
    g.fadeOut = on;
  });
  panel.addDebugToggle();
}

function draw() {
  background(11, 13, 20);

  // Tant que la souris n'est pas entrée dans la fenêtre, on vise le centre.
  if (mouseX !== 0 || mouseY !== 0) {
    gradientVehicle.setTarget(mouseX, mouseY);
  }
  gradientVehicle.applyBehaviors();
  gradientVehicle.update();
  gradientVehicle.show();
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
