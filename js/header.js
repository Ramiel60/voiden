/* Site header: search field, search shortcut icon, GNB tab selection. */
(function () {
  var header = document.getElementById('header');
  if (!header) return;

  var form = header.querySelector('[data-header-search]');
  var input = form ? form.querySelector('input[type="search"]') : null;

  // No search backend on this static page: keep the user on the page and keep focus in the field.
  if (form && input) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      input.value = input.value.trim();
      input.focus();
    });
  }

  // my-menu search icon jumps into the header search field.
  var searchToggle = header.querySelector('[data-header-search-toggle]');
  if (searchToggle && input) {
    searchToggle.addEventListener('click', function () {
      input.focus();
      input.select();
    });
  }

  // GNB: one active tab per list (gnb-main / gnb-sub), matching tab state=active.
  var lists = header.querySelectorAll('[data-tab-list]');
  Array.prototype.forEach.call(lists, function (list) {
    list.addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab || !list.contains(tab)) return;
      if (tab.getAttribute('href') === '#') e.preventDefault();
      Array.prototype.forEach.call(list.querySelectorAll('.tab'), function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        if (on) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
    });
  });

  // Placeholder links (#) in the util / my-menu should not jump to the top.
  Array.prototype.forEach.call(header.querySelectorAll('.util a[href="#"], .my-menu a[href="#"]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
