// brainView.js — dessine le cerveau de la voiture en tête, EN DIRECT.
// Cercles = neurones (clair = très activé), traits = poids
// (rose = positif, bleu = négatif, épaisseur = force du poids).
// On voit par exemple un rayon de gauche qui s'allume et la sortie
// « direction » qui part vers la droite.

class BrainView {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  show(car, nomsEntrees) {
    push();
    noStroke();
    fill(15, 10, 30, 210);
    rect(this.x, this.y, this.w, this.h, 10);
    fill(255);
    textSize(13);
    textAlign(LEFT, TOP);
    text('🧠 Cerveau de la voiture en tête', this.x + 10, this.y + 8);
    if (!car) {
      pop();
      return;
    }
    const nn = car.brain;
    const acts = nn.activations;
    const sizes = nn.sizes;
    const top = this.y + 34;
    const hauteur = this.h - 50;
    const colX = (l) => this.x + 62 + (l * (this.w - 120)) / (sizes.length - 1);
    const rowY = (l, i) => top + ((i + 0.5) * hauteur) / sizes[l];

    // poids
    for (let l = 0; l < nn.weights.length; l++) {
      nn.weights[l].forEach((row, j) => row.forEach((w, i) => {
        stroke(w > 0 ? color(255, 90, 180, 150) : color(90, 160, 255, 150));
        strokeWeight(min(3, abs(w) * 1.2));
        line(colX(l), rowY(l, i), colX(l + 1), rowY(l + 1, j));
      }));
    }
    // neurones
    for (let l = 0; l < sizes.length; l++) {
      for (let i = 0; i < sizes[l]; i++) {
        const a = acts[l] ? acts[l][i] : 0;
        const v = l === sizes.length - 1 ? a : (a + 1) / 2;
        stroke(255);
        strokeWeight(1);
        fill(lerpColor(color(30, 20, 50), color(255, 240, 120), constrain(l === 0 ? a : v, 0, 1)));
        circle(colX(l), rowY(l, i), min(16, hauteur / sizes[l] - 2));
      }
    }
    // étiquettes
    noStroke();
    fill(220);
    textSize(10);
    textAlign(RIGHT, CENTER);
    nomsEntrees.forEach((n, i) => text(n, colX(0) - 12, rowY(0, i)));
    textAlign(LEFT, CENTER);
    const out = acts[acts.length - 1] || [0.5, 0.5];
    const dir = out[0] < 0.45 ? '← gauche' : out[0] > 0.55 ? 'droite →' : '↑ tout droit';
    text(dir, colX(sizes.length - 1) + 12, rowY(sizes.length - 1, 0));
    text('vitesse ' + round(out[1] * 100) + '%', colX(sizes.length - 1) + 12, rowY(sizes.length - 1, 1));
    pop();
  }
}
