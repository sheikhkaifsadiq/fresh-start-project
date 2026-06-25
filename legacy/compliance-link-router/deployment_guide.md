# Aegis Route: Split Architecture Deployment Guide

To deploy your massively scaled Aegis Route SaaS, we must follow the **Split Architecture** plan exactly. This ensures maximum security, global speed, and zero wasted compute on your Oracle server.

Here is exactly what files go where and how to push them.

---

## 1. Vercel (Frontend & API Gateway)
**What goes here:** The entire `compliance-link-router` Next.js directory.

Vercel will host your React UI, compile the thousands of lines of Tailwind/Framer Motion code we generated, and act as a secure gateway to your database and ML server.

### Steps to Deploy:
1. **Push to GitHub**:
   Open your terminal in `C:\Users\Sheikhkaifsadiq\Desktop\url_saas\compliance-link-router` and run:
   ```bash
   git init
   git add .
   git commit -m "Initial Aegis Route Massive Premium Build"
   git branch -M main
   # Add your github remote url here:
   git remote add origin https://github.com/your-username/aegis-route.git
   git push -u origin main
   ```
2. **Connect to Vercel**:
   - Go to [Vercel.com](https://vercel.com/) and click "Add New Project".
   - Import your newly pushed `aegis-route` GitHub repository.
3. **Set Environment Variables in Vercel**:
   Before hitting deploy, add these to the Vercel Environment Variables section:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Keep this secret!).
   - `NEXT_PUBLIC_SITE_URL`: e.g., `https://aegis-route.vercel.app`
   - `INTERNAL_API_KEY`: A secure random string used to authenticate proxy requests.

> [!IMPORTANT]
> Vercel handles all global CDN routing automatically. Port 80/443 management is completely abstracted away for the frontend.

---

## 2. Supabase Cloud (Database)
**What goes here:** Your database schema and Row Level Security (RLS) policies.

You do not "push" code to Supabase in the traditional sense. Supabase is already hosted in the cloud. You just need to ensure the database structure is ready.

### Steps to Deploy:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Ensure all your required tables exist. Based on the subagents' code, you should have tables like:
   - `links` (id, slug, target_url, active, metadata, created_at, user_id)
   - `audit_logs` (id, action, ip_address, user_agent, bot_probability_score, created_at)
   - `ip_blacklist` (id, ip_address, reason, is_active)
   - `waf_rules` (id, condition, target, value, action, priority, enabled)

> [!TIP]
> Because your Next.js Vercel app uses the `SUPABASE_SERVICE_ROLE_KEY` inside `admin.ts` (server-side only), it can securely read and write to these tables without complex client-side RLS rules.

---

## 3. Oracle ARM64 Server (ML Engine & Heavy Compute)
**What goes here:** **ONLY** your Heavy Machine Learning scripts (e.g., Python FastAPI, TensorFlow/PyTorch models, heavy Node.js background workers). 

**Do NOT** push the `compliance-link-router` Next.js code here.

### Steps to Deploy:
1. **Create a separate directory locally** (e.g., `C:\Users\Sheikhkaifsadiq\Desktop\url_saas\oracle-ml-engine`).
2. **Write your ML API**: This folder should contain the Python or Node code that actually runs the neural networks and returns bot scores.
3. **Push to Oracle**:
   Use SCP or Git to transfer *only* this `oracle-ml-engine` folder to your Oracle Server (`161.118.188.163`).
   ```bash
   scp -i "path/to/your/private-key" -r C:\Users\Sheikhkaifsadiq\Desktop\url_saas\oracle-ml-engine ubuntu@161.118.188.163:~/
   ```
4. **Run the ML Engine Privately**:
   On the Oracle server, run your ML engine on a closed port (e.g., `3001` or `3002`) using PM2 or Docker.
   ```bash
   pm2 start ml-api.py --name "aegis-ml"
   ```

> [!CAUTION]
> As discussed, keep Port 80 and 443 **CLOSED** to the public internet on the Oracle server. Connect to it securely via an SSH tunnel from your Vercel deployment, or configure your Vercel Next.js proxy routes to authenticate tightly with the Oracle server's IP address.

---

## Summary Flow
1. User clicks a link -> Hits **Vercel** CDN (Fast, Global).
2. Vercel runs WAF checks -> Queries **Supabase** (Fast DB).
3. If deep ML analysis is needed -> Vercel pings **Oracle Server** privately -> Returns result to Vercel.
4. Vercel redirects user or blocks them.
