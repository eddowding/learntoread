# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Read Along" — a speech-driven word-highlighting POC for children learning to read. The child reads a story aloud; the Web Speech API (`SpeechRecognition`) transcribes their speech and highlights matching words in real-time.

## Architecture

This is a **static vanilla JS app** with no build step, no framework, and no dependencies:

- `index.html` — Single page with inline CSS. Contains story selection screen, reading screen with controls, and a debug `<pre>` element.
- `app.js` — All application logic in one file:
  - **Story data** — `STORIES` array at the top of the file. Each story has `id`, `title`, and `text` fields.
  - **Story selection** — Renders story cards on the selection screen; tapping a card opens the reading screen.
  - **Story rendering** — Splits story text into `<span class="word">` elements, one per word, with line breaks between sentences.
  - **Speech recognition** — Uses `webkitSpeechRecognition` (continuous + interim results, `en-GB` locale). Auto-restarts up to 10 times; then pauses for user to tap "Continue".
  - **Word matching** — Sequential matching with fuzzy tolerance: exact match, prefix match (≥3 chars on words ≥4), or single-character edit distance. Allows skipping up to 3 words ahead to handle speech recognition gaps.
  - **Reading modes** — Page mode (paginated) and teleprompter mode (smooth scroll). User can toggle between them.
  - **State** — `currentWordIndex` tracks reading position; `matchedSpokenCount` tracks how many spoken words have been processed to avoid re-matching earlier transcript segments.
- `sw.js` — Service worker for PWA offline support. Cache-first strategy. **Bump `CACHE_NAME` version on every deploy** to invalidate stale assets.
- `manifest.json` — PWA manifest (standalone display, references icon-192.svg and icon-512.svg).

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

**Hosted on Cloudflare Pages** (NOT Vercel). Custom domain: `learntoread.eddowding.com`.

- Cloudflare account: `bf14edfa7ee14d061a4739848af35148`
- Project name: `learntoread`
- GitHub integration may not auto-deploy — use manual deploy if needed:
  ```bash
  CLOUDFLARE_ACCOUNT_ID=bf14edfa7ee14d061a4739848af35148 npx wrangler pages deploy . --project-name learntoread --branch main --commit-dirty=true
  ```
- **Important:** After deploying, bump `CACHE_NAME` in `sw.js` so returning users get fresh assets. The SW uses cache-first, so stale caches will serve old files indefinitely without a version bump.

## Key Design Decisions

- **Fuzzy matching** is intentionally lenient to accommodate children's pronunciation and speech API inaccuracies.
- **No auto-restart** after `onend` — earlier versions tried auto-restarting recognition but it caused loops; now the user explicitly resumes after 10 restarts.
- Stories are hardcoded in the `STORIES` array at the top of `app.js`.
