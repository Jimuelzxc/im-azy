function createSettingsPanel(chatPanel) {
  const panel = document.createElement('div');
  panel.className = 'azy-settings-panel azy-hidden';
  panel.innerHTML = `
    <header class="azy-settings-header">
      <button class="azy-icon-btn azy-settings-back" aria-label="Go back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1 class="azy-settings-title">Settings</h1>
      <button class="azy-icon-btn azy-settings-close" aria-label="Close settings">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </header>
    <nav class="azy-settings-tabs">
      <button class="azy-tab azy-active" data-tab="model">model</button>
      <button class="azy-tab" data-tab="soon1">soon</button>
      <button class="azy-tab" data-tab="soon2">soon</button>
    </nav>
    <form class="azy-settings-form" data-tab-content="model">
      <div class="azy-form-group">
        <label for="azy-model-name">Model name</label>
        <input type="text" id="azy-model-name" placeholder="eg. model/model-2.7" autocomplete="off">
      </div>
      <div class="azy-form-group">
        <label for="azy-url-endpoint">Url (End point)</label>
        <input type="url" id="azy-url-endpoint" placeholder="eg. https://website.ai/api/v1/chat/completions">
      </div>
      <div class="azy-form-group">
        <label for="azy-api-key">Api Key</label>
        <input type="password" id="azy-api-key" placeholder="eg. AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe" autocomplete="off">
      </div>
      <div class="azy-form-group">
        <label for="azy-custom-prompts">Custom prompts (Optional)</label>
        <textarea id="azy-custom-prompts" placeholder="Enter custom prompts here..."></textarea>
      </div>
    </form>
  `;

  chatPanel.appendChild(panel);

  const backBtn = panel.querySelector('.azy-settings-back');
  const closeBtn = panel.querySelector('.azy-settings-close');
  const modelNameInput = panel.querySelector('#azy-model-name');
  const urlInput = panel.querySelector('#azy-url-endpoint');
  const apiKeyInput = panel.querySelector('#azy-api-key');
  const customPromptsInput = panel.querySelector('#azy-custom-prompts');

  backBtn.addEventListener('click', () => {
    panel.classList.add('azy-hidden');
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.add('azy-hidden');
    if (window.azyChatPanel) window.azyChatPanel.hide();
  });

  let saveTimeout;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const settings = {
        modelName: modelNameInput.value.trim(),
        url: urlInput.value.trim(),
        apiKey: apiKeyInput.value.trim(),
        customPrompts: customPromptsInput.value.trim(),
      };
      try {
        await browser.storage.local.set({ azy_settings: settings });
      } catch (e) {
        console.error('Azy: failed to save settings', e);
      }
    }, 300);
  }

  [modelNameInput, urlInput, apiKeyInput, customPromptsInput].forEach(input => {
    input.addEventListener('input', debouncedSave);
  });

  return {
    panel,
    show: async () => {
      try {
        const stored = await browser.storage.local.get('azy_settings');
        const settings = stored.azy_settings || {};
        modelNameInput.value = settings.modelName || '';
        urlInput.value = settings.url || '';
        apiKeyInput.value = settings.apiKey || '';
        customPromptsInput.value = settings.customPrompts || '';
      } catch (e) {
        console.error('Azy: failed to load settings', e);
      }
      panel.classList.remove('azy-hidden');
    },
    hide: () => {
      panel.classList.add('azy-hidden');
    },
  };
}
