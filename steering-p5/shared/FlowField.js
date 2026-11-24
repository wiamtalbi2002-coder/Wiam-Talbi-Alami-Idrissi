// FlowField.js
// Grille de vecteurs pour le comportement Flow field following.
// Ce n'est pas un Vehicle : c'est un champ de données, pas un agent.

class FlowField {
  constructor(resolution = 20, noiseScale = 0.1) {
    this.resolution = resolution;
    this.noiseScale = noiseScale;
    this.cols = ceil(width / resolution);
    this.rows = ceil(height / resolution);
    this.field = [];
    this.generate();
  }

  // Remplit la grille avec un bruit de Perlin (zOffset permet d'animer).
  generate(zOffset = 0) {
    this.field = [];
    for (let col = 0; col < this.cols; col += 1) {
      let column = [];
      for (let row = 0; row < this.rows; row += 1) {
        let n = noise(col * this.noiseScale, row * this.noiseScale, zOffset);
        column.push(p5.Vector.fromAngle(n * TWO_PI * 2));
      }
      this.field.push(column);
    }
  }

  lookup(position) {
    let col = constrain(floor(position.x / this.resolution), 0, this.cols - 1);
    let row = constrain(floor(position.y / this.resolution), 0, this.rows - 1);
    return this.field[col][row];
  }

  show() {
    push();
    stroke(255, 60);
    strokeWeight(1);
    for (let col = 0; col < this.cols; col += 1) {
      for (let row = 0; row < this.rows; row += 1) {
        let x = (col + 0.5) * this.resolution;
        let y = (row + 0.5) * this.resolution;
        let v = p5.Vector.mult(this.field[col][row], this.resolution * 0.4);
        line(x - v.x, y - v.y, x + v.x, y + v.y);
      }
    }
    pop();
  }
}
