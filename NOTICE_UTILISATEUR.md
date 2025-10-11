# 📘 Notice Utilisateur - Essaim Intelligent Évolutif

## 🎯 Introduction

Bienvenue dans cette expérience d'**intelligence artificielle évolutive** !

Ce projet simule un essaim de 50 particules qui **apprennent progressivement** à survivre face à un prédateur (votre curseur ou une IA). Contrairement aux programmes classiques, ces particules ne sont pas programmées pour fuir : elles **découvrent elles-mêmes** les meilleures stratégies grâce à l'évolution artificielle.

### Le principe : Neuroévolution

Chaque particule possède un **cerveau** (réseau de neurones) qui prend des décisions. À chaque génération :
1. Les particules vivent 30 secondes et accumulent un **score de fitness**
2. Les 50% les mieux notées survivent
3. Les 50% les moins bonnes disparaissent
4. De nouvelles particules naissent par **croisement** des survivantes (mélange de leurs cerveaux)
5. Des **mutations** aléatoires ajoutent de la diversité

Après 15-20 générations, vous observerez des comportements intelligents émerger naturellement !

---

## 🎮 Mode d'emploi de l'interface

### Panneau de contrôle (en haut à gauche)

#### Informations affichées
- **🧬 GÉNÉRATION X** : Numéro de la génération actuelle
- **Barre de progression** : Temps restant dans la génération (30s par défaut)
- **📊 Fitness moyenne** : Performance moyenne de toute la population
- **🏆 Meilleure fitness** : Score du champion actuel
- **📉 Pire fitness** : Score de la plus faible particule
- **🧠 Comportement observé** : Comportement dominant détecté automatiquement
- **📈 Graphe d'évolution** : Historique de la fitness (ligne verte = moyenne, ligne jaune = meilleure)

#### Boutons de contrôle

**🟢 Boutons principaux**
- **▶️ Play / ⏸️ Pause** : Met en pause/reprend l'évolution
- **🔄 Reset** : Recommence à la génération 1 avec des cerveaux aléatoires
- **⚡ x2 Speed** : Bascule entre 30s et 10s par génération (apprentissage accéléré)

**💾 Sauvegarde**
- **💾 Save** : Sauvegarde le champion dans le navigateur (LocalStorage)
- **📥 Download** : Télécharge le cerveau du champion (fichier JSON)

**🎯 Contrôle du curseur prédateur**
- **🖱️ Souris Active** : Vous contrôlez le curseur manuellement
- **🤖 IA Activée** : Un prédateur intelligent contrôle automatiquement

#### Sélecteur de stratégie prédateur (mode IA uniquement)

Quand l'IA est activée, vous pouvez choisir parmi 8 stratégies différentes (voir section dédiée ci-dessous).

#### Bouton de réduction
- **▲/▼** : Réduit/agrandit le panneau pour mieux voir la simulation

---

## 📊 Comprendre l'évolution

### Ce que vous observez génération par génération

**🧬 Génération 1-3 : Chaos primitif**
- Mouvements totalement aléatoires et désordonnés
- Aucune coordination visible
- Les particules foncent souvent dans le curseur
- Fitness moyenne très basse (souvent négative ou proche de 0)
- Comportement détecté : "🔍 Exploration active" (elles ne savent pas encore ce qu'elles font)

**🧠 Génération 5-10 : Émergence de patterns**
- Premières tentatives d'évitement du curseur
- Début de coordination entre particules proches
- Formation de mini-groupes
- Fitness moyenne commence à monter (50-150)
- Comportements observés : "🏃 Fuite du curseur", "🤝 Regroupement"

**🏆 Génération 15-20 : Intelligence coordonnée**
- Évitement efficace et anticipatif
- Mouvements de groupe fluides et synchronisés
- Stratégies complexes (zigzag, contournement, formation en V)
- Fitness moyenne élevée (200-400+)
- Comportements observés : "🎯 Mouvement coordonné", "⚡ Zigzag évasif"

**🌟 Génération 25+ : Expertise**
- Comportements quasi-parfaits
- Adaptation rapide aux changements de stratégie du prédateur
- Les particules semblent "prévoir" vos mouvements
- Fitness moyenne très élevée (400-600+)

### Comment lire les statistiques

**📊 Fitness moyenne**
- Indicateur principal de l'évolution
- Doit augmenter progressivement (sinon, il y a un problème)
- Seuils de référence :
  - Gen 1-5 : -50 à 100
  - Gen 10-15 : 100 à 250
  - Gen 20+ : 250 à 500+

**🏆 Meilleure fitness vs 📉 Pire fitness**
- Grand écart (200+) = population hétérogène (bon, diversité génétique)
- Petit écart (< 50) = population trop uniforme (risque de stagnation)

**📈 Graphe d'évolution**
- **Ligne verte (moyenne)** : Doit monter régulièrement
- **Ligne jaune (meilleure)** : Montre les champions de chaque génération
- Si les lignes stagnent ou descendent → Reset et réessayer (malchance génétique)

---

## ⚖️ Le système de Fitness (notation des particules)

Chaque particule est notée **60 fois par seconde** selon 5 critères. Le score s'accumule pendant toute la génération (30 secondes = ~1800 évaluations).

### Les 5 critères de notation

#### 1. 🎯 Évitement du curseur (PRIORITAIRE - poids x2.0)

**Ce qui est mesuré** : Distance entre la particule et le curseur/prédateur

**Notation** :
- ❌ **Distance < 100 pixels** : Grosse pénalité (jusqu'à -20 points par frame)
  - Plus on est proche, plus la pénalité est forte
  - Zone de "danger critique"
- ✅ **Distance > 100 pixels** : Récompense proportionnelle
  - Récompense maximale plafonnée à +5 points par frame
  - Encourager à fuir loin, mais sans excès

**Impact observable** : Les particules rouges (proches du curseur) ont une fitness qui chute rapidement.

#### 2. 🤝 Cohésion de groupe (poids x1.2)

**Ce qui est mesuré** : Distance moyenne avec les 5 voisins les plus proches

**Notation** :
- ✅ **Distance ~80 pixels** : Récompense maximale
  - Ni trop près (collision), ni trop loin (isolement)
- ❌ **Trop proche (< 40px)** ou **trop loin (> 120px)** : Pénalité
- ❌ **Aucun voisin** : Pénalité de -1 point (isolement)

**Impact observable** : Les particules forment naturellement des groupes compacts mais pas collés.

#### 3. 🔄 Alignement des mouvements (poids x1.0)

**Ce qui est mesuré** : Similarité de direction avec les voisins

**Notation** :
- ✅ **Même direction (angle faible)** : Récompense jusqu'à +1 point
- ❌ **Directions opposées** : 0 point (pas de pénalité)

**Calcul** : Produit scalaire normalisé entre les vecteurs vitesse

**Impact observable** : Mouvements de groupe coordonnés, "vagues" de particules.

#### 4. ⚡ Économie d'énergie (pénalité x2)

**Ce qui est mesuré** : Vitesse de la particule

**Notation** :
- ❌ **Vitesse > 90% du maximum (7.2 px/frame)** : Pénalité de -2 points
- ✅ **Vitesse raisonnable** : Pas de bonus, pas de pénalité

**Objectif** : Éviter les mouvements frénétiques inefficaces

**Impact observable** : Les particules apprennent à se déplacer "calmement" sauf en danger immédiat.

#### 5. 💚 Bonus de survie

**Notation** : +0.1 point par frame simplement pour être en vie

**Objectif** : Récompenser la durée de survie

**Impact** : Sur 30s × 60fps = 1800 frames → +180 points de base

### Pondération finale

Les poids (x2.0, x1.2, x1.0, x2) définissent l'importance relative de chaque critère :

1. **Évitement curseur** (x2.0) = PRIORITÉ ABSOLUE
2. **Économie énergie** (x2.0) = Important pour l'efficacité
3. **Cohésion groupe** (x1.2) = Encourage le collectif
4. **Alignement** (x1.0) = Coordination de base
5. **Survie** (fixe) = Récompense passive

### Sélection naturelle après chaque génération

**Étape 1** : Tri par fitness décroissante (meilleur → pire)

**Étape 2** : Top 50% survivent (25 particules sur 50)

**Étape 3** : Bottom 50% sont éliminées (25 particules disparaissent)

**Étape 4** : Reproduction
- Les 25 survivantes sont clonées
- Croisement génétique : mélange aléatoire des poids des réseaux neurones de 2 parents
- Mutation : 10% des poids sont modifiés aléatoirement (±25% de variation)

**Étape 5** : Nouvelle génération de 50 particules (25 élites + 25 enfants)

---

## 🦁 Les 8 stratégies de prédateur

Lorsque le mode **🤖 IA Activée** est sélectionné, vous pouvez choisir parmi 8 comportements de prédateur. Chacun teste différentes capacités d'adaptation des particules.

### 🎯 Attaque Centre (center_attack)

**Stratégie** : Poursuit le **centre de masse** du groupe (barycentre)

**Vitesse** : Moyenne (3 px/frame × agressivité)

**Comportement** :
- Calcule la position moyenne de toutes les particules
- Se dirige vers ce point central
- S'arrête à 80px du centre (ne colle pas)

**Difficulté** : ★★☆☆☆ (Facile à fuir)

**Bon pour observer** : Formation de groupes cohésifs, les particules apprennent à disperser le groupe.

---

### ⚡ Attaque Proche (nearest_attack)

**Stratégie** : Chasse la particule **la plus proche** dans un rayon de 500px

**Vitesse** : Rapide (8 px/frame × agressivité)

**Comportement** :
- Scanne les particules dans son champ de vision
- Fonce sur la plus proche à grande vitesse
- Change de cible si une autre particule se rapproche

**Difficulté** : ★★★★☆ (Difficile)

**Bon pour observer** : Évitement réactif, zigzag, sacrifices (une particule attire le prédateur pour sauver le groupe).

---

### 🔍 Cible Isolé (isolator)

**Stratégie** : Identifie et traque la particule **la plus isolée** (celle avec le moins de voisins dans un rayon de 100px)

**Vitesse** : Moyenne-rapide (6 px/frame × agressivité)

**Comportement** :
- Analyse le nombre de voisins de chaque particule
- Cible systématiquement la plus seule
- Stratégie de prédation réaliste (basée sur la recherche scientifique)

**Difficulté** : ★★★☆☆ (Moyen)

**Bon pour observer** : Cohésion du groupe, solidarité, les particules apprennent à ne JAMAIS se séparer.

---

### 💥 Disrupteur (disruptor)

**Stratégie** : Alterne entre **charge agressive** (4s) et **retraite** (2s) pour disperser le groupe

**Vitesse** :
- Phase charge : Très rapide (10 px/frame × agressivité)
- Phase retraite : Moyenne (5 px/frame × agressivité)

**Comportement** :
- **Charge (4s)** : Fonce au centre du groupe à pleine vitesse
- **Retraite (2s)** : S'éloigne du centre pour les laisser se reformer
- **Répétition** : Cycle infini

**Difficulté** : ★★★★★ (Très difficile)

**Bon pour observer** : Capacité à reformer le groupe, résilience, adaptation aux patterns cycliques.

---

### 🧠 Adaptatif (adaptive)

**Stratégie** : Change de stratégie **toutes les 8 secondes** (rotation entre center_attack, nearest_attack, isolator, disruptor)

**Vitesse** : Variable selon la stratégie active

**Comportement** :
- 0-8s : Attaque Centre
- 8-16s : Attaque Proche
- 16-24s : Cible Isolé
- 24-32s : Disrupteur
- Puis recommence

**Difficulté** : ★★★★★ (Maximum)

**Bon pour observer** : Adaptabilité, capacité à réagir au changement, stratégies génériques vs spécialisées.

**Note** : Console affiche "🧠 ADAPTIVE - Nouvelle stratégie: XXX" à chaque changement.

---

### 🚧 Gardien des Bords (border_patrol)

**Stratégie** : Patrouille le **périmètre** de l'écran en rectangle, force les particules vers le centre

**Vitesse** : Moyenne (5 px/frame × agressivité)

**Comportement** :
- Se déplace le long des bords (marge de 50px)
- Visite les 4 coins dans l'ordre (haut-gauche → haut-droit → bas-droit → bas-gauche)
- Crée une "barrière mobile" sur les bords

**Difficulté** : ★★☆☆☆ (Facile si on reste au centre)

**Bon pour observer** : Utilisation de l'espace, les particules apprennent à exploiter le centre.

---

### 🔄 Patrouille (patrol)

**Stratégie** : Tourne en **cercle** autour du centre de l'écran (rayon 300px)

**Vitesse** : Vitesse angulaire fixe (0.015 rad/frame × agressivité)

**Comportement** :
- Orbite circulaire parfaite au centre
- Mouvement prévisible mais constant
- Couvre toute la zone progressivement

**Difficulté** : ★☆☆☆☆ (Très facile)

**Bon pour observer** : Évitement de patterns prévisibles, les particules apprennent à anticiper.

---

### 🎲 Téléporteur (random)

**Stratégie** : **Téléportation aléatoire** toutes les 3 secondes n'importe où sur l'écran

**Vitesse** : Instantanée (téléportation)

**Comportement** :
- Reste immobile pendant 3 secondes
- Se téléporte à une position aléatoire
- Aucune logique de poursuite

**Difficulté** : ★★★☆☆ (Imprévisible)

**Bon pour observer** : Réaction à l'imprévu, gestion du stress, capacité à scanner l'environnement.

**Note** : Console affiche "🎲 RANDOM - TÉLÉPORTATION ! (x, y) → (x', y')"

---

## 🧠 Les 5 comportements émergents détectables

Le système analyse automatiquement la population **toutes les secondes** et détecte le comportement dominant. Voici comment ils sont identifiés :

### 🎯 Mouvement coordonné

**Détection** : Alignement moyen des vecteurs vitesse > 50%

**Ce qu'on observe** :
- Particules se déplaçant dans des directions similaires
- Formation de "vagues" ou "bancs de poissons"
- Mouvements fluides et synchronisés

**Quand ça apparaît** : Génération 8-15, surtout avec prédateurs prévisibles (patrol, border_patrol)

**Calcul** : Produit scalaire moyen entre toutes les paires de particules proches, normalisé entre 0 et 1

---

### 🔍 Exploration active

**Détection** : Vitesse moyenne élevée (> 4 px/frame) + distance inter-particules élevée (> 100px)

**Ce qu'on observe** :
- Particules rapides et dispersées
- Pas de formation de groupe
- Mouvements erratiques

**Quand ça apparaît** : Génération 1-5 (comportement primitif), ou en réaction à disruptor/téléporteur

**Calcul** : Moyenne pondérée de la vitesse (50%) et de la dispersion (50%)

---

### 🤝 Regroupement

**Détection** : Distance moyenne entre particules < 80px

**Ce qu'on observe** :
- Particules très proches les unes des autres
- Formation d'un "super-groupe" compact
- Liens visuels nombreux

**Quand ça apparaît** : Génération 10-20, surtout contre isolator (apprendre à ne jamais être seul)

**Calcul** : Inverse de la distance moyenne (plus c'est petit, plus le score est élevé)

---

### 🏃 Fuite du curseur

**Détection** : Majorité des particules s'éloignent activement du prédateur (produit scalaire < -0.3) dans un rayon de 300px

**Ce qu'on observe** :
- Particules proches du curseur qui fuient dans la direction opposée
- Zone de "vide" autour du prédateur
- Particules rouges (proches) devenant vertes (s'éloignent)

**Quand ça apparaît** : Génération 6-12, apprentissage fondamental

**Calcul** : Proportion de particules avec vecteur vitesse opposé au vecteur "vers curseur", pondérée par la proximité

---

### ⚡ Zigzag évasif

**Détection** : Changements de direction fréquents (analyse des trajectoires)

**Ce qu'on observe** :
- Particules faisant des virages serrés
- Trajectoires en "S" ou zigzag
- Déformations visuelles fréquentes (étirement/compression)

**Quand ça apparaît** : Génération 15-25, stratégie avancée contre nearest_attack

**Calcul** : Analyse du trail (10 dernières positions) pour détecter les virages > 60°

---

## 🎨 Indicateurs visuels à observer

### Couleur des particules

**Dégradé dynamique** basé sur la distance au curseur/prédateur :

- 🔴 **Rouge intense** : Distance < 50px (danger immédiat)
- 🟠 **Orange** : Distance 50-150px (zone de vigilance)
- 🟡 **Jaune-vert** : Distance 150-250px (zone de confort)
- 🟢 **Vert pur** : Distance > 300px (sécurité maximale)

**Astuce** : Un groupe rouge qui devient vert = comportement de fuite réussi !

### Déformations organiques

Les particules sont des **blobs organiques** qui se déforment selon leur vitesse :

- **Vitesse faible (< 2 px/frame)** : Forme ronde, ondulations subtiles
- **Vitesse moyenne (2-5 px/frame)** : Légère élongation dans le sens du mouvement
- **Vitesse élevée (> 5 px/frame)** : Étirement marqué (facteur x2), forme de "goutte d'eau"

**Animation** : Ondulations sinusoïdales (10 points de contrôle) créent un effet "vivant"

### Liens visuels entre particules

**Apparition** : Lorsque 2 particules sont à moins de 60px l'une de l'autre

**Caractéristiques** :
- Épaisseur : 0.8px
- Opacité : Proportionnelle à la proximité (max 15%)
- Couleur : Bleu cyan, intensité basée sur la vitesse moyenne

**Interprétation** :
- Beaucoup de liens = groupe cohésif (bon signe après Gen 10)
- Pas de liens = dispersion (normal en Gen 1-3)

### Visualisation du prédateur IA

**Cercle central** :
- Rayon : 15px
- Couleur : Variable selon le mode (rouge = attack, orange = patrol, cyan = adaptive...)
- Remplissage semi-transparent (70%)

**Croix rotative** :
- Rotation continue (vitesse proportionnelle au mode)
- Couleur blanche, épaisseur 3px
- Effet "radar"

**Label** :
- Format : `[ICÔNE] [NOM MODE]`
- Exemples : "🎯 CENTRE", "⚡ PROCHE", "🧠 ADAPTATIF"
- Fond noir semi-transparent pour lisibilité
- Suit le prédateur avec offset de 40px à droite

---

## 🧪 Scénarios de test suggérés

### 1. Test d'apprentissage progressif (15 min)

**Objectif** : Observer l'émergence d'intelligence de zéro

**Protocole** :
1. **Reset** pour revenir à Gen 1
2. Sélectionner **🎯 Attaque Centre** (prédateur facile)
3. Activer **🤖 IA**
4. Observer sans intervenir pendant 15 générations
5. Noter l'évolution de la fitness moyenne (Gen 1, 5, 10, 15)

**Critère de réussite** :
- Gen 1 : Fitness < 50
- Gen 5 : Fitness 100-200
- Gen 10 : Fitness 250-350
- Gen 15 : Fitness > 400

**Comportements attendus** :
- Gen 1-3 : 🔍 Exploration active
- Gen 5-8 : 🏃 Fuite du curseur
- Gen 10-15 : 🎯 Mouvement coordonné ou 🤝 Regroupement

---

### 2. Comparaison des prédateurs (20 min)

**Objectif** : Identifier quel prédateur produit les meilleurs champions

**Protocole** :
1. Pour chaque stratégie (center_attack, nearest_attack, isolator, disruptor) :
   - **Reset** et laisser évoluer 15 générations
   - Noter la fitness finale (Gen 15)
   - Sauvegarder le champion avec **💾 Save**
2. Comparer les scores

**Hypothèses à tester** :
- Prédateurs difficiles = apprentissage plus rapide ?
- Prédateurs faciles = champions plus spécialisés ?
- Quel mode produit le meilleur "généraliste" ?

**Astuce** : Utiliser **⚡ x2 Speed** pour accélérer (10s/génération)

---

### 3. Adaptation au changement (10 min)

**Objectif** : Tester la résilience face aux changements de stratégie

**Protocole** :
1. Laisser évoluer avec **🎯 Attaque Centre** pendant 10 générations
2. **Sans reset**, changer pour **⚡ Attaque Proche** (prédateur agressif)
3. Observer comment la fitness évolue (chute puis remontée ?)
4. Changer à nouveau pour **🧠 Adaptatif**

**Critère de réussite** :
- Chute de fitness < 30% lors du changement
- Récupération en moins de 3 générations

**Comportements attendus** : Augmentation du zigzag et de la dispersion temporaire

---

### 4. Test du mode Adaptatif (stratégie ultime) (15 min)

**Objectif** : Observer l'apprentissage face au prédateur le plus difficile

**Protocole** :
1. **Reset** Gen 1
2. Sélectionner **🧠 Adaptatif** (change de stratégie toutes les 8s)
3. Laisser évoluer 20 générations
4. Observer les logs console pour voir les changements de stratégie

**Critère de réussite** :
- Gen 20 : Fitness > 350 (bon généraliste)
- Comportement : Polyvalent, pas de spécialisation excessive

**Observation clé** : Les champions adaptatifs sont souvent moins bons contre UN prédateur, mais meilleurs contre TOUS.

---

### 5. Test manuel vs IA (5 min)

**Objectif** : Comparer vos stratégies aux stratégies algorithmiques

**Protocole** :
1. Après 15 générations avec un prédateur IA, noter la fitness
2. Basculer en **🖱️ Souris Active**
3. Essayer de capturer les particules manuellement pendant 30s
4. Observer si vous faites mieux ou moins bien que l'IA

**Question** : Les particules réagissent-elles différemment à un humain vs une IA ?

---

## ⚙️ Paramètres actuels du système

### Configuration de la population

- **Taille de la population** : 50 particules
- **Durée de génération** : 30 secondes (mode normal)
- **Durée de génération accélérée** : 10 secondes (mode ⚡ x2 Speed)
- **Fréquence d'évaluation** : 60 fois par seconde (60 FPS)

### Configuration évolutionnaire

- **Taux de survie** : 50% (25 particules sur 50)
- **Élitisme** : 25 meilleures particules préservées intactes
- **Reproduction** : Crossover (mélange uniforme ou single-point aléatoire)
- **Taux de mutation** : 10% (1 poids sur 10 est modifié)
- **Amplitude de mutation** : ±25% de la valeur actuelle (distribution gaussienne)

### Architecture du réseau neuronal

**Type** : Perceptron multicouche (feedforward)

**Structure** :
- **Input Layer** : 8 neurones
  1. Distance au curseur (normalisée 0-1)
  2. Angle vers curseur (radians)
  3. Distance moyenne aux 3 voisins
  4. Alignement moyen avec voisins
  5. Vitesse actuelle (magnitude)
  6. Position X relative (0-1)
  7. Position Y relative (0-1)
  8. Biais (toujours 1)

- **Hidden Layer** : 16 neurones
  - Activation : ReLU (Rectified Linear Unit)
  - Initialisation : Distribution normale aléatoire

- **Output Layer** : 2 neurones
  - Force X à appliquer (-1 à +1)
  - Force Y à appliquer (-1 à +1)
  - Activation : tanh (hyperbolic tangent)

**Total de poids** : (8×16) + 16 + (16×2) + 2 = 178 poids par cerveau

### Paramètres physiques

- **Vitesse maximale** : 8 px/frame
- **Force maximale** : 0.15 px/frame²
- **Taille de particule** : 16px (augmentée pour réduire espace disponible)
- **Distance de liaison visuelle** : 60px
- **Marge anti-bords** : 100px (force de retour exponentielle)

### Poids de fitness (rappel)

- **Évitement curseur** : ×2.0
- **Cohésion groupe** : ×1.2
- **Alignement** : ×1.0
- **Économie énergie** : ×2.0 (pénalité)
- **Survie** : +0.1/frame

---

## ❓ FAQ & Troubleshooting

### Questions fréquentes

**Q : Pourquoi la fitness est négative en Génération 1 ?**

R : C'est normal ! Les particules ne savent pas fuir le curseur au départ, donc elles restent proches (grosse pénalité). La fitness devient positive à partir de Gen 3-5.

---

**Q : La fitness stagne ou baisse après Gen 10, que faire ?**

R :
- Vérifier que le prédateur n'est pas en mode "random" ou "disruptor" (très difficiles)
- **Reset** et relancer (parfois malchance génétique = convergence prématurée)
- Essayer un prédateur plus facile (center_attack, patrol)

---

**Q : Quelle est la différence entre "Fitness moyenne" et "Meilleure fitness" ?**

R :
- **Moyenne** : Performance de toute la population (indicateur global)
- **Meilleure** : Score du champion (potentiel maximal atteint)
- Un grand écart entre les deux = diversité génétique (bon signe)

---

**Q : Le comportement détecté ne correspond pas à ce que je vois, pourquoi ?**

R : La détection est automatique et basée sur des scores numériques. Parfois :
- Deux comportements ont des scores proches → alternance
- Transition entre deux stratégies → détection floue pendant ~2 secondes
- Les scores sont recalculés toutes les secondes, soyez patient

---

**Q : Comment savoir si mes particules ont vraiment "appris" ?**

R : 3 critères simples :
1. **Fitness Gen 15 > Fitness Gen 1** (au moins ×3)
2. **Évitement visuel** : les particules rouges deviennent rapidement vertes
3. **Graphe** : courbe croissante sans plateau avant Gen 20

---

**Q : Puis-je entraîner contre plusieurs prédateurs en même temps ?**

R : Non, mais vous pouvez utiliser le mode **🧠 Adaptatif** qui simule 4 prédateurs en rotation toutes les 8 secondes. C'est l'équivalent d'un entraînement multi-stratégies.

---

**Q : Que faire si le timer ne démarre pas ?**

R :
- Vérifier que le mode n'est pas en **⏸️ Pause**
- Rafraîchir la page (F5)
- Si le problème persiste, ouvrir la console (F12) et signaler l'erreur

---

**Q : Combien de temps pour un champion performant ?**

R :
- **Mode normal (30s/gen)** : ~10 minutes (20 générations)
- **Mode rapide (10s/gen)** : ~3-4 minutes (20 générations)
- **Prédateur facile** : Plus rapide (Gen 15 suffit)
- **Prédateur difficile** : Plus long (Gen 25+)

---

### Problèmes connus

**❌ Particules coincées dans les coins**

Cause : Force anti-bords insuffisante contre un prédateur très agressif

Solution :
- Reset et réessayer avec un prédateur moins agressif
- Ou attendre Gen 10+ (elles apprennent à sortir)

---

**❌ Fitness qui explose (> 1000)**

Cause : Bug rare, particules trouvent une "faille" (ex: se cacher hors écran)

Solution : Reset immédiat

---

**❌ Le prédateur disparaît de l'écran**

Cause : Résolu dans la dernière version, mais si ça arrive :

Solution : Changer de mode prédateur puis revenir au mode souhaité

---

**❌ Graphe d'évolution vide**

Cause : Moins de 2 générations complétées

Solution : Attendre Gen 2 minimum pour affichage

---

## 🎓 Pour aller plus loin

### Expérimentations avancées

1. **Comparer crossover uniform vs single-point** (nécessite modification code)
2. **Tester différents taux de mutation** (5%, 20%, 30%)
3. **Varier la taille de population** (25, 100, 200 particules)
4. **Créer des fitness personnalisées** (attraction au lieu d'évitement)

### Ressources pour comprendre la neuroévolution

- **NEAT (NeuroEvolution of Augmenting Topologies)** : Algorithme avancé qui fait évoluer la structure du réseau (pas juste les poids)
- **MarI/O** : IA célèbre qui joue à Super Mario avec NEAT
- **The Coding Train** : Chaîne YouTube avec tutoriels visuels sur neuroévolution

### Concepts à explorer

- **Speciation** : Diviser la population en espèces pour préserver la diversité
- **Novelty Search** : Récompenser la nouveauté plutôt que la performance
- **Co-évolution** : Faire évoluer prédateurs ET proies simultanément

---

## 📝 Notes de version

**Version actuelle** : Canvas 2D (migration depuis Three.js)

**Améliorations récentes** :
- ✅ Curseur IA intelligent avec 8 stratégies
- ✅ Détection automatique de 5 comportements émergents
- ✅ Graphe d'évolution en temps réel
- ✅ Système de sauvegarde/chargement de champions
- ✅ Correction bugs (timer, canvas overflow, détection comportements)

**Prochaines fonctionnalités possibles** :
- Réglage du taux de mutation via slider
- Hall of Fame (top 10 champions)
- Export vidéo de l'évolution
- Mode multi-prédateurs

---

## 🙏 Crédits

**Projet créé par** : [Votre nom]

**Technologies utilisées** :
- React + Vite
- TensorFlow.js
- Canvas 2D API

**Inspirations** :
- Algorithme Boids (Craig Reynolds, 1986)
- Recherches en neuroévolution (Kenneth Stanley)
- Simulations prédateur-proie (éthologie)

---

**Bon test ! Observez l'émergence de l'intelligence collective ! 🧬✨**
