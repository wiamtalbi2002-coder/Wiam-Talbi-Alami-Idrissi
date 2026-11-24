// Daniel Shiffman
// The Coding Train
// Coding Challenge 69: Steering Evolution
// Part 1: https://youtu.be/flxOkx0yLrY  …  Part 5: https://youtu.be/VnFF5V5DS8s
//
// 8-EvolutionarySteeringBehavior — exercices (voir 8-Specification.md) :
//  - des prédateurs (classe Predator) poursuivent et mangent les individus ;
//  - les individus fuient les prédateurs, plus ou moins vite selon leur santé ;
//  - curseurs pour régler les paramètres (panneau accordéon) ;
//  - clic : ajoute un individu ou un prédateur (au choix dans le panneau).
// Rappel : ADN = poids nourriture, poids poison, perception nourriture,
// perception poison. Vert = nourriture, rouge = poison.

const vehicles = [];
const predators = [];
const food = [];
const poison = [];

let panel;
let infoSpan;

const params = {
  foodProb: 0.2,
  poisonProb: 0.01,
  mutationRate: 0.01,
  nbPredateursDepart: 2,
  vitessePredateur: 3.5,
  faimPredateur: 0.0015,
  rayonPeur: 90,
  fuiteSelonSante: true,
  clicAjoute: 'individu',
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  creerPanneau();
  initSimulation();
}

function creerPanneau() {
  panel = new ControlPanel('8 — évolution, nourriture, poison et prédateurs', { open: true });
  panel.addSlider('Proba. nourriture', 0, 1, params.foodProb, 0.01, (v) => { params.foodProb = v; });
  panel.addSlider('Proba. poison', 0, 1, params.poisonProb, 0.01, (v) => { params.poisonProb = v; });
  panel.addSlider('Taux de mutation', 0, 0.2, params.mutationRate, 0.005, (v) => { params.mutationRate = v; });
  panel.addSlider('Prédateurs au départ', 0, 10, params.nbPredateursDepart, 1, (v) => { params.nbPredateursDepart = v; });
  panel.addSlider('Vitesse prédateurs', 1, 8, params.vitessePredateur, 0.1, (v) => { params.vitessePredateur = v; });
  panel.addSlider('Faim prédateurs', 0, 0.01, params.faimPredateur, 0.0005, (v) => { params.faimPredateur = v; });
  panel.addSlider('Rayon de peur', 0, 250, params.rayonPeur, 5, (v) => { params.rayonPeur = v; });
  panel.addCheckbox('Fuite plus rapide si bonne santé', params.fuiteSelonSante,
    (v) => { params.fuiteSelonSante = v; });
  panel.addSelect('Le clic ajoute', [
    { value: 'individu', label: 'un individu' },
    { value: 'predateur', label: 'un prédateur' },
  ], params.clicAjoute, (v) => { params.clicAjoute = v; });
  panel.addButton('Recommencer', initSimulation);
  panel.addDebugToggle();
  infoSpan = panel.addInfo('');
}

function initSimulation() {
  vehicles.length = 0;
  predators.length = 0;
  food.length = 0;
  poison.length = 0;
  for (let i = 0; i < 50; i++) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }
  for (let i = 0; i < 40; i++) {
    food.push(createVector(random(width), random(height)));
  }
  for (let i = 0; i < 20; i++) {
    poison.push(createVector(random(width), random(height)));
  }
  for (let i = 0; i < params.nbPredateursDepart; i++) {
    ajouterPredateur(random(width), random(height));
  }
}

function ajouterPredateur(x, y) {
  const p = new Predator(x, y);
  predators.push(p);
  return p;
}

function draw() {
  background(0);

  // taux de mutation (variable globale mr de vehicle.js)
  mr = params.mutationRate;

  if (random(1) < params.foodProb) {
    food.push(createVector(random(width), random(height)));
  }
  if (random(1) < params.poisonProb) {
    poison.push(createVector(random(width), random(height)));
  }

  noStroke();
  fill(0, 255, 0);
  food.forEach((f) => ellipse(f.x, f.y, 4, 4));
  fill(255, 0, 0);
  poison.forEach((p) => ellipse(p.x, p.y, 4, 4));

  // Prédateurs : chasse, puis déplacement
  for (let i = predators.length - 1; i >= 0; i--) {
    const p = predators[i];
    p.maxSpeed = params.vitessePredateur;
    p.faim = params.faimPredateur;
    p.boundaries();
    p.chasser(vehicles);
    p.update();
    p.display();
    if (p.dead()) {
      predators.splice(i, 1);
    }
  }

  // Individus : liste parcourue à l'envers pour pouvoir supprimer
  for (let i = vehicles.length - 1; i >= 0; i--) {
    const v = vehicles[i];
    v.boundaries();
    v.behaviors(food, poison);
    v.applyForce(v.fuir(predators, params.rayonPeur, params.fuiteSelonSante));
    v.update();
    v.display();

    const newVehicle = v.clone();
    if (newVehicle != null) {
      vehicles.push(newVehicle);
    }

    // mort : il devient de la nourriture
    if (v.dead()) {
      food.push(createVector(v.pos.x, v.pos.y));
      vehicles.splice(i, 1);
    }
  }

  const mangés = predators.reduce((s, p) => s + p.nbMangés, 0);
  infoSpan.textContent = `${vehicles.length} individus · ${predators.length} prédateurs · ` +
    `${mangés} mangés · clic = ${params.clicAjoute === 'individu' ? 'individu' : 'prédateur'}, glisser = individus`;
}

// Vrai seulement si l'événement vient du canvas (pas du panneau)
function surCanvas(event) {
  return !(event && event.target && event.target.tagName !== 'CANVAS');
}

function mousePressed(event) {
  if (!surCanvas(event)) {
    return;
  }
  if (params.clicAjoute === 'predateur') {
    ajouterPredateur(mouseX, mouseY);
  } else {
    vehicles.push(new Vehicle(mouseX, mouseY));
  }
}

function mouseDragged(event) {
  if (surCanvas(event)) {
    vehicles.push(new Vehicle(mouseX, mouseY));
  }
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  } else if (key === 'p') {
    ajouterPredateur(mouseX, mouseY);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
