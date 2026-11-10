/* Evidence map: the "Skills, and where they're proven" table drawn as a two-column map.
   Built from the table itself, so the table stays the single source and the accessible view.
   Hover or focus a skill to light up where it is proven; hover a source to see what it proves. */
(function () {
  'use strict';
  var sec = document.getElementById('proof'), wrap = sec && sec.querySelector('.table-wrap'), mapEl = document.getElementById('emap');
  if (!sec || !wrap || !mapEl || !window.matchMedia) return;
  var wide = window.matchMedia('(min-width: 900px)');
  var SOURCES = [
    { key: 'edvoy', name: 'Edvoy', kind: 'Production', href: '#experience', match: /^Edvoy/ },
    { key: 'copilot', name: 'Market Research Copilot', kind: 'Personal build', href: 'copilot.html', match: /Market Research Copilot/ },
    { key: 'review', name: 'Code Review Agent', kind: 'Personal build', href: 'review.html', match: /Code Review Agent/ },
    { key: 'rbac', name: 'Permission-Aware RAG', kind: 'Personal build', href: 'rbac.html', match: /Permission-Aware RAG/ },
    { key: 'daily', name: 'Daily work', kind: 'Tooling', href: '#experience', match: /Daily work/ }
  ];
  var BUILDS = ['copilot', 'review', 'rbac'];
  var NS = 'http://www.w3.org/2000/svg';
  var svg, skillEls = [], srcEls = {}, edges = [], pinned = null;

  function rows() {
    return Array.prototype.filter.call(wrap.querySelectorAll('tbody tr'), function (tr) { return !tr.hidden; }).map(function (tr) {
      var cells = tr.children, to = [];
      Array.prototype.forEach.call(cells[1].querySelectorAll('a'), function (a) {
        SOURCES.forEach(function (s) { if (s.match.test(a.textContent.trim()) && to.indexOf(s.key) < 0) to.push(s.key); });
      });
      if (/every build/.test(cells[1].textContent)) BUILDS.forEach(function (k) { if (to.indexOf(k) < 0) to.push(k); });
      return { name: cells[0].textContent.trim(), tier: tr.getAttribute('data-tier'), tierText: cells[2].textContent.trim(), to: to };
    });
  }

  function build() {
    var data = rows();
    mapEl.textContent = ''; skillEls = []; srcEls = {}; edges = []; pinned = null;
    svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'emap-lines'); svg.setAttribute('aria-hidden', 'true');
    var left = document.createElement('ul'), right = document.createElement('ul');
    left.className = 'emap-skills'; right.className = 'emap-srcs';
    left.setAttribute('aria-label', 'Skills'); right.setAttribute('aria-label', 'Where they are proven');
    var GROUP = { prod: 'In production at Edvoy', build: 'Personal builds', tool: 'Tooling' }, lastTier = null;
    data.forEach(function (d, i) {
      if (d.tier !== lastTier) {
        lastTier = d.tier;
        var gh = document.createElement('li'); gh.className = 'emap-group'; gh.textContent = GROUP[d.tier] || d.tierText; left.appendChild(gh);
      }
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'emap-skill'; b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', d.name + ', ' + d.tierText + '. Proven in ' + d.to.map(function (k) { return SOURCES.filter(function (s) { return s.key === k; })[0].name; }).join(', '));
      b.textContent = d.name;
      b.addEventListener('mouseenter', function () { light({ skill: i }); });
      b.addEventListener('focus', function () { light({ skill: i }); });
      b.addEventListener('mouseleave', restore); b.addEventListener('blur', restore);
      b.addEventListener('click', function () { pinned = pinned === i ? null : i; skillEls.forEach(function (x, j) { x.setAttribute('aria-pressed', pinned === j ? 'true' : 'false'); }); restore(); });
      li.appendChild(b); left.appendChild(li); skillEls.push(b);
    });
    SOURCES.forEach(function (s) {
      var count = data.filter(function (d) { return d.to.indexOf(s.key) >= 0; }).length;
      if (!count) return;
      var li = document.createElement('li'), a = document.createElement('a');
      a.className = 'emap-src'; a.href = s.href;
      a.innerHTML = '<span class="n"></span><span class="k"></span>';
      a.querySelector('.n').textContent = s.name;
      a.querySelector('.k').textContent = s.kind + ' · ' + count + ' skill' + (count === 1 ? '' : 's');
      a.addEventListener('mouseenter', function () { light({ src: s.key }); });
      a.addEventListener('focus', function () { light({ src: s.key }); });
      a.addEventListener('mouseleave', restore); a.addEventListener('blur', restore);
      li.appendChild(a); right.appendChild(li); srcEls[s.key] = a;
    });
    data.forEach(function (d, i) {
      d.to.forEach(function (k) {
        var p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'emap-edge'); svg.appendChild(p);
        edges.push({ skill: i, src: k, el: p });
      });
    });
    mapEl.appendChild(svg); mapEl.appendChild(left); mapEl.appendChild(right);
    draw(); restore();
  }

  function draw() {
    if (!svg) return;
    var box = mapEl.getBoundingClientRect();
    svg.setAttribute('width', box.width); svg.setAttribute('height', box.height);
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    edges.forEach(function (e) {
      var a = skillEls[e.skill].getBoundingClientRect(), b = srcEls[e.src].getBoundingClientRect();
      var x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top, x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top, mx = (x1 + x2) / 2;
      e.el.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2);
    });
  }

  function light(f) {
    mapEl.classList.add('focusing');
    var on = {};
    edges.forEach(function (e) {
      var hit = f.skill !== undefined ? e.skill === f.skill : e.src === f.src;
      e.el.classList.toggle('on', hit);
      if (hit) { on['s' + e.skill] = 1; on[e.src] = 1; }
    });
    skillEls.forEach(function (b, i) { b.classList.toggle('on', !!on['s' + i]); });
    Object.keys(srcEls).forEach(function (k) { srcEls[k].classList.toggle('on', !!on[k]); });
  }
  function restore() {
    if (pinned !== null) { light({ skill: pinned }); return; }
    mapEl.classList.remove('focusing');
    edges.forEach(function (e) { e.el.classList.remove('on'); });
    skillEls.forEach(function (b) { b.classList.remove('on'); });
    Object.keys(srcEls).forEach(function (k) { srcEls[k].classList.remove('on'); });
  }

  /* view toggle: map on wide screens by default, table always available */
  var toggle = sec.querySelector('.view-toggle'), btns = toggle ? toggle.querySelectorAll('button') : [];
  var view = 'map';
  function apply() {
    var showMap = wide.matches && view === 'map';
    if (toggle) toggle.hidden = !wide.matches;
    mapEl.hidden = !showMap; wrap.hidden = showMap;
    var note = document.getElementById('emap-note'); if (note) note.hidden = !showMap;
    Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === view ? 'true' : 'false'); });
    if (showMap) build();
  }
  Array.prototype.forEach.call(btns, function (b) { b.addEventListener('click', function () { view = b.getAttribute('data-v'); apply(); }); });
  sec.querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { setTimeout(function () { if (!mapEl.hidden) build(); }, 0); }); });
  if (wide.addEventListener) wide.addEventListener('change', apply); else if (wide.addListener) wide.addListener(apply);
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (!mapEl.hidden) draw(); }).observe(mapEl);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!mapEl.hidden) draw(); });
  apply();
})();
