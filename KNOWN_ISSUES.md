# Known Issues & Bug Tracker — Mencia

## Verified & Resolved Issues

### BUG-001: Pro Plan Expiry Logic No-Op Assignment
- **Location**: `Server/Controllers/assistant.controller.js:45`
- **Issue**: `user.plan === "free"` was an equality comparison rather than an assignment.
- **Status**: FIXED in Phase 3 (`user.plan = "free"`).

### BUG-002: Hardcoded Localhost URLs
- **Location**:
  - `Client/src/App.jsx`
  - `Client/src/utils/constants.js`
  - `Server/index.js`
  - `Client/public/assistant.js`
- **Issue**: Localhost was hardcoded, breaking deployments.
- **Status**: FIXED in Phase 5 & 7. Now uses `import.meta.env` in client and `process.env.CLIENT_URL` in server, with dynamic script origin detection in `assistant.js`.

### BUG-003: Gemini Model URL Points to Non-Existent Version
- **Location**: `Server/Configs/gemini.js`
- **Issue**: Configured with nonexistent `gemini-3.5-flash` or deprecated `gemini-2.0-flash`.
- **Status**: FIXED. Configured to `process.env.GEMINI_MODEL || "gemini-3.8-flash"` with `x-goog-api-key` header authentication.

### BUG-004: Unconditional `geminiStatus = "active"` Reset
- **Location**: `Server/Controllers/user.controller.js:45`
- **Issue**: Saving assistant configuration unconditionally reset `geminiStatus` to `"active"` even if the key was invalid or unchanged.
- **Status**: FIXED in Phase 7. Only resets status if a new non-empty key is submitted that differs from the existing key.

### BUG-005: Missing Rate Limiting on Public Widget API
- **Location**: `Server/Routes/assistant.route.js` & `Server/Routes/booking.route.js`
- **Issue**: No IP-based or per-origin rate limiting on public endpoints.
- **Status**: FIXED in Phase 2. Zero-dependency `createRateLimiter` added to both public routes.

### BUG-006: React 19 Unused `'React'` Import & Fast Refresh Lint Errors
- **Location**: `Client/src/**/*.jsx`
- **Issue**: 18 errors and 2 warnings in ESLint across client files.
- **Status**: FIXED in Phase 7. Cleaned up unused React imports, created `utils/constants.js` to satisfy react-refresh, and properly handled useEffect dependencies. `npm run lint` now passes with 0 errors and 0 warnings.
