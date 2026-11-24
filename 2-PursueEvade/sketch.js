// sketch.js — 2-PursueEvade (voir 2-Specification.md).
// Exercices des transparents, choisis avec la liste « Mode » du panneau :
//   1. Poursuite (pursue) d'un point prédit devant la Target (curseur
//      « Prédiction » de 2 à 30 frames, point dessiné en vert).
//   2. Chat et souris : le poursuiveur (chat) poursuit, la Target (souris)
//      s'évade (evade) dès qu'il entre dans son cercle de détection.
//   3. Balles rebondissantes (BouncingBall) de vitesses différentes : le
//      poursuiveur poursuit la plus proche.
//   4. Plusieurs poursuiveurs : la Target ne fuit que le plus proche,
//      seulement s'il est dans son cercle.
// Les Targets réapparaissent de l'autre côté de l'écran, pas les
// poursuiveurs (conseil du transparent).

let pursuers = [];
let targets = [];
let balls = [];
let panel;
let mode = 'pursue';
let caught = 0;
let infoLabel;

// Réglages (mis à jour par les curseurs).
let params = {
  pursuerSpeed: 8,
  pursuerForce: 0.25,
  prediction: 10,
  proportional: false,
  perfect: false,
  targetSpeed: 6,
  targetForce: 0.3,
  detection: 150,
  nbPursuers: 3,
  nbBalls: 6,
};

const MODES = [
  { value: 'pursue', label: '1. Poursuite (pursue)' },
  { value: 'chat', label: '2. Chat et souris (pursue + evade)' },
  { value: 'balles', label: '3. Balles rebondissantes' },
  { value: 'multi', label: '4. Plusieurs poursuiveurs' },
];

const INFOS = {
  pursue: 'Le poursuiveur vise le point vert, prédit devant la cible. Clic = déplacer le poursuiveur.',
  chat: 'La cible (souris) ne s\'évade que quand le chat entre dans son cercle (rouge = en fuite).',
  balles: 'Le poursuiveur poursuit la balle la plus proche. Balle attrapée = elle réapparaît ailleurs.',
  multi: 'La cible ne fuit que le poursuiveur le plus proche, et seulement s\'il est dans son cercle.',
};

function setup() {
  createCanvas(windowWidth, windowHeight);

  panel = new ControlPanel('2-PursueEvade — poursuite et évasion');
  panel.addSelect('Mode', MODES, mode, (value) => {
    mode = value;
    infoLabel.html(INFOS[mode]);
    resetScene();
  });
  panel.addSlider('Vitesse poursuiveur', 1, 20, params.pursuerSpeed, 0.1, (v) => {
    params.pursuerSpeed = v;
  });
  panel.addSlider('Force poursuiveur', 0.01, 1, params.pursuerForce, 0.01, (v) => {
    params.pursuerForce = v;
  });
  panel.addSlider('Prédiction (frames)', 2, 30, params.prediction, 1, (v) => {
    params.prediction = v;
  });
  panel.addSlider('Vitesse cible', 1, 15, params.targetSpeed, 0.1, (v) => {
    params.targetSpeed = v;
  });
  panel.addSlider('Force cible', 0.01, 1, params.targetForce, 0.01, (v) => {
    params.targetForce = v;
  });
  panel.addSlider('Rayon de détection', 20, 400, params.detection, 1, (v) => {
    params.detection = v;
  });
  panel.addSlider('Poursuiveurs (mode 4)', 1, 6, params.nbPursuers, 1, (v) => {
    params.nbPursuers = v;
    resetScene();
  });
  panel.addSlider('Balles (mode 3)', 1, 15, params.nbBalls, 1, (v) => {
    params.nbBalls = v;
    resetScene();
  });
  panel.addCheckbox('Prédiction ∝ distance (amélioration)', params.proportional, (on) => {
    params.proportional = on;
  });
  panel.addCheckbox('Poursuite parfaite (loi des sinus)', params.perfect, (on) => {
    params.perfect = on;
  });
  panel.addDebugToggle();
  infoLabel = panel.addInfo(INFOS[mode]);

  resetScene();
}

// Recrée les acteurs du mode courant.
function resetScene() {
  caught = 0;
  pursuers = [];
  targets = [];
  balls = [];
  let nb = mode === 'multi' ? params.nbPursuers : 1;
  for (let i = 0; i < nb; i += 1) {
    pursuers.push(new Vehicle(random(width), random(height)));
  }
  if (mode === 'balles') {
    for (let i = 0; i < params.nbBalls; i += 1) {
      balls.push(new BouncingBall(random(50, width - 50), random(150, height - 50)));
    }
  } else {
    targets.push(new Target(random(width), random(height)));
  }
}

function draw() {
  background(0);

  // Cibles (Target ou balles).
  let preys = mode === 'balles' ? balls : targets;
  preys.forEach((prey) => {
    if (!(prey instanceof BouncingBall)) {
      prey.maxSpeed = params.targetSpeed;
      prey.maxForce = params.targetForce;
    }
    prey.rayonDetection = params.detection;
    if (mode === 'chat' || mode === 'multi') {
      prey.applyBehaviors(pursuers, params.prediction, params.proportional);
    } else if (!(prey instanceof BouncingBall)) {
      prey.applyBehaviors([], params.prediction);
    }
    prey.update();
    prey.edges();
    if (mode === 'pursue' || mode === 'balles') {
      prey.enFuite = false;
    }
    prey.show();
  });

  // Poursuiveurs : chacun poursuit la proie la plus proche.
  pursuers.forEach((pursuer) => {
    pursuer.maxSpeed = params.pursuerSpeed;
    pursuer.maxForce = params.pursuerForce;
    let prey = cibleLaPlusProche(pursuer, preys);
    let force = params.perfect === true
      ? pursuer.pursuePerfect(prey)
      : pursuer.pursue(prey, params.prediction, params.proportional);
    pursuer.applyForce(force);
    pursuer.update();
    pursuer.show();

    // Proie attrapée : elle réapparaît ailleurs.
    if (pursuer.pos.dist(prey.pos) < prey.r + pursuer.r / 2) {
      caught += 1;
      prey.respawn();
    }
  });

  push();
  fill(255);
  noStroke();
  textSize(16);
  text(`Attrapées : ${caught}`, 16, height - 20);
  pop();
}

function cibleLaPlusProche(vehicle, list) {
  let cibleProche = null;
  let distanceMin = Infinity;
  list.forEach((target) => {
    let d = p5.Vector.dist(vehicle.pos, target.pos);
    if (d < distanceMin) {
      distanceMin = d;
      cibleProche = target;
    }
  });
  return cibleProche;
}

// detection click souris : on déplace le premier poursuiveur
function mouseClicked(event) {
  if (event && event.target && event.target.tagName !== 'CANVAS') {
    return;
  }
  pursuers[0].pos = createVector(mouseX, mouseY);
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
