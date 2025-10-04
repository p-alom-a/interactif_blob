import * as tf from '@tensorflow/tfjs';

// Configuration du réseau de neurones
const INPUT_SIZE = 8;
const HIDDEN_SIZE = 16;
const OUTPUT_SIZE = 2;

/**
 * Crée un nouveau réseau de neurones avec des poids aléatoires
 * Architecture: 8 inputs → 16 hidden (ReLU) → 2 outputs (tanh)
 */
export function createBrain() {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [INPUT_SIZE],
        units: HIDDEN_SIZE,
        activation: 'relu',
        kernelInitializer: 'randomNormal',
        biasInitializer: 'randomNormal'
      }),
      tf.layers.dense({
        units: OUTPUT_SIZE,
        activation: 'tanh',
        kernelInitializer: 'randomNormal',
        biasInitializer: 'randomNormal'
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
 * Télécharge un cerveau en JSON
 */
export async function downloadBrain(brain, filename = 'champion') {
  try {
    await brain.save(`downloads://${filename}`);
    return true;
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    return false;
  }
}
