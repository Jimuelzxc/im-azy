function createChatPanel(floatingButton) {
  const panel = document.createElement('aside');
  panel.className = 'azy-chat-panel azy-hidden';
  panel.setAttribute('aria-label', 'Azy Chat Panel');
  panel.innerHTML = `
    <header class="azy-chat-header">
      <h2>Ask azy about this video.</h2>
      <button class="azy-close-btn" aria-label="Close panel">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </header>
    <main class="azy-chat-content">
      <div class="azy-greeting-message">
        <pre class="azy-ghost-ascii" aria-hidden="true"></pre>
        <p class="azy-greeting-text">Hello! Curious about what you're watching? I'm here to help.</p>
        <div class="azy-suggestion-buttons">
          <button type="button" class="azy-suggestion-btn" data-suggestion="summarize the video">summarize the video</button>
        </div>
      </div>
    </main>
    <div class="azy-chat-input-wrapper">
      <form class="azy-chat-input-form">
        <div class="azy-input-top-row">
          <span class="azy-ai-sparkle" aria-hidden="true">*</span>
          <textarea placeholder="ask a question..." aria-label="Ask a question" autocomplete="off" rows="1"></textarea>
        </div>
        <div class="azy-input-bottom-row">
          <button type="button" class="azy-settings-btn" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button type="submit" class="azy-send-btn" aria-label="Send message">&gt;</button>
        </div>
      </form>
    </div>
    <div class="azy-resize-handle"></div>
  `;

  document.body.appendChild(panel);

  const chatContent = panel.querySelector('.azy-chat-content');
  const inputForm = panel.querySelector('.azy-chat-input-form');
  const inputField = panel.querySelector('textarea');
  const closeBtn = panel.querySelector('.azy-close-btn');
  const settingsBtn = panel.querySelector('.azy-settings-btn');
  const header = panel.querySelector('.azy-chat-header');
  const resizeHandle = panel.querySelector('.azy-resize-handle');
  const greetingSection = panel.querySelector('.azy-greeting-message');
  const ghostAscii = panel.querySelector('.azy-ghost-ascii');

  let isStreaming = false;
  let streamingPort = null;
  let streamingMessageEl = null;
  let streamingText = '';
  let editingMessageIndex = null;
  let editingOriginalContent = null;

  // Auto-expand textarea
  inputField.addEventListener('input', () => {
    inputField.style.height = 'auto';
    inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
  });

  // ASCII Haunter animation
  const haunterFrames = [
    ' .---. \n| -_- |\n \'---\' ',
    ' .---. \n| -_- |\n \'---\' ',
    ' .---. \n| - - |\n \'---\' ',
  ];
  let haunterFrame = 0;
  if (ghostAscii) {
    ghostAscii.textContent = haunterFrames[0];
    setInterval(() => {
      haunterFrame = (haunterFrame + 1) % haunterFrames.length;
      ghostAscii.textContent = haunterFrames[haunterFrame];
    }, 800);
  }

  const settingsPanel = createSettingsPanel(panel);
  window.azySettingsPanel = settingsPanel;

  settingsBtn.addEventListener('click', () => {
    settingsPanel.show();
  });

  closeBtn.addEventListener('click', () => {
    hide();
  });

  function show() {
    panel.classList.remove('azy-hidden');
    floatingButton.classList.add('azy-hidden');
    loadPanelState();
  }

  function hide() {
    panel.classList.add('azy-hidden');
    floatingButton.classList.remove('azy-hidden');
    settingsPanel.hide();
    savePanelState();
  }

  async function loadPanelState() {
    try {
      const stored = await browser.storage.local.get('azy_panel_state');
      const state = stored.azy_panel_state;
      if (state) {
        if (state.top != null) panel.style.top = state.top + 'px';
        if (state.left != null) panel.style.left = state.left + 'px';
        if (state.bottom != null) panel.style.bottom = state.bottom + 'px';
        if (state.right != null) panel.style.right = state.right + 'px';
        if (state.width) panel.style.width = state.width + 'px';
        if (state.height) panel.style.height = state.height + 'px';
      }
    } catch (e) {
      console.error('Azy: failed to load panel state', e);
    }
  }

  async function savePanelState() {
    try {
      const rect = panel.getBoundingClientRect();
      const state = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
      await browser.storage.local.set({ azy_panel_state: state });
    } catch (e) {
      console.error('Azy: failed to save panel state', e);
    }
  }

  // Drag
  let isDragging = false;
  let dragStartX, dragStartY, dragStartLeft, dragStartTop;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.azy-close-btn')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = panel.getBoundingClientRect();
    dragStartLeft = rect.left;
    dragStartTop = rect.top;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = dragStartLeft + 'px';
    panel.style.top = dragStartTop + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    let newLeft = dragStartLeft + dx;
    let newTop = dragStartTop + dy;
    const panelRect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - panelRect.width;
    const maxY = window.innerHeight - panelRect.height;
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      savePanelState();
    }
  });

  // Resize
  let isResizing = false;
  let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    const rect = panel.getBoundingClientRect();
    resizeStartWidth = rect.width;
    resizeStartHeight = rect.height;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    const newWidth = Math.max(280, resizeStartWidth + dx);
    const newHeight = Math.max(300, resizeStartHeight + dy);
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.9;
    panel.style.width = Math.min(newWidth, maxW) + 'px';
    panel.style.height = Math.min(newHeight, maxH) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      savePanelState();
    }
  });

  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `azy-message azy-message-${type}`;
    if (type === 'azy') {
      msg.dataset.rawText = text;
      msg.style.position = 'relative';
      msg.innerHTML = renderMarkdown(text);
      const copyBtn = document.createElement('button');
      copyBtn.className = 'azy-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy response');
      copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      copyBtn.addEventListener('click', () => {
        const rawText = msg.dataset.rawText;
        navigator.clipboard.writeText(rawText).then(() => {
          const tooltip = document.createElement('span');
          tooltip.className = 'azy-copy-tooltip';
          tooltip.textContent = 'Copied';
          copyBtn.appendChild(tooltip);
          setTimeout(() => {
            tooltip.classList.add('azy-copy-fade');
            setTimeout(() => tooltip.remove(), 300);
          }, 1500);
        }).catch(() => {});
      });
      msg.appendChild(copyBtn);
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'azy-message-wrapper';
      wrapper.style.position = 'relative';
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      wrapper.appendChild(textSpan);

      const editBtn = document.createElement('button');
      editBtn.className = 'azy-edit-btn';
      editBtn.setAttribute('aria-label', 'Edit message');
      editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
      editBtn.addEventListener('click', () => {
        const msgElements = chatContent.querySelectorAll('.azy-message-user');
        const allUserMsgs = Array.from(msgElements);
        const idx = allUserMsgs.indexOf(msg);
        if (idx >= 0) {
          startEditing(idx);
        }
      });
      wrapper.appendChild(editBtn);
      msg.appendChild(wrapper);
    }
    chatContent.appendChild(msg);
    chatContent.scrollTop = chatContent.scrollHeight;
    return msg;
  }

  function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'azy-loading';
    loading.textContent = 'Thinking...';
    chatContent.appendChild(loading);
    chatContent.scrollTop = chatContent.scrollHeight;
    return loading;
  }

  function removeLoading() {
    const loading = chatContent.querySelector('.azy-loading');
    if (loading) loading.remove();
  }

  function showError(message, onRetry) {
    const err = document.createElement('div');
    err.className = 'azy-error-message';
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    err.appendChild(textSpan);
    if (onRetry) {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'azy-retry-btn';
      retryBtn.setAttribute('aria-label', 'Retry');
      retryBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';
      retryBtn.addEventListener('click', () => {
        err.remove();
        onRetry();
      });
      err.appendChild(retryBtn);
    }
    chatContent.appendChild(err);
    chatContent.scrollTop = chatContent.scrollHeight;
  }

  let conversationHistory = [];
  let lastUserMessage = null;

  const COMMANDS = {
    clear: {
      description: 'Clear the chat',
      handler: () => {
        if (editingMessageIndex !== null) cancelEditing();
        chatContent.innerHTML = '';
        conversationHistory = [];
        const note = document.createElement('div');
        note.className = 'azy-system-note';
        note.textContent = 'Chat cleared';
        chatContent.appendChild(note);
        chatContent.appendChild(greetingSection.cloneNode(true));
        const newSuggestionBtn = chatContent.querySelector('.azy-suggestion-btn');
        if (newSuggestionBtn) {
          newSuggestionBtn.addEventListener('click', () => {
            const suggestion = newSuggestionBtn.dataset.suggestion;
            inputField.value = suggestion;
            inputForm.dispatchEvent(new Event('submit', { cancelable: true }));
          });
        }
      },
    },
  };

  // Command palette
  const commandPalette = document.createElement('div');
  commandPalette.className = 'azy-command-palette azy-hidden';
  panel.appendChild(commandPalette);
  let selectedIndex = 0;

  function showCommandPalette(filter) {
    commandPalette.innerHTML = '';
    selectedIndex = 0;
    const matches = Object.entries(COMMANDS).filter(([name]) =>
      name.startsWith(filter.toLowerCase())
    );
    if (matches.length === 0) {
      commandPalette.classList.add('azy-hidden');
      return;
    }
    matches.forEach(([name, cmd]) => {
      const item = document.createElement('div');
      item.className = 'azy-command-item';
      item.innerHTML = `<span class="azy-command-name">/${name}</span><span class="azy-command-desc">${cmd.description}</span>`;
      item.addEventListener('click', () => {
        cmd.handler();
        inputField.value = '';
        hideCommandPalette();
      });
      commandPalette.appendChild(item);
    });
    updateSelection();
    commandPalette.classList.remove('azy-hidden');
  }

  function hideCommandPalette() {
    commandPalette.classList.add('azy-hidden');
    commandPalette.innerHTML = '';
    selectedIndex = 0;
  }

  function updateSelection() {
    const items = commandPalette.querySelectorAll('.azy-command-item');
    items.forEach((item, i) => {
      item.classList.toggle('azy-command-selected', i === selectedIndex);
    });
  }

  inputField.addEventListener('input', () => {
    const value = inputField.value.trim();
    if (value.startsWith('/')) {
      showCommandPalette(value.slice(1).trim());
    } else {
      hideCommandPalette();
    }
  });

  inputField.addEventListener('keydown', (e) => {
    const items = commandPalette.querySelectorAll('.azy-command-item');
    if (!commandPalette.classList.contains('azy-hidden') && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = items[selectedIndex];
        const cmdName = selectedItem.querySelector('.azy-command-name').textContent.slice(1);
        if (cmdName && COMMANDS[cmdName]) {
          COMMANDS[cmdName].handler();
          inputField.value = '';
          inputField.style.height = 'auto';
          hideCommandPalette();
        }
      } else if (e.key === 'Escape') {
        hideCommandPalette();
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inputForm.dispatchEvent(new Event('submit', { cancelable: true }));
    } else if (e.key === 'Escape') {
      hideCommandPalette();
    }
  });

  function setInputDisabled(disabled) {
    const sendBtn = inputForm.querySelector('.azy-send-btn');
    const settingsBtnEl = inputForm.querySelector('.azy-settings-btn');
    if (sendBtn) sendBtn.disabled = disabled;
    if (settingsBtnEl) settingsBtnEl.disabled = disabled;
    inputField.disabled = disabled;
  }

  async function startStreaming() {
    if (conversationHistory.length === 0) return;
    if (isStreaming) return;

    setInputDisabled(true);

    let settings;
    try {
      const stored = await browser.storage.local.get('azy_settings');
      settings = stored.azy_settings || {};
    } catch (e) {
      console.error('Azy: failed to load settings', e);
      showError('Failed to load settings. Try refreshing the page.');
      setInputDisabled(false);
      return;
    }

    if (!settings.apiKey) {
      showError('Set up your API key in Settings to get started.');
      setInputDisabled(false);
      return;
    }

    if (!settings.url) {
      showError('Set up the API URL in Settings to get started.');
      setInputDisabled(false);
      return;
    }

    if (!settings.modelName) {
      showError('Set up the model name in Settings to get started.');
      setInputDisabled(false);
      return;
    }

    isStreaming = true;
    streamingText = '';
    streamingMessageEl = document.createElement('div');
    streamingMessageEl.className = 'azy-message azy-message-azy azy-streaming-message';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'azy-streaming-content azy-streaming-cursor';
    streamingMessageEl.appendChild(contentDiv);
    chatContent.appendChild(streamingMessageEl);
    chatContent.scrollTop = chatContent.scrollHeight;

    try {
      streamingPort = browser.runtime.connect({ name: 'chat-stream' });

      streamingPort.postMessage({ messages: conversationHistory, settings });

      streamingPort.onMessage.addListener((msg) => {
        if (msg.type === 'chunk') {
          streamingText += msg.text;
          contentDiv.innerHTML = renderMarkdown(streamingText);
          chatContent.scrollTop = chatContent.scrollHeight;
        } else if (msg.type === 'done') {
          finalizeStreaming();
        } else if (msg.type === 'error') {
          abortStreaming();
          const errorMessages = {
            'invalid_api_key': 'Invalid API key. Check your settings.',
            'rate_limited': 'Rate limited. Please try again later.',
            'server_error': 'The AI service encountered an error. Try again.',
            'network_error': 'Connection failed. Check your internet.',
          };
          const errorMsg = errorMessages[msg.error] || msg.message || 'An unexpected error occurred.';
          showError(errorMsg, () => startStreaming());
        }
      });

      streamingPort.onDisconnect.addListener(() => {
        if (isStreaming && !streamingText) {
          abortStreaming();
          if (streamingMessageEl) {
            streamingMessageEl.remove();
            streamingMessageEl = null;
          }
          showError('Connection lost. Retrying...', () => startStreaming());
        }
        streamingPort = null;
      });
    } catch (e) {
      abortStreaming();
      console.error('Azy: streaming connection failed', e);
      showError('Connection failed. Check your internet.', () => startStreaming());
    }
  }

  function finalizeStreaming() {
    isStreaming = false;
    if (streamingMessageEl) {
      const contentDiv = streamingMessageEl.querySelector('.azy-streaming-content');
      if (contentDiv) {
        contentDiv.classList.remove('azy-streaming-cursor');
      }
      streamingMessageEl.dataset.rawText = streamingText;
      streamingMessageEl.style.position = 'relative';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'azy-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy response');
      copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      copyBtn.addEventListener('click', () => {
        const rawText = streamingMessageEl.dataset.rawText;
        navigator.clipboard.writeText(rawText).then(() => {
          const tooltip = document.createElement('span');
          tooltip.className = 'azy-copy-tooltip';
          tooltip.textContent = 'Copied';
          copyBtn.appendChild(tooltip);
          setTimeout(() => {
            tooltip.classList.add('azy-copy-fade');
            setTimeout(() => tooltip.remove(), 300);
          }, 1500);
        }).catch(() => {});
      });
      streamingMessageEl.appendChild(copyBtn);
    }
    conversationHistory.push({ role: 'assistant', content: streamingText });
    streamingMessageEl = null;
    streamingText = '';
    setInputDisabled(false);
  }

  function abortStreaming() {
    isStreaming = false;
    if (streamingPort) {
      try { streamingPort.disconnect(); } catch (e) {}
      streamingPort = null;
    }
    if (streamingMessageEl) {
      streamingMessageEl.remove();
      streamingMessageEl = null;
    }
    streamingText = '';
    setInputDisabled(false);
  }

  function startEditing(messageIndex) {
    if (isStreaming) return;
    if (editingMessageIndex !== null) return;

    const userMsg = conversationHistory[messageIndex];
    if (!userMsg || userMsg.role !== 'user') return;

    editingMessageIndex = messageIndex;
    editingOriginalContent = userMsg.content;

    const msgElements = chatContent.querySelectorAll('.azy-message-user');
    const msg = msgElements[messageIndex];
    if (!msg) return;

    msg.classList.add('azy-message-editing');
    const wrapper = msg.querySelector('.azy-message-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'azy-edit-textarea';
    textarea.value = userMsg.content;
    textarea.rows = 3;
    wrapper.appendChild(textarea);

    const actions = document.createElement('div');
    actions.className = 'azy-edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'azy-edit-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => saveEditing());

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'azy-edit-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => cancelEditing());

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    wrapper.appendChild(actions);

    textarea.focus();
    textarea.select();

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    });
  }

  function saveEditing() {
    if (editingMessageIndex === null) return;

    const msgElements = chatContent.querySelectorAll('.azy-message-user');
    const msg = msgElements[editingMessageIndex];
    if (!msg) {
      cancelEditing();
      return;
    }

    const textarea = msg.querySelector('.azy-edit-textarea');
    if (!textarea) {
      cancelEditing();
      return;
    }

    const newText = textarea.value.trim();
    if (!newText) {
      textarea.style.borderColor = '#ff6b6b';
      return;
    }

    const editedIndex = editingMessageIndex;

    conversationHistory = conversationHistory.slice(0, editedIndex + 1);
    conversationHistory[editedIndex].content = newText;

    const allMessages = chatContent.querySelectorAll('.azy-message');
    for (let i = allMessages.length - 1; i > editedIndex; i--) {
      allMessages[i].remove();
    }

    msg.classList.remove('azy-message-editing');
    const wrapper = msg.querySelector('.azy-message-wrapper');
    if (wrapper) {
      wrapper.innerHTML = '';
      const textSpan = document.createElement('span');
      textSpan.textContent = newText;
      wrapper.appendChild(textSpan);

      const editBtn = document.createElement('button');
      editBtn.className = 'azy-edit-btn';
      editBtn.setAttribute('aria-label', 'Edit message');
      editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
      editBtn.addEventListener('click', () => {
        const msgElements = chatContent.querySelectorAll('.azy-message-user');
        const allUserMsgs = Array.from(msgElements);
        const idx = allUserMsgs.indexOf(msg);
        if (idx >= 0) {
          startEditing(idx);
        }
      });
      wrapper.appendChild(editBtn);
    }

    editingMessageIndex = null;
    editingOriginalContent = null;

    chatContent.scrollTop = chatContent.scrollHeight;

    startStreaming();
  }

  function cancelEditing() {
    if (editingMessageIndex === null) return;

    const msgElements = chatContent.querySelectorAll('.azy-message-user');
    const msg = msgElements[editingMessageIndex];
    if (msg) {
      msg.classList.remove('azy-message-editing');
      const wrapper = msg.querySelector('.azy-message-wrapper');
      if (wrapper) {
        const textSpan = wrapper.querySelector('span');
        if (textSpan) {
          textSpan.textContent = editingOriginalContent;
        }
        const existingEditBtn = wrapper.querySelector('.azy-edit-btn');
        if (!existingEditBtn) {
          const editBtn = document.createElement('button');
          editBtn.className = 'azy-edit-btn';
          editBtn.setAttribute('aria-label', 'Edit message');
          editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
          editBtn.addEventListener('click', () => {
            const msgElements = chatContent.querySelectorAll('.azy-message-user');
            const allUserMsgs = Array.from(msgElements);
            const idx = allUserMsgs.indexOf(msg);
            if (idx >= 0) {
              startEditing(idx);
            }
          });
          wrapper.appendChild(editBtn);
        }
      }
    }

    editingMessageIndex = null;
    editingOriginalContent = null;
  }

  async function sendToAPI(retryCount) {
    if (conversationHistory.length === 0) return;

    let settings;
    try {
      const stored = await browser.storage.local.get('azy_settings');
      settings = stored.azy_settings || {};
    } catch (e) {
      console.error('Azy: failed to load settings', e);
      showError('Failed to load settings. Try refreshing the page.');
      return;
    }

    if (!settings.apiKey) {
      showError('Set up your API key in Settings to get started.');
      return;
    }

    if (!settings.url) {
      showError('Set up the API URL in Settings to get started.');
      return;
    }

    if (!settings.modelName) {
      showError('Set up the model name in Settings to get started.');
      return;
    }

    const loading = showLoading();

    try {
      const response = await browser.runtime.sendMessage({
        type: 'chat',
        messages: conversationHistory,
        settings,
      });

      removeLoading();

      if (response.error) {
        const errorMessages = {
          'invalid_api_key': 'Invalid API key. Check your settings.',
          'rate_limited': 'Rate limited. Please try again later.',
          'server_error': 'The AI service encountered an error. Try again.',
          'network_error': 'Connection failed. Check your internet.',
        };
        const errorMsg = errorMessages[response.error] || response.message || 'An unexpected error occurred.';
        showError(errorMsg, () => startStreaming());
      } else {
        addMessage(response.data, 'azy');
        conversationHistory.push({ role: 'assistant', content: response.data });
      }
    } catch (e) {
      removeLoading();
      console.error('Azy: message send failed', e);
      showError('Connection failed. Check your internet.', () => startStreaming());
    }
  }

  async function handleSubmit() {
    const query = inputField.value.trim();
    if (!query) return;
    if (isStreaming) return;

    hideCommandPalette();

    if (query.startsWith('/')) {
      const cmdName = query.slice(1).trim().toLowerCase();
      if (COMMANDS[cmdName]) {
        COMMANDS[cmdName].handler();
        inputField.value = '';
        return;
      }
      showError(`Unknown command: ${cmdName}`);
      inputField.value = '';
      return;
    }

    inputField.value = '';
    lastUserMessage = query;
    addMessage(query, 'user');

    if (conversationHistory.length === 0) {
      const transcript = await getTranscriptForVideo();
      if (!transcript) {
        showError('This video doesn\'t have a transcript available.');
        return;
      }
      conversationHistory.push({
        role: 'system',
        content: 'You are Azy, a video summarization and Q&A assistant. You help users understand YouTube videos by answering questions based on the provided transcript. Be concise, helpful, and reference timestamps when relevant.\n\nVideo transcript:\n' + transcript,
      });
    }

    conversationHistory.push({ role: 'user', content: query });

    await startStreaming();
  }

  inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleSubmit();
  });

  const suggestionBtn = panel.querySelector('.azy-suggestion-btn');
  if (suggestionBtn) {
    suggestionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const suggestion = suggestionBtn.dataset.suggestion;
      inputField.value = suggestion;
      handleSubmit();
    });
  }

  return {
    panel,
    show,
    hide,
    addMessage,
    showError,
  };
}
