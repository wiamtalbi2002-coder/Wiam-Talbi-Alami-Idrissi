// wiamAddons.js — (ajout de Wiam) branche mes ajouts sur le projet de Bruno
// SANS modifier son code :
//  - p5.prototype.registerMethod('post', …) : p5 appelle ma fonction après
//    chaque draw() de Bruno, je dessine par-dessus son canvas ;
//  - j'enveloppe SessionController.prototype.finishRace pour noter les
//    résultats de chaque course avant que Bruno ne passe à la suivante.
// Ajouts : panneau accordéon, course contre l'IA (flèches), courbe de
// progrès, traînée de la voiture en tête, confettis aux records,
// meilleur tour IA vs le tien.

const Wiam = {
  panel: null,
  options: { joueur: false, courbe: true, trainee: true, fete: true },
  player: null,
  chart: new WiamProgressChart(),
  confettis: [],
  trainee: [],
  meilleurTourIA: null,
  toast: { texte: '', vie: 0 },

  initPanneau() {
    this.panel = new ControlPanel('✿ Ajouts de Wiam — course contre l\'IA, progrès, records', { open: false });
    this.panel.addCheckbox('🏁 Je conduis (flèches) contre les voitures de Bruno', false, (v) => this.activerJoueur(v));
    this.panel.addCheckbox('📈 Courbe de progrès', true, (v) => { this.options.courbe = v; });
    this.panel.addCheckbox('✨ Traînée de la voiture en tête', true, (v) => { this.options.trainee = v; });
    this.panel.addCheckbox('🎉 Confettis aux records', true, (v) => { this.options.fete = v; });
    this.info = this.panel.addInfo('Démarre une expérience (« Entraîner par évolution »), puis coche « Je conduis ».');
  },

  activerJoueur(on) {
    this.options.joueur = on;
    if (on && typeof currentTrack !== 'undefined' && currentTrack) {
      this.player = new WiamPlayerCar(currentTrack);
      this.message('À toi ! Flèches pour conduire.');
    } else {
      this.player = null;
    }
  },

  message(texte) {
    this.toast = { texte, vie: 220 };
  },

  // appelé après chaque draw() de Bruno
  apresDraw() {
    if (!this.panel) {
      this.initPanneau();
    }
    if (typeof Session === 'undefined' || !Session || !Session.ready || !currentTrack || !currentGen) {
      return;
    }
    const running = currentGen.lists.running.filter((v) => !v.dead && !v.finished);
    this.suivreToursIA(currentGen.lists.running);
    if (this.options.trainee) {
      this.dessinerTrainee(running);
    }
    if (this.player) {
      if (this.player.track !== currentTrack) {
        this.player.reset(currentTrack);
      }
      if (!UI.paused) {
        this.player.step();
      }
      this.player.show();
    }
    this.confettis.forEach((c) => { c.step(); c.show(); });
    this.confettis = this.confettis.filter((c) => c.vie > 0);
    if (this.options.courbe) {
      this.chart.show(10, 800 - 170, 330, 160);
    }
    this.afficherDuel();
    this.afficherToast();
  },

  // Meilleur tour de l'IA, mesuré en pas de simulation (measureSteps de Bruno)
  suivreToursIA(vehicles) {
    vehicles.forEach((v) => {
      const pas = v.measureSteps || 0;
      if (v._wiamTours === undefined) {
        v._wiamTours = v.laps || 0;
        v._wiamDebut = pas;
      }
      if ((v.laps || 0) > v._wiamTours) {
        const t = pas - v._wiamDebut;
        if (t > 0 && (this.meilleurTourIA === null || t < this.meilleurTourIA)) {
          this.meilleurTourIA = t;
        }
        v._wiamTours = v.laps;
        v._wiamDebut = pas;
      }
    });
  },

  dessinerTrainee(running) {
    let leader = null;
    running.forEach((v) => {
      if (!leader || (v.points || 0) > (leader.points || 0)) {
        leader = v;
      }
    });
    if (!leader || !leader.pos) {
      return;
    }
    const last = this.trainee[this.trainee.length - 1];
    if (last && p5.Vector.dist(last, leader.pos) > 40) {
      this.trainee = [];
    }
    this.trainee.push(leader.pos.copy());
    if (this.trainee.length > 90) {
      this.trainee.shift();
    }
    push();
    noFill();
    for (let i = 1; i < this.trainee.length; i++) {
      stroke(255, 120, 200, map(i, 0, this.trainee.length, 0, 220));
      strokeWeight(map(i, 0, this.trainee.length, 1, 5));
      line(this.trainee[i - 1].x, this.trainee[i - 1].y, this.trainee[i].x, this.trainee[i].y);
    }
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text('👑', leader.pos.x, leader.pos.y - 16);
    pop();
  },

  afficherDuel() {
    const sec = (t) => (t === null ? '—' : nf(t / 60, 1, 1) + ' s');
    let texte = `Meilleur tour IA : ${sec(this.meilleurTourIA)}`;
    if (this.player) {
      texte += ` · toi : ${sec(this.player.meilleurTour)} (tours ${this.player.tours}, crashs ${this.player.crash})`;
      if (this.player.meilleurTour !== null && this.meilleurTourIA !== null) {
        texte += this.player.meilleurTour < this.meilleurTourIA ? ' 💖 tu bats l\'IA !' : ' 🤖 l\'IA gagne';
      }
    }
    push();
    textSize(13);
    const w = textWidth(texte) + 24;
    noStroke();
    fill(10, 16, 30, 215);
    rect(1200 - w - 10, 800 - 40, w, 30, 15);
    fill(255);
    textAlign(LEFT, CENTER);
    text(texte, 1200 - w + 2, 800 - 25);
    pop();
    if (this.info) {
      this.info.textContent = texte;
    }
  },

  afficherToast() {
    if (this.toast.vie <= 0) {
      return;
    }
    this.toast.vie--;
    push();
    textSize(20);
    textAlign(CENTER, CENTER);
    const w = textWidth(this.toast.texte) + 40;
    noStroke();
    fill(255, 60, 170, min(220, this.toast.vie * 4));
    rect(600 - w / 2, 20, w, 40, 20);
    fill(255, min(255, this.toast.vie * 4));
    text(this.toast.texte, 600, 40);
    pop();
  },

  apresCourse() {
    if (!currentGen || !currentTrack) {
      return;
    }
    const record = this.chart.enregistrer(currentGen, currentTrack);
    if (record) {
      this.message(`🎉 Record : ${round(this.chart.record * 100)} % des voitures arrivent !`);
      if (this.options.fete) {
        for (let i = 0; i < 120; i++) {
          this.confettis.push(new WiamConfetti(600 + random(-80, 80), 60));
        }
      }
    }
  },
};

p5.prototype.registerMethod('post', () => {
  try {
    Wiam.apresDraw();
  } catch (e) {
    console.warn('Wiam', e);
  }
});

// Notes de course : avant que Bruno ne passe à la course suivante
{
  const finishOrigine = SessionController.prototype.finishRace;
  SessionController.prototype.finishRace = function (...args) {
    try {
      Wiam.apresCourse();
    } catch (e) {
      console.warn('Wiam', e);
    }
    return finishOrigine.apply(this, args);
  };
}

// Les flèches ne font pas défiler la page quand je conduis
window.addEventListener('keydown', (e) => {
  if (Wiam.player && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
  }
});
