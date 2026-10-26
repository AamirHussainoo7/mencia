# REQUIREMENTS.md — Mencia

## Functional Requirements

### Authentication
- [x] Google OAuth sign-in (Firebase client → server JWT)
- [x] Persistent session via httpOnly JWT cookie (7 days)
- [x] Logout clears cookie

### Assistant Builder
- [x] Set assistant name, business name, type, description
- [x] Choose tone: friendly / professional / sales
- [x] Choose theme: light / dark / glass / neon
- [x] Input Gemini API key (BYOK)
- [x] Add navigation pages (name, path, keywords)
- [x] Remove navigation pages
- [x] Save assistant config (POST /api/user/save-assistant)
- [x] Mark setup as complete (isSetupComplete flag)
- [x] Edit existing config after setup

### Embed
- [x] Generate embed code snippet after setup
- [x] Copy to clipboard

### AI Assistant (Public API)
- [x] Accept message + userId from embedded widget
- [x] Enforce free plan message limit (200)
- [x] Detect Pro plan expiry
- [x] Keyword-based navigation intent detection
- [x] Proxy message to Gemini API using user's key
- [x] Track geminiStatus (active / quota_exceeded / invalid)
- [x] Increment totalMessages for free plan users

### Billing
- [x] Create Razorpay order (₹699 for Pro)
- [x] Verify payment signature (HMAC SHA256)
- [x] Upgrade user to Pro (90-day expiry)

## Non-Functional Requirements
- [ ] Production-ready CORS and env configuration
- [ ] Rate limiting on public /api/assistant endpoint
- [ ] Input validation middleware
- [ ] Error monitoring / logging
- [ ] Deploy pipeline

## Open / Backlog
- [ ] Fix pro plan downgrade bug (assistant.controller.js line 45)
- [ ] Fix CLIENT_URL hardcoding for production embed code
- [ ] Confirm Gemini model name (gemini-3.5-flash validity)
- [ ] Add voice input/output to embed widget
- [ ] Dashboard analytics (total messages, gemini usage, plan status)
- [ ] Multi-language assistant support

