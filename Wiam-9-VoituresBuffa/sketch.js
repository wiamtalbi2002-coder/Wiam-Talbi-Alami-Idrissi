// sketch.js — Wiam-9-VoituresBuffa
// Version améliorée de « 9-VoitureSuitCircuit genetic algo » de Michel Buffa :
// des voitures apprennent à conduire seules (réseau de neurones + algorithme
// génétique = neuroévolution). Voir 9-Specification.md.
//
// Touches : D debug, N nouveau circuit, R recommencer, flèches = ta voiture.

const STOCKAGE = 'wiam-voitures-champion';

const params = {
  population: 100,
  nbRayons: 7,
  neuronesCaches: 10,
  portee: 110,
  tauxMutation: 0.1,
  amplitudeMutation: 0.3,
  elites: 2,
  croisement: true,
  nouveauCircuit: true,
  sinuosite: 5.5,
  largeur: 32,
  dureeDeVie: 40,
  tours: 2,
  vitesseSimulation: 1,
  joueur: false,
};

let track;
let population;
let player = null;
let confettis = [];
let injecte = [];
let panel;
let infoSpan;
let brainView;
let chart;
let toast = { texte: '', vie: 0 };
let fileInput;

const LARGEUR_COLONNE = 330;
// hauteur du panneau replié (il s'ouvre par-dessus, semi-transparent)
const HAUT = 48;

function setup() {
  createCanvas(windowWidth, windowHeight);
  creerPanneau();
  placerVues();
  track = nouveauCircuit();
  population = new Population(track, params);
  message('Génération 1 : des cerveaux au hasard… ils vont apprendre ! (▾ réglages en haut)');
}

function zoneCircuit() {
  const w = width - LARGEUR_COLONNE - 20;
  const h = height - HAUT - 10;
  return { cx: w / 2 + 10, cy: HAUT + h / 2, rx: w / 2 - 15, ry: h / 2 - 10 };
}

function nouveauCircuit() {
  return new Track(zoneCircuit(), params.sinuosite, params.largeur, 80);
}

function placerVues() {
  const x = width - LARGEUR_COLONNE;
  const dispo = height - HAUT - 130;
  brainView = new BrainView(x, HAUT, LARGEUR_COLONNE - 10, dispo * 0.58);
  chart = new FitnessChart(x, HAUT + dispo * 0.58 + 8, LARGEUR_COLONNE - 10, dispo * 0.42 - 8);
}

function creerPanneau() {
  panel = new ControlPanel('🏎️ Wiam — des voitures qui apprennent à conduire (version Buffa améliorée)', { open: false });
  panel.addSlider('Vitesse de simulation', 1, 30, params.vitesseSimulation, 1, (v) => { params.vitesseSimulation = v; });
  panel.addSlider('Voitures', 10, 300, params.population, 10, (v) => { params.population = v; });
  panel.addSlider('Taux de mutation', 0, 0.5, params.tauxMutation, 0.01, (v) => { params.tauxMutation = v; });
  panel.addSlider('Amplitude mutation', 0.05, 1.5, params.amplitudeMutation, 0.05, (v) => { params.amplitudeMutation = v; });
  panel.addSlider('Élites gardés', 0, 10, params.elites, 1, (v) => { params.elites = v; });
  panel.addCheckbox('Croisement des parents', params.croisement, (v) => { params.croisement = v; });
  panel.addCheckbox('Nouveau circuit à chaque génération', params.nouveauCircuit, (v) => { params.nouveauCircuit = v; });
  panel.addSlider('Portée des capteurs', 30, 250, params.portee, 5, (v) => { params.portee = v; });
  panel.addSlider('Vie sans checkpoint', 10, 120, params.dureeDeVie, 5, (v) => { params.dureeDeVie = v; });
  panel.addSlider('Sinuosité', 1, 8, params.sinuosite, 0.5, (v) => { params.sinuosite = v; });
  panel.addSlider('Largeur route', 25, 80, params.largeur, 1, (v) => { params.largeur = v; });
  panel.addSlider('Capteurs (recommence)', 3, 11, params.nbRayons, 2, (v) => { params.nbRayons = v; recommencer(); });
  panel.addSlider('Neurones cachés (recommence)', 2, 24, params.neuronesCaches, 1, (v) => { params.neuronesCaches = v; recommencer(); });
  panel.addCheckbox('🏁 Je conduis (flèches) contre l\'IA', params.joueur, (v) => activerJoueur(v));
  panel.addButton('Nouveau circuit (N)', changerCircuit);
  panel.addButton('Recommencer (R)', recommencer);
  panel.addButton('⬇ Télécharger le champion', telechargerChampion);
  panel.addButton('⬆ Charger un champion', () => fileInput.elt.click());
  panel.addButton('↺ Reprendre mon champion sauvegardé', reprendreChampion);
  panel.addDebugToggle();
  infoSpan = panel.addInfo('');

  fileInput = createFileInput(chargerChampion);
  fileInput.hide();
}

function draw() {
  background(12, 8, 24);

  for (let n = 0; n < params.vitesseSimulation; n++) {
    population.step();
    if (population.done()) {
      generationSuivante();
    }
  }
  if (player) {
    player.step();
  }

  track.show();
  population.cars.forEach((c) => c.show());
  const leader = population.leader();
  if (leader) {
    leader.highlight();
  }
  if (player) {
    player.show();
  }
  confettis.forEach((c) => { c.step(); c.show(); });
  confettis = confettis.filter((c) => c.vie > 0);

  brainView.show(leader, nomsEntrees());
  chart.show(population.history);
  afficherStats(leader);
  afficherToast();
}

function nomsEntrees() {
  const n = params.nbRayons;
  const noms = [];
  for (let k = 0; k < n; k++) {
    const a = n === 1 ? 0 : round(map(k, 0, n - 1, -75, 75));
    noms.push('rayon ' + a + '°');
  }
  noms.push('vitesse');
  return noms;
}

function generationSuivante() {
  // En mode course, le circuit reste le même (sinon ta voiture serait perdue)
  if (params.nouveauCircuit && !player) {
    track = nouveauCircuit();
  }
  const gen = population.generation;
  const tourAvant = population.meilleurTour;
  const record = population.evolve(track, injecte);
  injecte = [];
  if (record) {
    message(`🎉 Génération ${gen} : nouveau record, ${round(population.record * 100)} % de la course !`);
    fete();
    sauvegarderChampion();
  } else if (population.meilleurTour !== null && tourAvant !== null && population.meilleurTour < tourAvant) {
    // une fois la course finie, le défi devient la vitesse
    message(`⚡ Génération ${gen} : tour record en ${nf(population.meilleurTour / 60, 1, 2)} s !`);
    fete();
  }
}

function afficherStats(leader) {
  const x = width - LARGEUR_COLONNE;
  const y = height - 122;
  push();
  noStroke();
  fill(15, 10, 30, 210);
  rect(x, y, LARGEUR_COLONNE - 10, 112, 10);
  fill(255);
  textSize(13);
  textAlign(LEFT, TOP);
  const sec = (t) => (t === null ? '—' : nf(t / 60, 1, 1) + ' s');
  const lignes = [
    `Génération ${population.generation} · ${population.cars.length} en course`,
    `En tête : ${leader ? round(leader.ratio() * 100) : 0} % · record ${round(population.record * 100)} %`,
    `Meilleur tour IA : ${sec(population.meilleurTour)}`,
  ];
  if (player) {
    lignes.push(`Ton meilleur tour : ${sec(player.meilleurTour)} · tours ${player.tours} · crashs ${player.crash}`);
    if (player.meilleurTour !== null && population.meilleurTour !== null) {
      lignes.push(player.meilleurTour < population.meilleurTour ? '💖 Tu bats l\'IA !' : '🤖 L\'IA est plus rapide… pour l\'instant');
    }
  } else {
    lignes.push('Coche « Je conduis » pour faire la course !');
  }
  lignes.forEach((l, i) => text(l, x + 10, y + 8 + i * 20));
  pop();
  infoSpan.textContent = `Génération ${population.generation} · record ${round(population.record * 100)} % · D debug, N circuit, R recommencer`;
}

function message(texte) {
  toast = { texte, vie: 240 };
}

function afficherToast() {
  if (toast.vie <= 0) {
    return;
  }
  toast.vie--;
  const zone = zoneCircuit();
  push();
  textAlign(CENTER, CENTER);
  textSize(20);
  const w = textWidth(toast.texte) + 40;
  noStroke();
  fill(255, 60, 170, min(220, toast.vie * 4));
  rect(zone.cx - w / 2, HAUT + 10, w, 40, 20);
  fill(255, min(255, toast.vie * 4));
  text(toast.texte, zone.cx, HAUT + 30);
  pop();
}

function fete() {
  const zone = zoneCircuit();
  for (let i = 0; i < 120; i++) {
    confettis.push(new Confetti(zone.cx + random(-80, 80), HAUT + 40));
  }
}

function changerCircuit() {
  track = nouveauCircuit();
  // les voitures en course repartent sur le nouveau circuit
  population.cars.forEach((c) => { c.dead = true; });
  if (player) {
    player.reset(track);
  }
  message('Nouveau circuit !');
}

function recommencer(cerveaux = []) {
  track = nouveauCircuit();
  population = new Population(track, params, cerveaux);
  if (player) {
    player.reset(track);
  }
  message(cerveaux.length ? 'Le champion reprend la route !' : 'Nouveaux cerveaux au hasard : tout recommence.');
}

function activerJoueur(on) {
  params.joueur = on;
  player = on ? new PlayerCar(track) : null;
  if (on) {
    message('À toi ! Flèches pour conduire. Le circuit ne change plus.');
  }
}

// --- sauvegarde du champion ---

function championJSON() {
  const c = population.champion;
  if (!c) {
    return null;
  }
  return { type: 'wiam-champion', generation: c.generation, ratio: c.ratio, brain: c.brain.toJSON() };
}

function sauvegarderChampion() {
  try {
    localStorage.setItem(STOCKAGE, JSON.stringify(championJSON()));
  } catch (e) {
    // stockage indisponible : pas grave
  }
}

function telechargerChampion() {
  const json = championJSON();
  if (!json) {
    message('Pas encore de champion : attends la fin de la 1re génération.');
    return;
  }
  saveJSON(json, 'champion-wiam.json');
}

function utiliserChampion(json) {
  if (!json || !json.brain || !json.brain.sizes) {
    message('Fichier de champion invalide.');
    return;
  }
  const brain = NeuralNetwork.fromJSON(json.brain);
  const sizes = brain.sizes;
  // le cerveau impose le nombre de capteurs et de neurones cachés
  params.nbRayons = sizes[0] - 1;
  params.neuronesCaches = sizes[1];
  recommencer([brain]);
}

function chargerChampion(file) {
  try {
    const json = typeof file.data === 'string' ? JSON.parse(file.data) : file.data;
    utiliserChampion(json);
  } catch (e) {
    message('Impossible de lire ce fichier.');
  }
}

function reprendreChampion() {
  try {
    const texte = localStorage.getItem(STOCKAGE);
    if (!texte) {
      message('Aucun champion sauvegardé pour l\'instant.');
      return;
    }
    utiliserChampion(JSON.parse(texte));
  } catch (e) {
    message('Sauvegarde illisible.');
  }
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  } else if (key === 'n' || key === 'N') {
    changerCircuit();
  } else if (key === 'r' || key === 'R') {
    recommencer();
  }
  // les flèches ne doivent pas faire défiler la page
  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode)) {
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  placerVues();
}
