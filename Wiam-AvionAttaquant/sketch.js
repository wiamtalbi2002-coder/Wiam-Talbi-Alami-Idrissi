// sketch.js — Tâches 3 et 4 : l'avion attaquant contre des vagues de chars,
// en 3D (WEBGL).
// Tâche 3 : un avion détecte (600 px), poursuit (pursue) la cible la plus
// proche et l'abat avec précision (missiles + mitrailleuse à tir anticipé),
// en passes d'attaque comme un pilote humain ; alarme sonore quand il
// détecte une nouvelle cible ; messages radio lus à voix haute.
// Tâche 4 : les chars fuient (evade + dodge) l'avion et ses missiles, et
// ripostent avec leurs propres missiles ; des fantassins les escortent et
// se dispersent sous le feu.
// Le pilotage reste en 2D (x, y) ; z est l'altitude, utilisée pour le rendu.
// Debug : touche D ou case (synchronisées).

let aircraft; // (pas « plane » : ce nom masquerait la fonction p5 plane())
let targets = [];
let soldiers = [];
let missiles = [];
let bullets = [];
let particles = [];
let popups = [];
let blasts = [];
let decor = [];

let kills = 0;
let soldierKills = 0;
let planeHits = 0;
let shotsFired = 0;
let shotsLanded = 0;
let score = 0;
let wave = 0;
let waveTimer = 0;
let bannerTimer = 0;
let shake = 0;
let ground;
let cameraFocus;

let alarm;
let sounds;
let radio;
let panel;
let hud;
let banner;
let soundHint;
let waveSizeSlider;
let targetSpeedSlider;
let targetDetectionSlider;
let riposteSlider;
let missileSpeedSlider;
let defendCheckbox;
let gunCheckbox;
let shakeCheckbox;
let voiceCheckbox;

let maxParticles = 500;
let soldiersPerTank = 3;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  buildGround();
  buildDecor();
  aircraft = new Plane(width * 0.2, height * 0.6);
  cameraFocus = createVector(width / 2, height / 2);

  alarm = new Alarm({ frequency: 1200, beepDuration: 0.06, beepGap: 0.06,
    beepCount: 6, cooldown: 3000 });
  sounds = new WarSounds(alarm);

  panel = new ControlPanel('Tâches 3 et 4 — Avion attaquant (3D)', {
  });
  waveSizeSlider = panel.addSlider('Cibles par vague', 1, 10, 5, 1);
  panel.addSlider('Vitesse avion', 0, 15, aircraft.maxSpeed, 0.1, (v) => {
    aircraft.maxSpeed = v;
  });
  panel.addSlider('Détection avion', 50, 1000, aircraft.detectionRadius, 1,
    (v) => {
      aircraft.detectionRadius = v;
    });
  panel.addSlider('Cadence tir (fr.)', 10, 240, aircraft.fireInterval, 1,
    (v) => {
      aircraft.fireInterval = v;
    });
  missileSpeedSlider = panel.addSlider('Vitesse missile', 1, 20, 7, 0.1);
  targetSpeedSlider = panel.addSlider('Vitesse cible', 0, 15, 4, 0.1, (v) => {
    targets.forEach((target) => {
      target.maxSpeed = v;
    });
  });
  targetDetectionSlider = panel.addSlider('Détection cible', 20, 600, 200, 1,
    (v) => {
      targets.forEach((target) => {
        target.detectionRadius = v;
      });
    });
  riposteSlider = panel.addSlider('Cadence riposte', 30, 300, 120, 1, (v) => {
    targets.forEach((target) => {
      target.fireInterval = v;
    });
  });
  defendCheckbox = panel.addCheckbox('Tâche 4 : la cible se défend', true,
    (on) => {
      targets.forEach((target) => {
        target.canDefend = on;
      });
    });
  gunCheckbox = panel.addCheckbox('Mitrailleuse', true);
  shakeCheckbox = panel.addCheckbox('Secousses', true);
  panel.addCheckbox('Son', true, (on) => {
    alarm.enabled = on;
    radio.setVoiceEnabled(on === true && voiceCheckbox.checked() === true);
  });
  voiceCheckbox = panel.addCheckbox('Voix radio', true, (on) => {
    radio.setVoiceEnabled(on === true && alarm.enabled === true);
  });
  panel.addDebugToggle();

  hud = createDiv();
  hud.class('hud');
  banner = createDiv();
  banner.class('banner');
  soundHint = createDiv('Cliquez pour activer le son et la radio');
  soundHint.class('sound-hint');
  radio = new RadioChatter({ onTransmit: () => sounds.radioClick() });

  startNextWave();
}

function draw() {
  simulate();
  render();
  sounds.updateEngine(aircraft.vel.mag() / max(aircraft.maxSpeed, 0.1));
  updateInterface();
}

// ---------------------------------------------------------------------------
// Simulation (steering behaviors dans le plan)
// ---------------------------------------------------------------------------

function simulate() {
  updatePlane();
  updateTargets();
  updateSoldiers();
  updateMissiles();
  updateBullets();
  updateParticles();
  updatePopups();
  blasts = blasts.filter((b) => frameCount - b.frame < 60);
  updateWaves();
}

function updatePlane() {
  aircraft.applyBehaviors(targets);
  aircraft.update();

  // Alarme dès qu'une nouvelle cible entre dans le rayon de l'avion
  // (Alarm impose 3 s minimum entre deux alarmes).
  if (aircraft.newDetection === true) {
    alarm.trigger();
  }
  if (aircraft.justLocked === true) {
    radio.say('lock', ['Cible verrouillée.', 'Je l\'ai dans le viseur.',
      'Contact, char ennemi en vue.', 'J\'engage la cible.'], 6000);
  }

  // Missiles de précision : maniables (maxForce élevé) et endurants.
  let missile = aircraft.tryFire({
    maxSpeed: Number(missileSpeedSlider.value()),
    maxForce: 0.9,
    lifetime: 240,
  });
  if (missile !== null) {
    missiles.push(missile);
    shotsFired += 1;
    sounds.missileLaunch(false);
    radio.say('fox', ['Fox deux !', 'Missile parti !', 'Tir !'], 5000);
  }

  if (gunCheckbox.checked() === true) {
    let bullet = aircraft.tryGun();
    if (bullet !== null) {
      bullets.push(bullet);
      shotsFired += 1;
      sounds.gunShot();
    }
  }
}

function updateTargets() {
  // Les chars ne se méfient que de l'avion et de SES missiles.
  let threats = [aircraft, ...missiles.filter((m) => m.owner === 'plane')];
  targets.forEach((target) => {
    target.applyBehaviors(threats);
    target.update();
    let riposte = target.tryFire(aircraft, {
      maxSpeed: Number(missileSpeedSlider.value()),
    });
    if (riposte !== null) {
      missiles.push(riposte);
      sounds.missileLaunch(true);
      radio.say('incoming', ['Missile en approche !', 'Tir sol-air !',
        'Ils me tirent dessus !'], 7000);
    }
  });
}

function updateSoldiers() {
  let panicking = 0;
  soldiers.forEach((soldier) => {
    let leaderAlive = targets.includes(soldier.leader);
    soldier.applyBehaviors(aircraft, soldiers, blasts, leaderAlive);
    soldier.update();
    if (soldier.isPanicking() === true) {
      panicking += 1;
    }
    let shot = soldier.tryShoot(aircraft);
    if (shot !== null) {
      bullets.push(shot);
      sounds.rifle();
    }
  });
  if (panicking >= 4) {
    radio.say('infantry', ['L\'infanterie se disperse !',
      'Fantassins au sol, ils courent !'], 15000);
  }
  soldiers = soldiers.filter((soldier) => soldier.isGone() === false);
}

function updateMissiles() {
  missiles.forEach((m) => {
    // Cible déjà détruite : le missile se reverrouille sur la plus proche.
    if (m.owner === 'plane' && targets.includes(m.target) === false) {
      let next = nearestTarget(m.pos);
      if (next !== null) {
        m.target = next;
      } else {
        m.age = m.lifetime + 1;
      }
    }

    m.applyBehaviors();
    m.update();

    // Traînée de fumée.
    if (frameCount % 2 === 0) {
      let tail = p5.Vector.fromAngle(m.vel.heading(), -m.r * 2.5).add(m.pos);
      particles.push(new Particle(tail.x, tail.y, {
        type: 'smoke', size: 5, growth: 0.35, lifetime: 30, drag: 0.1,
        z: m.z, vel: p5.Vector.random2D().mult(0.2),
      }));
    }

    if (m.hasHit === true) {
      if (m.owner === 'plane') {
        shotsLanded += 1;
        damageTarget(m.target, 4, m.pos);
      } else {
        aircraft.takeHit();
        planeHits += 1;
        explode(m.pos.x, m.pos.y, m.z, false);
        radio.say('hit', ['Je suis touché ! Ça tient.',
          'Impact ! Systèmes OK.', 'Touché, mais je reste en vol !'], 5000);
      }
    } else if (m.isDead() === true) {
      puff(m.pos.x, m.pos.y, m.z);
    }
  });
  missiles = missiles.filter((m) => m.isDead() === false);
}

function updateBullets() {
  bullets.forEach((b) => {
    b.update();
    if (b.owner !== 'plane') {
      return;
    }
    for (let target of targets) {
      if (p5.Vector.dist(b.pos, target.pos) < target.r + b.r
        && b.z < target.r * 1.6) {
        b.hasHit = true;
        shotsLanded += 1;
        damageTarget(target, b.damage, b.pos);
        return;
      }
    }
    for (let soldier of soldiers) {
      if (soldier.alive === true && b.z < 14
        && p5.Vector.dist(b.pos, soldier.pos) < soldier.r + b.r + 1) {
        b.hasHit = true;
        shotsLanded += 1;
        killSoldier(soldier);
        return;
      }
    }
    if (b.hitGround === true) {
      dust(b.pos.x, b.pos.y);
    }
  });
  bullets = bullets.filter((b) => b.isDead() === false);
}

function updateParticles() {
  particles.forEach((p) => {
    p.applyBehaviors();
    p.update();
  });
  particles = particles.filter((p) => p.isDead() === false);
  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }
}

function updatePopups() {
  popups.forEach((popup) => {
    popup.applyBehaviors();
    popup.update();
    if (popup.isDead() === true) {
      popup.dispose();
    }
  });
  popups = popups.filter((popup) => popup.isDead() === false);
}

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

function nearestTarget(position) {
  let nearest = null;
  let nearestDistance = Infinity;
  targets.forEach((target) => {
    let distance = p5.Vector.dist(position, target.pos);
    if (distance < nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function damageTarget(target, amount, at) {
  if (targets.includes(target) === false) {
    return;
  }
  if (target.takeDamage(amount) === true) {
    destroyTarget(target);
  } else {
    sparks(at.x, at.y, target.r);
    sounds.impact();
  }
}

function destroyTarget(target) {
  kills += 1;
  let points = 100 * wave;
  score += points;
  popups.push(new ScorePopup(target.pos.x, target.pos.y, `+${points}`,
    { z: 40 }));
  explode(target.pos.x, target.pos.y, 10, true);
  addCrater(target.pos.x, target.pos.y);
  targets = targets.filter((t) => t !== target);
  radio.say('kill', ['Char détruit !', 'Cible au tapis !', 'Coup au but !',
    'Il est en feu !', 'Un de moins !'], 3500);

  // Le souffle neutralise les fantassins tout proches.
  soldiers.forEach((soldier) => {
    if (soldier.alive === true
      && p5.Vector.dist(soldier.pos, target.pos) < 70) {
      killSoldier(soldier);
    }
  });
}

function killSoldier(soldier) {
  soldier.die();
  soldierKills += 1;
  score += 10;
}

// Explosion : onde de choc, boule de feu, fumée, étincelles, débris.
function explode(x, y, z, big) {
  let scale = big ? 1 : 0.4;
  particles.push(new Particle(x, y, {
    type: 'shockwave', size: 10, growth: big ? 7 : 4, lifetime: 18,
  }));
  spawnBurst(x, y, z, 'fire', 22 * scale, [0.5, 4 * scale + 1],
    [25, 45], [10, 24], 0.8, [0.5, 2.5]);
  spawnBurst(x, y, z, 'smoke', 14 * scale, [0.3, 2 * scale + 0.5],
    [70, 120], [16, 30], 0.5, [0.3, 1.2]);
  spawnBurst(x, y, z, 'spark', 16 * scale, [3, 8], [14, 24], [2, 2], 0,
    [1, 5]);
  if (big === true) {
    spawnBurst(x, y, z, 'debris', 10, [2, 5], [50, 80], [4, 8], 0, [2, 6]);
    blasts.push({ pos: createVector(x, y), frame: frameCount });
  }
  shake = max(shake, big ? 14 : 5);
  sounds.explosion(big);
}

// Petite gerbe d'étincelles (balle sur blindage).
function sparks(x, y, z) {
  spawnBurst(x, y, z, 'spark', 5, [2, 5], [8, 14], [2, 2], 0, [1, 3]);
}

// Petit nuage quand un missile s'épuise sans toucher.
function puff(x, y, z) {
  spawnBurst(x, y, z, 'smoke', 6, [0.2, 1], [30, 50], [8, 14], 0.4,
    [0, 0.5]);
}

// Poussière soulevée par une balle qui touche le sol.
function dust(x, y) {
  if (random() < 0.5) {
    spawnBurst(x, y, 1, 'dust', 2, [0.2, 0.8], [20, 35], [5, 9], 0.3,
      [0.3, 0.8]);
  }
}

function spawnBurst(x, y, z, type, count, speed, lifetime, size, growth,
  rise) {
  for (let i = 0; i < round(count); i += 1) {
    particles.push(new Particle(x, y, {
      type,
      z,
      vz: random(rise[0], rise[1]),
      vel: p5.Vector.random2D().mult(random(speed[0], speed[1])),
      lifetime: random(lifetime[0], lifetime[1]),
      size: random(size[0], size[1]),
      growth,
    }));
  }
}

// ---------------------------------------------------------------------------
// Vagues
// ---------------------------------------------------------------------------

function startNextWave() {
  wave += 1;
  // Les fantassins survivants sans char se replient (quittent la zone).
  soldiers = soldiers.filter((soldier) => soldier.alive === false
    || targets.includes(soldier.leader));
  let count = min(Number(waveSizeSlider.value()) + wave - 1, 15);
  for (let i = 0; i < count; i += 1) {
    let spawn = findSpawnPoint();
    let tank = new Target(spawn.x, spawn.y, {
      canDefend: defendCheckbox.checked(),
      maxSpeed: Number(targetSpeedSlider.value()),
      detectionRadius: Number(targetDetectionSlider.value()),
      fireInterval: Number(riposteSlider.value()),
    });
    targets.push(tank);
    for (let s = 0; s < soldiersPerTank; s += 1) {
      let offset = p5.Vector.random2D().mult(random(25, 50));
      soldiers.push(new Soldier(spawn.x + offset.x, spawn.y + offset.y,
        { leader: tank }));
    }
  }
  showBanner(`VAGUE ${wave} — ${count} chars ennemis`, 120);
  radio.say('wave', `Vague ${wave}. ${count} chars en approche.`, 0);
}

// Point d'apparition loin de l'avion.
function findSpawnPoint() {
  let spawn = createVector(width / 2, height / 2);
  for (let tries = 0; tries < 30; tries += 1) {
    spawn.set(random(100, width - 100), random(100, height - 100));
    if (p5.Vector.dist(spawn, aircraft.pos) > 350) {
      break;
    }
  }
  return spawn;
}

function updateWaves() {
  if (targets.length === 0 && waveTimer === 0) {
    let bonus = 500 * wave;
    score += bonus;
    waveTimer = 150;
    showBanner(`VAGUE ${wave} NETTOYÉE !  +${bonus}`, 140);
    radio.say('clear', ['Zone nettoyée, beau travail.', 'Secteur dégagé !',
      'Plus aucun char, je reprends de l\'altitude.'], 0);
  }
  if (waveTimer > 0) {
    waveTimer -= 1;
    if (waveTimer === 0) {
      startNextWave();
    }
  }
}

function showBanner(message, duration) {
  banner.html(message);
  bannerTimer = duration;
}

// ---------------------------------------------------------------------------
// Rendu 3D
// ---------------------------------------------------------------------------

function render() {
  background(140, 156, 166);
  setupCamera();
  ambientLight(105, 105, 112);
  directionalLight(255, 244, 222, 0.35, 0.5, -1);

  drawGround();
  drawDecor();
  targets.forEach((target) => target.show());
  soldiers.forEach((soldier) => soldier.show());
  missiles.forEach((m) => m.show());
  bullets.forEach((b) => b.show());
  aircraft.show();

  // Feu, fumée, textes : sans lumière et sans écrire la profondeur
  // (transparence correcte entre particules).
  noLights();
  drawingContext.depthMask(false);
  particles.forEach((p) => p.show());
  popups.forEach((popup) => popup.show());
  drawingContext.depthMask(true);
}

// Caméra de cinéma : basse et inclinée, elle cadre l'action (entre l'avion
// et sa cible verrouillée) et la suit en douceur ; secousses sur l'œil.
function setupCamera() {
  let focus = aircraft.pos.copy();
  if (aircraft.lockedTarget !== null) {
    focus = p5.Vector.lerp(aircraft.pos, aircraft.lockedTarget.pos, 0.5);
  }
  focus.x = constrain(focus.x, width * 0.25, width * 0.75);
  focus.y = constrain(focus.y, height * 0.2, height * 0.8);
  cameraFocus.lerp(focus, 0.04);
  let distance = max(width, height) * 0.42;
  let back = distance;
  let up = distance * 0.62;
  ScorePopup.tilt = HALF_PI - atan2(up, back);

  let jitterX = 0;
  let jitterY = 0;
  if (shakeCheckbox.checked() === true && shake > 0.3) {
    jitterX = random(-shake, shake);
    jitterY = random(-shake, shake);
  }
  shake *= 0.88;
  perspective(PI / 3.2, width / height, 5, distance * 20);
  camera(cameraFocus.x + jitterX, cameraFocus.y + back + jitterY, up,
    cameraFocus.x, cameraFocus.y, 0, 0, 0, -1);
}

function drawGround() {
  noStroke();
  // Plaine qui s'étend au-delà du champ de bataille.
  push();
  translate(width / 2, height / 2, -1);
  fill(80, 79, 50); // teinte moyenne du terrain : pas de bord visible
  plane(width * 8, height * 8);
  pop();
  // Champ de bataille texturé (terrain + cratères).
  push();
  translate(width / 2, height / 2, 0);
  texture(ground);
  plane(width, height);
  pop();
}

// Décor statique (fond) : arbres et ruines. Ils ne bougent jamais et
// n'interagissent pas avec les véhicules, ce ne sont donc pas des Vehicle.
function buildDecor() {
  decor = [];
  for (let i = 0; i < 45; i += 1) {
    decor.push({
      kind: 'tree',
      x: random(-200, width + 200),
      y: random(-200, height + 200),
      size: random(10, 18),
    });
  }
  for (let i = 0; i < 6; i += 1) {
    decor.push({
      kind: 'ruin',
      x: random(80, width - 80),
      y: random(80, height - 80),
      size: random(30, 60),
      angle: random(TWO_PI),
    });
  }
}

function drawDecor() {
  noStroke();
  decor.forEach((item) => {
    push();
    translate(item.x, item.y, 0);
    if (item.kind === 'tree') {
      let s = item.size;
      fill(70, 52, 34);
      push();
      translate(0, 0, s * 0.6);
      box(s * 0.25, s * 0.25, s * 1.2);
      pop();
      fill(42, 66, 34);
      push();
      translate(0, 0, s * 1.6);
      ellipsoid(s * 0.8, s * 0.8, s * 1.1, 8, 6);
      pop();
    } else {
      // Ruine : pans de murs inégaux.
      rotateZ(item.angle);
      fill(120, 112, 98);
      let s = item.size;
      push();
      translate(0, -s / 2, s * 0.3);
      box(s, 4, s * 0.6);
      pop();
      push();
      translate(-s / 2, 0, s * 0.2);
      box(4, s * 0.7, s * 0.4);
      pop();
      push();
      translate(s * 0.2, s * 0.1, 3);
      box(s * 0.3, s * 0.2, 6);
      pop();
    }
    pop();
  });
}

// Fond statique : terrain (bruit de Perlin) + quadrillage, dans une image
// utilisée comme texture du sol ; les cratères y sont ajoutés.
function buildGround() {
  ground = createGraphics(width, height);
  ground.pixelDensity(1);
  ground.noStroke();
  let cell = 10;
  for (let x = 0; x < width; x += cell) {
    for (let y = 0; y < height; y += cell) {
      let n = noise(x * 0.003, y * 0.003);
      let detail = noise(x * 0.03 + 100, y * 0.03 + 100) * 14;
      ground.fill(lerp(52, 96, n) + detail, lerp(62, 84, n) + detail,
        lerp(38, 54, n) + detail * 0.6);
      ground.rect(x, y, cell, cell);
    }
  }
  // Pistes de terre.
  ground.noFill();
  ground.stroke(120, 100, 70, 90);
  ground.strokeWeight(14);
  ground.bezier(0, height * 0.3, width * 0.3, height * 0.1,
    width * 0.6, height * 0.9, width, height * 0.7);
  ground.bezier(width * 0.2, height, width * 0.35, height * 0.5,
    width * 0.7, height * 0.4, width * 0.8, 0);
  // Quadrillage de carte d'état-major.
  ground.stroke(255, 255, 255, 12);
  ground.strokeWeight(1);
  for (let x = 0; x < width; x += 80) {
    ground.line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 80) {
    ground.line(0, y, width, y);
  }
}

function addCrater(x, y) {
  ground.noStroke();
  for (let i = 0; i < 6; i += 1) {
    ground.fill(20, 16, 10, 35);
    ground.circle(x + random(-5, 5), y + random(-5, 5), random(30, 70));
  }
  ground.fill(12, 10, 8, 150);
  ground.circle(x, y, 22);
  for (let i = 0; i < 14; i += 1) {
    let offset = p5.Vector.random2D().mult(random(15, 45));
    ground.fill(15, 12, 8, 120);
    ground.circle(x + offset.x, y + offset.y, random(2, 5));
  }
}

// ---------------------------------------------------------------------------
// Interface (DOM, par-dessus le canvas 3D)
// ---------------------------------------------------------------------------

function updateInterface() {
  if (frameCount % 6 === 0) {
    let precision = shotsFired > 0
      ? round(100 * shotsLanded / shotsFired) : 0;
    hud.html([
      `<b>Score : ${score}</b>`,
      `Vague : ${wave}`,
      `Chars restants : ${targets.length}`,
      `Chars détruits : ${kills}`,
      `Fantassins neutralisés : ${soldierKills}`,
      `Précision : ${precision} %`,
      `Avion touché : ${planeHits}`,
    ].join('<br>'));
  }

  if (bannerTimer > 0) {
    bannerTimer -= 1;
  }
  banner.style('opacity', String(min(1, bannerTimer / 40)));

  let showHint = alarm.enabled === true && alarm.isUnlocked() === false;
  soundHint.style('display', showHint ? 'block' : 'none');
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    panel.toggleDebug();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildGround();
  buildDecor();
}

