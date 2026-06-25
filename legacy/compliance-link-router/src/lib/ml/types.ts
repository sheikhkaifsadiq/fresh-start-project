// ML Neural Network: Pure TypeScript MLP implementation
// Architecture: 10-feature input → 32-neuron hidden (ReLU) → 1-neuron output (Sigmoid)
// Score: 0.0 = human, 1.0 = bot/scraper

export interface TrafficFeatures {
  ipAddress: string;
  userAgent: string;
  requestRatePerMin: number;
  headerCount: number;
  hasSecFetchHeaders: boolean;
  acceptLangPresent: boolean;
  uaEntropy: number;
  headerOrderScore: number;
  connectionTimeMs: number;
  refererPresent: boolean;
  asnType?: 'hosting' | 'isp' | 'business' | 'unknown';
  velocityScore?: number;
  geoMismatch?: boolean;
  headlessBrowser?: boolean;
}

export interface HiddenLayerWeights {
  w: number[][];
  b: number[];
}

export interface MLModelWeights {
  hiddenLayers: HiddenLayerWeights[];
  outputLayer: {
    w: number[];
    b: number;
  };
}

export interface ClassificationResult {
  score: number;                   // 0.0 – 1.0
  label: 'human' | 'bot' | 'uncertain';
  confidence: number;              // 0.0 – 1.0
  features: TrafficFeatures;
  heuristicOverride: boolean;
}
