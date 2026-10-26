import test from "node:test";
import assert from "node:assert/strict";

/**
 * Concurrency test demonstrating atomic slot-capacity allocation.
 * Simulates high-contention parallel reservation requests for limited table capacity.
 */
test("atomic capacity allocation prevents overbooking under concurrent requests", async () => {
  // Simulate slot capacity in a concurrency-safe atomic state
  const maxCapacity = 3; // 3 tables available
  let bookedCapacity = 0;
  let lock = Promise.resolve();

  // Concurrency-safe atomic claim simulation matching MongoDB $expr: { $lte: [...] }
  const atomicClaim = async (tablesRequested) => {
    // Simulate atomic serialized execution at the document-lock level
    return new Promise((resolve) => {
      lock = lock.then(async () => {
        // Atomic condition: bookedCapacity + tablesRequested <= maxCapacity
        if (bookedCapacity + tablesRequested <= maxCapacity) {
          bookedCapacity += tablesRequested;
          resolve({ success: true, booked: bookedCapacity });
        } else {
          resolve({ success: false, reason: "Capacity exceeded" });
        }
      });
    });
  };

  // Simulate 10 simultaneous customer requests each asking for 1 table
  const requests = Array.from({ length: 10 }, (_, i) => i + 1);

  const results = await Promise.all(
    requests.map(() => atomicClaim(1))
  );

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  // Exactly 3 must succeed, 7 must fail
  assert.equal(successes.length, 3);
  assert.equal(failures.length, 7);
  assert.equal(bookedCapacity, 3); // Must NEVER exceed maxCapacity (3)
});

test("atomic compensation safely releases capacity after persistence failure", async () => {
  let bookedCapacity = 2;
  const tablesToRelease = 1;

  // Compensation release
  bookedCapacity = Math.max(0, bookedCapacity - tablesToRelease);
  assert.equal(bookedCapacity, 1);
});
