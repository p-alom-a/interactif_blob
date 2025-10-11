# 🧠 Rapport d’analyse — Réseau neuronal de boids

---

## 💡 Problème 1 — Le réseau n’a aucune force de séparation explicite

Tu as retiré la séparation de Reynolds comme force physique “hardcoded” et tu comptes sur le réseau de neurones pour l’apprendre via la fitness.  
👉 Or, ta fonction de fitness récompense la cohésion beaucoup plus fortement que la séparation :

```js
score += cohesionScore * 3.0; // poids dominant
score -= tooClose.length * 0.5; // faible pénalité
```

### 🎯 Conséquence
Le comportement optimal pour le réseau est de **se regrouper au maximum** — donc les boids s’empilent dans un coin ou au centre.

### ✅ Solution
Rééquilibrer les poids dans la fitness :
```js
// Cohésion moins dominante
score += cohesionScore * 1.5;

// Séparation plus forte
score -= tooClose.length * 1.5;
```

Tu peux aussi donner une **récompense positive** pour une distance idéale (au lieu d’une simple pénalité) :
```js
if (neighbors.length > 0) {
  const avgDist = ...
  const idealDistScore = Math.exp(-Math.pow((avgDist - IDEAL_COHESION_DIST)/15, 2));
  score += idealDistScore * 2.0;
}
```

---

## ⚙️ Problème 2 — Le bord de l’écran agit comme un attracteur

Dans ta méthode `update()` :
```js
if (this.position.x < EDGE_MARGIN) this.velocity.x += TURN_FACTOR;
```

### 🎯 Conséquence
Tu ajoutes toujours une force vers **l’intérieur**, sans vérifier la direction actuelle.  
Si un boid est collé à gauche, `velocity.x` devient positif → il repart vers la droite… mais les autres le suivent → tout le monde s’entasse dans un coin.

### ✅ Solution
Appliquer la correction **proportionnellement à la distance au bord** :
```js
const edgeStrength = (EDGE_MARGIN - this.position.x) / EDGE_MARGIN;
if (this.position.x < EDGE_MARGIN) this.velocity.x += TURN_FACTOR * edgeStrength;
```
Et faire pareil pour les autres côtés.

---

## 🧭 Problème 3 — Le réseau de neurones ne perçoit pas le bord globalement

Tu as :
```js
inputs.push(clamp(distToEdge / 100, 0, 1));
```

### 🎯 Conséquence
`distToEdge` ne contient **aucune information directionnelle** (juste la distance au bord le plus proche).  
Le réseau ne sait donc pas *de quel côté* il est proche d’un bord → impossible pour lui de fuir dans la bonne direction.

### ✅ Solution
Ajouter **2 inputs directionnels supplémentaires** :
- `distToLeftRight = (this.position.x / screenWidth) * 2 - 1`
- `distToTopBottom = (this.position.y / screenHeight) * 2 - 1`

Cela donne au réseau une *conscience spatiale* du plan global :
```js
inputs.push(clamp(this.position.x / screenWidth * 2 - 1, -1, 1));
inputs.push(clamp(this.position.y / screenHeight * 2 - 1, -1, 1));
```

---

## 🧬 Problème 4 — Le réseau n’a pas encore appris de bonne stratégie

Même avec de bons signaux, les premières générations vont souvent **dériver vers des comportements simples** (comme “rester groupés” ou “ralentir”).  
Cela peut prendre **des dizaines de générations** avant de voir apparaître une dynamique de groupe stable (flocking + exploration).

### 🎯 Conséquence
Tu observes un comportement monotone où les boids se collent et ne s’organisent pas en formation.

### ✅ Solution
- Allonger `GENERATION_DURATION` (ex : 90 s au lieu de 60)
- Suivre la progression du meilleur score par génération
- Augmenter légèrement `mutationRate` (0.15 ou 0.2)
- Sauvegarder le meilleur réseau et le réinjecter dans la population

---

## 📊 Problème 5 — Inputs mal normalisés

Ton `clamp()` limite entre -1 et 1, mais certaines valeurs (comme les distances) ne sont pas centrées autour de 0 — elles sont dans `[0,1]`.  
Cela fausse l’équilibre du réseau : il ne “voit” jamais de valeurs négatives → tendance à dériver dans une direction constante.

### 🎯 Conséquence
Le réseau apprend mal les oppositions de direction (ex : aller à gauche ou à droite), et les boids se déplacent de façon biaisée.

### ✅ Solution
Centrer les inputs “distance” et “vitesse” :
```js
inputs.push((clamp(avgDist / PERCEPTION_RADIUS, 0, 1) - 0.5) * 2);
inputs.push((clamp(this.velocity.mag() / MAX_SPEED, 0, 1) - 0.5) * 2);
```

---

## 🧾 Synthèse finale

| 🧩 Cause | 🎯 Symptôme | ✅ Solution |
|----------|-------------|-------------|
| Fitness trop pro-cohésion | Boids collés | Rééquilibrer cohésion/séparation |
| Bord attractif | Coin supérieur gauche saturé | Corriger proportionnellement à la distance |
| Aucune direction spatiale | Boids incapables de fuir un bord | Ajouter inputs `x/screenWidth`, `y/screenHeight` |
| Apprentissage lent | Aucune structure de vol | Allonger génération, augmenter mutationRate |
| Inputs non centrés | Mouvement biaisé | Centrer les valeurs entre -1 et 1 |

---

## 🚀 Recommandation

Pour obtenir un flocking réaliste :
1. Corrige la fitness et la normalisation.
2. Ajoute les inputs directionnels.
3. Laisse tourner plusieurs générations (≥ 50).
4. Visualise la moyenne de fitness par génération.
5. Expérimente avec un équilibre subtil entre **cohésion**, **alignement** et **séparation**.

Solutions pour que les boids restent dans le canvas

Corriger les forces de bord proportionnellement à la distance
const edgeStrengthX = this.position.x < EDGE_MARGIN
  ? (EDGE_MARGIN - this.position.x) / EDGE_MARGIN
  : this.position.x > screenWidth - EDGE_MARGIN
    ? (this.position.x - (screenWidth - EDGE_MARGIN)) / EDGE_MARGIN
    : 0;

this.velocity.x += TURN_FACTOR * edgeStrengthX;

const edgeStrengthY = this.position.y < EDGE_MARGIN
  ? (EDGE_MARGIN - this.position.y) / EDGE_MARGIN
  : this.position.y > screenHeight - EDGE_MARGIN
    ? (this.position.y - (screenHeight - EDGE_MARGIN)) / EDGE_MARGIN
    : 0;

this.velocity.y += TURN_FACTOR * edgeStrengthY;
Clamper la position après mise à jour

this.position.x = Math.max(0, Math.min(screenWidth, this.position.x));
this.position.y = Math.max(0, Math.min(screenHeight, this.position.y));




/// réduis la taille du canva
- Exemple : passer de `1920x1080` → `960x540` (diviser par 2 la largeur et la hauteur).
- Avantages :
  - Moins de pixels à dessiner → framerate amélioré.
  - Plus de densité dans le canvas → le réseau reçoit plus de signaux voisins, l’apprentissage peut être plus rapide.
- Attention : ne pas réduire trop, sinon les boids se collent artificiellement.


oints qui pourraient être améliorés pour clarifier l’apprentissage

Entrées plus explicites

Ajouter coordonnées normalisées (x/screenWidth, y/screenHeight) pour que le NN sache où il est.

Actuellement la distance au bord est un scalaire → le NN ne sait pas quelle direction prendre pour éviter le bord.

Pénalités de bord plus fortes

Pour éviter que le NN développe des comportements “hors canvas”, il serait pédagogique de montrer que la fitness guide l’apprentissage.

Plus de diversité d’expérimentation

Ajouter un mode “curseur prédateur” pourrait montrer que le NN peut apprendre à fuir en plus des lois de Reynolds classiques.

Comparer le comportement du NN vs. version déterministe classique dans le rendu visuel → très pédagogique.

Visualisation des poids ou décisions

Afficher l’angle ou la force sortie par le NN pour chaque boid → permet de “voir ce que le NN a appris” et de comparer avec les règles classiques.