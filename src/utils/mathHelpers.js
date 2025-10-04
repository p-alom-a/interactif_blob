// Constantes
export const SCREEN_WIDTH = window.innerWidth;
export const SCREEN_HEIGHT = window.innerHeight;

// Classe Vector2 simple pour les calculs 2D
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    const mSq = this.x * this.x + this.y * this.y;
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq));
      this.mult(max);
    }
    return this;
  }

  setMag(mag) {
    this.normalize();
    this.mult(mag);
    return this;
  }

  copy() {
    return new Vector2(this.x, this.y);
  }

  static random2D() {
    const angle = Math.random() * Math.PI * 2;
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  static dist(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static angleBetween(v1, v2) {
    return Math.atan2(v2.y - v1.y, v2.x - v1.x);
  }
}

// Fonction pour normaliser une valeur entre 0 et 1
export function normalize(value, min, max) {
  return (value - min) / (max - min);
}

// Fonction pour mapper une valeur d'une plage à une autre
export function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

// Fonction pour contraindre une valeur entre min et max
export function constrain(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Interpolation de couleur
export function interpolateColor(color1, color2, factor) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
  }
  return result;
}

// Convertir RGB en hex
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
