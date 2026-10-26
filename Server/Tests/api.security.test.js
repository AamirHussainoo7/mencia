import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../Middleware/rateLimiter.js";
import { isAuth } from "../Middleware/isAuth.js";

test("rateLimiter allows traffic within limits and enforces 429 when exceeded", () => {
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 3,
    message: "Rate limit exceeded",
  });

  const req = {
    headers: { "x-forwarded-for": "192.168.1.100" },
    socket: {},
  };

  let statusCode = 200;
  let responseData = null;
  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  let nextCalledCount = 0;
  const next = () => {
    nextCalledCount++;
  };

  // 1st, 2nd, 3rd requests pass
  limiter(req, res, next);
  limiter(req, res, next);
  limiter(req, res, next);
  assert.equal(nextCalledCount, 3);

  // 4th request must be blocked
  limiter(req, res, next);
  assert.equal(nextCalledCount, 3);
  assert.equal(statusCode, 429);
  assert.equal(responseData.success, false);
  assert.equal(responseData.message, "Rate limit exceeded");
});

test("isAuth middleware rejects requests without token cookie", async () => {
  const req = {
    cookies: {},
  };
  let statusCode = null;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseBody = data;
        },
      };
    },
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await isAuth(req, res, next);
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.ok(responseBody.message.includes("token"));
});

test("isAuth middleware rejects requests with forged token", async () => {
  const req = {
    cookies: { token: "forged.jwt.token" },
  };
  let statusCode = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: () => {},
      };
    },
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await isAuth(req, res, next);
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 500); // JsonWebTokenError caught by middleware
});
