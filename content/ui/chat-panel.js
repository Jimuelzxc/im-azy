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
        <div class="azy-greeting-icon" aria-hidden="true"></div>
        <p class="azy-greeting-text">Hello! Curious about what you're watching? I'm here to help.</p>
        <div class="azy-suggestion-buttons">
          <button class="azy-suggestion-btn" data-suggestion="summarize the video">summarize the video</button>
        </div>
      </div>
    </main>
    <div class="azy-chat-input-wrapper">
      <form class="azy-chat-input-form">
        <div class="azy-input-top-row">
          <span class="azy-ai-sparkle" aria-hidden="true">*</span>
          <input type="text" placeholder="ask a question..." aria-label="Ask a question" autocomplete="off">
        </div>
        <div class="azy-input-bottom-row">
          <button type="submit" class="azy-send-btn" aria-label="Send message">&gt;</button>
          <button type="button" class="azy-settings-btn" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
    <div class="azy-resize-handle"></div>
  `;

  document.body.appendChild(panel);

  const chatContent = panel.querySelector('.azy-chat-content');
  const inputForm = panel.querySelector('.azy-chat-input-form');
  const inputField = panel.querySelector('input');
  const closeBtn = panel.querySelector('.azy-close-btn');
  const settingsBtn = panel.querySelector('.azy-settings-btn');
  const header = panel.querySelector('.azy-chat-header');
  const resizeHandle = panel.querySelector('.azy-resize-handle');
  const greetingSection = panel.querySelector('.azy-greeting-message');

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
      msg.innerHTML = renderMarkdown(text);
    } else {
      msg.textContent = text;
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

  function showError(message) {
    const err = document.createElement('div');
    err.className = 'azy-error-message';
    err.textContent = message;
    chatContent.appendChild(err);
    chatContent.scrollTop = chatContent.scrollHeight;
  }

  inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = inputField.value.trim();
    if (!query) return;

    inputField.value = '';
    addMessage(query, 'user');

    const transcript = await getTranscriptForVideo();
    if (!transcript) {
      showError('This video doesn\'t have a transcript available.');
      return;
    }

    let settings;
    try {
      const stored = await browser.storage.local.get('azy_settings');
      settings = stored.azy_settings || {};
    } catch (e) {
      console.error('Azy: failed to load settings', e);
      settings = {};
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
        query,
        transcript,
        settings,
      });

      removeLoading();

      if (response.error) {
        const messages = {
          'invalid_api_key': 'Invalid API key. Check your settings.',
          'rate_limited': 'Rate limited. Please try again later.',
          'server_error': 'The AI service encountered an error. Try again.',
          'network_error': 'Connection failed. Check your internet.',
        };
        showError(messages[response.error] || response.message || 'An unexpected error occurred.');
      } else {
        addMessage(response.data, 'azy');
      }
    } catch (e) {
      removeLoading();
      console.error('Azy: message send failed', e);
      showError('Connection failed. Check your internet.');
    }
  });

  const suggestionBtn = panel.querySelector('.azy-suggestion-btn');
  if (suggestionBtn) {
    suggestionBtn.addEventListener('click', () => {
      const suggestion = suggestionBtn.dataset.suggestion;
      inputField.value = suggestion;
      inputForm.dispatchEvent(new Event('submit'));
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
