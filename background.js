browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'chat') return;

  const { messages, settings } = message;

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
          messages: messages,
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

browser.runtime.onConnect.addListener((port) => {
  if (port.name !== 'chat-stream') return;

  port.onMessage.addListener(async (msg) => {
    const { messages, settings } = msg;

    try {
      const response = await fetch(settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey,
        },
        body: JSON.stringify({
          model: settings.modelName,
          messages: messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorMap = {
          401: { error: 'invalid_api_key', message: 'Invalid API key' },
          429: { error: 'rate_limited', message: 'Rate limited' },
        };
        const err = errorMap[response.status] || { error: 'server_error', message: 'Server error: ' + response.status };
        port.postMessage({ type: 'error', ...err });
        port.disconnect();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            port.postMessage({ type: 'done' });
            port.disconnect();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta
              ? parsed.choices[0].delta.content
              : null;
            if (content) {
              port.postMessage({ type: 'chunk', text: content });
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }

      port.postMessage({ type: 'done' });
      port.disconnect();
    } catch (e) {
      console.error('Azy background: streaming failed', e);
      port.postMessage({ type: 'error', error: 'network_error', message: 'Connection failed' });
      port.disconnect();
    }
  });
});
