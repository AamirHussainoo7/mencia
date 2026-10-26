import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhoneNumber,
  isValidTime,
  timeToMinutes,
  validateBookingSettings,
  calendarDaysDifference,
  generateCancellationCredentials,
  verifyCancellationCredentials,
  calculateRequiredTables,
  generateBookingReference,
} from "../Services/booking.service.js";

test("normalizePhoneNumber cleans and validates phone numbers", () => {
  assert.equal(normalizePhoneNumber("+91 98765-43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("(555) 123-4567"), "5551234567");
  assert.equal(normalizePhoneNumber("9876543210"), "9876543210");

  assert.throws(() => normalizePhoneNumber(""), /required/);
  assert.throws(() => normalizePhoneNumber("123"), /Invalid phone number format/);
  assert.throws(() => normalizePhoneNumber("abc-def-ghij"), /Invalid phone number format/);
  assert.throws(() => normalizePhoneNumber("12345678901234567890"), /Invalid phone number format/);
});

test("isValidTime validates 24-hour time strings", () => {
  assert.equal(isValidTime("00:00"), true);
  assert.equal(isValidTime("14:30"), true);
  assert.equal(isValidTime("23:59"), true);

  assert.equal(isValidTime("24:00"), false);
  assert.equal(isValidTime("12:60"), false);
  assert.equal(isValidTime("2:30"), false);
  assert.equal(isValidTime("random"), false);
});

test("timeToMinutes converts HH:mm to minutes", () => {
  assert.equal(timeToMinutes("00:00"), 0);
  assert.equal(timeToMinutes("01:30"), 90);
  assert.equal(timeToMinutes("14:00"), 840);
  assert.equal(timeToMinutes("23:59"), 1439);
});

test("calculateRequiredTables allocates appropriate table count", () => {
  assert.equal(calculateRequiredTables(1, 4), 1);
  assert.equal(calculateRequiredTables(4, 4), 1);
  assert.equal(calculateRequiredTables(5, 4), 2);
  assert.equal(calculateRequiredTables(8, 4), 2);
  assert.equal(calculateRequiredTables(9, 4), 3);
  assert.equal(calculateRequiredTables(2, 2), 1);
  assert.equal(calculateRequiredTables(3, 2), 2);
});

test("calendarDaysDifference computes exact calendar day delta", () => {
  assert.equal(calendarDaysDifference("2026-10-26", "2026-10-26"), 0);
  assert.equal(calendarDaysDifference("2026-10-26", "2026-10-27"), 1);
  assert.equal(calendarDaysDifference("2026-10-26", "2026-10-25"), -1);
  assert.equal(calendarDaysDifference("2026-10-26", "2026-11-05"), 10);
});

test("validateBookingSettings checks valid and invalid configurations", () => {
  const validSettings = {
    bookingEnabled: true,
    timezone: "Asia/Kolkata",
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    maxPartySize: 8,
    advanceDaysLimit: 14,
    minNoticeMinutes: 120,
    slots: [
      { startTime: "12:00", endTime: "13:30", capacity: 4 },
      { startTime: "13:30", endTime: "15:00", capacity: 4 },
      { startTime: "18:00", endTime: "20:00", capacity: 6 },
    ],
  };

  const validResult = validateBookingSettings(validSettings);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);

  // Overlapping slots test
  const overlappingSettings = {
    slots: [
      { startTime: "12:00", endTime: "14:00", capacity: 4 },
      { startTime: "13:30", endTime: "15:00", capacity: 4 }, // overlaps with 12:00-14:00
    ],
  };
  const overlapResult = validateBookingSettings(overlappingSettings);
  assert.equal(overlapResult.valid, false);
  assert.ok(overlapResult.errors.some((e) => e.includes("overlap")));

  // Start after end time test
  const invertedSettings = {
    slots: [{ startTime: "15:00", endTime: "14:00", capacity: 4 }],
  };
  const invertedResult = validateBookingSettings(invertedSettings);
  assert.equal(invertedResult.valid, false);
  assert.ok(invertedResult.errors.some((e) => e.includes("strictly earlier")));

  // Negative capacity test
  const badCapacity = {
    slots: [{ startTime: "12:00", endTime: "13:00", capacity: 0 }],
  };
  const badCapResult = validateBookingSettings(badCapacity);
  assert.equal(badCapResult.valid, false);
  assert.ok(badCapResult.errors.some((e) => e.includes("positive number")));
});

test("cancellation credentials generate and verify correctly", () => {
  const { rawToken, hash } = generateCancellationCredentials();
  assert.equal(typeof rawToken, "string");
  assert.equal(rawToken.length, 64); // 32 bytes hex = 64 chars
  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 64); // sha256 = 64 chars

  // Valid token verifies
  assert.equal(verifyCancellationCredentials(rawToken, hash), true);

  // Tampered token fails
  const tamperedToken = rawToken.slice(0, -1) + (rawToken.slice(-1) === "a" ? "b" : "a");
  assert.equal(verifyCancellationCredentials(tamperedToken, hash), false);
  assert.equal(verifyCancellationCredentials("", hash), false);
  assert.equal(verifyCancellationCredentials(null, hash), false);
});

test("generateBookingReference returns unique formatted reference", () => {
  const ref1 = generateBookingReference();
  const ref2 = generateBookingReference();
  assert.match(ref1, /^BK-[A-Z0-9]{8}$/);
  assert.match(ref2, /^BK-[A-Z0-9]{8}$/);
  assert.notEqual(ref1, ref2);
});
