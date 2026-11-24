// sketch.js — 1-Seek, Tâches 1 et 2 (voir 1-Specification.md).
// Tâche 1 : plusieurs véhicules qui font seek, curseurs dans un panneau en
//           haut de l'écran, debug avec la touche D ou la case à cocher.
// Tâche 2 : un dégradé radial arc-en-ciel (un Vehicle) suit la souris avec
//           arrive ; les véhicules font seek vers son centre.

let vehicles = [];
let rainbow;
let target;
let panel;
let countSlider;
let speedSlider;
let forceSlider;

// la fonction setup est appelée une fois au démarrage du programme par p5.js
function setup() {
  createCanvas(windowWidth, windowHeight);

  // La cible suit la souris dans draw().
  target = createVector(width / 2, height / 2);
  rainbow = new RainbowGradient(width / 2, height / 2);

  // Panneau de réglages (accordéon semi-transparent en haut de l'écran).
  panel = new ControlPanel('1-Seek — Tâches 1 et 2');

  // Tâche 1 : nombre de véhicules, vitesse max, accélération (force) max.
  countSlider = panel.addSlider('Véhicules', 1, 200, 20, 1);
  speedSlider = panel.addSlider('Vitesse max', 0, 20, 4, 0.01);
  forceSlider = panel.addSlider('Accélération max', 0, 10, 0.1, 0.01);
  panel.addDebugToggle();

  // Tâche 2 : réglages du dégradé arc-en-ciel.
  panel.addSlider('Rayon dégradé', 50, 1500, rainbow.radius, 1, (v) => {
    rainbow.radius = v;
  });
  panel.addSlider('Bandes', 2, 48, rainbow.bands, 1, (v) => {
    rainbow.bands = v;
  });
  panel.addSlider('Répétitions', 1, 10, rainbow.repeats, 1, (v) => {
    rainbow.repeats = v;
  });
  panel.addSlider('Défilement teinte', -10, 10, rainbow.hueSpeed, 0.1, (v) => {
    rainbow.hueSpeed = v;
  });
  panel.addSlider('Saturation %', 0, 100, rainbow.saturation, 1, (v) => {
    rainbow.saturation = v;
  });
  panel.addSlider('Luminosité %', 0, 100, rainbow.lightness, 1, (v) => {
    rainbow.lightness = v;
  });
  panel.addSlider('Opacité', 0, 1, rainbow.alpha, 0.01, (v) => {
    rainbow.alpha = v;
  });
  panel.addSlider('Pulsation', 0, 0.5, rainbow.pulseAmount, 0.01, (v) => {
    rainbow.pulseAmount = v;
  });
  panel.addSlider('Vitesse dégradé', 0, 40, rainbow.maxSpeed, 0.1, (v) => {
    rainbow.maxSpeed = v;
  });
  panel.addSlider('Freinage (px)', 1, 800, rainbow.slowingDistance, 1, (v) => {
    rainbow.slowingDistance = v;
  });

  syncVehicleCount();
}

// la fonction draw est appelée en boucle par p5.js, 60 fois par seconde
function draw() {
  background('black');

  // La cible suit la souris (tant qu'elle n'est pas entrée : le centre).
  if (mouseX !== 0 || mouseY !== 0) {
    target.x = mouseX;
    target.y = mouseY;
  }

  // Tâche 2 : le dégradé suit la souris avec arrive.
  rainbow.applyBehaviors(target);
  rainbow.update();
  rainbow.show();

  // Tâche 1 : le tableau de véhicules (le TODO du prof).
  syncVehicleCount();
  let maxSpeed = Number(speedSlider.value());
  let maxForce = Number(forceSlider.value());
  vehicles.forEach((vehicle) => {
    vehicle.maxSpeed = maxSpeed;
    vehicle.maxForce = maxForce;
    vehicle.applyBehaviors(rainbow.pos);
    vehicle.update();
    vehicle.show();
  });
}

// Ajoute ou retire des véhicules pour suivre le curseur « Véhicules ».
function syncVehicleCount() {
  let wanted = Number(countSlider.value());
  while (vehicles.length < wanted) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }
  if (vehicles.length > wanted) {
    vehicles.splice(wanted);
  }
}

// Touche D : debug on/off, synchronisé avec la case à cocher.
function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
