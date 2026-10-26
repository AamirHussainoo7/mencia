import { generateGroqResponse } from "../Configs/groq.js";
import { generateGeminiResponse } from "../Configs/gemini.js";
import {
  getAvailableSlots,
  createBooking,
  cancelBookingByCustomer,
  getNowInTimezone,
} from "./booking.service.js";

/**
 * Returns Groq (OpenAI-compatible) function declarations for conversational booking.
 */
export const getBookingToolDeclarations = () => {
  return [
    {
      type: "function",
      function: {
        name: "checkAvailability",
        description: "Check table reservation availability for a given date (YYYY-MM-DD) and party size.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "The reservation date in YYYY-MM-DD format.",
            },
            partySize: {
              type: "number",
              description: "Number of guests (default 2).",
            },
          },
          required: ["date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "createReservation",
        description:
          "Create a confirmed reservation when the customer agrees to book and provides their name and phone number.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Reservation date in YYYY-MM-DD format.",
            },
            slotId: {
              type: "string",
              description:
                "The slot identifier (e.g. slot_123) OR the time range string (e.g. '20:00 - 21:00' or '20:00').",
            },
            partySize: {
              type: "number",
              description: "Number of guests (default 2).",
            },
            customerName: {
              type: "string",
              description: "Full name of the customer.",
            },
            customerPhone: {
              type: "string",
              description: "Customer contact phone number.",
            },
            customerConfirmed: {
              type: "boolean",
              description: "Must be true — customer agreed to the booking.",
            },
          },
          required: [
            "date",
            "slotId",
            "partySize",
            "customerName",
            "customerPhone",
            "customerConfirmed",
          ],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cancelReservation",
        description: "Cancel an existing reservation using booking reference and cancellation bearer token.",
        parameters: {
          type: "object",
          properties: {
            bookingReference: {
              type: "string",
              description: "The booking reference code (e.g. BK-XXXXXX).",
            },
            cancellationToken: {
              type: "string",
              description: "The cancellation token provided when the booking was made.",
            },
          },
          required: ["bookingReference", "cancellationToken"],
        },
      },
    },
  ];
};

/**
 * Executes a tool called by Gemini.
 */
export const executeBookingTool = async ({ toolName, args, businessId }) => {
  try {
    if (toolName === "checkAvailability") {
      const date = args.date;
      const partySize = Number(args.partySize) || 2;
      const avail = await getAvailableSlots({
        businessId,
        date,
        partySize,
      });

      const openSlots = (avail.slots || [])
        .filter((s) => s.isAvailable)
        .map((s) => ({
          slotId: s.slotId,
          time: `${s.startTime} - ${s.endTime}`,
          tablesAvailable: s.availableTables,
        }));

      return {
        success: true,
        date,
        partySize,
        availableSlotsCount: openSlots.length,
        openSlots,
        message:
          openSlots.length > 0
            ? `Found ${openSlots.length} available slots.`
            : avail.message || "No slots available for this date/party size.",
      };
    }

    if (toolName === "createReservation") {
      if (!args.customerConfirmed) {
        return {
          success: false,
          error: "Reservation was not confirmed by the customer.",
        };
      }

      // Deterministic idempotency key prevents duplicate reservations if retried
      const phoneDigits = String(args.customerPhone || "").replace(/\D/g, "");
      const idempotencyKey = `ai_${businessId}_${args.date}_${args.slotId}_${phoneDigits}`;

      const result = await createBooking({
        businessId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        date: args.date,
        slotId: args.slotId,
        partySize: args.partySize,
        idempotencyKey,
      });

      return {
        success: true,
        bookingReference: result.booking.bookingReference,
        cancellationToken: result.cancellationToken,
        date: result.booking.bookingDate,
        time: `${result.booking.startTime} - ${result.booking.endTime}`,
        partySize: result.booking.partySize,
        customerName: result.booking.customerName,
      };
    }

    if (toolName === "cancelReservation") {
      const result = await cancelBookingByCustomer({
        bookingReference: args.bookingReference,
        cancellationToken: args.cancellationToken,
      });

      return {
        success: true,
        bookingReference: result.booking.bookingReference,
        alreadyCancelled: result.alreadyCancelled,
        status: "cancelled",
      };
    }

    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to execute booking action.",
    };
  }
};

/**
 * Processes an assistant message with full context, booking tools, and 2-phase confirmation.
 */
export const processAssistantMessage = async ({ user, message, currentPath, history = [] }) => {
  const cleanMessage = (message || "").toLowerCase().trim();

  // 1. Navigation intent check
  if (user.enableNavigation && Array.isArray(user.pages)) {
    const navigationWords = ["open", "go", "start", "show", "navigate", "take me"];
    const wantsNavigation = navigationWords.some((w) => cleanMessage.startsWith(w));

    if (wantsNavigation) {
      const matchedPage = user.pages.find((page) =>
        (page.keywords || []).some((kw) => cleanMessage.includes(kw.toLowerCase()))
      );

      if (matchedPage) {
        if (currentPath === matchedPage.path) {
          return {
            aiResponse: `${matchedPage.name} is already open.`,
          };
        }
        return {
          action: "navigate",
          path: matchedPage.path,
          aiResponse: `Opening ${matchedPage.name}`,
        };
      }
    }
  }

  // 2. Prepare system prompt and tools
  const bookingEnabled = Boolean(user.bookingSettings?.bookingEnabled);
  const nowInfo = getNowInTimezone(user.bookingSettings?.timezone || "Asia/Kolkata");

  let systemInstruction = `
You are ${user.assistantName}, the AI assistant for "${user.businessName}".
Business Type: ${user.businessType || "Restaurant / Cafe"}
Description: ${user.businessDescription || "A welcoming establishment."}
Assistant Tone: ${user.tone || "friendly"}
Current Date & Time at Restaurant: ${nowInfo.dateStr} (${nowInfo.dayOfWeek}), ${nowInfo.timeStr} (Timezone: ${user.bookingSettings?.timezone || "Asia/Kolkata"}).

General Rules:
- Talk naturally, concisely, and stay in character.
- Keep standard FAQ and conversational answers brief and informative.
- Never make up facts about the business.
`;

  let tools = null;

  if (bookingEnabled) {
    systemInstruction += `
RESERVATION & BOOKING RULES:
1. Online table reservations are ACTIVE.
2. Checking Availability:
   - When a guest asks generally about tables, available times, or open slots without specifying their booking details, call 'checkAvailability' for their requested date (format YYYY-MM-DD, default today: ${nowInfo.dateStr}).
   - When presenting open slots, list the times and ask:
     "Which time works best for you? To complete your reservation, please also provide your Name, Phone Number, and Party Size."
3. Collecting Booking Details (CRITICAL):
   - If the guest says "Yes book it", "Confirm", "Book a table", selects a slot, or expresses intent to book, but you DO NOT yet have their Customer Name or Customer Phone:
     DO NOT call 'checkAvailability' again.
     Instead, directly ask:
     "I'd be happy to reserve that for you! To finalize your booking, please tell me:
     1. Your Name
     2. Your Phone Number
     3. Party size (if different from 2)"
4. Finalizing Reservation:
   - When the customer has expressed intent to book (e.g. "Yes book it" or chosen a slot) and provides their Name and Phone, you MUST call 'createReservation' immediately.
   - For 'slotId', you can pass the slot ID or the slot time (e.g. '20:00 - 21:00' or '20:00').
   - For 'partySize', use the specified size (default 2).
   - Set 'customerConfirmed: true'.
   - NEVER call 'checkAvailability' when you already know the slot and the customer is providing their name/phone to finalize the booking.
5. Confirmation & Cancellation:
   - When 'createReservation' succeeds, congratulate the customer, provide their booking reference (e.g. BK-XXXXXX), date, time, and remind them to keep their cancellation token safe.
   - To cancel, ask for their booking reference and secret cancellation token, then call 'cancelReservation'.
`;
    tools = getBookingToolDeclarations();
  } else {
    systemInstruction += `
NOTE: Online table reservations are currently NOT enabled for this business. If asked about booking, politely inform the customer that online reservations are not currently active and advise contacting the restaurant directly.
`;
  }

  // Format conversational messages for OpenAI / Groq standard
  const messages = [
    {
      role: "system",
      content: systemInstruction.trim(),
    },
  ];

  if (Array.isArray(history)) {
    // Only take prior history turns (avoiding duplicate of current message if client pre-appended it)
    const priorHistory = history.filter((h) => !(h.role === "user" && h.text === message));
    for (const h of priorHistory.slice(-8)) {
      if (h.role && h.text) {
        messages.push({
          role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
          content: h.text,
        });
      }
    }
  }

  messages.push({
    role: "user",
    content: message,
  });

  // Resolve API key: user-configured Groq key -> Server environment GROQ_API_KEY -> migration key
  const groqKey =
    user.groqApiKey ||
    process.env.GROQ_API_KEY ||
    (user.geminiApiKey?.startsWith("gsk_") ? user.geminiApiKey : null);

  // If no Groq key but user still has legacy Gemini key, route to Gemini as migration fallback
  if (!groqKey && user.geminiApiKey) {
    console.warn("[AI Provider] Using legacy Gemini fallback for user until Groq key is configured.");
    const geminiContents = [];
    for (const m of messages) {
      if (m.role === "user") {
        geminiContents.push({ role: "user", parts: [{ text: m.content }] });
      } else if (m.role === "assistant") {
        geminiContents.push({ role: "model", parts: [{ text: m.content }] });
      }
    }

    try {
      const geminiResult = await generateGeminiResponse({
        contents: geminiContents,
        systemInstruction,
        apikey: user.geminiApiKey,
        user,
      });
      return {
        aiResponse: geminiResult.text || "I'm here to help. How can I assist you today?",
      };
    } catch (err) {
      return {
        aiResponse:
          err.userFriendlyMessage ||
          "Our AI assistant is temporarily experiencing high demand. Please try again in a few moments, or contact us directly.",
        isUnavailable: true,
        errorStatus: err.status || 503,
      };
    }
  }

  // Primary Provider: Groq
  let firstTurn;
  try {
    firstTurn = await generateGroqResponse({
      messages,
      tools,
      apikey: groqKey,
      user,
    });
  } catch (err) {
    return {
      aiResponse:
        err.userFriendlyMessage ||
        "Our AI assistant is temporarily experiencing high demand. Please try again in a few moments, or contact us directly.",
      isUnavailable: true,
      errorStatus: err.status || 503,
    };
  }

  // If no tool was called, return the response text
  if (!firstTurn.toolCalls || firstTurn.toolCalls.length === 0) {
    return {
      aiResponse: firstTurn.text || "I'm here to help. How can I assist you today?",
    };
  }

  // Execute the requested tool
  const call = firstTurn.toolCalls[0];
  const toolResult = await executeBookingTool({
    toolName: call.name,
    args: call.args || {},
    businessId: user._id,
  });

  // Feed tool result back to Groq for natural conversational formulation
  const secondMessages = [
    ...messages,
    {
      role: "assistant",
      content: firstTurn.text || null,
      tool_calls: [
        {
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments: JSON.stringify(call.args || {}),
          },
        },
      ],
    },
    {
      role: "tool",
      tool_call_id: call.id,
      name: call.name,
      content: JSON.stringify(toolResult),
    },
  ];

  try {
    const secondTurn = await generateGroqResponse({
      messages: secondMessages,
      tools: null, // Force model to generate natural conversational text instead of chaining another tool
      apikey: groqKey,
      user,
    });

    let finalAiText = (secondTurn.text || "").trim();

    // If model returned empty text, generate clear context-specific reply
    if (!finalAiText) {
      if (call.name === "createReservation" && toolResult.success) {
        finalAiText = `🎉 Your table reservation has been confirmed! Booking reference: **${toolResult.bookingReference}** for ${toolResult.customerName} on ${toolResult.date} at ${toolResult.time}. Please save your secret cancellation token: \`${toolResult.cancellationToken}\`.`;
      } else if (call.name === "checkAvailability" && toolResult.success) {
        if (toolResult.openSlots && toolResult.openSlots.length > 0) {
          const slotList = toolResult.openSlots.map((s) => `• ${s.time} (${s.tablesAvailable} tables left)`).join("\n");
          finalAiText = `Here are the available reservation times for ${toolResult.date}:\n${slotList}\n\nTo reserve a table, please let me know which time you prefer, along with your name and phone number.`;
        } else {
          finalAiText = `I'm sorry, but there are no available slots for ${toolResult.date}. Please choose another date or contact the restaurant directly.`;
        }
      } else if (call.name === "cancelReservation" && toolResult.success) {
        finalAiText = `Your reservation **${toolResult.bookingReference}** has been successfully cancelled.`;
      } else {
        finalAiText = toolResult.error || "Unable to complete reservation action at this time.";
      }
    }

    return {
      aiResponse: finalAiText,
      toolResult,
    };
  } catch (secondErr) {
    // Graceful fallback if second turn fails
    if (toolResult.success) {
      if (call.name === "createReservation") {
        return {
          aiResponse: `🎉 Your table reservation has been confirmed! Booking reference: **${toolResult.bookingReference}** for ${toolResult.customerName} on ${toolResult.date} at ${toolResult.time}. Please keep your cancellation token: \`${toolResult.cancellationToken}\``,
          toolResult,
        };
      }
      if (call.name === "checkAvailability" && toolResult.openSlots?.length > 0) {
        return {
          aiResponse: `Available slots for ${toolResult.date}:\n${toolResult.openSlots.map((s) => `• ${s.time}`).join("\n")}\n\nPlease share your Name and Phone Number to complete your booking.`,
          toolResult,
        };
      }
      return {
        aiResponse: toolResult.message || "Operation succeeded.",
        toolResult,
      };
    }
    return {
      aiResponse:
        toolResult.error ||
        secondErr.userFriendlyMessage ||
        "Unable to complete reservation action at this time. Please contact the restaurant directly.",
      toolResult,
      isUnavailable: true,
    };
  }
};
