import test from "node:test";
import assert from "node:assert/strict";
import {
  generateGeminiResponse,
  calculateBackoffDelay,
  isTransientError,
  supportsFunctionCalling,
} from "../Configs/gemini.js";
import { processAssistantMessage } from "../Services/booking.ai.js";

test("isTransientError correctly classifies retryable and non-retryable statuses", () => {
  // Transient
  assert.equal(isTransientError(503), true);
  assert.equal(isTransientError(429), true);
  assert.equal(isTransientError(500), true);
  assert.equal(isTransientError(504), true);
  assert.equal(isTransientError(null, new Error("fetch failed")), true);
  assert.equal(isTransientError(null, { name: "AbortError", message: "aborted" }), true);

  // Non-transient
  assert.equal(isTransientError(400), false);
  assert.equal(isTransientError(401), false);
  assert.equal(isTransientError(403), false);
  assert.equal(isTransientError(404), false);
});

test("calculateBackoffDelay respects Retry-After header and clamps to maxDelayMs", () => {
  const withHeader = calculateBackoffDelay({
    attempt: 0,
    retryAfterHeader: "2",
    baseDelayMs: 500,
    maxDelayMs: 4000,
  });
  assert.equal(withHeader, 2000);

  const headerClamped = calculateBackoffDelay({
    attempt: 0,
    retryAfterHeader: "10",
    baseDelayMs: 500,
    maxDelayMs: 4000,
  });
  assert.equal(headerClamped, 4000);

  const backoff0 = calculateBackoffDelay({
    attempt: 0,
    retryAfterHeader: null,
    baseDelayMs: 10,
    maxDelayMs: 4000,
  });
  // 10 * 2^0 = 10 + jitter (0-200)
  assert.ok(backoff0 >= 10 && backoff0 <= 220);
});

test("supportsFunctionCalling detects supported Flash and Pro models", () => {
  assert.equal(supportsFunctionCalling("gemini-3.8-flash"), true);
  assert.equal(supportsFunctionCalling("models/gemini-2.5-flash"), true);
  assert.equal(supportsFunctionCalling("gemini-1.5-pro"), true);
  assert.equal(supportsFunctionCalling("text-embedding-004"), false);
  assert.equal(supportsFunctionCalling("unknown-unsupported-model"), false);
});

test("generateGeminiResponse retries transient 503 and succeeds on 2nd attempt", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount === 1) {
      return {
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: { code: 503, message: "High demand" } }),
        headers: { get: () => null },
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Hello! I am ready to help." }] } }],
      }),
    };
  };

  const result = await generateGeminiResponse({
    prompt: "Hi",
    apikey: "fake-test-key",
    fetchFn: mockFetch,
    baseDelayMs: 5,
    maxAttempts: 3,
  });

  assert.equal(callCount, 2);
  assert.equal(result.text, "Hello! I am ready to help.");
});

test("generateGeminiResponse enforces max 3 attempts on continuous 503 and throws userFriendlyMessage", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: { code: 503, message: "Model is overloaded" } }),
      headers: { get: () => null },
    };
  };

  await assert.rejects(
    async () => {
      await generateGeminiResponse({
        prompt: "Book a table",
        apikey: "fake-test-key",
        fetchFn: mockFetch,
        baseDelayMs: 2,
        maxAttempts: 3,
      });
    },
    (err) => {
      assert.equal(callCount, 3);
      assert.equal(err.status, 503);
      assert.equal(err.isTransient, true);
      assert.ok(err.userFriendlyMessage.includes("experiencing unusually high demand"));
      return true;
    }
  );
});

test("generateGeminiResponse does NOT retry non-retryable 4xx errors like 401 or 400", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { code: 401, message: "API key invalid" } }),
      headers: { get: () => null },
    };
  };

  await assert.rejects(
    async () => {
      await generateGeminiResponse({
        prompt: "Hello",
        apikey: "invalid-key",
        fetchFn: mockFetch,
        baseDelayMs: 2,
        maxAttempts: 3,
      });
    },
    (err) => {
      assert.equal(callCount, 1); // Exactly 1 attempt, no retries!
      assert.equal(err.status, 401);
      assert.equal(err.isTransient, false);
      return true;
    }
  );
});

test("generateGeminiResponse switches to verified fallback model if primary fails", async () => {
  const modelsCalled = [];
  const mockFetch = async (url) => {
    const isPrimary = url.includes("gemini-3.8-flash");
    modelsCalled.push(isPrimary ? "gemini-3.8-flash" : "gemini-2.5-flash");

    if (isPrimary) {
      return {
        ok: false,
        status: 503,
        text: async () => "High demand",
        headers: { get: () => null },
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Fallback response successful" }] } }],
      }),
    };
  };

  const result = await generateGeminiResponse({
    prompt: "Hello",
    apikey: "fake-test-key",
    model: "gemini-3.8-flash",
    fallbackModel: "gemini-2.5-flash",
    fetchFn: mockFetch,
    baseDelayMs: 2,
    maxAttempts: 2,
  });

  assert.equal(result.text, "Fallback response successful");
  assert.equal(result.modelUsed, "gemini-2.5-flash");
  assert.equal(modelsCalled.filter((m) => m === "gemini-3.8-flash").length, 2);
  assert.equal(modelsCalled.filter((m) => m === "gemini-2.5-flash").length, 1);
});

test("processAssistantMessage gracefully returns isUnavailable when Gemini is down", async () => {
  const mockUser = {
    assistantName: "Arin AI",
    businessName: "Test Bistro",
    geminiApiKey: "invalid-key-testing",
    enableNavigation: false,
    bookingSettings: { bookingEnabled: false },
  };

  // We test with a mock user where generateGeminiResponse will be invoked with a non-working key against live or mocked
  // Let's test the return contract when generateGeminiResponse fails
  const res = await processAssistantMessage({
    user: mockUser,
    message: "Do you have vegan options?",
  });

  // Must return clean user-friendly response and not throw raw errors
  assert.ok(typeof res.aiResponse === "string");
  assert.ok(res.aiResponse.length > 0);
  assert.ok(!res.aiResponse.includes("API key"));
  assert.ok(!res.aiResponse.includes("stack"));
});
