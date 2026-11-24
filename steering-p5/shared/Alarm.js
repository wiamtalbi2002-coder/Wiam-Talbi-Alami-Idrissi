// Alarm.js
// Alarme sonore « pi-pi-pi-pi-pi » générée avec la Web Audio API (sans
// bibliothèque). Ce n'est pas un élément graphique, donc pas un Vehicle.
// Les navigateurs bloquent le son avant une action de l'utilisateur :
// l'AudioContext est créé / débloqué au premier clic ou à la première touche.

class Alarm {
  constructor(options = {}) {
    this.frequency = options.frequency ?? 1200; // Hz, oscillateur carré
    this.beepDuration = options.beepDuration ?? 0.06; // secondes
    this.beepGap = options.beepGap ?? 0.06; // secondes
    this.beepCount = options.beepCount ?? 6;
    this.volume = options.volume ?? 0.15;
    this.cooldown = options.cooldown ?? 3000; // ms minimum entre deux alarmes
    this.enabled = options.enabled ?? true;

    this.context = null;
    this.lastPlayed = -Infinity;

    this.unlock = this.unlock.bind(this);
    window.addEventListener('pointerdown', this.unlock);
    window.addEventListener('keydown', this.unlock);
  }

  // Vrai quand le navigateur autorise le son.
  isUnlocked() {
    return this.context !== null && this.context.state === 'running';
  }

  // Appelé sur le premier geste de l'utilisateur.
  unlock() {
    if (this.context === null) {
      let AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx === undefined) {
        return;
      }
      this.context = new AudioCtx();
    }
    this.context.resume().then(() => {
      if (this.isUnlocked() === true) {
        window.removeEventListener('pointerdown', this.unlock);
        window.removeEventListener('keydown', this.unlock);
      }
    }).catch(() => {});
  }

  // Joue l'alarme si le son est actif, débloqué et hors délai minimum.
  // Renvoie true si l'alarme a sonné.
  trigger() {
    if (this.enabled === false || this.isUnlocked() === false) {
      return false;
    }
    let now = performance.now();
    if (now - this.lastPlayed < this.cooldown) {
      return false;
    }
    this.lastPlayed = now;
    this.play();
    return true;
  }

  // Programme les bips à l'avance sur l'horloge audio (timing précis).
  play() {
    let ctx = this.context;
    let start = ctx.currentTime + 0.01;
    let ramp = 0.005; // évite les clics en début / fin de bip
    for (let i = 0; i < this.beepCount; i += 1) {
      let t0 = start + i * (this.beepDuration + this.beepGap);
      let t1 = t0 + this.beepDuration;

      let oscillator = ctx.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.value = this.frequency;

      let gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(this.volume, t0 + ramp);
      gain.gain.setValueAtTime(this.volume, t1 - ramp);
      gain.gain.linearRampToValueAtTime(0, t1);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(t0);
      oscillator.stop(t1 + 0.01);
    }
  }
}
