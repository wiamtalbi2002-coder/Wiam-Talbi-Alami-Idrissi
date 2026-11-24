// BoidRenderer.js
// Dessine le ciel + le champ, puis tous les oiseaux en une seule commande
// (dessin « instancié » : un oiseau = une instance).

import { RENDER_WGSL } from './renderShader.js';

export class BoidRenderer {
  constructor(device, format) {
    this.device = device;
    this.depthTexture = null;
    this.size = [0, 0];

    const module = device.createShaderModule({ code: RENDER_WGSL });
    this.layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.layout],
    });
    const depthStencil = (write, compare) => ({
      format: 'depth24plus',
      depthWriteEnabled: write,
      depthCompare: compare,
    });
    this.skyPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module, entryPoint: 'vsSky' },
      fragment: { module, entryPoint: 'fsSky', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
      depthStencil: depthStencil(false, 'always'),
    });
    this.birdPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module, entryPoint: 'vsBird' },
      fragment: { module, entryPoint: 'fsBird', targets: [{ format }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: depthStencil(true, 'less'),
    });
    this.uniformBuffer = device.createBuffer({
      size: 160,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniforms = new Float32Array(40);
  }

  // Deux groupes : lire les oiseaux A ou les oiseaux B de la simulation.
  setBuffers(buffers) {
    const group = (boids) => this.device.createBindGroup({
      layout: this.layout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: boids } },
      ],
    });
    this.bindGroups = [group(buffers.boidsA), group(buffers.boidsB)];
  }

  ensureDepth(width, height) {
    if (this.size[0] === width && this.size[1] === height) {
      return;
    }
    if (this.depthTexture !== null) {
      this.depthTexture.destroy();
    }
    this.depthTexture = this.device.createTexture({
      size: [width, height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.size = [width, height];
  }

  draw(encoder, view, frame) {
    this.ensureDepth(frame.width, frame.height);
    const u = this.uniforms;
    u.set(frame.viewProj, 0);
    u.set(frame.invViewProj, 16);
    u.set([frame.camPos[0], frame.camPos[1], frame.camPos[2], frame.birdScale], 32);
    u.set([frame.time, frame.mode, frame.birds ? 1 : 0, 0], 36);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, u);

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view,
        clearValue: { r: 0.86, g: 0.9, b: 0.94, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });
    pass.setBindGroup(0, this.bindGroups[frame.buffers]);
    pass.setPipeline(this.skyPipeline);
    pass.draw(3);
    pass.setPipeline(this.birdPipeline);
    pass.draw(frame.birds ? 9 : 3, frame.count);
    pass.end();
  }
}
