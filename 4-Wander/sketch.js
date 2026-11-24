// sketch.js — 4-Wander (voir 4-Specification.md).
// Exercices des transparents :
//   - curseurs pour les paramètres de wander (distance et rayon du cercle,
//     variation de l'angle theta, vitesse max, force max),
//   - 20 véhicules qui déambulent, positions de départ aléatoires,
//     couleurs et tailles différentes,
//   - traînée derrière chaque véhicule, de taille limitée (curseur),
//   - optionnel : curseur pour le nombre de véhicules, clic pour en
//     ajouter, déambulation au bruit de Perlin.

let vehicles = [];
let imageFusee;
let panel;
let usePerlin = false;
let varied = true;
// 12 copies colorées de l'image, calculées une seule fois : tint() à
// chaque frame est très lent (3 images/s avec 20 véhicules).
let imagesColorees = [];
const NB_COULEURS = 12;

// Valeurs courantes des curseurs (appliquées aussi aux nouveaux véhicules).
let props = {
  maxSpeed: 4,
  maxForce: 0.2,
  wanderRadius: 50,
  distanceCercle: 150,
  displaceRange: 0.3,
  pathLength: 20,
};

function preload() {
  // on charge une image de fusée pour le vaisseau
  imageFusee = loadImage('./assets/vehicule.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  preparerImagesColorees();
  panel = new ControlPanel('4-Wander — déambuler');

  // On cree des sliders pour régler les paramètres
  creerSlidersPourProprietesVehicules();
  creerSliderPourNombreDeVehicules(20);
  creerSliderPourLongueurCheminDerriereVehicules(props.pathLength);

  panel.addCheckbox('Couleurs et tailles variées', varied, (on) => {
    varied = on;
    vehicles.forEach((v) => habiller(v));
  });
  panel.addCheckbox('Bruit de Perlin (au lieu du hasard)', usePerlin, (on) => {
    usePerlin = on;
  });
  panel.addDebugToggle();
  panel.addInfo('Clic dans l\'écran : ajouter un véhicule. Touche D : debug (cercle de wander).');

  ajouterVehicules(20);
}

function creerSlidersPourProprietesVehicules() {
  creerSliderPourProprieteVehicules('Vitesse max', 'maxSpeed', 1, 20, 0.1);
  creerSliderPourProprieteVehicules('Force max', 'maxForce', 0.01, 2, 0.01);
  creerSliderPourProprieteVehicules('Rayon wander', 'wanderRadius', 5, 150, 1);
  creerSliderPourProprieteVehicules('Distance cercle', 'distanceCercle', 10, 300, 1);
  creerSliderPourProprieteVehicules('Variation theta', 'displaceRange', 0, 1.5, 0.01);
}

// Un curseur qui règle la même propriété sur tous les véhicules.
function creerSliderPourProprieteVehicules(label, propertyName, min, max, step) {
  panel.addSlider(label, min, max, props[propertyName], step, (value) => {
    props[propertyName] = value;
    vehicles.forEach((vehicle) => {
      vehicle[propertyName] = value;
    });
  });
}

// TODO du prof : curseur pour le nombre de véhicules.
function creerSliderPourNombreDeVehicules(nb) {
  panel.addSlider('Nombre de véhicules', 1, 200, nb, 1, (value) => {
    if (vehicles.length < value) {
      ajouterVehicules(value - vehicles.length);
    } else {
      vehicles.splice(value);
    }
  });
}

// TODO du prof : curseur pour la longueur de la traînée.
function creerSliderPourLongueurCheminDerriereVehicules(longueur) {
  panel.addSlider('Longueur traînée', 0, 100, longueur, 1, (value) => {
    props.pathLength = value;
    vehicles.forEach((vehicle) => {
      vehicle.pathLength = value;
    });
  });
}

function ajouterVehicules(nb, x = null, y = null) {
  for (let i = 0; i < nb; i++) {
    let vehicle = new Vehicle(x ?? random(width), y ?? random(height), imageFusee);
    vehicle.vel = p5.Vector.random2D();
    Object.assign(vehicle, props);
    vehicle.wanderTheta = random(TWO_PI);
    habiller(vehicle);
    vehicles.push(vehicle);
  }
}

function preparerImagesColorees() {
  colorMode(HSB, 360, 100, 100);
  for (let i = 0; i < NB_COULEURS; i += 1) {
    let couleur = color((i * 360) / NB_COULEURS, 60, 100);
    let g = createGraphics(imageFusee.width, imageFusee.height);
    g.tint(couleur);
    g.image(imageFusee, 0, 0);
    imagesColorees.push({ couleur, image: g });
  }
  colorMode(RGB, 255);
}

// Couleur et taille au hasard (ou valeurs du prof si décoché).
function habiller(vehicle) {
  if (varied === true) {
    let choix = random(imagesColorees);
    vehicle.couleur = choix.couleur;
    vehicle.image = choix.image;
    vehicle.r = random(16, 46);
  } else {
    vehicle.couleur = null;
    vehicle.image = imageFusee;
    vehicle.r = 46;
  }
}

// appelée 60 fois par seconde
function draw() {
  background(0);

  vehicles.forEach(vehicle => {
    // la force de wander doit être appliquée (elle est renvoyée)
    let force = usePerlin ? vehicle.wanderPerlin() : vehicle.wander();
    vehicle.applyForce(force);

    vehicle.update();
    vehicle.show();
    vehicle.edges();
  });

  push();
  fill(255);
  noStroke();
  textSize(16);
  text(`Véhicules : ${vehicles.length}`, 16, height - 20);
  pop();
}

function mousePressed(event) {
  if (event && event.target && event.target.tagName !== 'CANVAS') {
    return;
  }
  ajouterVehicules(1, mouseX, mouseY);
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
