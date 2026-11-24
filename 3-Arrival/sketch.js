// sketch.js — 3-Arrival (voir 3-Specification.md).
// Exercices des transparents, choisis avec la liste « Mode » du panneau :
//   1. Deux véhicules : le 1er arrive sur la souris, le 2e arrive sur le 1er.
//   2. Serpent de n véhicules à la suite, avec la distance d'éloignement d
//      (paramètre d de arrive) et des lignes entre les anneaux.
//   3. Formation en V : 5 cibles placées en V autour du leader (offsets),
//      5 véhicules arrivent sur ces cibles.
//   4. Texte en points : textToPoints donne les points d'un texte, un
//      véhicule rond arrive sur chaque point.
//   5. Grille 4 × 5 : 20 cibles, 20 véhicules ; le n° i arrive sur la
//      cible n° i ; quand tous sont arrivés, 2 s plus tard (setTimeout)
//      les cibles partent hors de l'écran et les véhicules les suivent.

let target;
let vehicles = [];
let font;
let panel;
let mode = 'serpent';
let infoLabel;
let gridTargets = [];
let gridLeaving = false;
let gridTimer = null;

let params = {
  maxSpeed: 6,
  maxForce: 0.3,
  freinage: 100,
  n: 25,
  d: 20,
  lignes: true,
  texte: 'WIAM',
  tailleTexte: 220,
  ciblesInvisibles: false,
};

const MODES = [
  { value: 'deux', label: '1. Deux véhicules (le 2e suit le 1er)' },
  { value: 'serpent', label: '2. Serpent de n véhicules' },
  { value: 'formation', label: '3. Formation en V' },
  { value: 'texte', label: '4. Texte en points (textToPoints)' },
  { value: 'grille', label: '5. Grille 4 × 5 + dispersion' },
];

const INFOS = {
  deux: 'Le 1er véhicule arrive sur la souris, le 2e arrive sur le 1er.',
  serpent: 'Chaque anneau arrive sur le précédent. d > 0 : la vitesse désirée s\'annule à la distance d (ils gardent leurs distances).',
  formation: 'Le leader suit la souris ; 5 cibles en V (offsets tournés avec le leader) ; 5 véhicules arrivent dessus.',
  texte: 'Un véhicule rond par point du texte. Change le texte dans le champ.',
  grille: 'Quand les 20 véhicules sont arrivés, 2 s plus tard les cibles s\'en vont… et les véhicules les suivent.',
};

// Appelée avant de démarrer l'animation : on charge la police.
function preload() {
  font = loadFont('./assets/inconsolata.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // La cible, ce sera la position de la souris
  target = createVector(width / 2, height / 2);

  panel = new ControlPanel('3-Arrival — arriver');
  panel.addSelect('Mode', MODES, mode, (value) => {
    mode = value;
    infoLabel.html(INFOS[mode]);
    resetScene();
  });
  panel.addSlider('Vitesse max', 1, 20, params.maxSpeed, 0.1, (v) => {
    params.maxSpeed = v;
  });
  panel.addSlider('Force max', 0.01, 2, params.maxForce, 0.01, (v) => {
    params.maxForce = v;
  });
  panel.addSlider('Zone de freinage', 10, 300, params.freinage, 1, (v) => {
    params.freinage = v;
  });
  panel.addSlider('Anneaux n (serpent)', 2, 120, params.n, 1, (v) => {
    params.n = v;
    if (mode === 'serpent') {
      resetScene();
    }
  });
  panel.addSlider('Distance d', 0, 100, params.d, 1, (v) => {
    params.d = v;
  });
  panel.addCheckbox('Lignes entre les anneaux', params.lignes, (on) => {
    params.lignes = on;
  });
  panel.addText('Texte', params.texte, (value) => {
    params.texte = value;
    if (mode === 'texte') {
      resetScene();
    }
  });
  panel.addSlider('Taille du texte', 60, 400, params.tailleTexte, 1, (v) => {
    params.tailleTexte = v;
    if (mode === 'texte') {
      resetScene();
    }
  });
  panel.addCheckbox('Grille : cibles invisibles', params.ciblesInvisibles, (on) => {
    params.ciblesInvisibles = on;
    gridTargets.forEach((t) => {
      t.visible = !on;
    });
  });
  panel.addButton('Recommencer', () => resetScene());
  panel.addDebugToggle();
  infoLabel = panel.addInfo(INFOS[mode]);

  resetScene();
}

// On cree des vehicules à des positions aléatoires.
function creerVehicules(n) {
  for (let i = 0; i < n; i++) {
    let v = new Vehicle(random(width), random(height));
    vehicles.push(v);
  }
}

function resetScene() {
  vehicles = [];
  gridTargets = [];
  gridLeaving = false;
  if (gridTimer !== null) {
    clearTimeout(gridTimer);
    gridTimer = null;
  }

  if (mode === 'deux') {
    creerVehicules(2);
  } else if (mode === 'serpent') {
    creerVehicules(params.n);
    vehicles.forEach((v, i) => {
      v.r = map(i, 0, params.n, 16, 6);
      v.couleur = color(255, map(i, 0, params.n, 120, 220), 200);
    });
  } else if (mode === 'formation') {
    creerVehicules(6);
    vehicles[0].couleur = color('gold');
  } else if (mode === 'texte') {
    let points = font.textToPoints(params.texte, 0, 0, params.tailleTexte, {
      sampleFactor: 0.12,
    });
    let bounds = font.textBounds(params.texte, 0, 0, params.tailleTexte);
    let ox = width / 2 - bounds.w / 2 - bounds.x;
    let oy = height / 2 + bounds.h / 2 + 40;
    points.forEach((p) => {
      let v = new Vehicle(random(width), random(height));
      v.cible = createVector(p.x + ox, p.y + oy - bounds.h / 2);
      v.forme = 'cercle';
      v.r = 4;
      v.couleur = color(random(180, 255), random(100, 200), 255);
      vehicles.push(v);
    });
  } else {
    // 20 cibles alignées sur 4 lignes de 5, 20 véhicules aléatoires.
    let cols = 5;
    let rows = 4;
    let spacing = min(width / (cols + 1), (height - 140) / (rows + 1));
    let x0 = width / 2 - (spacing * (cols - 1)) / 2;
    let y0 = 140 + (height - 140) / 2 - (spacing * (rows - 1)) / 2;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        let t = new Target(x0 + col * spacing, y0 + row * spacing);
        t.visible = !params.ciblesInvisibles;
        gridTargets.push(t);
      }
    }
    creerVehicules(20);
  }
}

// appelée 60 fois par seconde
function draw() {
  background(0);

  if (mouseX !== 0 || mouseY !== 0) {
    target.x = mouseX;
    target.y = mouseY;
  }

  vehicles.forEach((v) => {
    v.maxSpeed = params.maxSpeed;
    v.maxForce = params.maxForce;
    v.rayonZoneDeFreinage = params.freinage;
  });

  if (mode === 'deux' || mode === 'serpent') {
    drawMouseTarget();
    drawChaine();
  } else if (mode === 'formation') {
    drawMouseTarget();
    drawFormation();
  } else if (mode === 'texte') {
    drawTexte();
  } else {
    drawGrille();
  }
}

function drawMouseTarget() {
  push();
  fill(255, 0, 0);
  noStroke();
  ellipse(target.x, target.y, 32);
  pop();
}

// Modes 1 et 2 : le premier véhicule arrive sur la souris, chaque véhicule
// suivant arrive sur le précédent, avec la distance d'éloignement d.
function drawChaine() {
  vehicles.forEach((vehicle, index) => {
    let cible = index === 0 ? target : vehicles[index - 1].pos;
    let d = index === 0 ? 0 : params.d;
    vehicle.applyForce(vehicle.arrive(cible, d));
    vehicle.update();
  });

  // Lignes entre les anneaux : même largeur que les anneaux, un peu de
  // transparence et des bords arrondis.
  if (params.lignes === true && mode === 'serpent') {
    push();
    strokeCap(ROUND);
    for (let i = 1; i < vehicles.length; i += 1) {
      let a = vehicles[i - 1];
      let b = vehicles[i];
      stroke(255, 120, 200, 140);
      strokeWeight(b.r * 2);
      line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
    }
    pop();
  }
  for (let i = vehicles.length - 1; i >= 0; i -= 1) {
    vehicles[i].show();
  }
}

// Mode 3 : formation en V autour du leader.
function drawFormation() {
  let leader = vehicles[0];
  leader.applyForce(leader.arrive(target));
  leader.update();

  // Offsets en V (derrière le leader), tournés selon sa direction.
  let offsets = [
    createVector(-50, -45), createVector(-50, 45),
    createVector(-100, -90), createVector(-100, 90),
    createVector(-150, 0),
  ];
  let angle = leader.vel.mag() > 0.3 ? leader.vel.heading() : 0;
  for (let i = 1; i < vehicles.length; i += 1) {
    let point = offsets[i - 1].copy().rotate(angle).add(leader.pos);
    if (Vehicle.debug) {
      push();
      noFill();
      stroke('lime');
      circle(point.x, point.y, 10);
      pop();
    }
    vehicles[i].applyForce(vehicles[i].arrive(point));
    vehicles[i].update();
  }
  vehicles.forEach((v) => v.show());
}

// Mode 4 : chaque véhicule rond arrive sur son point du texte.
function drawTexte() {
  vehicles.forEach((v) => {
    v.applyForce(v.arrive(v.cible));
    v.update();
    v.show();
  });
}

// Mode 5 : grille 4 × 5, puis dispersion 2 s après l'arrivée de tous.
function drawGrille() {
  gridTargets.forEach((t) => {
    t.update();
    t.show();
  });
  let tousArrives = true;
  vehicles.forEach((v, i) => {
    let t = gridTargets[i];
    v.applyForce(v.arrive(t.pos));
    v.update();
    v.show();
    if (v.pos.dist(t.pos) > 3) {
      tousArrives = false;
    }
  });

  if (tousArrives === true && gridLeaving === false && gridTimer === null) {
    gridTimer = setTimeout(() => {
      gridLeaving = true;
      gridTargets.forEach((t) => t.partir());
    }, 2000);
  }

  push();
  fill(255);
  noStroke();
  textSize(16);
  let etat = gridLeaving ? 'Les cibles s\'en vont !' : (gridTimer !== null ? 'Tous arrivés : départ dans 2 s…' : 'Les véhicules arrivent…');
  text(etat, 16, height - 20);
  pop();
}

function keyPressed() {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') {
    return;
  }
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetScene();
}
