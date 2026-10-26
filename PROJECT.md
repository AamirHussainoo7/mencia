# Mencia — Product & Architecture Specification

## 1. Product Vision
Mencia is a SaaS platform enabling website owners (specifically restaurants and cafes in this release) to embed a lightweight, voice- and chat-enabled AI assistant onto their websites via a simple `<script>` tag.

The assistant provides:
- Website and business information, FAQs, and hours.
- Keyword-based on-site navigation.
- **Conversational restaurant and cafe reservations** backed by authoritative backend availability, atomic capacity allocation, and cryptographically secure cancellation tokens.
- Authenticated owner dashboard for schedule configuration, capacity management, and live booking tracking.

## 2. Architecture & Technology Stack

### Client (`/Client`)
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing**: React Router DOM v7
- **Authentication**: Firebase v12 (Client-side Google OAuth popup)
- **State & HTTP**: Axios (with credentials), React Hot Toast
- **Public Widget**: Vanilla JavaScript (`assistant.js`) + Scoped CSS (`assistant.css`) served statically from `Client/public/`

### Server (`/Server`)
- **Runtime**: Node.js (v22+, ES Modules)
- **Framework**: Express 5
- **Database & ODM**: MongoDB via Mongoose 9
- **Authentication**: JWT stored in HTTP-only cookies (`isAuth` middleware)
- **AI Integration**: Groq API (OpenAI-compatible Chat Completions with tool use, primary: `llama-3.3-70b-versatile`, fallback: `llama-3.1-8b-instant`) with backward-compatible Gemini migration fallback.
- **Monetization**: Razorpay Pro plan integration (temporarily paused with restoration roadmap in `.planning/FUTURE_ENHANCEMENTS.md`)

## 3. Repository Structure
```text
Mencia/
├── .planning/               # Historical context, architecture notes, restoration guides
├── Client/
│   ├── public/              # Static embed assets (assistant.js, assistant.css, icons)
│   ├── src/
│   │   ├── assets/          # Static logos and graphics
│   │   ├── Components/      # Navbar, ProtectedRoute, AssistantPreview
│   │   ├── pages/           # Home, Login, Builder, Billing, Dashboard
│   │   └── utils/           # Firebase configuration
│   ├── package.json
│   └── vite.config.js
├── Server/
│   ├── Configs/             # MongoDB, Groq, Gemini, Razorpay, Token helpers
│   ├── Controllers/         # Auth, User, Assistant, Billing, Booking
│   ├── Middleware/          # isAuth, rateLimiter, validator
│   ├── Models/              # User, Booking, SlotCapacity, Billing
│   ├── Routes/              # Auth, User, Assistant, Billing, Booking
│   ├── Services/            # Core booking & scheduling domain logic
│   ├── index.js             # Express application entry point
│   └── package.json
├── PROJECT.md               # This document
├── IMPLEMENTATION_PLAN.md   # Phased delivery roadmap and acceptance criteria
├── IMPLEMENTATION_PROGRESS.md # Execution log and verifiable status
├── ARCHITECTURE_DECISIONS.md # ADRs for booking model, concurrency, security
├── TESTING.md               # Testing strategy and execution instructions
└── KNOWN_ISSUES.md          # Active bug tracker and remediation log
```

## 4. Environment Variables Overview
*(Names only — no secret values)*

### Server (`Server/.env`)
- `PORT`: Server listening port (default: 8000)
- `MONGODB_URL`: MongoDB connection URI
- `JWT_SECRET`: Secret key for signing session tokens
- `GROQ_API_KEY`: Groq API key for high-reliability, low-latency LLM responses
- `GROQ_MODEL`: Primary Groq model (default: `llama-3.3-70b-versatile`)
- `GROQ_FALLBACK_MODEL`: Verified secondary model (default: `llama-3.1-8b-instant`)
- `CLIENT_URL`: Trusted frontend origins for CORS and embeds (comma-separated)
- `NODE_ENV`: Runtime environment (`development` | `production` | `test`)
- `RAZORPAY_KEY_ID`: Razorpay key ID (optional when payments paused)
- `RAZORPAY_KEY_SECRET`: Razorpay key secret (optional when payments paused)
- `GEMINI_MODEL`: Legacy Gemini fallback model (default: `gemini-3.8-flash`)

### Client (`Client/.env`)
- `VITE_SERVER_URL`: Backend API base URL
- `VITE_CLIENT_URL`: Frontend application URL
- `VITE_FIREBASE_API_KEY`: Firebase web API key for Google sign-in
- `VITE_RAZORPAY_KEY_ID`: Razorpay public key (optional when payments paused)

## 5. Security & Boundary Rules
1. **AI API Keys**: Groq and Gemini API keys are always stored strictly server-side and scrubbed by `sanitizeLog`. Never exposed to client, widget, or client-side responses.
2. **Authority**: AI never decides availability, pricing, or confirmation. Backend database is the single source of truth.
3. **Capacity Allocation**: Atomic operations prevent overbooking under high concurrency.
4. **Cancellation**: Secured via cryptographically random tokens (SHA-256 hashed at rest).
5. **Multi-Tenancy**: Every owner operation strictly validates `req.userId` against business ownership.
