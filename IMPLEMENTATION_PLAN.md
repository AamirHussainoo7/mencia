# Implementation Plan — Mencia AI Booking System

## Overview
This document details the phased plan for extending Mencia with conversational restaurant and cafe reservations. Each task must be implemented incrementally, verified with tests, and tracked in `IMPLEMENTATION_PROGRESS.md`.

---

## Phase 0: Repository Audit and Baseline
- [x] **Task 0.1**: Inspect repository structure, package manifests, and current Git status.
- [x] **Task 0.2**: Audit models (User, Billing), controllers (assistant, user, auth), and middleware.
- [x] **Task 0.3**: Audit public embed widget (`Client/public/assistant.js` and `assistant.css`).
- [x] **Task 0.4**: Run baseline builds and lints (Client `vite build`, `eslint`).
- [x] **Task 0.5**: Verify documented bugs against actual source code.
- [x] **Task 0.6**: Initialize root persistent project memory files (`PROJECT.md`, `IMPLEMENTATION_PLAN.md`, etc.).

---

## Phase 1: Data Model and Booking Domain Logic
- [x] **Task 1.1: Extend User Model**:
  - Add `bookingSettings`: `bookingEnabled`, `location`, `timezone`, `workingDays`, `slots`, `maxPartySize`, `advanceDaysLimit`, `minNoticeMinutes`, `cancellationPolicy`.
  - Non-overlapping slots, positive capacities, valid time ranges. Backward compatible.
- [x] **Task 1.2: Create Booking Model**:
  - `businessId`, `bookingReference`, `customerName`, `customerPhone`, `bookingDate`, `slotId`, `startTime`, `endTime`, `partySize`, `allocatedCapacity`, `status`, `cancellationHash`, timestamps, indexes.
- [x] **Task 1.3: Implement Atomic Slot-Capacity Tracking**:
  - `SlotCapacity` collection storing records per `(businessId, date, slotId)`.
  - Atomic conditional claims via `findOneAndUpdate` prevent race conditions on any MongoDB deployment.
- [x] **Task 1.4: Booking Service Layer (`Server/Services/booking.service.js`)**:
  - Configuration validation, availability calculation, table allocation, atomic claims, booking persistence, and authorized cancellation.
- [x] **Task 1.5: Scheduling & Timezone Rules**:
  - Enforced business timezone consistency.
  - Rejection of past dates, closed days, slots outside notice/advance limits, and oversized parties.
  - Automated tests passing (8/8).

---

## Phase 2: Secure Booking API
- [x] **Task 2.1: Public Customer Endpoints**:
  - `GET /api/booking/availability`: Query slots for businessId, date, partySize.
  - `POST /api/booking/create`: Idempotent booking creation with confirmation check and cancellation token generation.
  - `POST /api/booking/cancel`: Idempotent customer cancellation with bearer token check.
- [x] **Task 2.2: Authenticated Owner Endpoints**:
  - `GET /api/business/bookings`: List bookings with pagination and filters.
  - `PATCH /api/business/bookings/:id/status`: Complete, cancel, or mark no-show (releases capacity on cancel).
  - `PATCH /api/user/booking-settings`: Update and validate booking settings.
- [x] **Task 2.3: Security, Validation & Rate Limiting**:
  - Zero-dependency in-memory sliding window rate limiter on `/api/booking` and `/api/assistant`.
  - Strict owner tenant verification (`req.userId === booking.businessId`).

---

## Phase 3: Gemini Tool Orchestration
- [x] **Task 3.1: Model & Client Modernization**:
  - Updated model to `process.env.GEMINI_MODEL || "gemini-2.0-flash"`.
  - Implemented structured tool declarations (`checkAvailability`, `createReservation`, `cancelReservation`).
- [x] **Task 3.2: Tool Execution Handlers (`Server/Services/booking.ai.js`)**:
  - Securely binds Gemini function calls to `booking.service.js`. Zero direct DB access from prompt.
- [x] **Task 3.3: Two-Phase Conversational Confirmation Flow**:
  - Collects details -> presents summary -> requires explicit customer confirmation -> creates booking.
- [x] **Task 3.4: Guardrails & Context Preservation**:
  - Retains FAQ, business tone, and keyword navigation alongside booking tools.

---

## Phase 4: Builder Configuration UI
- [x] **Task 4.1: Booking Settings Form in Builder (`Client/src/pages/Builder.jsx`)**:
  - Enable/disable toggle, location, timezone, working days, rules, and slots manager.
- [x] **Task 4.2: Client Validation & State Management**:
  - Saves to `PATCH /api/user/booking-settings` without resetting Gemini status or other assistant fields.

---

## Phase 5: Embeddable Public Widget
- [x] **Task 5.1: Capability-Aware Widget (`Client/public/assistant.js`)**:
  - Dynamically discovers booking capability from config.
  - Quick action chips ("Book Table", "Check Times", "Cancel Booking").
- [x] **Task 5.2: Conversational Booking & Confirmation UI**:
  - Text input bar + speech recognition, structured reservation cards (available slots, confirmation badge with reference and token).
- [x] **Task 5.3: Production Embed Readiness**:
  - Dynamic origin detection (no hardcoded localhost). Scoped CSS in `assistant.css`.

---

## Phase 6: Owner Dashboard
- [x] **Task 6.1: Bookings Management Page (`Client/src/pages/Bookings.jsx`)**:
  - Real-time reservation list with date & status filters.
  - Summary metrics: Total, Today, Confirmed, Completed, Cancelled.
  - Owner status actions: Complete, Cancel, No-Show.
- [x] **Task 6.2: Navigation Integration**:
  - Integrated into Navbar and App routing.

---

## Phase 7: Verified Existing Issues & Fixes
- [x] **Task 7.1**: Environment URLs in `App.jsx`, `constants.js`, `Server/index.js`, and `assistant.js`.
- [x] **Task 7.2**: Fixed `user.plan = "free"` assignment bug in `assistant.controller.js`.
- [x] **Task 7.3**: Fixed `geminiStatus = "active"` unconditional reset in `user.controller.js`.
- [x] **Task 7.4**: Fixed all ESLint errors (0 errors, 0 warnings).

---

## Phase 8: Automated Testing Suite
- [x] **Task 8.1**: Domain unit tests (`booking.domain.test.js` - 8 tests).
- [x] **Task 8.2**: API security tests (`api.security.test.js` - 3 tests).
- [x] **Task 8.3**: AI tools tests (`ai.tools.test.js` - 3 tests).
- [x] **Task 8.4**: Concurrency capacity tests (`concurrency.capacity.test.js` - 2 tests).
- [x] Total: 16 passing unit/integration tests (`npm test`).

---

## Phase 9: End-to-End Verification
- [x] Backend tests: 16 passed, 0 failed.
- [x] Client linter: 0 errors, 0 warnings.
- [x] Client production build: Success (`vite build` in 653ms).

---

## Phase 10: Documentation & Handoff
- [x] Updated `PROJECT.md`, `IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_PROGRESS.md`, `ARCHITECTURE_DECISIONS.md`, `TESTING.md`, and `KNOWN_ISSUES.md`.
