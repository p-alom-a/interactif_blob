# 🔧 Instructions de correction - Bugs et améliorations

## 🐛 PROBLÈMES IDENTIFIÉS

### Problème 1: Les particules ne deviennent pas rouges près du curseur IA
**Cause:** `drawBoid()` utilise toujours `cursorRef.current` (souris) au lieu du curseur effectif (IA ou souris)

### Problème 2: Mouvements par à-coups
**Cause:** Le `useEffect` a un tableau de dépendances vide `[]` qui capture les states initiaux. Quand `cursorMode` change, l'effet ne se relance pas.

### Problème 3: Trop de particules
**Actuel:** 100 boids, **demandé:** 50 boids avec taille augmentée

---

## 📁 FICHIER 1: `src/evolution/Population.js`

### Modification 1: Réduire la taille de la population

**Ligne 8**, CHANGER:
```javascript
const POPULATION_SIZE = 100;
```

**EN:**
```javascript
const POPULATION_SIZE = 50; // Réduit pour meilleures performances
```

---

## 📁 FICHIER 2: `src/components/Canvas2D.jsx`

### Modification 1: Augmenter la taille des particules

**Ligne 7**, CHANGER:
```javascript
const PARTICLE_BASE_SIZE = 8;
```

**EN:**
```javascript
const PARTICLE_BASE_SIZE = 12; // Augmenté car moins de particules
```

---

### Modification 2: FIX CRITIQUE - Utiliser le bon curseur pour les couleurs

**Dans la boucle d'animation (ligne ~60-78)**, MODIFIER pour récupérer et utiliser le curseur RÉEL:

**AVANT (incorrect):**
```javascript
const animate = (currentTime) => {
  // ...
  const cursor = cursorRef.current; // ❌ Toujours la souris
  
  population.update(cursor, width, height, deltaTime);
  
  // ...
  population.boids.forEach((boid) => {
    drawBoid(ctx, boid, cursor); // ❌ Mauvais curseur
  });
```

**APRÈS (correct):**
```javascript
const animate = (currentTime) => {
  // ...
  
  // 1. Récupérer le curseur souris (pour mode manual)
  const manualCursor = cursorRef.current;
  
  // 2. Mettre à jour la population (elle choisit le bon curseur)
  population.update(manualCursor, width, height, deltaTime);
  
  // 3. Récupérer le curseur EFFECTIF utilisé par la population
  let activeCursor;
  if (population.cursorMode === 'auto') {
    activeCursor = population.artificialCursor.position;
  } else {
    activeCursor = manualCursor;
  }
  
  // Background avec fade pour effet de trail
  ctx.fillStyle = 'rgba(10, 10, 20, 0.25)';
  ctx.fillRect(0, 0, width, height);

  // Dessiner les liens entre particules proches
  drawLinks(ctx, population.boids);

  // 4. Dessiner chaque boid avec le BON curseur
  population.boids.forEach((boid) => {
    drawBoid(ctx, boid, activeCursor); // ✅ Bon curseur
  });

  // Dessiner le curseur artificiel si mode auto
  if (population.cursorMode === 'auto' && populationRef.current) {
    const aiPos = populationRef.current.getCursorPosition();
    if (aiPos) {
      drawAICursor(ctx, aiPos.x, aiPos.y, population.artificialCursor.mode);
    }
  }
};
```

**EXPLICATION:**
- Avant: `drawBoid` recevait toujours `cursorRef.current` (souris)
- Maintenant: `drawBoid` reçoit le curseur ACTIF (IA si mode auto, souris sinon)
- Résultat: Les particules deviennent rouges près du curseur IA ✅

---

### Modification 3: FIX mouvements par à-coups

Le problème vient de la closure JavaScript dans `useEffect` avec `[]` comme dépendances.

**DEUX SOLUTIONS POSSIBLES:**

#### Solution A (Recommandée): Utiliser des refs au lieu de states

**En haut du composant (après les imports), AJOUTER:**
```javascript
const cursorModeRef = useRef('auto');
const aiCursorBehaviorRef = useRef('hunter');
```

**Dans les handlers, MODIFIER:**

```javascript
const handleCursorModeToggle = () => {
  const newMode = cursorModeRef.current === 'auto' ? 'manual' : 'auto';
  cursorModeRef.current = newMode;
  setCursorMode(newMode); // Pour l'UI
  if (populationRef.current) {
    populationRef.current.setCursorMode(newMode);
  }
};

const handleAICursorBehaviorChange = (behavior) => {
  aiCursorBehaviorRef.current = behavior;
  setAiCursorBehavior(behavior); // Pour l'UI
  if (populationRef.current) {
    populationRef.current.setAICursorBehavior(behavior);
  }
};
```

**Dans la boucle animate, UTILISER:**
```javascript
// Au lieu de lire population.cursorMode
const currentMode = cursorModeRef.current;

if (currentMode === 'auto') {
  activeCursor = population.artificialCursor.position;
} else {
  activeCursor = manualCursor;
}
```

#### Solution B (Alternative): Synchroniser la population au changement de state

**Ajouter un useEffect séparé:**
```javascript
// Synchroniser les changements de mode avec la population
useEffect(() => {
  if (populationRef.current) {
    populationRef.current.setCursorMode(cursorMode);
  }
}, [cursorMode]);

useEffect(() => {
  if (populationRef.current) {
    populationRef.current.setAICursorBehavior(aiCursorBehavior);
  }
}, [aiCursorBehavior]);
```

**👉 Utiliser la Solution A (refs) pour éviter les re-renders**

---

## 📁 FICHIER 3: `src/components/EvolutionUI.jsx`

### Ajouter le système de collapse/expand

**Ligne 3, AJOUTER un nouveau state:**
```javascript
const [isCollapsed, setIsCollapsed] = useState(false);
```

---

**Dans le style du conteneur principal (ligne ~83), MODIFIER:**

```javascript
return (
  <div style={{
    position: 'fixed',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    padding: '20px',
    borderRadius: '12px',
    color: '#00ff88',
    fontFamily: 'monospace',
    fontSize: '14px',
    minWidth: isCollapsed ? '220px' : '280px',  // ✅ CHANGÉ
    maxWidth: isCollapsed ? '220px' : '320px',  // ✅ AJOUTÉ
    border: '1px solid rgba(0, 255, 136, 0.3)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    transition: 'all 0.3s ease-in-out'  // ✅ AJOUTÉ pour animation smooth
  }}>
```

---

**Dans la section titre (ligne ~98), MODIFIER pour ajouter le bouton:**

```javascript
{/* Titre */}
<div style={{
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', // ✅ CHANGÉ de 'gap' à 'space-between'
  gap: '10px'
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span>🧬</span>
    <span>GÉNÉRATION {generation}</span>
  </div>
  
  {/* ✅ NOUVEAU: Bouton collapse/expand */}
  <button
    onClick={() => setIsCollapsed(!isCollapsed)}
    style={{
      padding: '6px 10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      transition: 'all 0.2s'
    }}
    title={isCollapsed ? "Agrandir le panneau" : "Réduire le panneau"}
  >
    {isCollapsed ? '▼' : '▲'}
  </button>
</div>
```

---

**APRÈS le titre, WRAPPER tout le contenu dans une condition:**

```javascript
{/* Titre avec bouton */}
{/* ... code du titre ci-dessus ... */}

{/* ✅ WRAPPER conditionnel - tout le reste du contenu */}
{!isCollapsed && (
  <>
    {/* Barre de progression */}
    <div style={{ marginBottom: '15px' }}>
      {/* ... code existant ... */}
    </div>

    {/* Stats */}
    <div style={{ marginBottom: '15px' }}>
      {/* ... code existant ... */}
    </div>

    {/* Comportement détecté */}
    <div style={{ ... }}>
      {/* ... code existant ... */}
    </div>

    {/* Graphe d'évolution */}
    {fitnessHistory.length >= 2 && (
      <div style={{ ... }}>
        {/* ... code existant ... */}
      </div>
    )}

    {/* Contrôles */}
    <div style={{ ... }}>
      {/* ... tous les boutons ... */}
    </div>

    {/* Contrôle du curseur IA */}
    <div style={{ ... }}>
      {/* ... section curseur ... */}
    </div>

    {/* Info */}
    <div style={{ ... }}>
      {/* ... message info ... */}
    </div>
  </>
)}
```

**RÉSULTAT:**
- Panneau réduit: Montre seulement "🧬 GÉNÉRATION X" + bouton ▼
- Panneau agrandi: Montre tout le contenu + bouton ▲
- Transition smooth de 0.3s

---

## 📁 FICHIER 4 (OPTIONNEL): Améliorer le curseur IA visuel

Dans `Canvas2D.jsx`, **REMPLACER la fonction `drawAICursor`** (lignes ~150-180) par cette version améliorée:

```javascript
function drawAICursor(ctx, x, y, mode) {
  ctx.save();

  // Couleurs et config selon le mode
  const modeConfig = {
    hunter: { 
      color: [255, 100, 100], 
      label: 'CHASSEUR',
      icon: '🎯'
    },
    predator: { 
      color: [255, 50, 255], 
      label: 'PRÉDATEUR',
      icon: '⚡'
    },
    patrol: { 
      color: [100, 200, 255], 
      label: 'PATROL',
      icon: '🔄'
    },
    random: { 
      color: [255, 255, 100], 
      label: 'ALÉATOIRE',
      icon: '🎲'
    }
  };

  const config = modeConfig[mode] || modeConfig.hunter;
  const color = config.color;
  const time = Date.now() * 0.005;

  // Cercle externe pulsant
  const pulseRadius = 35 + Math.sin(time) * 10;
  
  ctx.shadowBlur = 20;
  ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Cercle moyen
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Cercle intérieur rempli
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();

  // Croix centrale avec rotation
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.5);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(10, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.stroke();
  
  ctx.restore();

  // Label avec icône
  ctx.shadowBlur = 5;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  
  const labelText = `${config.icon} ${config.label}`;
  ctx.font = 'bold 14px monospace';
  const labelWidth = ctx.measureText(labelText).width;
  
  // Background du label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(x + 40, y - 10, labelWidth + 12, 20);
  
  // Texte du label
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
  ctx.fillText(labelText, x + 46, y + 4);

  ctx.restore();
}
```

---

## ✅ CHECKLIST DE VÉRIFICATION

Après avoir appliqué ces modifications:

### Corrections bugs
- [ ] **Population réduite à 50** (Population.js ligne 8)
- [ ] **Taille particules = 12px** (Canvas2D.jsx ligne 7)
- [ ] **Curseur correct pour couleurs** (animate() utilise activeCursor)
- [ ] **Pas d'à-coups** (utilise refs ou useEffect séparés)

### UI
- [ ] **Panneau collapsible** (bouton ▲/▼ fonctionne)
- [ ] **Transition smooth** (0.3s ease-in-out)
- [ ] **Curseur IA visible** (cercles colorés + label + icône)

### Tests visuels
- [ ] Les particules deviennent **ROUGES** quand le curseur IA passe dessus
- [ ] Passer en mode manual → les particules deviennent rouges près de la souris
- [ ] Changer de mode IA → le curseur change de comportement et de couleur
- [ ] Cliquer sur ▲ → le panneau se réduit en douceur
- [ ] Cliquer sur ▼ → le panneau s'agrandit en douceur

---

## 🎯 RÉSULTAT ATTENDU

Après ces correctifs:

1. ✅ **50 particules** plus grosses (12px) et plus visibles
2. ✅ **Couleurs correctes** - rouge près du curseur IA, vert loin
3. ✅ **Mouvements fluides** sans à-coups
4. ✅ **Panneau UI** qui se réduit/agrandit avec animation
5. ✅ **Curseur IA** ultra-visible avec icône et label coloré
6. ✅ **Performances améliorées** (50 au lieu de 100 boids)

**L'expérience devrait être beaucoup plus fluide et les comportements évidents visuellement !** 🚀