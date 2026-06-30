/**
 * Server-only ML Client for Aegis Route
 * 
 * Target: Cloudflare Workers / Node.js
 * Security: HMAC-SHA256, Cloudflare Access Service Tokens, Circuit Breaker
 * 
 * WARNING: This file must never be imported into client-side components.
 */

interface MLClientOptions {
  maxRetries?: number;
  timeoutMs?: number;
  circuitBreakerThreshold?: number;
}

class CircuitBreaker {
  private failures: number = 0;
  private threshold: number;
  private isOpen: boolean = false;
  private resetTimeout: NodeJS.Timeout | number | null = null;
  private resetTimeMs: number = 30000; // 30s cooling period

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  public recordFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.isOpen = true;
      console.warn(`[ML-CIRCUIT] Circuit Breaker OPEN. ML Node unavailable.`);
      if (this.resetTimeout) clearTimeout(this.resetTimeout as any);
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
  private hmacSecret: string;
  private cfClientId: string;
  private cfClientSecret: string;
  private options: Required<MLClientOptions>;
  private circuitBreaker: CircuitBreaker;

  constructor(
    baseUrl: string, 
    hmacSecret: string, 
    cfClientId: string, 
    cfClientSecret: string,
    options: MLClientOptions = {}
  ) {
    this.baseUrl = baseUrl;
    this.hmacSecret = hmacSecret;
    this.cfClientId = cfClientId;
    this.cfClientSecret = cfClientSecret;
    this.options = {
      maxRetries: options.maxRetries || 1,
      timeoutMs: options.timeoutMs || 2500,
      circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
    };
    this.circuitBreaker = new CircuitBreaker(this.options.circuitBreakerThreshold);
  }

  /**
   * Generates HMAC-SHA256 signature using Web Crypto API 
   * (Compatible with Cloudflare Workers)
   */
  private async generateSignature(timestamp: string, nonce: string, bodyText: string): Promise<string> {
    const encoder = new TextEncoder();
    
    // 1. Hash the body
    const bodyData = encoder.encode(bodyText);
    const bodyHashBuffer = await crypto.subtle.digest('SHA-256', bodyData);
    const bodyHashArray = Array.from(new Uint8Array(bodyHashBuffer));
    const bodyHashHex = bodyHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Construct message
    const message = `${timestamp}:${nonce}:${bodyHashHex}`;

    // 3. HMAC-SHA256
    const keyData = encoder.encode(this.hmacSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async request<T>(endpoint: string, payload: any): Promise<T> {
    if (!this.circuitBreaker.isAvailable()) {
      throw new Error("Oracle ML Node is currently unavailable (Circuit Breaker OPEN).");
    }

    // Input validation: Don't send massive payloads to the ML engine
    const bodyText = JSON.stringify(payload);
    if (bodyText.length > 5 * 1024 * 1024) {
      throw new Error("Payload Too Large");
    }

    let attempt = 0;
    while (attempt <= this.options.maxRetries) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = crypto.randomUUID();
        const signature = await this.generateSignature(timestamp, nonce, bodyText);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Aegis-Timestamp": timestamp,
          "X-Aegis-Nonce": nonce,
          "X-Aegis-Signature": signature,
        };

        // Inject Cloudflare Access Service Token if configured
        if (this.cfClientId && this.cfClientSecret) {
          headers["CF-Access-Client-Id"] = this.cfClientId;
          headers["CF-Access-Client-Secret"] = this.cfClientSecret;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers,
          body: bodyText,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`ML Engine HTTP Error: ${response.status}`);
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

  public async evaluateBotProbability(features: number[]) {
    try {
      return await this.request<{ prediction: number, confidence: number, status: string }>('/predict', {
        features
      });
    } catch (err) {
      // Fail closed but graceful for frontend: assume not a bot on timeout?
      // For security products, failing closed usually means ASSUME BOT to prevent attacks.
      console.warn("ML Engine failed. Defaulting to high risk.");
      return { prediction: 1.0, confidence: 0.0, status: "error" };
    }
  }
}

let _mlClientInstance: OracleMLClient | null = null;

export function getMlClient(): OracleMLClient {
  if (_mlClientInstance) return _mlClientInstance;

  const url = process.env.ORACLE_ML_URL;
  const secret = process.env.ORACLE_ML_HMAC_SECRET_CURRENT;

  if (!url) {
    throw new Error("FATAL: ORACLE_ML_URL environment variable is missing.");
  }
  
  if (!secret) {
    throw new Error("FATAL: ORACLE_ML_HMAC_SECRET_CURRENT environment variable is missing. Refusing to start with insecure fallbacks.");
  }

  _mlClientInstance = new OracleMLClient(
    url,
    secret,
    process.env.CF_ACCESS_CLIENT_ID || "",
    process.env.CF_ACCESS_CLIENT_SECRET || "",
    { timeoutMs: 2500, maxRetries: 1 }
  );

  return _mlClientInstance;
}
