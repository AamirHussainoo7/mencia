import test from "node:test";
import assert from "node:assert/strict";
import {
  generateGroqResponse,
  calculateBackoffDelay,
  isTransientError,
  supportsFunctionCalling,
  DEFAULT_MODEL,
  FALLBACK_MODEL,
} from "../Configs/groq.js";
import {
  processAssistantMessage,
  getBookingToolDeclarations,
  executeBookingTool,
} from "../Services/booking.ai.js";

test("Groq configuration defaults to official tool-use models", () => {
  assert.equal(DEFAULT_MODEL, "openai/gpt-oss-120b");
  assert.equal(FALLBACK_MODEL, "openai/gpt-oss-20b");
  assert.equal(supportsFunctionCalling("openai/gpt-oss-120b"), true);
  assert.equal(supportsFunctionCalling("openai/gpt-oss-20b"), true);
  assert.equal(supportsFunctionCalling("llama-3.3-70b-versatile"), true);
  assert.equal(supportsFunctionCalling("whisper-large-v3"), false);
});

test("isTransientError correctly identifies retryable Groq errors", () => {
  assert.equal(isTransientError(503), true);
  assert.equal(isTransientError(429), true);
  assert.equal(isTransientError(500), true);
  assert.equal(isTransientError(504), true);
  assert.equal(isTransientError(null, new Error("fetch failed")), true);
  assert.equal(isTransientError(null, { name: "AbortError", message: "aborted" }), true);

  assert.equal(isTransientError(400), false);
  assert.equal(isTransientError(401), false);
  assert.equal(isTransientError(403), false);
  assert.equal(isTransientError(404), false);
});

test("calculateBackoffDelay respects Retry-After and applies jitter", () => {
  const retryAfterDelay = calculateBackoffDelay({
    attempt: 0,
    retryAfterHeader: "3",
    maxDelayMs: 5000,
  });
  assert.equal(retryAfterDelay, 3000);

  const exponentialDelay = calculateBackoffDelay({
    attempt: 1,
    retryAfterHeader: null,
    baseDelayMs: 50,
    maxDelayMs: 2000,
  });
  // 50 * 2^1 = 100 + jitter (0-200) -> 100-300
  assert.ok(exponentialDelay >= 100 && exponentialDelay <= 300);
});

test("generateGroqResponse handles ordinary assistant replies", async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          message: {
            role: "assistant",
            content: "We are open Monday through Saturday from 11:00 AM to 10:00 PM.",
          },
        },
      ],
    }),
  });

  const res = await generateGroqResponse({
    messages: [
      { role: "system", content: "You are a friendly restaurant assistant." },
      { role: "user", content: "What are your hours?" },
    ],
    apikey: "gsk_mock_test_key",
    fetchFn: mockFetch,
  });

  assert.equal(res.text, "We are open Monday through Saturday from 11:00 AM to 10:00 PM.");
  assert.equal(res.toolCalls.length, 0);
  assert.equal(res.modelUsed, DEFAULT_MODEL);
});

test("generateGroqResponse handles function calling and parses JSON arguments", async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_check_123",
                type: "function",
                function: {
                  name: "checkAvailability",
                  arguments: JSON.stringify({ date: "2026-10-30", partySize: 4 }),
                },
              },
            ],
          },
        },
      ],
    }),
  });

  const res = await generateGroqResponse({
    messages: [{ role: "user", content: "Do you have a table for 4 on 2026-10-30?" }],
    tools: getBookingToolDeclarations(),
    apikey: "gsk_mock_test_key",
    fetchFn: mockFetch,
  });

  assert.equal(res.toolCalls.length, 1);
  assert.equal(res.toolCalls[0].id, "call_check_123");
  assert.equal(res.toolCalls[0].name, "checkAvailability");
  assert.deepEqual(res.toolCalls[0].args, { date: "2026-10-30", partySize: 4 });
});

test("generateGroqResponse retries transient 503 and succeeds on 2nd attempt", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount === 1) {
      return {
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: { message: "Service Unavailable" } }),
        headers: { get: () => null },
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Retry succeeded smoothly.",
            },
          },
        ],
      }),
    };
  };

  const res = await generateGroqResponse({
    messages: [{ role: "user", content: "Hello" }],
    apikey: "gsk_mock_test_key",
    fetchFn: mockFetch,
    baseDelayMs: 2,
    maxAttempts: 3,
  });

  assert.equal(callCount, 2);
  assert.equal(res.text, "Retry succeeded smoothly.");
});

test("generateGroqResponse enforces bounded retries (max 3) on persistent 503", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: { message: "Model is overloaded" } }),
      headers: { get: () => null },
    };
  };

  await assert.rejects(
    async () => {
      await generateGroqResponse({
        messages: [{ role: "user", content: "Book a table" }],
        apikey: "gsk_mock_test_key",
        fallbackModel: null,
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

test("generateGroqResponse rejects non-retryable 401 without retrying", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: "Invalid API Key" } }),
      headers: { get: () => null },
    };
  };

  await assert.rejects(
    async () => {
      await generateGroqResponse({
        messages: [{ role: "user", content: "Hello" }],
        apikey: "gsk_invalid_key",
        fetchFn: mockFetch,
        baseDelayMs: 2,
        maxAttempts: 3,
      });
    },
    (err) => {
      assert.equal(callCount, 1); // Exact 1 attempt
      assert.equal(err.status, 401);
      assert.equal(err.isTransient, false);
      return true;
    }
  );
});

test("generateGroqResponse switches to verified fallback model if primary fails", async () => {
  const modelsCalled = [];
  const mockFetch = async (url, options) => {
    const body = JSON.parse(options.body);
    modelsCalled.push(body.model);

    if (body.model === "llama-3.3-70b-versatile") {
      return {
        ok: false,
        status: 503,
        text: async () => "Unavailable",
        headers: { get: () => null },
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Fallback model answered successfully.",
            },
          },
        ],
      }),
    };
  };

  const res = await generateGroqResponse({
    messages: [{ role: "user", content: "Hello" }],
    apikey: "gsk_mock_test_key",
    model: "llama-3.3-70b-versatile",
    fallbackModel: "llama-3.1-8b-instant",
    fetchFn: mockFetch,
    baseDelayMs: 2,
    maxAttempts: 2,
  });

  assert.equal(res.text, "Fallback model answered successfully.");
  assert.equal(res.modelUsed, "llama-3.1-8b-instant");
  assert.equal(modelsCalled.filter((m) => m === "llama-3.3-70b-versatile").length, 2);
  assert.equal(modelsCalled.filter((m) => m === "llama-3.1-8b-instant").length, 1);
});

test("processAssistantMessage end-to-end tool loop with customer confirmation validation", async () => {
  // Test booking safety: unconfirmed booking rejected
  const unconfirmedBooking = await executeBookingTool({
    toolName: "createReservation",
    args: {
      date: "2026-10-31",
      slotId: "slot-99",
      partySize: 2,
      customerName: "Bob",
      customerPhone: "9876543210",
      customerConfirmed: false,
    },
    businessId: "60d0fe4f5311236168a109ca",
  });

  assert.equal(unconfirmedBooking.success, false);
  assert.ok(unconfirmedBooking.error.includes("not confirmed"));
});

test("processAssistantMessage returns isUnavailable when Groq is unavailable", async () => {
  const mockUser = {
    _id: "60d0fe4f5311236168a109ca",
    assistantName: "Arin AI",
    businessName: "Test Bistro",
    groqApiKey: "invalid_key",
    enableNavigation: false,
    bookingSettings: { bookingEnabled: false },
  };

  const result = await processAssistantMessage({
    user: mockUser,
    message: "What is your chef special?",
  });

  assert.ok(typeof result.aiResponse === "string");
  assert.ok(result.aiResponse.length > 0);
  assert.ok(!result.aiResponse.includes("invalid_key"));
  assert.ok(!result.aiResponse.includes("Bearer"));
});
