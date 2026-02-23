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
    id: 'gruffalo',
    title: 'The Gruffalo',
    text: `A mouse took a stroll through the deep dark wood.
A fox saw the mouse, and the mouse looked good.
"Where are you going to, little brown mouse? Come and have lunch in my underground house."
"It's terribly kind of you, Fox, but no—I'm going to have lunch with a Gruffalo."
"A Gruffalo? What's a Gruffalo?"
"A Gruffalo! Why, didn't you know? He has terrible tusks, and terrible claws, and terrible teeth in his terrible jaws."
"Where are you meeting him?"
"Here, by these rocks. And his favourite food is roasted fox."
"Roasted fox! I'm off!" And away Fox sped.
Silly old Fox! Doesn't he know, there's no such thing as a Gruffalo?
On went the mouse through the deep dark wood.
An owl saw the mouse, and the mouse looked good.
"Where are you going to, little brown mouse? Come and have tea in my treetop house."
"It's frightfully nice of you, Owl, but no—I'm going to have tea with a Gruffalo."
"A Gruffalo? What's a Gruffalo?"
"A Gruffalo! Why, didn't you know? He has knobbly knees, and turned-out toes, and a poisonous wart at the end of his nose."
"Where are you meeting him?"
"Here, by this stream. And his favourite food is owl ice cream."
"Owl ice cream! Toowhit toowhoo!" And away Owl flew.
Silly old Owl! Doesn't he know, there's no such thing as a Gruffalo?
On went the mouse through the deep dark wood.
A snake saw the mouse, and the mouse looked good.
"Where are you going to, little brown mouse? Come for a feast in my logpile house."
"It's wonderfully good of you, Snake, but no—I'm having a feast with a Gruffalo."
"A Gruffalo? What's a Gruffalo?"
"A Gruffalo! Why, didn't you know? His eyes are orange, his tongue is black. He has purple prickles all over his back."
"Where are you meeting him?"
"Here, by this lake. And his favourite food is scrambled snake."
"Scrambled snake! It's time I hid!" And away Snake slid.
Silly old Snake! Doesn't he know, there's no such thing as a Gruffalo?
But who is this creature with terrible claws, and terrible teeth in his terrible jaws? He has knobbly knees, and turned-out toes, and a poisonous wart at the end of his nose. His eyes are orange, his tongue is black. He has purple prickles all over his back.
Oh help! Oh no! It's a Gruffalo!
"My favourite food!" the Gruffalo said. "You'll taste good on a slice of bread!"
"Good?" said the mouse. "Don't call me good! I'm the scariest creature in this wood. Just walk behind me and soon you'll see—everyone is afraid of me."
They walked and they walked till the Gruffalo said,
"I hear a hiss in the leaves ahead."
"It's Snake," said the mouse. "Why, Snake, hello!" Snake took one look at the Gruffalo. "Oh crumbs!" said Snake. "Goodbye, little mouse." And off he slid to his logpile house.
"You see?" said the mouse. "I told you so."
"Amazing!" said the Gruffalo.
They walked and they walked till the Gruffalo said,
"I hear a hoot in the trees ahead."
"It's Owl," said the mouse. "Why, Owl, hello!" Owl took one look at the Gruffalo. "Oh dear!" said Owl. "Goodbye, little mouse." And off he flew to his treetop house.
"You see?" said the mouse. "I told you so."
"Astounding!" said the Gruffalo.
They walked and they walked till the Gruffalo said,
"I can hear feet on the path ahead."
"It's Fox," said the mouse. "Why, Fox, hello!" Fox took one look at the Gruffalo. "Oh help!" said Fox. "Goodbye, little mouse." And off he ran to his underground house.
"Well, Gruffalo," said the mouse. "You see? Everyone is afraid of me! But now my tummy's beginning to rumble. My favourite food is—Gruffalo crumble!"
"Gruffalo crumble!" The Gruffalo let out a terrible cry and ran away through the deep dark wood.
All was quiet in the deep dark wood. The mouse found a nut and the nut was good.`
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
let isListening = false;
let matchedSpokenCount = 0;

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
  var container = document.getElementById('story-container');
  var wrapperHeight = container.clientHeight;
  if (wrapperHeight <= 0) return;

  pages = [];
  var pageStart = 0;

  // Show all words to measure
  wordElements.forEach(function(el) { el.style.display = ''; });
  document.querySelectorAll('.sentence-break').forEach(function(el) { el.style.display = ''; });

  for (var i = 0; i < wordElements.length; i++) {
    var elBottom = wordElements[i].offsetTop + wordElements[i].offsetHeight;
    var pageTop = wordElements[pageStart].offsetTop;
    if (elBottom - pageTop > wrapperHeight - 2 && i > pageStart) {
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
  matchedSpokenCount = 0;
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

// --- Speech Provider Pattern ---
let activeProvider = null;

// Provider interface: { start(lang), stop(), destroy() }
// Callbacks set on provider: onWords(words, isFinal), onError(msg), onStateChange(state)

function createWebSpeechProvider() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  let recognition = null;
  let restartCount = 0;
  const provider = {
    type: 'webspeech',
    onWords: null,
    onError: null,
    onStateChange: null,

    start: function(lang) {
      recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang || 'en-GB';

      recognition.onstart = function() {
        restartCount = 0;
        debug('WS EVENT: onstart');
      };
      recognition.onaudiostart = function() { debug('WS EVENT: onaudiostart'); };
      recognition.onspeechstart = function() { debug('WS EVENT: onspeechstart'); };

      recognition.onresult = function(event) {
        var transcript = '';
        var isFinal = false;

        for (var i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
          if (event.results[i].isFinal) isFinal = true;
        }

        debug('WS RESULT (' + (isFinal ? 'final' : 'interim') + '): "' + transcript.trim() + '"');

        // Convert transcript string to word objects
        var words = transcript.trim().split(/\s+/).map(function(w) {
          return { word: w };
        });
        if (provider.onWords) provider.onWords(words, isFinal);
      };

      recognition.onerror = function(event) {
        debug('WS ERROR: ' + event.error);
        switch (event.error) {
          case 'not-allowed':
            if (provider.onError) provider.onError('Microphone access denied.');
            if (provider.onStateChange) provider.onStateChange('stopped');
            break;
          case 'no-speech':
            debug('No speech detected, will auto-restart');
            break;
          case 'audio-capture':
            if (provider.onError) provider.onError('Could not access microphone.');
            if (provider.onStateChange) provider.onStateChange('stopped');
            break;
          case 'network':
            if (provider.onError) provider.onError('Speech may need internet connection.');
            break;
          case 'aborted':
            break;
        }
      };

      recognition.onend = function() {
        debug('WS EVENT: onend');
        if (isListening && currentWordIndex < normalizedWords.length) {
          restartCount++;
          if (restartCount < 10) {
            debug('Auto-restarting (' + restartCount + ')...');
            matchedSpokenCount = 0;
            try { recognition.start(); } catch (e) { debug('Restart failed: ' + e.message); }
          } else {
            if (provider.onStateChange) provider.onStateChange('paused');
          }
        }
      };

      try {
        recognition.start();
        debug('Called recognition.start()');
      } catch (e) {
        debug('WS START ERROR: ' + e.message);
        if (provider.onError) provider.onError('Could not start speech recognition.');
      }
    },

    stop: function() {
      if (recognition) {
        try { recognition.stop(); } catch (e) { /* ignore */ }
      }
    },

    destroy: function() {
      if (recognition) {
        try { recognition.stop(); } catch (e) { /* ignore */ }
        recognition = null;
      }
    }
  };

  return provider;
}

// --- Deepgram Provider ---
var DEEPGRAM_WORKER_URL = 'wss://learntoread-speech.ed-dowding.workers.dev';

function createDeepgramProvider() {
  var ws = null;
  var mediaRecorder = null;
  var stream = null;
  var keepAliveTimer = null;

  var provider = {
    type: 'deepgram',
    onWords: null,
    onError: null,
    onStateChange: null,

    start: function(lang) {
      // Get microphone access
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function(audioStream) {
        stream = audioStream;

        // Build WS URL with optional keywords from story
        var wsUrl = DEEPGRAM_WORKER_URL;
        if (currentStory) {
          // Extract unique words from story as keyword hints
          var storyWords = currentStory.text.split(/\s+/).map(function(w) {
            return w.toLowerCase().replace(/[^a-z']/g, '');
          }).filter(function(w, i, arr) {
            return w.length >= 4 && arr.indexOf(w) === i;
          });
          if (storyWords.length > 0) {
            wsUrl += '?keywords=' + encodeURIComponent(storyWords.slice(0, 50).join(','));
          }
        }

        ws = new WebSocket(wsUrl);

        ws.onopen = function() {
          debug('DG: WebSocket connected');

          // Start MediaRecorder
          var mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/ogg;codecs=opus';
          debug('DG: Using MIME type ' + mimeType);

          mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
          mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0 && ws && ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          };
          mediaRecorder.start(250); // 250ms chunks

          // KeepAlive ping every 8s
          keepAliveTimer = setInterval(function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'KeepAlive' }));
            }
          }, 8000);
        };

        ws.onmessage = function(event) {
          try {
            var data = JSON.parse(event.data);
            if (data.type === 'Results' && data.channel) {
              var alt = data.channel.alternatives[0];
              if (alt && alt.words && alt.words.length > 0) {
                var isFinal = data.is_final;
                var words = alt.words.map(function(w) {
                  return {
                    word: w.word,
                    start: w.start,
                    end: w.end,
                    confidence: w.confidence
                  };
                });
                debug('DG RESULT (' + (isFinal ? 'final' : 'interim') + '): "' +
                  words.map(function(w) { return w.word; }).join(' ') + '"');

                // Deepgram sends per-utterance (not cumulative), reset matchedSpokenCount
                matchedSpokenCount = 0;
                if (provider.onWords) provider.onWords(words, isFinal);
              }
            }
          } catch (e) {
            debug('DG: Parse error: ' + e.message);
          }
        };

        ws.onclose = function(event) {
          debug('DG: WebSocket closed (' + event.code + ')');
          cleanup();
          if (isListening) {
            // Auto-fallback to Web Speech
            debug('DG: Falling back to Web Speech');
            document.getElementById('status').textContent = 'Enhanced speech disconnected, switching to Basic...';
            localStorage.setItem('readAlong_speechProvider', 'webspeech');
            var sel = document.getElementById('speech-engine-select');
            if (sel) sel.value = 'webspeech';
            activeProvider = createWebSpeechProvider();
            if (activeProvider) {
              activeProvider.onWords = provider.onWords;
              activeProvider.onError = provider.onError;
              activeProvider.onStateChange = provider.onStateChange;
              activeProvider.start(lang);
            } else {
              if (provider.onStateChange) provider.onStateChange('stopped');
            }
          }
        };

        ws.onerror = function() {
          debug('DG: WebSocket error');
        };

      }).catch(function(err) {
        debug('DG: getUserMedia error: ' + err.message);
        if (provider.onError) provider.onError('Could not access microphone.');
        if (provider.onStateChange) provider.onStateChange('stopped');
      });
    },

    stop: function() {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
      cleanup();
    },

    destroy: function() {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: 'CloseStream' })); } catch (e) { /* ignore */ }
      }
      cleanup();
    }
  };

  function cleanup() {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
    }
    mediaRecorder = null;
    if (stream) {
      stream.getTracks().forEach(function(t) { t.stop(); });
      stream = null;
    }
    if (ws) {
      try { ws.close(); } catch (e) { /* ignore */ }
      ws = null;
    }
  }

  return provider;
}

function checkSpeechSupport() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('status').textContent = 'Speech recognition not supported. Try Chrome or Safari.';
    document.getElementById('start-btn').disabled = true;
    return false;
  }
  return true;
}

function getSelectedProvider() {
  var saved = localStorage.getItem('readAlong_speechProvider');
  return saved || 'webspeech';
}

function startListening() {
  var providerType = getSelectedProvider();

  if (providerType === 'deepgram') {
    activeProvider = createDeepgramProvider();
  } else {
    activeProvider = createWebSpeechProvider();
  }

  if (!activeProvider) {
    document.getElementById('status').textContent = 'Speech recognition not available.';
    return;
  }

  // Wire up provider callbacks
  activeProvider.onWords = function(words, isFinal) {
    matchWords(words, isFinal);
  };
  activeProvider.onError = function(msg) {
    document.getElementById('status').textContent = msg;
    // For fatal errors, stop listening
    if (msg === 'Microphone access denied.' || msg === 'Could not access microphone.') {
      isListening = false;
      document.getElementById('skip-btn').style.display = 'none';
      document.body.classList.remove('is-listening');
      updateButton();
    }
  };
  activeProvider.onStateChange = function(state) {
    if (state === 'paused') {
      document.getElementById('status').textContent = 'Recognition paused. Tap "Continue" to resume.';
      isListening = false;
      document.getElementById('skip-btn').style.display = 'none';
      document.body.classList.remove('is-listening');
      updateButton();
    } else if (state === 'stopped') {
      isListening = false;
      document.getElementById('skip-btn').style.display = 'none';
      document.body.classList.remove('is-listening');
      updateButton();
    }
  };

  activeProvider.start('en-GB');
  isListening = true;
  matchedSpokenCount = 0;
  updateButton();
  document.getElementById('status').textContent = 'Listening... start reading aloud';
  document.getElementById('reset-btn').style.display = 'inline-block';
  document.getElementById('skip-btn').style.display = 'inline-block';
  document.body.classList.add('is-listening');
}

function stopListening() {
  if (activeProvider) {
    activeProvider.destroy();
    activeProvider = null;
  }
  isListening = false;
  document.getElementById('skip-btn').style.display = 'none';
  document.body.classList.remove('is-listening');
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
// matchWords receives [{word, start?, end?, confidence?}] from any provider
function matchWords(wordObjects, isFinal) {
  // Clear tentative highlights before processing
  clearTentative();

  var spokenWords = wordObjects.map(function(w) {
    return normalize(w.word);
  }).filter(function(w) { return w.length > 0; });
  if (spokenWords.length === 0) return;

  var newStart = matchedSpokenCount;
  var lastMatchedIndex = currentWordIndex;

  for (var si = newStart; si < spokenWords.length; si++) {
    var spoken = spokenWords[si];

    // Short-word lookahead: if current word is 1-2 chars (a, I, it, etc.)
    // and the NEXT word matches what was spoken, auto-skip the short word
    var curExpected = normalizedWords[currentWordIndex];
    if (curExpected && curExpected.length <= 2 && currentWordIndex + 1 < normalizedWords.length) {
      if (wordsMatch(spoken, normalizedWords[currentWordIndex + 1])) {
        debug('SHORT-SKIP: "' + curExpected + '" (1-2 char), spoken matches next word');
        advanceTo(currentWordIndex + 2);
        matchedSpokenCount = si + 1;
        lastMatchedIndex = currentWordIndex;
        continue;
      }
    }

    var maxSkip = 2;
    for (var skip = 0; skip < maxSkip && currentWordIndex + skip < normalizedWords.length; skip++) {
      if (wordsMatch(spoken, normalizedWords[currentWordIndex + skip])) {
        advanceTo(currentWordIndex + skip + 1);
        matchedSpokenCount = si + 1;
        lastMatchedIndex = currentWordIndex;
        break;
      }
    }
  }

  // For interim results from Deepgram, show tentative highlight on next expected words
  if (!isFinal && activeProvider && activeProvider.type === 'deepgram') {
    var tentativeCount = Math.min(spokenWords.length - matchedSpokenCount, 3);
    for (var t = 0; t < tentativeCount && currentWordIndex + t < wordElements.length; t++) {
      wordElements[currentWordIndex + t].classList.add('tentative');
    }
  }
}

function clearTentative() {
  var tentatives = document.querySelectorAll('.word.tentative');
  for (var i = 0; i < tentatives.length; i++) {
    tentatives[i].classList.remove('tentative');
  }
}

function wordsMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  if (spoken === expected) return true;
  if (expected.length >= 4 && expected.startsWith(spoken) && spoken.length >= 3 && spoken.length >= expected.length * 0.6) return true;
  if (Math.abs(spoken.length - expected.length) <= 1 && spoken.length >= 3 && expected.length >= 3) {
    let diffs = 0;
    const maxLen = Math.max(spoken.length, expected.length);
    for (let i = 0; i < maxLen; i++) {
      if (spoken[i] !== expected[i]) diffs++;
      if (diffs > 1) return false;
    }
    return diffs <= 1;
  }
  return false;
}

function advanceTo(newIndex) {
  for (var i = currentWordIndex; i < newIndex && i < wordElements.length; i++) {
    wordElements[i].classList.remove('upcoming', 'current', 'tentative');
    wordElements[i].classList.add('spoken');
  }
  currentWordIndex = newIndex;

  // Mark the current word (next to be spoken) for teleprompter highlight
  if (currentWordIndex < wordElements.length) {
    // Remove previous current marker
    var prevCurrent = document.querySelector('.word.current');
    if (prevCurrent) prevCurrent.classList.remove('current');
    wordElements[currentWordIndex].classList.add('current');
  }

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
    matchedSpokenCount = 0;
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

  document.getElementById('skip-btn').addEventListener('click', function() {
    if (isListening && currentWordIndex < normalizedWords.length) {
      debug('SKIP: word "' + normalizedWords[currentWordIndex] + '"');
      advanceTo(currentWordIndex + 1);
    }
  });

  // Tappable words — tap to advance to that word
  document.getElementById('story-container').addEventListener('click', function(e) {
    if (!isListening) return;
    var target = e.target;
    if (!target.classList.contains('word') || !target.classList.contains('upcoming')) return;
    var idx = wordElements.indexOf(target);
    if (idx >= 0 && idx >= currentWordIndex) {
      debug('TAP: advance to word ' + idx + ' "' + normalizedWords[idx] + '"');
      advanceTo(idx + 1);
    }
  });

  document.getElementById('font-down-btn').addEventListener('click', function() {
    if (fontSizeIndex > 0) { fontSizeIndex--; applyFontSize(); }
  });

  document.getElementById('font-up-btn').addEventListener('click', function() {
    if (fontSizeIndex < FONT_SIZES.length - 1) { fontSizeIndex++; applyFontSize(); }
  });

  document.getElementById('mode-toggle-btn').addEventListener('click', toggleMode);

  // Settings panel toggle
  var settingsBtn = document.getElementById('settings-btn');
  var settingsPanel = document.getElementById('settings-panel');
  settingsBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    settingsPanel.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
      settingsPanel.classList.remove('open');
    }
  });

  // Speech engine selector
  var engineSelect = document.getElementById('speech-engine-select');
  var savedProvider = localStorage.getItem('readAlong_speechProvider') || 'webspeech';
  engineSelect.value = savedProvider;

  // Only show Enhanced option if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    var dgOption = engineSelect.querySelector('option[value="deepgram"]');
    if (dgOption) dgOption.disabled = true;
  }

  engineSelect.addEventListener('change', function() {
    localStorage.setItem('readAlong_speechProvider', engineSelect.value);
    settingsPanel.classList.remove('open');
    // If currently listening, restart with new provider
    if (isListening) {
      stopListening();
      startListening();
    }
  });

  // Re-paginate on resize (orientation change, keyboard show/hide)
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (readingMode === 'page' && wordElements.length > 0) {
        paginate();
      }
    }, 200);
  });
}

// --- Go ---
init();
