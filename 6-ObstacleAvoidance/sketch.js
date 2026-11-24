// sketch.js — 6-ObstacleAvoidance (voir 6-Specification.md)
// Touches : v = véhicule suiveur, w = véhicule wander, f = 10 véhicules
// lancés depuis la gauche, d = debug, c = effacer les obstacles.
// Clic sur le canvas : ajoute un obstacle de taille aléatoire.

let target;
let obstacles = [];
let vehicules = [];
let panel;
let infoSpan;

// Paramètres réglés par les curseurs
const params = {
  maxSpeed: 4,
  maxForce: 0.2,
  distanceAhead: 120,
  poidsAvoid: 0.3,
  poidsArrive: 0.1,
  poidsWander: 0.3,
  poidsSeparate: 0.2,
  eviterVehicules: true,
  predictionFrames: 15,
};

function setup() {
  createCanvas(windowWidth, windowHeight);

  // obstacle au milieu de l'écran, rayon 100px
  obstacles.push(new Obstacle(width / 2, height / 2, 100, 'green'));

  vehicules.push(nouveauVehicule(100, 100, 'suiveur'));
  for (let i = 0; i < 5; i++) {
    vehicules.push(nouveauVehicule(random(width), random(height), 'wander'));
  }

  creerPanneau();
}

function creerPanneau() {
  panel = new ControlPanel('6 — évitement d\'obstacles', { open: true });
  panel.addSlider('Vitesse max', 1, 12, params.maxSpeed, 0.5, (v) => { params.maxSpeed = v; });
  panel.addSlider('Force max', 0.05, 1, params.maxForce, 0.05, (v) => { params.maxForce = v; });
  panel.addSlider('Regard devant (px)', 20, 300, params.distanceAhead, 5, (v) => { params.distanceAhead = v; });
  panel.addSlider('Poids avoid', 0, 3, params.poidsAvoid, 0.05, (v) => { params.poidsAvoid = v; });
  panel.addSlider('Poids arrive', 0, 3, params.poidsArrive, 0.05, (v) => { params.poidsArrive = v; });
  panel.addSlider('Poids wander', 0, 3, params.poidsWander, 0.05, (v) => { params.poidsWander = v; });
  panel.addSlider('Poids séparation', 0, 3, params.poidsSeparate, 0.05, (v) => { params.poidsSeparate = v; });
  panel.addCheckbox('Les véhicules s\'évitent (position future)', params.eviterVehicules,
    (v) => { params.eviterVehicules = v; });
  panel.addSlider('Prédiction (frames)', 0, 40, params.predictionFrames, 1, (v) => { params.predictionFrames = v; });
  panel.addButton('+ véhicule suiveur (v)', () => vehicules.push(nouveauVehicule(random(width), random(height), 'suiveur')));
  panel.addButton('+ véhicule wander (w)', () => vehicules.push(nouveauVehicule(random(width), random(height), 'wander')));
  panel.addButton('+ 10 véhicules (f)', lancerDix);
  panel.addButton('Effacer les obstacles (c)', () => { obstacles = []; });
  panel.addDebugToggle();
  infoSpan = panel.addInfo('Clic : ajouter un obstacle');
}

function nouveauVehicule(x, y, type) {
  let v = new Vehicle(x, y, type);
  appliquerParams(v);
  return v;
}

function appliquerParams(v) {
  v.maxSpeed = params.maxSpeed;
  v.maxForce = params.maxForce;
  v.distanceAhead = params.distanceAhead;
  v.poids.avoid = params.poidsAvoid;
  v.poids.arrive = params.poidsArrive;
  v.poids.wander = params.poidsWander;
  v.poids.separate = params.poidsSeparate;
}

function lancerDix() {
  // 10 véhicules à gauche, au milieu de la hauteur, vitesse aléatoire
  for (let i = 0; i < 10; i++) {
    let v = nouveauVehicule(20, height / 2 + (i - 5) * 20, 'suiveur');
    v.vel = createVector(random(1, 5), random(-2, 2));
    vehicules.push(v);
  }
}

function draw() {
  // dernier paramètre < 255 : effet de traînée
  background(0, 0, 0, 100);

  target = createVector(mouseX, mouseY);
  push();
  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, 32);
  pop();

  // Les autres véhicules comme obstacles (cercle englobant à leur position future)
  let obstaclesVehicules = params.eviterVehicules
    ? vehicules.map((v) => v.commeObstacle(params.predictionFrames))
    : [];

  vehicules.forEach((v) => {
    appliquerParams(v);
    v.applyBehaviors(target, obstacles, vehicules, obstaclesVehicules);
  });

  // obstacles dessinés après le calcul : rouges si un véhicule les menace
  obstacles.forEach((o) => o.show());

  if (Vehicle.debug && params.eviterVehicules) {
    push();
    noFill();
    stroke(255, 200, 0, 90);
    obstaclesVehicules.forEach((o) => circle(o.pos.x, o.pos.y, o.r * 2));
    pop();
  }

  vehicules.forEach((v) => {
    v.update();
    if (v.type === 'wander') {
      v.edges();
    }
    v.show();
    if (Vehicle.debug) {
      // vecteur vitesse en rouge (règle du projet)
      v.drawVector(v.pos, p5.Vector.mult(v.vel, 10), 'red');
    }
  });

  if (infoSpan) {
    infoSpan.textContent = `${vehicules.length} véhicules · ${obstacles.length} obstacles · clic = obstacle`;
  }
}

function mousePressed(event) {
  // pas d'obstacle quand on clique dans le panneau
  if (event && event.target && event.target.tagName !== 'CANVAS') {
    return;
  }
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), 'green'));
}

function keyPressed() {
  if (document.activeElement && document.activeElement.tagName === 'INPUT' &&
      document.activeElement.type === 'text') {
    return;
  }
  if (key === 'v') {
    vehicules.push(nouveauVehicule(random(width), random(height), 'suiveur'));
  } else if (key === 'w') {
    vehicules.push(nouveauVehicule(random(width), random(height), 'wander'));
  } else if (key === 'd') {
    panel.toggleDebug();
  } else if (key === 'f') {
    lancerDix();
  } else if (key === 'c') {
    obstacles = [];
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
