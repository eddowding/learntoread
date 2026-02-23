# Read Along v2 — Design

## Summary

Evolve the Read Along POC from a single hardcoded story into a richer proof-of-concept with multiple stories, two reading modes, adjustable font size, and PWA readiness. Still vanilla JS, no build step.

## Story Selection Screen

- Landing page with 3 story cards (title + first line preview)
- Tap a card to start reading
- Back arrow to return to selection from reading view

## Stories

Three original children's stories at increasing levels:

1. **"The Little Cat"** — existing story (simple, 9 lines)
2. **"The Brave Little Boat"** — slightly longer, richer vocabulary (~12-15 lines)
3. **"The Star Collector"** — more adventurous (~15-20 lines)

Stored in a `STORIES` array at the top of `app.js`.

## Two Reading Modes (switchable, default: page)

### Page Mode (default)

- Paper-textured background (CSS), clean serif type, book-like feel
- Text paginated to fit viewport (calculated from font size + container height)
- When last word on a page is spoken, CSS page-turn animation reveals next page
- Page indicator at bottom ("Page 1 of 3")

### Teleprompter Mode

- Container smoothly auto-scrolls to keep current word vertically centered
- Simpler background, high-contrast focus on active line
- Continuous scroll, no pagination

## Font Size Control

- `A-` / `A+` buttons in top toolbar
- 3-4 preset sizes
- Persisted in localStorage
- In page mode, font size change triggers re-pagination

## Controls

- Start/Stop/Continue/Reset — same flow as current
- Pinned to bottom of screen (thumb-friendly on mobile)
- Mode toggle (page/teleprompter) in top-right
- Font size buttons in top toolbar

## PWA & Mobile

- Service worker for offline caching
- Placeholder icons (solid colour + letter "R")
- Responsive: phone portrait + tablet landscape
- Touch targets >= 44px, no hover-dependent UI

## Architecture

- Single `index.html` + `app.js` + inline CSS (no build step)
- JS-driven navigation: show/hide sections (selection vs reading)
- Story data in `STORIES` array
- Existing speech recognition and fuzzy matching logic preserved
