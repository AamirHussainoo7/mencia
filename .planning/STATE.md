# STATE.md — Mencia

## Current State
- **Milestone**: 1 — Production-Ready MVP
- **Active Phase**: None (onboarding complete, ready to plan first phase)
- **Last Action**: gsd-onboard — codebase mapped and planning initialized

## What's Built
- Full auth flow (Google → Firebase → JWT cookie)
- Assistant builder UI (name, business, tone, theme, Gemini key, pages)
- Embed code generation
- AI assistant public API (Gemini proxy with plan enforcement)
- Razorpay billing (create order + verify payment)
- Free / Pro plan distinction

## What's Missing / Broken
- CRITICAL BUG: Pro plan never downgrades after expiry (comparison vs assignment)
- CRITICAL: CLIENT_URL hardcoded to localhost in App.jsx (embed code broken in production)
- WARN: Gemini model name unverified (gemini-3.5-flash)
- MISSING: assistant.js embed widget (referenced but not found in Client/public/)
- MISSING: Rate limiting on public /api/assistant
- MISSING: Input validation middleware

## Next Recommended Action
Run /gsd-plan-phase targeting Phase 1.1 — Bug Fixes

