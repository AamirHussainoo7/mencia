# Testing Strategy — Mencia AI Booking System

## 1. Test Architecture
We utilize Node.js's built-in, zero-dependency test runner (`node:test` and `node:assert/strict`), which is native to Node v22.17.0. This allows automated unit, domain, and concurrency tests to run instantly without third-party test dependencies or fragile setup.

## 2. Test Suites
- **Domain & Scheduling Suite** (`Server/Tests/booking.domain.test.js`):
  - Slot non-overlap validation.
  - Working days, past dates, expired slot rejections.
  - Advance booking limit & minimum notice enforcement.
  - Max party size and capacity boundaries.
- **Concurrency & Capacity Suite** (`Server/Tests/concurrency.test.js`):
  - Simulating parallel requests competing for the last available table.
  - Verifying atomic claims, zero overbooking, and compensation on failure.
- **Security & Authorization Suite** (`Server/Tests/security.test.js`):
  - Unauthorized owner access attempts.
  - Cross-business booking manipulation prevention.
  - Token hashing and invalid cancellation credential rejection.
  - Rate limiting behavior.
- **Frontend & Linter Checks**:
  - `cd Client && npm run lint`
  - `cd Client && npm run build`

## 3. Running Tests
```bash
# Run backend test suite
cd Server && node --test Tests/**/*.test.js

# Run frontend build & verification
cd Client && npm run build
```
