# Machine Learning Traffic Classifier Engine Specification

## 1. Introduction

This document specifies the design, features, and deployment strategy for the Machine Learning (ML) Traffic Classifier Engine. This engine is a core component of the secure link routing platform, responsible for distinguishing between legitimate human traffic and programmatic scrapers or malicious bots in real-time at the Edge.

## 2. Objectives

*   **High Accuracy:** Accurately classify traffic to minimize false positives (blocking humans) and false negatives (allowing bots).
*   **Ultra-Low Latency:** Perform inference within the 30-millisecond global latency budget (NFR-1).
*   **Edge Compatibility:** The model must be lightweight enough to run within the constraints of Vercel Edge Runtime (WebAssembly or V8 isolates).

## 3. Feature Engineering (FR-12)

The model relies on features extracted from the incoming HTTP request at the Edge Middleware layer.

### 3.1. Network Handshakes
*   **TLS Cipher Suites:** The specific cipher suites offered by the client during the TLS handshake. Bots often use outdated or non-standard suites compared to modern browsers.
*   **SNI (Server Name Indication):** Presence and validity of the SNI extension.

### 3.2. Execution Speed & Timing
*   **Time to First Byte (TTFB) / Connection Time:** While harder to measure precisely at the Edge for the *current* request, historical connection speed data for an IP subnet can be a signal.
*   **Request Rate:** The frequency of requests from a specific IP or subnet within a short time window (calculated in conjunction with the rate-limiting KV store).

### 3.3. Header Entropy & Characteristics
*   **User-Agent Analysis:** Not just matching strings, but analyzing the structure and entropy of the User-Agent string.
*   **Accept-Language & Accept-Encoding:** Consistency of these headers with the claimed User-Agent.
*   **Header Order:** The specific order in which HTTP headers are sent can fingerprint certain HTTP clients or bot frameworks.
*   **Missing Standard Headers:** Absence of headers typically sent by modern browsers (e.g., `Sec-Fetch-Dest`).

### 3.4. TCP/IP Fingerprint Characteristics (Passive)
*   *Note: Full TCP/IP fingerprinting (like p0f) is difficult purely at the HTTP Edge layer. We rely on features exposed by the CDN/Edge provider.*
*   **IP Reputation:** Integration with threat intelligence feeds (cached at the Edge) to flag known bad IP ranges or Tor exit nodes.

## 4. Model Architecture (FR-13)

Given the strict latency and environment constraints, complex deep learning models (like large Transformers) are unsuitable.

### 4.1. Selected Architecture: Lightweight Neural Network (MLP)
*   **Type:** Multi-Layer Perceptron (MLP) or a small ensemble of decision trees (e.g., XGBoost compiled to WebAssembly).
*   **Structure (Example MLP):**
    *   **Input Layer:** ~20-30 normalized numerical features.
    *   **Hidden Layers:** 1 or 2 hidden layers with a small number of neurons (e.g., 32 or 64) using ReLU activation.
    *   **Output Layer:** 1 neuron with a Sigmoid activation function.
*   **Output (FR-14):** A floating-point score between 0.0 and 1.0.
    *   `Score -> 0.0`: High probability of being a human.
    *   `Score -> 1.0`: High probability of being a bot/scraper.

## 5. Fallback Heuristics (FR-15)

If the ML model fails to load, times out, or returns an uncertain score (e.g., around 0.5), the system immediately falls back to a deterministic heuristic tree to ensure continuous protection.

**Heuristic Rules (Evaluated in order):**

1.  **IP Blocklist:** Is the IP in a known bad IP cache? -> **Block/Bot**
2.  **Rate Limit:** Has the IP exceeded the absolute maximum request rate? -> **Block/Bot**
3.  **Missing User-Agent:** Is the User-Agent header entirely missing? -> **Block/Bot**
4.  **Suspicious User-Agent:** Does the User-Agent match known scraper signatures (e.g., "curl", "python-requests")? -> **Block/Bot**
5.  **Default:** If no heuristic triggers -> **Allow/Human** (Fail open to prioritize user experience, relying on rate limiting to catch aggressive abuse).

## 6. Model Training and Deployment (FR-16)

### 6.1. Training Pipeline
1.  **Data Collection:** Anonymized traffic logs (features only, no PII) are collected from the Edge and stored in a data lake.
2.  **Labeling:** Traffic is labeled using offline, heavier analysis tools, CAPTCHA challenge results, and threat intelligence feeds.
3.  **Training:** The lightweight model is trained offline using frameworks like TensorFlow or Scikit-learn.
4.  **Conversion:** The trained model is converted to a format suitable for Edge execution (e.g., ONNX, or compiled directly to WebAssembly).

### 6.2. Seamless Updates
*   The serialized model binary is stored in the `ml_models` database table.
*   A background process periodically syncs the active model binary to the fast Edge KV store (e.g., Vercel KV).
*   The Edge Middleware loads the model from the KV store into memory.
*   **Blue/Green Deployment:** When a new model is deployed, it is first loaded alongside the old model. A small percentage of traffic is scored by both models (shadow testing) to verify performance before the new model becomes the primary active model.
