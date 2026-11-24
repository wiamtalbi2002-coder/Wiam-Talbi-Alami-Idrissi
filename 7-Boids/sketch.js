// Flocking
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/124-flocking-boids.html
// https://youtu.be/mhjuuHl6qHM
//
// 7-Boids — exercices (voir 7-Specification.md) :
//  - changer la forme des boids (image de poisson, triangle, point) ;
//  - ajouter une traînée derrière les boids ;
//  - une cible (cercle) qui suit la souris et repousse les boids proches ;
//  - touche 'o' : obstacle à la position de la souris, les boids l'évitent ;
//  - curseurs dans un panneau accordéon (au lieu des sliders superposés).
// Souris : glisser = ajouter des boids ; touche d = debug ; r = tailles.

const flock = [];
let fishImage;
let requinImage;
let eatSound, aie, ouuu;

let obstacles = [];
let cible; // la cible qui suit la souris (c'est un Boid, règle du projet)
let requin;
let panel;
let infoSpan;

const params = {
  alignWeight: 1.5,
  cohesionWeight: 1,
  separationWeight: 3,
  boundariesWeight: 10,
  perceptionRadius: 25,
  maxSpeed: 5,
  forme: 'image',
  pathLength: 0,
  rayonCible: 50,
  cibleActive: true,
  requinActif: true,
  sons: true,
};

function preload() {
  // Correction : le nom du fichier est niceFishTransparent.png (T majuscule).
  // Sur GitHub Pages les noms de fichiers sont sensibles à la casse.
  fishImage = loadImage('assets/niceFishTransparent.png');
  requinImage = loadImage('assets/SharkTransparent.png');

  soundFormats('mp3', 'ogg');
  eatSound = loadSound('assets/eating.wav');
  aie = loadSound('assets/aie.wav');
  ouuu = loadSound('assets/ouuuu.ogg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  creerBoids(200);

  // la cible : un Boid qui suit la souris avec seek
  cible = new Boid(width / 2, height / 2);
  cible.maxSpeed = 25;
  cible.maxForce = 4;
  cible.r = params.rayonCible;

  // requin prédateur
  requin = new Boid(width / 2, height / 2, requinImage);
  requin.r = 40;
  requin.maxSpeed = 7;
  requin.maxForce = 0.5;

  creerPanneau();
}

function creerBoids(n) {
  for (let i = 0; i < n; i++) {
    ajouterBoid(random(width), random(height));
  }
}

function ajouterBoid(x, y) {
  const b = new Boid(x, y, fishImage);
  b.r = random(8, 40);
  appliquerParams(b);
  flock.push(b);
}

function appliquerParams(b) {
  b.alignWeight = params.alignWeight;
  b.cohesionWeight = params.cohesionWeight;
  b.separationWeight = params.separationWeight;
  b.boundariesWeight = params.boundariesWeight;
  b.perceptionRadius = params.perceptionRadius;
  b.maxSpeed = params.maxSpeed;
  b.forme = params.forme;
  b.pathLength = params.pathLength;
}

function creerPanneau() {
  panel = new ControlPanel('7 — Boids (flocking)', { open: true });
  panel.addSlider('Poids alignment', 0, 2, params.alignWeight, 0.1, (v) => { params.alignWeight = v; });
  panel.addSlider('Poids cohesion', 0, 2, params.cohesionWeight, 0.1, (v) => { params.cohesionWeight = v; });
  panel.addSlider('Poids séparation', 0, 15, params.separationWeight, 0.1, (v) => { params.separationWeight = v; });
  panel.addSlider('Poids boundaries', 0, 15, params.boundariesWeight, 1, (v) => { params.boundariesWeight = v; });
  panel.addSlider('Perception radius', 15, 60, params.perceptionRadius, 1, (v) => { params.perceptionRadius = v; });
  panel.addSlider('Vitesse max', 1, 10, params.maxSpeed, 0.5, (v) => { params.maxSpeed = v; });
  panel.addSlider('Nombre de boids', 0, 400, flock.length, 1, (v) => {
    while (flock.length < v) ajouterBoid(random(width), random(height));
    while (flock.length > v) flock.pop();
  });
  panel.addSelect('Forme', [
    { value: 'image', label: 'Poisson (image)' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'point', label: 'Point' },
  ], params.forme, (v) => { params.forme = v; });
  panel.addSlider('Traînée', 0, 60, params.pathLength, 1, (v) => { params.pathLength = v; });
  panel.addSlider('Rayon de la cible', 10, 150, params.rayonCible, 1, (v) => { params.rayonCible = v; });
  panel.addCheckbox('Cible souris qui repousse', params.cibleActive, (v) => { params.cibleActive = v; });
  panel.addCheckbox('Requin', params.requinActif, (v) => { params.requinActif = v; });
  panel.addCheckbox('Sons', params.sons, (v) => { params.sons = v; });
  panel.addButton('Tailles aléatoires (r)', taillesAleatoires);
  panel.addButton('Effacer les obstacles', () => { obstacles = []; });
  panel.addDebugToggle();
  infoSpan = panel.addInfo('');
}

function taillesAleatoires() {
  flock.forEach((b) => { b.r = random(8, 40); });
}

function draw() {
  background(0);

  // la cible suit la souris par steering (seek)
  cible.r = params.rayonCible;
  cible.applyForce(cible.seek(createVector(mouseX, mouseY)));
  cible.update();
  if (params.cibleActive) {
    push();
    fill(144, 238, 144, 120);
    stroke('lightgreen');
    circle(cible.pos.x, cible.pos.y, cible.r * 2);
    if (Boid.debug) {
      // zone de répulsion (rayon + décalage)
      noFill();
      stroke('red');
      circle(cible.pos.x, cible.pos.y, (cible.r + 20) * 2);
    }
    pop();
  }

  obstacles.forEach((o) => o.show());

  for (let boid of flock) {
    appliquerParams(boid);
    // cohesion + separation + alignement + confinement + évitement
    boid.flock(flock, obstacles);

    if (params.requinActif) {
      boid.fleeWithTargetRadius(requin);
    }
    if (params.cibleActive) {
      boid.applyForce(boid.repousseParCible(cible, 20));
    }

    boid.update();
    boid.show();
  }

  if (params.requinActif) {
    deplacerRequin();
  }

  infoSpan.textContent = `${flock.length} boids · ${obstacles.length} obstacles · ` +
    `glisser = boids, o = obstacle`;
}

function deplacerRequin() {
  requin.applyForce(requin.wander());

  let rayonDeDetection = 70;
  push();
  noFill();
  stroke('yellow');
  circle(requin.pos.x, requin.pos.y, rayonDeDetection * 2);
  pop();

  let closest = requin.getVehiculeLePlusProche(flock);
  if (closest) {
    let d = p5.Vector.dist(requin.pos, closest.pos);
    if (d < rayonDeDetection) {
      if (params.sons && !ouuu.isPlaying()) {
        ouuu.play();
      }
      let seekForce = requin.seek(closest.pos);
      seekForce.mult(7);
      requin.applyForce(seekForce);
    }
    if (d < 5) {
      // le requin mange le poisson et grossit
      flock.splice(flock.indexOf(closest), 1);
      requin.r += 1;
      if (params.sons) {
        eatSound.play();
        aie.play();
      }
    }
  }
  requin.edges();
  requin.update();
  requin.show();
}

// Vrai seulement si l'événement vient du canvas (pas du panneau)
function surCanvas(event) {
  return !(event && event.target && event.target.tagName !== 'CANVAS');
}

function mouseDragged(event) {
  if (surCanvas(event)) {
    ajouterBoid(mouseX, mouseY);
  }
}

function keyPressed() {
  if (key === 'd') {
    panel.toggleDebug();
  } else if (key === 'r') {
    taillesAleatoires();
  } else if (key === 'o') {
    // obstacle à la position de la souris, les boids l'évitent
    obstacles.push(new Obstacle(mouseX, mouseY, random(20, 60), 'lightgreen'));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  flock.forEach((b) => {
    b.boundariesWidth = width;
    b.boundariesHeight = height;
  });
}
