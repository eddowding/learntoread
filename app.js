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

// --- Font size presets ---
const FONT_SIZES = [
  { label: 'S', size: '1.2rem', lineHeight: '2.2' },
  { label: 'M', size: '1.5rem', lineHeight: '2.4' },
  { label: 'L', size: '1.9rem', lineHeight: '2.6' },
  { label: 'XL', size: '2.4rem', lineHeight: '2.8' }
];
let fontSizeIndex = 1; // default M

let currentStory = null;

// --- State ---
let wordElements = [];
let normalizedWords = [];
let currentWordIndex = 0;
let recognition = null;
let isListening = false;

// --- Mode + Pagination state ---
let readingMode = 'page'; // 'page' or 'teleprompter'
let pages = [];
let currentPage = 0;

// --- Debug ---
function debug(msg) {
  const el = document.getElementById('debug');
  const time = new Date().toLocaleTimeString();
  el.textContent = time + ' ' + msg + '\n' + el.textContent.slice(0, 600);
}

function normalize(word) {
  return word.toLowerCase().replace(/[^a-z']/g, '');
}

// --- Font size ---
function applyFontSize() {
  var fs = FONT_SIZES[fontSizeIndex];
  var container = document.getElementById('story-container');
  container.style.fontSize = fs.size;
  container.style.lineHeight = fs.lineHeight;
  localStorage.setItem('readAlong_fontSize', fontSizeIndex);
  // Re-paginate if in page mode
  if (readingMode === 'page' && wordElements.length > 0) {
    requestAnimationFrame(function() { paginate(); });
  }
}

function loadPreferences() {
  var savedSize = localStorage.getItem('readAlong_fontSize');
  if (savedSize !== null) fontSizeIndex = parseInt(savedSize, 10);
  var savedMode = localStorage.getItem('readAlong_mode');
  if (savedMode) readingMode = savedMode;
}

// --- Teleprompter scrolling ---
function scrollToCenter(el) {
  var wrapper = document.getElementById('page-wrapper');
  var elRect = el.getBoundingClientRect();
  var wrapperRect = wrapper.getBoundingClientRect();
  var targetScroll = wrapper.scrollTop + (elRect.top - wrapperRect.top) - (wrapperRect.height / 2) + (elRect.height / 2);
  wrapper.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

// --- Pagination (page mode) ---
function paginate() {
  if (readingMode !== 'page') return;
  var wrapper = document.getElementById('page-wrapper');
  var wrapperHeight = wrapper.clientHeight;
  if (wrapperHeight <= 0) return;

  pages = [];
  var pageStart = 0;

  // Show all words to measure
  wordElements.forEach(function(el) { el.style.display = ''; });
  document.querySelectorAll('.sentence-break').forEach(function(el) { el.style.display = ''; });

  for (var i = 0; i < wordElements.length; i++) {
    var elBottom = wordElements[i].offsetTop + wordElements[i].offsetHeight;
    var pageTop = wordElements[pageStart].offsetTop;
    if (elBottom - pageTop > wrapperHeight && i > pageStart) {
      pages.push({ start: pageStart, end: i - 1 });
      pageStart = i;
    }
  }
  pages.push({ start: pageStart, end: wordElements.length - 1 });

  // Find which page contains currentWordIndex
  var targetPage = 0;
  for (var p = 0; p < pages.length; p++) {
    if (currentWordIndex >= pages[p].start && currentWordIndex <= pages[p].end) {
      targetPage = p;
      break;
    }
  }

  showPage(targetPage);
}

function showPage(pageNum) {
  if (pageNum < 0 || pageNum >= pages.length) return;
  currentPage = pageNum;
  var page = pages[pageNum];
  wordElements.forEach(function(el, i) {
    el.style.display = (i >= page.start && i <= page.end) ? '' : 'none';
  });
  // Also handle sentence breaks - show only those between visible words
  document.querySelectorAll('.sentence-break').forEach(function(br) {
    var prev = br.previousElementSibling;
    var next = br.nextElementSibling;
    if (prev && next && prev.style.display !== 'none' && next.style.display !== 'none') {
      br.style.display = '';
    } else {
      br.style.display = 'none';
    }
  });
  updatePageIndicator();
}

function updatePageIndicator() {
  var indicator = document.getElementById('page-indicator');
  if (readingMode === 'page' && pages.length > 1) {
    indicator.textContent = 'Page ' + (currentPage + 1) + ' of ' + pages.length;
    indicator.style.display = '';
  } else {
    indicator.style.display = 'none';
  }
}

function triggerPageTurn(nextPage) {
  var container = document.getElementById('story-container');
  container.classList.add('page-turning-out');
  setTimeout(function() {
    showPage(nextPage);
    container.classList.remove('page-turning-out');
    container.classList.add('page-turning-in');
    setTimeout(function() { container.classList.remove('page-turning-in'); }, 300);
  }, 300);
}

// --- Mode toggle ---
function toggleMode() {
  readingMode = readingMode === 'page' ? 'teleprompter' : 'page';
  applyMode();
  localStorage.setItem('readAlong_mode', readingMode);
}

function applyMode() {
  var btn = document.getElementById('mode-toggle-btn');
  btn.textContent = readingMode === 'page' ? 'Page' : 'Scroll';
  btn.title = readingMode === 'page' ? 'Switch to teleprompter' : 'Switch to page mode';

  document.body.classList.toggle('page-mode', readingMode === 'page');
  document.body.classList.toggle('teleprompter-mode', readingMode === 'teleprompter');

  if (readingMode === 'page') {
    wordElements.forEach(function(el) { el.style.display = ''; });
    document.querySelectorAll('.sentence-break').forEach(function(el) { el.style.display = ''; });
    requestAnimationFrame(function() { paginate(); });
  } else {
    wordElements.forEach(function(el) { el.style.display = ''; });
    document.querySelectorAll('.sentence-break').forEach(function(el) { el.style.display = ''; });
    pages = [];
    updatePageIndicator();
    if (currentWordIndex < wordElements.length) {
      setTimeout(function() { scrollToCenter(wordElements[currentWordIndex]); }, 100);
    }
  }
}

// --- Screen navigation ---
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function renderStoryList() {
  var list = document.getElementById('story-list');
  list.textContent = '';

  STORIES.forEach(function(story) {
    var card = document.createElement('button');
    card.classList.add('story-card');

    var titleSpan = document.createElement('span');
    titleSpan.classList.add('story-card-title');
    titleSpan.textContent = story.title;
    card.appendChild(titleSpan);

    var previewSpan = document.createElement('span');
    previewSpan.classList.add('story-card-preview');
    previewSpan.textContent = story.text.split('\n')[0];
    card.appendChild(previewSpan);

    card.addEventListener('click', function() {
      selectStory(story);
    });
    list.appendChild(card);
  });
}

function selectStory(story) {
  currentStory = story;
  document.getElementById('story-title').textContent = story.title;
  currentWordIndex = 0;

  renderStory();
  applyFontSize();
  updateButton();
  document.getElementById('start-btn').style.display = '';
  document.getElementById('reset-btn').style.display = 'none';
  document.getElementById('status').textContent = '';
  showScreen('reading-screen');
  applyMode();
}

// --- Initialization ---
function init() {
  loadPreferences();
  renderStoryList();
  setupControls();
  checkSpeechSupport();
}

function renderStory() {
  const container = document.getElementById('story-container');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const lines = currentStory.text.split('\n');
  wordElements = [];
  normalizedWords = [];

  lines.forEach((line, lineIdx) => {
    const words = line.trim().split(/\s+/);
    words.forEach((word) => {
      const span = document.createElement('span');
      span.classList.add('word', 'upcoming');
      span.textContent = word + ' ';
      container.appendChild(span);
      wordElements.push(span);
      normalizedWords.push(normalize(word));
    });

    if (lineIdx < lines.length - 1) {
      const br = document.createElement('span');
      br.classList.add('sentence-break');
      container.appendChild(br);
    }
  });
}

// --- Speech Recognition ---
let restartCount = 0;
let lastResultIndex = 0; // track which results we've permanently processed

function checkSpeechSupport() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('status').textContent = 'Speech recognition not supported. Try Chrome or Safari.';
    document.getElementById('start-btn').disabled = true;
    return false;
  }
  return true;
}

function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  recognition.lang = 'en-GB';

  recognition.onstart = () => {
    restartCount = 0;
    debug('EVENT: onstart');
  };
  recognition.onaudiostart = () => debug('EVENT: onaudiostart');
  recognition.onspeechstart = () => debug('EVENT: onspeechstart');

  recognition.onresult = (event) => {
    // Process each result segment separately
    for (let i = lastResultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      // Collect words from all alternatives for this segment
      const allWords = [];
      for (let a = 0; a < result.length; a++) {
        const words = result[a].transcript.trim().split(/\s+/).map(normalize).filter(w => w.length > 0);
        words.forEach(w => { if (allWords.indexOf(w) === -1) allWords.push(w); });
      }

      if (result.isFinal) {
        // Permanently match final results
        debug('FINAL [' + i + ']: "' + result[0].transcript.trim() + '"');
        matchWordsFromSegment(allWords, true);
        lastResultIndex = i + 1;
      } else {
        // Speculatively match interim results (lookahead)
        debug('INTERIM [' + i + ']: "' + result[0].transcript.trim() + '"');
        matchWordsFromSegment(allWords, false);
      }
    }
  };

  recognition.onerror = (event) => {
    debug('ERROR: ' + event.error);
    if (event.error === 'not-allowed') {
      document.getElementById('status').textContent = 'Microphone access denied.';
      isListening = false;
      updateButton();
    }
  };

  recognition.onend = () => {
    debug('EVENT: onend');
    // Auto-restart if still listening and story not finished
    if (isListening && currentWordIndex < normalizedWords.length) {
      restartCount++;
      if (restartCount < 10) {
        debug('Auto-restarting (' + restartCount + ')...');
        lastResultIndex = 0;
        try { recognition.start(); } catch (e) { debug('Restart failed: ' + e.message); }
      } else {
        document.getElementById('status').textContent = 'Recognition paused. Tap "Continue" to resume.';
        isListening = false;
        updateButton();
      }
    }
  };

  try {
    recognition.start();
    isListening = true;
  
    lastResultIndex = 0;
    updateButton();
    document.getElementById('status').textContent = 'Listening... start reading aloud';
    document.getElementById('reset-btn').style.display = 'inline-block';
    debug('Called recognition.start()');
  } catch (e) {
    debug('START ERROR: ' + e.message);
  }
}

function stopListening() {
  if (recognition) {
    try { recognition.stop(); } catch (e) { /* ignore */ }
    recognition = null;
  }
  isListening = false;
  updateButton();
  document.getElementById('status').textContent = currentWordIndex > 0 ? 'Paused' : '';
}

function updateButton() {
  const btn = document.getElementById('start-btn');
  if (isListening) {
    btn.textContent = 'Stop';
    btn.classList.add('listening');
  } else {
    btn.textContent = currentWordIndex > 0 ? 'Continue Reading' : 'Start Reading';
    btn.classList.remove('listening');
  }
}

// --- Word Matching ---

// Common short words that speech API often confuses
const SHORT_WORD_ALIASES = {
  'a': ['uh', 'ah', 'er'],
  'the': ['duh', 'da', 'de'],
  'i': ['eye', 'ay'],
  'to': ['two', 'too'],
  'in': ['inn', 'an'],
  'it': ['its'],
  'is': ['as'],
  'and': ['an', 'end', 'in'],
  'but': ['butt', 'bat'],
  'so': ['sew'],
  'or': ['oar', 'ore'],
  'had': ['have', 'has'],
  'her': ['are'],
  'one': ['won'],
  'on': ['an']
};

function matchWordsFromSegment(spokenWords, isFinal) {
  if (spokenWords.length === 0) return;

  const maxSkip = 5;

  for (let si = 0; si < spokenWords.length; si++) {
    const spoken = spokenWords[si];
    let matched = false;

    for (let skip = 0; skip < maxSkip && currentWordIndex + skip < normalizedWords.length; skip++) {
      if (wordsMatch(spoken, normalizedWords[currentWordIndex + skip])) {
        advanceTo(currentWordIndex + skip + 1);
        matched = true;
        break;
      }
    }
  }
}

function wordsMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  // Exact match
  if (spoken === expected) return true;
  // Short word aliases
  if (SHORT_WORD_ALIASES[expected]) {
    if (SHORT_WORD_ALIASES[expected].indexOf(spoken) !== -1) return true;
  }
  // Prefix match: spoken is start of expected (e.g. "hap" for "happy")
  if (expected.length >= 4 && expected.startsWith(spoken) && spoken.length >= 3) return true;
  // Suffix match: spoken ends like expected (e.g. "wanted" heard as "anted")
  if (expected.length >= 4 && spoken.length >= 3 && expected.endsWith(spoken.slice(-3))) return true;
  // Contains match for longer words: one contains the other
  if (spoken.length >= 4 && expected.length >= 4) {
    if (spoken.indexOf(expected) !== -1 || expected.indexOf(spoken) !== -1) return true;
  }
  // Edit distance <= 1 for words of similar length
  if (Math.abs(spoken.length - expected.length) <= 1 && spoken.length >= 2) {
    let diffs = 0;
    const maxLen = Math.max(spoken.length, expected.length);
    for (let i = 0; i < maxLen; i++) {
      if (spoken[i] !== expected[i]) diffs++;
      if (diffs > 1) return false;
    }
    return diffs <= 1;
  }
  // Edit distance <= 2 for longer words (5+ chars)
  if (spoken.length >= 5 && expected.length >= 5 && Math.abs(spoken.length - expected.length) <= 2) {
    let diffs = 0;
    const maxLen = Math.max(spoken.length, expected.length);
    for (let i = 0; i < maxLen; i++) {
      if (spoken[i] !== expected[i]) diffs++;
      if (diffs > 2) return false;
    }
    return diffs <= 2;
  }
  return false;
}

function advanceTo(newIndex) {
  for (var i = currentWordIndex; i < newIndex && i < wordElements.length; i++) {
    wordElements[i].classList.remove('upcoming');
    wordElements[i].classList.add('spoken');
  }
  currentWordIndex = newIndex;

  if (currentWordIndex < wordElements.length) {
    if (readingMode === 'teleprompter') {
      scrollToCenter(wordElements[currentWordIndex]);
    } else if (readingMode === 'page' && pages.length > 0) {
      // Check if we need to turn the page
      var page = pages[currentPage];
      if (currentWordIndex > page.end && currentPage < pages.length - 1) {
        triggerPageTurn(currentPage + 1);
      }
    }
  }

  if (currentWordIndex >= wordElements.length) {
    storyComplete();
  }
}

function storyComplete() {
  stopListening();
  document.getElementById('status').textContent = '';
  document.getElementById('start-btn').style.display = 'none';

  var container = document.getElementById('story-container');
  var msg = document.createElement('div');
  msg.classList.add('done-message');
  msg.textContent = 'Well done! You read the whole story!';
  container.appendChild(msg);

  if (readingMode === 'teleprompter') {
    scrollToCenter(msg);
  }
}

// --- Controls ---
function setupControls() {
  document.getElementById('back-btn').addEventListener('click', function() {
    stopListening();
    showScreen('selection-screen');
  });

  document.getElementById('start-btn').addEventListener('click', function() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });

  document.getElementById('reset-btn').addEventListener('click', function() {
    stopListening();
    currentWordIndex = 0;
  
    currentPage = 0;
    pages = [];
    renderStory();
    applyFontSize();
    applyMode();
    updateButton();
    document.getElementById('start-btn').style.display = '';
    document.getElementById('status').textContent = '';
    document.getElementById('reset-btn').style.display = 'none';
  });

  document.getElementById('font-down-btn').addEventListener('click', function() {
    if (fontSizeIndex > 0) { fontSizeIndex--; applyFontSize(); }
  });

  document.getElementById('font-up-btn').addEventListener('click', function() {
    if (fontSizeIndex < FONT_SIZES.length - 1) { fontSizeIndex++; applyFontSize(); }
  });

  document.getElementById('mode-toggle-btn').addEventListener('click', toggleMode);
}

// --- Go ---
init();
