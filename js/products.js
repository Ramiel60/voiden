/* Product sections (category / new-arrival / best):
   - tab lists: single active tab, aria-selected + roving tabindex, arrow/Home/End keys
   - best swiper: prev/next page by one view (4 cards), progress + "n / total", ends disable
   No modules, no fetch — works from file://. */
(function () {
  'use strict';

  var sections = document.querySelectorAll('.category, .new-arrival, .best');
  if (!sections.length) return;

  // Placeholder links (#) should not jump to the top of the page.
  Array.prototype.forEach.call(sections, function (section) {
    section.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#"]');
      if (a && section.contains(a)) e.preventDefault();
    });
  });

  /* ---------------- tabs ---------------- */
  function initTabs(list, onChange) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function select(tab, moveFocus) {
      var changed = tab.getAttribute('aria-selected') !== 'true';
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        t.classList.toggle('is-active', on);
      });
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.setAttribute('aria-labelledby', tab.id);
      if (moveFocus) tab.focus();
      if (changed && typeof onChange === 'function') onChange(tab);
    }

    list.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab && list.contains(tab)) select(tab, false);
    });

    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = -1;
      switch (e.key) {
        case 'ArrowRight': case 'Right': next = (i + 1) % tabs.length; break;
        case 'ArrowLeft': case 'Left': next = (i - 1 + tabs.length) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      e.preventDefault();
      select(tabs[next], true);
    });
  }

  /* ---------------- best swiper ---------------- */
  function initSwiper(root) {
    var viewport = root.querySelector('.swiper');
    var wrapper = root.querySelector('.swiper-wrapper');
    if (!viewport || !wrapper) return null;
    var slides = Array.prototype.slice.call(wrapper.children);
    var prev = root.querySelector('.swiper-button-prev');
    var next = root.querySelector('.swiper-button-next');
    var bar = root.querySelector('.swiper-progress .bar');
    var current = root.querySelector('.swiper-pagination .current');
    var total = root.querySelector('.swiper-pagination .total');
    var page = 0;
    var metrics = { perPage: 4, pages: 2, step: 0, max: 0 };

    function measure() {
      var gap = parseFloat(window.getComputedStyle(wrapper).columnGap) || 0;
      var slideW = slides.length ? slides[0].getBoundingClientRect().width : 0;
      var viewW = viewport.clientWidth;
      var perPage = slideW ? Math.max(1, Math.floor((viewW + gap + 1) / (slideW + gap))) : 1;
      metrics.perPage = perPage;
      metrics.pages = Math.max(1, Math.ceil(slides.length / perPage));
      metrics.step = perPage * (slideW + gap);
      metrics.max = Math.max(0, wrapper.scrollWidth - viewW);
    }

    function setDisabled(btn, off) {
      if (!btn) return;
      if (off) btn.setAttribute('aria-disabled', 'true');
      else btn.removeAttribute('aria-disabled');
    }

    function render() {
      var offset = Math.min(page * metrics.step, metrics.max);
      wrapper.style.transform = 'translateX(' + (-offset) + 'px)';
      if (bar) bar.style.width = ((page + 1) / metrics.pages * 100) + '%';
      if (current) current.textContent = String(page + 1);
      if (total) total.textContent = String(metrics.pages);
      setDisabled(prev, page <= 0);
      setDisabled(next, page >= metrics.pages - 1);
    }

    function goTo(p) {
      measure(); // cheap; keeps paging right if fonts/layout settled after init
      page = Math.max(0, Math.min(metrics.pages - 1, p));
      render();
    }

    if (prev) prev.addEventListener('click', function () {
      if (prev.getAttribute('aria-disabled') !== 'true') goTo(page - 1);
    });
    if (next) next.addEventListener('click', function () {
      if (next.getAttribute('aria-disabled') !== 'true') goTo(page + 1);
    });

    // Keyboard users tabbing through the cards: page to the focused slide.
    wrapper.addEventListener('focusin', function (e) {
      var slide = e.target.closest('.swiper-slide');
      var i = slides.indexOf(slide);
      if (i < 0) return;
      var p = Math.floor(i / metrics.perPage);
      if (p !== page) goTo(p);
    });
    // Fallback for browsers without overflow: clip — never let focus scroll the viewport.
    viewport.addEventListener('scroll', function () {
      if (viewport.scrollLeft) viewport.scrollLeft = 0;
    });

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { goTo(page); }, 120);
    });

    // Off-page slides sit in a clipped viewport, so native lazy-loading would wait until they
    // slide in. Start loading every slide image once the section comes near the viewport.
    var lazyImgs = Array.prototype.slice.call(wrapper.querySelectorAll('img[loading="lazy"]'));
    function loadAll() {
      lazyImgs.forEach(function (img) {
        img.loading = 'eager';
        // pre-decode so the next page doesn't flash empty tiles while sliding in
        if (img.decode) img.decode().catch(function () {});
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) {
          loadAll();
          io.disconnect();
        }
      }, { rootMargin: '600px 0px' });
      io.observe(root);
    } else {
      loadAll();
    }

    goTo(0);
    return { goTo: goTo };
  }

  var best = document.querySelector('.best[data-best-swiper]');
  var swiper = best ? initSwiper(best) : null;

  Array.prototype.forEach.call(document.querySelectorAll('[data-product-tabs]'), function (list) {
    var inBest = best && best.contains(list);
    initTabs(list, inBest && swiper ? function () { swiper.goTo(0); } : null);
  });
})();
