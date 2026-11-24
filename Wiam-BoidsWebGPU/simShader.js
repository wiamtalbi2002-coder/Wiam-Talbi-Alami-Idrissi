// simShader.js
// Calcul des boids sur la carte graphique (WGSL, WebGPU).
// À chaque image : 1) on range chaque oiseau dans une case d'une grille 3D,
// 2) on trie les oiseaux par case (comptage + somme préfixe), 3) chaque
// oiseau ne regarde que ses voisins des 27 cases autour de lui et applique
// séparation + alignement + cohésion (Craig Reynolds, 1987).

export const SIM_WGSL = /* wgsl */ `
struct Params {
  count: u32, numCells: u32, mode: u32, numBlocks: u32,
  dt: f32, time: f32, cellSize: f32, maxSpeed: f32,
  minSpeed: f32, maxForce: f32, sepW: f32, aliW: f32,
  cohW: f32, radius: f32, sepRadius: f32, perCell: f32,
  worldMin: vec4<f32>,
  worldMax: vec4<f32>,
  gridDims: vec4<u32>,
  attractor: vec4<f32>,
};

// Un oiseau = position (w = phase du battement d'ailes) + vitesse.
struct Boid {
  pos: vec4<f32>,
  vel: vec4<f32>,
};

@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read_write> boidsIn: array<Boid>;
@group(0) @binding(2) var<storage, read_write> boidsOut: array<Boid>;
@group(0) @binding(3) var<storage, read_write> sorted: array<Boid>;
@group(0) @binding(4) var<storage, read_write> cellCount: array<atomic<u32>>;
// cellData : [0, numCells) = début de chaque case, puis les totaux de blocs.
@group(0) @binding(5) var<storage, read_write> cellData: array<u32>;
// boidSlot[i] = (case de l'oiseau, rang dans la case).
@group(0) @binding(6) var<storage, read_write> boidSlot: array<vec2<u32>>;

var<workgroup> scratch: array<u32, 256>;

fn cellCoord(p: vec3<f32>) -> vec3<i32> {
  let rel = (p - P.worldMin.xyz) / P.cellSize;
  let g = vec3<i32>(P.gridDims.xyz);
  return clamp(vec3<i32>(floor(rel)), vec3<i32>(0), g - vec3<i32>(1));
}

fn cellIndex(c: vec3<i32>) -> u32 {
  let g = P.gridDims;
  return u32(c.x) + g.x * (u32(c.y) + g.y * u32(c.z));
}

fn limitLen(v: vec3<f32>, m: f32) -> vec3<f32> {
  let l = length(v);
  if (l > m && l > 0.0) {
    return v * (m / l);
  }
  return v;
}

// Steering de Reynolds : vitesse désirée - vitesse actuelle, limitée.
fn steerTo(dir: vec3<f32>, vel: vec3<f32>) -> vec3<f32> {
  let l = length(dir);
  if (l < 0.00001) {
    return vec3<f32>(0.0);
  }
  return limitLen(dir / l * P.maxSpeed - vel, P.maxForce);
}

@compute @workgroup_size(256)
fn clearCells(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= P.numCells) {
    return;
  }
  atomicStore(&cellCount[id.x], 0u);
}

@compute @workgroup_size(256)
fn countCells(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= P.count) {
    return;
  }
  let c = cellIndex(cellCoord(boidsIn[i].pos.xyz));
  boidSlot[i] = vec2<u32>(c, atomicAdd(&cellCount[c], 1u));
}

// Somme préfixe par blocs de 256 cases.
@compute @workgroup_size(256)
fn scanBlocks(@builtin(global_invocation_id) gid: vec3<u32>,
              @builtin(local_invocation_id) lid: vec3<u32>,
              @builtin(workgroup_id) wid: vec3<u32>) {
  let i = gid.x;
  var v = 0u;
  if (i < P.numCells) {
    v = atomicLoad(&cellCount[i]);
  }
  scratch[lid.x] = v;
  workgroupBarrier();
  for (var off = 1u; off < 256u; off = off * 2u) {
    var add = 0u;
    if (lid.x >= off) {
      add = scratch[lid.x - off];
    }
    workgroupBarrier();
    scratch[lid.x] = scratch[lid.x] + add;
    workgroupBarrier();
  }
  if (i < P.numCells) {
    cellData[i] = scratch[lid.x] - v;
  }
  if (lid.x == 255u) {
    cellData[P.numCells + wid.x] = scratch[255];
  }
}

// Somme préfixe des totaux de blocs (un seul groupe de 256 fils).
@compute @workgroup_size(256)
fn scanSums(@builtin(local_invocation_id) lid: vec3<u32>) {
  let per = (P.numBlocks + 255u) / 256u;
  let start = lid.x * per;
  var total = 0u;
  for (var k = 0u; k < per; k = k + 1u) {
    let idx = start + k;
    if (idx < P.numBlocks) {
      total = total + cellData[P.numCells + idx];
    }
  }
  scratch[lid.x] = total;
  workgroupBarrier();
  for (var off = 1u; off < 256u; off = off * 2u) {
    var add = 0u;
    if (lid.x >= off) {
      add = scratch[lid.x - off];
    }
    workgroupBarrier();
    scratch[lid.x] = scratch[lid.x] + add;
    workgroupBarrier();
  }
  var running = scratch[lid.x] - total;
  for (var k = 0u; k < per; k = k + 1u) {
    let idx = start + k;
    if (idx < P.numBlocks) {
      let s = cellData[P.numCells + idx];
      cellData[P.numCells + idx] = running;
      running = running + s;
    }
  }
}

@compute @workgroup_size(256)
fn addOffsets(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= P.numCells) {
    return;
  }
  cellData[i] = cellData[i] + cellData[P.numCells + i / 256u];
}

@compute @workgroup_size(256)
fn scatter(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= P.count) {
    return;
  }
  let slot = boidSlot[i];
  sorted[cellData[slot.x] + slot.y] = boidsIn[i];
}

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= P.count) {
    return;
  }
  let me = boidsIn[i];
  let p = me.pos.xyz;
  let phase = me.pos.w;
  var v = me.vel.xyz;
  let cc = cellCoord(p);
  let g = vec3<i32>(P.gridDims.xyz);
  let r2 = P.radius * P.radius;
  let s2 = P.sepRadius * P.sepRadius;
  let maxPerCell = u32(P.perCell);

  var sep = vec3<f32>(0.0);
  var ali = vec3<f32>(0.0);
  var coh = vec3<f32>(0.0);
  var n = 0u;

  var zr = 1;
  if (P.mode == 1u) {
    zr = 0;
  }
  for (var dz = -zr; dz <= zr; dz = dz + 1) {
    for (var dy = -1; dy <= 1; dy = dy + 1) {
      for (var dx = -1; dx <= 1; dx = dx + 1) {
        let c = cc + vec3<i32>(dx, dy, dz);
        if (any(c < vec3<i32>(0)) || any(c >= g)) {
          continue;
        }
        let ci = cellIndex(c);
        let start = cellData[ci];
        let cnt = min(atomicLoad(&cellCount[ci]), maxPerCell);
        for (var k = 0u; k < cnt; k = k + 1u) {
          let other = sorted[start + k];
          let q = other.pos.xyz;
          let d = p - q;
          let d2 = dot(d, d);
          if (d2 < 0.00000001 || d2 > r2) {
            continue;
          }
          ali = ali + other.vel.xyz;
          coh = coh + q;
          n = n + 1u;
          if (d2 < s2) {
            sep = sep + d / d2;
          }
        }
      }
    }
  }

  var acc = vec3<f32>(0.0);
  if (n > 0u) {
    acc = acc + steerTo(sep, v) * P.sepW;
    acc = acc + steerTo(ali / f32(n), v) * P.aliW;
    acc = acc + steerTo(coh / f32(n) - p, v) * P.cohW;
  }

  // Point d'attraction qui se promène : la nuée tourbillonne (murmuration).
  acc = acc + steerTo(P.attractor.xyz - p, v) * P.attractor.w;

  // Containment : on repousse vers l'intérieur de la boîte.
  let innerMin = P.worldMin.xyz + vec3<f32>(10.0);
  let innerMax = P.worldMax.xyz - vec3<f32>(10.0);
  var push = max(innerMin - p, vec3<f32>(0.0)) - max(p - innerMax, vec3<f32>(0.0));
  if (P.mode == 1u) {
    push.z = 0.0;
  }
  acc = acc + push * 3.0;

  v = v + acc * P.dt;
  if (P.mode == 1u) {
    v.z = 0.0;
  }
  let sp = length(v);
  v = v / max(sp, 0.00001) * clamp(sp, P.minSpeed, P.maxSpeed);
  var np = p + v * P.dt;
  if (P.mode == 1u) {
    np.z = 0.0;
  }
  np = clamp(np, P.worldMin.xyz, P.worldMax.xyz - vec3<f32>(0.001));
  boidsOut[i] = Boid(vec4<f32>(np, phase), vec4<f32>(v, 0.0));
}
`;
