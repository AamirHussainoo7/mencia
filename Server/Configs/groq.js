import dotenv from "dotenv";
dotenv.config();

export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b";

/**
 * Sanitizes sensitive credentials and API keys from logs and error strings.
 */
export const sanitizeLog = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/gsk_[a-zA-Z0-9_-]{20,}/gi, "gsk_[REDACTED]")
    .replace(/(?:Bearer\s+)[a-zA-Z0-9_.-]+/gi, "Bearer [REDACTED]")
    .replace(/key=[a-zA-Z0-9_-]+/gi, "key=[REDACTED]")
    .replace(/(?:x-goog-api-key:\s*)[^\s,]+/gi, "x-goog-api-key: [REDACTED]");
};

// Verified Groq models supporting tool use (OpenAI function calling standard)
const FUNCTION_CALLING_MODELS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
  "llama3-70b-8192",
  "llama3-8b-8192",
]);

/**
 * Checks whether a given Groq model identifier officially supports function calling / tool use.
 */
export const supportsFunctionCalling = (modelName) => {
  if (!modelName || typeof modelName !== "string") return false;
  const cleanName = modelName.trim().toLowerCase();
  return (
    FUNCTION_CALLING_MODELS.has(cleanName) ||
    cleanName.includes("gpt-oss") ||
    cleanName.includes("qwen") ||
    cleanName.includes("llama-3.3") ||
    cleanName.includes("llama-3.1") ||
    cleanName.includes("versatile")
  );
};

/**
 * Determines whether an HTTP status or network error is transient and eligible for retry.
 */
export const isTransientError = (status, error) => {
  if (status) {
    // 503 Service Unavailable, 429 Rate Limit/Quota, 500 Internal, 504 Gateway Timeout
    if ([429, 500, 503, 504].includes(status)) {
      return true;
    }
    // 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found are NOT transient
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  if (error) {
    const msg = (error.message || "").toLowerCase();
    const name = error.name || "";
    if (
      name === "AbortError" ||
      name === "TimeoutError" ||
      msg.includes("timeout") ||
      msg.includes("fetch failed") ||
      msg.includes("network") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout")
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Calculates exponential backoff with random jitter, respecting Retry-After header.
 */
export const calculateBackoffDelay = ({
  attempt,
  retryAfterHeader = null,
  baseDelayMs = 400,
  maxDelayMs = 4000,
}) => {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, maxDelayMs);
    }
  }
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return Math.min(exponential + jitter, maxDelayMs);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Low-level HTTP executor with timeout cancellation.
 */
const executeGroqCall = async ({
  targetUrl = GROQ_API_URL,
  payload,
  apikey,
  fetchFn = fetch,
  requestTimeoutMs = 15000,
}) => {
  let signal = undefined;
  let timeoutId = undefined;

  if (typeof AbortController !== "undefined") {
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
  }

  try {
    const response = await fetchFn(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apikey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
    return response;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

/**
 * Executes a Groq OpenAI-compatible Chat Completion with bounded retries,
 * exponential backoff with jitter, model fallback cascade, and sanitized error reporting.
 */
export const generateGroqResponse = async ({
  messages,
  tools = null,
  tool_choice = "auto",
  temperature = 0.2,
  max_tokens = 1024,
  apikey = process.env.GROQ_API_KEY,
  user = null,
  model = DEFAULT_MODEL,
  fallbackModel = FALLBACK_MODEL,
  maxAttempts = 3,
  baseDelayMs = 400,
  requestTimeoutMs = 15000,
  fetchFn = fetch,
}) => {
  if (!apikey) {
    throw new Error("Groq API key missing. Please set GROQ_API_KEY in environment or configure assistant key.");
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Chat messages array cannot be empty.");
  }

  // Model cascade: primary model first, followed by verified fallback model if configured
  const modelsToTry = [model];
  if (fallbackModel && fallbackModel !== model) {
    if (tools && !supportsFunctionCalling(fallbackModel)) {
      console.warn(
        `[Groq] Fallback model "${fallbackModel}" does not verify support for function calling tools. Skipping fallback.`
      );
    } else {
      modelsToTry.push(fallbackModel);
    }
  }

  let lastError = null;
  let lastStatus = null;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];
    const isFallbackRun = mIdx > 0;

    if (isFallbackRun) {
      console.warn(
        `[Groq] Primary model "${model}" unavailable (${lastStatus || lastError?.message}). Switching to configured fallback model: "${currentModel}".`
      );
    }

    const payload = {
      model: currentModel,
      messages,
      temperature,
      max_tokens,
    };

    if (tools && Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = tool_choice;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await executeGroqCall({
          payload,
          apikey,
          fetchFn,
          requestTimeoutMs,
        });

        if (response.ok) {
          // Success: reset user status to active if user document provided
          if (user && user.groqStatus !== "active") {
            user.groqStatus = "active";
            if (typeof user.save === "function") {
              await user.save();
            }
          }

          const data = await response.json();
          const choice = data.choices?.[0];
          const message = choice?.message || {};

          const textResponse = message.content || "";
          const rawToolCalls = message.tool_calls || [];

          // Normalize tool calls to a standard structure
          const toolCalls = rawToolCalls.map((tc) => {
            let parsedArgs = {};
            if (typeof tc.function?.arguments === "string") {
              try {
                parsedArgs = JSON.parse(tc.function.arguments);
              } catch {
                parsedArgs = {};
              }
            } else if (typeof tc.function?.arguments === "object" && tc.function.arguments !== null) {
              parsedArgs = tc.function.arguments;
            }

            return {
              id: tc.id,
              type: tc.type || "function",
              name: tc.function?.name,
              args: parsedArgs,
              rawFunction: tc.function,
            };
          });

          return {
            text: textResponse.trim(),
            toolCalls,
            rawMessage: message,
            modelUsed: currentModel,
            raw: data,
          };
        }

        // Non-OK HTTP status
        lastStatus = response.status;
        const retryAfterHeader = response.headers?.get ? response.headers.get("retry-after") : null;
        const errText = await response.text();

        // Check if error is non-retryable 4xx
        if (!isTransientError(response.status, null)) {
          if (response.status === 400 || response.status === 401) {
            if (user) {
              user.groqStatus = "invalid";
              if (typeof user.save === "function") {
                await user.save();
              }
            }
          }
          const nonRetryableError = new Error(`Groq API Error (${response.status}): ${sanitizeLog(errText)}`);
          nonRetryableError.status = response.status;
          nonRetryableError.isTransient = false;
          throw nonRetryableError;
        }

        // Transient status (503, 429, 500, 504)
        if (response.status === 429 && user) {
          user.groqStatus = "quota_exceeded";
          if (typeof user.save === "function") {
            await user.save();
          }
        }

        lastError = new Error(`Groq API Error (${response.status}): ${sanitizeLog(errText)}`);
        lastError.status = response.status;
        lastError.isTransient = true;

        // If attempts remain on this model, wait with exponential backoff and retry
        if (attempt < maxAttempts - 1) {
          const delay = calculateBackoffDelay({
            attempt,
            retryAfterHeader,
            baseDelayMs,
          });
          console.warn(
            `[Groq] Transient ${response.status} on ${currentModel}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxAttempts})...`
          );
          await sleep(delay);
          continue;
        }
      } catch (callError) {
        // Non-retryable error aborts immediately
        if (callError.isTransient === false) {
          throw callError;
        }

        lastError = callError;
        lastStatus = callError.status || null;

        if (isTransientError(lastStatus, callError) && attempt < maxAttempts - 1) {
          const delay = calculateBackoffDelay({
            attempt,
            baseDelayMs,
          });
          console.warn(
            `[Groq] Network/transient error on ${currentModel}: ${sanitizeLog(callError.message)}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxAttempts})...`
          );
          await sleep(delay);
          continue;
        }
      }
    }
  }

  // All attempts across all configured models failed
  console.error(
    `[Groq] All attempts failed for models [${modelsToTry.join(", ")}]. Last error:`,
    sanitizeLog(lastError?.message)
  );

  const finalError = new Error(
    "Our AI assistant is temporarily experiencing high demand. Please try again in a few moments."
  );
  finalError.status = lastStatus || 503;
  finalError.isTransient = true;
  finalError.originalMessage = sanitizeLog(lastError?.message);
  finalError.userFriendlyMessage =
    "Our AI assistant is currently experiencing unusually high demand. Please try again in a moment, or contact us directly.";

  throw finalError;
};
