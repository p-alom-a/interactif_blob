# 🧬 Brief Projet : Essaim Intelligent Évolutif

## 🎯 Objectif du projet

Créer une expérience interactive 3D où un essaim de particules **apprend progressivement** à réagir intelligemment aux mouvements du curseur, grâce à l'évolution artificielle (neuroevolution : algorithme génétique + réseaux de neurones).

**Contexte :** Projet de démonstration pour une école d'art (section design) montrant la co-création avec l'IA et l'émergence de comportements complexes.

---

## 🎨 Concept visuel et expérience utilisateur

### Direction artistique
- **Style organique/biologique** : formes blobby déformables (style cellules/organismes)
- **Palette organique** : verts aquatiques, roses chair, bleus
- **Liens visuels** entre particules proches (synapses/membranes)
- **Indicateurs visuels** : couleur selon fitness (vert = performant, rouge = faible)
- **Mouvements fluides** : déformations selon vitesse, trails subtils

### Expérience utilisateur

**Génération 1 (départ)**
- 100 particules avec comportements chaotiques et aléatoires
- Aucune coordination visible
- Réactions désordonnées au curseur

**Évolution progressive (Gén. 5-10)**
- Émergence de patterns comportementaux
- Début de coordination
- Stratégies d'évitement se développent

**Génération 20-30 (objectif)**
- Comportement intelligent et coordonné
- Évitement efficace du curseur (ou attraction, selon fitness)
- Mouvements fluides et anticipatifs
- Formation de groupes cohérents

---

## 🧠 Architecture technique

### Stack
```json
{
  "framework": "Vite + React",
  "packageManager": "pnpm",
  "rendering": "Three.js",
  "ml": "TensorFlow.js",
  "persistence": "LocalStorage / IndexedDB"
}
```

### Structure des composants

```
src/
├── App.jsx                 # Composant principal
├── components/
│   ├── Scene3D.jsx         # Canvas Three.js
│   ├── EvolutionUI.jsx     # Interface génération/stats
│   ├── Controls.jsx        # Boutons play/pause/reset/save
│   └── StatsPanel.jsx      # Graphes fitness/comportements
├── evolution/
│   ├── NeuralBoid.js       # Classe particule avec NN
│   ├── Population.js       # Gestion population et évolution
│   ├── GeneticAlgorithm.js # Sélection/crossover/mutation
│   └── FitnessEvaluator.js # Calcul des scores
├── ml/
│   ├── BrainModel.js       # Création/manipulation réseaux neurones
│   └── ModelStorage.js     # Save/load cerveaux
└── utils/
    ├── boidsRules.js       # Algorithme Boids basique
    └── mathHelpers.js      # Utilitaires maths/vecteurs
```

---

## 🔬 Fonctionnement de l'algorithme

### 1. Architecture du réseau de neurones (par particule)

**Structure simple :**
```
Input Layer (8 neurones) :
  - Distance au curseur (normalisée)
  - Angle vers curseur
  - Distance moyenne aux 3 voisines les plus proches
  - Alignement moyen avec voisines
  - Vitesse actuelle (magnitude)
  - Position X relative (normalisée 0-1)
  - Position Y relative (normalisée 0-1)
  - Biais (toujours 1)

Hidden Layer (16 neurones) :
  - Activation : ReLU

Output Layer (2 neurones) :
  - Force X à appliquer
  - Force Y à appliquer
  - Activation : tanh (valeurs entre -1 et 1)
```

**Implémentation TensorFlow.js :**
```javascript
const model = tf.sequential({
  layers: [
    tf.layers.dense({
      inputShape: [8],
      units: 16,
      activation: 'relu',
      kernelInitializer: 'randomNormal'
    }),
    tf.layers.dense({
      units: 2,
      activation: 'tanh'
    })
  ]
});
```

### 2. Cycle évolutionnaire

**Phase A : Initialisation (Génération 0)**
```javascript
// Créer 100 particules avec réseaux de neurones aléatoires
population = [];
for (let i = 0; i < POPULATION_SIZE; i++) {
  population.push(new NeuralBoid({
    brain: createRandomBrain(),
    position: randomPosition(),
    velocity: randomVelocity()
  }));
}
```

**Phase B : Évaluation (durée : 20 secondes par génération)**
```javascript
// Chaque frame (60 FPS)
for (let boid of population) {
  // 1. Percevoir l'environnement
  const inputs = boid.perceive(cursor, neighbors);
  
  // 2. Penser (forward pass du NN)
  const decision = boid.brain.predict(inputs);
  
  // 3. Agir
  boid.applyForce(decision);
  
  // 4. Accumuler fitness
  boid.fitness += calculateFitness(boid, cursor, neighbors);
}

// Après 20 secondes → Phase C
```

**Phase C : Sélection naturelle**
```javascript
// Trier par fitness décroissante
population.sort((a, b) => b.fitness - a.fitness);

// Garder top 50%
const survivors = population.slice(0, POPULATION_SIZE / 2);

// Les 50% faibles disparaissent
```

**Phase D : Reproduction**
```javascript
const newPopulation = [...survivors]; // Élitisme

while (newPopulation.length < POPULATION_SIZE) {
  // Sélection des parents (tournoi ou roulette)
  const parentA = selectParent(survivors);
  const parentB = selectParent(survivors);
  
  // Crossover (mélange des poids NN)
  const child = crossover(parentA, parentB);
  
  // Mutation (10% des poids changent légèrement)
  mutate(child, MUTATION_RATE);
  
  newPopulation.push(child);
}

population = newPopulation;
generation++;
```

### 3. Fonction de fitness

**Objectif : Éviter le curseur tout en restant groupé**

```javascript
function calculateFitness(boid, cursor, neighbors) {
  let score = 0;
  
  // 1. Évitement curseur (prioritaire)
  const distToCursor = distance(boid.position, cursor);
  if (distToCursor < DANGER_RADIUS) {
    score -= 10; // Pénalité si trop proche
  } else {
    score += distToCursor * 0.1; // Récompense si loin
  }
  
  // 2. Cohésion du groupe
  const avgDistToNeighbors = averageDistance(boid, neighbors);
  if (avgDistToNeighbors < IDEAL_COHESION_DIST) {
    score += 5;
  }
  
  // 3. Alignement avec le groupe
  const alignment = calculateAlignment(boid, neighbors);
  score += alignment * 2;
  
  // 4. Survie (rester dans les limites de l'écran)
  if (boid.isOutOfBounds()) {
    score -= 20;
  }
  
  // 5. Pénalité vitesse excessive (économie d'énergie)
  if (boid.velocity.length() > MAX_SPEED * 0.9) {
    score -= 2;
  }
  
  return score;
}
```

**Note :** La fitness peut être ajustée pour obtenir différents comportements (curiosité, exploration, etc.)

### 4. Crossover (reproduction)

```javascript
function crossover(parentA, parentB) {
  const childBrain = createEmptyBrain();
  
  const weightsA = parentA.brain.getWeights();
  const weightsB = parentB.brain.getWeights();
  const childWeights = [];
  
  // Pour chaque couche du réseau
  for (let i = 0; i < weightsA.length; i++) {
    const layerA = weightsA[i].arraySync();
    const layerB = weightsB[i].arraySync();
    const childLayer = [];
    
    // Mélange uniforme ou point de coupe
    if (Math.random() < 0.5) {
      // Uniform crossover : chaque poids vient aléatoirement d'un parent
      childLayer = mixWeightsUniform(layerA, layerB);
    } else {
      // Single-point crossover : couper à un point
      childLayer = mixWeightsSinglePoint(layerA, layerB);
    }
    
    childWeights.push(tf.tensor(childLayer));
  }
  
  childBrain.setWeights(childWeights);
  return new NeuralBoid({ brain: childBrain });
}
```

### 5. Mutation

```javascript
function mutate(boid, mutationRate = 0.1) {
  const weights = boid.brain.getWeights();
  const mutatedWeights = [];
  
  for (let i = 0; i < weights.length; i++) {
    const layer = weights[i].arraySync();
    const mutatedLayer = layer.map(row => 
      Array.isArray(row) 
        ? row.map(w => mutateWeight(w, mutationRate))
        : mutateWeight(row, mutationRate)
    );
    mutatedWeights.push(tf.tensor(mutatedLayer));
  }
  
  boid.brain.setWeights(mutatedWeights);
}

function mutateWeight(weight, rate) {
  if (Math.random() < rate) {
    // Mutation gaussienne
    const mutation = (Math.random() - 0.5) * 0.5;
    return weight + mutation;
  }
  return weight;
}
```

---

## 🎮 Fonctionnalités interactives

### Contrôles utilisateur

**Basiques :**
- **Souris** : Déplacer le curseur pour influencer l'essaim
- **Play/Pause** : Contrôler l'évolution
- **Reset** : Recommencer de Génération 0
- **Speed Up** : Accélérer le temps (générations plus courtes)

**Avancés :**
- **Changer critère de fitness** : Toggle évitement/attraction
- **Ajuster mutation rate** : Slider 0-50%
- **Sauvegarder champion** : Download meilleur cerveau
- **Charger cerveau** : Upload fichier JSON pré-entraîné

### Interface UI

```
┌─────────────────────────────────────────┐
│  🧬 GÉNÉRATION 23                       │
│  ━━━━━━━━━━━━━━━━━━━━━━ 76%           │
│                                         │
│  📊 Fitness moyenne : 345.2            │
│  🏆 Meilleure fitness : 489.2          │
│  📈 [Graphe évolution fitness]         │
│                                         │
│  🧠 Comportement dominant :            │
│     "Évitement coordonné en zigzag"    │
│                                         │
│  ⚡ Dernière sauvegarde : Gén. 20      │
│                                         │
│  [▶️ Play]  [⏸️ Pause]  [🔄 Reset]    │
│  [⚡ x2 Speed]  [💾 Save]  [📁 Load]  │
└─────────────────────────────────────────┘
```

---

## 💾 Système de sauvegarde

### Auto-save (LocalStorage)

```javascript
// Toutes les 10 générations
if (generation % 10 === 0) {
  const bestBrain = population[0].brain;
  await bestBrain.save(`localstorage://autosave-gen${generation}`);
}

// Au chargement, proposer de reprendre
const lastSave = await checkForSavedBrain();
if (lastSave) {
  showResumeDialog(lastSave.generation);
}
```

### Export/Import manuel

```javascript
// Télécharger champion
async function downloadChampion() {
  const champion = population[0].brain;
  await champion.save('downloads://champion-gen' + generation);
  // Télécharge fichier JSON + weights.bin
}

// Charger champion
async function loadChampion(fileInput) {
  const model = await tf.loadLayersModel(tf.io.browserFiles([
    fileInput.files[0], // model.json
    fileInput.files[1]  // weights.bin
  ]));
  
  // Créer population à partir de ce cerveau
  population = createPopulationFromBrain(model);
}
```

---

## 📊 Visualisations et feedback

### Indicateurs visuels sur les particules

**Couleur selon fitness :**
```javascript
// Dégradé vert (bon) → rouge (mauvais)
const color = interpolateColor(
  [255, 0, 0],   // Rouge (fitness faible)
  [0, 255, 0],   // Vert (fitness haute)
  normalizedFitness
);
```

**Taille selon génération :**
```javascript
// Plus vieille génération = plus grosse
const size = BASE_SIZE + (generation * 0.2);
```

**Trails/traînées :**
```javascript
// Historique des 10 dernières positions
// Opacité décroissante
```

### Graphe d'évolution

```javascript
// Chart.js ou recharts
<LineChart data={fitnessHistory}>
  <Line dataKey="avgFitness" stroke="#00ff00" />
  <Line dataKey="bestFitness" stroke="#ffff00" />
</LineChart>
```

### Détection de comportements émergents

```javascript
function detectBehavior(population) {
  const behaviors = {
    coordinated: checkCoordination(population),
    exploring: checkExploration(population),
    huddling: checkHuddling(population),
    zigzagging: checkZigzag(population)
  };
  
  // Retourner comportement dominant
  return Object.keys(behaviors)
    .reduce((a, b) => behaviors[a] > behaviors[b] ? a : b);
}
```

---

## ⚙️ Paramètres configurables

### Constants à tweaker

```javascript
// Population
const POPULATION_SIZE = 100;
const GENERATION_DURATION = 20; // secondes

// Évolution
const MUTATION_RATE = 0.1;      // 10%
const ELITE_COUNT = 5;          // Meilleurs préservés intacts
const CROSSOVER_RATE = 0.7;     // 70% crossover, 30% clones

// Fitness
const DANGER_RADIUS = 100;      // Distance critique curseur
const COHESION_WEIGHT = 1.0;
const AVOIDANCE_WEIGHT = 2.0;
const ALIGNMENT_WEIGHT = 0.5;

// Réseau de neurones
const HIDDEN_UNITS = 16;
const LEARNING_TYPE = 'neuroevolution'; // pas de backprop

// Rendu
const PARTICLE_BASE_SIZE = 8;
const TRAIL_LENGTH = 10;
const LINK_DISTANCE = 60;       // Distance max pour liens visuels
```

---

## 🚀 Plan de développement (4 jours)

### Jour 1 : Fondations (6h)
- [ ] Setup Vite + React + pnpm
- [ ] Intégration Three.js (scène, camera, renderer)
- [ ] Classe NeuralBoid basique (position, velocity, render)
- [ ] Intégration TensorFlow.js
- [ ] Création réseau de neurones simple
- [ ] Forward pass fonctionnel (inputs → outputs)
- [ ] Rendu de 100 particules en mouvement

### Jour 2 : Algorithme génétique (6h)
- [ ] Classe Population
- [ ] Calcul fitness (fonction basique)
- [ ] Sélection des meilleurs (tri + slice)
- [ ] Implémentation crossover (mélange poids NN)
- [ ] Implémentation mutation
- [ ] Cycle complet : éval → sélection → reproduction
- [ ] Test : vérifier amélioration fitness sur 10 générations

### Jour 3 : Comportements et fine-tuning (4h)
- [ ] Affiner fonction de fitness (évitement + cohésion + alignement)
- [ ] Ajout règles Boids basiques (séparation/cohésion/alignement)
- [ ] Inputs NN enrichis (voisins, angles, etc.)
- [ ] Tweaking paramètres (mutation rate, durée génération)
- [ ] Vérifier émergence comportements intéressants
- [ ] Ajustements visuels (déformations, couleurs fitness)

### Jour 4 : UI, visualisation, polish (4h)
- [ ] Composant EvolutionUI (stats, graphes)
- [ ] Boutons controls (play/pause/reset/speed)
- [ ] Graphe fitness avec Chart.js ou recharts
- [ ] Système save/load (LocalStorage + download)
- [ ] Détection comportements émergents (affichage texte)
- [ ] Liens visuels entre particules proches
- [ ] Polish général (animations, transitions, feedback)
- [ ] Pré-entraîner 2-3 champions pour démo
- [ ] Test final et optimisations performance

---

## 🎯 Critères de succès

### Fonctionnels
- ✅ 100 particules à 60 FPS stable
- ✅ Évolution visible entre Gén. 1 et Gén. 20
- ✅ Comportements émergents identifiables
- ✅ Save/Load fonctionnel
- ✅ UI claire et informative

### Visuels
- ✅ Rendu organique et esthétique
- ✅ Mouvements fluides (pas de saccades)
- ✅ Indicateurs visuels pertinents (couleurs, tailles)
- ✅ Feedback immédiat des interactions curseur

### Pédagogiques (pour présentation)
- ✅ Différence Gén. 1 vs Gén. 30 évidente
- ✅ Processus évolutionnaire compréhensible
- ✅ Possibilité de montrer apprentissage en live (2-3 min)
- ✅ Champion pré-entraîné impressionnant

---

## 📚 Ressources et références

### Documentation
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Three.js](https://threejs.org/docs/)
- [Neuroevolution](https://en.wikipedia.org/wiki/Neuroevolution)
- [Boids Algorithm](https://en.wikipedia.org/wiki/Boids)

### Inspirations
- [The Coding Train - Neuroevolution](https://thecodingtrain.com/)
- [MarI/O - NEAT Algorithm](https://www.youtube.com/watch?v=qv6UVOQ0F44)
- [Flappy Bird AI](https://github.com/ssusnic/Machine-Learning-Flappy-Bird)

---

## 💡 Extensions possibles (si temps supplémentaire)

### Nice-to-have
- [ ] Multiple fitness presets (évitement, attraction, exploration)
- [ ] Mode "obstacles" : clic pour placer murs, particules naviguent
- [ ] Visualisation 3D des poids du NN (debug)
- [ ] Replay system (revoir évolution en accéléré)
- [ ] Hall of fame (top 10 meilleurs cerveaux)
- [ ] Export vidéo de l'évolution

### Pour installation physique (post-projet)
- [ ] Webcam + détection main (MediaPipe) au lieu de souris
- [ ] Multi-touch pour plusieurs "prédateurs"
- [ ] Son génératif selon mouvements
- [ ] Projection mapping

---

## ⚠️ Points d'attention

### Performance
- Limiter population à 100 max (au-delà = risque FPS drop)
- Utiliser `tf.tidy()` pour libérer mémoire GPU
- InstancedMesh Three.js pour rendu optimisé
- Throttle calculs fitness si nécessaire

### UX
- Feedback immédiat sur toutes les actions
- Loading state au chargement de modèles
- Messages clairs si pas de WebGL
- Mode dégradé si performance insuffisante

### Debugging
- Console.log fitness moyenne chaque génération
- Visualiser inputs/outputs NN d'une particule
- Vérifier diversité génétique (pas de convergence prématurée)
- Monitorer memory leaks TensorFlow.js

---

## 📝 Notes pour la présentation

### Pitch (30 secondes)
"Un essaim de 100 particules apprend à éviter votre curseur par évolution artificielle. Génération 1 : chaos. Génération 20 : intelligence coordonnée. Vous voyez l'apprentissage en temps réel, sans avoir programmé le comportement final."

### Points clés à souligner
- Émergence : règles simples → comportements complexes
- Pas de programmation explicite du comportement
- L'IA découvre ses propres stratégies
- Approche alternative au deep learning classique
- Biomimétisme : copie l'évolution naturelle

### Démo live
1. Montrer champion pré-entraîné (30 sec)
2. Reset et montrer Génération 1 vs Génération 20 en accéléré (2 min)
3. Interactions : prédateur agressif vs doux, observer adaptation
4. Graphe d'évolution de la fitness
5. Questions/réponses

---

**Fin du brief. Prêt pour Claude Code !** 🚀