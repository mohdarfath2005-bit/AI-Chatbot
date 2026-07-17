const API_KEY = "AQ.Ab8RN6J9z89r1LyiHbL6ZuvgG0EduQju_8oOb9IU74Sz1hNv6w";

const STORAGE_KEYS = {
  theme: "studyai_theme",
  history: "studyai_history"
};

const HISTORY_LIMIT = 12;

function $(id) {
  return document.getElementById(id);
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function addToHistory(text) {
  const title = text.length > 44 ? `${text.slice(0, 44)}…` : text;
  const uuid = globalThis.crypto?.randomUUID?.();
  const item = {
    id: uuid || String(Date.now()),
    title,
    ts: Date.now()
  };
  const next = [item, ...loadHistory()].slice(0, HISTORY_LIMIT);
  saveHistory(next);
  renderHistory();
}

function renderHistory() {
  const list = $("history-list");
  if (!list) return;

  const items = loadHistory();
  list.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "Your recent chats will appear here.";
    list.appendChild(empty);
    return;
  }

  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.setAttribute("role", "listitem");

    const title = document.createElement("div");
    title.className = "history-title";
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = new Date(item.ts).toLocaleDateString([], {
      month: "short",
      day: "2-digit"
    });

    button.append(title, meta);
    button.addEventListener("click", () => {
      const input = $("user-input");
      input.value = item.title.replace(/…$/, "");
      input.focus();
      closeSidebar();
    });

    list.appendChild(button);
  }
}

function setTheme(theme) {
  document.body.classList.toggle("theme-light", theme === "light");
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    // ignore
  }
}

function initTheme() {
  const saved = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.theme);
    } catch {
      return null;
    }
  })();

  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  setTheme(theme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains("theme-light");
  setTheme(isLight ? "dark" : "light");
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function scrollToBottom(behavior = "smooth") {
  const chatBox = $("chat-box");
  if (!chatBox) return;
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior });
}

function setBusy(isBusy) {
  const sendBtn = $("send-btn");
  const input = $("user-input");
  if (sendBtn) sendBtn.disabled = isBusy;
  if (input) input.disabled = isBusy;
}

function setEmptyState(isEmpty) {
  const welcome = $("welcome");
  const chatBox = $("chat-box");
  if (welcome) welcome.style.display = isEmpty ? "grid" : "none";
  if (chatBox) chatBox.classList.toggle("is-empty", isEmpty);
}

function createMessageRow(role) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "bot" ? "AI" : "";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const text = document.createElement("div");
  text.className = "bubble-text";

  const meta = document.createElement("div");
  meta.className = "bubble-meta";
  meta.textContent = formatTime();

  bubble.append(text, meta);
  row.append(avatar, bubble);
  return { row, textEl: text, metaEl: meta };
}

function appendMessage(role, content) {
  const chatBox = $("chat-box");
  if (!chatBox) return null;

  const { row, textEl } = createMessageRow(role);
  textEl.textContent = content;
  chatBox.appendChild(row);
  setEmptyState(false);
  scrollToBottom("smooth");
  return row;
}

function appendTyping() {
  const chatBox = $("chat-box");
  if (!chatBox) return null;

  const { row, textEl } = createMessageRow("bot");
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  textEl.replaceWith(typing);

  chatBox.appendChild(row);
  setEmptyState(false);
  scrollToBottom("smooth");
  return row;
}

function replaceTypingWithText(typingRow, text) {
  if (!typingRow) return;
  const bubble = typingRow.querySelector(".bubble");
  if (!bubble) return;
  const existingMeta = bubble.querySelector(".bubble-meta");

  const textEl = document.createElement("div");
  textEl.className = "bubble-text";
  textEl.textContent = text;

  bubble.innerHTML = "";
  bubble.append(textEl, existingMeta || document.createElement("div"));
  if (!existingMeta) {
    const meta = bubble.querySelector("div:last-child");
    meta.className = "bubble-meta";
    meta.textContent = formatTime();
  }
}

function clearChat() {
  const chatBox = $("chat-box");
  if (!chatBox) return;
  chatBox.innerHTML = "";
  setEmptyState(true);
}

function initUI() {
  initTheme();
  renderHistory();
  setEmptyState(true);

  $("theme-toggle")?.addEventListener("click", toggleTheme);
  $("sidebar-toggle")?.addEventListener("click", toggleSidebar);
  $("new-chat-btn")?.addEventListener("click", () => {
    clearChat();
    closeSidebar();
    $("user-input")?.focus();
  });

  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("sidebar-open")) return;
    const sidebar = $("sidebar");
    const toggle = $("sidebar-toggle");
    if (sidebar?.contains(e.target) || toggle?.contains(e.target)) return;
    closeSidebar();
  });

  $("user-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  $("suggestions")?.addEventListener("click", (e) => {
    const card = e.target?.closest?.(".suggestion-card");
    if (!card) return;
    const prompt = card.getAttribute("data-prompt") || "";
    const input = $("user-input");
    input.value = prompt;
    input.focus();
    sendMessage();
  });
}

document.addEventListener("DOMContentLoaded", initUI);

async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  const userMessage = input.value.trim();

  if (!userMessage) return;

  setBusy(true);
  appendMessage("user", userMessage);
  addToHistory(userMessage);
  input.value = "";
  const typingRow = appendTyping();

  // Gemini API Request
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const botReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry — I couldn't generate a response.";

    replaceTypingWithText(typingRow, botReply);
    scrollToBottom("smooth");
  } catch (err) {
    replaceTypingWithText(
      typingRow,
      "Network error — please check your connection and try again."
    );
  } finally {
    setBusy(false);
    input.focus();
  }
}
