var PAGES = ['home', 'gurl-gang', 'music', 'videos', 'merch'];
  function showPage(name) {
    if (PAGES.indexOf(name) === -1) name = 'home';
    for (var i = 0; i < PAGES.length; i++) {
      document.getElementById('page-' + PAGES[i]).classList.toggle('active', PAGES[i] === name);
    }
    document.title = 'gurlbye - ' + name.replace('gurl-gang', 'Gurl Gang').replace(/^./, function (c) { return c.toUpperCase(); });
    window.scrollTo(0, 0);
  }
  function fromHash() {
    showPage(window.location.hash.replace('#', ''));
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  document.getElementById('joinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    var status = document.getElementById('joinStatus');
    var name = document.getElementById('fName').value.trim();
    var payload = {
      name: name,
      email: document.getElementById('fEmail').value.trim(),
      phone: document.getElementById('fPhone').value.trim(),
      website: form.elements.namedItem('website').value
    };
    button.disabled = true;
    status.textContent = 'JOINING THE GURL GANG...';
    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, 12000);
    try {
      var response = await fetch('/api/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(payload), signal: controller.signal
      });
      var data = await response.json().catch(function() { return null; });
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data && data.message || 'Unable to join right now. Please try again.');
      }
      form.style.display = 'none';
      document.getElementById('fillSpaces').style.display = 'none';
      status.textContent = '';
      var welcome = document.getElementById('welcomeMsg');
      welcome.textContent = name ? 'Welcome to the Gurl Gang, ' + name + '!' : 'Welcome to the Gurl Gang!';
      welcome.style.display = 'block';
    } catch (error) {
      status.textContent = error && error.name === 'AbortError'
        ? 'Connection timed out. Please retry.'
        : (error && error.message || 'Unable to join right now. Please retry.');
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
  });


  document.getElementById('mJoinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    var status = document.getElementById('mJoinStatus');
    var name = document.getElementById('mFName').value.trim();
    var payload = {
      name: name,
      email: document.getElementById('mFEmail').value.trim(),
      phone: document.getElementById('mFPhone').value.trim(),
      website: form.elements.namedItem('website').value
    };
    button.disabled = true;
    status.textContent = 'JOINING THE GURL GANG...';
    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, 12000);
    try {
      var response = await fetch('/api/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify(payload), signal: controller.signal
      });
      var data = await response.json().catch(function() { return null; });
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data && data.message || 'Unable to join right now. Please try again.');
      }
      form.style.display = 'none';
      document.getElementById('mFillSpaces').style.display = 'none';
      var privacy = form.parentElement.querySelector('.m-join-privacy');
      if (privacy) privacy.style.display = 'none';
      status.textContent = '';
      var welcome = document.getElementById('mWelcomeMsg');
      welcome.textContent = name ? 'Welcome to the Gurl Gang, ' + name + '!' : 'Welcome to the Gurl Gang!';
      welcome.style.display = 'block';
    } catch (error) {
      status.textContent = error && error.name === 'AbortError'
        ? 'Connection timed out. Please retry.'
        : (error && error.message || 'Unable to join right now. Please retry.');
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
  });

  /* Mobile videos: make sure the TV video is playing whenever its page is shown.
     A muted autoplaying video that starts out hidden can stay paused after a tap-in,
     so nudge it on every page change. */
  function gbPlayVisibleVideo() {
    document.querySelectorAll('.page.active video').forEach(function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }
  window.addEventListener('hashchange', function () { setTimeout(gbPlayVisibleVideo, 60); });
  setTimeout(gbPlayVisibleVideo, 350);

  /* TV sound: browsers are not allowed to start sound on their own, so both TV
     videos autoplay muted and one tap on the button (or the video) turns the
     hiss on. Tapping again mutes. */
  document.querySelectorAll('.gb-sound-btn').forEach(function (btn) {
    var stage = btn.parentElement;
    var v = stage ? stage.querySelector('video.gb-tv') : null;
    if (!v) return;
    function paint() {
      btn.innerHTML = v.muted ? '&#128266; Tap for sound' : '&#128266; Sound On';
      btn.classList.toggle('on', !v.muted);
      btn.setAttribute('aria-pressed', String(!v.muted));
    }
    function toggle() {
      v.muted = !v.muted;
      if (!v.muted) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      paint();
    }
    btn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    paint();
  });
