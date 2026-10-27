(function () {
  const script =
    document.currentScript ||
    document.querySelector("script[data-user-id]") ||
    document.querySelector("script[src*='assistant.js']");
  const userId = script?.getAttribute("data-user-id") || script?.dataset?.userId;

  // Determine origins dynamically (avoiding hardcoded localhost or failed ports)
  let scriptOrigin = window.location.origin;
  let scriptDir = "";
  if (script && script.src) {
    try {
      const parsedUrl = new URL(script.src, window.location.href);
      scriptOrigin = parsedUrl.origin;
      scriptDir = parsedUrl.href.substring(0, parsedUrl.href.lastIndexOf("/"));
    } catch {
      // fallback
    }
  }

  const ASSET_BASE =
    script?.getAttribute("data-asset-base") ||
    script?.dataset?.assetBase ||
    (scriptOrigin && scriptOrigin !== "null" && !scriptOrigin.startsWith("file") ? scriptOrigin : scriptDir);
  let API_BASE = script?.getAttribute("data-api-base") || script?.dataset?.apiBase;
  if (!API_BASE) {
    if (
      scriptOrigin.includes("localhost") ||
      scriptOrigin.includes("127.0.0.1") ||
      window.location.origin.includes("localhost") ||
      window.location.origin.includes("127.0.0.1")
    ) {
      API_BASE = "http://localhost:8000";
    } else {
      API_BASE = scriptOrigin;
    }
  }

  let theme = "warm";
  let assistantConfig = null;
  const history = [];

  // Load CSS dynamically
  const appendCss = () => {
    if (document.querySelector(`link[href*="assistant.css"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${ASSET_BASE}/assistant.css`;
    const target = document.head || document.documentElement || document.body;
    if (target) {
      target.appendChild(link);
    }
  };
  appendCss();

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
  popup.id = "mencia-widget-popup";
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

        <h2 class="mencia-title">Hello! I'm Arin AI</h2>
        <p class="mencia-sub">
          Your smart AI assistant.<br />
          Ask anything about our products and services.
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
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>

          <div class="mencia-input-bar">
            <input type="text" class="mencia-text-input" placeholder="Ask a question or request assistance..." />
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

  // Floating Launcher Button with inline SVG fallback to guarantee visibility
  const button = document.createElement("button");
  button.id = "mencia-widget-btn";
  button.className = `mencia-btn theme-${theme}`;
  button.setAttribute("aria-label", "Open AI Assistant");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="10" r="1" fill="#FFFFFF"></circle>
      <circle cx="8" cy="10" r="1" fill="#FFFFFF"></circle>
      <circle cx="16" cy="10" r="1" fill="#FFFFFF"></circle>
    </svg>
  `;

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

  // Icon SVGs
  const MIC_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
  `;

  // Red square stop icon
  const STOP_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" ry="2" />
    </svg>
  `;

  // Speech and Voice Recognition State
  let isSpeaking = false;
  let isListening = false;
  let startListeningFn = null;
  let stopListeningFn = null;

  // DOM Elements
  const status = popup.querySelector(".mencia-status");
  const wave = popup.querySelector(".mencia-wave");
  const quickActions = popup.querySelector(".mencia-quick-actions");
  const mic = popup.querySelector(".mencia-mic");
  const textInput = popup.querySelector(".mencia-text-input");
  const sendBtn = popup.querySelector(".mencia-send-btn");
  const chatScroll = popup.querySelector(".mencia-chat-scroll");

  // Mic Speaking State toggler
  const setMicSpeaking = (speaking) => {
    isSpeaking = speaking;
    if (speaking) {
      mic.classList.add("mencia-mic-speaking");
      mic.classList.remove("mencia-mic-listening");
      mic.innerHTML = STOP_ICON_SVG;
      mic.setAttribute("title", "Click to stop assistant and speak");
      mic.setAttribute("aria-label", "Stop speech");
      wave.style.opacity = "1";
    } else {
      mic.classList.remove("mencia-mic-speaking");
      mic.innerHTML = MIC_ICON_SVG;
      mic.setAttribute("title", "Voice speak");
      mic.setAttribute("aria-label", "Voice input");
      if (!isListening) {
        wave.style.opacity = "0";
        status.innerText = "Tap mic or type to speak";
      }
    }
  };

  // Immediate speech cutoff
  const stopSpeaking = (startListeningAfter = false) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setMicSpeaking(false);
    if (startListeningAfter && startListeningFn) {
      startListeningFn();
    }
  };

  // Close button (instantly cuts off speech and hides popup)
  const closeBtn = popup.querySelector(".mencia-close-btn");
  closeBtn.onclick = () => {
    stopSpeaking(false);
    if (stopListeningFn) stopListeningFn();
    open = false;
    popup.style.display = "none";
  };

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

    theme = assistantConfig.theme || "warm";
    const hasChat = popup.classList.contains("mencia-has-chat");
    popup.className = `mencia-popup theme-${theme}${hasChat ? " mencia-has-chat" : ""}`;
    button.className = `mencia-btn theme-${theme}`;

    if (assistantConfig.businessLogo) {
      button.innerHTML = `<img src="${assistantConfig.businessLogo}" alt="logo" style="width:34px;height:34px;border-radius:50%;object-fit:cover;" onerror="this.onerror=null;this.parentElement.innerHTML='<svg viewBox=\\'0 0 24 24\\' width=\\'28\\' height=\\'28\\' fill=\\'none\\' stroke=\\'#FFFFFF\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\\'></path></svg>'" />`;
    }

    const title = popup.querySelector(".mencia-title");
    title.innerHTML = `Hello! I'm ${assistantConfig.assistantName || "Arin AI"}`;

    const subTitle = popup.querySelector(".mencia-sub");
    subTitle.innerHTML = `Welcome to ${assistantConfig.businessName || "our business"}.<br />How can I assist you today?`;

    // Render Quick Actions (Booking + Navigation Pages)
    const bookingEnabled = Boolean(assistantConfig.bookingSettings?.bookingEnabled);
    const hasPages = Array.isArray(assistantConfig.pages) && assistantConfig.pages.length > 0;

    if (bookingEnabled || hasPages) {
      quickActions.style.display = "flex";
      let chipsHtml = "";
      if (bookingEnabled) {
        chipsHtml += `
          <button class="mencia-chip" data-msg="I would like to make a reservation or booking">📅 Book</button>
          <button class="mencia-chip" data-msg="Check available booking slots">🕒 Check Times</button>
          <button class="mencia-chip mencia-chip-cancel" data-msg="I want to cancel a booking">❌ Cancel Booking</button>
        `;
      }
      if (hasPages) {
        assistantConfig.pages.slice(0, 2).forEach((p) => {
          chipsHtml += `<button class="mencia-chip" data-msg="Tell me about ${p.name}">🔗 ${p.name}</button>`;
        });
      }
      quickActions.innerHTML = chipsHtml;
      quickActions.querySelectorAll(".mencia-chip").forEach((chip) => {
        chip.onclick = () => {
          const msg = chip.dataset.msg;
          handleSendMessage(msg);
        };
      });
    }
  };

  // Mount popup and button to DOM (works whether script is in <head> or <body>)
  const mountWidget = () => {
    if (document.getElementById("mencia-widget-btn")) return;
    if (!document.body) {
      window.addEventListener("DOMContentLoaded", mountWidget);
      return;
    }
    document.body.appendChild(popup);
    document.body.appendChild(button);
  };

  if (document.body) {
    mountWidget();
  } else {
    window.addEventListener("DOMContentLoaded", mountWidget);
  }

  loadAssistant();

  // Dynamic Theme Application (supports live color changes)
  const applyTheme = (newTheme) => {
    if (!newTheme) return;
    theme = newTheme;
    const hasChat = popup.classList.contains("mencia-has-chat");
    popup.className = `mencia-popup theme-${theme}${hasChat ? " mencia-has-chat" : ""}`;
    button.className = `mencia-btn theme-${theme}`;
  };

  // Listen for live theme updates across the site
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "MENCIA_SET_THEME") {
      applyTheme(event.data.theme);
    }
  });

  window.addEventListener("mencia:setTheme", (event) => {
    if (event.detail && event.detail.theme) {
      applyTheme(event.detail.theme);
    }
  });

  // Speech Synthesis with Active Mic State
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    status.innerText = "AI Speaking...";
    setMicSpeaking(true);

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onend = () => {
      setMicSpeaking(false);
    };

    speech.onerror = () => {
      setMicSpeaking(false);
    };

    window.speechSynthesis.speak(speech);
  };

  // 12-Hour AM/PM Time Formatters
  const format12Hour = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("AM") || timeStr.includes("PM") || timeStr.includes("am") || timeStr.includes("pm")) {
      return timeStr;
    }
    const parts = timeStr.split(":");
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const hh = h < 10 ? `0${h}` : `${h}`;
    const mm = (parts[1] || "00").substring(0, 2);
    return `${hh}:${mm} ${ampm}`;
  };

  const format12HourRange = (rangeStr) => {
    if (!rangeStr) return "";
    if (rangeStr.includes(" - ")) {
      const [start, end] = rangeStr.split(" - ");
      return `${format12Hour(start)} – ${format12Hour(end)}`;
    }
    return format12Hour(rangeStr);
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
          <div>Date & Time: <strong>${toolResult.date} (${format12HourRange(toolResult.time)})</strong></div>
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
              ${format12HourRange(s.time)} (${s.tablesAvailable} left)
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
  let recognition = null;

  startListeningFn = () => {
    isListening = true;
    wave.style.opacity = "1";
    status.innerText = "Listening...";
    mic.classList.add("mencia-mic-listening");
    mic.classList.remove("mencia-mic-speaking");
    mic.innerHTML = MIC_ICON_SVG;
    if (recognition) {
      try {
        recognition.start();
      } catch {
        // already active
      }
    }
  };

  stopListeningFn = () => {
    isListening = false;
    mic.classList.remove("mencia-mic-listening");
    if (!isSpeaking) {
      status.innerText = "Tap mic or type to speak";
      wave.style.opacity = "0";
    }
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    }
  };

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    mic.onclick = () => {
      // 1. If AI is speaking: Stop AI talking immediately and let user speak!
      if (isSpeaking) {
        stopSpeaking(true);
        return;
      }

      // 2. If already listening: toggle off
      if (isListening) {
        stopListeningFn();
        return;
      }

      // 3. Otherwise start listening
      startListeningFn();
    };

    recognition.onresult = (event) => {
      stopListeningFn();
      const speechText = event.results[0][0].transcript;
      handleSendMessage(speechText);
    };

    recognition.onerror = () => {
      stopListeningFn();
    };

    recognition.onend = () => {
      stopListeningFn();
    };
  } else {
    mic.onclick = () => {
      if (isSpeaking) {
        stopSpeaking(false);
        return;
      }
      textInput?.focus();
    };
    status.innerText = "Type a message below";
  }
})();
