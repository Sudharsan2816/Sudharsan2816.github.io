/* Replays for the case-study pages. Each page embeds its data as JSON; nothing here calls a model.
   The RBAC page can also run the project's own permission code in the browser through Pyodide. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* The run log stores answers in light Markdown: bold, bullets and line breaks. */
  function md(src) {
    var out = [], list = null;
    esc(src).split('\n').forEach(function (line) {
      var t = line.trim();
      if (!t) { list = null; return; }
      var b = /^\* (.*)$/.exec(t), body = (b ? b[1] : t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (b) { if (!list) { list = []; out.push(list); } list.push(body); }
      else { list = null; out.push('<p>' + body + '</p>'); }
    });
    return out.map(function (x) { return Array.isArray(x) ? '<ul>' + x.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' : x; }).join('');
  }
  function stagger(nodes) {
    nodes.forEach(function (n, i) {
      n.classList.add('fade');
      if (reduce) { n.classList.add('in'); return; }
      setTimeout(function () { n.classList.add('in'); }, 40 + i * 130);
    });
  }
  function secs(ms) { return (ms / 1000).toFixed(1) + ' s'; }
  function countUp(node, ms) {
    if (reduce) { node.textContent = secs(ms); return; }
    var t0 = null, dur = Math.min(1100, 300 + ms / 60);
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur); node.textContent = secs(ms * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function press(group, on) { group.forEach(function (b) { b.setAttribute('aria-pressed', b === on ? 'true' : 'false'); }); }
  function pill(text, cls) { return h('span', { class: 'vp ' + cls, text: text }); }

  /* ---------- Market Research Copilot: the 9 Aug 2026 live test ---------- */
  function copilot(root, d) {
    var side = root.querySelector('.rp-side'), main = root.querySelector('.rp-main'), buttons = [];
    function state(r) { if (!r) return 'none'; if (r === 'fail') return 'fail'; return r.indexOf('latency') >= 0 ? 'slow' : 'pass'; }
    function verdictPill(r) { var s = state(r); return pill(s === 'fail' ? 'Fail' : s === 'slow' ? 'Pass, slow' : 'Pass', s === 'fail' ? 'fail' : s === 'slow' ? 'slow' : 'pass'); }
    function list(title, cases) {
      side.appendChild(h('p', { class: 'rp-h', text: title }));
      var wrap = h('div', { class: 'rp-list', role: 'group', 'aria-label': title });
      cases.forEach(function (c) {
        var st = state(c.result || (c.retest && c.retest.result));
        var b = h('button', { class: 'rp-q', type: 'button', 'aria-pressed': 'false' }, [
          h('span', { class: 'dot ' + st, 'aria-hidden': 'true' }),
          h('span', {}, [c.q, h('span', { class: 'sr-only', text: st === 'fail' ? ' (failed on the first run)' : '' })])
        ]);
        b.addEventListener('click', function () { show(c, b, true); });
        buttons.push(b); wrap.appendChild(b);
      });
      side.appendChild(wrap);
    }
    function show(c, b, animate) {
      press(buttons, b);
      main.textContent = '';
      var nodes = [];
      var meta = h('div', { class: 'rp-meta' }, [h('span', { class: 'rp-cat', text: c.cat }), h('span', { text: c.answer || c.note ? 'Case ' + c.id + ', first run' : 'Case ' + c.retest.id + ', retest only' })]);
      nodes.push(meta);
      if (c.setup) nodes.push(h('p', { class: 'prev', text: 'Asked straight after: “' + c.setup + '”' }));
      nodes.push(h('p', { class: 'bubble', text: c.q }));
      if (c.mode) {
        var t = h('b', { class: 't', text: '0.0 s' });
        var steps = h('ul', { class: 'steps' }, [
          h('li', { class: c.mode === 'documents' ? 'ok' : 'no' }, [h('span', { html: 'Answer mode: <b>' + (c.mode === 'documents' ? 'answered from the report' : 'not covered by the report') + '</b>' })]),
          h('li', { class: c.sources ? 'ok' : '' }, [h('span', { html: 'Sources cited: <b>' + c.sources + '</b>' })]),
          h('li', { class: state(c.result) === 'slow' ? 'no' : 'ok' }, [h('span', {}, ['Response time in the recorded run: ', t, state(c.result) === 'slow' ? ' (flagged as slow in the log)' : ''])])
        ]);
        nodes.push(steps);
        if (animate) setTimeout(function () { countUp(t, c.ms); }, reduce ? 0 : 200); else t.textContent = secs(c.ms);
      }
      if (c.answer) nodes.push(h('div', { class: 'ans' }, [h('span', { class: 'lbl', text: 'Answer, word for word from the run log' }), h('div', { html: md(c.answer) })]));
      else if (c.note) nodes.push(h('div', { class: 'ans note' }, [h('span', { class: 'lbl', text: 'The run log keeps a tester’s note for this case, not the answer text' }), h('p', { text: c.note })]));
      if (c.result) {
        var v = h('div', { class: 'verdict' }, [h('div', { class: 'row' }, [h('b', { text: 'First run' }), verdictPill(c.result), c.expected ? h('span', { text: 'Needed: ' + c.expected }) : null])]);
        if (c.why) v.appendChild(h('p', { style: 'margin:0', text: c.why }));
        nodes.push(v);
      }
      if (c.retest) {
        var r = c.retest;
        nodes.push(h('div', { class: 'retest' }, [
          h('span', { class: 'lbl', text: 'Retest after the fixes, case ' + r.id }),
          h('div', { class: 'row', style: 'display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline' }, [verdictPill(r.result), h('span', { text: r.observed })]),
          h('span', { style: 'font-size:13px;color:var(--muted)', text: (r.mode === 'documents' ? 'Answered from the report' : 'Not covered') + ' · ' + r.sources + ' source' + (r.sources === 1 ? '' : 's') + ' · ' + secs(r.ms) })
        ]));
      } else if (c.result && c.result !== 'fail') {
        nodes.push(h('p', { style: 'margin:0;font-size:13.5px;color:var(--muted)', text: 'Not repeated in the retest.' }));
      }
      nodes.forEach(function (n) { main.appendChild(n); });
      if (animate) stagger(nodes);
    }
    list('First run, 12 questions', d.cases);
    list('Added in the retest', d.extra);
    show(d.cases[0], buttons[0], false);
  }

  /* ---------- AI Code Review Agent: fixtures through the real grounding step ---------- */
  function review(root, d) {
    var tabs = root.querySelector('.rp-tabs'), main = root.querySelector('.rp-main'), buttons = [];
    var CATS = ['bugs', 'security', 'performance', 'code_quality'];
    function diffView(diff) {
      var pre = h('pre', { class: 'diff', 'aria-label': 'Diff of ' + diff.file });
      pre.appendChild(h('span', { class: 'file', text: diff.file }));
      diff.patch.replace(/\n$/, '').split('\n').forEach(function (l) {
        pre.appendChild(h('span', { class: l[0] === '+' ? 'add' : l[0] === '-' ? 'del' : l.indexOf('@@') === 0 ? 'hunk' : '', text: l || ' ' }));
      });
      return pre;
    }
    function items(s) {
      var out = [];
      CATS.forEach(function (cat) {
        (s.model_output[cat] || []).forEach(function (f) {
          var kept = (s.grounded[cat] || []).filter(function (g) { return g.file === f.file && g.evidence === f.evidence; })[0];
          out.push({ kind: cat.replace('_', ' '), f: f, kept: kept });
        });
      });
      (s.model_output.suggested_fixes || []).forEach(function (f) {
        var kept = (s.grounded.suggested_fixes || []).filter(function (g) { return g.file === f.file && g.original === f.original; })[0];
        out.push({ kind: 'suggested fix', fix: true, f: f, kept: kept });
      });
      return out;
    }
    function card(it) {
      var f = it.f;
      var c = h('div', { class: 'finding' }, [
        h('div', {}, [it.fix ? h('span', { class: 'sev', text: 'Suggested fix' }) : h('span', { class: 'sev ' + f.severity, text: f.severity + ' · ' + it.kind })]),
        h('span', { class: 'desc', text: it.fix ? f.issue + ': “' + f.improved + '”' : f.description }),
        h('span', { class: 'loc', text: f.file + (it.fix ? '' : ', line ' + (f.line === null ? 'not given' : f.line)) }),
        h('span', {}, ['Quotes ', h('q', { text: it.fix ? f.original : f.evidence })])
      ]);
      return c;
    }
    function scoreText(sc) { return 'quality ' + sc.quality + ' · security ' + sc.security + ' · performance ' + sc.performance; }
    function show(s, b) {
      press(buttons, b);
      main.textContent = '';
      var list = items(s), cards = list.map(card);
      var modelCol = h('div', { class: 'rp-col' }, [h('h3', { text: 'What the model replied (a test fixture)' })].concat(cards).concat([
        h('div', { class: 'scores' }, [h('span', {}, ['Its verdict: ', h('b', { text: s.model_output.final_verdict.replace('_', ' ') })]), h('span', { text: 'Its scores: ' + scoreText(s.model_output.scores) })])
      ]));
      main.appendChild(h('div', { class: 'rp-cols' }, [h('div', { class: 'rp-col' }, [h('h3', { text: 'The change under review' }), diffView(s.diff)]), modelCol]));
      var run = h('button', { class: 'rp-btn', type: 'button', text: 'Run the grounding step' });
      var out = h('div', { class: 'rp-col', 'aria-live': 'polite' });
      main.appendChild(run); main.appendChild(out);
      run.addEventListener('click', function () {
        run.disabled = true;
        var tags = [];
        list.forEach(function (it, i) {
          var tg = it.kept
            ? h('span', { class: 'tagline kept', text: 'Kept' + (it.kept.line !== it.f.line && !it.fix ? ', line corrected to ' + it.kept.line + ' from the diff' : '') })
            : h('span', { class: 'tagline dropped', text: 'Dropped: the quoted text is not a changed line that supports this claim' });
          tags.push(function () { cards[i].classList.add(it.kept ? 'kept' : 'dropped'); cards[i].insertBefore(tg, cards[i].firstChild); });
        });
        var g = s.grounded, v = g.final_verdict.replace('_', ' ');
        var box = h('div', { class: 'outcome-box' }, [
          h('span', { style: 'font-size:13px;font-weight:600;color:var(--muted)', text: 'Verdict computed in code' }),
          h('span', { class: 'big ' + (g.final_verdict === 'APPROVE' ? 'ok' : g.final_verdict === 'REQUEST_CHANGES' ? 'no' : 'mid'), text: v }),
          h('span', { text: g.summary }),
          h('span', { class: 'scores' }, [h('span', { text: 'Scores now: ' + scoreText(g.scores) }), h('span', { text: 'Dropped: ' + g.dropped_items })]),
          h('span', { style: 'font-size:14px;color:var(--muted)', text: d.why[s.id] })
        ]);
        var i = 0;
        (function next() {
          if (i < tags.length) { tags[i++](); setTimeout(next, reduce ? 0 : 380); return; }
          out.appendChild(box); stagger([box]);
          run.textContent = 'Grounding done';
        })();
      });
    }
    d.scenarios.forEach(function (s) {
      var b = h('button', { class: 'rp-tab', type: 'button', 'aria-pressed': 'false', text: s.title });
      b.addEventListener('click', function () { show(s, b); });
      buttons.push(b); tabs.appendChild(b);
    });
    show(d.scenarios[0], buttons[0]);

    /* approval gate: the two recorded graph runs */
    var gate = root.querySelector('.gate');
    if (gate) {
      var sw = gate.querySelector('.rp-sw'), trail = gate.querySelector('.trail'), res = gate.querySelector('.gate-res');
      var draw = function () {
        var on = sw.getAttribute('aria-checked') === 'true';
        var run = d.approval_gate.filter(function (x) { return x.require_human_approval === on; })[0];
        trail.textContent = '';
        var nodes = run.steps.map(function (st, i) { return h('li', { class: i === run.steps.length - 1 ? 'end' : '', text: st }); });
        if (!run.posted_to_github) nodes.push(h('li', { class: 'held', text: 'held for a person to approve' }));
        nodes.forEach(function (n) { trail.appendChild(n); });
        stagger(nodes);
        res.textContent = run.posted_to_github ? 'Posted to the pull request: ' + run.github_posts + ' comment, review saved.' : 'Nothing posted to GitHub; the review is saved and waits for approval.';
      };
      sw.addEventListener('click', function () { sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); draw(); });
      draw();
    }
  }

  /* ---------- Permission-Aware RAG: the checks before retrieval ---------- */
  function rbac(root, d) {
    var roleWrap = root.querySelector('.rb-roles'), qWrap = root.querySelector('.rb-qs'), main = root.querySelector('.rp-main');
    var roleBtns = [], qBtns = [], role = d.roles[1], query = d.questions[0];
    var LABEL = { json: 'JSON logs', csv: 'CSV incident reports', sql: 'SQL records', pdf: 'PDF documents', hybrid: 'every source' };
    function perms(list, ok) { return list.length ? list.map(function (p) { return h('span', { class: 'perm' + (ok === undefined ? '' : ok(p) ? ' yes' : ' no'), text: p }); }) : [h('span', { text: 'none' })]; }
    function render(res, live) {
      main.textContent = '';
      var isEval = d.eval.some(function (e) { return e.role === role && e.query === query; });
      var head = h('div', { class: 'rp-meta' }, [
        live ? h('span', { class: 'badge-live', text: 'Run just now in your browser' }) : h('span', { class: 'badge-rec', text: 'Precomputed with the same code' }),
        h('span', { text: role + ' asks:' }), isEval ? h('span', { text: 'This pair is one of the 7 committed eval cases' }) : null
      ]);
      var nodes = [head, h('p', { class: 'bubble', text: query })];
      var flow = h('ol', { class: 'flow' });
      if (res.status === 'security_violation') {
        flow.appendChild(h('li', {}, [h('div', {}, [h('div', { class: 'k', text: 'Prompt-injection screen' }), h('div', { class: 'v' }, ['Blocked before routing: ', h('b', { text: res.flags.join(', ') })])])]));
        nodes.push(flow);
        nodes.push(h('div', { class: 'outcome-box' }, [h('span', { class: 'big no', text: 'Blocked' }), h('span', { text: res.answer }), h('span', { style: 'font-size:14px;color:var(--muted)', text: 'The request is written to the audit log with the reason as a security flag.' })]));
      } else {
        var auth = function (p) { return res.authorized.indexOf(p) >= 0; };
        [['Prompt-injection screen', [h('span', { text: 'Nothing flagged' })]],
         ['Intent, by keyword', [h('b', { text: res.intent }), ' → searches ' + (LABEL[res.intent] || res.intent)]],
         ['Permissions this question needs', perms(res.required, auth)],
         [role + ' holds', perms(d.matrix[role])]].forEach(function (row) {
          flow.appendChild(h('li', {}, [h('div', {}, [h('div', { class: 'k', text: row[0] }), h('div', { class: 'v' }, row[1])])]));
        });
        nodes.push(flow);
        if (res.status === 'access_denied') {
          nodes.push(h('div', { class: 'outcome-box' }, [h('span', { class: 'big no', text: 'Access denied' }), h('span', { text: res.answer }), h('span', { style: 'font-size:14px;color:var(--muted)', text: 'No retriever runs, so nothing restricted can reach the model. The refusal is audited.' })]));
        } else {
          var partial = res.unauthorized.length > 0;
          nodes.push(h('div', { class: 'outcome-box' }, [
            h('span', { class: 'big ok', text: partial ? 'Allowed, in part' : 'Allowed' }),
            h('span', { text: 'Goes on to retrieval, filtered to what ' + role + ' may read: ' + res.authorized.join(', ') + '.' }),
            partial ? h('span', { style: 'font-size:14px;color:var(--muted)', text: 'Withheld: ' + res.unauthorized.join(', ') + '. A request is refused outright only when none of the permissions it needs are held.' }) : null
          ]));
        }
      }
      nodes.forEach(function (n) { main.appendChild(n); });
      stagger(nodes);
    }
    function pick() { render(d.grid[query][role], false); }
    d.roles.forEach(function (r) {
      var b = h('button', { class: 'rp-tab', type: 'button', 'aria-pressed': r === role ? 'true' : 'false', text: r });
      b.addEventListener('click', function () { role = r; press(roleBtns, b); if (d.grid[query]) pick(); else runOwn(query); });
      roleBtns.push(b); roleWrap.appendChild(b);
    });
    d.questions.forEach(function (q, i) {
      var b = h('button', { class: 'rp-tab', type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', text: q });
      b.addEventListener('click', function () { query = q; press(qBtns, b); pick(); });
      qBtns.push(b); qWrap.appendChild(b);
    });
    pick();

    /* Your own question: load Pyodide and the project's files on first use. */
    var form = root.querySelector('.rb-form'), input = root.querySelector('.rb-in'), status = root.querySelector('.rb-status'), go = form && form.querySelector('button');
    var PYO = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/', BASE = 'demo/enterprise-rag/';
    var FILES = ['app/__init__.py', 'app/routing/__init__.py', 'app/routing/intent_classifier.py', 'app/routing/query_router.py', 'app/security/__init__.py', 'app/security/rbac.py', 'app/security/prompt_injection.py', 'app/security/guardrails.py', 'query_checks.py'];
    var py = null, loading = null;
    function load() {
      if (py) return Promise.resolve(py);
      if (loading) return loading;
      loading = new Promise(function (res, rej) {
        if (window.loadPyodide) return res();
        var s = document.createElement('script'); s.src = PYO + 'pyodide.js'; s.onload = res;
        s.onerror = function () { rej(new Error('Python could not be downloaded from cdn.jsdelivr.net.')); };
        document.head.appendChild(s);
      }).then(function () { return window.loadPyodide({ indexURL: PYO }); })
        .then(function (p) {
          return Promise.all(FILES.map(function (f) { return fetch(BASE + f).then(function (r) { if (!r.ok) throw new Error('Missing ' + f); return r.text(); }); }))
            .then(function (texts) {
              FILES.forEach(function (f, i) { var dir = '/home/pyodide/erag/' + f.split('/').slice(0, -1).join('/'); p.FS.mkdirTree(dir); p.FS.writeFile('/home/pyodide/erag/' + f, texts[i]); });
              p.runPython("import sys\nsys.path.insert(0, '/home/pyodide/erag')\nimport json\nfrom query_checks import check");
              py = p; return p;
            });
        });
      loading.catch(function () { loading = null; });
      return loading;
    }
    function runOwn(q) {
      query = q; press(qBtns, null);
      go.disabled = true; status.className = 'rb-status';
      status.textContent = py ? 'Running…' : 'Loading Python into your browser (several MB, first time only)…';
      var t0 = performance.now();
      load().then(function (p) {
        p.globals.set('ROLE', role); p.globals.set('QUERY', q);
        var res = JSON.parse(p.runPython('json.dumps(check(ROLE, QUERY))'));
        render(res, true);
        status.textContent = 'Ran the repo’s own routing, permission and injection code in ' + Math.round(performance.now() - t0) + ' ms.';
      }).catch(function (e) {
        status.className = 'rb-status err';
        status.textContent = e.message + ' The examples above still work.';
      }).then(function () { go.disabled = false; });
    }
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim().slice(0, 200);
      if (!q) { input.focus(); return; }
      runOwn(q);
    });
  }

  var KINDS = { copilot: copilot, review: review, rbac: rbac };
  document.querySelectorAll('[data-replay]').forEach(function (root) {
    try {
      var data = JSON.parse(document.getElementById(root.getAttribute('data-src')).textContent);
      KINDS[root.getAttribute('data-replay')](root, data);
      root.removeAttribute('hidden');
      var fb = root.parentNode.querySelector('.rp-fallback'); if (fb) fb.hidden = true;
    } catch (e) { if (window.console) console.error(e); }
  });
})();
