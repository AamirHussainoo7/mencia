import test from "node:test";
import assert from "node:assert/strict";
import {
  getBookingToolDeclarations,
  executeBookingTool,
  processAssistantMessage,
} from "../Services/booking.ai.js";

test("getBookingToolDeclarations returns correct schema definitions for Groq / OpenAI", () => {
  const tools = getBookingToolDeclarations();
  assert.equal(tools.length, 3);
  assert.equal(tools[0].type, "function");

  const names = tools.map((t) => t.function.name);
  assert.ok(names.includes("checkAvailability"));
  assert.ok(names.includes("createReservation"));
  assert.ok(names.includes("cancelReservation"));
});

test("executeBookingTool enforces customer confirmation before booking", async () => {
  const unconfirmedResult = await executeBookingTool({
    toolName: "createReservation",
    args: {
      date: "2026-10-27",
      slotId: "slot-1",
      partySize: 2,
      customerName: "Alice",
      customerPhone: "1234567890",
      customerConfirmed: false, // NOT confirmed
    },
    businessId: "60d0fe4f5311236168a109ca",
  });

  assert.equal(unconfirmedResult.success, false);
  assert.ok(unconfirmedResult.error.includes("not confirmed"));
});

test("processAssistantMessage intercepts navigation intent without calling AI", async () => {
  const mockUser = {
    assistantName: "Arin AI",
    businessName: "Test Cafe",
    enableNavigation: true,
    pages: [
      {
        name: "Menu",
        path: "/menu",
        keywords: ["menu", "food", "dishes"],
      },
    ],
    bookingSettings: {
      bookingEnabled: false,
    },
  };

  const navResult = await processAssistantMessage({
    user: mockUser,
    message: "Open the menu please",
    currentPath: "/",
  });

  assert.equal(navResult.action, "navigate");
  assert.equal(navResult.path, "/menu");
  assert.ok(navResult.aiResponse.includes("Opening Menu"));

  // If already on the page
  const alreadyOpenResult = await processAssistantMessage({
    user: mockUser,
    message: "Show me the menu",
    currentPath: "/menu",
  });

  assert.equal(alreadyOpenResult.action, undefined);
  assert.ok(alreadyOpenResult.aiResponse.includes("already open"));
});

test("Gemini client configures gemini-3.8-flash model endpoint by default", async () => {
  const { getGeminiUrl, generateGeminiResponse } = await import("../Configs/gemini.js");
  const url = getGeminiUrl();
  assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");

  // Requires API key
  await assert.rejects(
    async () => {
      await generateGeminiResponse({ prompt: "hello", apikey: "" });
    },
    /Gemini API key missing/
  );
});
