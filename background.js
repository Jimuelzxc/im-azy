browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'chat') return;

  const { query, transcript, settings } = message;

  (async () => {
    try {
      const response = await fetch(settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify({
          model: settings.modelName,
          messages: [
            {
              role: 'system',
              content: 'You are Azy, a video summarization and Q&A assistant. You help users understand YouTube videos by answering questions based on the provided transcript. Be concise, helpful, and reference timestamps when relevant.',
            },
            {
              role: 'user',
              content: transcript + '\n\nQuestion: ' + query,
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          sendResponse({ error: 'invalid_api_key', message: 'Invalid API key' });
        } else if (response.status === 429) {
          sendResponse({ error: 'rate_limited', message: 'Rate limited' });
        } else {
          sendResponse({ error: 'server_error', message: 'Server error: ' + response.status });
        }
        return;
      }

      const data = await response.json();
      const reply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : 'No response received.';

      sendResponse({ success: true, data: reply });
    } catch (e) {
      console.error('Azy background: API call failed', e);
      sendResponse({ error: 'network_error', message: e.message });
    }
  })();

  return true;
});
