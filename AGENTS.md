# AGENTS.md — Azy Firefox Extension

## Project Overview

Azy is a Firefox WebExtensions browser extension that adds an AI-powered chat panel on YouTube pages. It scrapes video transcripts via DOM interaction and sends them to any OpenAI-compatible LLM API for summarization and Q&A.

## Commands

### Development
```bash
# Load extension in Firefox for testing
# 1. Open Firefox → about:debugging → This Firefox → Load Temporary Add-on
# 2. Select the manifest.json from the project root

# Watch files for changes (if using a bundler, add later)
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test
npm test -- tests/transcript.test.js  # single test file
```

### Packaging
```bash
npm run build          # Build for production
npm run package        # Create .xpi for submission
```

> Note: Build tooling is not yet set up. Add commands here as tooling is chosen.

## Code Style

### General
- **Language**: Vanilla JavaScript (no TypeScript for now)
- **Indentation**: 2 spaces
- **Quotes**: Single quotes, semicolons required
- **Line length**: 100 characters max
- **Comments**: JSDoc for exported functions, inline comments for non-obvious logic only
- **No emojis** in code or user-facing strings

### Naming Conventions
- **Files**: kebab-case (`chat-panel.js`, `transcript.js`)
- **Variables/Functions**: camelCase (`fetchTranscript`, `panelPosition`)
- **Classes**: PascalCase (`ChatPanel`, `FloatingButton`)
- **CSS Classes**: camelCase (`.chatPanel`, `.floatingButton`) — matches reference designs
- **Constants**: UPPER_SNAKE_CASE (`TRANSCRIPT_POLL_INTERVAL`, `MAX_RETRIES`)

### Imports & Module Structure
- Use ES modules (`import`/`export`) — set `"type": "module"` in manifest if needed
- Content scripts use Firefox WebExtensions API: `browser.runtime.*`, `browser.storage.*`
- Keep files focused — one responsibility per file
- Max ~200 lines per file; split if larger

### Error Handling
- Always catch and surface user-friendly errors in the chat panel
- Never expose raw API errors or stack traces to the user
- Log detailed errors to console for debugging
- Use the error message table from the design spec (`docs/superpowers/specs/`)

### Storage
- Use `browser.storage.local` for all persistence
- Keys: `azy_settings`, `azy_panel_state`, `azy_transcript_cache`
- Read on init, write on change (debounce rapid writes)

### CSS
- All styles in `content/styles.css`
- Use CSS custom properties for theming (`--bg-panel`, `--accent-purple`, etc.)
- Prefix all class names with `azy-` to avoid YouTube CSS conflicts
- Follow the reference designs in `references/` for colors, fonts, spacing

### API Communication
- Content → Background: `browser.runtime.sendMessage({ type, ...payload })`
- Background → Content: resolve the message promise with `{ success, data }` or `{ error, message }`
- Always validate settings exist before making API calls

## Project Structure
```
azy/
├── manifest.json              # Firefox WebExtensions manifest
├── background.js              # Service worker — LLM API calls
├── content/
│   ├── content.js             # Entry point — injects UI
│   ├── ui/
│   │   ├── floating-button.js # "Ask Azy" button
│   │   ├── chat-panel.js      # Draggable/resizable chat panel
│   │   └── settings-panel.js  # Settings overlay
│   ├── transcript.js          # DOM transcript scraping
│   ├── styles.css             # All extension styles
│   └── markdown.js            # Lightweight markdown renderer
├── references/                # Design fidelity HTML files
└── docs/superpowers/specs/    # Design specifications
```

## Key Constraints
- **Firefox only** — use `browser.*` APIs, not `chrome.*`
- **YouTube pages only** — manifest `matches` should target `*://*.youtube.com/*`
- **OpenAI-compatible APIs** — request format follows OpenAI chat completions spec
- **No external dependencies** — keep the extension lightweight
- **Manifest V3** — Firefox supports MV3; use `"manifest_version": 3`
