// RadioChatter.js
// Messages radio du pilote : affichés en bas à droite (DOM) et lus par la
// synthèse vocale du navigateur (speechSynthesis, voix française si
// disponible). Élément d'interface, donc pas un Vehicle.

class RadioChatter {
  constructor(options = {}) {
    this.callsign = options.callsign ?? 'VIPER 1';
    this.maxLines = options.maxLines ?? 4;
    this.voiceEnabled = options.voiceEnabled ?? true;
    this.onTransmit = options.onTransmit ?? null;
    this.lastByKey = {};
    this.voice = null;

    this.box = createDiv();
    this.box.class('radio');

    if ('speechSynthesis' in window) {
      this.chooseVoice();
      window.speechSynthesis.addEventListener('voiceschanged',
        () => this.chooseVoice());
    }
  }

  chooseVoice() {
    let voices = window.speechSynthesis.getVoices();
    this.voice = voices.find((v) => v.lang.startsWith('fr')) ?? null;
  }

  // Émet un message. variants : texte ou liste de variantes (tirage au
  // hasard, pour que le pilote ne répète pas toujours la même phrase).
  // cooldown (ms) : délai minimum entre deux messages de même clé.
  say(key, variants, cooldown = 4000) {
    let now = performance.now();
    if (now - (this.lastByKey[key] ?? -Infinity) < cooldown) {
      return;
    }
    this.lastByKey[key] = now;
    let message = variants;
    if (Array.isArray(variants) === true) {
      message = variants[Math.floor(Math.random() * variants.length)];
    }

    let line = document.createElement('div');
    line.className = 'radio__line';
    let callsign = document.createElement('span');
    callsign.className = 'radio__callsign';
    callsign.textContent = `${this.callsign} ›`;
    line.appendChild(callsign);
    line.appendChild(document.createTextNode(message));
    this.box.elt.appendChild(line);
    while (this.box.elt.children.length > this.maxLines) {
      this.box.elt.firstChild.remove();
    }
    setTimeout(() => line.remove(), 6000);

    if (this.onTransmit !== null) {
      this.onTransmit();
    }
    this.speak(message);
  }

  // Lit le message. Si la voix a déjà du retard, on saute ce message
  // plutôt que d'accumuler une file d'attente.
  speak(message) {
    if (this.voiceEnabled === false || ('speechSynthesis' in window) === false) {
      return;
    }
    let synth = window.speechSynthesis;
    if (synth.pending === true) {
      return;
    }
    let utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.15;
    utterance.pitch = 0.85;
    if (this.voice !== null) {
      utterance.voice = this.voice;
    }
    synth.speak(utterance);
  }

  setVoiceEnabled(on) {
    this.voiceEnabled = on;
    if (on === false && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
