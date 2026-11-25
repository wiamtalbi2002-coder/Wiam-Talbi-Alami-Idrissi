// neuralNetwork.js
// Petit réseau de neurones écrit à la main, en JavaScript pur (sans TensorFlow).
// Pourquoi ? Dans la version de Buffa, chaque voiture appelle TensorFlow.js à
// chaque image : pour 100 voitures de 6 entrées, créer des tenseurs coûte bien
// plus cher que le calcul lui-même (et predict() affichait un console.log à
// chaque appel). Ici le calcul est une simple boucle : couche par couche,
// sortie = activation(poids × entrée + biais).
// L'algorithme génétique n'a besoin que de : predict, copy, mutate, crossover.

class NeuralNetwork {
  // sizes : nombre de neurones par couche, ex. [8, 12, 2]
  constructor(sizes) {
    this.sizes = sizes.slice();
    this.weights = []; // weights[l][j][i] : de la couche l (neurone i) vers l+1 (neurone j)
    this.biases = [];
    for (let l = 0; l < sizes.length - 1; l++) {
      const nIn = sizes[l];
      const nOut = sizes[l + 1];
      // initialisation de Xavier : variance 1 / nIn (évite de saturer tanh)
      const scale = 1 / Math.sqrt(nIn);
      this.weights.push(Array.from({ length: nOut }, () =>
        Array.from({ length: nIn }, () => randomGaussian() * scale)));
      this.biases.push(Array.from({ length: nOut }, () => randomGaussian() * 0.1));
    }
    // activations de la dernière prédiction (pour dessiner le cerveau)
    this.activations = [];
  }

  // Propagation avant. Couches cachées : tanh (sortie entre -1 et 1),
  // couche de sortie : sigmoïde (entre 0 et 1, facile à transformer en angle
  // et en vitesse).
  predict(inputs) {
    let a = inputs;
    this.activations = [inputs.slice()];
    for (let l = 0; l < this.weights.length; l++) {
      const last = l === this.weights.length - 1;
      const W = this.weights[l];
      const b = this.biases[l];
      const out = new Array(W.length);
      for (let j = 0; j < W.length; j++) {
        let sum = b[j];
        const row = W[j];
        for (let i = 0; i < row.length; i++) {
          sum += row[i] * a[i];
        }
        out[j] = last ? 1 / (1 + Math.exp(-sum)) : Math.tanh(sum);
      }
      a = out;
      this.activations.push(out);
    }
    return a;
  }

  copy() {
    const nn = new NeuralNetwork(this.sizes);
    nn.weights = this.weights.map((W) => W.map((row) => row.slice()));
    nn.biases = this.biases.map((b) => b.slice());
    return nn;
  }

  // Mutation : chaque poids a une probabilité `rate` de bouger d'une valeur
  // gaussienne d'écart-type `amount`. Buffa ajoute randomGaussian() entier
  // (écart-type 1) : c'est un très gros saut qui détruit souvent ce qui a été
  // appris. Un petit `amount` permet d'affiner un bon cerveau.
  mutate(rate, amount) {
    const bouge = (w) => (random(1) < rate ? w + randomGaussian() * amount : w);
    this.weights = this.weights.map((W) => W.map((row) => row.map(bouge)));
    this.biases = this.biases.map((b) => b.map(bouge));
  }

  // Croisement uniforme : pour chaque neurone, on prend la ligne de poids
  // (et son biais) de l'un ou de l'autre parent. On garde les neurones
  // entiers pour ne pas casser ce que chaque neurone a appris à détecter.
  static crossover(a, b) {
    const child = a.copy();
    for (let l = 0; l < child.weights.length; l++) {
      for (let j = 0; j < child.weights[l].length; j++) {
        if (random(1) < 0.5) {
          child.weights[l][j] = b.weights[l][j].slice();
          child.biases[l][j] = b.biases[l][j];
        }
      }
    }
    return child;
  }

  toJSON() {
    return { sizes: this.sizes, weights: this.weights, biases: this.biases };
  }

  static fromJSON(json) {
    const nn = new NeuralNetwork(json.sizes);
    nn.weights = json.weights;
    nn.biases = json.biases;
    return nn;
  }
}
