// target.js
// Target : sous-classe de Vehicle (règle : une classe par fichier, elle
// était avant à la fin de vehicle.js). Sert de cible pour l'exercice de la
// grille 4 × 5 : immobile au début (maxSpeed = 0), elle reçoit ensuite une
// vitesse aléatoire et part hors de l'écran.
// visible = false : cible invisible (variante « effet plus joli »).

class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = createVector(0, 0);
    this.maxSpeed = 0;
    this.r = 8;
    this.visible = true;
  }

  // Part dans une direction aléatoire (appelé après les 2 secondes).
  partir() {
    this.maxSpeed = random(2, 5);
    this.vel = p5.Vector.random2D().mult(this.maxSpeed);
  }

  show() {
    if (this.visible === false) {
      return;
    }
    push();
    stroke(255);
    strokeWeight(2);
    fill("#F063A4");
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}
