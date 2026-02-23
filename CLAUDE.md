# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Read Along" — a speech-driven word-highlighting POC for children learning to read. The child reads a story aloud; the Web Speech API (`SpeechRecognition`) transcribes their speech and highlights matching words in real-time.

## Architecture

This is a **static vanilla JS app** with no build step, no framework, and no dependencies:

- `index.html` — Single page with inline CSS. Contains the story container, start/stop/reset controls, and a debug `<pre>` element.
- `app.js` — All application logic in one file:
  - **Story rendering** — Splits `STORY` text into `<span class="word">` elements, one per word, with line breaks between sentences.
  - **Speech recognition** — Uses `webkitSpeechRecognition` (continuous + interim results, `en-GB` locale). Auto-pauses on `onend`; user must tap "Continue" to resume.
  - **Word matching** — Sequential matching with fuzzy tolerance: exact match, prefix match (≥3 chars on words ≥4), or single-character edit distance. Allows skipping up to 3 words ahead to handle speech recognition gaps.
  - **State** — `currentWordIndex` tracks reading position; `matchedSpokenCount` tracks how many spoken words have been processed to avoid re-matching earlier transcript segments.
- `manifest.json` — PWA manifest (standalone display, references icon-192.png and icon-512.png which don't exist yet).

## Development

No build tools. Open `index.html` in a browser or serve statically:

```bash
# Local dev server (any static server works)
npx serve .
# or
python3 -m http.server 8000
```

Speech recognition requires HTTPS in production (works on localhost for dev). Chrome or Safari required — Firefox doesn't support `SpeechRecognition`.

## Deployment

Deployed to Vercel as a static site (project: `learntoread`). No framework detection needed — just static file serving. Push to `main` triggers deploy.

## Key Design Decisions

- **Fuzzy matching** is intentionally lenient to accommodate children's pronunciation and speech API inaccuracies.
- **No auto-restart** after `onend` — earlier versions tried auto-restarting recognition but it caused loops; now the user explicitly resumes.
- Story text is hardcoded in `STORY` constant at the top of `app.js`.
