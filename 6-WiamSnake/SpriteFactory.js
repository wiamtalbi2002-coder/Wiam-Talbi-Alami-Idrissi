// SpriteFactory.js
// Pré-calcule une seule fois les images lumineuses (sphères 3D, orbes,
// ombres) puis les met en cache : dessiner une image est bien plus rapide
// que recalculer un dégradé et un halo pour chaque anneau à chaque frame.

class SpriteFactory {
  static SIZE = 128;
  static R = 40;
  static cache = new Map();

  // Taille d'image à dessiner pour obtenir une sphère de rayon r.
  static drawSize(r) {
    return (SpriteFactory.SIZE * r) / SpriteFactory.R;
  }

  // Sphère brillante « 3D » avec halo néon.
  static sphere(hex) {
    let key = `sphere-${hex}`;
    if (SpriteFactory.cache.has(key)) {
      return SpriteFactory.cache.get(key);
    }
    let size = SpriteFactory.SIZE;
    let r = SpriteFactory.R;
    let c = size / 2;
    let g = createGraphics(size, size);
    g.pixelDensity(1);
    let ctx = g.drawingContext;

    // Halo lumineux.
    ctx.save();
    ctx.shadowColor = hex;
    ctx.shadowBlur = 26;
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ombrage sphérique : lumière en haut à gauche.
    let gradient = ctx.createRadialGradient(
      c - r * 0.35, c - r * 0.4, r * 0.05, c, c, r,
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, SpriteFactory.mix(hex, '#ffffff', 0.55));
    gradient.addColorStop(0.62, hex);
    gradient.addColorStop(1, SpriteFactory.mix(hex, '#2a0033', 0.55));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();

    // Reflet de bord (lumière rebondie en bas à droite).
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, r - 3, 0.1 * Math.PI, 0.55 * Math.PI);
    ctx.stroke();

    SpriteFactory.cache.set(key, g);
    return g;
  }

  // Petite perle lumineuse (nourriture, étincelles).
  static orb(hex) {
    let key = `orb-${hex}`;
    if (SpriteFactory.cache.has(key)) {
      return SpriteFactory.cache.get(key);
    }
    let size = SpriteFactory.SIZE;
    let r = SpriteFactory.R * 0.7;
    let c = size / 2;
    let g = createGraphics(size, size);
    g.pixelDensity(1);
    let ctx = g.drawingContext;
    let halo = ctx.createRadialGradient(c, c, 0, c, c, size / 2);
    halo.addColorStop(0, SpriteFactory.mix(hex, '#ffffff', 0.3));
    halo.addColorStop(0.35, hex);
    halo.addColorStop(0.6, SpriteFactory.alpha(hex, 0.35));
    halo.addColorStop(1, SpriteFactory.alpha(hex, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);
    let core = ctx.createRadialGradient(
      c - r * 0.3, c - r * 0.3, 0, c, c, r * 0.6,
    );
    core.addColorStop(0, '#ffffff');
    core.addColorStop(1, SpriteFactory.alpha('#ffffff', 0));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(c, c, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    SpriteFactory.cache.set(key, g);
    return g;
  }

  // Ombre douce portée au sol (donne la profondeur).
  static shadow() {
    let key = 'shadow';
    if (SpriteFactory.cache.has(key)) {
      return SpriteFactory.cache.get(key);
    }
    let size = SpriteFactory.SIZE;
    let c = size / 2;
    let g = createGraphics(size, size);
    g.pixelDensity(1);
    let ctx = g.drawingContext;
    let gradient = ctx.createRadialGradient(c, c, 0, c, c, SpriteFactory.R * 1.1);
    gradient.addColorStop(0, 'rgba(10, 0, 25, 0.55)');
    gradient.addColorStop(1, 'rgba(10, 0, 25, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    SpriteFactory.cache.set(key, g);
    return g;
  }

  // Mélange deux couleurs hexadécimales (t = 0 → a, t = 1 → b).
  static mix(a, b, t) {
    let ca = SpriteFactory.rgb(a);
    let cb = SpriteFactory.rgb(b);
    let r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    let gr = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    let bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    return `rgb(${r}, ${gr}, ${bl})`;
  }

  static alpha(hex, a) {
    let c = SpriteFactory.rgb(hex);
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
  }

  static rgb(hex) {
    let n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
}
