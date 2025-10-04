# 🎨 Migration Three.js → Canvas 2D avec formes organiques

## 🎯 Objectif

Remplacer l'implémentation Three.js actuelle par un rendu Canvas 2D natif avec des formes organiques blobby (style cellules vivantes). Cela va :
- ✅ Simplifier le code
- ✅ Améliorer les performances
- ✅ Permettre des effets visuels plus organiques
- ✅ **Corriger le bug actuel (particules qui ne bougent pas)**

---

## 🐛 Bug actuel identifié

**Problème probable :** Les boids ne bougent pas car :
1. Les inputs du réseau de neurones peuvent être mal normalisés
2. Les outputs sont en tanh (-1 à 1) mais peut-être trop faibles
3. La logique de wraparound avec coordonnées centrées peut causer des problèmes

**La migration vers Canvas 2D va simplifier tout ça et corriger le bug.**

---

## 📂 Fichiers à modifier

### ✅ À GARDER (logique métier)
- `src/evolution/NeuralBoid.js` - **Adapter légèrement** (enlever mesh Three.js)
- `src/ml/BrainModel.js` - **Garder tel quel** ✅
- `src/utils/mathHelpers.js` - **Garder tel quel** ✅

### 🔄 À REMPLACER COMPLÈTEMENT
- `src/components/Scene3D.jsx` → **Nouveau : `src/components/Canvas2D.jsx`**
- `src/App.jsx` - **Mettre à jour l'import**

### ❌ À SUPPRIMER (dépendances Three.js)
- Supprimer `three` des imports partout

---

## 🎨 Nouveau composant Canvas2D.jsx

### Architecture

```javascript
import { useEffect, useRef } from 'react';
import { NeuralBoid } from '../evolution/NeuralBoid';
import { Vector2, interpolateColor } from '../utils/mathHelpers';

const POPULATION_SIZE = 100;
const PARTICLE_BASE_SIZE = 8;

function Canvas2D() {
  const canvasRef = useRef(null);
  const boidsRef = useRef([]);
  const cursorRef = useRef(new Vector2(0, 0));
  const animationIdRef = useRef(null);

  useEffect(() => {
    // Setup canvas
    // Initialiser boids
    // Animation loop
    // Cleanup
  }, []);

  return <canvas ref={canvasRef} />;
}
```

---

## 🔧 Implémentation détaillée

### 1. Setup du Canvas

```javascript
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');

// Dimensionner le canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuration du contexte pour un rendu lisse
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
```

### 2. Initialisation des Boids

```javascript
const boids = [];
for (let i = 0; i < POPULATION_SIZE; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const boid = new NeuralBoid(x, y);
  boids.push(boid);
}
boidsRef.current = boids;
```

### 3. Gestion du curseur (coordonnées normales, pas centrées)

```javascript
const handleMouseMove = (event) => {
  cursorRef.current.x = event.clientX;
  cursorRef.current.y = event.clientY;
};
canvas.addEventListener('mousemove', handleMouseMove);
```

### 4. Boucle d'animation

```javascript
const animate = () => {
  animationIdRef.current = requestAnimationFrame(animate);

  const width = canvas.width;
  const height = canvas.height;
  const cursor = cursorRef.current;

  // Background avec fade pour effet de trail
  ctx.fillStyle = 'rgba(10, 10, 20, 0.25)';
  ctx.fillRect(0, 0, width, height);

  // Mettre à jour et dessiner chaque boid
  boids.forEach((boid) => {
    // 1. Percevoir
    const inputs = boid.perceive(cursor, boids, width, height);

    // 2. Penser
    const decision = boid.think(inputs);

    // 3. Agir
    boid.applyForce(decision);

    // 4. Mettre à jour position
    boid.update(width, height);

    // 5. Dessiner
    drawBoid(ctx, boid, cursor);
  });
};

animate();
```

### 5. Fonction drawBoid (formes organiques)

```javascript
function drawBoid(ctx, boid, cursor) {
  const { position, velocity } = boid;

  // Calculer la couleur selon distance au curseur
  const distToCursor = Vector2.dist(position, cursor);
  const normalizedDist = Math.min(distToCursor / 300, 1);
  const color = interpolateColor(
    [255, 100, 100], // Rouge (proche du curseur)
    [100, 255, 150], // Vert (loin du curseur)
    normalizedDist
  );

  // Calculer la déformation selon la vitesse
  const speed = velocity.mag();
  const stretchFactor = 1 + (speed / 10); // Plus rapide = plus étiré
  const angle = Math.atan2(velocity.y, velocity.x);

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(angle);

  // Dessiner une forme blobby organique (ellipse étirée)
  ctx.beginPath();
  
  // Créer un blob avec plusieurs points ondulants
  const numPoints = 8;
  const baseRadius = PARTICLE_BASE_SIZE;
  
  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;
    
    // Rayon avec variation sinusoïdale pour effet organique
    const noise = Math.sin(theta * 3 + Date.now() * 0.001) * 0.3;
    const radiusX = baseRadius * stretchFactor * (1 + noise);
    const radiusY = baseRadius * (1 + noise);
    
    const x = Math.cos(theta) * radiusX;
    const y = Math.sin(theta) * radiusY;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();

  // Dégradé radial pour effet de volume
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 2);
  gradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`);
  gradient.addColorStop(0.7, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`);
  gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
  
  ctx.fillStyle = gradient;
  ctx.fill();

  // Contour subtil
  ctx.strokeStyle = `rgba(${color[0] + 50}, ${color[1] + 50}, ${color[2] + 50}, 0.6)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
```

### 6. Effets additionnels optionnels

**Dessiner les liens entre particules proches :**

```javascript
function drawLinks(ctx, boids) {
  const linkDistance = 60;
  
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
  ctx.lineWidth = 0.5;

  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < boids.length; j++) {
      const dist = Vector2.dist(boids[i].position, boids[j].position);
      if (dist < linkDistance) {
        ctx.beginPath();
        ctx.moveTo(boids[i].position.x, boids[i].position.y);
        ctx.lineTo(boids[j].position.x, boids[j].position.y);
        ctx.stroke();
      }
    }
  }
}

// Dans la boucle d'animation, avant de dessiner les boids :
drawLinks(ctx, boids);
```

**Dessiner les trails :**

```javascript
function drawTrail(ctx, boid) {
  if (boid.trail.length < 2) return;

  ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < boid.trail.length; i++) {
    const point = boid.trail[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  
  ctx.stroke();
}

// Dans drawBoid, appeler drawTrail avant de dessiner la particule
```

---

## 🔄 Modifications NeuralBoid.js

### Changements à faire

1. **Supprimer les références à Three.js mesh**

```javascript
// SUPPRIMER cette ligne du constructor :
this.mesh = null;

// SUPPRIMER cette section dans update() :
if (this.mesh) {
  this.mesh.position.x = this.position.x;
  this.mesh.position.y = this.position.y;
}

// SUPPRIMER dans dispose() :
if (this.mesh) {
  this.mesh.geometry.dispose();
  this.mesh.material.dispose();
}
```

2. **Adapter perceive() pour coordonnées non-centrées**

```javascript
perceive(cursorPos, boids, screenWidth, screenHeight) {
  const inputs = [];

  // 1. Distance au curseur (normalisée)
  const distToCursor = Vector2.dist(this.position, cursorPos);
  inputs.push(distToCursor / Math.max(screenWidth, screenHeight));

  // 2. Angle vers curseur
  const angleToCursor = Vector2.angleBetween(this.position, cursorPos);
  inputs.push(angleToCursor / Math.PI);

  // ... reste du code identique ...

  // 7-8. Position X et Y relative (normalisée 0-1)
  inputs.push(this.position.x / screenWidth);
  inputs.push(this.position.y / screenHeight);

  return inputs;
}
```

3. **Adapter update() pour wraparound normal**

```javascript
update(screenWidth, screenHeight) {
  // Physique
  this.velocity.add(this.acceleration);
  this.velocity.limit(MAX_SPEED);
  this.position.add(this.velocity);
  this.acceleration.mult(0);

  // Wraparound aux bords (coordonnées normales 0 → width/height)
  if (this.position.x < 0) this.position.x = screenWidth;
  if (this.position.x > screenWidth) this.position.x = 0;
  if (this.position.y < 0) this.position.y = screenHeight;
  if (this.position.y > screenHeight) this.position.y = 0;

  // Mettre à jour le trail
  this.trail.unshift({ x: this.position.x, y: this.position.y });
  if (this.trail.length > this.maxTrailLength) {
    this.trail.pop();
  }
}
```

4. **Adapter isOutOfBounds()**

```javascript
isOutOfBounds(screenWidth, screenHeight, margin = 50) {
  return this.position.x < -margin ||
         this.position.x > screenWidth + margin ||
         this.position.y < -margin ||
         this.position.y > screenHeight + margin;
}
```

---

## 🔄 Modifications App.jsx

```javascript
import Canvas2D from './components/Canvas2D'
import './App.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas2D />
    </div>
  )
}

export default App
```

---

## 📦 Modifications package.json

**Supprimer la dépendance Three.js :**

```json
{
  "dependencies": {
    "@tensorflow/tfjs": "^4.22.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
    // SUPPRIMER: "three": "^0.180.0"
  }
}
```

Puis exécuter : `pnpm install`

---

## ✅ Checklist de migration

- [ ] Créer `src/components/Canvas2D.jsx` avec le code ci-dessus
- [ ] Modifier `src/evolution/NeuralBoid.js` (supprimer références Three.js, adapter coordonnées)
- [ ] Modifier `src/App.jsx` (changer import)
- [ ] Supprimer `src/components/Scene3D.jsx`
- [ ] Supprimer `three` du `package.json`
- [ ] Exécuter `pnpm install`
- [ ] Tester : `pnpm dev`

---

## 🐛 Debug : Pourquoi les particules ne bougent pas actuellement

**Causes probables :**

1. **Outputs trop faibles** : tanh retourne [-1, 1], multiplié par MAX_FORCE (0.3) = forces de [-0.3, 0.3]. C'est peut-être trop faible.

2. **Inputs mal normalisés** : Les coordonnées centrées peuvent créer des valeurs négatives qui perturbent le réseau.

3. **Wraparound problématique** : Avec les coordonnées centrées, le wraparound peut téléporter les particules.

**Solutions dans la migration :**
- ✅ Coordonnées normales (0 → width/height) plus simples
- ✅ Augmenter MAX_FORCE si besoin
- ✅ Meilleur contrôle du rendu pour debug visuel

---

## 🎨 Résultat attendu

Après la migration, tu devrais avoir :
- ✅ Des particules qui **bougent** (bug corrigé)
- ✅ Des formes organiques blobby qui se déforment
- ✅ Des effets visuels (glow, trails optionnels)
- ✅ Code plus simple et maintenable
- ✅ Meilleures performances

---

## 🚀 Prochaines étapes (après migration)

1. **Vérifier que les particules bougent** ✅
2. **Implémenter l'algorithme génétique** (Phase 2)
3. **Ajouter l'UI d'évolution** (Phase 3)
4. **Fine-tuner les comportements** (Phase 4)

---

## 💡 Notes importantes

- **GARDER** toute la logique ML (BrainModel.js)
- **GARDER** les helpers mathématiques (mathHelpers.js)
- **REMPLACER** uniquement la couche de rendu
- Le bug actuel est très probablement lié aux coordonnées centrées de Three.js

**Cette migration devrait prendre ~30 minutes avec Claude Code et corriger le bug actuel.**