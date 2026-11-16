// Client-side filtering for the homepage grid / all-players table
(function () {
  var q = new URLSearchParams(location.search).get('q') || '';
  var input = document.getElementById('filter');
  var empty = document.getElementById('empty');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
  var group = '';

  function apply() {
    var needle = (input.value || '').trim().toLowerCase();
    var shown = 0;
    items.forEach(function (el) {
      var hay = (el.getAttribute('data-search') || '');
      var g = el.getAttribute('data-group') || '';
      var okText = !needle || hay.indexOf(needle) > -1;
      var okGroup = !group || g === group;
      var ok = okText && okGroup;
      el.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  if (input) {
    input.value = q;
    input.addEventListener('input', apply);
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      group = chip.getAttribute('data-group') || '';
      apply();
    });
  });
  apply();
})();
