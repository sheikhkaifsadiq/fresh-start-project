import { MLModelWeights, TrafficFeatures } from './types';

export interface LayerGradients {
  dW: number[][];
  dB: number[];
}

export interface NetworkGradients {
  hiddenGradients: LayerGradients[];
  outputGradient: { dW: number[]; dB: number };
}

export interface ForwardCache {
  activations: number[][];
  zValues: number[][];
  zOut: number;
  aOut: number;
  dropoutMasks: boolean[][];
}

export interface BatchNormState {
  gamma: number[];
  beta: number[];
  runningMean: number[];
  runningVar: number[];
  epsilon: number;
  momentum: number;
}

export interface TrainingConfig {
  learningRate: number;
  l2Lambda: number;
  dropoutRate: number;
  gradientClipNorm: number;
  batchSize: number;
  epochs: number;
  momentum: number;
  lrDecay: number;
  warmupSteps: number;
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  learningRate: number;
  gradientNorm: number;
}

export interface OptimizerState {
  velocityW: number[][][];
  velocityB: number[][];
  velocityOutW: number[];
  velocityOutB: number;
  step: number;
}

export function relu(x: number): number { return x > 0 ? x : 0; }
export function reluDerivative(x: number): number { return x > 0 ? 1 : 0; }
export function leakyRelu(x: number, alpha = 0.01): number { return x > 0 ? x : alpha * x; }
export function leakyReluDerivative(x: number, alpha = 0.01): number { return x > 0 ? 1 : alpha; }
export function sigmoid(x: number): number { const c = Math.max(-88, Math.min(88, x)); return 1 / (1 + Math.exp(-c)); }
export function sigmoidDerivative(x: number): number { const s = sigmoid(x); return s * (1 - s); }
export function tanh(x: number): number { return Math.tanh(x); }
export function tanhDerivative(x: number): number { const t = Math.tanh(x); return 1 - t * t; }
export function softmax(vec: number[]): number[] {
  const m = Math.max(...vec);
  const exps = vec.map(v => Math.exp(v - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / s);
}
export function applyRelu(vec: number[]): number[] { return vec.map(relu); }
export function applyLeakyRelu(vec: number[], alpha = 0.01): number[] { return vec.map(v => leakyRelu(v, alpha)); }

export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}
export function matVecMul(matrix: number[][], vec: number[]): number[] { return matrix.map(row => dotProduct(row, vec)); }
export function matMul(A: number[][], B: number[][]): number[][] {
  const rows = A.length, cols = B[0].length, inner = B.length;
  const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) for (let k = 0; k < inner; k++) { if (A[i][k] === 0) continue; for (let j = 0; j < cols; j++) result[i][j] += A[i][k] * B[k][j]; }
  return result;
}
export function addBias(vec: number[], bias: number[]): number[] { return vec.map((v, i) => v + (bias[i] ?? 0)); }
export function transpose(matrix: number[][]): number[][] { if (!matrix.length) return []; return matrix[0].map((_, c) => matrix.map(r => r[c])); }
export function outerProduct(a: number[], b: number[]): number[][] { return a.map(va => b.map(vb => va * vb)); }
export function vecAdd(a: number[], b: number[]): number[] { return a.map((v, i) => v + b[i]); }
export function vecScale(vec: number[], s: number): number[] { return vec.map(v => v * s); }
export function matrixScale(mat: number[][], s: number): number[][] { return mat.map(row => row.map(v => v * s)); }
export function matrixAdd(A: number[][], B: number[][]): number[][] { return A.map((row, i) => row.map((v, j) => v + B[i][j])); }
export function vecNorm(vec: number[]): number { return Math.sqrt(vec.reduce((s, v) => s + v * v, 0)); }
export function matrixFrobeniusNorm(mat: number[][]): number { let s = 0; for (const row of mat) for (const v of row) s += v * v; return Math.sqrt(s); }
export function zeroVector(size: number): number[] { return new Array(size).fill(0); }
export function onesVector(size: number): number[] { return new Array(size).fill(1); }

function lcgRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return (s / 0xffffffff) * 2 - 1; };
}

export function xavierInit(inp: number, out: number, seed: number): number[][] {
  const rand = lcgRandom(seed), scale = Math.sqrt(2.0 / (inp + out));
  return Array.from({ length: out }, () => Array.from({ length: inp }, () => rand() * scale));
}
export function heInit(inp: number, out: number, seed: number): number[][] {
  const rand = lcgRandom(seed), scale = Math.sqrt(2.0 / inp);
  return Array.from({ length: out }, () => Array.from({ length: inp }, () => rand() * scale));
}

export function createBatchNormState(size: number): BatchNormState {
  return { gamma: onesVector(size), beta: zeroVector(size), runningMean: zeroVector(size), runningVar: onesVector(size), epsilon: 1e-8, momentum: 0.99 };
}
export function batchNormForward(x: number[], state: BatchNormState, training: boolean): { out: number[]; mean: number[]; variance: number[] } {
  const n = x.length;
  if (training) {
    const mean = x.reduce((s, v) => s + v, 0) / n;
    const variance = x.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    state.runningMean = state.runningMean.map(m => state.momentum * m + (1 - state.momentum) * mean);
    state.runningVar = state.runningVar.map(v => state.momentum * v + (1 - state.momentum) * variance);
    const xHat = x.map(v => (v - mean) / Math.sqrt(variance + state.epsilon));
    return { out: xHat.map((v, i) => state.gamma[i] * v + state.beta[i]), mean: [mean], variance: [variance] };
  }
  const xHat = x.map((v, i) => (v - state.runningMean[i]) / Math.sqrt(state.runningVar[i] + state.epsilon));
  return { out: xHat.map((v, i) => state.gamma[i] * v + state.beta[i]), mean: state.runningMean, variance: state.runningVar };
}

export function applyDropout(vec: number[], rate: number, training: boolean, seed: number): { out: number[]; mask: boolean[] } {
  if (!training || rate === 0) return { out: vec, mask: new Array(vec.length).fill(true) };
  const rand = lcgRandom(seed), scale = 1 / (1 - rate);
  const mask = vec.map(() => Math.abs(rand()) > rate);
  return { out: vec.map((v, i) => mask[i] ? v * scale : 0), mask };
}

export function clipGradientNorm(grads: NetworkGradients, maxNorm: number): NetworkGradients {
  let totalNorm = 0;
  for (const lg of grads.hiddenGradients) { totalNorm += lg.dW.reduce((s, r) => s + r.reduce((ss, v) => ss + v * v, 0), 0); totalNorm += lg.dB.reduce((s, v) => s + v * v, 0); }
  totalNorm += grads.outputGradient.dW.reduce((s, v) => s + v * v, 0) + grads.outputGradient.dB ** 2;
  totalNorm = Math.sqrt(totalNorm);
  if (totalNorm <= maxNorm) return grads;
  const scale = maxNorm / (totalNorm + 1e-12);
  return {
    hiddenGradients: grads.hiddenGradients.map(lg => ({ dW: matrixScale(lg.dW, scale), dB: vecScale(lg.dB, scale) })),
    outputGradient: { dW: vecScale(grads.outputGradient.dW, scale), dB: grads.outputGradient.dB * scale },
  };
}

export const FEATURE_NAMES = ['Missing Sec-Fetch Headers','Missing Accept-Language','Missing Referer','Request Rate (norm)','Header Count (norm)','UA Entropy (inv)','Header Order Score (inv)','Empty User-Agent','Connection Speed (norm)','Bot Pattern in UA','ASN Type (Hosting)','Velocity Score (norm)','Geo Mismatch','Headless Browser'] as const;

export function featuresToVector(f: TrafficFeatures): number[] {
  return [
    f.hasSecFetchHeaders ? 0.0 : 1.0, f.acceptLangPresent ? 0.0 : 1.0, f.refererPresent ? 0.0 : 0.5,
    Math.min(1, f.requestRatePerMin / 200), Math.min(1, f.headerCount / 30), Math.max(0, 1 - f.uaEntropy / 8),
    Math.max(0, 1 - f.headerOrderScore), f.userAgent.length === 0 ? 1.0 : 0.0, Math.min(1, f.connectionTimeMs / 1000),
    f.userAgent.toLowerCase().includes('bot') || f.userAgent.toLowerCase().includes('crawler') || f.userAgent.toLowerCase().includes('spider') ? 1.0 : 0.0,
    (f.asnType ?? 'unknown') === 'hosting' ? 1.0 : (f.asnType ?? 'unknown') === 'business' ? 0.5 : 0.0,
    Math.min(1, (f.velocityScore ?? 0) / 10), (f.geoMismatch ?? false) ? 1.0 : 0.0, (f.headlessBrowser ?? false) ? 1.0 : 0.0,
  ];
}

export function forwardPass(features: number[], weights: MLModelWeights): number {
  let activation = features;
  for (const layer of weights.hiddenLayers) { const z = addBias(matVecMul(layer.w, activation), layer.b); activation = applyRelu(z); }
  return sigmoid(dotProduct(weights.outputLayer.w, activation) + weights.outputLayer.b);
}

export function forwardPassWithActivations(features: number[], weights: MLModelWeights, dropoutRate = 0, training = false): ForwardCache {
  const activations: number[][] = [features], zValues: number[][] = [], dropoutMasks: boolean[][] = [];
  let currentA = features;
  for (let i = 0; i < weights.hiddenLayers.length; i++) {
    const layer = weights.hiddenLayers[i];
    const z = addBias(matVecMul(layer.w, currentA), layer.b);
    zValues.push(z);
    const activated = applyRelu(z);
    const { out, mask } = applyDropout(activated, dropoutRate, training, i * 1337 + 42);
    dropoutMasks.push(mask);
    currentA = out;
    activations.push(currentA);
  }
  const zOut = dotProduct(weights.outputLayer.w, currentA) + weights.outputLayer.b;
  return { activations, zValues, zOut, aOut: sigmoid(zOut), dropoutMasks };
}

export function backprop(cache: ForwardCache, weights: MLModelWeights, target: number, l2Lambda: number): NetworkGradients {
  const { activations, zValues, zOut, aOut } = cache;
  const numLayers = weights.hiddenLayers.length;
  const delta_out = (aOut - target) * sigmoidDerivative(zOut);
  const lastA = activations[numLayers];
  const dW_out_reg = vecAdd(vecScale(lastA, delta_out), vecScale(weights.outputLayer.w, l2Lambda));
  const hiddenGradients: LayerGradients[] = new Array(numLayers);
  let dA_prev = vecScale(weights.outputLayer.w, delta_out);
  for (let i = numLayers - 1; i >= 0; i--) {
    const delta = dA_prev.map((d, j) => d * reluDerivative(zValues[i][j]));
    const dW_reg = matrixAdd(outerProduct(delta, activations[i]), matrixScale(weights.hiddenLayers[i].w, l2Lambda));
    hiddenGradients[i] = { dW: dW_reg, dB: [...delta] };
    dA_prev = matVecMul(transpose(weights.hiddenLayers[i].w), delta);
  }
  return { hiddenGradients, outputGradient: { dW: dW_out_reg, dB: delta_out } };
}

export function createOptimizerState(weights: MLModelWeights): OptimizerState {
  return {
    velocityW: weights.hiddenLayers.map(l => l.w.map(row => zeroVector(row.length))),
    velocityB: weights.hiddenLayers.map(l => zeroVector(l.b.length)),
    velocityOutW: zeroVector(weights.outputLayer.w.length),
    velocityOutB: 0, step: 0,
  };
}

export function sgdMomentumStep(weights: MLModelWeights, grads: NetworkGradients, optimizer: OptimizerState, lr: number, momentumCoef: number): MLModelWeights {
  optimizer.step++;
  const newHiddenLayers = weights.hiddenLayers.map((layer, i) => {
    const vW = optimizer.velocityW[i].map((vRow, r) => vRow.map((v, c) => momentumCoef * v + lr * grads.hiddenGradients[i].dW[r][c]));
    const vB = optimizer.velocityB[i].map((v, j) => momentumCoef * v + lr * grads.hiddenGradients[i].dB[j]);
    optimizer.velocityW[i] = vW; optimizer.velocityB[i] = vB;
    return { w: layer.w.map((row, r) => row.map((v, c) => v - vW[r][c])), b: layer.b.map((v, j) => v - vB[j]) };
  });
  const newOutVW = optimizer.velocityOutW.map((v, i) => momentumCoef * v + lr * grads.outputGradient.dW[i]);
  const newOutVB = momentumCoef * optimizer.velocityOutB + lr * grads.outputGradient.dB;
  optimizer.velocityOutW = newOutVW; optimizer.velocityOutB = newOutVB;
  return { hiddenLayers: newHiddenLayers, outputLayer: { w: weights.outputLayer.w.map((v, i) => v - newOutVW[i]), b: weights.outputLayer.b - newOutVB } };
}

export function binaryCrossEntropy(pred: number, target: number): number {
  const eps = 1e-12, p = Math.max(eps, Math.min(1 - eps, pred));
  return -(target * Math.log(p) + (1 - target) * Math.log(1 - p));
}

export function l2Penalty(weights: MLModelWeights, lambda: number): number {
  let penalty = 0;
  for (const layer of weights.hiddenLayers) for (const row of layer.w) for (const v of row) penalty += v * v;
  for (const v of weights.outputLayer.w) penalty += v * v;
  return 0.5 * lambda * penalty;
}

export function computeMetrics(preds: number[], labels: number[], threshold = 0.5): { accuracy: number; precision: number; recall: number; f1: number } {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < preds.length; i++) {
    const p = preds[i] >= threshold ? 1 : 0, t = labels[i];
    if (p === 1 && t === 1) tp++; else if (p === 1 && t === 0) fp++; else if (p === 0 && t === 1) fn++; else tn++;
  }
  const accuracy = (tp + tn) / (tp + fp + fn + tn + 1e-12);
  const precision = tp / (tp + fp + 1e-12), recall = tp / (tp + fn + 1e-12);
  return { accuracy, precision, recall, f1: 2 * precision * recall / (precision + recall + 1e-12) };
}

export function computeFeatureImportance(features: number[], weights: MLModelWeights): number[] {
  const eps = 1e-4, baseScore = forwardPass(features, weights);
  return features.map((val, i) => { const p = [...features]; p[i] = val + eps; return Math.abs((forwardPass(p, weights) - baseScore) / eps); });
}

export function trainOnBatch(weights: MLModelWeights, optimizer: OptimizerState, batch: Array<{ features: number[]; label: number }>, config: TrainingConfig): { weights: MLModelWeights; loss: number; gradientNorm: number } {
  const batchSize = batch.length;
  if (!batchSize) return { weights, loss: 0, gradientNorm: 0 };
  let totalLoss = 0, accumGrads: NetworkGradients | null = null;
  for (const sample of batch) {
    const cache = forwardPassWithActivations(sample.features, weights, config.dropoutRate, true);
    totalLoss += binaryCrossEntropy(cache.aOut, sample.label);
    const grads = backprop(cache, weights, sample.label, config.l2Lambda);
    if (!accumGrads) { accumGrads = grads; } else {
      accumGrads = {
        hiddenGradients: accumGrads.hiddenGradients.map((ag, i) => ({ dW: matrixAdd(ag.dW, grads.hiddenGradients[i].dW), dB: vecAdd(ag.dB, grads.hiddenGradients[i].dB) })),
        outputGradient: { dW: vecAdd(accumGrads.outputGradient.dW, grads.outputGradient.dW), dB: accumGrads.outputGradient.dB + grads.outputGradient.dB },
      };
    }
  }
  if (!accumGrads) return { weights, loss: 0, gradientNorm: 0 };
  const avgGrads: NetworkGradients = {
    hiddenGradients: accumGrads.hiddenGradients.map(ag => ({ dW: matrixScale(ag.dW, 1 / batchSize), dB: vecScale(ag.dB, 1 / batchSize) })),
    outputGradient: { dW: vecScale(accumGrads.outputGradient.dW, 1 / batchSize), dB: accumGrads.outputGradient.dB / batchSize },
  };
  const clipped = clipGradientNorm(avgGrads, config.gradientClipNorm);
  let gradNorm = 0;
  for (const lg of clipped.hiddenGradients) { gradNorm += matrixFrobeniusNorm(lg.dW) ** 2 + vecNorm(lg.dB) ** 2; }
  gradNorm = Math.sqrt(gradNorm + vecNorm(clipped.outputGradient.dW) ** 2 + clipped.outputGradient.dB ** 2);
  let effectiveLr = config.learningRate;
  if (optimizer.step < config.warmupSteps) effectiveLr *= (optimizer.step + 1) / config.warmupSteps;
  return { weights: sgdMomentumStep(weights, clipped, optimizer, effectiveLr, config.momentum), loss: totalLoss / batchSize, gradientNorm: gradNorm };
}

function makeWeightMatrix(inp: number, out: number, seed: number, scale: number): number[][] {
  let s = seed;
  return Array.from({ length: out }, () => Array.from({ length: inp }, () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return ((s / 0x80000000) - 1) * scale; }));
}

const L1_W = makeWeightMatrix(14, 64, 100, 0.8);
const L1_B = Array.from({ length: 64 }, () => 0.1);
L1_W[0][0] += 1.4; L1_W[1][3] += 1.6; L1_W[2][5] += 1.5; L1_W[3][7] += 2.0; L1_W[4][9] += 1.8;
L1_W[5][6] += 1.3; L1_W[6][10] += 1.9; L1_W[7][11] += 1.7; L1_W[8][12] += 1.4; L1_W[9][13] += 2.5;
const L2_W = makeWeightMatrix(64, 64, 200, 0.5); const L2_B = Array.from({ length: 64 }, () => 0.05);
const L3_W = makeWeightMatrix(64, 32, 300, 0.5); const L3_B = Array.from({ length: 32 }, () => 0.05);
const L4_W = makeWeightMatrix(32, 32, 400, 0.4); const L4_B = Array.from({ length: 32 }, () => 0.05);
const L5_W = makeWeightMatrix(32, 16, 500, 0.4); const L5_B = Array.from({ length: 16 }, () => 0.05);
const OUT_W = makeWeightMatrix(16, 1, 600, 0.4)[0]; const OUT_B = -1.5;

export const DEFAULT_WEIGHTS: MLModelWeights = {
  hiddenLayers: [{ w: L1_W, b: L1_B },{ w: L2_W, b: L2_B },{ w: L3_W, b: L3_B },{ w: L4_W, b: L4_B },{ w: L5_W, b: L5_B }],
  outputLayer: { w: OUT_W, b: OUT_B },
};
