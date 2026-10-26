# PROJECT.md — Mencia

## Product Summary
Mencia is a no-code SaaS platform enabling website owners to embed a fully configurable, voice-enabled AI assistant powered by Google Gemini. Users sign up with Google, configure their assistant (name, tone, theme, business info, Gemini API key, navigation pages), and paste a single script tag onto their website.

## Tech Stack
- **Frontend**: React 19 + Vite 8 + TailwindCSS v4 + React Router v7 + Firebase 12
- **Backend**: Express 5 + Mongoose 9 + MongoDB + JWT (httpOnly cookies)
- **AI**: Google Gemini API (user-supplied BYOK)
- **Payments**: Razorpay (INR, ₹699/90-day Pro plan)

## Project Structure
`
Mencia/
├── Client/   (React Vite app)
└── Server/   (Express API)
`

## Plans
| Plan | Price | Message Limit | Duration |
|---|---|---|---|
| Free | ₹0 | 200 messages lifetime | - |
| Pro | ₹699 | Unlimited | 90 days |

## Core User Journeys
1. Sign up (Google OAuth) → Onboard assistant (Builder) → Copy embed code → Paste on website
2. Website visitor types/speaks → Assistant API (/api/assistant/ask) → Gemini response OR navigation command

## Environment Variables
### Client (.env)
- VITE_FIREBASE_API_KEY

### Server (.env)
- PORT
- MONGO_URI
- JWT_SECRET
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

## Known Bugs (pre-onboard)
- Pro plan downgrade bug in assistant.controller.js (line 45: comparison not assignment)
- Gemini model name may be incorrect (gemini-3.5-flash vs gemini-1.5-flash/2.0-flash)
- CLIENT_URL hardcoded to localhost — breaks production embed code generation

