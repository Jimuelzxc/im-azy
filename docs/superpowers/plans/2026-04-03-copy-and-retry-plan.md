# Copy Response & Retry on Error Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add copy-to-clipboard for AI responses and a retry button on error messages in the chat panel.

**Architecture:** Modify `addMessage()` to include a hover-reveal copy button on AI messages, and modify `showError()` to accept an optional retry callback. Track the last user message for retry. All changes are in `chat-panel.js` and `styles.css`.

**Tech Stack:** Vanilla JavaScript, Firefox WebExtensions API, CSS custom properties

---

### Task 1: Add copy button styles to CSS

**Files:**
- Modify: `content/styles.css`

- [ ] **Step 1: Add copy button and tooltip styles**

Add these styles at the end of `content/styles.css` (after line 616):

```css
/* Copy Button */
.azy-copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
  color: var(--azy-text-secondary);
}

.azy-message-azy:hover .azy-copy-btn {
  opacity: 1;
}

.azy-copy-btn:hover {
  color: var(--azy-accent-purple);
}

.azy-copy-btn svg {
  width: 14px;
  height: 14px;
}

.azy-copy-tooltip {
  position: absolute;
  top: -24px;
  right: 0;
  background: #333;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s;
}

.azy-copy-tooltip.azy-copy-fade {
  opacity: 0;
}

/* Retry Button */
.azy-retry-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ff6b6b;
  vertical-align: middle;
  transition: color 0.2s;
}

.azy-retry-btn:hover {
  color: var(--azy-accent-purple);
}

.azy-retry-btn svg {
  width: 14px;
  height: 14px;
}
```

- [ ] **Step 2: Commit**

```bash
git add content/styles.css
git commit -m "Add copy button and retry button styles"
```

---

### Task 2: Add copy button to AI messages

**Files:**
- Modify: `content/ui/chat-panel.js` (lines 186-197, `addMessage` function)

- [ ] **Step 1: Modify `addMessage` to include copy button for AI messages**

Replace the existing `addMessage` function (lines 186-197):

```js
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
      msg.textContent = text;
    }
    chatContent.appendChild(msg);
    chatContent.scrollTop = chatContent.scrollHeight;
    return msg;
  }
```

- [ ] **Step 2: Commit**

```bash
git add content/ui/chat-panel.js
git commit -m "Add copy button to AI messages"
```

---

### Task 3: Add retry functionality to error messages

**Files:**
- Modify: `content/ui/chat-panel.js` (lines 213-219 `showError`, lines 327-414 submit handler)
- Add: `let lastUserMessage = null` variable near `conversationHistory` (line 221)

- [ ] **Step 1: Add `lastUserMessage` tracking variable**

Add after line 221 (`let conversationHistory = [];`):

```js
  let lastUserMessage = null;
```

- [ ] **Step 2: Modify `showError` to accept optional retry callback**

Replace the existing `showError` function (lines 213-219):

```js
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
```

- [ ] **Step 3: Extract API call logic into a reusable function**

Add this new function before the `inputForm.addEventListener('submit', ...)` line (before line 327):

```js
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
        const messages = {
          'invalid_api_key': 'Invalid API key. Check your settings.',
          'rate_limited': 'Rate limited. Please try again later.',
          'server_error': 'The AI service encountered an error. Try again.',
          'network_error': 'Connection failed. Check your internet.',
        };
        const errorMsg = messages[response.error] || response.message || 'An unexpected error occurred.';
        showError(errorMsg, () => sendToAPI((retryCount || 0) + 1));
      } else {
        addMessage(response.data, 'azy');
        conversationHistory.push({ role: 'assistant', content: response.data });
      }
    } catch (e) {
      removeLoading();
      console.error('Azy: message send failed', e);
      showError('Connection failed. Check your internet.', () => sendToAPI((retryCount || 0) + 1));
    }
  }
```

- [ ] **Step 4: Simplify the submit handler to use `sendToAPI`**

Replace the submit handler (lines 327-414) with:

```js
  inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = inputField.value.trim();
    if (!query) return;

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

    await sendToAPI(0);
  });
```

- [ ] **Step 5: Commit**

```bash
git add content/ui/chat-panel.js
git commit -m "Add retry functionality to error messages"
```

---

### Task 4: Verify and test

- [ ] **Step 1: Load the extension in Firefox**

Open Firefox → `about:debugging` → This Firefox → Load Temporary Add-on → Select `manifest.json` from the project root.

- [ ] **Step 2: Test copy button**

1. Navigate to any YouTube video
2. Click "Ask azy" button to open the chat panel
3. Type a message and send it (requires valid API settings)
4. Hover over the AI response — a clipboard icon should appear in the top-right
5. Click the clipboard icon — "Copied" tooltip should appear and fade after 1.5s
6. Paste somewhere to verify the clipboard contains the raw text

- [ ] **Step 3: Test retry button**

1. Set an invalid API URL in settings (e.g., `http://localhost:9999/api`)
2. Send a message
3. An error message should appear with a retry icon (↻) at the end
4. Click the retry icon — loading should appear, then error should reappear
5. Fix the API URL in settings
6. Click retry again — should succeed this time

- [ ] **Step 4: Test edge cases**

1. Copy button should NOT appear on user messages
2. Copy button should NOT appear on error messages
3. Retry button should NOT appear on non-API errors (e.g., "No transcript available")
4. Retry button should NOT appear on settings errors (e.g., "Set up your API key")
5. After `/clear`, no retry should be possible for previous errors
