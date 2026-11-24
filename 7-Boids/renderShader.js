// renderShader.js
// Dessin (WGSL, WebGPU) : le ciel brumeux et le champ (un seul triangle
// plein écran), puis chaque oiseau dessiné en instances, orienté selon sa
// vitesse, avec des ailes qui battent.

export const RENDER_WGSL = /* wgsl */ `
struct Uniforms {
  viewProj: mat4x4<f32>,
  invViewProj: mat4x4<f32>,
  camPos: vec4<f32>,
  params: vec4<f32>,
};

@group(0) @binding(0) var<uniform> U: Uniforms;
struct Boid {
  pos: vec4<f32>,
  vel: vec4<f32>,
};

@group(0) @binding(1) var<storage, read> boids: array<Boid>;

const HAZE = vec3<f32>(0.86, 0.9, 0.94);
const SKY_TOP = vec3<f32>(0.55, 0.69, 0.88);
const PLUM = vec3<f32>(0.36, 0.22, 0.29);
const ORANGE = vec3<f32>(1.0, 0.47, 0.22);

// ---------- Ciel et champ ----------

struct SkyOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) ndc: vec2<f32>,
};

@vertex
fn vsSky(@builtin(vertex_index) vi: u32) -> SkyOut {
  var corners = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var out: SkyOut;
  out.clip = vec4<f32>(corners[vi], 0.0, 1.0);
  out.ndc = corners[vi];
  return out;
}

fn hash2(p: vec2<f32>) -> f32 {
  return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

fn noise2(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash2(i);
  let b = hash2(i + vec2<f32>(1.0, 0.0));
  let c = hash2(i + vec2<f32>(0.0, 1.0));
  let d = hash2(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

@fragment
fn fsSky(in: SkyOut) -> @location(0) vec4<f32> {
  // Vue 2D : simple dégradé vertical.
  if (U.params.y > 0.5) {
    let t = in.ndc.y * 0.5 + 0.5;
    return vec4<f32>(mix(HAZE, SKY_TOP, t), 1.0);
  }
  let nearP = U.invViewProj * vec4<f32>(in.ndc, 0.0, 1.0);
  let farP = U.invViewProj * vec4<f32>(in.ndc, 1.0, 1.0);
  let ro = U.camPos.xyz;
  let rd = normalize(farP.xyz / farP.w - nearP.xyz / nearP.w);

  if (rd.y < -0.0001) {
    // Le champ : sol beige avec des taches de fleurs orange.
    let t = -ro.y / rd.y;
    let hit = ro + rd * t;
    let n = noise2(hit.xz * 0.12) * 0.6 + noise2(hit.xz * 0.5) * 0.4;
    let beige = vec3<f32>(0.84, 0.78, 0.62);
    var ground = mix(beige, ORANGE, smoothstep(0.58, 0.72, n) * 0.85);
    ground = ground * (0.92 + 0.08 * noise2(hit.xz * 2.0));
    let fog = 1.0 - exp(-t * 0.0045);
    return vec4<f32>(mix(ground, HAZE, fog), 1.0);
  }
  let sky = mix(HAZE, SKY_TOP, pow(clamp(rd.y, 0.0, 1.0), 0.45));
  return vec4<f32>(sky, 1.0);
}

// ---------- Oiseaux ----------

struct BirdOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) fog: f32,
};

// Sommets locaux : x = droite, y = haut, z = avant.
fn birdLocal(tri: u32, corner: u32, flap: f32, birds: bool) -> vec3<f32> {
  if (!birds) {
    var arrow = array<vec3<f32>, 3>(
      vec3<f32>(0.0, 0.0, 0.7), vec3<f32>(-0.35, 0.0, -0.45),
      vec3<f32>(0.35, 0.0, -0.45));
    return arrow[corner];
  }
  var v = array<vec3<f32>, 9>(
    // Aile gauche.
    vec3<f32>(0.0, 0.0, 0.45), vec3<f32>(0.0, 0.0, -0.45),
    vec3<f32>(-1.15, flap, -0.2),
    // Aile droite.
    vec3<f32>(0.0, 0.0, 0.45), vec3<f32>(1.15, flap, -0.2),
    vec3<f32>(0.0, 0.0, -0.45),
    // Queue.
    vec3<f32>(0.0, 0.0, -0.25), vec3<f32>(-0.28, 0.0, -0.85),
    vec3<f32>(0.28, 0.0, -0.85));
  return v[tri * 3u + corner];
}

@vertex
fn vsBird(@builtin(vertex_index) vi: u32,
          @builtin(instance_index) ii: u32) -> BirdOut {
  let p = boids[ii].pos;
  let velocity = boids[ii].vel.xyz;
  let birds = U.params.z > 0.5;
  let time = U.params.x;
  let scale = U.camPos.w;
  let flap = sin(time * 13.0 + p.w) * 0.6;
  let tri = vi / 3u;

  var f = velocity;
  if (length(f) < 0.0001) {
    f = vec3<f32>(0.0, 0.0, 1.0);
  }
  f = normalize(f);
  var up = vec3<f32>(0.0, 1.0, 0.0);
  if (abs(f.y) > 0.98) {
    up = vec3<f32>(1.0, 0.0, 0.0);
  }
  let r = normalize(cross(up, f));
  let u = cross(f, r);

  let l0 = birdLocal(tri, 0u, flap, birds);
  let l1 = birdLocal(tri, 1u, flap, birds);
  let l2 = birdLocal(tri, 2u, flap, birds);
  let w0 = p.xyz + (r * l0.x + u * l0.y + f * l0.z) * scale;
  let w1 = p.xyz + (r * l1.x + u * l1.y + f * l1.z) * scale;
  let w2 = p.xyz + (r * l2.x + u * l2.y + f * l2.z) * scale;
  var world = w0;
  if (vi % 3u == 1u) {
    world = w1;
  } else if (vi % 3u == 2u) {
    world = w2;
  }

  let normal = normalize(cross(w1 - w0, w2 - w0) + vec3<f32>(0.0, 0.00001, 0.0));
  let light = normalize(vec3<f32>(0.3, 1.0, 0.25));
  let shade = 0.55 + 0.45 * abs(dot(normal, light));
  let h = smoothstep(4.0, 24.0, p.y);
  let base = mix(ORANGE, PLUM, h);

  var out: BirdOut;
  out.clip = U.viewProj * vec4<f32>(world, 1.0);
  out.color = base * shade;
  if (U.params.y > 0.5) {
    out.fog = 0.0;
  } else {
    out.fog = (1.0 - exp(-distance(world, U.camPos.xyz) * 0.006)) * 0.85;
  }
  return out;
}

@fragment
fn fsBird(in: BirdOut) -> @location(0) vec4<f32> {
  return vec4<f32>(mix(in.color, HAZE, in.fog), 1.0);
}
`;
