# Transcript Fetching — Technical Spec

## Overview

Azy fetches the YouTube transcript by interacting with the DOM directly. No external API needed. Works as long as the video has subtitles/captions enabled.

---

## How It Works

### Step 1 — Auto-click "Show Transcript"

YouTube hides the transcript panel by default. We programmatically click the button to open it.

```js
const btn = document.querySelector('button[aria-label="Show transcript"]');
if (btn) btn.click();
```

> The button is inside `ytd-button-renderer` under the video description area.

---

### Step 2 — Wait for Transcript to Load

The transcript panel renders asynchronously. We use a `MutationObserver` or a simple `setTimeout` to wait for the segments to appear.

```js
function waitForTranscript(callback) {
  const interval = setInterval(() => {
    const segments = document.querySelectorAll('transcript-segment-view-model');
    if (segments.length > 0) {
      clearInterval(interval);
      callback(segments);
    }
  }, 300);
}
```

---

### Step 3 — Scrape the DOM

Each transcript segment is a `transcript-segment-view-model` element containing:
- **Timestamp** → `div.ytwTranscriptSegmentViewModelTimestamp`
- **Text** → `span.yt-core-attributed-string`

```js
function scrapeTranscript() {
  const segments = document.querySelectorAll('transcript-segment-view-model');

  return Array.from(segments).map(seg => {
    const time = seg.querySelector('.ytwTranscriptSegmentViewModelTimestamp')?.innerText.trim();
    const text = seg.querySelector('.yt-core-attributed-string')?.innerText.trim();
    return { time, text };
  });
}
```

---

### Step 4 — Close the Panel

After scraping, close the transcript panel so it doesn't interfere with the user's view.

```js
const closeBtn = document.querySelector('button[aria-label="Close transcript"]');
if (closeBtn) closeBtn.click();
```

---

### Step 5 — Format for LLM

Convert the scraped array into a clean string to send as context to the LLM.

```js
function formatTranscript(transcript) {
  return transcript
    .map(s => `[${s.time}] ${s.text}`)
    .join('\n');
}
```

**Output example:**
```
[0:00] Gemma is here. Huge props to Google for continuing to push the frontier of
[0:08] opensource open weights models. I am so happy to say that...
[0:15] company is doing it as consistently as Google is...
```

---

## Full Flow

```js
async function getTranscript() {
  // 1. Open transcript panel
  const showBtn = document.querySelector('button[aria-label="Show transcript"]');
  if (!showBtn) return null; // No transcript available

  showBtn.click();

  // 2. Wait for segments
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const segments = document.querySelectorAll('transcript-segment-view-model');
      if (segments.length > 0) {
        clearInterval(interval);

        // 3. Scrape
        const transcript = Array.from(segments).map(seg => ({
          time: seg.querySelector('.ytwTranscriptSegmentViewModelTimestamp')?.innerText.trim(),
          text: seg.querySelector('.yt-core-attributed-string')?.innerText.trim(),
        }));

        // 4. Close panel
        const closeBtn = document.querySelector('button[aria-label="Close transcript"]');
        if (closeBtn) closeBtn.click();

        // 5. Format and return
        const formatted = transcript.map(s => `[${s.time}] ${s.text}`).join('\n');
        resolve(formatted);
      }
    }, 300);

    // Timeout fallback after 5s
    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, 5000);
  });
}
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No transcript available | `showBtn` is null → return `null` → show error message in chat |
| Transcript takes too long | 5s timeout fallback → return `null` |
| Auto-generated captions | Works the same — YouTube renders them identically in the DOM |
| Multiple languages | YouTube defaults to the first available language — acceptable for now |
