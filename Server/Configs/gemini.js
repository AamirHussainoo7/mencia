import dotenv from "dotenv";
dotenv.config();

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
export const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || null;

/**
 * Sanitizes any potential sensitive tokens or keys from log messages.
 */
export const sanitizeLog = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/key=[a-zA-Z0-9_\-]+/gi, "key=[REDACTED]")
    .replace(/(?:x-goog-api-key:\s*)[^\s,]+/gi, "x-goog-api-key: [REDACTED]")
    .replace(/(?:Bearer\s+)[a-zA-Z0-9_\-]+/gi, "Bearer [REDACTED]");
};

// Models known to support structured function declarations & system instructions
const FUNCTION_CALLING_MODELS = new Set([
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-lite",
]);

/**
 * Checks whether a given model identifier supports function calling.
 */
export const supportsFunctionCalling = (modelName) => {
  if (!modelName || typeof modelName !== "string") return false;
  const cleanName = modelName.replace(/^models\//, "").trim().toLowerCase();
  return (
    FUNCTION_CALLING_MODELS.has(cleanName) ||
    cleanName.includes("flash") ||
    cleanName.includes("pro")
  );
};

/**
 * Builds Gemini generateContent API URL.
 */
export const getGeminiUrl = (model = DEFAULT_MODEL) => {
  const cleanModel = model.replace(/^models\//, "");
  return `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
};

/**
 * Determines whether an HTTP status or error is transient and eligible for retry.
 */
export const isTransientError = (status, error) => {
  if (status) {
    // 503 Service Unavailable, 429 Too Many Requests, 500 Internal, 504 Gateway Timeout
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
 * Calculates exponential backoff with jitter, respecting Retry-After header.
 */
export const calculateBackoffDelay = ({
  attempt,
  retryAfterHeader = null,
  baseDelayMs = 500,
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
 * Core internal HTTP caller for Gemini with per-request timeout.
 */
const executeGeminiCall = async ({
  targetUrl,
  payload,
  apikey,
  fetchFn = fetch,
  requestTimeoutMs = 12000,
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
        "x-goog-api-key": apikey,
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
 * Executes a Gemini request with bounded retries, exponential backoff with jitter,
 * optional fallback model switching, and sanitized error reporting.
 */
export const generateGeminiResponse = async ({
  prompt,
  contents = null,
  systemInstruction = null,
  tools = null,
  generationConfig = null,
  apikey,
  user = null,
  model = DEFAULT_MODEL,
  fallbackModel = FALLBACK_MODEL,
  maxAttempts = 3,
  baseDelayMs = 500,
  requestTimeoutMs = 12000,
  fetchFn = fetch,
}) => {
  if (!apikey) {
    throw new Error("Gemini API key missing");
  }

  const payload = {};

  if (contents && Array.isArray(contents)) {
    payload.contents = contents;
  } else {
    payload.contents = [
      {
        role: "user",
        parts: [{ text: prompt || "" }],
      },
    ];
  }

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (tools && Array.isArray(tools)) {
    payload.tools = tools;
  }

  if (generationConfig) {
    payload.generationConfig = generationConfig;
  }

  // Model cascade: primary model first, followed by fallback model if configured
  const modelsToTry = [model];
  if (fallbackModel && fallbackModel !== model) {
    if (tools && !supportsFunctionCalling(fallbackModel)) {
      console.warn(
        `[Gemini] Fallback model "${fallbackModel}" does not verify support for function calling tools. Skipping fallback.`
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
        `[Gemini] Primary model "${model}" unavailable (${lastStatus || lastError?.message}). Switching to configured fallback model: "${currentModel}".`
      );
    }

    const targetUrl = getGeminiUrl(currentModel);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await executeGeminiCall({
          targetUrl,
          payload,
          apikey,
          fetchFn,
          requestTimeoutMs,
        });

        if (response.ok) {
          // Success: reset user status to active if user document provided
          if (user && user.geminiStatus !== "active") {
            user.geminiStatus = "active";
            if (typeof user.save === "function") {
              await user.save();
            }
          }

          const data = await response.json();
          const candidate = data.candidates?.[0];
          const parts = candidate?.content?.parts || [];

          let textResponse = "";
          const functionCalls = [];

          for (const part of parts) {
            if (part.text) {
              textResponse += part.text;
            }
            if (part.functionCall) {
              functionCalls.push(part.functionCall);
            }
          }

          return {
            text: textResponse.trim(),
            functionCalls,
            raw: data,
            modelUsed: currentModel,
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
              user.geminiStatus = "invalid";
              if (typeof user.save === "function") {
                await user.save();
              }
            }
          }
          const nonRetryableError = new Error(`Gemini API Error (${response.status}): ${errText}`);
          nonRetryableError.status = response.status;
          nonRetryableError.isTransient = false;
          throw nonRetryableError;
        }

        // Transient status (503, 429, 500, 504)
        if (response.status === 429 && user) {
          user.geminiStatus = "quota_exceeded";
          if (typeof user.save === "function") {
            await user.save();
          }
        }

        lastError = new Error(`Gemini API Error (${response.status}): ${errText}`);
        lastError.status = response.status;
        lastError.isTransient = true;

        // If attempts remain on this model, wait and retry
        if (attempt < maxAttempts - 1) {
          const delay = calculateBackoffDelay({
            attempt,
            retryAfterHeader,
            baseDelayMs,
          });
          console.warn(
            `[Gemini] Transient ${response.status} on ${currentModel}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxAttempts})...`
          );
          await sleep(delay);
          continue;
        }
      } catch (callError) {
        // If it's a non-retryable error, rethrow immediately
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
            `[Gemini] Network/transient error on ${currentModel}: ${sanitizeLog(callError.message)}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxAttempts})...`
          );
          await sleep(delay);
          continue;
        }
      }
    }
  }

  // All attempts across all configured models failed
  console.error(
    `[Gemini] All attempts failed for models [${modelsToTry.join(", ")}]. Last error:`,
    sanitizeLog(lastError?.message)
  );

  const finalError = new Error(
    "Our AI assistant is temporarily experiencing high demand. Please try again in a few moments."
  );
  finalError.status = lastStatus || 503;
  finalError.isTransient = true;
  finalError.originalMessage = lastError?.message;
  finalError.userFriendlyMessage =
    "Our AI assistant is currently experiencing unusually high demand. Please try again in a moment, or contact the restaurant directly.";

  throw finalError;
};