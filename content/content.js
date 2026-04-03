(function() {
  'use strict';

  const floatingButton = createFloatingButton();
  const chatPanel = createChatPanel(floatingButton);
  window.azyChatPanel = chatPanel;

  floatingButton.addEventListener('click', () => {
    chatPanel.show();
  });

  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      clearTranscriptCache();
    }
  });

  urlObserver.observe(document.body, { childList: true, subtree: true });
})();
