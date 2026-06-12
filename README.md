# ⚡ NeuralBrief

### Your personalized daily briefing on AI, tech, and competitors — delivered to your Gmail every morning.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?style=flat-square&logo=d3dotjs)](https://d3js.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## What is NeuralBrief?

NeuralBrief is a premium AI-powered intelligence platform built for founders, engineers, and analysts who
need to stay current without spending hours reading the news. Every night, a four-agent pipeline powered
by Gemini AI scrapes hundreds of trusted tech sources, filters the noise, generates crisp two-to-three
sentence summaries, and delivers a beautifully formatted digest to your Gmail inbox by 7 AM. You choose
your topics once — AI, cybersecurity, SaaS, cloud, startups, competitors — and wake up to exactly the
signal you need, nothing more. Built in 2026 on a modern serverless stack, NeuralBrief is what Google
Alerts should have been.

---

## 📸 Screenshot

> [📸 Screenshot — coming soon]

---

## ✨ Features

- **Four-agent AI pipeline** — Scraper, Filter, Summary, and Email agents orchestrated by Antigravity 2.0
  run sequentially every night at 07:00 UTC with full observability and error recovery.
- **Gemini Flash summarization** — Every article is distilled to two-to-three sentences using Gemini AI,
  categorized as breaking news, analysis, product release, or general coverage.
- **Relevance scoring** — The Filter Agent assigns each article a 0–1 relevance score against your
  selected topics, so off-topic content never reaches your inbox.
- **Topic personalization** — Choose from dozens of topics at signup or update them anytime in your
  profile: AI, Cybersecurity, SaaS, Cloud, Startups, Competitor Tracking, and more.
- **Gmail-native delivery** — Digests are sent via the Gmail API from a dedicated sender address,
  rendering correctly in Gmail's full interface, not as plain-text blobs.
- **Google Auth sign-in** — One-click sign-in via Google OAuth2 — no passwords, no friction.
- **Bookmark & revisit** — Save articles from your digest directly in the app and access them anytime
  from your profile's Bookmarks tab.
- **Multilingual UI** — Full interface translations in English, Hindi (Devanagari), Spanish, French,
  Simplified Chinese, and Korean.
- **Digest frequency control** — Switch between Daily, Weekly, or None at any time from your profile
  preferences with immediate effect the following day.
- **Secure and privacy-first** — We never read your inbox, never store your Gmail password, and use
  short-lived OAuth2 tokens for all Gmail operations.

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 18 | UI component model and rendering |
| Language | TypeScript 5 (strict) | Type-safe frontend and backend code |
| Styling | Tailwind CSS v4 | Utility-first responsive styling |
| Animations | Framer Motion (`motion/react`) | UI transitions and micro-interactions |
| Data Visualization | D3.js | Agent pipeline and stats visualizations |
| Authentication | Firebase Auth (Google) | One-click Google sign-in / session management |
| Database | Firestore | User preferences, bookmarks, digest configs |
| Backend | Express.js + TypeScript on Node.js 20 | REST API and cron endpoint |
| AI Engine | Gemini Flash (`@google/genai`) | Article filtering and summarization |
| Agent Orchestration | Antigravity 2.0 | Multi-agent pipeline coordination |
| Email Delivery | Gmail API (OAuth2) | Sending personalized digests to users |
| Frontend Hosting | Firebase Hosting | CDN-backed static hosting |
| Backend Hosting | Google Cloud Run | Serverless containerized Express server |
| Cron Scheduling | Google Cloud Scheduler | Triggers the agent pipeline at 07:00 UTC |

---

## 🤖 Agent Pipeline

Every morning at 07:00 UTC, Cloud Scheduler fires a POST to the backend's `/api/cron/digest` endpoint.
The request is authenticated via a shared `CRON_SECRET` header. Four agents then run in sequence:

```
🕷️  Scraper Agent
        │  Crawls RSS feeds, tech blogs, and news APIs.
        │  Outputs: NewsItem[]
        ▼
🧹  Filter Agent
        │  Scores articles for relevance (0–1) against user topics.
        │  Removes duplicates. Outputs: FilteredNewsItem[]
        ▼
✍️  Summary Agent
        │  Calls Gemini Flash to generate 2–3 sentence summaries.
        │  Categorizes each item. Outputs: DigestSection[]
        ▼
📧  Email Agent
        │  Assembles DigestPayload, renders the email template.
        └─ Sends via Gmail API to each subscribed user's inbox.
```

**Scraper Agent** — Crawls a curated list of RSS feeds, tech news APIs, and company engineering blogs.
For each user, it fetches articles relevant to their selected topics, extracting titles, URLs, snippets,
sources, and publish timestamps into a typed `NewsItem[]` array.

**Filter Agent** — Passes each `NewsItem` through Gemini AI with a relevance-scoring prompt keyed to
the user's topic list. Articles scoring below a threshold are discarded. Remaining items are
deduplicated by URL and semantic similarity, producing a `FilteredNewsItem[]` with a `relevanceScore`.

**Summary Agent** — Sends each filtered article to Gemini Flash with a strict summarization prompt:
produce exactly two to three sentences, no filler, no editorializing. Each item is also assigned a
category (`breaking`, `analysis`, `release`, or `general`) and returned as a `SummarizedItem`.

**Email Agent** — Groups items by topic into `DigestSection[]`, wraps everything in a `DigestPayload`,
renders the HTML email template, and calls the Gmail API to deliver it. Handles per-user retries and
logs all delivery metadata for monitoring.

---

## 📋 Prerequisites

Before you can run NeuralBrief locally, you will need:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **A Firebase project** — with Firestore and Authentication (Google provider) enabled
  → [Firebase Console](https://console.firebase.google.com)
- **A Gemini API key** — from [Google AI Studio](https://aistudio.google.com)
- **Gmail API credentials** (OAuth2 Client ID + Secret + Refresh Token) — from
  [Google Cloud Console](https://console.cloud.google.com) with the Gmail API enabled and the
  `https://www.googleapis.com/auth/gmail.send` scope granted
- **Firebase Admin SDK service account key** — from Firebase Console → Project Settings → Service Accounts

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/neuralbrief.git
cd neuralbrief

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env
# Open .env and fill in all required values (see Environment Variables below)

# 5. Start the development server
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

## 🔐 Environment Variables

All variables are documented in [`.env.example`](.env.example). Here is a quick reference:

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase browser API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase web app ID |
| `GEMINI_API_KEY` | ✅ | Gemini AI API key (server only) |
| `GMAIL_CLIENT_ID` | ✅ | Gmail OAuth2 client ID (server only) |
| `GMAIL_CLIENT_SECRET` | ✅ | Gmail OAuth2 client secret (server only) |
| `GMAIL_REFRESH_TOKEN` | ✅ | Gmail OAuth2 refresh token (server only) |
| `GMAIL_SENDER_ADDRESS` | ✅ | Gmail address that sends digests |
| `PORT` | ✅ | Express server port (default: 3001) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `CRON_SECRET` | ✅ | Secret to authenticate Cloud Scheduler calls |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID (Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Service account email (Admin SDK) |
| `FIREBASE_PRIVATE_KEY` | ✅ | Service account private key (Admin SDK) |
| `CLOUD_RUN_URL` | Production | Your Cloud Run service URL |

---

## 📁 Folder Structure

```
neuralbrief/
├── public/
│   └── locales/            # i18n translation files (en, hi, es, fr, zh, ko)
├── src/
│   ├── components/
│   │   ├── profile/
│   │   │   ├── BookmarksTab.tsx
│   │   │   ├── PreferencesTab.tsx
│   │   │   └── TopicsTab.tsx
│   │   ├── BackToTop.tsx
│   │   ├── BookmarkButton.tsx
│   │   ├── CTA.tsx
│   │   ├── CustomCursor.tsx
│   │   ├── DevDashboard.tsx
│   │   ├── Engine.tsx
│   │   ├── FAQ.tsx
│   │   ├── FocusDomains.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── MagneticButton.tsx
│   │   ├── Navbar.tsx
│   │   ├── NeuralCanvas.tsx
│   │   ├── Preview.tsx
│   │   ├── ProfileModal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ReadingTime.tsx
│   │   └── TiltCard.tsx
│   ├── contexts/
│   │   ├── AudioContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── BookmarkContext.tsx
│   │   └── LanguageContext.tsx
│   ├── lib/
│   │   ├── firebase.ts       # All Firebase access — never import Firebase directly
│   │   └── hash.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/
│   ├── src/
│   │   ├── agents/           # Scraper, Filter, Summary, Email agents
│   │   ├── routes/           # Express route handlers
│   │   ├── services/         # Business logic (news, digest, gmail)
│   │   └── utils/            # logger.ts and shared utilities
│   ├── types/
│   │   └── index.ts          # Shared TypeScript interfaces
│   └── tsconfig.json
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── firebase.json
├── firestore.rules
├── package.json
├── tsconfig.json
├── vite.config.ts
├── CONTRIBUTING.md
└── README.md
```

---

## 🚢 Deployment

NeuralBrief uses a split deployment: the React frontend goes to Firebase Hosting and the Express
backend goes to Google Cloud Run. Cloud Scheduler triggers the digest pipeline daily.

### Frontend (Firebase Hosting)

```bash
npm run build
npx firebase deploy --only hosting
```

### Backend (Google Cloud Run)

```bash
# Build and push the container image
cd server
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/neuralbrief-server

# Deploy to Cloud Run
gcloud run deploy neuralbrief-server \
  --image gcr.io/YOUR_PROJECT_ID/neuralbrief-server \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest,...
```

### Cloud Scheduler (Cron)

Create a Cloud Scheduler job targeting your Cloud Run URL:

```
Target URL:   https://YOUR_CLOUD_RUN_URL/api/cron
Method:       POST
Schedule:     0 7 * * *   (every day at 07:00 UTC)
Headers:      X-Cron-Secret: <your CRON_SECRET value>
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branch naming conventions, commit
message format, and the PR checklist.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).