/* Paper & Wires behaviour: the command line, the pipeline board, the case-study carousel,
   the architecture boards on case pages, and accordions that open fully on wide screens.
   Everything here reads data already in the page; nothing calls a model or a server. */
(function () {
  'use strict';
  var WIDE = window.matchMedia('(min-width: 1000px)');
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var data = (function () { var el = document.getElementById('pw-data'); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } })();

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'on') Object.keys(v).forEach(function (e) { n.addEventListener(e, v[e]); });
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function onWide(fn) { if (WIDE.addEventListener) WIDE.addEventListener('change', fn); else if (WIDE.addListener) WIDE.addListener(fn); }

  /* ---------- 01 the command line ---------- */
  function askBox(root) {
    var out = root.querySelector('.term-out'), cmdsWrap = root.querySelector('.term-cmds'), form = root.querySelector('.term-in'), input = form.querySelector('input');
    var trace = root.querySelector('.trace dl'), traceLine = root.querySelector('.trace-line');
    var O = data.outputs, order = data.commands, buttons = {};
    var alias = { stack: 'skills', capabilities: 'skills', 'cat capabilities.md': 'skills', rag: 'skills', agents: 'skills', evals: 'skills', about: 'whoami', me: 'whoami', who: 'whoami', ls: 'ls work', work: 'ls work', projects: 'ls work', results: 'cat results', numbers: 'cat results', proof: 'cat results',
      now: 'tail -f now', news: 'tail -f now', demos: 'open demos', demo: 'open demos', try: 'open demos', email: 'contact', mail: 'contact', hire: 'contact', '?': 'help', man: 'help' };
    function setTrace(input, matched, src, n) {
      if (trace) trace.innerHTML = '';
      var rows = [['input', input], ['matched', matched], ['source', src], ['model calls', '0'], ['answer', n + ' line' + (n === 1 ? '' : 's') + (n ? ', all linked' : '')]];
      if (trace) rows.forEach(function (r) { trace.appendChild(h('dt', { text: r[0] })); trace.appendChild(h('dd', { text: r[1], class: r[0] === 'model calls' ? 'ok-dot' : null })); });
      if (traceLine) { traceLine.innerHTML = ''; traceLine.append('matched ' + matched + ' · ' + src + ' · '); traceLine.appendChild(h('span', { class: 'ok-dot', text: '0 model calls' })); }
    }
    function show(cmd, typed) {
      var key = O[cmd] ? cmd : null;
      Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', k === key ? 'true' : 'false'); });
      out.innerHTML = '';
      out.appendChild(h('p', { class: 'term-note', text: 'A command line over this site. It looks things up; it doesn’t generate them.' }));
      out.appendChild(h('p', { class: 'term-cmd' }, [h('span', { class: 'd', text: '$ ' }), typed || cmd]));
      if (!key) {
        out.appendChild(h('p', { class: 'term-err', text: 'command not found: ' + (typed || cmd) }));
        var q = (typed || cmd).trim();
        out.appendChild(h('p', { class: 'term-line', style: '--kw:120px' }, [h('span', { class: 'k', text: 'try' }), h('span', { class: 'v' }, [
          'help, whoami, ls work, cat results, tail -f now, open demos, contact', q && window.pwSearch ? ' · or ' : '',
          q && window.pwSearch ? h('button', { type: 'button', class: 'chip mono', style: 'min-height:32px;display:inline-flex', text: 'search the site for “' + q.slice(0, 40) + '”', on: { click: function () { window.pwSearch(q); } } }) : null
        ])]));
        setTrace(typed || cmd, 'nothing', 'no page', 0);
        return;
      }
      var o = O[key], nodes = [];
      o.lines.forEach(function (l) {
        var v = l[2] ? h('a', { class: 'v', href: l[2], text: l[1], target: /^https?:/.test(l[2]) ? '_blank' : null, rel: /^https?:/.test(l[2]) ? 'noopener' : null })
          : (l[3] ? h('button', { type: 'button', class: 'v', style: 'all:unset;cursor:pointer;flex:1 1 260px;font-family:var(--sans);font-size:15px;text-decoration:underline;text-decoration-color:var(--rule);text-underline-offset:3px', text: l[1], on: { click: function () { show(l[3]); } } }) : h('span', { class: 'v', text: l[1] }));
        var p = h('p', { class: 'term-line', style: '--kw:' + (o.kw || '120px') }, [h('span', { class: 'k', text: l[0] }), v]);
        nodes.push(p); out.appendChild(p);
      });
      if (!REDUCE) nodes.forEach(function (n, i) { n.classList.add('fade'); setTimeout(function () { n.classList.add('in'); }, 30 + i * 70); });
      setTrace(typed || key, o.match, o.src, o.lines.length);
    }
    order.forEach(function (k) {
      var b = h('button', { type: 'button', class: 'chip mono', 'aria-pressed': 'false', text: k, on: { click: function () { show(k); } } });
      buttons[k] = b; cmdsWrap.appendChild(b);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = input.value.trim(); if (!raw) { show('help'); return; }
      var v = raw.toLowerCase().replace(/^\$\s*/, '').replace(/\s+/g, ' ');
      show(O[v] ? v : (alias[v] || v), raw);
      input.value = '';
    });
    show('whoami');
  }

  /* ---------- 02 the pipeline ---------- */
  function pipeline(sec) {
    var P = data.projects, S = data.stages, L = ['I', 'O', 'R', 'G', 'E'];
    var wb = sec.querySelector('[data-board]');
    var sel = { t: 'p', i: 0 };

    /* wide board */
    var pBtns = [], sBtns = [], svg, readmeBody, readmeHead, litLabel;
    function pOn(pi) { return sel.t === 'p' ? sel.i === pi : P[pi].stages.indexOf(sel.i) >= 0; }
    function sOn(si) { return sel.t === 's' ? sel.i === si : P[sel.i].stages.indexOf(si) >= 0; }
    function buildBoard() {
      wb.innerHTML = '';
      litLabel = h('span', { text: '' });
      wb.appendChild(h('p', { class: 'wb-k k c1' }, ['patch · work.graph   ', h('span', { class: 'sq-g', text: '●' }), ' ', litLabel]));
      wb.appendChild(h('p', { class: 'wb-k k c3', text: 'stages' }));
      wb.appendChild(h('p', { class: 'wb-k k c5', text: 'pick any node' }));
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'wires'); svg.setAttribute('aria-hidden', 'true');
      wb.appendChild(svg);
      var c1 = h('div', { class: 'wb-col c1', role: 'group', 'aria-label': 'Systems I have built' });
      P.forEach(function (p, pi) {
        var b = h('button', { type: 'button', class: 'node', 'aria-pressed': 'false', on: { click: function () { sel = { t: 'p', i: pi }; renderBoard(); } } }, [
          h('span', { class: 'node-h' }, [h('span', {}, ['0' + (pi + 1), h('span', { class: 'nh-code', text: ' · ' + p.code })]), h('span', { class: 'tag' + (p.prod ? ' prod' : ''), text: p.tag })]),
          h('span', { class: 'node-t', text: p.name }), h('span', { class: 'node-s', text: p.sub }), h('span', { class: 'port r', 'aria-hidden': 'true' })
        ]);
        pBtns.push(b); c1.appendChild(b);
      });
      var c3 = h('div', { class: 'wb-col c3', role: 'group', 'aria-label': 'Stages of an AI system' });
      S.forEach(function (s, si) {
        var n = P.filter(function (p) { return p.stages.indexOf(si) >= 0; }).length;
        var b = h('button', { type: 'button', class: 'node', 'aria-pressed': 'false', on: { click: function () { sel = { t: 's', i: si }; renderBoard(); } } }, [
          h('span', { class: 'node-h' }, [h('span', {}, [h('span', { class: 'nh-pre', text: 'stage.' }), s.key]), h('span', { text: n + ' in' })]),
          h('span', { class: 'node-t', text: s.name }), h('span', { class: 'node-s', text: s.sub }),
          h('span', { class: 'port l', 'aria-hidden': 'true' }), h('span', { class: 'port r', 'aria-hidden': 'true' })
        ]);
        sBtns.push(b); c3.appendChild(b);
      });
      readmeHead = h('span', { text: '' });
      readmeBody = h('div', { class: 'readme-b' });
      var c5 = h('div', { class: 'wb-col c5' }, [h('div', { class: 'readme', 'aria-live': 'polite' }, [h('span', { class: 'port l', 'aria-hidden': 'true' }), h('p', { class: 'readme-h' }, [readmeHead, h('b', { text: 'TXT' })]), readmeBody])]);
      wb.appendChild(c1); wb.appendChild(c3); wb.appendChild(c5);
      wb.appendChild(h('p', { class: 'wb-foot' }, [h('span', {}, [h('span', { class: 'sq-y', text: '■' }), ' production at Edvoy']), h('span', {}, [h('span', { class: 'sq-w', text: '■' }), ' personal build, public code']), h('span', { class: 'r', text: '5 systems · 5 stages · 15 wires' })]));
      if (window.ResizeObserver) new ResizeObserver(drawWires).observe(wb);
      renderBoard();
    }
    function mid(el, side) {
      var b = wb.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: (side === 'r' ? r.right : r.left) - b.left, y: r.top + r.height / 2 - b.top };
    }
    function drawWires() {
      if (!svg || !wb.offsetWidth) return;
      var paths = [], lit = 0, rd = wb.querySelector('.readme');
      P.forEach(function (p, pi) { p.stages.forEach(function (si) {
        var a = mid(pBtns[pi], 'r'), z = mid(sBtns[si], 'l'), mx = (a.x + z.x) / 2, on = sel.t === 'p' ? sel.i === pi : sel.i === si;
        paths.push({ d: 'M' + a.x + ' ' + a.y + ' C' + mx + ' ' + a.y + ', ' + mx + ' ' + z.y + ', ' + z.x + ' ' + z.y, on: on });
      }); });
      var b0 = wb.getBoundingClientRect(), rr = rd.getBoundingClientRect(), stacked = rr.top > sBtns[S.length - 1].getBoundingClientRect().bottom;
      S.forEach(function (s, si) {
        var a = mid(sBtns[si], 'r');
        if (stacked) {
          var bx = a.x + 11, ry = rr.top - b0.top;
          paths.push({ d: 'M' + a.x + ' ' + a.y + ' C' + bx + ' ' + a.y + ', ' + bx + ' ' + a.y + ', ' + bx + ' ' + (a.y + 10) + ' L' + bx + ' ' + ry, on: sOn(si) });
        } else {
          var z = mid(rd, 'l'), mx = (a.x + z.x) / 2;
          paths.push({ d: 'M' + a.x + ' ' + a.y + ' C' + mx + ' ' + a.y + ', ' + mx + ' ' + z.y + ', ' + z.x + ' ' + z.y, on: sOn(si) });
        }
      });
      var nWork = 0; P.forEach(function (p) { nWork += p.stages.length; });
      paths.forEach(function (p, k) { if (p.on && k < nWork) lit++; });
      svg.setAttribute('viewBox', '0 0 ' + wb.offsetWidth + ' ' + wb.offsetHeight);
      svg.innerHTML = '';
      paths.sort(function (a, b) { return a.on - b.on; }).forEach(function (p) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', p.d); if (p.on) el.setAttribute('class', 'lit'); svg.appendChild(el);
      });
      litLabel.textContent = lit + ' of ' + nWork + ' wires lit';
    }
    function readmeFor(target, isWide, which) {
      var kids = [], sel = which;
      if (sel.t === 'p') {
        var p = P[sel.i];
        kids.push(h('p', { class: 'rd-kind' + (p.prod ? ' prod' : ''), text: p.kind }), h(isWide ? 'h3' : 'p', { class: 'rd-title', text: p.name }), h('p', { class: 'rd-lede', text: p.lede }), h('p', { class: 'rd-body', text: p.body }),
          h('p', { class: 'rd-metric' }, [h('b', { text: p.metric }), h('span', { text: p.metricNote })]), h('p', { class: 'rd-stack', text: p.stack }));
        if (p.caseHref) kids.push(h('p', { class: 'rd-links' }, [h('a', { href: p.caseHref, text: 'Case study →' }), h('a', { href: p.tryHref, text: 'Try it →' }), h('a', { href: p.codeHref, target: '_blank', rel: 'noopener', text: 'Code ↗' })]));
        if (p.note) kids.push(h('p', { class: 'rd-body', text: p.note }));
        if (isWide) readmeHead.textContent = 'readme.txt — ' + p.code;
      } else {
        var s = S[sel.i];
        kids.push(h('p', { class: 'rd-kind stage', text: 'STAGE ' + (sel.i + 1) + ' OF 5' }), h(isWide ? 'h3' : 'p', { class: 'rd-title', text: s.name }), h('p', { class: 'rd-lede', text: s.line }));
        Object.keys(s.proofs).forEach(function (k) { var pp = P[+k]; kids.push(h('div', { class: 'rd-proof' }, [h('span', { class: pp.prod ? 'prod' : null, text: (pp.prod ? 'PRODUCTION · ' : '') + pp.name.toUpperCase() }), h('p', { text: s.proofs[k] })])); });
        if (isWide) readmeHead.textContent = 'readme.txt — stage.' + s.key;
      }
      target.innerHTML = ''; kids.forEach(function (k) { target.appendChild(k); });
    }
    function renderBoard() {
      pBtns.forEach(function (b, pi) { b.setAttribute('aria-pressed', sel.t === 'p' && sel.i === pi ? 'true' : 'false'); b.classList.toggle('on', pOn(pi)); });
      sBtns.forEach(function (b, si) { b.setAttribute('aria-pressed', sel.t === 's' && sel.i === si ? 'true' : 'false'); b.classList.toggle('on', sOn(si)); });
      readmeFor(readmeBody, true, sel);
      drawWires();
    }

    sec.querySelector('.pipe-fallback') && sec.querySelector('.pipe-fallback').setAttribute('hidden', '');
    buildBoard();
  }

  /* ---------- 03 the case-study carousel ---------- */
  function carousel(sec) {
    var list = sec.querySelector('.cases'), cards = [].slice.call(list.children), ci = 0, lbl = sec.querySelector('.cs-ctl .lbl');
    function apply() {
      var wide = WIDE.matches;
      cards.forEach(function (c, k) {
        var off = ((k - ci + 4) % 3) - 1;
        if (wide) {
          c.style.setProperty('--off', off); c.style.setProperty('--sc', off ? .82 : 1); c.style.setProperty('--op', off ? .55 : 1); c.style.setProperty('--z', 3 - Math.abs(off));
          if (off) { c.setAttribute('inert', ''); c.setAttribute('aria-hidden', 'true'); } else { c.removeAttribute('inert'); c.removeAttribute('aria-hidden'); }
        } else {
          ['--off', '--sc', '--op', '--z'].forEach(function (v) { c.style.removeProperty(v); });
          c.removeAttribute('inert'); c.removeAttribute('aria-hidden');
        }
      });
      if (lbl) lbl.textContent = '0' + (ci + 1) + ' / 0' + cards.length;
    }
    sec.querySelector('[data-prev]').addEventListener('click', function () { ci = (ci + cards.length - 1) % cards.length; apply(); });
    sec.querySelector('[data-next]').addEventListener('click', function () { ci = (ci + 1) % cards.length; apply(); });
    list.addEventListener('keydown', function (e) { if (!WIDE.matches) return; if (e.key === 'ArrowRight') { ci = (ci + 1) % 3; apply(); } if (e.key === 'ArrowLeft') { ci = (ci + 2) % 3; apply(); } });
    onWide(apply); apply();
  }

  /* ---------- accordions that are simply open on wide screens ---------- */
  function wideOpen(selector, firstOnly) {
    var all = [].slice.call(document.querySelectorAll(selector));
    if (!all.length) return;
    function apply() {
      all.forEach(function (d, i) {
        var s = d.querySelector('summary');
        if (WIDE.matches) { d.open = true; if (s) s.setAttribute('tabindex', '-1'); }
        else { d.open = firstOnly ? i === 0 : d.open; if (s) s.removeAttribute('tabindex'); }
      });
    }
    onWide(apply); apply();
  }

  /* ---------- case pages: architecture boards ---------- */
  function arch(root) {
    var btns = [].slice.call(root.querySelectorAll('.anode')), wires = [].slice.call(root.querySelectorAll('.arch-path .awire'));
    var entries = [].slice.call(root.querySelectorAll('.arch-all > div'));
    var a = root.querySelector('.arch-d .a'), b = root.querySelector('.arch-d .b');
    var pathN = root.querySelectorAll('.arch-path .anode').length;
    function pick(i) {
      btns.forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      wires.forEach(function (w, k) { w.classList.toggle('lit', i < pathN && (k === i - 1 || k === i)); });
      var e = entries[i];
      a.innerHTML = ''; a.appendChild(h('span', { text: e.getAttribute('data-step') })); a.appendChild(h('b', { text: e.querySelector('dt').textContent }));
      b.innerHTML = e.querySelector('dd').innerHTML;
    }
    btns.forEach(function (x, i) { x.addEventListener('click', function () { pick(i); }); });
    pick(+root.getAttribute('data-start') || 0);
  }

  /* ---------- search hand-off from the command line ---------- */
  window.pwSearch = function (q) { if (window.cmdkOpen) window.cmdkOpen(q); };

  document.querySelectorAll('[data-ask]').forEach(function (r) { if (data) askBox(r); });
  var pipe = document.querySelector('[data-pipeline]'); if (pipe && data) pipeline(pipe);
  var cs = document.querySelector('[data-carousel]'); if (cs) carousel(cs);
  document.querySelectorAll('[data-arch]').forEach(arch);
  wideOpen('.xp', true);
  document.querySelectorAll('[data-fig]').forEach(function (fig) {
    var b = fig.querySelector('.fig-sw'); if (!b) return;
    b.addEventListener('click', function () {
      var on = !fig.classList.contains('photo');
      fig.classList.toggle('photo', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'show ascii' : 'show photo';
    });
  });
})();
