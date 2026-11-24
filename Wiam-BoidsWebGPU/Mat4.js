// Mat4.js
// Petites fonctions de matrices 4x4 (colonnes d'abord, profondeur 0..1 comme
// WebGPU) pour la caméra : perspective, orthographique, lookAt, produit, inverse.

export class Mat4 {
  static perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = far / (near - far);
    out[11] = -1;
    out[14] = (near * far) / (near - far);
    return out;
  }

  static ortho(left, right, bottom, top, near, far) {
    const out = new Float32Array(16);
    out[0] = 2 / (right - left);
    out[5] = 2 / (top - bottom);
    out[10] = 1 / (near - far);
    out[12] = (left + right) / (left - right);
    out[13] = (top + bottom) / (bottom - top);
    out[14] = near / (near - far);
    out[15] = 1;
    return out;
  }

  static lookAt(eye, target, up) {
    let zx = eye[0] - target[0];
    let zy = eye[1] - target[1];
    let zz = eye[2] - target[2];
    let len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;
    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;
    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1,
    ]);
  }

  static multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c += 1) {
      for (let r = 0; r < 4; r += 1) {
        let sum = 0;
        for (let k = 0; k < 4; k += 1) {
          sum += a[k * 4 + r] * b[c * 4 + k];
        }
        out[c * 4 + r] = sum;
      }
    }
    return out;
  }

  static invert(m) {
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    const inv = det === 0 ? 0 : 1 / det;
    return new Float32Array([
      (a11 * b11 - a12 * b10 + a13 * b09) * inv,
      (a02 * b10 - a01 * b11 - a03 * b09) * inv,
      (a31 * b05 - a32 * b04 + a33 * b03) * inv,
      (a22 * b04 - a21 * b05 - a23 * b03) * inv,
      (a12 * b08 - a10 * b11 - a13 * b07) * inv,
      (a00 * b11 - a02 * b08 + a03 * b07) * inv,
      (a32 * b02 - a30 * b05 - a33 * b01) * inv,
      (a20 * b05 - a22 * b02 + a23 * b01) * inv,
      (a10 * b10 - a11 * b08 + a13 * b06) * inv,
      (a01 * b08 - a00 * b10 - a03 * b06) * inv,
      (a30 * b04 - a31 * b02 + a33 * b00) * inv,
      (a21 * b02 - a20 * b04 - a23 * b00) * inv,
      (a11 * b07 - a10 * b09 - a12 * b06) * inv,
      (a00 * b09 - a01 * b07 + a02 * b06) * inv,
      (a31 * b01 - a30 * b03 - a32 * b00) * inv,
      (a20 * b03 - a21 * b01 + a22 * b00) * inv,
    ]);
  }
}
