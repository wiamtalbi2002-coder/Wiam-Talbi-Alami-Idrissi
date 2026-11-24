// WarSounds.js
// Sons de guerre générés avec la Web Audio API (sans bibliothèque ni
// fichier audio) : explosions, mitrailleuse, fusil, départ de missile,
// impacts sur blindage, grésillement radio et moteur de l'avion.
// Non graphique, donc pas un Vehicle. Réutilise l'AudioContext d'une Alarm
// (débloquée au premier geste de l'utilisateur) et sa case « Son ».

class WarSounds {
  constructor(alarm, options = {}) {
    this.alarm = alarm;
    this.volume = options.volume ?? 0.8;
    this.master = null;
    this.noiseBuffer = null;
    this.engine = null;
    this.lastPlayed = {};
  }

  // Vrai si le son est autorisé (case « Son » + navigateur débloqué).
  isOn() {
    return this.alarm.enabled === true && this.alarm.isUnlocked() === true;
  }

  // Prépare le volume général et le bruit blanc au premier son.
  prepare() {
    let ctx = this.alarm.context;
    if (this.master === null) {
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(ctx.destination);

      let length = ctx.sampleRate * 2;
      this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      let data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return ctx;
  }

  // Vrai si le son peut jouer : actif et pas joué depuis minInterval ms.
  canPlay(name, minInterval) {
    if (this.isOn() === false) {
      return false;
    }
    let now = performance.now();
    if (now - (this.lastPlayed[name] ?? -Infinity) < minInterval) {
      return false;
    }
    this.lastPlayed[name] = now;
    return true;
  }

  // Source de bruit blanc démarrant à un endroit aléatoire du tampon.
  noise(ctx, t0, duration) {
    let source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.start(t0, Math.random(), duration + 0.05);
    return source;
  }

  // Enveloppe de volume : montée rapide puis décroissance exponentielle.
  envelope(ctx, t0, peak, duration, attack = 0.004) {
    let gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    return gain;
  }

  // Grosse explosion (cible détruite) ou petite (impact sur l'avion).
  explosion(big = true) {
    if (this.canPlay(big ? 'bigBoom' : 'smallBoom', 60) === false) {
      return;
    }
    let ctx = this.prepare();
    let t0 = ctx.currentTime + 0.01;
    let duration = big ? 1.8 : 0.7;

    // Grondement : bruit blanc dont le filtre se referme.
    let rumble = this.noise(ctx, t0, duration);
    let lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(big ? 2500 : 3500, t0);
    lowpass.frequency.exponentialRampToValueAtTime(80, t0 + duration);
    let rumbleGain = this.envelope(ctx, t0, big ? 0.9 : 0.45, duration);
    rumble.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(this.master);

    // Onde de choc : sinus grave qui chute.
    let thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(big ? 110 : 160, t0);
    thump.frequency.exponentialRampToValueAtTime(30, t0 + 0.5);
    let thumpGain = this.envelope(ctx, t0, big ? 0.9 : 0.4, 0.55);
    thump.connect(thumpGain);
    thumpGain.connect(this.master);
    thump.start(t0);
    thump.stop(t0 + 0.6);

    // Crépitement des débris (grosse explosion seulement).
    if (big === true) {
      let crackle = this.noise(ctx, t0 + 0.05, 0.5);
      let bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1800;
      bandpass.Q.value = 0.8;
      let crackleGain = this.envelope(ctx, t0 + 0.05, 0.3, 0.5);
      crackle.connect(bandpass);
      bandpass.connect(crackleGain);
      crackleGain.connect(this.master);
    }
  }

  // Un coup de mitrailleuse (claquement sec + petit choc grave).
  gunShot() {
    if (this.canPlay('gun', 40) === false) {
      return;
    }
    let ctx = this.prepare();
    let t0 = ctx.currentTime + 0.005;

    let crack = this.noise(ctx, t0, 0.08);
    let bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1100 + Math.random() * 300;
    bandpass.Q.value = 1;
    let crackGain = this.envelope(ctx, t0, 0.35, 0.07, 0.002);
    crack.connect(bandpass);
    bandpass.connect(crackGain);
    crackGain.connect(this.master);

    let kick = ctx.createOscillator();
    kick.frequency.setValueAtTime(180, t0);
    kick.frequency.exponentialRampToValueAtTime(60, t0 + 0.05);
    let kickGain = this.envelope(ctx, t0, 0.25, 0.06, 0.002);
    kick.connect(kickGain);
    kickGain.connect(this.master);
    kick.start(t0);
    kick.stop(t0 + 0.08);
  }

  // Départ de missile : souffle qui monte dans les aigus.
  // enemy = true : riposte d'une cible, plus courte et plus discrète.
  missileLaunch(enemy = false) {
    if (this.canPlay(enemy ? 'enemyLaunch' : 'launch', 80) === false) {
      return;
    }
    let ctx = this.prepare();
    let t0 = ctx.currentTime + 0.01;
    let duration = enemy ? 0.5 : 0.9;

    let whoosh = this.noise(ctx, t0, duration);
    let bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.value = 2;
    bandpass.frequency.setValueAtTime(enemy ? 500 : 300, t0);
    bandpass.frequency.exponentialRampToValueAtTime(enemy ? 1500 : 2400,
      t0 + duration * 0.7);
    let gain = this.envelope(ctx, t0, enemy ? 0.2 : 0.4, duration, 0.05);
    whoosh.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.master);
  }

  // Balle qui frappe un blindage : « tink » métallique.
  impact() {
    if (this.canPlay('impact', 50) === false) {
      return;
    }
    let ctx = this.prepare();
    let t0 = ctx.currentTime + 0.005;

    let ping = ctx.createOscillator();
    ping.type = 'square';
    ping.frequency.setValueAtTime(2200 + Math.random() * 600, t0);
    let pingGain = this.envelope(ctx, t0, 0.06, 0.05, 0.002);
    ping.connect(pingGain);
    pingGain.connect(this.master);
    ping.start(t0);
    ping.stop(t0 + 0.06);

    let hiss = this.noise(ctx, t0, 0.03);
    let highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 3000;
    let hissGain = this.envelope(ctx, t0, 0.15, 0.03, 0.002);
    hiss.connect(highpass);
    highpass.connect(hissGain);
    hissGain.connect(this.master);
  }

  // Coup de fusil lointain (fantassin).
  rifle() {
    if (this.canPlay('rifle', 70) === false) {
      return;
    }
    let ctx = this.prepare();
    let t0 = ctx.currentTime + 0.005;
    let crack = this.noise(ctx, t0, 0.06);
    let bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2400 + Math.random() * 600;
    bandpass.Q.value = 1.5;
    let gain = this.envelope(ctx, t0, 0.08, 0.06, 0.002);
    crack.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.master);
  }

  // Grésillement radio + bip, avant un message du pilote.
  radioClick() {
    if (this.canPlay('radio', 200) === false) {
      return;
    }
    let ctx = this.prepare();
    let t0 = ctx.currentTime + 0.005;
    let hiss = this.noise(ctx, t0, 0.14);
    let bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1800;
    bandpass.Q.value = 4;
    let hissGain = this.envelope(ctx, t0, 0.12, 0.14, 0.003);
    hiss.connect(bandpass);
    bandpass.connect(hissGain);
    hissGain.connect(this.master);

    let beep = ctx.createOscillator();
    beep.type = 'square';
    beep.frequency.value = 1000;
    let beepGain = this.envelope(ctx, t0, 0.04, 0.05, 0.002);
    beep.connect(beepGain);
    beepGain.connect(this.master);
    beep.start(t0);
    beep.stop(t0 + 0.06);
  }

  // Moteur de l'avion : à appeler à chaque frame avec la vitesse relative
  // (0 à 1). Deux dents de scie désaccordées → grondement qui « bat ».
  updateEngine(speedRatio) {
    if (this.alarm.isUnlocked() === false) {
      return;
    }
    let ctx = this.prepare();
    if (this.engine === null) {
      let gain = ctx.createGain();
      gain.gain.value = 0;
      let lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 420;
      let osc1 = ctx.createOscillator();
      let osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.connect(lowpass);
      osc2.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.master);
      osc1.start();
      osc2.start();
      this.engine = { gain, osc1, osc2 };
    }
    let ratio = Math.min(Math.max(speedRatio, 0), 1);
    let now = ctx.currentTime;
    let level = this.alarm.enabled === true ? 0.05 + 0.05 * ratio : 0;
    this.engine.gain.gain.setTargetAtTime(level, now, 0.1);
    this.engine.osc1.frequency.setTargetAtTime(55 + 45 * ratio, now, 0.2);
    this.engine.osc2.frequency.setTargetAtTime(57 + 47 * ratio, now, 0.2);
  }
}
