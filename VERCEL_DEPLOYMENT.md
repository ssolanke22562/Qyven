# 🚀 Vercel Deployment Guide — AgentX

This project is fully optimized for 1-click deployment on **Vercel** with Next.js 14 App Router, Three.js hardware acceleration, and Multi-Agent serverless function execution.

---

## Quick Deploy Steps

### Method 1: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy project
vercel
```

---

### Method 2: Deploy via Vercel Dashboard (GitHub Integration)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Upgrade to Multi-Agent Architecture and prepare Vercel deployment"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
3. Import your GitHub repository (`ssolanke22562/Qyven`).
4. Framework Preset: **Next.js** (automatically detected).

---

## 🔑 Required Environment Variables on Vercel

In the Vercel Project Settings → **Environment Variables**, add the following keys:

| Environment Variable | Description | Example / Required Value |
|----------------------|-------------|--------------------------|
| `GEMINI_API_KEY` | Google Gemini API Key for multi-agent LLM inference | `AQ.Ab8RN6...` |
| `GROQ_API_KEY` | Groq API Key for LPU fallback inference | `gsk_TvGg...` |
| `NEWS_API_KEY` | NewsData / GNews / NewsAPI Key for live market news retrieval | `pub_e730...` |
| `GROQ_MODEL` | Groq Model ID (Optional) | `openai/gpt-oss-120b` |
| `NEXT_PUBLIC_GITHUB_URL` | Your GitHub repository URL | `https://github.com/ssolanke22562/Qyven` |
| `NEXT_PUBLIC_ARCHITECTURE_DOC_URL` | Optional Whitepaper Doc URL | *(Leave empty to open modal)* |

---

## 🛠️ Live Production Deployment

- **Live URL**: [https://qyven-web.vercel.app/](https://qyven-web.vercel.app/)
- Verify that the 3D Knowledge Graph renders cleanly.
- Test a query in the **Multi-Agent Engine** section to verify live serverless API execution across Research, Analysis, and Synthesis agents.
