// EnemySnake.js
// Serpent ennemi : il erre, cherche la nourriture, évite les corps devant
// lui, et s'il est plus grand que Wiam il essaie de lui couper la route.

class EnemySnake extends Snake {
  static NAMES = ['Bubblegum', 'Mochi', 'Lilac', 'Peachy', 'Minty', 'Sugar',
    'Cupcake', 'Daisy', 'Cherry', 'Marshmallow', 'Kiwi', 'Luna'];

  static PALETTES = [
    ['#b388ff', '#e1ccff'],
    ['#5ff5d2', '#c8fff1'],
    ['#ffb38a', '#ffe0cc'],
    ['#7fc8ff', '#d2ecff'],
    ['#ffe066', '#fff4c2'],
    ['#ff7a8a', '#ffd0d6'],
    ['#9d7bff', '#7fc8ff'],
    ['#ff9de2', '#b388ff'],
  ];

  constructor(x, y, startLength, usedNames = []) {
    let free = EnemySnake.NAMES.filter((name) => !usedNames.includes(name));
    super(x, y, {
      name: random(free.length > 0 ? free : EnemySnake.NAMES),
      palette: random(EnemySnake.PALETTES),
      baseSpeed: random(3.6, 4.4),
      boostSpeed: 7.5,
      maxForce: 0.4,
      startLength,
    });
    this.foodTarget = null;
    this.thinkOffset = floor(random(20));
    this.wanderJitter = 0.25;
    // Seule une partie des ennemis chasse Wiam : les autres sont pacifiques.
    this.aggressive = random() < 0.5;
  }

  // Corps (d'un autre serpent, ou le sien loin derrière) juste devant ?
  avoidBodies(snakes) {
    let ahead = this.vel.copy().setMag(this.r * 5);
    ahead.add(this.pos);
    let danger = null;
    let best = Infinity;
    snakes.forEach((snake) => {
      if (snake.alive === false) {
        return;
      }
      let reach = snake.length * snake.spacing() + 250;
      if (p5.Vector.dist(this.pos, snake.pos) > reach) {
        return;
      }
      let start = snake === this ? 14 : 0;
      for (let i = start; i < snake.segments.length; i += 2) {
        let segment = snake.segments[i];
        let d = p5.Vector.dist(ahead, segment.pos);
        if (d < segment.r + this.r * 2 && d < best) {
          best = d;
          danger = segment;
        }
      }
    });
    if (danger === null) {
      return createVector(0, 0);
    }
    return this.flee(danger.pos);
  }

  nearestFood(foods, range = 450) {
    let closest = null;
    let best = range;
    foods.forEach((food) => {
      let d = p5.Vector.dist(this.pos, food.pos);
      if (d < best) {
        best = d;
        closest = food;
      }
    });
    return closest;
  }

  decide(world) {
    let force = createVector(0, 0);
    force.add(this.stayInArena(world.arenaRadius).mult(4));
    force.add(this.avoidBodies(world.snakes).mult(3));

    let player = world.player;
    this.boosting = false;
    let distanceToPlayer = p5.Vector.dist(this.pos, player.pos);
    let isBigger = this.length > player.length * 1.2;
    let graceOver = frameCount - (world.startFrame ?? 0) > 300;

    if (this.aggressive === true && graceOver && player.alive === true
      && isBigger && distanceToPlayer < 320) {
      // Chasse : viser devant la tête de Wiam pour lui couper la route.
      let cut = player.vel.copy().setMag(player.r * 7);
      cut.add(player.pos);
      force.add(this.seek(cut).mult(1.3));
      this.boosting = distanceToPlayer < 200;
      this.lookTarget = player.pos;
      return force;
    }

    if (frameCount % 20 === this.thinkOffset || this.foodTarget === null
      || this.foodTarget.eaten === true) {
      this.foodTarget = this.nearestFood(world.foods);
    }
    if (this.foodTarget !== null) {
      force.add(this.seek(this.foodTarget.pos));
      this.lookTarget = this.foodTarget.pos;
    } else {
      force.add(this.wander());
      this.lookTarget = null;
    }
    return force;
  }
}
