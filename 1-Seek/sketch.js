// sketch.js — 1-Seek (voir 1-Specification.md).
// Tâche 1 : plusieurs véhicules qui font seek, curseurs dans un panneau en
//           haut de l'écran, debug avec la touche D ou la case à cocher.
// Tâche 2 : un dégradé radial arc-en-ciel (un Vehicle) suit la souris avec
//           arrive ; les véhicules font seek vers son centre.
// Exercices des transparents (liste « Mode » du panneau) :
//   - creerVehicules(nb), réapparition de l'autre côté (edges),
//   - fuite (flee) : version « force inversée » puis version correcte,
//   - réapparition aléatoire quand le véhicule atteint sa cible,
//   - classe Target (cible mobile) que les véhicules suivent, avec la
//     variante où c'est la cible qui réapparaît.

let vehicles = [];
let rainbow;
let target;
let panel;
let countSlider;
let speedSlider;
let forceSlider;
let panicSlider;
let mode = 'souris';
let edgesOn = true;
let fleeCorrectOn = true;
let targetRespawns = false;
let targets = [];
let respawnCount = 0;
let infoLabel;

const MODES = [
  { value: 'souris', label: 'Tâches 1-2 : souris + arc-en-ciel' },
  { value: 'fuite', label: 'Fuite (flee)' },
  { value: 'reapparition', label: 'Seek + réapparition à la cible' },
  { value: 'target', label: 'Cibles mobiles (classe Target)' },
];

const INFOS = {
  souris: 'Les véhicules font seek vers le dégradé, qui suit la souris avec arrive.',
  fuite: 'Les véhicules fuient la souris dans le rayon de panique. Décoche « version corrigée » pour voir la 1re version (force inversée).',
  reapparition: 'Quand un véhicule atteint la souris, il réapparaît au hasard.',
  target: 'Les véhicules suivent la cible la plus proche. Quand ils l\'atteignent, eux (ou la cible) réapparaissent au hasard.',
};

// la fonction setup est appelée une fois au démarrage du programme par p5.js
function setup() {
  createCanvas(windowWidth, windowHeight);

  // La cible suit la souris dans draw().
  target = createVector(width / 2, height / 2);
  rainbow = new RainbowGradient(width / 2, height / 2);

  // Panneau de réglages (accordéon semi-transparent en haut de l'écran).
  panel = new ControlPanel('1-Seek — tâches et exercices');

  // Tâche 1 : nombre de véhicules, vitesse max, accélération (force) max.
  countSlider = panel.addSlider('Véhicules', 1, 200, 20, 1);
  speedSlider = panel.addSlider('Vitesse max', 0, 20, 4, 0.01);
  forceSlider = panel.addSlider('Accélération max', 0, 10, 0.1, 0.01);
  panel.addDebugToggle();

  // Exercices : choix du mode et options.
  panel.addSelect('Mode', MODES, mode, (value) => {
    mode = value;
    infoLabel.html(INFOS[mode]);
    respawnCount = 0;
  });
  panicSlider = panel.addSlider('Rayon de panique', 20, 600, 200, 1);
  panel.addCheckbox('Bords : réapparaître en face (edges)', edgesOn, (on) => {
    edgesOn = on;
  });
  panel.addCheckbox('Fuite : version corrigée', fleeCorrectOn, (on) => {
    fleeCorrectOn = on;
  });
  panel.addCheckbox('Target : c\'est la cible qui réapparaît', targetRespawns, (on) => {
    targetRespawns = on;
  });
  infoLabel = panel.addInfo(INFOS[mode]);

  // Trois cibles mobiles pour le mode « Target ».
  for (let i = 0; i < 3; i += 1) {
    targets.push(new Target(random(width), random(height)));
  }

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

  syncVehicleCount();
  let maxSpeed = Number(speedSlider.value());
  let maxForce = Number(forceSlider.value());
  vehicles.forEach((vehicle) => {
    vehicle.maxSpeed = maxSpeed;
    vehicle.maxForce = maxForce;
  });

  if (mode === 'souris') {
    drawModeSouris();
  } else if (mode === 'fuite') {
    drawModeFuite();
  } else if (mode === 'reapparition') {
    drawModeReapparition();
  } else {
    drawModeTarget();
  }

  vehicles.forEach((vehicle) => {
    vehicle.update();
    if (edgesOn === true) {
      vehicle.edges();
    }
    vehicle.show();
  });

  if (mode === 'reapparition' || mode === 'target') {
    push();
    fill(255);
    noStroke();
    textSize(16);
    text(`Cibles atteintes : ${respawnCount}`, 16, height - 20);
    pop();
  }
}

// Tâches 1 et 2 : le dégradé suit la souris avec arrive, les véhicules
// font seek vers son centre (le TODO du prof : un tableau de véhicules).
function drawModeSouris() {
  rainbow.applyBehaviors(target);
  rainbow.update();
  rainbow.show();
  vehicles.forEach((vehicle) => {
    vehicle.applyBehaviors(rainbow.pos);
  });
}

// Exercice « flee » : les véhicules fuient la souris.
function drawModeFuite() {
  let panic = Number(panicSlider.value());
  drawMouseTarget('orange');
  push();
  noFill();
  stroke(255, 160, 0, 120);
  circle(target.x, target.y, panic * 2);
  pop();
  vehicles.forEach((vehicle) => {
    let force;
    if (fleeCorrectOn === true) {
      force = vehicle.fleeCorrect(target, panic);
    } else if (vehicle.pos.dist(target) < panic) {
      force = vehicle.flee(target);
    } else {
      force = createVector(0, 0);
    }
    vehicle.applyForce(force);
  });
}

// Exercice : seek vers la souris, réapparition aléatoire à l'arrivée.
function drawModeReapparition() {
  drawMouseTarget('red');
  vehicles.forEach((vehicle) => {
    vehicle.applyForce(vehicle.seek(target));
    if (vehicle.pos.dist(target) < vehicle.r) {
      vehicle.respawn();
      respawnCount += 1;
    }
  });
}

// Exercice Target : des cibles mobiles (sous-classe de Vehicle) qui
// réapparaissent en face ; chaque véhicule suit la plus proche.
function drawModeTarget() {
  targets.forEach((t) => {
    t.applyBehaviors();
    t.update();
    t.edges();
    t.show();
  });
  vehicles.forEach((vehicle) => {
    let closest = cibleLaPlusProche(vehicle);
    vehicle.applyForce(vehicle.seek(closest.pos));
    if (vehicle.pos.dist(closest.pos) < closest.r + vehicle.r / 2) {
      respawnCount += 1;
      if (targetRespawns === true) {
        closest.respawn();
      } else {
        vehicle.respawn();
      }
    }
  });
}

function cibleLaPlusProche(vehicle) {
  let closest = targets[0];
  targets.forEach((t) => {
    if (vehicle.pos.dist(t.pos) < vehicle.pos.dist(closest.pos)) {
      closest = t;
    }
  });
  return closest;
}

// La cible « souris » : un cercle comme dans l'exemple du prof.
function drawMouseTarget(couleur) {
  push();
  fill(couleur);
  noStroke();
  circle(target.x, target.y, 32);
  pop();
}

// Exercice : creerVehicules(nb) ajoute nb véhicules à des positions
// aléatoires dans le tableau vehicles.
function creerVehicules(nb) {
  for (let i = 0; i < nb; i += 1) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }
}

// Ajoute ou retire des véhicules pour suivre le curseur « Véhicules ».
function syncVehicleCount() {
  let wanted = Number(countSlider.value());
  if (vehicles.length < wanted) {
    creerVehicules(wanted - vehicles.length);
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
