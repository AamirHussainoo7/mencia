# Onboarding Summary — Mencia (Mencia)

> Completed: 2026-10-26 via /gsd-onboard

---

## What Was Learned

### Project Identity
- **Name**: Mencia
- **Type**: SaaS — embeddable voice AI assistant builder
- **Stage**: Functional MVP; pre-production
- **Firebase Project**: shifraai

### Architecture
- Monorepo with Client (React/Vite) and Server (Express/MongoDB) in separate subdirs
- No root package.json — each side has its own deps
- Public assistant API (no auth) for embedded widget consumption
- BYOK model — users provide their own Gemini API key

### Critical Issues Found
1. **Pro downgrade bug** — ssistant.controller.js:45 uses === (comparison) instead of = (assignment). Pro users never get downgraded after plan expiry.
2. **Localhost embed code** — CLIENT_URL is hardcoded in App.jsx. Embed code generated in production will reference localhost:5173.
3. **Gemini model name** — gemini-3.5-flash may not be a valid model ID.
4. **Missing embed widget** — ssistant.js is referenced in embed code but the file is not present in Client/public/.

### Planning Artifacts Created
| File | Purpose |
|---|---|
| .planning/codebase/MAP.md | Full codebase map |
| .planning/PROJECT.md | Project metadata, stack, plans |
| .planning/REQUIREMENTS.md | Functional and non-functional requirements |
| .planning/ROADMAP.md | Milestone and phase breakdown |
| .planning/STATE.md | Current state and next action |

---

## Recommended Next Command

`
/gsd-plan-phase
`
Target: **Phase 1.1 — Bug Fixes** (critical issues before any production deployment)

