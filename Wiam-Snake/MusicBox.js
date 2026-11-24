// MusicBox.js
// Musique mignonne et bruitages générés avec la Web Audio API (aucun
// fichier son). Boîte à musique sur la grille Do – La m – Fa – Sol.
// Ce n'est pas un Vehicle : ce n'est pas un élément graphique.

class MusicBox {
  // Mélodie : 4 mesures de 16 doubles-croches (numéros MIDI, null = silence).
  static MELODY = [
    76, null, 79, null, 84, null, 79, null, 76, null, 74, null, 72, null, null, null,
    72, null, 76, null, 81, null, 79, null, 76, null, null, null, 74, null, 72, null,
    69, null, 72, null, 77, null, 76, null, 74, null, 72, null, 69, null, null, null,
    71, null, 74, null, 79, null, 77, null, 76, null, 74, null, 71, null, 74, null,
  ];

  static CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];

  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.playing = false;
    this.muted = false;
    this.step = 0;
    this.nextTime = 0;
    this.tempo = 118;
    this.timer = null;
  }

  get ready() {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  // À appeler lors d'un clic : les navigateurs bloquent le son avant.
  unlock() {
    if (this.ctx === null) {
      let AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.master);
    }
    if (this.ctx.state !== 'running') {
      this.ctx.resume();
    }
  }

  startMusic() {
    if (this.ctx === null || this.playing === true) {
      return;
    }
    this.playing = true;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  setMusicVolume(value) {
    if (this.musicGain !== null) {
      this.musicGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.3);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master !== null) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8,
        this.ctx.currentTime, 0.05);
    }
  }

  midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  schedule() {
    let stepDuration = 60 / this.tempo / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += stepDuration;
      this.step = (this.step + 1) % MusicBox.MELODY.length;
    }
  }

  playStep(step, time) {
    let chord = MusicBox.CHORDS[Math.floor(step / 16) % 4];
    let note = MusicBox.MELODY[step];
    if (note !== null) {
      this.bell(this.midiToFreq(note), time, 0.9, 0.07, this.musicGain);
    }
    // Arpège doux de boîte à musique.
    let arp = chord[[0, 1, 2, 1][step % 4]] + 12;
    this.bell(this.midiToFreq(arp), time, 0.5, 0.025, this.musicGain);
    // Basse ronde sur les temps forts.
    if (step % 8 === 0) {
      this.tone(this.midiToFreq(chord[0] - 12), time, 0.6, 'triangle', 0.09,
        this.musicGain);
    }
    // Petit « tchik » sur les contretemps.
    if (step % 4 === 2) {
      this.tone(6000, time, 0.03, 'square', 0.006, this.musicGain);
    }
  }

  // Note simple avec enveloppe percussive.
  tone(freq, time, duration, type, volume, destination, endFreq = null) {
    let osc = this.ctx.createOscillator();
    let gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    }
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  // Timbre de clochette : fondamentale + harmoniques aiguës.
  bell(freq, time, duration, volume, destination) {
    this.tone(freq, time, duration, 'sine', volume, destination);
    this.tone(freq * 2, time, duration * 0.5, 'sine', volume * 0.35, destination);
    this.tone(freq * 3.01, time, duration * 0.25, 'sine', volume * 0.15,
      destination);
  }

  // ----- Bruitages -----

  eat(combo = 0) {
    if (this.ready === false) {
      return;
    }
    let t = this.ctx.currentTime;
    let base = 700 + min(combo, 12) * 45;
    this.tone(base, t, 0.09, 'sine', 0.12, this.sfxGain, base * 1.8);
  }

  kill() {
    if (this.ready === false) {
      return;
    }
    let t = this.ctx.currentTime;
    [72, 76, 79, 84, 88].forEach((note, i) => {
      this.bell(this.midiToFreq(note + 12), t + i * 0.06, 0.4, 0.09,
        this.sfxGain);
    });
  }

  gameOver() {
    if (this.ready === false) {
      return;
    }
    let t = this.ctx.currentTime;
    [79, 76, 72, 67].forEach((note, i) => {
      this.tone(this.midiToFreq(note), t + i * 0.22, 0.35, 'triangle', 0.13,
        this.sfxGain, this.midiToFreq(note) * 0.94);
    });
  }

  start() {
    if (this.ready === false) {
      return;
    }
    let t = this.ctx.currentTime;
    [72, 76, 79, 84].forEach((note, i) => {
      this.bell(this.midiToFreq(note), t + i * 0.08, 0.5, 0.08, this.sfxGain);
    });
  }
}
