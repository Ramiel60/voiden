/* HERO · editorial look slider (Figma 45:728).
   Renders window.VOIDEN_HERO_SLIDES (js/hero-data.js) into the 1920x880 ".editorial" composition,
   slides between looks with Swiper (linear, speed 1000, loop, autoplay) once the intro film has closed. */
(function () {
  'use strict';

  var root = document.getElementById('hero');
  var DATA = window.VOIDEN_HERO_SLIDES;
  if (!root || !DATA || !DATA.length) return;

  var swiper = root.querySelector('.hero-swiper');
  var track = root.querySelector('[data-hero-track]');
  var defs = root.querySelector('[data-hero-defs]');
  var currentEl = root.querySelector('[data-hero-current]');
  var totalEl = root.querySelector('[data-hero-total]');
  var statusEl = root.querySelector('[data-hero-status]');
  var prevBtn = root.querySelector('[data-hero-prev]');
  var nextBtn = root.querySelector('[data-hero-next]');

  var ICON = 'assets/icons/hero/';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var W = 1920;
  var CY = 445;
  var AUTOPLAY_MS = 6000;
  var FADE_MS = 600;
  var COUNT = DATA.length;
  // CSS mask-image: url(*.png) is CORS-blocked when the page is opened from file://,
  // so there the silhouettes reference an inline SVG <mask> holding the same cutout instead.
  var SVG_MASKS = location.protocol === 'file:';
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  // Per-theme recipe. Echo colors are design tokens; dir = offset direction per echo step.
  var THEMES = {
    NOIR: { spot: 'spotlight.svg', badge: true, echo: { dir: [-1, -1], k1: ['var(--color-primary)', 1], k2: ['var(--main-300)', 0.6] } },
    VIOLET: { spot: 'spotlight-violet.svg', echo: { dir: [1, -1], k1: ['var(--gray-0)', 0.9], k2: ['var(--main-300)', 0.5] } },
    PAPER: { paper: true, badge: true, echo: { dir: [-1, -1], k1: ['var(--color-primary)', 1], k2: ['var(--gray-1200)', 0.85] } },
    SPLIT: { spot: 'spotlight.svg', slab: true, echo: { dir: [-1.3, 0], k1: ['var(--gray-0)', 1], k2: ['var(--main-300)', 0.7] } },
    CHECKER: { spot: 'spotlight.svg', badge: true, checker: true, echo: { dir: [-0.8, -1.2], k1: ['var(--gray-0)', 0.95], k2: ['var(--color-primary)', 1] } },
    HALO: { halo: true }
  };

  /* ---------- helpers ---------- */
  function px(n) { return (Math.round(n * 100) / 100) + 'px'; }

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function image(src, cls, w, h, alt) {
    var n = make('img', cls);
    n.src = src;
    n.width = Math.round(w);
    n.height = Math.round(h);
    n.alt = alt || '';
    n.decoding = 'async';
    n.draggable = false;
    return n;
  }

  // Position a layer by its centre (cx, cy) with size w x h; rot is CSS degrees (clockwise).
  function place(n, cx, cy, w, h, rot) {
    var s = n.style;
    s.left = px(cx - w / 2);
    s.top = px(cy - h / 2);
    s.width = px(w);
    s.height = px(h);
    if (rot) s.transform = 'rotate(' + rot + 'deg)';
    return n;
  }

  function ensureMask(i, src) {
    if (!SVG_MASKS || document.getElementById('hero-mask-' + i)) return;
    var m = document.createElementNS(SVGNS, 'mask');
    m.setAttribute('id', 'hero-mask-' + i);
    m.setAttribute('maskUnits', 'objectBoundingBox');
    m.setAttribute('maskContentUnits', 'objectBoundingBox');
    m.setAttribute('x', '0');
    m.setAttribute('y', '0');
    m.setAttribute('width', '1');
    m.setAttribute('height', '1');
    m.setAttribute('style', 'mask-type:alpha');
    var im = document.createElementNS(SVGNS, 'image');
    im.setAttribute('href', src);
    im.setAttribute('width', '1');
    im.setAttribute('height', '1');
    im.setAttribute('preserveAspectRatio', 'none');
    m.appendChild(im);
    defs.appendChild(m);
  }

  function maskWith(n, i, src) {
    var v = SVG_MASKS ? 'url("#hero-mask-' + i + '")' : 'url("' + src + '")';
    n.style.webkitMaskImage = v;
    n.style.maskImage = v;
  }

  function ribbon(cls, cx, cy, w, rot, text) {
    var r = place(make('div', 'ribbon ' + cls), cx, cy, w, 54, rot);
    r.setAttribute('aria-hidden', 'true');
    var t = make('div', 'ribbon-track');
    if (text) {
      var run = new Array(8).join(text); // 7 phrases per run, two runs -> seamless loop at -50%
      t.appendChild(make('span', 'ribbon-run', run));
      t.appendChild(make('span', 'ribbon-run', run));
    }
    r.appendChild(t);
    return r;
  }

  // logo + caption, centred on (cx, cy - 46.2) like the Figma "wordmark-back" pair
  function wordmark(parent, cx, cy, black) {
    var logo = image(ICON + (black ? 'wordmark-back-black.svg' : 'wordmark-back-white.svg'), 'wordmark-back', 560, 92.8774);
    parent.appendChild(place(logo, cx, cy - 46.2, 560, 92.8774));
    var cap = make('p', 'wordmark-caption-back', 'AUTUMN 2026  RUNWAY');
    cap.style.left = px(cx - 300);
    cap.style.top = px(cy + 14.24);
    parent.appendChild(cap);
  }

  /* ---------- slide renderer ---------- */
  function build(i) {
    i = ((i % COUNT) + COUNT) % COUNT;
    var li = slides[i];
    if (li.firstChild) return;

    var d = DATA[i];
    var theme = THEMES[d.theme] ? d.theme : 'NOIR';
    var t = THEMES[theme];
    var mirror = !!d.mirror;
    var sgn = mirror ? -1 : 1;
    var mx = function (x) { return mirror ? W - x : x; };
    var cx = mx(1240);
    var cy = CY;
    var s = d.subject;
    var isModel = s.type === 'model';
    var sw = isModel ? 770 * s.w / s.h : s.w;
    var sh = isModel ? 770 : s.h;
    var rot = 2 * sgn;
    var title = String(d.title).replace(/\n/g, ' ');
    var paper = !!t.paper;
    var ed = make('div', 'editorial');

    ensureMask(i, s.src);

    // 1) background
    if (t.slab) ed.appendChild(place(make('div', 'color-slab'), mx(1536), 440, 960, 1760, -14 * sgn));
    if (t.spot) ed.appendChild(place(image(ICON + t.spot, 'spotlight', 1734, 1474), cx, cy + 40, 1734, 1474));
    if (paper) ed.appendChild(place(image(ICON + 'halo-blob.svg', 'halo-blob', 1282, 1087), cx, cy + 20, 1282, 1087));
    if (t.halo) {
      ed.appendChild(place(image(ICON + 'glow-blob.svg', 'glow-blob', 1106, 1106), cx, cy, 1106, 1106));
      ed.appendChild(place(image(ICON + 'ring-01.svg', 'ring-01', 616, 616), cx, cy, 616, 616));
      ed.appendChild(place(image(ICON + 'ring-02.svg', 'ring-02', 808.5, 808.5), cx, cy, 808.5, 808.5));
      ed.appendChild(place(image(ICON + 'ring-03.svg', 'ring-03', 1039.5, 1039.5), cx, cy, 1039.5, 1039.5));
    }

    // 2) ghost wordmark (CSS places it at 60 / 150.73, 1800 wide)
    ed.appendChild(image(ICON + (paper ? 'wordmark-ghost-paper.svg' : 'wordmark-ghost-dark.svg'), 'wordmark-ghost', 1801.93, 299.284));

    // 3) look number
    var no = make('p', 'look-number', d.no);
    no.setAttribute('aria-hidden', 'true');
    no.style.setProperty('--nx', px(-40 * sgn));
    ed.appendChild(no);

    // 4) echoes, or the blurred glow silhouette on HALO
    if (t.echo) {
      [2, 1].forEach(function (k) {
        var c = t.echo['k' + k];
        var dx = t.echo.dir[0] * sgn * 70 * k;
        var dy = t.echo.dir[1] * 26 * k;
        var e = place(make('div', 'echo echo-' + k), cx + dx, cy + dy, sw, sh, rot);
        e.setAttribute('aria-hidden', 'true');
        e.style.backgroundColor = c[0];
        if (c[1] !== 1) e.style.opacity = c[1];
        e.style.setProperty('--fx', px(-dx));
        e.style.setProperty('--fy', px(-dy));
        maskWith(e, i, s.src);
        ed.appendChild(e);
      });
    }
    if (t.halo) {
      var glow = place(make('div', 'glow-silhouette'), cx, cy, sw, sh, rot);
      glow.setAttribute('aria-hidden', 'true');
      var sil = make('div', 'silhouette');
      maskWith(sil, i, s.src);
      glow.appendChild(sil);
      ed.appendChild(glow);
    }

    // 5) ribbons
    var phrase = 'VOIDEN RUNWAY   /   LOOK ' + d.no + '   /   ' + title + '   /   ';
    if (t.halo) {
      ed.appendChild(ribbon('ribbon-ticker', 960, 70, 2700, 3 * sgn, phrase));
    } else if (t.slab) {
      ed.appendChild(ribbon('ribbon-purple', cx, cy + 211, 2160, -9, phrase));
      ed.appendChild(ribbon('ribbon-white is-reverse', cx, cy + 211, 2160, 9, phrase));
    } else if (t.checker) {
      ed.appendChild(ribbon('ribbon-checker', 960, 800, 2700, -4 * sgn, ''));
    } else {
      ed.appendChild(ribbon('ribbon-main', 960, 800, 2700, -4 * sgn, phrase));
    }

    // 6) back wordmark (behind the subject)
    wordmark(ed, cx, cy, paper);

    // 7) subject cutout
    ed.appendChild(place(image(s.src, 'subject ' + (isModel ? 'model-cutout' : 'item-cutout'), sw, sh, title), cx, cy, sw, sh, rot));

    // 8) items
    var ITEM = [[-330, 210, 8, -10], [310, 60, -7, 10]]; // dx, dy, rotation, extra entrance spin
    (d.items || []).slice(0, 2).forEach(function (it, k) {
      var p = ITEM[k];
      var n = image(it.src, 'item-0' + (k + 1), it.w, it.h, d.label + ' 스타일링 아이템 ' + (k + 1));
      place(n, cx + p[0] * sgn, cy + p[1], it.w, it.h, p[2] * sgn);
      n.style.setProperty('--spin', (p[3] * sgn) + 'deg');
      ed.appendChild(n);
    });

    // 9) engraved wordmark: the subject's box + mask; the inner layer cancels the box's offset/rotation
    var eng = place(make('div', 'wordmark-engraved'), cx, cy, sw, sh, rot);
    eng.setAttribute('aria-hidden', 'true');
    maskWith(eng, i, s.src);
    var body = make('div', 'wordmark-on-body');
    body.style.left = px(-(cx - sw / 2));
    body.style.top = px(-(cy - sh / 2));
    body.style.transformOrigin = px(cx) + ' ' + px(cy);
    body.style.transform = 'rotate(' + (-rot) + 'deg)';
    wordmark(body, cx, cy, false);
    eng.appendChild(body);
    ed.appendChild(eng);

    // 10) badge
    if (t.badge) {
      var badge = place(make('div', 'badge', 'LOOK\n' + d.no), cx + sgn * (sw / 2 + 18), cy - 254, 120, 120, 12 * sgn);
      badge.setAttribute('aria-hidden', 'true');
      badge.style.setProperty('--spin', (90 * sgn) + 'deg');
      ed.appendChild(badge);
    }

    // 11) glow dots (flat on PAPER)
    ed.appendChild(paper
      ? place(image(ICON + 'glow-01-flat.svg', 'glow-01', 18, 18), cx + 250 * sgn, cy - 330, 18, 18)
      : place(image(ICON + 'glow-01.svg', 'glow-01', 75.6, 75.6), cx + 250 * sgn, cy - 330, 75.6, 75.6));
    ed.appendChild(paper
      ? place(image(ICON + 'glow-02-flat.svg', 'glow-02', 10, 10), cx - 300 * sgn, cy - 260, 10, 10)
      : place(image(ICON + 'glow-02.svg', 'glow-02', 42, 42), cx - 300 * sgn, cy - 260, 42, 42));

    // 12) vertical caption
    if (!t.halo) {
      var vc = make('p', 'vertical-caption', 'VOIDEN  —  2026 AUTUMN COLLECTION  —  LOOK ' + d.no);
      vc.setAttribute('aria-hidden', 'true');
      vc.style.left = px(mx(1705));
      vc.style.transform = 'translate(-50%, -50%) rotate(' + (90 * sgn) + 'deg)';
      ed.appendChild(vc);
    }

    // 13) text block
    var text = make('div', 'slide-text');
    text.appendChild(make('p', 'label text-body-md-semibold', d.label));
    text.appendChild(make('h2', 'title text-h1-bold', d.title));
    text.appendChild(make('p', 'desc text-body-md-regular', d.desc));
    ed.appendChild(text);

    li.appendChild(ed);
  }


  /* ---------- slide shells ---------- */
  var slides = DATA.map(function (d, i) {
    var li = make('li', 'swiper-slide slide-' + d.no);
    li.setAttribute('role', 'group');
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', (i + 1) + ' / ' + COUNT + ' · ' + d.label);
    li.setAttribute('data-theme', (THEMES[d.theme] ? d.theme : 'NOIR').toLowerCase());
    li.setAttribute('data-index', String(i));
    if (d.mirror) li.setAttribute('data-mirror', '');
    track.appendChild(li);
    return li;
  });
  if (totalEl) totalEl.textContent = String(COUNT);

  /* ---------- Swiper: horizontal slide · ease linear · speed 1000 · loop · autoplay ---------- */
  var SPEED = 1000; // slide transition (ms); linear timing is set on .swiper-wrapper in hero.css
  var DELAY = 4000; // rest time on each look before the next slide starts (ms)
  var reduce = reduceMQ.matches;

  // content is built lazily: the visible look and its neighbours
  function prepare(n) { build(n - 1); build(n); build(n + 1); }

  // the incoming slide gets .is-active at transition start, so its layers animate in while it slides
  function activate(sw) {
    var active = sw.slides[sw.activeIndex];
    prepare(sw.realIndex);
    sw.slides.forEach(function (el) {
      var on = el === active;
      el.classList.toggle('is-active', on);
      if (on) { el.removeAttribute('aria-hidden'); el.inert = false; }
      else { el.setAttribute('aria-hidden', 'true'); el.inert = true; }
    });
    if (currentEl) currentEl.textContent = String(sw.realIndex + 1);
  }

  function announce(sw) {
    var d = DATA[sw.realIndex];
    if (statusEl && d) statusEl.textContent = (sw.realIndex + 1) + ' / ' + COUNT + ', ' + d.label + ' ' + String(d.title).replace(/\n/g, ' ');
  }

  prepare(0);

  if (typeof window.Swiper !== 'function') {
    // library unavailable (offline): show look 01 with working arrows via simple jumps
    slides[0].classList.add('is-active');
    return;
  }

  var sw = new window.Swiper(root.querySelector('.swiper'), {
    loop: true,
    speed: reduce ? 0 : SPEED,
    slidesPerView: 1,
    grabCursor: true,
    navigation: { prevEl: prevBtn, nextEl: nextBtn },
    autoplay: reduce ? false : { delay: DELAY, disableOnInteraction: false },
    on: {
      init: activate,
      slideChangeTransitionStart: activate,
      realIndexChange: function (s) { prepare(s.realIndex); },
      navigationNext: announce,
      navigationPrev: announce
    }
  });

  // keyboard: arrows move when the hero has focus; keyboard focus inside pauses autoplay
  swiper.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); sw.slidePrev(); announce(sw); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); sw.slideNext(); announce(sw); }
  });
  var running = false;
  function play() { if (!reduce && running && sw.autoplay) sw.autoplay.resume ? sw.autoplay.resume() : sw.autoplay.start(); }
  function hold() { if (sw.autoplay && sw.autoplay.running) sw.autoplay.pause ? sw.autoplay.pause() : sw.autoplay.stop(); }
  swiper.addEventListener('focusin', function (e) {
    var kb = true;
    try { kb = e.target.matches(':focus-visible'); } catch (err) { /* older browsers */ }
    if (kb) hold();
  });
  swiper.addEventListener('focusout', function (e) {
    if (!e.relatedTarget || !swiper.contains(e.relatedTarget)) play();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      root.classList.toggle('is-offscreen', !on);
      if (on) play(); else hold();
    }).observe(swiper);
  }

  /* ---------- start: hold look 01 at frame 0 behind the intro film, then play ---------- */
  var released = false;
  function release() {
    if (released) return;
    released = true;
    root.classList.remove('is-waiting');
  }
  function startAutoplay() {
    release();
    running = true;
    if (!reduce && sw.autoplay) sw.autoplay.start();
  }

  var intro = window.VOIDEN_INTRO;
  var introEl = document.getElementById('intro');
  var waiting = !!(intro && typeof intro.isClosed === 'function' && !intro.isClosed() && introEl && !introEl.hidden);

  if (waiting) {
    root.classList.add('is-waiting');
    if (sw.autoplay) sw.autoplay.stop();
    document.addEventListener('voiden:intro-closed', startAutoplay);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (introEl.classList.contains('is-closing') || introEl.hidden) {
          mo.disconnect();
          release();
        }
      });
      mo.observe(introEl, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
  } else {
    startAutoplay();
  }

  window.VOIDEN_HERO = {
    swiper: sw,
    go: function (n) { sw.slideToLoop(n); },
    next: function () { sw.slideNext(); },
    prev: function () { sw.slidePrev(); },
    current: function () { return sw.realIndex; }
  };
})();