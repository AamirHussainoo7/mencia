(function () {
  const script = document.currentScript;
  const userId = script?.dataset?.userId;

  // Determine origins dynamically (avoiding hardcoded localhost)
  let scriptOrigin = window.location.origin;
  if (script && script.src) {
    try {
      scriptOrigin = new URL(script.src).origin;
    } catch {
      // fallback to window.location.origin
    }
  }

  const ASSET_BASE = script?.dataset?.assetBase || scriptOrigin;
  const API_BASE =
    script?.dataset?.apiBase ||
    (scriptOrigin.includes(":5173") ? "http://localhost:8000" : scriptOrigin);

  let theme = "dark";
  let assistantConfig = null;
  const history = [];

  // Load CSS dynamically
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${ASSET_BASE}/assistant.css`;
  document.head.appendChild(link);

  // Helper to format basic markdown to clean HTML (bolding, lists, spacing)
  const formatMarkdown = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/(?:^|\n)[ \t]*[-*][ \t]+(.+)/g, "<div class='mencia-bullet'>• $1</div>")
      .replace(/\n\n+/g, "<div class='mencia-spacer'></div>")
      .replace(/\n/g, "<br/>");
  };

  // Create PopUp Container
  const popup = document.createElement("div");
  popup.className = `mencia-popup theme-${theme}`;

  popup.innerHTML = `
    <div class="mencia-overlay"></div>
    <div class="mencia-content">
      <!-- Fixed Top Header -->
      <div class="mencia-top">
        <button class="mencia-close-btn" title="Close assistant" aria-label="Close assistant">✕</button>

        <div class="mencia-orb-wrap">
          <div class="mencia-orb-glow"></div>
          <div class="mencia-orb"></div>
        </div>

        <h2 class="mencia-title">Hello! I'm Mencia</h2>
        <p class="mencia-sub">
          Your smart AI assistant.<br />
          Ask anything about our restaurant.
        </p>

        <!-- Quick Action Chips -->
        <div class="mencia-quick-actions" style="display: none;"></div>

        <div class="mencia-status">Tap mic or type to speak</div>

        <div class="mencia-wave">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <!-- Persistent Scrollable Message & History Area -->
      <div class="mencia-chat-scroll" id="mencia-chat-scroll">
        <!-- Messages appended dynamically here -->
      </div>

      <!-- Pinned Bottom Controls Dock -->
      <div class="mencia-bottom">
        <div class="mencia-input-dock">
          <button class="mencia-mic" title="Voice speak" aria-label="Voice input">
            <img src="${ASSET_BASE}/mic.svg" alt="mic" class="mencia-mic-icon" />
          </button>

          <div class="mencia-input-bar">
            <input type="text" class="mencia-text-input" placeholder="Ask a question or book a table..." />
            <button class="mencia-send-btn" title="Send message" aria-label="Send message">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Floating Launcher Button
  const button = document.createElement("button");
  button.className = `mencia-btn theme-${theme}`;
  button.innerHTML = `<img src="${ASSET_BASE}/logo.png" alt="logo" />`;
  document.body.appendChild(button);

  let open = false;
  button.onclick = () => {
    open = !open;
    popup.style.display = open ? "flex" : "none";
    if (open) {
      setTimeout(() => {
        textInput?.focus();
        scrollToBottom();
      }, 150);
    }
  };

  // Close button
  const closeBtn = popup.querySelector(".mencia-close-btn");
  closeBtn.onclick = () => {
    open = false;
    popup.style.display = "none";
  };

  // DOM Elements
  const status = popup.querySelector(".mencia-status");
  const wave = popup.querySelector(".mencia-wave");
  const quickActions = popup.querySelector(".mencia-quick-actions");
  const mic = popup.querySelector(".mencia-mic");
  const textInput = popup.querySelector(".mencia-text-input");
  const sendBtn = popup.querySelector(".mencia-send-btn");
  const chatScroll = popup.querySelector(".mencia-chat-scroll");

  const scrollToBottom = () => {
    if (chatScroll) {
      requestAnimationFrame(() => {
        chatScroll.scrollTop = chatScroll.scrollHeight;
      });
    }
  };

  // Append user bubble to chat history
  const appendUserMessage = (text) => {
    const bubble = document.createElement("div");
    bubble.className = "mencia-user-bubble";
    bubble.innerText = text;
    chatScroll.appendChild(bubble);
    scrollToBottom();
    return bubble;
  };

  // Append thinking indicator
  const appendThinkingIndicator = () => {
    const bubble = document.createElement("div");
    bubble.className = "mencia-ai-bubble mencia-thinking";
    bubble.innerHTML = `<span class="mencia-dot"></span><span class="mencia-dot"></span><span class="mencia-dot"></span>`;
    chatScroll.appendChild(bubble);
    scrollToBottom();
    return bubble;
  };

  // Append or update AI message bubble
  const appendAiMessage = (text, thinkingEl) => {
    if (thinkingEl && thinkingEl.parentNode) {
      thinkingEl.className = "mencia-ai-bubble";
      thinkingEl.innerHTML = formatMarkdown(text);
      scrollToBottom();
      return thinkingEl;
    }
    const bubble = document.createElement("div");
    bubble.className = "mencia-ai-bubble";
    bubble.innerHTML = formatMarkdown(text);
    chatScroll.appendChild(bubble);
    scrollToBottom();
    return bubble;
  };

  // Load Assistant Configuration
  const loadAssistant = async () => {
    if (!userId) {
      status.innerText = "Error: Missing data-user-id on script tag";
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/assistant/config/${userId}`);
      const data = await res.json();
      if (data && data.user) {
        assistantConfig = data.user;
        applyConfig();
      }
    } catch (error) {
      console.error("Assistant Load Error:", error);
    }
  };

  const applyConfig = () => {
    if (!assistantConfig) return;

    theme = assistantConfig.theme || "dark";
    const hasChat = popup.classList.contains("mencia-has-chat");
    popup.className = `mencia-popup theme-${theme}${hasChat ? " mencia-has-chat" : ""}`;
    button.className = `mencia-btn theme-${theme}`;

    const title = popup.querySelector(".mencia-title");
    title.innerHTML = `Hello! I'm ${assistantConfig.assistantName || "Mencia"}`;

    const subTitle = popup.querySelector(".mencia-sub");
    subTitle.innerHTML = `Welcome to ${assistantConfig.businessName || "our restaurant"}.<br />How can I assist you today?`;

    // Render Quick Actions if table reservations are enabled
    const bookingEnabled = Boolean(assistantConfig.bookingSettings?.bookingEnabled);
    if (bookingEnabled) {
      quickActions.style.display = "flex";
      quickActions.innerHTML = `
        <button class="mencia-chip" data-msg="I'd like to reserve a table">🍽️ Book Table</button>
        <button class="mencia-chip" data-msg="Check available reservation times for today">📅 Check Times</button>
        <button class="mencia-chip mencia-chip-cancel" data-msg="I want to cancel a reservation">❌ Cancel Booking</button>
      `;

      quickActions.querySelectorAll(".mencia-chip").forEach((chip) => {
        chip.onclick = () => {
          const msg = chip.dataset.msg;
          handleSendMessage(msg);
        };
      });
    }
  };

  loadAssistant();

  // Speech Synthesis
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    status.innerText = "AI Speaking...";

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onend = () => {
      status.innerText = "Tap mic or type to speak";
      wave.style.opacity = "0";
    };

    window.speechSynthesis.speak(speech);
  };

  // Render structured tool cards (e.g. Booking Reference or Available Slots) directly in the chat stream
  const renderToolResultCard = (toolResult) => {
    if (!toolResult) return;

    const cardWrap = document.createElement("div");
    cardWrap.className = "mencia-card-wrap";

    // Booking Created
    if (toolResult.bookingReference && toolResult.cancellationToken) {
      cardWrap.innerHTML = `
        <div class="mencia-card mencia-card-success">
          <div class="mencia-card-title">🎉 Reservation Confirmed!</div>
          <div style="margin: 4px 0;">Reference: <span class="mencia-badge">${toolResult.bookingReference}</span></div>
          <div>Date & Time: <strong>${toolResult.date} (${toolResult.time})</strong></div>
          <div>Guests: <strong>${toolResult.partySize}</strong> | Name: <strong>${toolResult.customerName}</strong></div>
          <div style="margin-top: 6px; font-size: 11px; opacity: 0.85; word-break: break-all;">
            Cancellation Token: <code>${toolResult.cancellationToken}</code>
          </div>
        </div>
      `;
      chatScroll.appendChild(cardWrap);
      scrollToBottom();
      return;
    }

    // Cancellation Succeeded
    if (toolResult.status === "cancelled") {
      cardWrap.innerHTML = `
        <div class="mencia-card">
          <div class="mencia-card-title">Reservation Cancelled</div>
          <div>Booking <strong>${toolResult.bookingReference}</strong> has been cancelled.</div>
        </div>
      `;
      chatScroll.appendChild(cardWrap);
      scrollToBottom();
      return;
    }

    // Available Slots
    if (toolResult.openSlots && toolResult.openSlots.length > 0) {
      const slotButtons = toolResult.openSlots
        .slice(0, 6)
        .map(
          (s) =>
            `<button class="mencia-chip" style="margin: 2px;" data-slot-msg="Book the ${s.time} slot on ${toolResult.date}">
              ${s.time} (${s.tablesAvailable} left)
            </button>`
        )
        .join("");

      cardWrap.innerHTML = `
        <div class="mencia-card">
          <div class="mencia-card-title">Available Slots for ${toolResult.date}</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">
            ${slotButtons}
          </div>
        </div>
      `;

      cardWrap.querySelectorAll(".mencia-chip").forEach((btn) => {
        btn.onclick = () => {
          handleSendMessage(btn.dataset.slotMsg);
        };
      });
      chatScroll.appendChild(cardWrap);
      scrollToBottom();
      return;
    }
  };

  // Core Send Message Handler
  const handleSendMessage = async (rawText) => {
    const text = (rawText || "").trim();
    if (!text) return;

    popup.classList.add("mencia-has-chat");
    appendUserMessage(text);
    const thinkingEl = appendThinkingIndicator();

    status.innerText = "Thinking...";
    wave.style.opacity = "1";

    history.push({ role: "user", text });

    try {
      const res = await fetch(`${API_BASE}/api/assistant/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          userId,
          currentPath: window.location.pathname,
          history,
        }),
      });

      const data = await res.json();

      if (data.success) {
        history.push({ role: "assistant", text: data.aiResponse });
        appendAiMessage(data.aiResponse, thinkingEl);

        if (data.action === "navigate") {
          speak(data.aiResponse);
          setTimeout(() => {
            window.location.href = data.path;
          }, 1500);
        } else {
          speak(data.aiResponse);
          if (data.toolResult) {
            renderToolResultCard(data.toolResult);
          }
        }
      } else {
        const errorMsg =
          data.message || "Our assistant is temporarily experiencing high demand. Please try again shortly.";
        appendAiMessage(errorMsg, thinkingEl);
        speak(errorMsg);
      }
    } catch (error) {
      console.error("AI Communication Error:", error);
      const errText = "Unable to connect to AI server. Please check your connection.";
      appendAiMessage(errText, thinkingEl);
      speak(errText);
    }
  };

  // Text Input Submit Event
  const onTextInputSubmit = () => {
    const val = textInput.value;
    textInput.value = "";
    handleSendMessage(val);
  };

  sendBtn.onclick = onTextInputSubmit;
  textInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      onTextInputSubmit();
    }
  };

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    mic.onclick = () => {
      wave.style.opacity = "1";
      status.innerText = "Listening...";
      mic.classList.add("mencia-mic-listening");
      try {
        recognition.start();
      } catch {
        // already started
      }
    };

    recognition.onresult = (event) => {
      mic.classList.remove("mencia-mic-listening");
      const speechText = event.results[0][0].transcript;
      handleSendMessage(speechText);
    };

    recognition.onerror = () => {
      mic.classList.remove("mencia-mic-listening");
      status.innerText = "Tap mic or type to speak";
      wave.style.opacity = "0";
    };

    recognition.onend = () => {
      mic.classList.remove("mencia-mic-listening");
    };
  } else {
    status.innerText = "Type a message below";
  }
})();
