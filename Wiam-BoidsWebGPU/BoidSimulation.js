// BoidSimulation.js
// Gère les buffers et les passes de calcul WebGPU des boids. Chaque oiseau
// occupe 32 octets (position + vitesse). Les oiseaux existent en double
// (A et B) : on lit A et on écrit B, puis on échange à l'image suivante
// (« ping-pong »). 6 buffers de stockage seulement : la limite par défaut
// de WebGPU est 8, donc ça marche sur toutes les cartes graphiques.

import { SIM_WGSL } from './simShader.js';

export class BoidSimulation {
  static GRID = [64, 32, 64];
  static CELL = 2.0;
  static WORLD_MIN = [-64, 0, -64];
  static WORLD_MAX = [64, 64, 64];

  constructor(device) {
    this.device = device;
    this.count = 0;
    this.mode = 0;
    this.current = 0;
    this.buffers = null;
    this.numCells = BoidSimulation.GRID[0] * BoidSimulation.GRID[1]
      * BoidSimulation.GRID[2];
    this.numBlocks = Math.ceil(this.numCells / 256);

    const module = device.createShaderModule({ code: SIM_WGSL });
    const entries = [{
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'uniform' },
    }];
    for (let b = 1; b <= 6; b += 1) {
      entries.push({
        binding: b,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: 'storage' },
      });
    }
    this.layout = device.createBindGroupLayout({ entries });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.layout],
    });
    const make = (entryPoint) => device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module, entryPoint },
    });
    this.pipelines = {
      clearCells: make('clearCells'),
      countCells: make('countCells'),
      scanBlocks: make('scanBlocks'),
      scanSums: make('scanSums'),
      addOffsets: make('addOffsets'),
      scatter: make('scatter'),
      simulate: make('simulate'),
    };
    this.paramsBuffer = device.createBuffer({
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.params = new ArrayBuffer(128);
  }

  // (Re)crée tous les buffers pour `count` oiseaux, en 3D (mode 0) ou 2D (1).
  resize(count, mode) {
    this.destroy();
    this.count = count;
    this.mode = mode;
    this.current = 0;
    const device = this.device;
    const storage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      | GPUBufferUsage.COPY_SRC;
    const boidBytes = count * 32;
    const make = (size) => device.createBuffer({ size: Math.max(size, 16), usage: storage });

    const b = {
      boidsA: make(boidBytes),
      boidsB: make(boidBytes),
      sorted: make(boidBytes),
      cellCount: make(this.numCells * 4),
      cellData: make((this.numCells + this.numBlocks) * 4),
      boidSlot: make(count * 8),
    };
    this.buffers = b;

    // Positions et vitesses de départ au hasard.
    // Par oiseau : x, y, z, phase, vx, vy, vz, 0.
    const data = new Float32Array(count * 8);
    for (let i = 0; i < count; i += 1) {
      const o = i * 8;
      data[o] = (Math.random() * 2 - 1) * 50;
      data[o + 1] = 12 + Math.random() * 40;
      data[o + 2] = mode === 1 ? 0 : (Math.random() * 2 - 1) * 50;
      data[o + 3] = Math.random() * Math.PI * 2;
      const a = Math.random() * Math.PI * 2;
      data[o + 4] = Math.cos(a) * 8;
      data[o + 5] = mode === 1 ? Math.sin(a) * 8 : (Math.random() - 0.5) * 4;
      data[o + 6] = mode === 1 ? 0 : Math.sin(a) * 8;
    }
    device.queue.writeBuffer(b.boidsA, 0, data);

    const group = (boidsIn, boidsOut) => device.createBindGroup({
      layout: this.layout,
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: boidsIn } },
        { binding: 2, resource: { buffer: boidsOut } },
        { binding: 3, resource: { buffer: b.sorted } },
        { binding: 4, resource: { buffer: b.cellCount } },
        { binding: 5, resource: { buffer: b.cellData } },
        { binding: 6, resource: { buffer: b.boidSlot } },
      ],
    });
    this.bindGroups = [
      group(b.boidsA, b.boidsB),
      group(b.boidsB, b.boidsA),
    ];
  }

  writeParams(dt, time) {
    const u = new Uint32Array(this.params);
    const f = new Float32Array(this.params);
    const grid = BoidSimulation.GRID;
    u[0] = this.count;
    u[1] = this.numCells;
    u[2] = this.mode;
    u[3] = this.numBlocks;
    f[4] = dt;
    f[5] = time;
    f[6] = BoidSimulation.CELL;
    f[7] = 14;
    f[8] = 7;
    f[9] = 22;
    f[10] = 1.7;
    f[11] = 1.0;
    f[12] = 0.85;
    f[13] = BoidSimulation.CELL;
    f[14] = 0.9;
    f[15] = this.mode === 1 ? 14 : 10;
    f.set([...BoidSimulation.WORLD_MIN, 0], 16);
    f.set([...BoidSimulation.WORLD_MAX, 0], 20);
    u.set([grid[0], grid[1], grid[2], 0], 24);
    // Point d'attraction qui se promène lentement (forme de la nuée).
    f[28] = Math.sin(time * 0.13) * 30;
    f[29] = 32 + Math.sin(time * 0.21) * 12;
    f[30] = this.mode === 1 ? 0 : Math.sin(time * 0.17 + 1) * 30;
    f[31] = 0.25;
    this.device.queue.writeBuffer(this.paramsBuffer, 0, this.params);
  }

  step(encoder, dt, time) {
    this.writeParams(dt, time);
    const boidGroups = Math.ceil(this.count / 256);
    const cellGroups = Math.ceil(this.numCells / 256);
    const pass = encoder.beginComputePass();
    pass.setBindGroup(0, this.bindGroups[this.current]);
    const run = (name, groups) => {
      pass.setPipeline(this.pipelines[name]);
      pass.dispatchWorkgroups(groups);
    };
    run('clearCells', cellGroups);
    run('countCells', boidGroups);
    run('scanBlocks', cellGroups);
    run('scanSums', 1);
    run('addOffsets', cellGroups);
    run('scatter', boidGroups);
    run('simulate', boidGroups);
    pass.end();
    this.current = 1 - this.current;
  }

  // Index du jeu de buffers (0 = A, 1 = B) qui contient la dernière image.
  latest() {
    return this.current;
  }

  destroy() {
    if (this.buffers === null) {
      return;
    }
    Object.values(this.buffers).forEach((buffer) => buffer.destroy());
    this.buffers = null;
  }
}
