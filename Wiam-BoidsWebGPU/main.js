// main.js — Wiam-BoidsWebGPU : une murmuration de centaines de milliers d'oiseaux,
// calculée sur la carte graphique avec WebGPU (inspiré de la démo
// jtsorlinis.github.io/BoidsWebGPU montrée en cours).

import { BoidSimulation } from './BoidSimulation.js';
import { BoidRenderer } from './BoidRenderer.js';
import { FlyCamera } from './FlyCamera.js';
import { Mat4 } from './Mat4.js';

const canvas = document.getElementById('gfx');
const fpsLabel = document.getElementById('fps');
const countSlider = document.getElementById('count');
const countLabel = document.getElementById('countValue');
const maxLabel = document.getElementById('countMax');
const birdsToggle = document.getElementById('birds');
const viewButtons = document.querySelectorAll('[data-view]');

function showError(message) {
  const box = document.getElementById('error');
  box.textContent = message;
  box.hidden = false;
}

async function start() {
  if (!navigator.gpu) {
    showError('WebGPU n\'est pas disponible dans ce navigateur. Ouvre la page avec Chrome ou Edge (version récente) sur un ordinateur.');
    return;
  }
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) {
    showError('Aucune carte graphique compatible WebGPU n\'a été trouvée.');
    return;
  }
  const device = await adapter.requestDevice({
    requiredLimits: {
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      maxBufferSize: adapter.limits.maxBufferSize,
    },
  });
  device.lost.then((info) => showError(`La carte graphique a été perdue : ${info.message}`));

  const context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });

  // Nombre maximum d'oiseaux selon la mémoire autorisée par la carte.
  const maxCount = Math.min(2000000,
    Math.floor(adapter.limits.maxStorageBufferBindingSize / 32));
  const minCount = 100;
  maxLabel.textContent = maxCount.toLocaleString('en-US');

  const sim = new BoidSimulation(device);
  const renderer = new BoidRenderer(device, format);
  const camera = new FlyCamera(canvas);

  let count = Math.min(150000, maxCount);
  let mode = 0;
  let birds = true;

  const sliderToCount = (s) => Math.round(10 ** (Math.log10(minCount)
    + (s / 1000) * (Math.log10(maxCount) - Math.log10(minCount))));
  const countToSlider = (c) => Math.round(1000 * (Math.log10(c) - Math.log10(minCount))
    / (Math.log10(maxCount) - Math.log10(minCount)));

  const rebuild = () => {
    sim.resize(count, mode);
    renderer.setBuffers(sim.buffers);
  };

  countSlider.value = countToSlider(count);
  countLabel.textContent = count.toLocaleString('en-US');
  countSlider.addEventListener('input', () => {
    countLabel.textContent = sliderToCount(Number(countSlider.value)).toLocaleString('en-US');
  });
  countSlider.addEventListener('change', () => {
    count = sliderToCount(Number(countSlider.value));
    rebuild();
  });
  birdsToggle.addEventListener('change', () => {
    birds = birdsToggle.checked;
  });
  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.view === '2d' ? 1 : 0;
      viewButtons.forEach((b) => b.classList.toggle('active', b === button));
      document.body.classList.toggle('flat', next === 1);
      if (next !== mode) {
        mode = next;
        rebuild();
      }
    });
  });

  rebuild();

  let last = performance.now();
  let fpsTime = 0;
  let fpsFrames = 0;

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    fpsTime += dt;
    fpsFrames += 1;
    if (fpsTime > 0.5) {
      fpsLabel.textContent = `${Math.round(fpsFrames / fpsTime)} FPS`;
      fpsTime = 0;
      fpsFrames = 0;
    }

    // Taille du canvas = taille de la fenêtre (densité limitée à 2).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const aspect = width / height;

    let viewProj;
    let camPos;
    if (mode === 0) {
      camera.update(dt);
      const proj = Mat4.perspective(Math.PI / 3, aspect, 0.1, 2000);
      const view = Mat4.lookAt(camera.pos, camera.target(), [0, 1, 0]);
      viewProj = Mat4.multiply(proj, view);
      camPos = camera.pos;
    } else {
      // Vue 2D : on regarde le plan des oiseaux de face.
      let halfH = 34;
      let halfW = halfH * aspect;
      if (halfW < 66) {
        halfW = 66;
        halfH = halfW / aspect;
      }
      const proj = Mat4.ortho(-halfW, halfW, -halfH, halfH, 0.1, 400);
      const view = Mat4.lookAt([0, 32, 100], [0, 32, 0], [0, 1, 0]);
      viewProj = Mat4.multiply(proj, view);
      camPos = [0, 32, 100];
    }

    const time = now / 1000;
    const encoder = device.createCommandEncoder();
    sim.step(encoder, dt, time);
    renderer.draw(encoder, context.getCurrentTexture().createView(), {
      width,
      height,
      viewProj,
      invViewProj: Mat4.invert(viewProj),
      camPos,
      birdScale: mode === 0 ? 0.45 : 0.6,
      time,
      mode,
      birds,
      count,
      buffers: sim.latest(),
    });
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch((error) => showError(`Erreur : ${error.message}`));
