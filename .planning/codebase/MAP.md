# Codebase Map — Mencia (Mencia)

> Generated: 2026-10-26
> Method: /gsd-onboard static analysis

---

## Project Overview

**Mencia** is a SaaS platform that lets any website owner embed a configurable, voice-enabled AI assistant (powered by Google Gemini) into their site with a single `<script>` tag. Users authenticate via Google/Firebase, configure their assistant in a dashboard, and receive an embed snippet. The assistant handles natural language queries and keyword-based page navigation.

---

## Repository Structure

```
d:\DEV\Mencia\
├── Client/          # React + Vite + TailwindCSS v4 frontend
└── Server/          # Express 5 + MongoDB (Mongoose) backend
```

---

## Client

### Stack
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router DOM v7 |
| Styling | TailwindCSS v4 (via @tailwindcss/vite) |
| Auth | Firebase 12 (Google OAuth) |
| HTTP | Axios |
| Notifications | React Hot Toast |
| Icons | React Icons v5 |
| Payments (UI) | Razorpay checkout (frontend trigger) |

### Pages

| Route | File | Description |
|---|---|---|
| / | pages/Home.jsx | Landing/marketing page with hero, steps section, footer |
| /login | pages/Login.jsx | Google OAuth sign-in flow |
| /builder | pages/Builder.jsx | Assistant configuration UI |
| /billing | pages/Billing.jsx | Pro plan upgrade (Razorpay integration) |

### Auth Flow
1. User clicks "Continue with Google" → Firebase signInWithPopup
2. Firebase token sent to POST /api/auth/google with { name, email }
3. Server issues JWT cookie (httpOnly, 7-day)
4. App.jsx calls GET /api/user/current-user on mount to hydrate state

---

## Server

### Stack
| Layer | Technology |
|---|---|
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (jsonwebtoken) + HTTP-only cookies |
| AI | Google Gemini REST API (direct fetch) |
| Payments | Razorpay Node SDK |

### Route Map

| Prefix | Controller |
|---|---|
| /api/auth | auth.controller.js |
| /api/user | user.controller.js |
| /api/assistant | assistant.controller.js (PUBLIC CORS) |
| /api/billing | billing.controller.js |

### Data Model — User
name, email, assistantName, businessName, businessType, businessDescription, tone (friendly/professional/sales), theme (light/dark/glass/neon), enableVoice, pages[], enableNavigation, geminiApiKey, geminiStatus (active/quota_exceeded/invalid), totalMessages, plan (free/pro), requestLimit (200), proExpiresAt, isSetupComplete

---

## Key Architectural Decisions

1. BYOK (Bring Your Own Key) — Users supply their own Gemini API key
2. Public Assistant API — /api/assistant/* uses cors({ origin: "*" }) for embedded scripts
3. Server-side plan enforcement — Free-tier limits and Pro expiry checked server-side
4. Navigation is keyword-based — Simple startsWith + includes matching, no NLP
5. Firebase for auth handshake only — Server issues its own JWT after verifying Firebase identity

---

## Known Issues / Observations

- gemini.js: model name is gemini-3.5-flash — verify this is a valid ID (typically gemini-1.5-flash or gemini-2.0-flash)
- assistant.controller.js line 45: user.plan === "free" is a comparison, NOT assignment — BUG: pro expiry does not downgrade the plan
- No rate limiting on the public /api/assistant endpoint beyond per-user quota
- CLIENT_URL is hardcoded to localhost:5173 in App.jsx — embed code will point to localhost in production
- No input validation middleware (express-validator etc.) — controllers do manual checks only

