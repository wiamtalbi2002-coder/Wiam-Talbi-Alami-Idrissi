// population.js — l'algorithme génétique (ga.js de Buffa, en classe).
//
// Une génération : toutes les voitures roulent jusqu'à mourir ou finir.
// Puis :
//  1. fitness de chaque voiture, normalisée (somme = 1) ;
//  2. ÉLITISME (ajout) : les `elites` meilleurs cerveaux sont recopiés SANS
//     mutation. Chez Buffa, même le meilleur est muté : un bon cerveau peut
//     être perdu et la courbe du record redescend ;
//  3. le reste : deux parents tirés à la roue de la fortune (pickOne de
//     Buffa), CROISEMENT (ajout, optionnel), puis mutation ;
//  4. la couleur (hue) est héritée avec une petite dérive : on VOIT les
//     familles qui gagnent envahir la population.

class Population {
  constructor(track, params, cerveauxDeDepart = []) {
    this.track = track;
    this.params = params;
    this.generation = 1;
    this.history = []; // { best, avg } en % de la course, par génération
    this.record = 0;
    this.champion = null; // { brain, hue, ratio, generation }
    this.cars = [];
    this.saved = [];
    this.meilleurTour = null; // en pas de simulation
    for (let i = 0; i < params.population; i++) {
      const graine = cerveauxDeDepart[i];
      const car = new Car(track, params, graine || null, graine ? 320 : random(360));
      car.elite = !!graine;
      this.cars.push(car);
    }
  }

  step() {
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      car.step();
      if (car.dead || car.finished) {
        car.lapSteps.forEach((t) => {
          if (this.meilleurTour === null || t < this.meilleurTour) {
            this.meilleurTour = t;
          }
        });
        this.saved.push(this.cars.splice(i, 1)[0]);
      }
    }
  }

  done() {
    return this.cars.length === 0;
  }

  // voiture en tête parmi celles qui roulent encore
  leader() {
    let best = null;
    for (const c of this.cars) {
      if (!best || c.progress > best.progress) {
        best = c;
      }
    }
    return best;
  }

  // Passe à la génération suivante. `track` : nouveau circuit éventuel.
  // `injecte` : cerveaux chargés depuis un fichier, ajoutés en élites.
  evolve(track, injecte = []) {
    this.track = track;
    const anciens = this.saved;
    anciens.forEach((c) => c.calculateFitness());
    anciens.sort((a, b) => b.fitness - a.fitness);

    const best = anciens[0];
    const avg = anciens.reduce((s, c) => s + c.ratio(), 0) / anciens.length;
    this.history.push({ best: best.ratio(), avg });
    const nouveauRecord = best.ratio() > this.record;
    if (nouveauRecord || !this.champion) {
      this.record = max(this.record, best.ratio());
      this.champion = { brain: best.brain.copy(), hue: best.hue, ratio: best.ratio(), generation: this.generation };
    }

    const total = anciens.reduce((s, c) => s + c.fitness, 0);
    anciens.forEach((c) => { c.fitness = total > 0 ? c.fitness / total : 1 / anciens.length; });

    const enfants = [];
    injecte.forEach((brain) => {
      const c = new Car(track, this.params, brain, 320);
      c.elite = true;
      enfants.push(c);
    });
    for (let k = 0; k < min(this.params.elites, anciens.length); k++) {
      const c = new Car(track, this.params, anciens[k].brain, anciens[k].hue);
      c.elite = true;
      enfants.push(c);
    }
    while (enfants.length < this.params.population) {
      const p1 = this.pickOne(anciens);
      let brain;
      let hue = p1.hue;
      if (this.params.croisement) {
        const p2 = this.pickOne(anciens);
        brain = NeuralNetwork.crossover(p1.brain, p2.brain);
        hue = random(1) < 0.5 ? p1.hue : p2.hue;
      } else {
        brain = p1.brain.copy();
      }
      brain.mutate(this.params.tauxMutation, this.params.amplitudeMutation);
      enfants.push(new Car(track, this.params, brain, hue + random(-8, 8)));
    }

    this.cars = enfants;
    this.saved = [];
    this.generation++;
    return nouveauRecord;
  }

  // Roue de la fortune (pickOne de Buffa) : chaque voiture a une part
  // proportionnelle à sa fitness normalisée.
  pickOne(list) {
    let r = random(1);
    let index = 0;
    while (r > 0 && index < list.length) {
      r -= list[index].fitness;
      index++;
    }
    return list[max(0, index - 1)];
  }
}
