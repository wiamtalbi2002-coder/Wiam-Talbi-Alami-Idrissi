// wiamProgressChart.js — (ajout de Wiam) la preuve que ça apprend.
// Après chaque course : pourcentage de voitures arrivées et meilleure
// progression (checkpoints). Dessiné dans un coin du canvas de Bruno.

class WiamProgressChart {
  constructor() {
    this.history = []; // { reussite, meilleure }
    this.record = 0;
  }

  // Appelée juste avant que Bruno ne passe à la course suivante.
  // Renvoie true si c'est un nouveau record de réussite.
  enregistrer(gen, track) {
    const finies = gen.lists.finished.length;
    const mortes = gen.lists.dead.length;
    const total = finies + mortes;
    if (total === 0) {
      return false;
    }
    const n = track.checkpoints.length * (track.laps || 1);
    let meilleure = 0;
    gen.lists.finished.concat(gen.lists.dead).forEach((v) => {
      meilleure = max(meilleure, (v.points || 0) / n);
    });
    const reussite = finies / total;
    this.history.push({ reussite, meilleure: min(1, meilleure) });
    const record = reussite > this.record;
    this.record = max(this.record, reussite);
    return record;
  }

  show(x, y, w, h) {
    push();
    noStroke();
    fill(10, 16, 30, 215);
    rect(x, y, w, h, 10);
    fill(255);
    textSize(13);
    textAlign(LEFT, TOP);
    text('📈 Wiam : progrès par course', x + 10, y + 8);
    const gx = x + 12, gy = y + 30, gw = w - 24, gh = h - 74;
    stroke(255, 40);
    for (let k = 0; k <= 2; k++) {
      line(gx, gy + (gh * k) / 2, gx + gw, gy + (gh * k) / 2);
    }
    const data = this.history.slice(-40);
    const trace = (key, c) => {
      noFill();
      stroke(c);
      strokeWeight(2);
      beginShape();
      data.forEach((d, i) => vertex(gx + (data.length === 1 ? 0 : (i * gw) / (data.length - 1)),
        gy + gh - d[key] * gh));
      endShape();
    };
    if (data.length) {
      trace('meilleure', color(90, 160, 255));
      trace('reussite', color(255, 90, 180));
    }
    noStroke();
    fill(220);
    textSize(11);
    const kill = typeof Track !== 'undefined' && Track.killers ? Track.killers.length : 0;
    text(`rose : % arrivées (record ${round(this.record * 100)} %) · bleu : meilleure distance`, x + 10, y + h - 22);
    text(`${this.history.length} courses · ${kill} circuit(s) tueur(s) en mémoire`, x + 10, y + h - 36);
    pop();
  }
}
