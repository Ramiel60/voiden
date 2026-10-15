/* Editorial sections (promotion / lookbook / style-feed):
   static content, hover handled in CSS. Placeholder links (#) must not jump to the top of the page.
   No modules, no fetch — works from file://. */
(function () {
  'use strict';

  var sections = document.querySelectorAll('.promotion, .lookbook, .style-feed');
  Array.prototype.forEach.call(sections, function (section) {
    section.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href="#"]') : null;
      if (a && section.contains(a)) e.preventDefault();
    });
  });
})();
