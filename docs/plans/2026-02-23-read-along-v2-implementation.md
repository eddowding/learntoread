# Read Along v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Evolve the single-story POC into a multi-story reader with page/teleprompter modes, adjustable font size, and PWA support.

**Architecture:** Single `index.html` + `app.js` + `sw.js`, no build step. JS-driven navigation between selection screen and reading view. Two rendering modes share the same word-matching engine. All CSS inline in `index.html`.

**Tech Stack:** Vanilla JS, Web Speech API, CSS animations, Service Worker API.

**Note:** No test framework — this is a static vanilla JS POC. Each task ends with manual browser verification and a commit.

---

### Task 1: Story Data Structure

Replace the single `STORY` constant with a `STORIES` array containing 3 stories.

**Files:**
- Modify: `app.js:1-10` (replace STORY constant)

**Step 1: Replace STORY constant with STORIES array**

Replace lines 1-10 of `app.js` with:

```javascript
// --- Story data ---
const STORIES = [
  {
    id: 'little-cat',
    title: 'The Little Cat',
    text: `The sun came up over the hill.
A little cat sat on the wall.
The cat saw a bird in the tree.
The bird sang a happy song.
The cat wanted to play.
But the bird flew up high.
So the cat went home.
And had a long nap in the sun.
The end.`
  },
  {
    id: 'brave-boat',
    title: 'The Brave Little Boat',
    text: `A small red boat sat by the shore.
The waves were big and the wind was strong.
But the little boat wanted to sail.
It pushed out into the water.
The waves splashed over the side.
The boat rocked left and right.
But it did not stop.
It sailed past the rocks.
It sailed past the seagulls.
It sailed all the way to the island.
The little boat was brave.
And the island was beautiful.
The end.`
  },
  {
    id: 'star-collector',
    title: 'The Star Collector',
    text: `Every night a girl named Lily looked up at the stars.
She wished she could hold one in her hand.
One night a star fell from the sky.
It landed softly in the garden.
Lily ran outside in her slippers.
The star was warm and glowed like gold.
She picked it up very gently.
It hummed a tiny song.
Lily put the star in a glass jar.
The jar lit up her whole room.
The next night two more stars fell.
Lily gave one to her brother.
And one to the old lady next door.
Soon everyone in the village had a star.
The sky did not mind at all.
It just made more.
The end.`
  }
];

let currentStory = null;
```

**Step 2: Update all references to STORY**

In `renderStory()` (line 44), change `STORY.split('\n')` to `currentStory.text.split('\n')`.

**Step 3: Verify**

Open `index.html` in browser. It will be broken (no story selected yet) — that's expected. Check console for no syntax errors.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: replace single STORY with STORIES array of 3 stories"
```

---

### Task 2: HTML Restructure — Selection Screen + Reading View + Toolbar

Add the story selection screen, restructure the reading view with a top toolbar and bottom-pinned controls.

**Files:**
- Modify: `index.html` (full rewrite of `<body>` and `<style>`)

**Step 1: Rewrite index.html**

Replace the entire `index.html` with the new structure. Key sections:

1. **`#selection-screen`** — Title, subtitle, 3 story cards (each with title + preview line)
2. **`#reading-screen`** (hidden by default) containing:
   - **`#toolbar`** — Back button (left), font A-/A+ (center), mode toggle (right)
   - **`#story-title`** — Story title displayed above text
   - **`#story-container`** — The reading area (existing, but now wrapped for pagination)
   - **`#page-indicator`** — "Page 1 of 3" (hidden in teleprompter mode)
   - **`#controls`** — Start/Stop/Reset pinned to bottom
   - **`#debug`** — Debug pre (kept for dev)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Read Along</title>
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#4a90d9">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <style>
    /* ... full CSS — see step 2 ... */
  </style>
</head>
<body>
  <!-- Selection Screen -->
  <div id="selection-screen" class="screen active">
    <h1>Read Along</h1>
    <p class="subtitle">Pick a story and read it aloud</p>
    <div id="story-list"></div>
  </div>

  <!-- Reading Screen -->
  <div id="reading-screen" class="screen">
    <div id="toolbar">
      <button id="back-btn" aria-label="Back to stories">&larr;</button>
      <div id="font-controls">
        <button id="font-down" aria-label="Smaller text">A-</button>
        <button id="font-up" aria-label="Larger text">A+</button>
      </div>
      <button id="mode-toggle" aria-label="Toggle reading mode">Page</button>
    </div>

    <h2 id="story-title"></h2>

    <div id="page-wrapper">
      <div id="story-container"></div>
    </div>

    <div id="page-indicator"></div>

    <div id="controls">
      <button id="start-btn">Start Reading</button>
      <p id="status"></p>
      <button id="reset-btn" style="display:none">Start Over</button>
    </div>
  </div>

  <pre id="debug" style="max-width:600px;width:100%;font-size:0.75rem;color:#999;margin-top:1rem;white-space:pre-wrap;word-break:break-all;"></pre>
  <script src="app.js"></script>
</body>
```

**Step 2: Write complete CSS**

The full CSS should include all styles from the original plus new ones for:
- Screen switching (`.screen { display: none; } .screen.active { display: flex; }`)
- Story cards grid
- Toolbar (fixed top, flexbox, 44px buttons)
- Bottom controls (fixed bottom with `padding-bottom: env(safe-area-inset-bottom)`)
- Page wrapper (for pagination overflow control)
- Font size applied directly via JS on `#story-container`
- Page mode background (subtle CSS noise/texture using repeating-linear-gradient)
- Teleprompter mode (centered scroll container with fade edges)
- Page-turn animation (`@keyframes pageTurn`)
- Page indicator styling

**Step 3: Verify**

Open in browser — selection screen should show, reading screen hidden. Cards won't work yet (JS not wired). Visual check only.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: restructure HTML with selection screen, toolbar, and bottom controls"
```

---

### Task 3: Story Selection + Navigation Logic

Wire up the selection screen to reading view navigation and story card rendering.

**Files:**
- Modify: `app.js` — rewrite `init()`, add `showScreen()`, `selectStory()`, `renderStoryList()`

**Step 1: Add screen navigation functions**

```javascript
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function renderStoryList() {
  const list = document.getElementById('story-list');
  list.textContent = '';
  STORIES.forEach(story => {
    const card = document.createElement('button');
    card.classList.add('story-card');

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('story-card-title');
    titleSpan.textContent = story.title;
    card.appendChild(titleSpan);

    const previewSpan = document.createElement('span');
    previewSpan.classList.add('story-card-preview');
    previewSpan.textContent = story.text.split('\n')[0];
    card.appendChild(previewSpan);

    card.addEventListener('click', () => selectStory(story));
    list.appendChild(card);
  });
}

function selectStory(story) {
  currentStory = story;
  document.getElementById('story-title').textContent = story.title;
  currentWordIndex = 0;
  matchedSpokenCount = 0;
  renderStory();
  updateButton();
  document.getElementById('start-btn').style.display = '';
  document.getElementById('reset-btn').style.display = 'none';
  document.getElementById('status').textContent = '';
  showScreen('reading-screen');
}
```

**Step 2: Rewrite init()**

```javascript
function init() {
  renderStoryList();
  setupControls();
  checkSpeechSupport();
  loadPreferences();
}
```

**Step 3: Add back button handler in setupControls()**

```javascript
document.getElementById('back-btn').addEventListener('click', () => {
  stopListening();
  showScreen('selection-screen');
});
```

**Step 4: Verify**

Open in browser. Story cards should render. Clicking a card should show the reading screen with that story's text. Back button returns to selection. Start reading and verify speech recognition still works.

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add story selection screen and navigation"
```

---

### Task 4: Font Size Control

Add A-/A+ buttons that cycle through preset font sizes, persisted in localStorage.

**Files:**
- Modify: `app.js` — add font size state + handlers

**Step 1: Add font size constants and state**

```javascript
const FONT_SIZES = [
  { label: 'S', size: '1.2rem', lineHeight: '2.2' },
  { label: 'M', size: '1.5rem', lineHeight: '2.4' },
  { label: 'L', size: '1.9rem', lineHeight: '2.6' },
  { label: 'XL', size: '2.4rem', lineHeight: '2.8' }
];
let fontSizeIndex = 1; // default M
```

**Step 2: Add font size functions**

```javascript
function applyFontSize() {
  const fs = FONT_SIZES[fontSizeIndex];
  const container = document.getElementById('story-container');
  container.style.fontSize = fs.size;
  container.style.lineHeight = fs.lineHeight;
  localStorage.setItem('readAlong_fontSize', fontSizeIndex);
}

function loadPreferences() {
  const saved = localStorage.getItem('readAlong_fontSize');
  if (saved !== null) fontSizeIndex = parseInt(saved, 10);
  applyFontSize();
}
```

**Step 3: Wire up buttons in setupControls()**

```javascript
document.getElementById('font-down').addEventListener('click', () => {
  if (fontSizeIndex > 0) { fontSizeIndex--; applyFontSize(); }
});
document.getElementById('font-up').addEventListener('click', () => {
  if (fontSizeIndex < FONT_SIZES.length - 1) { fontSizeIndex++; applyFontSize(); }
});
```

**Step 4: Call `applyFontSize()` in `selectStory()` too**

After rendering the story, call `applyFontSize()` to ensure the current size is applied.

**Step 5: Verify**

Open in browser. Select a story. Tap A-/A+ and confirm font size changes. Reload and confirm size persists.

**Step 6: Commit**

```bash
git add app.js
git commit -m "feat: add adjustable font size with localStorage persistence"
```

---

### Task 5: Teleprompter Mode

Refine the existing scroll-to-center behavior into a proper teleprompter mode with smooth centering and edge fading.

**Files:**
- Modify: `index.html` — add teleprompter-specific CSS
- Modify: `app.js` — update `advanceTo()` for teleprompter centering

**Step 1: Add teleprompter CSS**

In `index.html`, add CSS for when `body.teleprompter-mode` is active:
- `#page-wrapper` gets `overflow-y: auto`, fixed height (calc `100vh - toolbar - controls`), scroll-snap or smooth scroll
- Fade mask on top/bottom edges using `mask-image: linear-gradient(transparent, black 15%, black 85%, transparent)`
- `#page-indicator` hidden

**Step 2: Update advanceTo() for mode-aware scrolling**

```javascript
function advanceTo(newIndex) {
  for (let i = currentWordIndex; i < newIndex && i < wordElements.length; i++) {
    wordElements[i].classList.remove('upcoming');
    wordElements[i].classList.add('spoken');
  }
  currentWordIndex = newIndex;

  if (currentWordIndex < wordElements.length) {
    if (readingMode === 'teleprompter') {
      scrollToCenter(wordElements[currentWordIndex]);
    }
    // Page mode scrolling handled in Task 6
  }

  if (currentWordIndex >= wordElements.length) {
    storyComplete();
  }
}
```

**Step 3: Add scrollToCenter function**

```javascript
function scrollToCenter(el) {
  const wrapper = document.getElementById('page-wrapper');
  const elRect = el.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const targetScroll = wrapper.scrollTop + (elRect.top - wrapperRect.top) - (wrapperRect.height / 2) + (elRect.height / 2);
  wrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
}
```

**Step 4: Verify**

Set mode to teleprompter (hardcode for now). Read aloud — current word should stay vertically centered with smooth scrolling. Fade edges visible at top/bottom.

**Step 5: Commit**

```bash
git add app.js index.html
git commit -m "feat: add teleprompter mode with centered scrolling and edge fading"
```

---

### Task 6: Page Mode with Pagination and Page-Turn Animation

Implement text pagination that fits words to the visible page area, with a page-turn CSS animation when advancing to the next page.

**Files:**
- Modify: `app.js` — add pagination logic, page-turn trigger
- Modify: `index.html` — add page-turn animation CSS

**Step 1: Add pagination state**

```javascript
let pages = [];        // array of { start, end } word index ranges
let currentPage = 0;
```

**Step 2: Add paginate function**

After rendering all word spans, measure which words fit in the visible container height:

```javascript
function paginate() {
  if (readingMode !== 'page') return;
  const wrapper = document.getElementById('page-wrapper');
  const wrapperHeight = wrapper.clientHeight;
  pages = [];
  let pageStart = 0;

  // Show all words to measure
  wordElements.forEach(el => el.style.display = '');
  document.querySelectorAll('.sentence-break').forEach(el => el.style.display = '');

  for (let i = 0; i < wordElements.length; i++) {
    const elBottom = wordElements[i].offsetTop + wordElements[i].offsetHeight;
    const pageTop = wordElements[pageStart].offsetTop;
    if (elBottom - pageTop > wrapperHeight && i > pageStart) {
      pages.push({ start: pageStart, end: i - 1 });
      pageStart = i;
    }
  }
  pages.push({ start: pageStart, end: wordElements.length - 1 });

  showPage(currentPage);
}
```

**Step 3: Add showPage function**

```javascript
function showPage(pageNum) {
  if (pageNum < 0 || pageNum >= pages.length) return;
  currentPage = pageNum;
  const page = pages[pageNum];

  wordElements.forEach((el, i) => {
    el.style.display = (i >= page.start && i <= page.end) ? '' : 'none';
  });

  updatePageIndicator();
}

function updatePageIndicator() {
  const indicator = document.getElementById('page-indicator');
  if (readingMode === 'page' && pages.length > 1) {
    indicator.textContent = 'Page ' + (currentPage + 1) + ' of ' + pages.length;
    indicator.style.display = '';
  } else {
    indicator.style.display = 'none';
  }
}
```

**Step 4: Add page-turn animation CSS**

```css
@keyframes pageFlipOut {
  0% { transform: perspective(800px) rotateY(0); opacity: 1; }
  100% { transform: perspective(800px) rotateY(-15deg); opacity: 0; }
}

@keyframes pageFlipIn {
  0% { transform: perspective(800px) rotateY(15deg); opacity: 0; }
  100% { transform: perspective(800px) rotateY(0); opacity: 1; }
}

.page-turning-out {
  animation: pageFlipOut 0.3s ease-in forwards;
}

.page-turning-in {
  animation: pageFlipIn 0.3s ease-out forwards;
}
```

**Step 5: Trigger page turn in advanceTo()**

In page mode, when `currentWordIndex` exceeds the current page's end index:

```javascript
if (readingMode === 'page' && pages.length > 0) {
  const page = pages[currentPage];
  if (currentWordIndex > page.end && currentPage < pages.length - 1) {
    triggerPageTurn(currentPage + 1);
  }
}
```

```javascript
function triggerPageTurn(nextPage) {
  const container = document.getElementById('story-container');
  container.classList.add('page-turning-out');
  setTimeout(() => {
    showPage(nextPage);
    container.classList.remove('page-turning-out');
    container.classList.add('page-turning-in');
    setTimeout(() => container.classList.remove('page-turning-in'), 300);
  }, 300);
}
```

**Step 6: Call paginate() after renderStory() and after font size changes**

In `selectStory()` and `applyFontSize()`, call `paginate()` after a short delay:

```javascript
requestAnimationFrame(() => paginate());
```

**Step 7: Verify**

Select a longer story. In page mode, text should be paginated. Read through — when you pass the last word on a page, the page-turn animation should play and the next page appears. Page indicator shows correctly.

**Step 8: Commit**

```bash
git add app.js index.html
git commit -m "feat: add page mode with pagination and page-turn animation"
```

---

### Task 7: Mode Toggle

Wire up the mode toggle button to switch between page and teleprompter modes.

**Files:**
- Modify: `app.js` — add mode state, toggle logic, localStorage persistence

**Step 1: Add mode state**

```javascript
let readingMode = 'page'; // 'page' or 'teleprompter'
```

**Step 2: Add mode toggle function**

```javascript
function toggleMode() {
  readingMode = readingMode === 'page' ? 'teleprompter' : 'page';
  applyMode();
  localStorage.setItem('readAlong_mode', readingMode);
}

function applyMode() {
  const btn = document.getElementById('mode-toggle');
  btn.textContent = readingMode === 'page' ? 'Page' : 'Scroll';
  btn.title = readingMode === 'page' ? 'Switch to teleprompter' : 'Switch to page mode';

  document.body.classList.toggle('page-mode', readingMode === 'page');
  document.body.classList.toggle('teleprompter-mode', readingMode === 'teleprompter');

  if (readingMode === 'page') {
    // Show all words then repaginate
    wordElements.forEach(el => el.style.display = '');
    requestAnimationFrame(() => paginate());
  } else {
    // Show all words, no pagination
    wordElements.forEach(el => el.style.display = '');
    pages = [];
    updatePageIndicator();
    // Scroll current word to center
    if (currentWordIndex < wordElements.length) {
      scrollToCenter(wordElements[currentWordIndex]);
    }
  }
}
```

**Step 3: Wire up in setupControls()**

```javascript
document.getElementById('mode-toggle').addEventListener('click', toggleMode);
```

**Step 4: Load saved mode in loadPreferences()**

```javascript
const savedMode = localStorage.getItem('readAlong_mode');
if (savedMode) readingMode = savedMode;
```

Call `applyMode()` after selecting a story.

**Step 5: Verify**

Select a story. Toggle between modes — page mode should paginate, teleprompter should scroll-center. Mode persists across reload.

**Step 6: Commit**

```bash
git add app.js
git commit -m "feat: add page/teleprompter mode toggle with localStorage"
```

---

### Task 8: Page Mode Visual Polish — Paper Texture

Add the textbook/book-like visual treatment for page mode and dark theme for teleprompter.

**Files:**
- Modify: `index.html` — add page-mode specific CSS

**Step 1: Add page-mode background and styling**

```css
body.page-mode #page-wrapper {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1.8em,
      rgba(0,0,0,0.02) 1.8em,
      rgba(0,0,0,0.02) 1.85em
    ),
    linear-gradient(135deg, #faf8f2 0%, #f5f0e6 50%, #faf8f2 100%);
  border: 1px solid #e8e0d0;
  border-radius: 4px;
  box-shadow:
    2px 2px 8px rgba(0,0,0,0.06),
    inset 0 0 40px rgba(0,0,0,0.02);
  padding: 2rem 2.5rem;
}

body.teleprompter-mode #page-wrapper {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 2rem;
}

body.teleprompter-mode .word.upcoming {
  color: #e0e0e0;
}

body.teleprompter-mode .word.spoken {
  background: rgba(74, 144, 217, 0.3);
  color: #7ec8e3;
}
```

**Step 2: Verify**

Toggle between modes — page mode should look like a book page, teleprompter should have dark background with high-contrast text.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add paper texture for page mode, dark theme for teleprompter"
```

---

### Task 9: PWA — Service Worker + Icons

Add a service worker for offline caching and generate placeholder icons.

**Files:**
- Create: `sw.js`
- Create: `icon-192.svg` (or `.png`)
- Create: `icon-512.svg` (or `.png`)
- Modify: `index.html` — register service worker
- Modify: `manifest.json` — update icon paths if needed

**Step 1: Create sw.js**

```javascript
const CACHE_NAME = 'read-along-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});
```

**Step 2: Register service worker in index.html**

Add before `</body>`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

**Step 3: Generate placeholder icons**

Create SVG icons (simpler, no ImageMagick dependency):

`icon-192.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#4a90d9"/>
  <text x="96" y="130" text-anchor="middle" font-family="Georgia,serif" font-size="120" fill="white">R</text>
</svg>
```

`icon-512.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#4a90d9"/>
  <text x="256" y="345" text-anchor="middle" font-family="Georgia,serif" font-size="320" fill="white">R</text>
</svg>
```

Update `manifest.json` to reference SVG icons (or convert to PNG using canvas if SVG icons aren't supported by the target platform — check and decide at implementation time).

**Step 4: Verify**

Serve locally (`npx serve .`), open in Chrome. Check DevTools > Application > Service Workers (registered). Application > Manifest (icons shown). Toggle offline in Network tab — app should still load.

**Step 5: Commit**

```bash
git add sw.js icon-192.svg icon-512.svg index.html manifest.json
git commit -m "feat: add service worker and PWA icons for offline support"
```

---

### Task 10: Mobile Polish + Final Integration

Ensure all touch targets are >= 44px, controls are thumb-friendly, and everything works end-to-end.

**Files:**
- Modify: `index.html` — final CSS tweaks
- Modify: `app.js` — final integration fixes

**Step 1: Audit and fix touch targets**

Ensure all buttons have `min-height: 44px; min-width: 44px`. Story cards should have generous padding. Toolbar buttons spaced with gap.

**Step 2: Add safe-area insets for bottom controls**

```css
#controls {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
```

**Step 3: Handle story completion per mode**

In page mode, the "Well done!" message should appear on the last page. In teleprompter mode, it scrolls into view.

**Step 4: Update storyComplete()**

After showing the completion message, scroll it into view in teleprompter mode:

```javascript
function storyComplete() {
  stopListening();
  document.getElementById('status').textContent = '';
  document.getElementById('start-btn').style.display = 'none';

  const container = document.getElementById('story-container');
  const msg = document.createElement('div');
  msg.classList.add('done-message');
  msg.textContent = 'Well done! You read the whole story!';
  container.appendChild(msg);

  if (readingMode === 'teleprompter') {
    scrollToCenter(msg);
  }
}
```

**Step 5: Full end-to-end verification**

Test on mobile viewport (Chrome DevTools device toolbar):
1. Selection screen renders 3 story cards
2. Tap a card — reading screen with story title
3. Font size A-/A+ works, persists on reload
4. Page mode: text paginated, page-turn animation at end of page, page indicator
5. Teleprompter mode: smooth centering, fade edges
6. Mode toggle switches cleanly mid-story
7. Speech recognition works in both modes
8. "Well done!" at story end
9. Back button returns to selection
10. Reset button works
11. PWA: installable, works offline

**Step 6: Commit**

```bash
git add index.html app.js
git commit -m "feat: mobile polish, safe-area insets, final integration"
```

---

## Task Summary

| # | Task | Key Change |
|---|------|-----------|
| 1 | Story data structure | `STORIES` array with 3 stories |
| 2 | HTML restructure | Selection screen + toolbar + bottom controls |
| 3 | Story selection + nav | Card rendering, screen switching, back button |
| 4 | Font size control | A-/A+ with localStorage |
| 5 | Teleprompter mode | Centered scrolling + fade edges |
| 6 | Page mode + pagination | Word-based pagination + page-turn animation |
| 7 | Mode toggle | Switch page/teleprompter, localStorage |
| 8 | Visual polish | Paper texture, dark teleprompter theme |
| 9 | PWA | Service worker + placeholder icons |
| 10 | Mobile polish | Touch targets, safe areas, final QA |
