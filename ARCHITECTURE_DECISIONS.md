# Architecture Decisions Record (ADR) — Mencia Booking System

## ADR 001: Concurrency and Slot-Capacity Allocation Strategy
- **Status**: ACCEPTED
- **Context**: MongoDB deployments vary from standalone instances in development to Atlas replica sets in production. Multi-document transactions (`session.withTransaction`) fail on standalone MongoDB deployments. We need an infallible mechanism to prevent overbooking when multiple customers concurrently request the last table.
- **Decision**: Use a dedicated `SlotCapacity` collection storing records per `(businessId, date, slotId)`.
  - Claims will be executed via atomic conditional updates:
    ```js
    findOneAndUpdate(
      {
        businessId,
        date,
        slotId,
        $expr: { $lte: [{ $add: ["$bookedCapacity", partySizeInCapacityUnits] }, "$maxCapacity"] }
      },
      {
        $inc: { bookedCapacity: partySizeInCapacityUnits },
        $setOnInsert: { maxCapacity: slotConfig.capacity }
      },
      { upsert: true, new: true }
    )
    ```
  - If the condition is not met or write throws a duplicate key error on upsert race, the slot is full.
  - If subsequent booking persistence fails, compensation logic atomically decrements the allocated capacity (`$inc: { bookedCapacity: -units }`).
  - On cancellation, capacity is decremented once with status check to prevent double-release.
- **Consequences**: Guarantees zero overbooking under race conditions on any MongoDB deployment without requiring replica-set transactions.

## ADR 002: Cancellation Security Model
- **Status**: ACCEPTED
- **Context**: Guessing a sequential or short booking ID must never allow unauthorized cancellation.
- **Decision**:
  - When a booking is created, generate a cryptographically secure random bearer token (32 bytes hex, `crypto.randomBytes(32).toString('hex')`).
  - Store only its SHA-256 hash in the database (`cancellationHash`).
  - Return the raw token once to the customer upon successful booking creation.
  - Public cancellation (`POST /api/booking/cancel`) requires `{ bookingReference, cancellationToken }`.
  - Server hashes the provided token and matches it against `cancellationHash`.
  - Authenticated business owners can cancel their own business's bookings without the token via owner endpoints (`PATCH /api/business/bookings/:id/status`).

## ADR 003: Timezone and Local Date Authority
- **Status**: ACCEPTED
- **Context**: The server may run in UTC or any local server timezone, but reservations belong to the restaurant's operational timezone (e.g. `Asia/Kolkata`, `America/New_York`).
- **Decision**:
  - All booking dates are stored as normalized strings in `YYYY-MM-DD` relative to the business's configured timezone.
  - Time comparison (advance booking window, minimum notice, past dates) converts current UTC timestamp to the business timezone before evaluating slot opening/closing.

## ADR 004: Two-Phase Conversational AI Tool Orchestration
- **Status**: ACCEPTED
- **Context**: An LLM cannot be trusted to allocate database records directly or hallucinate availability.
- **Decision**:
  - Gemini tools: `checkAvailability`, `createBooking`, `cancelBooking`, `getBooking`.
  - Booking creation requires a distinct 2-phase sequence:
    1. Information gathering & availability verification.
    2. Explicit confirmation: Assistant summarizes exact booking details (Date, Time, Party Size, Name, Phone) and asks the user to confirm.
    3. Tool execution only triggers when customer gives affirmative confirmation.
    4. If the customer alters any detail (date, party size), confirmation state resets.
  - Backend performs full re-validation during `createBooking` execution.
