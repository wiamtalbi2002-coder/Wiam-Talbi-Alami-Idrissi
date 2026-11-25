// track.js — le circuit : bord intérieur, bord extérieur, checkpoints.
// Même idée que buildTrack() de Buffa (rayon donné par le bruit de Perlin
// autour d'un cercle), mais réglable : sinuosité, largeur, nombre de
// checkpoints, et rangé dans une classe. Le circuit ne bouge pas : ce n'est
// pas un Vehicle.

class Track {
  // zone : { cx, cy, rx, ry } — centre et demi-tailles max du circuit
  constructor(zone, sinuosite = 4, largeur = 60, total = 60, graine = random(1000)) {
    this.zone = zone;
    this.sinuosite = sinuosite;
    this.largeur = largeur;
    this.total = total;
    this.graine = graine;
    this.build();
  }

  build() {
    const { cx, cy, rx, ry } = this.zone;
    const w = this.largeur;
    // 1. la ligne du milieu : rayon donné par le bruit de Perlin (comme Buffa)
    const centre = [];
    for (let i = 0; i < this.total; i++) {
      const a = map(i, 0, this.total, 0, TWO_PI);
      const xoff = map(cos(a), -1, 1, 0, this.sinuosite) + this.graine;
      const yoff = map(sin(a), -1, 1, 0, this.sinuosite) + this.graine;
      const n = noise(xoff, yoff);
      const xr = map(n, 0, 1, w + 60, rx - w);
      const yr = map(n, 0, 1, w + 40, ry - w);
      centre.push(createVector(cx + xr * cos(a), cy + yr * sin(a)));
    }
    // lissage léger (moyenne sur 3 points, 2 fois) : supprime les pics
    // trop pointus où les deux bords se croiseraient
    for (let passe = 0; passe < 2; passe++) {
      const copie = centre.map((p) => p.copy());
      for (let i = 0; i < this.total; i++) {
        const m = createVector(0, 0);
        for (let k = -1; k <= 1; k++) {
          m.add(copie[(i + k + this.total) % this.total]);
        }
        centre[i] = m.div(3);
      }
    }
    // 2. CORRECTION : Buffa décale les bords de ±largeur vers le centre de
    // l'écran (direction radiale). Quand le rayon change vite, la route se
    // pince jusqu'à se fermer : circuit impossible, la population reste
    // bloquée au même endroit quoi qu'elle apprenne. Ici on décale les bords
    // PERPENDICULAIREMENT à la route : la largeur est la même partout.
    this.inside = [];
    this.outside = [];
    this.checkpoints = [];
    for (let i = 0; i < this.total; i++) {
      const avant = centre[(i - 1 + this.total) % this.total];
      const apres = centre[(i + 1) % this.total];
      const tangente = p5.Vector.sub(apres, avant).normalize();
      const normale = createVector(tangente.y, -tangente.x); // vers l'intérieur
      const p1 = p5.Vector.add(centre[i], p5.Vector.mult(normale, w));
      const p2 = p5.Vector.sub(centre[i], p5.Vector.mult(normale, w));
      this.checkpoints.push(new Boundary(p1.x, p1.y, p2.x, p2.y));
      this.inside.push(p1);
      this.outside.push(p2);
    }
    // segments[i] = les 2 murs entre le checkpoint i et le checkpoint i+1
    this.segments = [];
    this.walls = [];
    for (let i = 0; i < this.total; i++) {
      const j = (i + 1) % this.total;
      const murInt = new Boundary(this.inside[i].x, this.inside[i].y, this.inside[j].x, this.inside[j].y);
      const murExt = new Boundary(this.outside[i].x, this.outside[i].y, this.outside[j].x, this.outside[j].y);
      this.segments.push([murInt, murExt]);
      this.walls.push(murInt, murExt);
    }
    this.start = this.checkpoints[0].midpoint();
    // direction de départ : vers le checkpoint suivant
    this.startHeading = p5.Vector.sub(this.checkpoints[1].midpoint(), this.start).heading();
  }

  // Optimisation : une voiture près du checkpoint `index` ne peut toucher
  // que les murs voisins. Au lieu de tester les 120 murs avec chaque rayon,
  // on n'en teste que 2 × (2 × portee + 1).
  wallsNear(index, portee = 4) {
    const murs = [];
    for (let k = -portee; k <= portee; k++) {
      const s = this.segments[(index + k + this.total) % this.total];
      murs.push(s[0], s[1]);
    }
    return murs;
  }

  show() {
    push();
    // la route
    noStroke();
    fill(40, 30, 60);
    beginShape();
    this.outside.forEach((p) => vertex(p.x, p.y));
    beginContour();
    for (let i = this.inside.length - 1; i >= 0; i--) {
      vertex(this.inside[i].x, this.inside[i].y);
    }
    endContour();
    endShape(CLOSE);

    // checkpoints discrets
    stroke(120, 140, 255, 40);
    strokeWeight(1);
    this.checkpoints.forEach((c) => c.show());

    // ligne de départ en damier
    const c0 = this.checkpoints[0];
    const n = 8;
    strokeWeight(5);
    for (let k = 0; k < n; k++) {
      stroke(k % 2 ? 255 : 30);
      const p1 = p5.Vector.lerp(c0.a, c0.b, k / n);
      const p2 = p5.Vector.lerp(c0.a, c0.b, (k + 1) / n);
      line(p1.x, p1.y, p2.x, p2.y);
    }

    // les murs, néon rose
    stroke(255, 110, 200);
    strokeWeight(2);
    this.walls.forEach((w) => w.show());
    pop();
  }
}
