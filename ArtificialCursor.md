# 🤖 Curseur Artificiel Intelligent - Instructions Claude Code

## 🎯 Objectif

Ajouter un **curseur artificiel automatique** qui se déplace de façon intelligente pour forcer les boids à évoluer, avec la possibilité de basculer entre mode auto et mode manuel (souris).

---

## 📋 Fonctionnalités à implémenter

### 1. Classe `ArtificialCursor`

**Fichier à créer :** `src/utils/ArtificialCursor.js`

**Comportements du curseur IA :**

- **Mode "Chasseur" (par défaut)** : Le curseur traque activement le centre du groupe de boids
- **Mode "Prédateur rapide"** : Mouvements erratiques et rapides pour stresser les boids
- **Mode "Patrouilleur"** : Mouvement en pattern (cercle, zigzag) prévisible
- **Mode "Aléatoire"** : Téléportation aléatoire toutes les 3 secondes

**Structure de la classe :**

```javascript
export class ArtificialCursor {
  constructor(screenWidth, screenHeight) {
    // Position actuelle
    // Vitesse de déplacement
    // Mode actuel ('hunter', 'predator', 'patrol', 'random')
    // Timer pour changements
  }

  update(boids, deltaTime) {
    // Logique de déplacement selon le mode
    // Retourne {x, y}
  }

  setMode(mode) {
    // Change le mode de comportement
  }
}
```

**Implémentation des modes :**

- **Hunter** : Calcule le centre de masse des boids et se déplace doucement vers lui
- **Predator** : Cible le boid le plus proche et fonce dessus à grande vitesse
- **Patrol** : Suit un pattern géométrique (cercle, carré, etc.)
- **Random** : Saute à une position aléatoire à intervalle régulier

---

### 2. Modification de `Population.js`

**Ajouter au constructor :**

```javascript
// Mode curseur : 'auto' ou 'manual'
this.cursorMode = 'auto';
this.artificialCursor = new ArtificialCursor(window.innerWidth, window.innerHeight);
this.aiCursorMode = 'hunter'; // Mode par défaut de l'IA
```

**Modifier la méthode `update()` :**

```javascript
update(manualCursor, screenWidth, screenHeight, deltaTime) {
  if (!this.isEvolving) return;

  // Déterminer quel curseur utiliser
  let cursor;
  if (this.cursorMode === 'auto') {
    cursor = this.artificialCursor.update(this.boids, deltaTime);
  } else {
    cursor = manualCursor;
  }

  // ... reste du code identique avec 'cursor'
}
```

**Ajouter méthodes de contrôle :**

```javascript
setCursorMode(mode) {
  // 'auto' ou 'manual'
  this.cursorMode = mode;
}

setAICursorBehavior(behavior) {
  // 'hunter', 'predator', 'patrol', 'random'
  this.aiCursorMode = behavior;
  this.artificialCursor.setMode(behavior);
}
```

---

### 3. Modification de `Canvas2D.jsx`

**Ajouter au state :**

```javascript
const [cursorMode, setCursorMode] = useState('auto'); // 'auto' ou 'manual'
const [aiCursorBehavior, setAiCursorBehavior] = useState('hunter');
```

**Modifier l'appel à `population.update()` :**

```javascript
// Dans animate()
population.update(cursor, width, height, deltaTime);
// Le curseur sera automatiquement celui de l'IA si mode='auto'
```

**Ajouter handlers pour l'UI :**

```javascript
const handleCursorModeToggle = () => {
  const newMode = cursorMode === 'auto' ? 'manual' : 'auto';
  setCursorMode(newMode);
  if (populationRef.current) {
    populationRef.current.setCursorMode(newMode);
  }
};

const handleAICursorBehaviorChange = (behavior) => {
  setAiCursorBehavior(behavior);
  if (populationRef.current) {
    populationRef.current.setAICursorBehavior(behavior);
  }
};
```

**Dessiner le curseur artificiel si mode auto :**

```javascript
// Dans la boucle d'animation, après avoir dessiné les boids
if (cursorMode === 'auto' && populationRef.current) {
  const aiCursor = populationRef.current.artificialCursor;
  drawAICursor(ctx, aiCursor.position.x, aiCursor.position.y);
}

function drawAICursor(ctx, x, y) {
  ctx.save();
  
  // Cercle extérieur pulsant
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
  ctx.lineWidth = 3;
  const pulseRadius = 20 + Math.sin(Date.now() * 0.005) * 5;
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Croix centrale
  ctx.strokeStyle = 'rgba(255, 100, 100, 1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
  
  // Label mode
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '12px monospace';
  ctx.fillText('IA', x + 25, y + 5);
  
  ctx.restore();
}
```

---

### 4. Modification de `EvolutionUI.jsx`

**Ajouter nouveau panneau de contrôle :**

```javascript
// Props à ajouter
function EvolutionUI({ 
  population, 
  onReset, 
  onTogglePause, 
  onSpeedUp, 
  onSave, 
  onDownload,
  cursorMode,           // NOUVEAU
  onCursorModeToggle,   // NOUVEAU
  aiCursorBehavior,     // NOUVEAU
  onAICursorBehaviorChange // NOUVEAU
}) {
  // ... code existant
}
```

**Ajouter section UI (après les contrôles existants) :**

```jsx
{/* Contrôle du curseur */}
<div style={{
  marginTop: '15px',
  padding: '10px',
  backgroundColor: 'rgba(255, 100, 100, 0.15)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 100, 100, 0.3)'
}}>
  <div style={{ fontSize: '12px', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.6)' }}>
    🎯 Contrôle du curseur :
  </div>
  
  <button
    onClick={onCursorModeToggle}
    style={{
      padding: '8px 16px',
      backgroundColor: cursorMode === 'auto' 
        ? 'rgba(255, 100, 100, 0.3)' 
        : 'rgba(100, 200, 255, 0.3)',
      color: cursorMode === 'auto' ? '#ff6666' : '#64c8ff',
      border: `1px solid ${cursorMode === 'auto' ? '#ff6666' : '#64c8ff'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontSize: '12px',
      fontWeight: 'bold',
      width: '100%',
      marginBottom: '8px'
    }}
  >
    {cursorMode === 'auto' ? '🤖 IA Active' : '🖱️ Souris Active'}
  </button>
  
  {cursorMode === 'auto' && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
        Mode IA :
      </div>
      <select
        value={aiCursorBehavior}
        onChange={(e) => onAICursorBehaviorChange(e.target.value)}
        style={{
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          border: '1px solid rgba(255, 100, 100, 0.5)',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        <option value="hunter">🎯 Chasseur (centre groupe)</option>
        <option value="predator">⚡ Prédateur (rapide)</option>
        <option value="patrol">🔄 Patrouilleur (pattern)</option>
        <option value="random">🎲 Aléatoire (téléport)</option>
      </select>
    </div>
  )}
</div>
```

---

### 5. Mise à jour de `Canvas2D.jsx` (partie render)

**Passer les nouvelles props à EvolutionUI :**

```jsx
<EvolutionUI
  population={populationRef.current}
  onReset={handleReset}
  onTogglePause={handleTogglePause}
  onSpeedUp={handleSpeedUp}
  onSave={handleSave}
  onDownload={handleDownload}
  cursorMode={cursorMode}
  onCursorModeToggle={handleCursorModeToggle}
  aiCursorBehavior={aiCursorBehavior}
  onAICursorBehaviorChange={handleAICursorBehaviorChange}
/>
```

---

## 🧠 Logique détaillée des modes IA

### Mode "Hunter" (Chasseur)

```javascript
// Calcule centre de masse des boids
const centerX = boids.reduce((sum, b) => sum + b.position.x, 0) / boids.length;
const centerY = boids.reduce((sum, b) => sum + b.position.y, 0) / boids.length;

// Se déplace doucement vers le centre
const speed = 3; // Vitesse modérée
const dx = centerX - this.position.x;
const dy = centerY - this.position.y;
const dist = Math.sqrt(dx * dx + dy * dy);

if (dist > 50) { // Ne pas coller au centre
  this.position.x += (dx / dist) * speed;
  this.position.y += (dy / dist) * speed;
}
```

### Mode "Predator" (Prédateur rapide)

```javascript
// Trouve le boid le plus proche
let closest = null;
let minDist = Infinity;

boids.forEach(b => {
  const dist = Vector2.dist(this.position, b.position);
  if (dist < minDist) {
    minDist = dist;
    closest = b;
  }
});

// Fonce dessus à grande vitesse
if (closest) {
  const speed = 8; // Vitesse élevée
  const dx = closest.position.x - this.position.x;
  const dy = closest.position.y - this.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  this.position.x += (dx / dist) * speed;
  this.position.y += (dy / dist) * speed;
}
```

### Mode "Patrol" (Patrouilleur)

```javascript
// Mouvement en cercle autour du centre de l'écran
const centerX = this.screenWidth / 2;
const centerY = this.screenHeight / 2;
const radius = 300;

this.angle += 0.02; // Vitesse angulaire

this.position.x = centerX + Math.cos(this.angle) * radius;
this.position.y = centerY + Math.sin(this.angle) * radius;
```

### Mode "Random" (Aléatoire)

```javascript
// Téléportation toutes les 3 secondes
this.timer += deltaTime;

if (this.timer >= 3) {
  this.position.x = Math.random() * this.screenWidth;
  this.position.y = Math.random() * this.screenHeight;
  this.timer = 0;
}
```

---

## 🎨 Améliorations visuelles suggérées

### Indicateur visuel du mode

**Dans l'UI, ajouter un bandeau en haut :**

```jsx
{cursorMode === 'auto' && (
  <div style={{
    position: 'fixed',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    backgroundColor: 'rgba(255, 50, 50, 0.9)',
    color: 'white',
    borderRadius: '20px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 1001,
    boxShadow: '0 0 20px rgba(255, 50, 50, 0.5)'
  }}>
    🤖 CURSEUR IA ACTIF - Mode: {aiCursorBehavior.toUpperCase()}
  </div>
)}
```

### Trail du curseur IA

**Garder historique des positions et dessiner un trail :**

```javascript
// Dans ArtificialCursor
this.trail = [];
this.maxTrailLength = 20;

// Dans update()
this.trail.unshift({ x: this.position.x, y: this.position.y });
if (this.trail.length > this.maxTrailLength) {
  this.trail.pop();
}

// Dans Canvas2D, dessiner le trail
function drawAICursorTrail(ctx, trail) {
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  trail.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  
  ctx.stroke();
}
```

---

## 🐛 DEBUG: Pourquoi "Initialisation" persiste

**Problème détecté dans le code actuel:**

Dans `Population.js`, ligne 19, `currentBehavior` est initialisé à `'🧬 Initialisation'`, mais la détection de comportement ne se déclenche que **toutes les 2 secondes** (lignes 64-68).

**Solution rapide:**

Avant d'implémenter le curseur IA, MODIFIE `Population.js` ligne 67 pour forcer une première détection immédiate:

```javascript
// REMPLACER:
if (this.generationTimer - this.lastBehaviorCheck >= 2.0 && cursor) {

// PAR:
if (this.generationTimer - this.lastBehaviorCheck >= 1.0 && cursor) {
```

Et ajouter dans le constructor (après ligne 21):

```javascript
this.lastBehaviorCheck = -2; // Force détection dès la première frame
```

Cela forcera une première détection après 1 seconde au lieu de 2, et le comportement devrait changer.

---

## 🔧 Ordre de priorité des modifications

### ✅ ÉTAPE 1: Fix le bug "Initialisation" (5 min)

Modifie `src/evolution/Population.js`:

1. **Ligne 21** - Change l'initialisation:
```javascript
this.lastBehaviorCheck = -2; // Au lieu de 0
```

2. **Ligne 67** - Change la condition:
```javascript
if (this.generationTimer - this.lastBehaviorCheck >= 1.0 && cursor) { // Au lieu de 2.0
```

Cela devrait résoudre le problème "Initialisation". Teste d'abord cette correction avant d'implémenter le curseur IA.

---

## 🤖 ÉTAPE 2: Implémenter le Curseur Artificiel

### 📁 Fichier 1: `src/utils/ArtificialCursor.js` (NOUVEAU)

**Créer une classe avec 4 modes de comportement:**

```
export class ArtificialCursor {
  constructor(screenWidth, screenHeight)
  update(boids, deltaTime) → retourne {x, y}
  setMode(mode)
}
```

**Modes à implémenter:**

1. **'hunter'** (Chasseur - PAR DÉFAUT):
   - Calcule le centre de masse des boids
   - Se déplace LENTEMENT vers ce centre (speed: 2-3)
   - S'arrête à 80px du centre pour laisser respirer
   - Mouvements fluides et prévisibles

2. **'predator'** (Prédateur):
   - Trouve le boid le plus proche
   - Fonce dessus à GRANDE VITESSE (speed: 6-8)
   - Change de cible régulièrement
   - Crée du stress maximal

3. **'patrol'** (Patrouilleur):
   - Suit un cercle autour du centre de l'écran
   - Rayon: 300px
   - Vitesse angulaire: 0.015 rad/frame
   - Très prévisible, permet d'apprendre des patterns

4. **'random'** (Téléporteur):
   - Saute à une position aléatoire toutes les 3-4 secondes
   - Reste immobile entre les sauts
   - Imprévisible, force l'adaptation rapide

**Structure minimale à coder:**

```javascript
export class ArtificialCursor {
  constructor(screenWidth, screenHeight) {
    this.position = { x: screenWidth / 2, y: screenHeight / 2 };
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.mode = 'hunter';
    this.angle = 0; // Pour patrol
    this.timer = 0; // Pour random
  }

  setMode(mode) {
    this.mode = mode;
    // Reset des variables selon le mode
  }

  update(boids, deltaTime) {
    switch(this.mode) {
      case 'hunter': return this.updateHunter(boids);
      case 'predator': return this.updatePredator(boids);
      case 'patrol': return this.updatePatrol(deltaTime);
      case 'random': return this.updateRandom(deltaTime);
    }
    return this.position;
  }

  updateHunter(boids) {
    // Logique chasseur
  }

  // etc...
}
```

**Points importants:**
- Utilise `Vector2` de `../utils/mathHelpers` pour les calculs
- Chaque update retourne `{x, y}` (pas un Vector2)
- Garde le curseur dans les limites de l'écran
- Mouvements FLUIDES (interpolation, pas de téléportation sauf mode random)

---

### 📁 Fichier 2: Modifier `src/evolution/Population.js`

**Imports à ajouter en haut:**
```javascript
import { ArtificialCursor } from '../utils/ArtificialCursor';
```

**Dans le constructor, APRÈS ligne 21:**
```javascript
// Mode curseur: 'auto' ou 'manual'
this.cursorMode = 'auto'; // Démarrer en mode automatique
this.artificialCursor = new ArtificialCursor(
  window.innerWidth, 
  window.innerHeight
);
```

**Modifier la méthode `update()`, REMPLACER ligne 35-37:**

```javascript
update(manualCursor, screenWidth, screenHeight, deltaTime) {
  if (!this.isEvolving) return;

  // Déterminer quel curseur utiliser
  let cursor;
  if (this.cursorMode === 'auto') {
    cursor = this.artificialCursor.update(this.boids, deltaTime);
  } else {
    cursor = manualCursor; // Curseur souris normal
  }

  // Sauvegarder pour détection de comportement
  this.lastCursor = cursor;

  // ... reste du code IDENTIQUE
}
```

**Ajouter ces méthodes à la fin de la classe Population:**

```javascript
/**
 * Bascule entre curseur auto et manuel
 */
setCursorMode(mode) {
  this.cursorMode = mode; // 'auto' ou 'manual'
  console.log(`🎯 Mode curseur: ${mode}`);
}

/**
 * Change le comportement du curseur IA
 */
setAICursorBehavior(behavior) {
  this.artificialCursor.setMode(behavior);
  console.log(`🤖 Curseur IA: ${behavior}`);
}

/**
 * Récupère la position actuelle du curseur (pour affichage)
 */
getCursorPosition() {
  if (this.cursorMode === 'auto') {
    return this.artificialCursor.position;
  }
  return null; // En mode manuel, pas besoin d'afficher
}
```

---

### 📁 Fichier 3: Modifier `src/components/Canvas2D.jsx`

**Ajouter states en haut, APRÈS ligne 12:**
```javascript
const [cursorMode, setCursorMode] = useState('auto');
const [aiCursorBehavior, setAiCursorBehavior] = useState('hunter');
```

**Modifier la boucle d'animation, APRÈS avoir dessiné les boids (ligne ~65):**

```javascript
// Dessiner le curseur artificiel si mode auto
if (cursorMode === 'auto' && populationRef.current) {
  const aiPos = populationRef.current.getCursorPosition();
  if (aiPos) {
    drawAICursor(ctx, aiPos.x, aiPos.y, aiCursorBehavior);
  }
}
```

**Ajouter cette fonction AVANT le return, après drawBoid:**

```javascript
function drawAICursor(ctx, x, y, mode) {
  ctx.save();
  
  // Couleur selon le mode
  const colors = {
    hunter: [255, 100, 100],   // Rouge
    predator: [255, 50, 255],  // Magenta
    patrol: [100, 200, 255],   // Bleu
    random: [255, 255, 100]    // Jaune
  };
  const color = colors[mode] || [255, 100, 100];
  
  // Cercle pulsant
  const time = Date.now() * 0.005;
  const pulseRadius = 25 + Math.sin(time) * 8;
  
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Cercle intérieur
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();
  
  // Croix centrale
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 8, y);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.stroke();
  
  // Label "IA"
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
  ctx.font = 'bold 14px monospace';
  ctx.fillText('IA', x + 30, y + 5);
  
  ctx.restore();
}
```

**Ajouter handlers AVANT le return, après handleDownload:**

```javascript
const handleCursorModeToggle = () => {
  const newMode = cursorMode === 'auto' ? 'manual' : 'auto';
  setCursorMode(newMode);
  if (populationRef.current) {
    populationRef.current.setCursorMode(newMode);
  }
};

const handleAICursorBehaviorChange = (behavior) => {
  setAiCursorBehavior(behavior);
  if (populationRef.current) {
    populationRef.current.setAICursorBehavior(behavior);
  }
};
```

**Modifier le passage de props à EvolutionUI (ligne ~120):**

```javascript
<EvolutionUI
  population={populationRef.current}
  onReset={handleReset}
  onTogglePause={handleTogglePause}
  onSpeedUp={handleSpeedUp}
  onSave={handleSave}
  onDownload={handleDownload}
  cursorMode={cursorMode}
  onCursorModeToggle={handleCursorModeToggle}
  aiCursorBehavior={aiCursorBehavior}
  onAICursorBehaviorChange={handleAICursorBehaviorChange}
/>
```

---

### 📁 Fichier 4: Modifier `src/components/EvolutionUI.jsx`

**Modifier la signature de la fonction (ligne 3):**

```javascript
function EvolutionUI({ 
  population, 
  onReset, 
  onTogglePause, 
  onSpeedUp, 
  onSave, 
  onDownload,
  cursorMode,                    // NOUVEAU
  onCursorModeToggle,            // NOUVEAU
  aiCursorBehavior,              // NOUVEAU
  onAICursorBehaviorChange       // NOUVEAU
}) {
```

**Ajouter cette section APRÈS les boutons de contrôle (après ligne ~165), AVANT le message info:**

```javascript
{/* Contrôle du curseur IA */}
<div style={{
  marginTop: '15px',
  padding: '12px',
  backgroundColor: cursorMode === 'auto' 
    ? 'rgba(255, 100, 100, 0.15)' 
    : 'rgba(100, 200, 255, 0.15)',
  borderRadius: '8px',
  border: `1px solid ${cursorMode === 'auto' ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 200, 255, 0.3)'}`
}}>
  <div style={{ 
    fontSize: '12px', 
    marginBottom: '10px', 
    color: 'rgba(255, 255, 255, 0.6)' 
  }}>
    🎯 Contrôle du curseur
  </div>
  
  <button
    onClick={onCursorModeToggle}
    style={{
      padding: '10px 16px',
      backgroundColor: cursorMode === 'auto' 
        ? 'rgba(255, 100, 100, 0.3)' 
        : 'rgba(100, 200, 255, 0.3)',
      color: cursorMode === 'auto' ? '#ff6666' : '#64c8ff',
      border: `2px solid ${cursorMode === 'auto' ? '#ff6666' : '#64c8ff'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontSize: '13px',
      fontWeight: 'bold',
      width: '100%',
      marginBottom: '10px',
      transition: 'all 0.2s'
    }}
  >
    {cursorMode === 'auto' ? '🤖 IA Activée' : '🖱️ Souris Active'}
  </button>
  
  {cursorMode === 'auto' && (
    <div>
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '6px'
      }}>
        Comportement IA:
      </div>
      <select
        value={aiCursorBehavior}
        onChange={(e) => onAICursorBehaviorChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          border: '1px solid rgba(255, 100, 100, 0.5)',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '12px',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="hunter">🎯 Chasseur (suit le groupe)</option>
        <option value="predator">⚡ Prédateur (agressif)</option>
        <option value="patrol">🔄 Patrouilleur (cercles)</option>
        <option value="random">🎲 Téléporteur (aléatoire)</option>
      </select>
    </div>
  )}
</div>
```

---

## 🎨 Améliorations visuelles optionnelles

### Bandeau en haut de l'écran

Dans `Canvas2D.jsx`, ajouter AVANT le `<canvas>` dans le return:

```javascript
{cursorMode === 'auto' && (
  <div style={{
    position: 'fixed',
    top: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    backgroundColor: 'rgba(255, 50, 50, 0.9)',
    color: 'white',
    borderRadius: '25px',
    fontFamily: 'monospace',
    fontSize: '15px',
    fontWeight: 'bold',
    zIndex: 1001,
    boxShadow: '0 4px 20px rgba(255, 50, 50, 0.5)',
    backdropFilter: 'blur(10px)'
  }}>
    🤖 CURSEUR IA: {aiCursorBehavior.toUpperCase()}
  </div>
)}
```

---

## ✅ Checklist d'implémentation

### Phase 1: Fix du bug (PRIORITAIRE)
- [ ] Modifier `Population.js` ligne 21 (`lastBehaviorCheck = -2`)
- [ ] Modifier `Population.js` ligne 67 (condition `>= 1.0`)
- [ ] Tester → Le comportement devrait changer

### Phase 2: Curseur IA (si Phase 1 OK)
- [ ] Créer `src/utils/ArtificialCursor.js` avec les 4 modes
- [ ] Tester chaque mode individuellement
- [ ] Modifier `Population.js` (import, constructor, update, méthodes)
- [ ] Modifier `Canvas2D.jsx` (states, handlers, drawAICursor)
- [ ] Modifier `EvolutionUI.jsx` (props, UI)
- [ ] Tester le basculement auto/manuel
- [ ] Tester les 4 modes IA

---

## 🧪 Tests suggérés

1. **Mode Hunter**: Les boids devraient s'éloigner du centre progressivement
2. **Mode Predator**: Stress maximal, mouvements erratiques
3. **Mode Patrol**: Les boids devraient former un anneau autour du curseur
4. **Mode Random**: Adaptation rapide aux téléportations

---

## 💡 Pourquoi ce design ?

- **Auto par défaut** : Entraînement automatique sans intervention
- **4 modes** : Différents stimuli pour différents apprentissages
- **Basculement facile** : Un bouton pour reprendre la main
- **Visuel clair** : On sait toujours quel mode est actif

**Avec le curseur IA, tu pourras laisser tourner l'évolution toute la nuit et voir les résultats le matin !** 🌙→🌅