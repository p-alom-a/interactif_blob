# Instructions Claude Code - Swarm Evolution

## 🎯 Concept
**Jeu interactif d'évolution d'essaim** où le joueur guide des particules à travers 4 stades de vie avec ses gestes. Chaque niveau = un défi d'apprivoisement et de coopération. Projet artistique pour école de design.

## 🎮 Gameplay
Le joueur utilise sa main (via webcam) pour interagir avec un essaim qui évolue :
1. **Niveau 1 - Naissance** : Apprivoiser des cellules craintives
2. **Niveau 2 - Maturité** : Synchroniser un banc de particules  
3. **Niveau 3 - Symbiose** : Fusionner des groupes en colonies
4. **Niveau 4 - Transcendance** : Diriger un super-organisme unifié

**Progression** : Chaque niveau a un objectif implicite. Le joueur découvre par l'expérimentation.

## 🛠 Installation (dans dossier existant)
```bash
# Dans le dossier déjà créé avec pnpm create vite@latest
pnpm add three @react-three/fiber @react-three/drei
pnpm add @mediapipe/tasks-vision
pnpm add zustand
pnpm add leva  # optionnel pour debug
```

## 📁 Structure Détaillée
```
src/
├── components/
│   ├── Game.jsx           # Logique principale du jeu
│   ├── Scene.jsx          # Canvas Three.js + éclairage
│   ├── Swarm.jsx          # Système de particules instanciées
│   ├── HandTracker.jsx    # Détection MediaPipe
│   └── UI/
│       ├── LevelProgress.jsx  # Indicateur de niveau subtil
│       └── Tutorial.jsx       # Instructions minimales
├── hooks/
│   ├── useHandTracking.js # Hook pour position main
│   ├── useBoids.js        # Algorithme de flocking
│   └── useGameLevel.js    # Gestion progression
├── store/
│   └── gameStore.js       # État global (niveau, score, particules)
└── config/
    └── levels.js          # Paramètres par niveau
```

## 🔧 Implémentation Détaillée

### 1. **Game Loop & Niveaux**

```javascript
// config/levels.js
export const LEVELS = [
  {
    id: 1,
    name: "Naissance",
    particleCount: { start: 20, end: 80 },
    sizeRange: [0.3, 0.6],
    goal: "80% des particules < 100px de la main pendant 5 sec",
    boids: { separation: 0.8, alignment: 0.1, cohesion: 0.2 },
    handEffect: { open: "attract_weak", closed: "repel_strong" }
  },
  // ... autres niveaux
]
```

### 2. **Mécaniques de Jeu**

#### Niveau 1 - Apprivoisement
- Particules fuient initialement
- Main immobile = confiance augmente
- Nouvelles particules apparaissent quand confiance > seuil
- **Victoire** : Essaim reste proche 5 secondes

#### Niveau 2 - Synchronisation  
- Particules suivent la main mais désordonnées
- Mouvements circulaires = apprentissage de patterns
- **Victoire** : 3 danses synchronisées réussies

#### Niveau 3 - Construction
- Groupes séparés à fusionner
- Rapprocher les mains = fusion
- Écarter = division contrôlée
- **Victoire** : Créer un super-cluster de 100+ particules

#### Niveau 4 - Symbiose
- Organisme unifié réactif
- Main = chef d'orchestre
- **Victoire** : L'organisme devient autonome

### 3. **HandTracker MediaPipe**
```javascript
// Détection simple mais robuste
// - Position normalisée (-1, 1) pour Three.js
// - État binaire : ouverte (distance > 0.15) ou fermée
// - Smoothing pour éviter jitter
// - Fallback si main perdue
```

### 4. **Système de Particules**
- **InstancedMesh** pour performance (300-500 max)
- Chaque particule a : position, velocity, size, age, state
- Update à 60fps avec requestAnimationFrame
- Shaders custom pour effet organique

### 5. **Feedback Visuel**
- Halo autour de la main (vert=ami, rouge=danger)
- Particules changent couleur selon état (peur/confiance/joie)
- Trainées lumineuses pour montrer l'influence
- Pas d'UI textuelle, tout est visuel

### 6. **Algorithmes Biomimétiques**
- **Boids** : séparation, alignement, cohésion
- **Noise Perlin** : mouvements organiques
- **Thermotaxie** : attraction vers zones "chaudes"
- **Stigmergie** : traces phéromonales invisibles

## 🎨 Direction Artistique
- Style cellulaire/organique
- Couleurs évoluant du froid → chaud avec progression
- Materials semi-transparents avec refraction
- Bloom post-processing pour ambiance onirique

## ⚡ Optimisations Critiques
- Spatial hashing pour calculs voisinage
- LOD dynamique selon distance caméra
- Pool d'objets pour particules
- Web Workers pour calculs lourds (optionnel)

## 🚀 Étapes de Développement

### Jour 1
1. Setup Three.js + React de base
2. HandTracker MediaPipe fonctionnel
3. Particules basiques avec mouvement

### Jour 2
4. Algorithme Boids complet
5. Système de niveaux + transitions
6. Interactions main-particules

### Jour 3
7. Polish visuel (shaders, bloom)
8. Feedback utilisateur subtil
9. Équilibrage gameplay

### Jour 4 (si besoin)
10. Son spatial (optionnel)
11. Optimisations finales
12. Deploy Vercel/Netlify

## 📝 Notes Importantes
- **Pas de game over** - expérience contemplative
- **Découverte par exploration** - minimum d'instructions
- **Performance avant features** - maintenir 60fps
- **Mobile-first** impossible (MediaPipe), desktop uniquement

**Commencer par** : Un prototype simple avec 20 particules qui fuient/approchent selon la main.