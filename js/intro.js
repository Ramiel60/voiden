/* Intro film: autoplays muted on entry; X / HOME / Esc / end of film enter the site. */
(function () {
  var intro = document.getElementById('intro');
  if (!intro) return;
  var video = intro.querySelector('.intro__video');
  var soundBtn = intro.querySelector('[data-intro-sound]');
  var bar = intro.querySelector('.intro__progress span');
  var time = intro.querySelector('.intro__time');
  var closed = false;

  // ?intro=off skips the film (handy for development and direct links)
  if (/[?&]intro=off\b/.test(window.location.search)) {
    intro.hidden = true;
    video.removeAttribute('autoplay');
    video.pause();
    closed = true;
    window.VOIDEN_INTRO = { isClosed: function () { return true; } };
    document.dispatchEvent(new CustomEvent('voiden:intro-closed'));
    return;
  }

  document.body.classList.add('is-locked');

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function close(goHome) {
    if (closed) return;
    closed = true;
    intro.classList.add('is-closing');
    document.body.classList.remove('is-locked');
    if (goHome) window.scrollTo({ top: 0, behavior: 'auto' });
    window.setTimeout(function () {
      video.pause();
      intro.hidden = true;
      document.dispatchEvent(new CustomEvent('voiden:intro-closed'));
      var home = document.querySelector('[data-home-link]');
      if (goHome && home) home.focus({ preventScroll: true });
    }, 700);
  }
  window.VOIDEN_INTRO = { isClosed: function () { return closed; } };

  intro.querySelector('[data-intro-close]').addEventListener('click', function () { close(false); });
  intro.querySelector('[data-intro-home]').addEventListener('click', function () { close(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(false); });

  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play();
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
    soundBtn.querySelector('[data-label]').textContent = video.muted ? 'SOUND OFF' : 'SOUND ON';
    soundBtn.classList.toggle('is-on', !video.muted);
  });

  video.addEventListener('timeupdate', function () {
    if (!video.duration) return;
    bar.style.width = (video.currentTime / video.duration) * 100 + '%';
    time.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
  });
  video.addEventListener('ended', function () { close(false); });

  var p = video.play();
  if (p && p.catch) p.catch(function () { /* autoplay blocked: user can press play via sound button or close */ });
})();
