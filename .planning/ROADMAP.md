# ROADMAP.md — Mencia

## Milestone 1 — Production-Ready MVP (Current)
Core platform is functional but needs bug fixes and hardening before real deployment.

### Phase 1.1 — Bug Fixes (Priority: Critical)
**Status**: Not started
- Fix Pro plan downgrade bug (assistant.controller.js line 45: === → =)
- Fix CLIENT_URL hardcoding (use env var for production embed code)
- Verify and fix Gemini model name (gemini-3.5-flash → confirm valid)

### Phase 1.2 — Security & Hardening
**Status**: Not started
- Add rate limiting on /api/assistant endpoint (express-rate-limit)
- Add input validation middleware (express-validator)
- Review JWT secret rotation policy
- Add helmet.js for HTTP security headers

### Phase 1.3 — Production Config
**Status**: Not started
- Environment-based CORS origins (not hardcoded localhost)
- Add MONGO_URI validation on startup
- Add health check endpoint (GET /health)

### Phase 1.4 — Embed Widget
**Status**: Unclear (assistant.js referenced in embed code but not found in Client/public/)
- Create/verify assistant.js embed widget script
- Support voice input (Web Speech API)
- Support theme switching in widget
- Support keyword-based navigation actions

## Milestone 2 — Growth Features
- Dashboard analytics page
- Multi-assistant support (one user, multiple assistants)
- Conversation history
- Custom branding on embed widget
- Webhook support (on assistant interaction)

