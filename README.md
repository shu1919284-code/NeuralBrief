<div align="center">

<img src="public/favicon.svg" width="80" alt="NeuralBrief logo" />

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
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

</div>

---

## Overview

NeuralBrief is a production-grade AI intelligence platform that eliminates information overload for engineers, founders, and analysts. A four-agent AI pipeline runs autonomously every night — crawling hundreds of sources, filtering noise, generating summaries, and delivering a structured digest to your Gmail inbox by 7:00 AM UTC.

You select your domains once. The agents handle everything else.

---

## 📸 Platform Showcase

### ⚡ Neural Engine in Action
Watch the highly fluid glassmorphic interface and intelligent mouse-tracking animations come to life:
<br/>
<img src="docs/assets/demo.webp" alt="Neural Engine Animation" width="800" style="border-radius: 8px;" />

### 1. The Bento Command Center
An asymmetrical, responsive Bento Grid displaying live streams of intelligence domains. All 8 domains are visible simultaneously with unified metrics.
<br/>
<img src="docs/assets/focus_domains.png" alt="Focus Domains Bento Grid" width="800" style="border-radius: 8px;" />

### 2. Holographic AI Data Plate
A premium, glassmorphic card interface featuring an interactive, mouse-tracking radial glow that illuminates the content beneath your cursor. Includes animated SVG confidence gauges and pulsing "Live Update" badges.
<br/>
<img src="docs/assets/preview.png" alt="Holographic Data Plate" width="800" style="border-radius: 8px;" />

### 3. Rich Technical Reports
Every domain card expands into a detailed technical report. Even when the live feed is unavailable, the system gracefully falls back to beautifully simulated architectural overviews and key takeaways.
<br/>
<img src="docs/assets/briefing.png" alt="Briefing Reader" width="800" style="border-radius: 8px;" />

---

## How it works

NeuralBrief runs a fully automated pipeline triggered daily by Google Cloud Scheduler. Four specialized agents execute in sequence:

1. **Scraper Agent** crawls RSS feeds, tech blogs, and news APIs, producing a raw list of articles (`NewsItem[]`).
2. **Filter Agent** scores each article from 0–1 for topic relevance, removes duplicates, and discards low-signal content (`FilteredNewsItem[]`).
3. **Summary Agent** calls Gemini Flash to generate 2–3 sentence summaries and categorizes each item as `breaking`, `analysis`, `release`, or `general` (`DigestSection[]`).
4. **Email Agent** assembles the final payload, renders an HTML email template, and delivers it via the Gmail API directly to the user's inbox.

Users choose from 8+ AI domains at signup or update their preferences any time from their profile. Only content that clears the relevance threshold ever reaches the inbox.

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       NeuralBrief System                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Frontend (React 18)                   │   │
│  │  Hero · FocusDomains · Engine · AISignalDashboard       │   │
│  │  NeuralCanvas (Three.js) · Pipeline3D · BriefingReader  │   │
│  │                                                         │   │
│  │  Contexts: Auth · Language · Theme · Audio · Bookmark   │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ REST API                              │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │              Backend (Express / Cloud Run)               │   │
│  │                                                         │   │
│  │  Routes: /api/cron/digest · /api/topics                 │   │
│  │  Services: gemini-service · gmail-service · news-service│   │
│  │  Middleware: Auth verification                          │   │
│  └───────┬─────────────────────────┬───────────────────────┘   │
│          │                         │                            │
│  ┌───────▼───────┐       ┌─────────▼──────────┐               │
│  │   Firestore   │       │   Google APIs       │               │
│  │               │       │                     │               │
│  │ · Users       │       │ · Gemini Flash      │               │
│  │ · Preferences │       │ · Gmail API v1      │               │
│  │ · Bookmarks   │       │ · Cloud Scheduler   │               │
│  │ · Digests     │       │ · Cloud Run         │               │
│  └───────────────┘       └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent pipeline

Cloud Scheduler fires `POST /api/cron/digest` daily at 07:00 UTC. The four agents execute in strict sequence:

```
  SCRAPER AGENT
  ─────────────
  Crawls RSS feeds, tech blogs, and news APIs
  Output → NewsItem[]
      │
      ▼
  FILTER AGENT
  ────────────
  Scores articles 0–1 for topic relevance
  Removes duplicates and low-signal content
  Output → FilteredNewsItem[]
      │
      ▼
  SUMMARY AGENT
  ─────────────
  Calls Gemini Flash for 2–3 sentence summaries
  Categorizes: breaking / analysis / release / general
  Output → DigestSection[]
      │
      ▼
  EMAIL AGENT
  ───────────
  Assembles DigestPayload
  Renders HTML email template
  Delivers via Gmail API → User Inbox
```

---

## Data flow diagram

```
External Sources          NeuralBrief Pipeline              User
─────────────────         ─────────────────────             ────
RSS Feeds      ──────►  Scraper Agent
Tech Blogs     ──────►      │
News APIs      ──────►      ▼
                        Filter Agent  ◄── Topic Config (Firestore)
                            │
                            ▼
                        Summary Agent  ◄── Gemini Flash API
                            │
                            ▼
                        Email Agent   ◄── Gmail OAuth2
                            │
                            └──────────────────────► Gmail Inbox (07:00 UTC)

User Profile ──────► Firestore ──────► Frontend Dashboard
```

---

## Features

| Feature | Description |
|---|---|
| Four-agent pipeline | Scraper → Filter → Summary → Email agents run sequentially at 07:00 UTC with full error recovery |
| Gemini AI summarization | Every article distilled to 2–3 sentences, categorized as breaking / analysis / release / general |
| Relevance scoring | Filter Agent assigns 0–1 relevance scores per topic — off-signal content never reaches your inbox |
| Topic personalization | Choose from 8+ AI domains at signup or update anytime from your profile |
| Gmail-native delivery | Digests sent via Gmail API, rendering natively in your inbox — not plain text |
| Google OAuth sign-in | One-click authentication, no passwords |
| Bookmark system | Save articles from any digest and revisit them from your profile |
| Multilingual UI | Full translations in English, Hindi, Spanish, French, Chinese, Korean, and 8 more |
| 6 theme personalities | Neural, Indigo Intelligence, Emerald Analyst, Crimson Real-Time, Amber Insight, Golden Executive |
| AI signal dashboard | Live analytics across all 8 domains — confidence scores, source distribution, signal volume |
| Digest frequency control | Switch between Daily / Weekly / None with immediate effect |
| Privacy-first design | Zero inbox access, zero password storage, short-lived OAuth2 tokens only |

---

## Tech stack

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

## Project structure

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
│   │   └── Pipeline3D.tsx
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

## Key components and types

| Module | Type | Description |
|---|---|---|
| `NewsItem[]` | Data type | Raw articles from Scraper Agent |
| `FilteredNewsItem[]` | Data type | Relevance-scored, deduplicated articles |
| `DigestSection[]` | Data type | Summarized, categorized content |
| `DigestPayload` | Data type | Final assembled email payload |
| `Engine.tsx` | Component | GSAP-animated pipeline visualization |
| `NeuralCanvas.tsx` | Component | Three.js WebGL neural background |
| `AISignalDashboard.tsx` | Component | Live domain analytics dashboard |
| `FocusDomains.tsx` | Component | 8-domain signal intelligence grid |
| `Pipeline3D.tsx` | Component | 3D pipeline visualization |
| `gemini-service` | Service | Wraps Gemini Flash API calls |
| `gmail-service` | Service | Handles OAuth2 token refresh and delivery |
| `news-service` | Service | Aggregates RSS, blogs, and news APIs |
| `firebase.ts` | Library | Centralized Firestore and Auth access |
| `hash.ts` | Library | SHA-256 email hashing for privacy |

---

## Quick start

### Prerequisites

- Node.js 20+
- Firebase project with Firestore and Google Auth enabled
- Gemini API key — [Google AI Studio](https://aistudio.google.com)
- Gmail API credentials (OAuth2 Client ID, Secret, Refresh Token)
- Firebase Admin SDK service account key

### Local development

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

## Environment variables

### Frontend (`VITE_*` prefix — safe to expose to client)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase browser API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase web app ID |

### Backend (server-only — never expose to client)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Gemini AI API key |
| `GMAIL_CLIENT_ID` | Yes | Gmail OAuth2 client ID |
| `GMAIL_CLIENT_SECRET` | Yes | Gmail OAuth2 client secret |
| `GMAIL_REFRESH_TOKEN` | Yes | Gmail OAuth2 refresh token |
| `GMAIL_SENDER_ADDRESS` | Yes | Gmail address used to send digests |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Yes | Firebase Admin SDK service account (JSON string) |
| `CRON_SECRET` | Yes | Authenticates Cloud Scheduler requests |
| `PORT` | Yes | Express server port (default: `3001`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `ALLOWED_ORIGIN` | Production only | CORS allowed origin |

---

## Deployment

NeuralBrief uses a split deployment model: the frontend is served via Firebase Hosting CDN and the backend runs as a containerized service on Google Cloud Run.

### Frontend → Firebase Hosting

```bash
npm run build
npx firebase deploy --only hosting
```

### Backend → Google Cloud Run

```bash
cd server

# Build and push container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/neuralbrief-server

# Deploy to Cloud Run
gcloud run deploy neuralbrief-server \
  --image gcr.io/YOUR_PROJECT_ID/neuralbrief-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Cron job → Google Cloud Scheduler

```
Target URL:   POST https://YOUR_CLOUD_RUN_URL/api/cron/digest
Schedule:     0 7 * * *   (07:00 UTC daily)
Header:       X-Cron-Secret: <CRON_SECRET>
```

---

## Roadmap

- Daily live feed — Upgrade API tier and implement aggressive caching for real-time daily ingestion (currently weekly due to rate limits)
- User feedback loops — In-digest feedback mechanism to continuously tune per-user relevance scoring
- PWA support — Offline access and push notifications
- Analytics export — Download signal data as CSV from the AI Signal Dashboard
- Custom source addition — Allow users to submit their own RSS feeds and blogs

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
