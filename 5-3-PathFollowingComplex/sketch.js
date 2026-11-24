// Path Following (Complex Path)
// The Nature of Code
// The Coding Train / Daniel Shiffman
// https://youtu.be/LrnR6dc2IfM
// https://thecodingtrain.com/learning/nature-of-code/5.7-path-following.html

// Path Following: https://editor.p5js.org/codingtrain/sketches/dqM054vBV
// Complex Path: https://editor.p5js.org/codingtrain/sketches/2FFzvxwVt

// Crowd Path Following
// Via Reynolds: http://www.red3d.com/cwr/steer/CrowdPath.html

// Pour debug on/off affichage des lignes etc.
let debug = false;

// le chemin
let path;

// Tableau des véhicules
let vehicles = [];
let snakes = [];
let snakeFollowWeight = 2;
let snakeSeparationWeight = 1.2;
let circuitWidth = 35;
let snakeSpacing = 20;
let snakeSize = 22;
let entitySpacing = 24;
// Exercice : poids des deux forces des véhicules ordinaires
let vehicleFollowWeight = 2;
let vehicleSeparationWeight = 1.2;
// Exercice : type de circuit (simple ou complexe)
let circuitType = 'complexe';

function setup() {
  // Exercice : canvas agrandi (toute la fenêtre sous la barre de réglages)
  createCanvas(windowWidth, canvasHeight());
  // la fonction suivante créer un chemin composé de plusieurs points
  newPath();

  // On crée n véhicules placés aléatoirement sur le canvas
  const nbVehicules = 20;

  for (let i = 0; i < nbVehicules; i++) {
    newVehicle(random(width), random(height));
  }
  newSnake(path.points[0].x, path.points[0].y);
  bindSnakeControls();
  bindVehicleControls();
}

function canvasHeight() {
  let controls = document.getElementById('controls');
  return windowHeight - (controls ? controls.offsetHeight : 0);
}

// Exercice : curseurs pour les poids f (suivi) et s (séparation) des
// véhicules ordinaires, et choix du circuit.
function bindVehicleControls() {
  const synchronize = () => {
    vehicleFollowWeight = Number(document.getElementById('vehicle-follow').value);
    vehicleSeparationWeight = Number(document.getElementById('vehicle-separation').value);
    document.getElementById('vehicle-follow-value').value = vehicleFollowWeight.toFixed(1);
    document.getElementById('vehicle-separation-value').value = vehicleSeparationWeight.toFixed(1);
    for (const v of vehicles) {
      if (v.wanderWeight === 0) {
        v.followPathWeight = vehicleFollowWeight;
        v.separateWeight = vehicleSeparationWeight;
      }
    }
  };
  for (const id of ['vehicle-follow', 'vehicle-separation']) {
    document.getElementById(id).addEventListener('input', synchronize);
  }
  document.getElementById('circuit-type').addEventListener('change', (event) => {
    circuitType = event.target.value;
    newPath();
    path.radius = circuitWidth;
  });
  synchronize();
}

function draw() {
  background(240);
  // Affichage du chemin
  path.display();

  const allSegments = snakes.flatMap(snake => snake.anneaux);
  const neighbors = [...vehicles, ...allSegments];
  for (let v of vehicles) {
    // On applique les comportements pour suivre le chemin
    // Comme on utilise ici plusieurs comportements, notamment un comportement qui 
    // dépend des autres véhicules, on passe en paramètre le tableau des véhicules 
    // et le chemin
    v.applyBehaviors(neighbors, path);
    // on a regroupé update, draw etc. dans une méthode run (update, borders, display, etc.)
    v.run();
    // les véhicules qui déambulent réapparaissent de l'autre côté
    v.edges();
  }

  // Compteurs
  push();
  noStroke();
  fill(0);
  textSize(14);
  const verts = vehicles.filter((v) => v.wanderWeight > 0).length;
  const rouges = vehicles.filter((v) => v.couleur === 'red').length;
  text(`Véhicules : ${vehicles.length} (dont ${rouges} rapides rouges, ${verts} wander verts)`, 12, height - 12);
  pop();
  for (const snake of snakes) {
    snake.move(path, neighborsForSnake(snake, neighbors));
    snake.show();
  }
}

function neighborsForSnake(snake, allNeighbors) {
  const ownSegments = new Set(snake.anneaux);
  return allNeighbors.filter(vehicle => !ownSegments.has(vehicle));
}

function newSnake(x, y) {
  const snake = new SnakePathFollowing(x, y, 12, snakeSize,
    color(random(40, 200), random(70, 190), random(40, 200)));
  snake.followWeight = snakeFollowWeight;
  snake.separationWeight = snakeSeparationWeight;
  snake.setRingSpacing(snakeSpacing);
  snake.setSize(snakeSize);
  snake.setSeparationDistance(entitySpacing);
  snakes.push(snake);
  document.getElementById('snake-count').value = `${snakes.length} serpent${snakes.length > 1 ? 's' : ''}`;
  return snake;
}

function bindSnakeControls() {
  const synchronize = () => {
    snakeFollowWeight = Number(document.getElementById('snake-follow').value);
    snakeSeparationWeight = Number(document.getElementById('snake-separation').value);
    circuitWidth = Number(document.getElementById('circuit-width').value);
    snakeSpacing = Number(document.getElementById('snake-spacing').value);
    snakeSize = Number(document.getElementById('snake-size').value);
    const entitySpacingEl = document.getElementById('entity-spacing');
    if (entitySpacingEl) {
      entitySpacing = Number(entitySpacingEl.value);
    }
    if (path) path.radius = circuitWidth;
    for (const v of vehicles) {
      v.separationDistance = entitySpacing;
    }
    for (const snake of snakes) {
      snake.followWeight = snakeFollowWeight;
      snake.separationWeight = snakeSeparationWeight;
      snake.setRingSpacing(snakeSpacing);
      snake.setSize(snakeSize);
      snake.setSeparationDistance(entitySpacing);
    }
    document.getElementById('snake-follow-value').value = snakeFollowWeight.toFixed(1);
    document.getElementById('snake-separation-value').value = snakeSeparationWeight.toFixed(1);
    document.getElementById('circuit-width-value').value = `${circuitWidth.toFixed(0)} px`;
    document.getElementById('snake-spacing-value').value = `${snakeSpacing.toFixed(0)} px`;
    document.getElementById('snake-size-value').value = `${snakeSize.toFixed(0)} px`;
    const entitySpacingValEl = document.getElementById('entity-spacing-value');
    if (entitySpacingValEl) {
      entitySpacingValEl.value = `${entitySpacing.toFixed(0)} px`;
    }
  };
  for (const id of ['snake-follow', 'snake-separation', 'circuit-width', 'snake-spacing', 'snake-size', 'entity-spacing']) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', synchronize);
    el.addEventListener('change', synchronize);
  }
  synchronize();
}

function newPath() {
  path = new Path();
  if (circuitType === 'simple') {
    // Chemin de départ du prof : un cercle irrégulier de 30 points.
    let nbSegments = 30;
    let angleStep = (TWO_PI / nbSegments);
    let radiusMin = min(width, height) / 3;
    let radiusMax = min(width, height) / 2.5;
    for (let i = 0; i < nbSegments; i++) {
      let angle = i * angleStep;
      let radius = random(radiusMin, radiusMax);
      let x = width / 2 + cos(angle) * radius;
      let y = height / 2 + sin(angle) * radius;
      path.addPoint(x, y);
    }
    return;
  }

  // Exercice : un vrai circuit, plus complexe et plus large, qui occupe
  // tout le canvas : une boucle avec des épingles, une chicane en S et
  // des longues lignes droites (courbe fermée échantillonnée en 90 points).
  let nbPoints = 90;
  let rx = width * 0.42;
  let ry = height * 0.38;
  for (let i = 0; i < nbPoints; i++) {
    let t = (i / nbPoints) * TWO_PI;
    let bosse = 1 + 0.22 * sin(3 * t) + 0.12 * cos(5 * t + 0.7);
    let x = width / 2 + rx * cos(t) * bosse;
    let y = height / 2 + ry * sin(t) * (1 + 0.18 * cos(2 * t));
    path.addPoint(x, y);
  }
}

function newVehicle(x, y) {
  let maxspeed = random(1, 3);
  let maxforce = 0.3;
  let v = new Vehicle(x, y, maxspeed, maxforce);
  v.separationDistance = entitySpacing;
  v.followPathWeight = vehicleFollowWeight;
  v.separateWeight = vehicleSeparationWeight;
  vehicles.push(v);
  return v;
}

function keyPressed(event) {
  if (document.activeElement?.matches('input, select, textarea')) return;
  if (key.toLowerCase() == "t") {
    if (!event?.repeat) newSnake(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
  } else if (key == "d") {
    debug = !debug;
    Vehicle.debug = debug;
  } else if(key == "s") {
    // Exercice : véhicule beaucoup plus rapide que les autres, rouge
    let v = newVehicle(mouseX, mouseY);
    v.maxSpeed = 7;
    v.maxForce = 0.6;
    v.couleur = "red"
  } else if (key == "w") {
    // Exercice : véhicule qui déambule (wander), dessiné en vert. Il est
    // dans le même tableau que les autres : les autres gardent leurs
    // distances avec lui (séparation), et lui aussi avec eux.
    let v = new Vehicle(mouseX, mouseY, 2, 0.25);
    v.wanderWeight = 1;
    v.followPathWeight = 0;
    v.separateWeight = 1;
    v.separationDistance = entitySpacing;
    v.r = 30;
    v.couleur = "green";
    vehicles.push(v);
  }
}

function mouseDragged(event) {
  if (event?.target?.closest?.('#controls')) return;
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) newVehicle(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, canvasHeight());
  newPath();
  path.radius = circuitWidth;
}
