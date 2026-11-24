// sketch.js — Tâche 1 : flotte de vaisseaux pilotée par curseurs.
// Curseurs : nombre de vaisseaux, vitesse max, accélération max (maxForce).
// Debug : touche D ou case à cocher (synchronisées) → vecteurs vitesse rouges.

let ships = [];
let panel;
let countSlider;
let speedSlider;
let forceSlider;

function setup() {
  createCanvas(windowWidth, windowHeight);

  panel = new ControlPanel('Tâche 1 — Vaisseaux', { homeHref: '../../index.html' });
  countSlider = panel.addSlider('Vaisseaux', 1, 200, 20, 1);
  speedSlider = panel.addSlider('Vitesse max', 0, 20, 4, 0.01);
  forceSlider = panel.addSlider('Accélération max', 0, 10, 0.2, 0.01);
  panel.addDebugToggle();

  syncShipCount();
}

function draw() {
  background(11, 13, 20);
  syncShipCount();

  let maxSpeed = Number(speedSlider.value());
  let maxForce = Number(forceSlider.value());

  ships.forEach((ship) => {
    ship.maxSpeed = maxSpeed;
    ship.maxForce = maxForce;
    ship.applyBehaviors(ships);
    ship.update();

    // Filet de sécurité : si maxForce = 0, le containment ne peut plus agir.
    ship.wrapEdges();
    ship.show();
  });
}

// Ajoute ou retire des vaisseaux pour atteindre la valeur du curseur.
function syncShipCount() {
  let target = Number(countSlider.value());
  while (ships.length < target) {
    let ship = new Ship(random(width), random(80, height));
    ship.vel.setMag(random(1, max(Number(speedSlider.value()), 1)));
    ships.push(ship);
  }
  if (ships.length > target) {
    ships.splice(target);
  }
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
