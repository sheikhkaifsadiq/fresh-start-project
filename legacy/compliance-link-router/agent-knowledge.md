# 🧠 Agent Core Memory & Knowledge State

This is the single Source of Truth for the entire project. Read this before touching any file.

---

## 🏗️ 1. Project & File Map

| Domain | Path | Purpose |
| :--- | :--- | :--- |
| **Root Layout** | `src/app/layout.tsx` | Injects `SmoothScrollProvider` (Lenis). Wraps entire app. |
| **Edge API Router** | `src/app/api/v1/...` | REST API endpoints for links, analytics, ML models, audit logs. |
| **Live Stats SSE** | `src/app/api/live-stats/route.ts` | Server-Sent Events endpoint. Streams real-time NN classifications to dashboard. |
| **Real-Time Inference** | `src/lib/ml/inference.ts` | Fetches weights from Supabase (60s TTL cache). Classifies every request via 5-layer Deep NN. |
| **ML Engine Core** | `src/lib/ml/neural-network.ts` | Deep MLP: 14→64→64→32→32→16→1. Backprop calculus. `forwardPassWithActivations`. |
| **ML Engine Types** | `src/lib/ml/types.ts` | `TrafficFeatures` (14 inputs), `MLModelWeights` (hiddenLayers[] + outputLayer), `HiddenLayerWeights` |
| **Training Script** | `scripts/train-model.ts` | 1,000,000 dataset SGD Backpropagation engine. Pushes to Supabase `ml_models`. |
| **Dashboard UI** | `src/app/(dashboard)/...` | Liquid-glass themed Next.js. Pages: analytics, links, ml-engine, simulator, security, settings |
| **Neural Net Viz** | `src/components/dashboard/NeuralNetworkViz.tsx` | SVG canvas. Live neuron activation animation. |
| **Live Traffic Feed** | `src/components/dashboard/LiveTrafficFeed.tsx` | Connects to SSE. Animated Framer Motion traffic stream. |
| **Smooth Scroll** | `src/components/providers/SmoothScrollProvider.tsx` | Lenis 1.x momentum scroll. GPU-accelerated. |

---

## 🧬 2. Neural Network Architecture (CURRENT — v3.0.deep)

```
Input (14)  →  L1 ReLU (64)  →  L2 ReLU (64)  →  L3 ReLU (32)  →  L4 ReLU (32)  →  L5 ReLU (16)  →  Output Sigmoid (1)
```

### TrafficFeatures (14 inputs)
1. `hasSecFetchHeaders` → missing = bot signal
2. `acceptLangPresent` → missing = bot signal
3. `refererPresent` → missing = weak bot signal
4. `requestRatePerMin` → normalized /200
5. `headerCount` → normalized /30
6. `uaEntropy` → low = bot
7. `headerOrderScore` → low = bot
8. `userAgent` → empty string = bot
9. `connectionTimeMs` → very fast = bot
10. `userAgent contains 'bot/crawler/spider'` → direct bot
11. `asnType: 'hosting'` → datacenter IP = bot
12. `velocityScore` → normalized /10
13. `geoMismatch` → timezone vs IP mismatch
14. `headlessBrowser` → Puppeteer/Selenium signatures

---

## ☁️ 3. Database Schema (Supabase)

- **`links`**: `id, destination_url, user_id, active`
- **`ml_models`**: `id, model_name, version, weights_json (jsonb), metadata (jsonb), is_active, created_at`
- **`audit_logs`**: `id, ip_address, user_agent, bot_probability_score, action, created_at`

---

## ☁️ 4. Infrastructure

| Component | Details |
| :--- | :--- |
| **Cloud** | Oracle Cloud Infrastructure — Always Free ARM64 |
| **Shape** | VM.Standard.A1.Flex — 4 OCPUs, 24GB RAM |
| **OS** | Ubuntu 24.04 LTS + Cinnamon Desktop + xRDP |
| **Server IP** | 161.118.188.163 |
| **SSH Key** | `C:\Users\Sheikhkaifsadiq\Downloads\ssh-key-2026-06-21.key` |
| **GitHub Repo** | `https://github.com/sheikhkaifsadiq/url-saas.git` |
| **Firewall** | Port 80 (HTTP), 443 (HTTPS), 3389 (RDP) open |

---

## 📦 5. NPM Packages (Key)

- `next`, `react`, `typescript` — core framework
- `framer-motion` — page/component animations
- `lenis` — smooth scroll physics (replaces `@studio-freight/lenis`)
- `gsap` — advanced timeline animations (installed, available)
- `lucide-react` — icon library
- `@supabase/supabase-js` — database client
- `zod` — schema validation

---

## 📈 6. Current Status

| Phase | Status |
| :--- | :--- |
| UI & Dashboard | ✅ Complete (liquid-glass, animations) |
| Deep Neural Network (5 layers) | ✅ Complete (14→64→64→32→32→16→1) |
| Backprop Training (1M datasets) | ✅ Complete, Model v3.0.deep deployed to Supabase |
| Real-Time Inference Engine | ✅ Complete (`src/lib/ml/inference.ts`) |
| SSE Live Traffic Stream | ✅ Complete (`/api/live-stats`) |
| Lenis Smooth Scroll | ✅ Complete (global provider) |
| GitHub Push | ✅ Complete (main branch) |
| Ubuntu Server Deployment | 🔄 IN PROGRESS (Node.js 20 installing) |
