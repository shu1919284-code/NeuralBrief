<div align="center">

<img src="public/favicon.svg" width="80" alt="NeuralBrief" />

# NeuralBrief

**AI-powered intelligence briefing — delivered to your inbox every morning at 07:00 UTC.**

[![Live Platform](https://img.shields.io/badge/Live_Platform-neuralbrief.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://neuralbrief-be395.web.app/)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

</div>

---

## Overview

NeuralBrief is a production-grade intelligence platform that eliminates information overload for engineers, founders, and analysts. A four-agent AI pipeline runs autonomously every night — scraping hundreds of sources, filtering noise, generating summaries, and delivering a structured digest to your Gmail by 7 AM.

You select your domains once. The agents handle everything else.

---

## Platform Showcase

### Neural Engine — Live AI Pipeline

> Real-time visualization of the four-agent orchestration system with animated data packets, consensus modeling, and dispatch sequencing.

![Neural Engine](docs/assets/demo.webp)

### Focus Domains — Signal Intelligence Grid

> Eight curated AI domains monitored continuously. Each card surfaces live confidence scores, source attribution, and direct access to the full technical report.

![Focus Domains](docs/assets/focus_domains.png)

### Briefing Reader — Technical Reports

> Every domain expands into a structured deep-dive with key takeaways, methodology breakdowns, and source citations. Graceful fallbacks ensure content is always available.

![Briefing Reader](docs/assets/briefing.png)

---

## Core Features

| Feature | Description |
|---|---|
| **Four-Agent Pipeline** | Scraper → Filter → Summary → Email agents run sequentially at 07:00 UTC with full error recovery |
| **Gemini AI Summarization** | Every article distilled to 2–3 sentences, categorized as breaking / analysis / release / general |
| **Relevance Scoring** | Filter Agent assigns 0–1 relevance scores per topic — off-signal content never reaches your inbox |
| **Topic Personalization** | Choose from 8+ AI domains at signup or update anytime from your profile |
| **Gmail-Native Delivery** | Digests sent via Gmail API, rendering natively in your inbox — not as plain text |
| **Google OAuth Sign-In** | One-click authentication, no passwords, no friction |
| **Bookmark System** | Save articles from any digest and revisit them from your profile |
| **Multilingual UI** | Full translations in English, Hindi, Spanish, French, Chinese, Korean + 8 more |
| **6 Theme Personalities** | Neural, Indigo Intelligence, Emerald Analyst, Crimson Real-Time, Amber Insight, Golden Executive |
| **AI Signal Dashboard** | Live analytics across all 8 domains — confidence scores, source distribution, signal volume |
| **Digest Frequency Control** | Switch between Daily / Weekly / None with immediate effect |
| **Privacy-First** | Zero inbox access, zero password storage, short-lived OAuth2 tokens only |

---

## Agent Pipeline

Cloud Scheduler fires `POST /api/cron/digest` daily at 07:00 UTC. Four agents execute in sequence:

```
┌─────────────────────────────────────────────────────────┐
│                   NeuralBrief Pipeline                  │
└─────────────────────────────────────────────────────────┘

  🕷️  SCRAPER AGENT
      Crawls RSS feeds, tech blogs, and news APIs
      Output → NewsItem[]
          │
          ▼
  🧹  FILTER AGENT
      Scores articles 0–1 for topic relevance
      Removes duplicates and low-signal content
      Output → FilteredNewsItem[]
          │
          ▼
  ✍️  SUMMARY AGENT
      Calls Gemini AI for 2–3 sentence summaries
      Categorizes: breaking / analysis / release / general
      Output → DigestSection[]
          │
          ▼
  📧  EMAIL AGENT
      Assembles DigestPayload
      Renders HTML template
      Delivers via Gmail API → User Inbox
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | Component model and rendering |
| TypeScript | 5 (strict) | End-to-end type safety |
| Tailwind CSS | v4 | Utility-first styling system |
| Framer Motion | Latest | Animations and micro-interactions |
| GSAP | 3 | Complex timeline animations |
| Three.js | Latest | WebGL neural canvas background |
| D3.js | 7 | Data visualizations |
| Recharts | Latest | Analytics dashboard charts |
| Vite | 6 | Build tooling and HMR |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express.js | 4 | REST API server |
| TypeScript | 5 | Type-safe server code |
| Gemini Flash | Latest | Article summarization and scoring |
| Gmail API | v1 | Digest delivery |
| Firebase Admin SDK | Latest | Firestore access and Auth verification |

### Infrastructure

| Service | Purpose |
|---|---|
| Firebase Hosting | Frontend CDN deployment |
| Firebase Auth | Google OAuth2 authentication |
| Firestore | User preferences, bookmarks, digest configs |
| Google Cloud Run | Containerized Express backend |
| Google Cloud Scheduler | Daily cron at 07:00 UTC |

---

## Project Structure

```
neuralbrief/
├── public/
│   └── locales/               # i18n translations (en, hi, es, fr, zh, ko + 8 more)
├── src/
│   ├── components/            # 26 React components
│   │   ├── profile/           # BookmarksTab, PreferencesTab, TopicsTab
│   │   ├── AISignalDashboard.tsx
│   │   ├── Engine.tsx         # GSAP pipeline visualization
│   │   ├── FocusDomains.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── NeuralCanvas.tsx   # Three.js WebGL background
│   │   ├── PersonalizationShowcase.tsx
│   │   ├── Pipeline3D.tsx
│   │   └── ...
│   ├── contexts/              # Auth, Language, Theme, Audio, Bookmark
│   ├── lib/
│   │   ├── firebase.ts        # Centralized Firebase access
│   │   └── hash.ts            # SHA-256 email hashing
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/
│   ├── agents/                # Scraper, Filter, Summary, Email
│   ├── config/                # Topics and source configuration
│   ├── middleware/            # Auth middleware
│   ├── prompts/               # Gemini prompt templates
│   ├── routes/                # digest.ts, topics.ts
│   ├── services/              # gemini-service, gmail-service, news-service
│   ├── types/                 # Shared TypeScript interfaces
│   ├── utils/                 # Logger and utilities
│   ├── cron.ts
│   └── index.ts
├── .env.example
├── firebase.json
├── firestore.rules
├── vite.config.ts
└── Dockerfile
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase project with Firestore and Google Auth enabled
- Gemini API key — [Google AI Studio](https://aistudio.google.com)
- Gmail API credentials (OAuth2 Client ID, Secret, Refresh Token)
- Firebase Admin SDK service account key

### Local Development

```bash
# Clone the repository
git clone https://github.com/shu1919284-code/NeuralBrief.git
cd neuralbrief

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Configure environment variables
cp .env.example .env.local
# Fill in all required values

# Start both servers
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

---

## Environment Variables

### Frontend (`VITE_*` prefix — public)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase browser API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase web app ID |

### Backend (server-only — never expose to client)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini AI API key |
| `GMAIL_CLIENT_ID` | ✅ | Gmail OAuth2 client ID |
| `GMAIL_CLIENT_SECRET` | ✅ | Gmail OAuth2 client secret |
| `GMAIL_REFRESH_TOKEN` | ✅ | Gmail OAuth2 refresh token |
| `GMAIL_SENDER_ADDRESS` | ✅ | Gmail address used to send digests |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | ✅ | Firebase Admin SDK service account (JSON string) |
| `CRON_SECRET` | ✅ | Authenticates Cloud Scheduler requests |
| `PORT` | ✅ | Express server port (default: 3001) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `ALLOWED_ORIGIN` | Production | CORS allowed origin |

---

## Deployment

NeuralBrief uses a split deployment architecture.

### Frontend → Firebase Hosting

```bash
npm run build
npx firebase deploy --only hosting
```

### Backend → Google Cloud Run

```bash
cd server

# Build and push container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/neuralbrief-server

# Deploy
gcloud run deploy neuralbrief-server \
  --image gcr.io/YOUR_PROJECT_ID/neuralbrief-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Cron → Google Cloud Scheduler

```
URL:      POST https://YOUR_CLOUD_RUN_URL/api/cron/digest
Schedule: 0 7 * * *
Header:   X-Cron-Secret: <CRON_SECRET>
```

---

## Roadmap

- [ ] **Daily Live Feed** — Upgrade API tier and implement aggressive caching for real-time daily ingestion (currently weekly due to rate limits)
- [ ] **User Feedback Loops** — In-digest feedback mechanism to continuously tune per-user relevance scoring
- [ ] **PWA Support** — Offline access and push notifications
- [ ] **Analytics Export** — Download signal data as CSV from the AI Signal Dashboard
- [ ] **Custom Source Addition** — Allow users to submit their own RSS feeds and blogs

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit format, and the PR checklist.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with precision. Delivered with purpose.</sub>
</div>
