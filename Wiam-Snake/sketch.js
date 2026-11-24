// sketch.js — Wiam's Glow Snake ✿
// Écran d'accueil avec le prénom WIAM traversé par un serpent, puis partie :
// la souris dirige, clic maintenu / Espace = turbo, M = son, D = debug.
// Manger des perles fait grandir ; si un serpent touche ton corps avec sa
// tête il meurt ; si TA tête touche un autre serpent, c'est Game Over.

const ARENA_RADIUS = 1700;
const FOOD_COUNT = 380;
const ENEMY_COUNT = 8;

let state = 'intro';
let music;
let introSnake;
let introClicked = false;
let player;
let snakes = [];
let foods = [];
let particles = [];
let popups = [];
let respawnAt = [];
let cam;
let zoom = 1;
let shake = 0;
let score = 0;
let kills = 0;
let best = 0;
let newRecord = false;
let combo = 0;
let lastEatFrame = 0;
let killerName = '';
let overFrame = 0;
let spaceDown = false;
let bgTile;
let vignette;

// Monde partagé avec les classes (lecture seule pour elles).
let world = {
  arenaRadius: ARENA_RADIUS,
  startFrame: 0,
  snakes: [],
  foods: [],
  player: null,
  dropFood(pos, hex, value) {
    foods.push(new Food(pos.x, pos.y, { hex, value, r: random(5, 7) }));
  },
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(displayDensity(), 1.5));
  textFont("Fredoka, 'Trebuchet MS', 'Segoe UI', sans-serif");
  music = new MusicBox();
  bgTile = makeBackgroundTile();
  vignette = makeVignette();
  best = loadBest();
  cam = createVector(0, 0);
  setupIntro();
}

function draw() {
  if (state === 'intro') {
    drawIntro();
  } else {
    drawGame();
  }
  drawCursor();
}

// ---------------------------------------------------------------------------
// Accueil
// ---------------------------------------------------------------------------

function setupIntro() {
  let a = min(width * 0.42, 640);
  let b = min(height * 1.05, 760);
  let points = IntroSnake.figureEight(width / 2, height / 2, a, b);
  introSnake = new IntroSnake(points); nameDots = makeNameDots();
  particles = [];
}

function drawIntro() {
  drawScreenBackground(frameCount * 0.4);

  // Cœurs et étincelles qui montent autour du prénom.
  if (frameCount % 3 === 0) {
    let x = width / 2 + random(-width * 0.35, width * 0.35);
    let y = height / 2 + random(-60, 120);
    particles.push(new Particle(x, y, random(Food.COLORS), {
      vel: createVector(random(-0.4, 0.4), random(-1.6, -0.6)),
      heart: random() < 0.45,
      r: random(3, 7),
      decay: random(0.006, 0.012),
      gravity: -0.01,
    }));
  }
  updateAndShow(particles);

  drawNameDots();
  introSnake.applyBehaviors(world);
  introSnake.update(null);
  introSnake.show({ left: 0, top: 0, right: width, bottom: height });

  // Textes.
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  let pulse = 0.6 + 0.4 * sin(frameCount * 0.08);
  fill(255, 230, 245);
  drawingContext.shadowColor = '#ff4fa3';
  drawingContext.shadowBlur = 18;
  textSize(min(width * 0.03, 26));
  text('✿  glow snake party  ✿', width / 2, height / 2 - height * 0.24);

  textSize(min(width * 0.035, 30));
  fill(255, 255, 255, 120 + pulse * 135);
  let prompt = introClicked
    ? 'Clique pour jouer ♡'
    : 'Clique pour lancer la musique ♪';
  text(prompt, width / 2, height / 2 + height * 0.25);

  drawingContext.shadowBlur = 0;
  textSize(15);
  fill(230, 200, 255, 200);
  text('Souris : diriger   ·   Clic maintenu ou Espace : turbo   ·   M : son',
    width / 2, height / 2 + height * 0.25 + 42);
  if (best > 0) {
    text(`Record : ${best}`, width / 2, height / 2 + height * 0.25 + 68);
  }
  pop();
}

// Le prénom WIAM, lettre par lettre, qui flotte et brille.
function drawTitle() {
  let letters = ['W', 'I', 'A', 'M'];
  let colors = ['#ff4fa3', '#b388ff', '#ff9de2', '#7fc8ff'];
  let size = min(width * 0.19, 230);
  push();
  textSize(size);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  let widths = letters.map((letter) => textWidth(letter) + size * 0.08);
  let total = widths.reduce((sum, w) => sum + w, 0);
  let x = width / 2 - total / 2;
  letters.forEach((letter, i) => {
    let bob = sin(frameCount * 0.05 + i * 0.9) * size * 0.04;
    let cx = x + widths[i] / 2;
    drawingContext.shadowColor = colors[i];
    drawingContext.shadowBlur = 45;
    stroke(colors[i]);
    strokeWeight(size * 0.05);
    fill('#fff0f8');
    text(letter, cx, height / 2 + bob);
    drawingContext.shadowBlur = 15;
    text(letter, cx, height / 2 + bob);
    x += widths[i];
  });
  pop();
}

// ---------------------------------------------------------------------------
// Partie
// ---------------------------------------------------------------------------

function startGame() {
  score = 0;
  kills = 0;
  combo = 0;
  newRecord = false;
  particles = [];
  popups = [];
  respawnAt = [];
  player = new PlayerSnake(0, 0);
  snakes = [player];
  for (let i = 0; i < ENEMY_COUNT; i += 1) {
    spawnEnemy();
  }
  foods = [];
  while (foods.length < FOOD_COUNT) {
    spawnFood();
  }
  cam = player.pos.copy();
  zoom = 1.1;
  world.startFrame = frameCount;
  state = 'play';
  music.start();
  music.setMusicVolume(0.5);
}

function randomArenaPoint(margin = 300) {
  let angle = random(TWO_PI);
  let distance = sqrt(random()) * (ARENA_RADIUS - margin);
  return p5.Vector.fromAngle(angle, distance);
}

function spawnEnemy() {
  let p = randomArenaPoint();
  for (let tries = 0; tries < 30; tries += 1) {
    if (p5.Vector.dist(p, player.pos) > 750) {
      break;
    }
    p = randomArenaPoint();
  }
  let maxLength = constrain(player.length * 1.4, 28, 120);
  let used = snakes.map((snake) => snake.name);
  let enemy = new EnemySnake(p.x, p.y, floor(random(8, maxLength)), used);
  snakes.push(enemy);
}

function spawnFood() {
  let p = randomArenaPoint(60);
  foods.push(new Food(p.x, p.y));
}

function drawGame() {
  world.snakes = snakes;
  world.foods = foods;
  world.player = player;

  if (state === 'play') {
    let target = mouseToWorld(mouseX, mouseY);
    player.setTarget(target.x, target.y);
    player.boosting = mouseIsPressed === true || spaceDown === true;
  }

  // Simulation.
  snakes.forEach((snake) => {
    if (snake.alive === false) {
      return;
    }
    snake.applyBehaviors(world);
    snake.update(world);
    if (snake === player && snake.boosting === true && frameCount % 3 === 0
      && snake.length > 8) {
      let tail = snake.segments[snake.length - 1];
      particles.push(new Particle(tail.pos.x, tail.pos.y, '#ff9de2',
        { speed: random(0.5, 1.5), r: random(2, 4) }));
    }
  });
  handleCollisions();
  handleFood();
  handleRespawns();

  // Caméra : suit Wiam et dézoome quand elle grandit.
  if (player.alive === true) {
    cam.lerp(player.pos, 0.12);
    let targetZoom = constrain(1.1 - player.length * 0.0035, 0.6, 1.1);
    zoom = lerp(zoom, targetZoom, 0.03);
  }
  shake *= 0.88;

  // Rendu du monde.
  background('#12061f');
  push();
  translate(width / 2 + random(-shake, shake), height / 2 + random(-shake, shake));
  scale(zoom);
  translate(-cam.x, -cam.y);
  let view = currentView();
  drawWorldBackground(view);
  imageMode(CENTER);
  foods.forEach((food) => {
    if (isInView(food.pos, view)) {
      food.show();
    }
  });
  snakes.forEach((snake) => {
    if (snake !== player && snake.alive === true) {
      snake.show(view);
    }
  });
  if (player.alive === true) {
    player.show(view);
    if (isShielded()) {
      drawShield();
    }
  }
  snakes.forEach((snake) => {
    if (snake !== player && snake.alive === true
      && isInView(snake.pos, view)) {
      snake.drawName();
    }
  });
  updateAndShow(particles);
  updateAndShow(popups);
  pop();

  // Interface.
  imageMode(CORNER);
  image(vignette, 0, 0, width, height);
  drawHud();
  drawLeaderboard();
  drawMinimap();
  if (state === 'over') {
    drawGameOver();
  }
}

function handleCollisions() {
  let deaths = [];
  snakes.forEach((snake) => {
    if (snake.alive === false) {
      return;
    }
    if (snake.pos.mag() > ARENA_RADIUS) {
      deaths.push({ victim: snake, killer: null });
      return;
    }
    // Bulle de protection de Wiam pendant les 3 premières secondes.
    if (snake === player && isShielded()) {
      return;
    }
    for (let other of snakes) {
      if (other === snake || other.alive === false) {
        continue;
      }
      // Tête contre tête : le plus petit perd.
      if (p5.Vector.dist(snake.pos, other.pos) < (snake.r + other.r) * 0.8) {
        if (snake.length <= other.length) {
          deaths.push({ victim: snake, killer: other });
          return;
        }
        continue;
      }
      let reach = other.length * other.spacing() + 200;
      if (p5.Vector.dist(snake.pos, other.pos) > reach) {
        continue;
      }
      for (let segment of other.segments) {
        let dx = abs(segment.pos.x - snake.pos.x);
        let dy = abs(segment.pos.y - snake.pos.y);
        if (dx > 60 || dy > 60) {
          continue;
        }
        if (p5.Vector.dist(snake.pos, segment.pos)
          < snake.r * 0.6 + segment.r * 0.8) {
          deaths.push({ victim: snake, killer: other });
          return;
        }
      }
    }
  });
  deaths.forEach((death) => killSnake(death.victim, death.killer));
  snakes = snakes.filter((snake) => snake.alive === true
    || snake === player);
}

function killSnake(victim, killer) {
  if (victim.alive === false) {
    return;
  }
  victim.alive = false;

  // Le corps se transforme en grosses perles brillantes.
  victim.segments.forEach((segment, i) => {
    if (i % 2 === 0) {
      foods.push(new Food(segment.pos.x + random(-8, 8),
        segment.pos.y + random(-8, 8),
        { hex: segment.hex, value: 2, r: random(7, 10) }));
    }
  });
  burst(victim.pos, victim.palette, 40);

  if (victim === player) {
    state = 'over';
    overFrame = frameCount;
    killerName = killer ? killer.name : 'le bord de l\'arène';
    shake = 18;
    if (score > best) {
      best = score;
      newRecord = true;
      saveBest(best);
    }
    music.gameOver();
    music.setMusicVolume(0.2);
    return;
  }

  if (killer === player) {
    kills += 1;
    let bonus = 50 + victim.length * 3;
    score += bonus;
    popups.push(new ScorePopup(victim.pos.x, victim.pos.y, `+${bonus} ♡`,
      '#ff4fa3', 30));
    shake = 8;
    music.kill();
  }
  respawnAt.push(frameCount + 150);
}

function isShielded() {
  return frameCount - world.startFrame < 180;
}

function drawShield() {
  push();
  noFill();
  let pulse = 1 + 0.08 * sin(frameCount * 0.3);
  drawingContext.shadowColor = '#ff9de2';
  drawingContext.shadowBlur = 25;
  stroke(255, 200, 235, 200);
  strokeWeight(3);
  circle(player.pos.x, player.pos.y, player.r * 5 * pulse);
  pop();
}

function handleFood() {
  foods.forEach((food) => {
    food.applyBehaviors(snakes);
    food.update();
    let eater = food.isEatenBy();
    if (eater === null) {
      return;
    }
    food.eaten = true;
    eater.grow(food.value);
    if (eater === player && state === 'play') {
      combo = frameCount - lastEatFrame < 40 ? combo + 1 : 0;
      lastEatFrame = frameCount;
      score += 10 * food.value;
      music.eat(combo);
      if (combo % 3 === 0) {
        popups.push(new ScorePopup(food.pos.x, food.pos.y - 10,
          `+${10 * food.value}`, food.hex, 16));
      }
    }
  });
  foods = foods.filter((food) => food.eaten === false);
  while (foods.length < FOOD_COUNT) {
    spawnFood();
  }
}

function handleRespawns() {
  respawnAt = respawnAt.filter((time) => {
    if (frameCount >= time) {
      spawnEnemy();
      return false;
    }
    return true;
  });
}

function burst(pos, palette, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push(new Particle(pos.x, pos.y, random(palette), {
      speed: random(2, 8),
      heart: i % 4 === 0,
      r: random(3, 7),
    }));
  }
}

// Met à jour, dessine et retire les éléments terminés.
function updateAndShow(list) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    let item = list[i];
    item.applyBehaviors();
    item.update();
    if (item.isDead()) {
      list.splice(i, 1);
    } else {
      item.show();
    }
  }
}

// ---------------------------------------------------------------------------
// Caméra et décor
// ---------------------------------------------------------------------------

function mouseToWorld(x, y) {
  return createVector((x - width / 2) / zoom + cam.x,
    (y - height / 2) / zoom + cam.y);
}

function currentView() {
  let halfW = width / 2 / zoom;
  let halfH = height / 2 / zoom;
  return {
    left: cam.x - halfW,
    right: cam.x + halfW,
    top: cam.y - halfH,
    bottom: cam.y + halfH,
  };
}

function isInView(pos, view, margin = 40) {
  return pos.x > view.left - margin && pos.x < view.right + margin
    && pos.y > view.top - margin && pos.y < view.bottom + margin;
}

function makeBackgroundTile() {
  let size = 256;
  let g = createGraphics(size, size);
  g.pixelDensity(1);
  g.background('#1b0a2e');
  g.noFill();
  // Motif d'écailles douces.
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      let x = col * 32 + (row % 2) * 16;
      let y = row * 32;
      g.stroke(255, 140, 210, 18);
      g.strokeWeight(1.5);
      g.circle(x, y, 30);
    }
  }
  g.noStroke();
  for (let i = 0; i < 14; i += 1) {
    g.fill(255, 255, 255, random(30, 90));
    g.circle(random(size), random(size), random(1, 2.5));
  }
  return g;
}

function makeVignette() {
  let g = createGraphics(width, height);
  g.pixelDensity(1);
  let ctx = g.drawingContext;
  let gradient = ctx.createRadialGradient(width / 2, height / 2,
    min(width, height) * 0.35, width / 2, height / 2, max(width, height) * 0.75);
  gradient.addColorStop(0, 'rgba(18, 0, 30, 0)');
  gradient.addColorStop(1, 'rgba(18, 0, 30, 0.75)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  return g;
}

function drawScreenBackground(offset) {
  background('#12061f');
  imageMode(CORNER);
  let size = 256;
  let shift = offset % size;
  for (let x = -size; x < width + size; x += size) {
    for (let y = -size; y < height + size; y += size) {
      image(bgTile, x + shift, y + shift * 0.5, size, size);
    }
  }
  image(vignette, 0, 0, width, height);
}

function drawWorldBackground(view) {
  imageMode(CORNER);
  let size = 256;
  let startX = floor(view.left / size) * size;
  let startY = floor(view.top / size) * size;
  for (let x = startX; x < view.right; x += size) {
    for (let y = startY; y < view.bottom; y += size) {
      image(bgTile, x, y, size, size);
    }
  }

  // Hors de l'arène : nuit profonde.
  push();
  noFill();
  stroke(10, 0, 20, 235);
  strokeWeight(4000);
  circle(0, 0, (ARENA_RADIUS + 2000) * 2);

  // Bord de l'arène : anneau néon rose.
  drawingContext.shadowColor = '#ff4fa3';
  drawingContext.shadowBlur = 30;
  stroke('#ff4fa3');
  strokeWeight(8);
  circle(0, 0, ARENA_RADIUS * 2);
  drawingContext.shadowBlur = 0;
  stroke(255, 160, 220, 60);
  strokeWeight(2);
  circle(0, 0, ARENA_RADIUS * 2 - 40);
  pop();
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

function drawHud() {
  push();
  noStroke();
  fill(40, 10, 60, 150);
  rect(16, 16, 230, 132, 18);
  drawingContext.shadowColor = '#ff4fa3';
  drawingContext.shadowBlur = 16;
  fill('#ffe6f3');
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(16);
  text('✿ SCORE', 32, 28);
  textSize(38);
  text(score, 32, 48);
  drawingContext.shadowBlur = 0;
  textStyle(NORMAL);
  textSize(15);
  fill(240, 210, 255);
  text(`Longueur : ${player.length}`, 32, 96);
  text(`Victimes : ${kills}`, 140, 96);
  text(`Record : ${max(best, score)}`, 32, 118);
  pop();
}

function drawLeaderboard() {
  let ranking = snakes.filter((snake) => snake.alive === true)
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);
  push();
  noStroke();
  fill(40, 10, 60, 150);
  rect(width - 216, 16, 200, 40 + ranking.length * 24, 18);
  textAlign(LEFT, TOP);
  textSize(15);
  textStyle(BOLD);
  fill('#ffe6f3');
  text('♛ Top serpents', width - 200, 28);
  textStyle(NORMAL);
  ranking.forEach((snake, i) => {
    let y = 54 + i * 24;
    if (snake === player) {
      fill('#ff8cc6');
      textStyle(BOLD);
    } else {
      fill(235, 215, 255);
      textStyle(NORMAL);
    }
    text(`${i + 1}. ${snake.name}`, width - 200, y);
    textAlign(RIGHT, TOP);
    text(snake.length, width - 30, y);
    textAlign(LEFT, TOP);
  });
  pop();
}

function drawMinimap() {
  let radius = 70;
  let cx = width - radius - 22;
  let cy = height - radius - 22;
  let k = radius / ARENA_RADIUS;
  push();
  noStroke();
  fill(40, 10, 60, 170);
  circle(cx, cy, radius * 2 + 10);
  stroke(255, 79, 163, 160);
  strokeWeight(2);
  noFill();
  circle(cx, cy, radius * 2);
  noStroke();
  snakes.forEach((snake) => {
    if (snake.alive === false) {
      return;
    }
    let size = 3 + sqrt(snake.length) * 0.5;
    if (snake === player) {
      drawingContext.shadowColor = '#ff4fa3';
      drawingContext.shadowBlur = 10;
      fill('#ff4fa3');
      size += 3;
    } else {
      drawingContext.shadowBlur = 0;
      fill(snake.palette[0]);
    }
    circle(cx + snake.pos.x * k, cy + snake.pos.y * k, size);
  });
  pop();
}

function drawGameOver() {
  push();
  noStroke();
  fill(20, 0, 35, min((frameCount - overFrame) * 6, 150));
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  let size = min(width * 0.11, 120);
  textSize(size);
  let title = 'GAME OVER';
  let colors = ['#ff4fa3', '#ff9de2', '#b388ff'];
  let total = textWidth('GAMEOVER') + size * 0.35;
  let x = width / 2 - total / 2;
  for (let i = 0; i < title.length; i += 1) {
    let letter = title[i];
    let w = letter === ' ' ? size * 0.35 : textWidth(letter);
    let bob = sin(frameCount * 0.07 + i * 0.6) * 8;
    drawingContext.shadowColor = colors[i % colors.length];
    drawingContext.shadowBlur = 35;
    stroke(colors[i % colors.length]);
    strokeWeight(5);
    fill('#fff0f8');
    text(letter, x + w / 2, height / 2 - size * 0.6 + bob);
    x += w;
  }
  noStroke();
  drawingContext.shadowBlur = 14;
  drawingContext.shadowColor = '#ff4fa3';
  fill('#ffe6f3');
  textSize(34);
  text(`Score : ${score}`, width / 2, height / 2 + 30);
  textStyle(NORMAL);
  textSize(20);
  fill(235, 215, 255);
  let record = newRecord ? 'Nouveau record ! ✨' : `Record : ${best}`;
  text(record, width / 2, height / 2 + 72);
  text(`Attrapée par ${killerName}  ·  ${kills} victime(s)  ·  longueur ${player.length}`,
    width / 2, height / 2 + 104);
  if (frameCount - overFrame > 45) {
    let pulse = 0.6 + 0.4 * sin(frameCount * 0.08);
    fill(255, 255, 255, 120 + pulse * 135);
    textSize(26);
    text('Clique pour rejouer ♡', width / 2, height / 2 + 160);
  }
  pop();
}

function drawCursor() {
  Particle.drawHeart(mouseX, mouseY, 20, '#ff4fa3');
}

// ---------------------------------------------------------------------------
// Record (navigateur)
// ---------------------------------------------------------------------------

function loadBest() {
  try {
    return Number(localStorage.getItem('wiamSnakeBest')) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem('wiamSnakeBest', String(value));
  } catch (error) {
    // Stockage indisponible : le record ne sera pas conservé.
  }
}

// ---------------------------------------------------------------------------
// Entrées
// ---------------------------------------------------------------------------

function mousePressed() {
  music.unlock();
  music.startMusic();
  if (state === 'intro') {
    if (introClicked === false) {
      introClicked = true;
      return;
    }
    startGame();
  } else if (state === 'over' && frameCount - overFrame > 45) {
    startGame();
  }
}

function keyPressed() {
  if (key === ' ') {
    spaceDown = true;
    return false;
  }
  if (key === 'm' || key === 'M') {
    music.toggleMute();
  }
  if (key === 'd' || key === 'D') {
    Vehicle.debug = !Vehicle.debug;
  }
  if (keyCode === ENTER) {
    mousePressed();
  }
  return true;
}

function keyReleased() {
  if (key === ' ') {
    spaceDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  vignette = makeVignette();
  if (state === 'intro') {
    setupIntro();
  }
}

// ---------------------------------------------------------------------------
// Prénom en perles (écran d'accueil)
// ---------------------------------------------------------------------------

let nameDots = [];

// Écrit WIAM dans une image cachée, puis place une perle sur chaque point
// rempli de la grille : chaque perle est un NameDot (Vehicle).
function makeNameDots() {
  let size = min(width * 0.2, 240);
  let g = createGraphics(width, height);
  g.pixelDensity(1);
  g.textFont("Fredoka, 'Trebuchet MS', 'Segoe UI', sans-serif");
  g.textStyle(BOLD);
  g.textSize(size);
  g.textAlign(CENTER, CENTER);
  g.fill(255);
  g.text('WIAM', width / 2, height / 2);
  g.loadPixels();

  let colors = ['#ff4fa3', '#b388ff', '#ff9de2', '#7fc8ff'];
  let step = max(7, floor(size / 19));
  let dots = [];
  for (let y = 0; y < g.height; y += step) {
    for (let x = 0; x < g.width; x += step) {
      let alpha = g.pixels[4 * (y * g.width + x) + 3];
      if (alpha > 128) {
        let t = constrain((x - width * 0.25) / (width * 0.5), 0, 0.999);
        let hex = colors[floor(t * colors.length)];
        dots.push(new NameDot(x, y, hex));
      }
    }
  }
  g.remove();
  return dots;
}

function drawNameDots() {
  imageMode(CENTER);
  nameDots.forEach((dot) => {
    dot.applyBehaviors(introSnake);
    dot.update();
    dot.show();
  });
}
