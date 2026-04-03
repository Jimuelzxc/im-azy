# Azy Firefox Extension — Design Spec

## Overview

Azy is a Firefox WebExtensions browser extension that provides an AI-powered chat panel on YouTube pages. Users can ask questions about the video they're watching, get summaries, take notes, and more — without leaving the page. The extension scrapes YouTube's built-in transcript panel via DOM interaction and sends it to any OpenAI-compatible LLM API.

---

## Architecture

### Two-Script Model

| Script | Responsibility |
|--------|---------------|
| **Content Script** | UI injection (floating button, chat panel, settings panel), drag/resize, DOM transcript scraping, message rendering |
| **Background Service Worker** | LLM API calls, no CORS restrictions, API key isolation |

Communication via `browser.runtime.sendMessage` / `browser.runtime.onMessage`. Settings and panel state stored in `browser.storage.local`.

---

## Components

### 1. Floating "Ask Azy" Button
- Fixed position, bottom-right of YouTube page
- Dark pill (`#272727`), purple `*` icon, "Ask azy" text
- Font: Inter 14px for text, Roboto Mono 700 for icon
- Click toggles chat panel open/closed
- Hidden when chat panel is open

### 2. Chat Panel
- **Draggable** — drag from header area
- **Resizable** — drag handle at bottom-right corner
- **Persistent** — position and size saved to `browser.storage.local`
- **Header**: "Ask azy about this video." + close (✕) button
- **Content area**: greeting message + suggestion buttons ("summarize the video", etc.)
- **Messages**: user queries right-aligned, Azy responses left-aligned with markdown rendering
- **Input area**: text input + send button (`>`) + settings gear icon
- **Loading state**: "Thinking..." text with pulse animation
- **Styling**: dark theme (`#1e1e1e` panel, `#292929` header, purple accent `#d07cf0`)
- **Font**: Roboto Mono 11-11.5px

### 3. Settings Panel
- Opens as overlay within the chat panel
- **Header**: back arrow, "Settings" title, close button
- **Tabs**: "model" (active), "soon", "soon"
- **Model tab fields**:
  - Model name (text input, e.g. `model/model-2.7`)
  - URL/Endpoint (URL input, e.g. `https://website.ai/api/v1/chat/completions`)
  - API Key (password input)
  - Custom prompts (textarea, optional) — deferred for future use
- Settings saved to `browser.storage.local` on change

### 4. Background Service Worker
- Listens for `chat` messages from content script
- Constructs OpenAI-compatible request
- Calls configured endpoint with `Authorization: Bearer <apiKey>`
- Returns response or error to content script

---

## Data Flow

1. Content script detects YouTube page load
2. Checks `browser.storage.local` for cached transcript keyed by video ID
3. If no cache or new video → scrapes transcript via DOM, caches it
4. User types question → content script sends `{ type: "chat", query, transcript, settings }` to background
5. Background constructs request:
   ```json
   {
     "model": settings.modelName,
     "messages": [
       { "role": "system", "content": "You are Azy, a video summarization assistant..." },
       { "role": "user", "content": "<transcript>\n\nQuestion: <query>" }
     ]
   }
   ```
6. Background fetches from `settings.url` with auth header
7. Response returned to content script → rendered as markdown in chat

---

## Error Handling

| Scenario | User Message |
|----------|-------------|
| No transcript button found | "This video doesn't have a transcript available." |
| Transcript fetch timeout (5s) | "Couldn't load the transcript. Try refreshing the page." |
| No API key configured | "Set up your API key in Settings to get started." |
| API 401 (unauthorized) | "Invalid API key. Check your settings." |
| API 429 (rate limited) | "Rate limited. Please try again later." |
| API 500 (server error) | "The AI service encountered an error. Try again." |
| Network error | "Connection failed. Check your internet." |

---

## Technical Details

### Transcript Fetching
- Auto-clicks `button[aria-label="Show transcript"]`
- Polls for `transcript-segment-view-model` elements every 300ms (5s timeout)
- Scrapes timestamp (`.ytwTranscriptSegmentViewModelTimestamp`) and text (`.yt-core-attributed-string`)
- Closes panel after scraping
- Formats as `[timestamp] text` lines
- Cached per video ID in `browser.storage.local`

### Markdown Rendering
- Responses support basic markdown: bold, italic, lists, code blocks, links
- Lightweight markdown parser (no heavy dependencies)

### Panel Drag & Resize
- Drag: mousedown on header → track delta → update position
- Resize: mousedown on corner handle → track delta → update width/height
- On mouseup: save position/size to `browser.storage.local`
- Constrained to viewport bounds

### URL Change Detection
- `MutationObserver` on `window.location` or polling `window.location.href`
- On URL change: clear cached transcript, reset chat history

---

## File Structure

```
azy/
├── manifest.json
├── background.js
├── content/
│   ├── content.js          # Main content script entry
│   ├── ui/
│   │   ├── floating-button.js
│   │   ├── chat-panel.js
│   │   └── settings-panel.js
│   ├── transcript.js       # DOM transcript scraping
│   ├── styles.css          # All extension styles
│   └── markdown.js         # Lightweight markdown renderer
├── references/
│   ├── button-ask-azy-ui.html
│   ├── chat-panel-ui.html
│   ├── settings-panel-ui.html
│   └── transcript-fetching.md
└── docs/
    └── superpowers/specs/
        └── 2026-04-03-azy-firefox-extension-design.md
```
