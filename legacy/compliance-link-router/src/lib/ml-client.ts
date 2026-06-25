// Oracle ML Server Circuit Breaker and Retry Client
// Connects Vercel Next.js Edge to Private Oracle ARM64 Compute Node

interface MLClientOptions {
  maxRetries?: number;
  timeoutMs?: number;
  circuitBreakerThreshold?: number;
}

class CircuitBreaker {
  private failures: number = 0;
  private threshold: number;
  private isOpen: boolean = false;
  private resetTimeout: NodeJS.Timeout | null = null;
  private resetTimeMs: number = 30000; // 30s cooling period

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  public recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.isOpen = true;
      console.warn(`[ML-CIRCUIT] Circuit Breaker OPEN. ML Node unavailable.`);
      if (this.resetTimeout) clearTimeout(this.resetTimeout);
      this.resetTimeout = setTimeout(() => {
        this.isOpen = false;
        this.failures = 0;
        console.log(`[ML-CIRCUIT] Circuit Breaker HALF-OPEN. Attempting reconnect.`);
      }, this.resetTimeMs);
    }
  }

  public recordSuccess() {
    this.failures = 0;
    this.isOpen = false;
  }

  public isAvailable() {
    return !this.isOpen;
  }
}

export class OracleMLClient {
  private baseUrl: string;
  private apiKey: string;
  private options: Required<MLClientOptions>;
  private circuitBreaker: CircuitBreaker;

  constructor(baseUrl: string, apiKey: string, options: MLClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.options = {
      maxRetries: options.maxRetries || 2,
      timeoutMs: options.timeoutMs || 2000,
      circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
    };
    this.circuitBreaker = new CircuitBreaker(this.options.circuitBreakerThreshold);
  }

  public async request<T>(endpoint: string, payload: any): Promise<T> {
    if (!this.circuitBreaker.isAvailable()) {
      throw new Error("Oracle ML Node is currently unavailable (Circuit Breaker OPEN).");
    }

    let attempt = 0;
    while (attempt <= this.options.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": this.apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        this.circuitBreaker.recordSuccess();
        return data as T;
      } catch (error: any) {
        attempt++;
        if (attempt > this.options.maxRetries) {
          this.circuitBreaker.recordFailure();
          console.error(`[ML-CLIENT] Failed to reach Oracle Node after ${attempt} attempts:`, error.message);
          throw error;
        }
        // Exponential backoff
        await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
      }
    }
    throw new Error("Unreachable");
  }

  public async evaluateBotProbability(features: number[], context: any) {
    try {
      return await this.request<{ bot_probability: number, shap_values: number[] }>('/v1/predict/bot', {
        features,
        context
      });
    } catch (err) {
      // Return safe default if ML node fails to prevent locking out users
      return { bot_probability: 0.1, shap_values: [], is_fallback: true };
    }
  }

  public async startTrainingJob(config: any) {
    return await this.request('/v1/train/start', config);
  }
}

// Singleton export
export const mlClient = new OracleMLClient(
  process.env.ORACLE_ML_SERVER_URL || "http://10.0.0.5:8080",
  process.env.ORACLE_ML_API_KEY || "dev-key",
  { timeoutMs: 1500, maxRetries: 1 } // Aggressive timeouts for edge
);
