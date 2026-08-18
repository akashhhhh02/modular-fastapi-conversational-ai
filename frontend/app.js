/**
 * NovaChat AI — Client Logic, Markdown Engine, Prompt Library & History Manager
 */

// State
let currentSessionId = null;
let sessions = [];
let isGenerating = false;

// Curated Prompt Library Database
const PROMPT_LIBRARY = [
  {
    category: 'code',
    title: 'Explain SOLID Architecture',
    desc: 'Deep dive into SOLID software engineering principles with concise Python code and a comparison table.',
    prompt: 'Explain the SOLID software engineering principles in detail. For each principle, provide a clear explanation, practical Python code before and after, and summarize the key benefits in a clean comparison table.',
  },
  {
    category: 'code',
    title: 'FastAPI Production Endpoint',
    desc: 'Generate a production-grade async FastAPI endpoint with Pydantic validation, dependency injection, and error handling.',
    prompt: 'Create a production-grade asynchronous FastAPI endpoint with Pydantic v2 schemas, dependency injection with Depends(), custom exceptions, and type annotations adhering strictly to SOLID principles.',
  },
  {
    category: 'code',
    title: 'Refactor Code to Clean Architecture',
    desc: 'Analyze code and refactor it for maintainability, separation of concerns, and async performance.',
    prompt: 'Review and refactor the following code to adhere to clean code practices, Single Responsibility Principle, and modern asynchronous execution. Explain your design decisions step-by-step.',
  },
  {
    category: 'analysis',
    title: 'Generate Structured Comparison Table',
    desc: 'Compare concepts, technologies, or organizational ranks in a beautifully formatted Markdown table.',
    prompt: 'Please provide a comprehensive and structured Markdown table comparing the following topic with clear headers, key attributes, pros/cons, and recommended use cases.',
  },
  {
    category: 'analysis',
    title: 'Technology & Architecture Trade-off Matrix',
    desc: 'Structured comparison of technologies, frameworks, or database choices with trade-offs and latency benchmarks.',
    prompt: 'Create a comprehensive Markdown comparison table evaluating the top options for the following technical choice, comparing performance, complexity, developer ergonomics, scalability, and optimal use cases.',
  },
  {
    category: 'writing',
    title: 'Product Requirements Document (PRD)',
    desc: 'Draft a comprehensive PRD with goals, user stories, technical architecture, and success metrics.',
    prompt: 'Draft a comprehensive Product Requirements Document (PRD) for a new AI-powered developer tool. Include Overview, Problem Statement, User Personas, Core Features, Architecture, and KPIs in a structured markdown format.',
  },
  {
    category: 'writing',
    title: 'Executive Summary & Briefing',
    desc: 'Synthesize complex technical topics into a concise, high-impact executive brief for stakeholders.',
    prompt: 'Synthesize the following technical initiative into an executive summary for C-level leadership. Include Business Impact, Strategic Value, Cost/ROI, Timeline, and Next Steps.',
  },
  {
    category: 'strategy',
    title: 'Product Launch Roadmap & OKRs',
    desc: 'Strategic launch milestones, marketing schedule, and quarterly OKRs.',
    prompt: 'Create a 90-day Product Launch Roadmap and OKR framework for launching a new SaaS product, organized across Engineering, Marketing, and Operations with milestone tables.',
  },
  {
    category: 'strategy',
    title: 'System Design & Trade-off Analysis',
    desc: 'Analyze architectural trade-offs between microservices, monoliths, event-driven systems, and caching.',
    prompt: 'Conduct an in-depth System Design and trade-off analysis for scaling a high-concurrency real-time application. Compare architecture options with a pros/cons comparison matrix.',
  },
];

// DOM Elements
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeHero = document.getElementById('welcomeHero');
const chatViewport = document.getElementById('chatViewport');
const newChatBtn = document.getElementById('newChatBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const charCounter = document.getElementById('charCounter');
const toastContainer = document.getElementById('toastContainer');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const sidebarModelName = document.getElementById('sidebarModelName');
const footerModelHint = document.getElementById('footerModelHint');
const currentSessionTitle = document.getElementById('currentSessionTitle');
const currentSessionSubtitle = document.getElementById('currentSessionSubtitle');
const recentSessions = document.getElementById('recentSessions');
const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');

// Modals
const promptsModal = document.getElementById('promptsModal');
const historyModal = document.getElementById('historyModal');
const navPrompts = document.getElementById('navPrompts');
const navHistory = document.getElementById('navHistory');
const navChat = document.getElementById('navChat');
const openPromptsTopBtn = document.getElementById('openPromptsTopBtn');
const closePromptsBtn = document.getElementById('closePromptsBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const modalPromptGrid = document.getElementById('modalPromptGrid');
const modalHistoryList = document.getElementById('modalHistoryList');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initMarked();
  loadSessionsFromStorage();
  setupEventListeners();
  renderPromptLibrary('all');
  checkBackendHealth();
  autoResizeTextarea();
});

/**
 * Configure Marked.js for GFM and Tables
 */
function initMarked() {
  if (window.marked) {
    window.marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false,
    });
  }
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  sendBtn.addEventListener('click', handleSendMessage);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    autoResizeTextarea();
    updateCharCounter();
  });

  newChatBtn.addEventListener('click', startNewConversation);
  clearChatBtn.addEventListener('click', clearCurrentChat);
  clearAllHistoryBtn.addEventListener('click', clearAllSavedHistory);

  // Global keyboard shortcuts (Ctrl+K or Cmd+K for new chat)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      startNewConversation();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Sidebar toggle for mobile
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Quick Prompt Cards on Welcome Screen
  document.querySelectorAll('.prompt-card').forEach((card) => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      if (prompt) {
        messageInput.value = prompt;
        autoResizeTextarea();
        updateCharCounter();
        handleSendMessage();
      }
    });
  });

  // Modal Open/Close Controls
  if (navPrompts) navPrompts.addEventListener('click', () => openModal(promptsModal));
  if (openPromptsTopBtn) openPromptsTopBtn.addEventListener('click', () => openModal(promptsModal));
  if (navHistory) navHistory.addEventListener('click', openHistoryModal);
  if (navChat) {
    navChat.addEventListener('click', () => {
      closeAllModals();
      if (sidebar) sidebar.classList.remove('open');
    });
  }

  if (closePromptsBtn) closePromptsBtn.addEventListener('click', () => closeModal(promptsModal));
  if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => closeModal(historyModal));

  // Close modals when clicking backdrop
  [promptsModal, historyModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // Prompt Library Category Tabs
  document.querySelectorAll('.prompt-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.prompt-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      renderPromptLibrary(tab.getAttribute('data-category') || 'all');
    });
  });
}

/**
 * Modal Management
 */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
}

function closeAllModals() {
  closeModal(promptsModal);
  closeModal(historyModal);
}

function openHistoryModal() {
  renderHistoryModalList();
  openModal(historyModal);
}

/**
 * Render Prompt Library in Modal
 */
function renderPromptLibrary(category) {
  if (!modalPromptGrid) return;
  modalPromptGrid.innerHTML = '';

  const filtered =
    category === 'all'
      ? PROMPT_LIBRARY
      : PROMPT_LIBRARY.filter((p) => p.category === category);

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'prompt-modal-card';
    card.innerHTML = `
      <div>
        <div class="prompt-modal-title">${escapeHtml(item.title)}</div>
        <div class="prompt-modal-text">${escapeHtml(item.desc)}</div>
      </div>
      <div class="prompt-modal-actions">
        <button class="btn-use-prompt" data-action="use">Run Prompt</button>
      </div>
    `;

    card.querySelector('[data-action="use"]').addEventListener('click', () => {
      closeAllModals();
      messageInput.value = item.prompt;
      autoResizeTextarea();
      updateCharCounter();
      handleSendMessage();
    });

    modalPromptGrid.appendChild(card);
  });
}

/**
 * LocalStorage Sessions Management
 */
function loadSessionsFromStorage() {
  try {
    const raw = localStorage.getItem('novachat_sessions_v1');
    if (raw) {
      sessions = JSON.parse(raw);
    }
  } catch (e) {
    sessions = [];
  }

  if (sessions.length > 0) {
    loadSession(sessions[0].id);
  } else {
    startNewConversation(false);
  }
  renderRecentSessionsList();
}

function saveSessionsToStorage() {
  try {
    localStorage.setItem('novachat_sessions_v1', JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to storage', e);
  }
  renderRecentSessionsList();
}

function startNewConversation(shouldToast = true) {
  const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newSession = {
    id: newId,
    title: 'New Conversation',
    createdAt: new Date().toISOString(),
    messages: [],
  };

  sessions.unshift(newSession);
  currentSessionId = newId;
  saveSessionsToStorage();

  // Clear Chat Viewport
  messagesList.innerHTML = '';
  if (welcomeHero) welcomeHero.style.display = 'flex';
  if (currentSessionTitle) currentSessionTitle.textContent = 'Assistant Workspace';
  if (currentSessionSubtitle) currentSessionSubtitle.textContent = 'Ready for questions & code';

  if (messageInput) {
    messageInput.value = '';
    autoResizeTextarea();
    updateCharCounter();
    messageInput.focus();
  }

  if (shouldToast) {
    showToast('Started new conversation', 'success');
  }
  closeAllModals();
}

function loadSession(sessionId) {
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  currentSessionId = sessionId;
  messagesList.innerHTML = '';

  if (session.messages.length === 0) {
    if (welcomeHero) welcomeHero.style.display = 'flex';
    if (currentSessionTitle) currentSessionTitle.textContent = 'Assistant Workspace';
    if (currentSessionSubtitle) currentSessionSubtitle.textContent = 'Ready for questions & code';
  } else {
    if (welcomeHero) welcomeHero.style.display = 'none';
    if (currentSessionTitle) currentSessionTitle.textContent = session.title || 'Conversation';
    if (currentSessionSubtitle)
      currentSessionSubtitle.textContent = `${session.messages.length} messages in history`;

    session.messages.forEach((msg) => {
      appendMessageRow(msg.role, msg.content, false);
    });
    scrollToBottom(false);
  }

  renderRecentSessionsList();
  closeAllModals();
}

function deleteSession(sessionId, e) {
  if (e) e.stopPropagation();
  sessions = sessions.filter((s) => s.id !== sessionId);

  if (currentSessionId === sessionId) {
    if (sessions.length > 0) {
      loadSession(sessions[0].id);
    } else {
      startNewConversation(false);
    }
  } else {
    saveSessionsToStorage();
  }
  renderHistoryModalList();
  showToast('Conversation deleted', 'info');
}

function clearCurrentChat() {
  const session = sessions.find((s) => s.id === currentSessionId);
  if (session) {
    session.messages = [];
    saveSessionsToStorage();
  }
  messagesList.innerHTML = '';
  if (welcomeHero) welcomeHero.style.display = 'flex';
  if (messageInput) {
    messageInput.value = '';
    autoResizeTextarea();
    updateCharCounter();
  }
  showToast('Chat cleared', 'info');
}

function clearAllSavedHistory() {
  if (!confirm('Are you sure you want to delete all saved conversations?')) return;
  sessions = [];
  localStorage.removeItem('novachat_sessions_v1');
  startNewConversation(false);
  renderHistoryModalList();
  showToast('All conversation history cleared', 'info');
}

/**
 * Render Sidebar Recent Sessions
 */
function renderRecentSessionsList() {
  if (!recentSessions) return;
  recentSessions.innerHTML = '';

  if (sessions.length === 0) {
    recentSessions.innerHTML = '<div class="no-sessions-hint">No saved sessions</div>';
    return;
  }

  sessions.slice(0, 8).forEach((session) => {
    const item = document.createElement('div');
    const isActive = session.id === currentSessionId;
    item.className = `session-item ${isActive ? 'active' : ''}`;

    item.innerHTML = `
      <div class="session-item-left">
        <span class="session-dot"></span>
        <span class="session-title-text">${escapeHtml(session.title || 'Untitled Chat')}</span>
      </div>
      <button class="session-delete-btn" title="Delete conversation">✕</button>
    `;

    item.addEventListener('click', () => loadSession(session.id));
    item.querySelector('.session-delete-btn').addEventListener('click', (e) => {
      deleteSession(session.id, e);
    });

    recentSessions.appendChild(item);
  });
}

/**
 * Render Full History List in Modal
 */
function renderHistoryModalList() {
  if (!modalHistoryList) return;
  modalHistoryList.innerHTML = '';

  if (sessions.length === 0) {
    modalHistoryList.innerHTML = '<div class="no-sessions-hint" style="text-align:center; padding: 24px;">No conversation history found.</div>';
    return;
  }

  sessions.forEach((session) => {
    const card = document.createElement('div');
    card.className = 'history-card-modal';

    const dateStr = session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Recent';
    const count = session.messages ? session.messages.length : 0;

    card.innerHTML = `
      <div class="history-card-info">
        <div class="history-card-title">${escapeHtml(session.title || 'Conversation')}</div>
        <div class="history-card-meta">${dateStr} &bull; ${count} messages</div>
      </div>
      <div class="history-card-actions">
        <button class="btn-history-load" data-action="load">Open</button>
        <button class="btn-history-delete" data-action="delete">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="load"]').addEventListener('click', () => loadSession(session.id));
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => deleteSession(session.id, e));

    modalHistoryList.appendChild(card);
  });
}

/**
 * Auto-scroll to the bottom of the chat viewport smoothly
 */
function scrollToBottom(smooth = true) {
  if (!chatViewport) return;
  chatViewport.scrollTo({
    top: chatViewport.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

/**
 * Adjust textarea height dynamically based on input length
 */
function autoResizeTextarea() {
  if (!messageInput) return;
  messageInput.style.height = 'auto';
  const newHeight = Math.min(messageInput.scrollHeight, 180);
  messageInput.style.height = `${Math.max(newHeight, 24)}px`;
}

/**
 * Update character counter
 */
function updateCharCounter() {
  if (!charCounter || !messageInput) return;
  const count = messageInput.value.length;
  charCounter.textContent = `${count} / 4000`;
  if (count > 3800) {
    charCounter.style.color = '#ef4444';
  } else {
    charCounter.style.color = 'var(--text-muted)';
  }
}

/**
 * Send user message to FastAPI backend
 */
async function handleSendMessage() {
  if (isGenerating) return;

  const rawText = messageInput.value.trim();
  if (!rawText) return;

  // Hide welcome hero on first message
  if (welcomeHero) {
    welcomeHero.style.display = 'none';
  }

  // Clear input & reset height
  messageInput.value = '';
  autoResizeTextarea();
  updateCharCounter();

  // Find or create active session
  let session = sessions.find((s) => s.id === currentSessionId);
  if (!session) {
    startNewConversation(false);
    session = sessions[0];
  }

  // Update session title if first message
  if (session.messages.length === 0) {
    const cleanTitle = rawText.length > 42 ? rawText.substring(0, 42) + '...' : rawText;
    session.title = cleanTitle;
    if (currentSessionTitle) currentSessionTitle.textContent = cleanTitle;
  }

  // Add User Message to DOM and Session
  appendMessageRow('user', rawText, true);
  session.messages.push({ role: 'user', content: rawText });
  saveSessionsToStorage();
  scrollToBottom();

  // Set Generating State
  isGenerating = true;
  sendBtn.disabled = true;
  showTypingIndicator(true);

  try {
    // Build context history (last 16 messages)
    const historyPayload = session.messages
      .slice(0, -1)
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: rawText,
        history: historyPayload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || `Server error (${response.status})`);
    }

    const reply = data.reply || 'No response returned.';

    // Add Assistant Message Row
    appendMessageRow('assistant', reply, true);
    session.messages.push({ role: 'assistant', content: reply });
    saveSessionsToStorage();
  } catch (err) {
    appendErrorRow(err.message || 'Failed to connect to the AI assistant.');
    showToast(err.message || 'Error generating response', 'error');
  } finally {
    showTypingIndicator(false);
    isGenerating = false;
    sendBtn.disabled = false;
    messageInput.focus();
    scrollToBottom();
  }
}

/**
 * Append a regular message row (user or assistant)
 */
function appendMessageRow(role, content, shouldAnimate = true) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  if (!shouldAnimate) row.style.animation = 'none';

  const isAssistant = role === 'assistant';
  const avatarText = isAssistant ? 'AI' : 'U';
  const avatarClass = isAssistant ? 'assistant-avatar' : 'user-avatar';

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${avatarClass}`;
  avatar.textContent = avatarText;

  const contentBox = document.createElement('div');
  contentBox.className = 'message-content-box';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (isAssistant) {
    bubble.innerHTML = renderMarkdown(content);
  } else {
    bubble.textContent = content;
  }

  contentBox.appendChild(bubble);

  // Meta row for assistant
  if (isAssistant) {
    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const timeSpan = document.createElement('span');
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-msg-action';
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy response</span>
    `;
    copyBtn.addEventListener('click', () => {
      copyToClipboard(content);
      copyBtn.innerHTML = `<span>✓ Copied</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy response</span>
        `;
      }, 2000);
    });

    meta.appendChild(timeSpan);
    meta.appendChild(copyBtn);
    contentBox.appendChild(meta);
  }

  if (isAssistant) {
    row.appendChild(avatar);
    row.appendChild(contentBox);
  } else {
    row.appendChild(contentBox);
    row.appendChild(avatar);
  }

  messagesList.appendChild(row);
  attachCodeCopyHandlers(bubble);
}

/**
 * Append error message row
 */
function appendErrorRow(errorMessage) {
  const row = document.createElement('div');
  row.className = 'message-row assistant';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar assistant-avatar';
  avatar.textContent = '!';

  const contentBox = document.createElement('div');
  contentBox.className = 'message-content-box';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble error-bubble';
  bubble.innerHTML = `<strong>Error:</strong> ${escapeHtml(errorMessage)}`;

  contentBox.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(contentBox);

  messagesList.appendChild(row);
}

/**
 * Show or hide typing indicator
 */
function showTypingIndicator(visible) {
  let typingRow = document.getElementById('typingRow');

  if (visible) {
    if (!typingRow) {
      typingRow = document.createElement('div');
      typingRow.id = 'typingRow';
      typingRow.className = 'message-row assistant';

      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar assistant-avatar';
      avatar.textContent = 'AI';

      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      typingIndicator.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      `;

      typingRow.appendChild(avatar);
      typingRow.appendChild(typingIndicator);
      messagesList.appendChild(typingRow);
      scrollToBottom();
    }
  } else if (typingRow) {
    typingRow.remove();
  }
}

/**
 * Markdown renderer with GitHub Flavored Markdown (GFM) and Table Support
 */
function renderMarkdown(text) {
  if (!text) return '';

  // Use Marked.js if available
  if (window.marked) {
    try {
      let parsed = window.marked.parse(text);
      // Wrap all <table> elements in <div class="table-container"> for horizontal scroll support
      parsed = parsed.replace(/<table>/g, '<div class="table-container"><table>');
      parsed = parsed.replace(/<\/table>/g, '</table></div>');

      // Replace pre/code with our custom code block headers
      parsed = parsed.replace(/<pre><code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
        const language = lang || 'code';
        const rawCode = decodeHtml(code);
        return `
          <div class="code-block-container">
            <div class="code-header">
              <span>${escapeHtml(language)}</span>
              <button class="code-copy-btn" data-code="${encodeURIComponent(rawCode.trim())}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy code</span>
              </button>
            </div>
            <pre><code>${code}</code></pre>
          </div>
        `;
      });

      return parsed;
    } catch (e) {
      console.warn('Marked.js parse failed, falling back to custom parser', e);
    }
  }

  // Robust Fallback Parser
  let html = text;

  // 1. Code blocks
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    return `
      <div class="code-block-container">
        <div class="code-header">
          <span>${escapeHtml(language)}</span>
          <button class="code-copy-btn" data-code="${encodeURIComponent(code.trim())}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy code</span>
          </button>
        </div>
        <pre><code>${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
  });

  // 2. Tables fallback (| a | b |)
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length >= 2) {
      let tableHtml = '<div class="table-container"><table>';
      lines.forEach((line, idx) => {
        if (line.includes('---')) return; // separator row
        const cells = line.split('|').filter((c, i, arr) => i > 0 && i < arr.length - 1);
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += '<tr>';
        cells.forEach((cell) => {
          tableHtml += `<${tag}>${escapeHtml(cell.trim())}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table></div>';
      return tableHtml;
    }
    return match;
  });

  // 3. Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 4. Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // 5. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  return html;
}

/**
 * Attach copy handlers to all code block copy buttons inside a bubble
 */
function attachCodeCopyHandlers(container) {
  container.querySelectorAll('.code-copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = decodeURIComponent(btn.getAttribute('data-code') || '');
      copyToClipboard(code);
      btn.innerHTML = `<span>✓ Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy code</span>
        `;
      }, 2000);
    });
  });
}

/**
 * Copy string to clipboard
 */
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Copy failed', err);
    }
    textArea.remove();
  }
  showToast('Copied to clipboard', 'success');
}

/**
 * Toast Notification Display
 */
function showToast(message, type = 'info') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

/**
 * Check backend health status
 */
async function checkBackendHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      const model = data.model || 'Groq Engine';
      if (statusBadge && statusText) {
        statusText.textContent = `Online • ${model}`;
      }
      if (sidebarModelName) {
        sidebarModelName.textContent = model;
      }
      if (footerModelHint) {
        footerModelHint.textContent = `${model} • Fast`;
      }
    }
  } catch (e) {
    if (statusBadge && statusText) {
      statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      statusBadge.style.color = '#fca5a5';
      statusText.textContent = 'Offline';
    }
  }
}

/**
 * Utility HTML escaper
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Utility HTML decoder
 */
function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}
