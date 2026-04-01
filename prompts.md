# Azy Extension - Claude Code Prompts

These prompts are designed to be used sequentially with an AI coding assistant (like Claude Code) to build out the Azy Firefox extension according to the project specifications.

### Prompt 1: Initial Setup & Extension Skeleton
```text
We are building "Azy," an AI personal assistant Firefox extension that runs natively on YouTube allowing users to chat about the video using extracted transcripts. 

First, let's set up the core extension architecture. Please create a clean, modular boilerplate for a Manifest V3 Firefox extension. I need:
1. `manifest.json` configured with correct permissions for YouTube (`*://*.youtube.com/*`) and storage.
2. An empty background script.
3. A content script set to inject into YouTube pages.
4. An Options page/script for our settings (API Key, Custom Base URL for OpenAI-compatible models, and Model Name). 
Keep the directory structure clean and ready for immediate development.
```

### Prompt 2: Injecting the "Ask Azy" Button (Phase 1)
```text
Please read the specification file at `Specs/Create a button placeholder “ask azy” and inject into youtube..md`. 

Update our content script to inject a custom "Ask Azy" button seamlessly into the YouTube UI (around the actions menu under the video player). Ensure that the button:
- Monitors the DOM for page navigations in YouTube's Single Page App architecture.
- Adheres to YouTube's design language (dark theme compatible).
- Has a click event listener that will eventually trigger our chat sidebar.
```

### Prompt 3: Building the Chat Panel UI (Phase 2)
```text
Please read the specification file at `Specs/Building the chat panel ui.md`.

Now, build the actual chat panel UI that slides in or toggles when the "Ask Azy" button is clicked. 
Use clean, semantic HTML and vanilla CSS to create a beautiful, dark-themed responsive sidebar. It should include:
- A header area.
- A scrollable message history container.
- An input area fixed at the bottom.
Ensure the CSS is heavily scoped so it does not conflict with YouTube's styles, and wire the visibility toggle to the "Ask Azy" button.
```

### Prompt 4: Transcript Extraction & Chat Logic (Phase 3)
```text
Please read the specification file at `Specs/references/User start asking question and summarized.md` and the main index file `Specs/1. Start Here!!! - Development Order.md`.

We need to extract the YouTube transcript and hook it into our chat UI. Write the JavaScript logic for the content script that reliably:
1. Checks if the transcript is open.
2. If not, attempts to open it via the explicit transcript button or the "More actions" 3-dot menu.
3. Scrapes and concatenates all text segments in the transcript box.
4. Wires up the chat input so that when a user sends a message, it creates an API request to an OpenAI-compatible endpoint using the settings stored in `browser.storage`.
The system prompt for the chat must be: `"${transcript} user is asking question about this video/transcript just answer user also include timestamp."` concatenated with the user's message.
```

### Prompt 5: Settings & State Persistence
```text
Finally, implement the logic for the Options page and state persistence. 
1. Build out the Settings HTML UI to accept an API Key, Custom Base URL (e.g., OpenRouter), and a Model Name, saving these securely to `browser.storage.local`. 
2. Ensure the chat logic in the content script dynamically pulls these credentials for every request.
3. Implement persistent per-video conversation storage. The chat history should be saved locally and keyed intuitively to the YouTube Video ID, so if a user reloads the page or comes back later, their specific conversation for that video is restored.
```
