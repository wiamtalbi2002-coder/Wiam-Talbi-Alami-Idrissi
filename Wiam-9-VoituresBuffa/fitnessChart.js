// fitnessChart.js — courbe de progression : à chaque génération, la part du
// circuit faite par la meilleure voiture (rose) et la moyenne (bleu).
// C'est la preuve que l'algorithme génétique apprend.

class FitnessChart {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  show(history) {
    push();
    noStroke();
    fill(15, 10, 30, 210);
    rect(this.x, this.y, this.w, this.h, 10);
    fill(255);
    textSize(13);
    textAlign(LEFT, TOP);
    text('📈 Progrès par génération', this.x + 10, this.y + 8);
    const gx = this.x + 30;
    const gy = this.y + 30;
    const gw = this.w - 42;
    const gh = this.h - 48;
    stroke(255, 40);
    for (let k = 0; k <= 4; k++) {
      line(gx, gy + (gh * k) / 4, gx + gw, gy + (gh * k) / 4);
    }
    noStroke();
    fill(180);
    textSize(9);
    textAlign(RIGHT, CENTER);
    text('100%', gx - 3, gy);
    text('0', gx - 3, gy + gh);
    const data = history.slice(-60);
    const dessine = (key, c) => {
      noFill();
      stroke(c);
      strokeWeight(2);
      beginShape();
      data.forEach((d, i) => vertex(gx + (data.length === 1 ? 0 : (i * gw) / (data.length - 1)),
        gy + gh - min(1, d[key]) * gh));
      endShape();
    };
    if (data.length > 0) {
      dessine('avg', color(90, 160, 255));
      dessine('best', color(255, 90, 180));
    } else {
      fill(180);
      textAlign(CENTER, CENTER);
      text('la 1re génération roule…', gx + gw / 2, gy + gh / 2);
    }
    pop();
  }
}
