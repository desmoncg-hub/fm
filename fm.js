/* Financial Management practice engine. One question at a time, read-aloud, hints, no timers, no logins. */
(function () {
  var A = window.ACTIVITY, ICONS = window.ICONS || {};
  var root = document.getElementById('app');
  var CHEERS = ['Great job!', 'You got it!', 'Nice work!', 'Excellent thinking!'];
  var SPEAK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  var canSpeak = 'speechSynthesis' in window;
  function speak(t) { if (!canSpeak) return; speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, ' ')); u.lang = 'en-US'; u.rate = 0.9; speechSynthesis.speak(u); }
  function sayBtn(text) { if (!canSpeak) return ''; return '<button class="say" type="button" data-say="' + esc(text) + '" aria-label="Read to me">' + SPEAK + 'Read</button>'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function icon(k) { return k && ICONS[k] ? '<span class="ic">' + ICONS[k] + '</span>' : ''; }
  root.addEventListener('click', function (e) { var b = e.target.closest('[data-say]'); if (b) { e.stopPropagation(); speak(b.getAttribute('data-say')); } });

  document.title = A.title;
  var cite = A.title + ' created by Mr. Desmond with support from Claude.';
  document.body.insertAdjacentHTML('beforeend', '<footer class="cite">' + cite + '</footer>');

  var order, idx, firstTry, tried, score, stepI;

  function header(label, pct) {
    return '<header class="top"><div class="t">' + A.title + '<span class="sub">' + A.where + '</span></div>' +
      (label ? '<div class="prog"><div class="lbl">' + label + '</div><div class="bar"><div class="fill" style="width:' + pct + '%"></div></div></div>' : '') + '</header>';
  }

  function start() {
    if (canSpeak) speechSynthesis.cancel();
    root.innerHTML = header('', 0) + '<main><div class="card center">' + (A.startArt ? '<div class="art">' + A.startArt + '</div>' : '') +
      '<h1>' + A.title + '</h1><p class="ml">' + A.where + '</p>' +
      '<p style="display:flex;gap:10px;align-items:center;justify-content:center">' + A.intro + sayBtn(A.intro) + '</p>' +
      '<button class="big" id="go" type="button">Start</button></div></main>';
    document.getElementById('go').onclick = begin;
  }

  function begin() {
    score = 0; idx = 0;
    if (A.mode === 'board') return board();
    order = A.shuffle === false ? A.items.slice() : shuffle(A.items);
    show();
  }

  /* ---------- multiple choice and step-by-step ---------- */
  function show() {
    var it = order[idx]; tried = false; firstTry = true; stepI = 0;
    var label = (A.noun || 'Question') + ' ' + (idx + 1) + ' of ' + order.length;
    root.innerHTML = header(label, Math.round(idx / order.length * 100)) +
      '<main><div class="stage"><div class="qcard" id="qc"></div><aside class="fb" id="fb" aria-live="polite"></aside></div></main>';
    renderQ();
  }

  function current() { var it = order[idx]; return it.steps ? it.steps[stepI] : it; }

  function renderQ() {
    var it = order[idx], q = current(), html = '';
    if (A.remind) html += '<div class="remind">' + A.remind + '</div>';
    if (it.art) html += '<div class="art">' + it.art + '</div>';
    if (it.steps) {
      html += '<div class="q"><span>' + it.story + '</span>' + sayBtn(it.story) + '</div><div class="steps">';
      for (var s = 0; s < stepI; s++) html += '<div class="done">' + it.steps[s].q + ' <strong>' + it.steps[s].answer + '</strong></div>';
      html += '</div>';
    }
    html += '<div class="q"><span>' + q.q + '</span>' + sayBtn(q.q) + '</div><div class="choices">';
    var ch = shuffle(q.choices.map(function (c) { return typeof c === 'string' ? { label: c } : c; }));
    ch.forEach(function (c) { html += '<button class="choice" type="button" data-a="' + esc(c.label) + '">' + icon(c.icon) + '<span>' + c.label + '</span></button>'; });
    html += '</div>';
    var qc = document.getElementById('qc'); qc.innerHTML = html;
    qc.querySelectorAll('.choice').forEach(function (b) { b.onclick = function () { pick(b); }; });
    document.getElementById('fb').className = 'fb';
  }

  function pick(b) {
    var q = current(), fb = document.getElementById('fb'), it = order[idx];
    if (b.getAttribute('data-a') === q.answer) {
      b.classList.add('right');
      document.querySelectorAll('.choice').forEach(function (x) { x.disabled = true; });
      var lastStep = !it.steps || stepI === it.steps.length - 1;
      if (lastStep && firstTry) score++;
      var why = q.why || '';
      fb.className = 'fb show ok';
      fb.innerHTML = '<h2>' + CHEERS[Math.floor(Math.random() * CHEERS.length)] + '</h2>' + (why ? '<p>' + why + '</p>' : '') +
        (why ? sayBtn(why) + '<br>' : '') + '<button class="big" id="nx" type="button">Next</button>';
      document.getElementById('nx').onclick = function () {
        if (!lastStep) { stepI++; renderQ(); return; }
        idx++; if (idx < order.length) show(); else finish();
      };
      document.getElementById('nx').focus();
    } else {
      firstTry = false; b.classList.add('wrong'); b.disabled = true;
      fb.className = 'fb show no';
      fb.innerHTML = '<h2>Not yet!</h2><p><strong>Hint:</strong> ' + q.hint + '</p><p>Please try again.</p>' + sayBtn('Hint. ' + q.hint + ' Please try again.') +
        '<br><button class="big" id="ta" type="button">Try Again</button>';
      document.getElementById('ta').onclick = function () { fb.className = 'fb'; };
      document.getElementById('ta').focus();
    }
  }

  /* ---------- game board ---------- */
  var used;
  function board() {
    used = used && idx ? used : {};
    var n = 0, done = 0;
    A.cats.forEach(function (c) { c.clues.forEach(function () { n++; }); });
    Object.keys(used).forEach(function () { done++; });
    var html = header('Score: ' + score + ' points', Math.round(done / n * 100)) + '<main><div class="card" style="max-width:1100px">' +
      '<p class="score">Pick a square. Answer right to earn the points.</p><div class="board">';
    A.cats.forEach(function (c) { html += '<div class="cat">' + c.name + '</div>'; });
    for (var r = 0; r < A.cats[0].clues.length; r++) A.cats.forEach(function (c, ci) {
      var k = ci + '-' + r, v = (r + 1) * 100;
      html += used[k] ? '<button class="used" disabled aria-label="Done">' + v + '</button>' : '<button data-k="' + k + '" aria-label="' + c.name + ' for ' + v + '">' + v + '</button>';
    });
    html += '</div></div></main>';
    root.innerHTML = html;
    root.querySelectorAll('.board button[data-k]').forEach(function (b) { b.onclick = function () { clue(b.getAttribute('data-k')); }; });
    if (done === n) finish();
  }

  function clue(k) {
    var p = k.split('-'), c = A.cats[+p[0]], q = c.clues[+p[1]], v = (+p[1] + 1) * 100;
    idx = 1;
    root.innerHTML = header('Score: ' + score + ' points', 0) + '<main><div class="stage"><div class="qcard" id="qc"></div><aside class="fb" id="fb" aria-live="polite"></aside></div></main>';
    var html = '<div class="remind">' + c.name + ' for ' + v + '</div><div class="q"><span>' + q.q + '</span>' + sayBtn(q.q) + '</div><div class="choices">';
    shuffle(q.choices).forEach(function (a) { html += '<button class="choice" type="button" data-a="' + esc(a) + '"><span>' + a + '</span></button>'; });
    html += '</div><p style="margin-top:18px"><button class="say" type="button" id="back" style="font-size:18px">Back to the board</button></p>';
    document.getElementById('qc').innerHTML = html;
    document.getElementById('back').onclick = board;
    document.querySelectorAll('.choice').forEach(function (b) {
      b.onclick = function () {
        var fb = document.getElementById('fb');
        if (b.getAttribute('data-a') === q.answer) {
          b.classList.add('right'); used[k] = 1; score += v;
          fb.className = 'fb show ok';
          fb.innerHTML = '<h2>' + CHEERS[Math.floor(Math.random() * CHEERS.length)] + '</h2><p>+' + v + ' points</p><button class="big" id="nx" type="button">Back to the board</button>';
          document.getElementById('nx').onclick = board; document.getElementById('nx').focus();
        } else {
          b.classList.add('wrong'); b.disabled = true;
          fb.className = 'fb show no';
          fb.innerHTML = '<h2>Not yet!</h2><p><strong>Hint:</strong> ' + q.hint + '</p><p>Please try again.</p>' + sayBtn('Hint. ' + q.hint) + '<br><button class="big" id="ta" type="button">Try Again</button>';
          document.getElementById('ta').onclick = function () { fb.className = 'fb'; };
        }
      };
    });
  }

  function finish() {
    var d = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    var line = A.mode === 'board' ? 'Your score: <strong>' + score + ' points</strong>' : 'Right on the first try: <strong>' + score + ' of ' + order.length + '</strong>';
    root.innerHTML = header('All done!', 100) + '<main><div class="card center"><h1>You worked hard today!</h1><p class="ml">' + A.title + ' &bull; ' + A.where + '</p>' +
      '<p>' + line + '</p><p>' + d + '</p><p>Take a screenshot if your teacher asks for one.</p>' +
      '<button class="big" id="again" type="button">Start Over</button></div></main>';
    document.getElementById('again').onclick = function () { used = {}; begin(); };
  }

  start();
})();
