import * as tf from '@tensorflow/tfjs';

// Configuration du réseau de neurones - VERSION REYNOLDS PURE (RAPPORT.md optimisé)
const INPUT_SIZE = 8;  // Augmenté de 6 → 8 (ajout position X/Y globale)
const HIDDEN_SIZE = 16;
const OUTPUT_SIZE = 2;

/**
 * Crée un nouveau réseau de neurones avec des poids aléatoires
 * Architecture: 8 inputs → 16 hidden (ReLU) → 2 outputs (tanh)
 *
 * Inputs (8) - RAPPORT.md corrections appliquées :
 * 1. Distance moyenne aux voisins (centrée -1 à 1)
 * 2. Alignement avec voisins (-1 à 1)
 * 3. Angle vers centre du groupe (-1 à 1)
 * 4. Direction moyenne des voisins (-1 à 1)
 * 5. Vitesse actuelle (centrée -1 à 1)
 * 6. Distance au bord le plus proche (centrée -1 à 1)
 * 7. Position X globale normalisée (-1 à 1) - NOUVEAU
 * 8. Position Y globale normalisée (-1 à 1) - NOUVEAU
 */
export function createBrain() {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [INPUT_SIZE],
        units: HIDDEN_SIZE,
        activation: 'relu',
        kernelInitializer: 'glorotUniform',  // Meilleur équilibre initial
        biasInitializer: 'zeros'
      }),
      tf.layers.dense({
        units: OUTPUT_SIZE,
        activation: 'tanh',
        kernelInitializer: 'glorotUniform',
        biasInitializer: 'zeros'
      })
    ]
  });

  return model;
}

/**
 * Clone un modèle existant avec ses poids
 */
export function cloneBrain(brain) {
  const newBrain = createBrain();
  const weights = brain.getWeights();
  const weightCopies = weights.map(w => w.clone());
  newBrain.setWeights(weightCopies);
  return newBrain;
}

/**
 * Effectue une prédiction (forward pass)
 * @param {tf.LayersModel} brain - Le réseau de neurones
 * @param {Array} inputs - Tableau de 8 valeurs d'entrée
 * @returns {Array} - Tableau de 2 valeurs de sortie [forceX, forceY]
 */
export function predict(brain, inputs) {
  return tf.tidy(() => {
    const inputTensor = tf.tensor2d([inputs]);
    const output = brain.predict(inputTensor);
    const outputData = output.dataSync();
    return Array.from(outputData);
  });
}

/**
 * Mute les poids du réseau de neurones
 * @param {tf.LayersModel} brain - Le réseau de neurones à muter
 * @param {number} mutationRate - Probabilité de mutation (0-1)
 */
export function mutateBrain(brain, mutationRate = 0.1) {
  tf.tidy(() => {
    const weights = brain.getWeights();
    const mutatedWeights = weights.map(tensor => {
      const shape = tensor.shape;
      const values = tensor.dataSync().slice();

      for (let i = 0; i < values.length; i++) {
        if (Math.random() < mutationRate) {
          // Mutation gaussienne
          const mutation = (Math.random() - 0.5) * 0.5;
          values[i] += mutation;
        }
      }

      return tf.tensor(values, shape);
    });

    brain.setWeights(mutatedWeights);
  });
}

/**
 * Crossover entre deux cerveaux parents
 * @param {tf.LayersModel} brainA - Premier parent
 * @param {tf.LayersModel} brainB - Second parent
 * @returns {tf.LayersModel} - Nouveau cerveau enfant
 */
export function crossover(brainA, brainB) {
  const childBrain = createBrain();

  tf.tidy(() => {
    const weightsA = brainA.getWeights();
    const weightsB = brainB.getWeights();
    const childWeights = [];

    for (let i = 0; i < weightsA.length; i++) {
      const tensorA = weightsA[i];
      const tensorB = weightsB[i];
      const shape = tensorA.shape;
      const valuesA = tensorA.dataSync().slice();
      const valuesB = tensorB.dataSync().slice();
      const childValues = [];

      // Uniform crossover: chaque poids vient aléatoirement d'un parent
      for (let j = 0; j < valuesA.length; j++) {
        childValues[j] = Math.random() < 0.5 ? valuesA[j] : valuesB[j];
      }

      childWeights.push(tf.tensor(childValues, shape));
    }

    childBrain.setWeights(childWeights);
  });

  return childBrain;
}

/**
 * Dispose proprement un cerveau pour libérer la mémoire
 */
export function disposeBrain(brain) {
  if (brain) {
    brain.dispose();
  }
}

/**
 * Sauvegarde un cerveau dans LocalStorage
 */
export async function saveBrain(brain, name = 'champion') {
  try {
    await brain.save(`localstorage://${name}`);
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    return false;
  }
}

/**
 * Charge un cerveau depuis LocalStorage
 */
export async function loadBrain(name = 'champion') {
  try {
    const model = await tf.loadLayersModel(`localstorage://${name}`);
    return model;
  } catch (error) {
    console.error('Erreur chargement:', error);
    return null;
  }
}

/**
 * Télécharge un cerveau en JSON + weights avec métadonnées
 * Fix: Utilise IndexedDB comme intermédiaire pour éviter le blocage du navigateur
 * @param {tf.LayersModel} brain - Le modèle à sauvegarder
 * @param {string} filename - Nom du fichier de sortie
 * @param {number} generation - Numéro de génération (sauvegardé dans metadata)
 */
export async function downloadBrain(brain, filename = 'champion', generation = 1) {
  try {
    // Note: TensorFlow.js ne supporte pas directement l'ajout de metadata custom
    // lors du download. On encode la génération dans le filename pour l'instant.
    // Format: champion-gen50 → le numéro est déjà dans le filename

    // Sauver temporairement dans IndexedDB
    const tempKey = `temp-download-${Date.now()}`;
    await brain.save(`indexeddb://${tempKey}`);

    // Recharger et télécharger (garantit les 2 fichiers)
    const model = await tf.loadLayersModel(`indexeddb://${tempKey}`);
    await model.save(`downloads://${filename}`);

    // Nettoyer IndexedDB
    await tf.io.removeModel(`indexeddb://${tempKey}`);

    // Créer un fichier metadata.json séparé avec les infos
    const metadata = {
      generation: generation,
      timestamp: Date.now(),
      trainingInfo: 'Neuroevolution - Reynolds Boids',
      filename: filename
    };

    // Télécharger metadata comme fichier JSON séparé
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const metadataUrl = URL.createObjectURL(metadataBlob);
    const a = document.createElement('a');
    a.href = metadataUrl;
    a.download = `${filename}-metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(metadataUrl);

    return true;
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    return false;
  }
}

/**
 * Charge un cerveau depuis des fichiers uploadés (.json + .bin + optionnel metadata)
 * @param {File} jsonFile - Fichier model.json
 * @param {File} weightsFile - Fichier weights.bin
 * @param {File} metadataFile - Fichier metadata.json (optionnel)
 * @returns {Object|null} - {model, generation} ou null si erreur
 */
export async function loadFromFiles(jsonFile, weightsFile, metadataFile = null) {
  try {
    const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));

    let generation = 1; // Default

    // Si fichier metadata fourni, extraire la génération
    if (metadataFile) {
      try {
        const metadataText = await metadataFile.text();
        const metadata = JSON.parse(metadataText);
        generation = metadata.generation || 1;
        console.log('📊 Métadonnées chargées - Génération:', generation);
      } catch (metaError) {
        console.warn('⚠️ Impossible de lire metadata.json, génération = 1 par défaut');
      }
    } else {
      // Essayer d'extraire du nom du fichier (ex: champion-gen50.json)
      const match = jsonFile.name.match(/gen(\d+)/i);
      if (match) {
        generation = parseInt(match[1], 10);
        console.log('📊 Génération extraite du filename:', generation);
      }
    }

    console.log('✅ Cerveau chargé depuis fichiers:', jsonFile.name, weightsFile.name);
    return { model, generation };
  } catch (error) {
    console.error('Erreur chargement fichiers:', error);
    return null;
  }
}
