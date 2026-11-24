// FlyCamera.js
// Caméra libre : glisser la souris pour regarder autour, ZQSD (ou WASD selon
// le clavier) pour avancer / reculer / aller à gauche / à droite, A/E (ou
// Q/E) pour descendre / monter, Maj pour aller plus vite.
// Les touches sont lues par position physique (KeyW…), donc ça marche en
// AZERTY comme en QWERTY.

export class FlyCamera {
  constructor(canvas) {
    this.pos = [0, 26, 95];
    this.yaw = -Math.PI / 2;
    this.pitch = -0.06;
    this.keys = new Set();
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;

    canvas.addEventListener('pointerdown', (event) => {
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (this.dragging === false) {
        return;
      }
      this.yaw += (event.clientX - this.lastX) * 0.004;
      this.pitch -= (event.clientY - this.lastY) * 0.004;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    canvas.addEventListener('pointerup', () => {
      this.dragging = false;
    });
    window.addEventListener('keydown', (event) => this.keys.add(event.code));
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  forward() {
    return [
      Math.cos(this.pitch) * Math.cos(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.sin(this.yaw),
    ];
  }

  update(dt) {
    const f = this.forward();
    const right = [-f[2], 0, f[0]];
    const len = Math.hypot(right[0], right[2]) || 1;
    right[0] /= len;
    right[2] /= len;
    const fast = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = (fast ? 90 : 28) * dt;
    const move = (dir, amount) => {
      this.pos[0] += dir[0] * amount;
      this.pos[1] += dir[1] * amount;
      this.pos[2] += dir[2] * amount;
    };
    if (this.keys.has('KeyW')) move(f, speed);
    if (this.keys.has('KeyS')) move(f, -speed);
    if (this.keys.has('KeyD')) move(right, speed);
    if (this.keys.has('KeyA')) move(right, -speed);
    if (this.keys.has('KeyE')) move([0, 1, 0], speed);
    if (this.keys.has('KeyQ')) move([0, 1, 0], -speed);
    this.pos[1] = Math.max(0.5, this.pos[1]);
  }

  target() {
    const f = this.forward();
    return [this.pos[0] + f[0], this.pos[1] + f[1], this.pos[2] + f[2]];
  }
}
