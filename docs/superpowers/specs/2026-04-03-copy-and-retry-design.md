# Copy Response & Retry on Error — Design Spec

## Overview

Add two small but practical features to the Azy chat panel:
1. **Copy response** — Copy any AI response to clipboard with a hover-reveal icon
2. **Retry on error** — Retry the last failed message with a single click

---

## Copy Response

### Behavior

- A clipboard icon appears in the top-right corner of each AI message (`azy-message-azy`) on hover
- On click: copies the raw text content of the response to clipboard via `navigator.clipboard.writeText()`
- Shows a brief "Copied" tooltip confirmation that fades after 1.5 seconds
- Icon is hidden by default, visible only on hover to keep the UI clean
- Only applies to AI messages, not user messages

### Implementation

- Modify `addMessage()` in `chat-panel.js` to wrap AI message content in a container that includes the copy button
- The copy button uses a clipboard SVG icon (matching the existing icon style)
- Store the raw text as a `data-raw-text` attribute on the message element to avoid extracting from rendered HTML
- On click:
  1. Read `data-raw-text` from the parent message element
  2. Call `navigator.clipboard.writeText(text)`
  3. Show a "Copied" tooltip (reuse the same element, toggle a class)
  4. Auto-hide after 1.5s via `setTimeout`

### CSS

- `.azy-copy-btn` — positioned absolute, top-right of message, hidden by default
- `.azy-message-azy:hover .azy-copy-btn` — visible on hover
- `.azy-copy-tooltip` — small label below the icon, shown briefly after copy
- Use existing color tokens: `--azy-text-secondary` for icon, `--azy-accent-purple` for hover

---

## Retry on Error

### Behavior

- When an error message appears (API failure, network error), a retry icon (↻) appears at the right end of the error message
- On click: removes the error message, shows "Thinking..." loading state, resends the last user message
- If retry also fails, the error message reappears with the retry button again
- Only retries the most recent failed message — no retry queue or history

### Implementation

- Track the last user message text in a variable: `let lastUserMessage = null`
- Update it on every user message submit (before clearing the input)
- Modify `showError()` to accept an optional `onRetry` callback
- When the error is from an API call, pass a retry handler that:
  1. Removes the error element
  2. Calls `showLoading()`
  3. Resends the same `conversationHistory` to the background worker
  4. On success: removes loading, adds AI response, updates `conversationHistory`
  5. On failure: removes loading, calls `showError()` again with the same retry handler

### Edge Cases

- If the panel is closed and reopened, `lastUserMessage` is lost (in-memory only, consistent with existing behavior)
- Retry only works for the most recent error — if the user sends a new message after an error, the old error is no longer retryable
- No retry button on non-API errors (e.g., "No transcript available") — only on errors that came from the API call path

---

## File Changes

### `content/ui/chat-panel.js`

- Add `lastUserMessage` variable to track the last sent user message
- Modify `addMessage()` to include copy button for AI messages
- Modify `showError()` to accept optional `onRetry` callback and render retry icon
- Update the submit handler to:
  - Store the query in `lastUserMessage` before clearing input
  - Pass a retry callback to `showError()` on API failure
  - The retry callback reuses the existing `conversationHistory` (which already has the user message appended)

### `content/styles.css`

- Add `.azy-copy-btn`, `.azy-copy-btn:hover`, `.azy-copy-tooltip` styles
- Add `.azy-error-message .azy-retry-btn` styles
- Use existing design tokens — no new colors needed

---

## Scope

- In-memory only — no persistence to `browser.storage.local`
- No changes to `background.js` — retry logic is entirely in the content script
- No new permissions required — `navigator.clipboard` is available in content scripts
- Only affects YouTube pages where the extension is active
