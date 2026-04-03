# Azy — Product Requirements Document

> "Like having a genius friend watch the video with you."

---

## The Problem

Most people are too lazy to watch a full video. They want the summary, the key points, and the ability to ask questions — without sitting through the whole thing.

---

## What Is Azy?

Azy is a Firefox browser extension that lets you chat with an AI about any video you're watching — in real time. Ask for a summary, ask what just happened, take notes, or just chat about the content. The AI already watched it for you.

**The name:** Lazy → remove the L → **Azy**.

---

## Core Features

### 1. Floating Chat Button
- A floating button sits at the **bottom-right** of the screen on video pages
- Clicking it opens the Azy chat panel

### 2. Chat Panel
- Opens as a **side panel** on the screen
- **Draggable** — user can move it anywhere on screen
- **Resizable** — user can resize it to their liking
- Stays on top while the video plays

### 3. AI Chat (The Main Feature)
The user can:
- Ask for a **video summary** (on demand — not automatic)
- Ask **"what just happened?"**
- Ask questions about specific parts of the video
- Request **notes** from the video
- Have a back-and-forth conversation about the content

**Chat behavior:**
- No chat history saved — fresh start every video
- Each AI message has a **copy button** (like ChatGPT)
- AI references **clickable timestamps** that jump to that moment in the video
- If a video has no transcript/subtitles, Azy shows a friendly error message

### 4. Settings Panel
Accessible from inside the chat panel. Has the following tabs:

**Tab: Model**
| Field | Description |
|-------|-------------|
| Model Name | e.g. `gpt-4o`, `claude-3-5-sonnet` |
| Endpoint / URL | Any OpenAI-compatible API endpoint |
| API Key | User's personal API key |

Supports any **OpenAI-compatible provider** — OpenRouter, OpenAI, Together AI, local models, etc.

---

## UI & UX Reference

Design files are located in `@references/`.

### Layout Overview
```
┌────────────────────────────────────────┐
│                                        │
│           Video Playing                │
│                                        │
│                        ┌────────────┐  │
│                        │            │  │
│                        │  Chat      │  │
│                        │  Panel     │  │
│                        │            │  │
│                        │ [draggable]│  │
│                        │ [resizable]│  │
│                        └────────────┘  │
│                              [Azy 💬]  │
└────────────────────────────────────────┘
```

---

## Transcript Fetching

### Auto-Detection & Opening
When the chat panel loads, Azy automatically tries to get the transcript by:
- Looking for the transcript button in the YouTube player controls
- Clicking the three-dot menu and finding the transcript option
- Waiting for the transcript panel to render in the DOM

### Text Extraction
The `getTranscriptText()` function extracts transcript data by:
- Querying DOM elements (`ytd-transcript-segment-renderer .segment`)
- Parsing timestamps and segment text from the YouTube interface
- Returning cleaned, organized transcript content

### Fallback
If auto-fetch fails, show a prompt asking the user to manually open the transcript from the video menu.

---

## Transcript → LLM Pipeline

### Context Injection
- Full transcript is appended to the system prompt (up to 2000+ characters)
- Transcript is reused across the entire conversation session — no re-fetching per message

### Prompt Building (`buildSystemPrompt()` in `ai-service.js`)
- Detects if a transcript exists
- Extracts timestamp markers from the transcript
- Instructs the LLM to cite timestamps in `[HH:MM:SS]` format
- Timestamps in responses are rendered as clickable links that seek the video

### Message Streaming
- Each request sends: system prompt + conversation history + user message
- LLM response is streamed back and displayed in real time

---

## Technical Notes

- **Platform:** Firefox Extension (Manifest V3)
- **LLM Integration:** OpenAI-compatible API (user-configured)
- **Video Support:** YouTube only
- **Context:** Fetches YouTube transcript via DOM scraping and sends it to the LLM as context. See `@references/transcript-fetching.md` for full implementation spec.
- **Timestamps:** Parsed from transcript, rendered as clickable links that seek the video
- **Storage:** API key and settings stored in `browser.storage.local`
- **No transcript?** Show a message: "This video doesn't have subtitles. Azy can't summarize it."

---

## User Stories

| As a user... | I want to... | So that... |
|---|---|---|
| Watching a long video | Ask for a summary on demand | I don't have to watch the whole thing |
| Missed something | Ask "what just happened?" | I can catch up without rewinding |
| Reading an AI response | Click copy on the message | I can paste it somewhere easily |
| AI mentions a moment | Click the timestamp | I jump straight to that part of the video |
| Using my own AI | Input my own API key + endpoint | I'm not locked into one provider |
| On a small screen | Resize and move the chat panel | It doesn't block the video |

---

## Out of Scope (For Now)

- Chrome support
- Built-in AI key (user brings their own)
- Other video platforms
- Note export
- Chat history between sessions

---

## Success Looks Like

- User clicks the button, asks for a summary, gets it fast
- Timestamps in responses are clickable and jump to the right moment
- Panel is smooth to drag and resize
- Settings save properly between sessions
- Works with OpenRouter and OpenAI out of the box

