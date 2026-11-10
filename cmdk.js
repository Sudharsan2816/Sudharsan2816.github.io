/* Command palette for the whole site: Ctrl/Cmd+K or "/" opens it; type to filter; Enter opens.
   Any element with [data-cmdk-open] opens it too (the search buttons in each page's nav). */
(function () {
  'use strict';
  var here = (location.pathname.split('/').pop() || 'index.html');
  var EMAIL = 'vssudhan2003@gmail.com';
  var ISS = 'https://github.com/Sudharsan2816/Sudharsan2816.github.io/issues/new?template=';
  var ITEMS = [
    ['Home', 'Results you can check', 'index.html#results', 'numbers tests'],
    ['Home', 'Selected work', 'index.html#work', 'projects builds'],
    ['Home', 'Test the work yourself', 'index.html#try', 'demo replay try'],
    ['Home', 'What colleagues say', 'index.html#recs', 'recommendations references'],
    ['Home', 'Experience at Edvoy', 'index.html#experience', 'job work history data engineer'],
    ['Home', 'Skills, and where they’re proven', 'index.html#proof', 'stack map evidence'],
    ['Home', 'Engineering notes', 'index.html#notes', 'blog writing reports'],
    ['Home', 'Feedback', 'index.html#feedback', 'bug suggestion contact'],
    ['Case study', 'Market Research Copilot', 'copilot.html', 'rag faiss chunking reranking'],
    ['Case study', 'AI Code Review Agent', 'review.html', 'langgraph github webhook agent'],
    ['Case study', 'Permission-Aware RAG', 'rbac.html', 'rbac security roles jwt'],
    ['Try it', 'Replay the Copilot’s live test', 'copilot.html#try', 'demo chat answers copilot rag live test'],
    ['Try it', 'Run the grounding step on model replies', 'review.html#try', 'demo findings verdict code review agent grounding'],
    ['Try it', 'Run the permission checks in your browser', 'rbac.html#try', 'demo pyodide python live rbac rag permission security'],
    ['Copilot', 'Copilot: architecture', 'copilot.html#architecture', 'diagram'],
    ['Copilot', 'Copilot: evaluation and results', 'copilot.html#evaluation', 'benchmark hit@3 mrr'],
    ['Copilot', 'Copilot: how it was built', 'copilot.html#roadmap', 'roadmap stages'],
    ['Code Review Agent', 'Code Review Agent: architecture', 'review.html#architecture', 'diagram langgraph'],
    ['Code Review Agent', 'Code Review Agent: failure modes', 'review.html#failures', 'guardrails duplicate'],
    ['Code Review Agent', 'Code Review Agent: how it was built', 'review.html#roadmap', 'roadmap stages'],
    ['Permission-Aware RAG', 'Permission-Aware RAG: architecture', 'rbac.html#architecture', 'diagram'],
    ['Permission-Aware RAG', 'Permission-Aware RAG: evaluation', 'rbac.html#evaluation', 'allow deny cases'],
    ['Permission-Aware RAG', 'Permission-Aware RAG: how it was built', 'rbac.html#roadmap', 'roadmap stages'],
    ['Code', 'Copilot code on GitHub', 'https://github.com/Sudharsan2816/Projects/tree/main/ai-market-research-copilot', 'source repo'],
    ['Code', 'Code Review Agent code on GitHub', 'https://github.com/Sudharsan2816/Code_review_agent', 'source repo'],
    ['Code', 'Permission-Aware RAG code on GitHub', 'https://github.com/Sudharsan2816/Projects/tree/main/enterprise-rag', 'source repo'],
    ['Contact', 'Copy email address', 'copy:' + EMAIL, 'mail contact'],
    ['Contact', 'Send an email', 'mailto:' + EMAIL, 'mail contact'],
    ['Contact', 'GitHub profile', 'https://github.com/Sudharsan2816', 'code'],
    ['Contact', 'LinkedIn profile', 'https://www.linkedin.com/in/sudharsan-v-s-a851a3242', 'social'],
    ['Feedback', 'Report a bug', ISS + 'bug_report.yml', 'issue broken'],
    ['Feedback', 'Suggest an improvement', ISS + 'suggestion.yml', 'idea issue'],
    ['Feedback', 'Propose a scaling idea', ISS + 'scaling_idea.yml', 'scale issue load']
  ].map(function (r, i) { return { id: 'cmdk-' + i, group: r[0], title: r[1], href: r[2], keys: (r[0] + ' ' + r[1] + ' ' + r[3]).toLowerCase() }; });

  var dlg, input, list, status, active = 0, shown = [], lastFocus = null;

  function local(href) {
    var m = /^([a-z]+\.html)(#.*)?$/.exec(href);
    if (m && m[1] === here) return m[2] || '#';
    return href;
  }
  function score(item, q) {
    if (!q) return 1;
    var words = q.split(/\s+/), s = 0;
    for (var i = 0; i < words.length; i++) {
      var at = item.keys.indexOf(words[i]);
      if (at < 0) return 0;                                   // every word must appear
      s += at === 0 || item.keys[at - 1] === ' ' ? 4 : 1;     // word starts count more
    }
    return s + (item.title.toLowerCase().indexOf(q) === 0 ? 3 : 0);
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    shown = ITEMS.map(function (it, i) { return { it: it, s: score(it, q), i: i }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return q ? b.s - a.s || a.i - b.i : a.i - b.i; })
      .map(function (x) { return x.it; });
    active = 0;
    list.textContent = '';
    var group = null;
    shown.forEach(function (it, i) {
      if (!q && it.group !== group) {
        group = it.group;
        var gh = document.createElement('li'); gh.className = 'cmdk-group'; gh.setAttribute('role', 'presentation'); gh.textContent = group; list.appendChild(gh);
      }
      var li = document.createElement('li');
      li.id = it.id; li.className = 'cmdk-item'; li.setAttribute('role', 'option');
      var t = document.createElement('span'); t.className = 'cmdk-t'; t.textContent = it.title;
      var g = document.createElement('span'); g.className = 'cmdk-g';
      g.textContent = (q ? it.group : '') + (/^https?:/.test(it.href) ? ' ↗' : '');
      li.appendChild(t); li.appendChild(g);
      li.addEventListener('mousemove', function () { if (active !== i) { active = i; mark(); } });
      li.addEventListener('click', function () { go(it); });
      list.appendChild(li);
    });
    status.textContent = shown.length ? shown.length + ' result' + (shown.length === 1 ? '' : 's') : 'Nothing matches. Try “rag”, “demo” or “email”.';
    mark();
  }
  function mark() {
    var items = list.querySelectorAll('.cmdk-item');
    items.forEach(function (el, i) { el.setAttribute('aria-selected', i === active ? 'true' : 'false'); });
    var cur = items[active];
    if (cur) { input.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }
  function go(it) {
    if (it.href.indexOf('copy:') === 0) {
      var done = function () { status.textContent = 'Email address copied.'; setTimeout(close, 700); };
      try { navigator.clipboard.writeText(it.href.slice(5)).then(done, function () { status.textContent = it.href.slice(5); }); } catch (e) { status.textContent = it.href.slice(5); }
      return;
    }
    var href = local(it.href);
    close();
    if (/^https?:/.test(href)) window.open(href, '_blank', 'noopener');
    else location.href = href;
  }
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'cmdk';
    dlg.setAttribute('aria-label', 'Search the site');
    dlg.innerHTML = '<div class="cmdk-box">' +
      '<div class="cmdk-in"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M13 13l4 4"/></svg>' +
      '<input type="text" size="1" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search projects, demos, contact…" aria-label="Search the site">' +
      '<button type="button" class="cmdk-x" aria-label="Close">Esc</button></div>' +
      '<ul id="cmdk-list" role="listbox" aria-label="Results"></ul>' +
      '<p class="cmdk-foot"><span class="cmdk-status" role="status"></span><span class="cmdk-keys"><kbd>↑</kbd><kbd>↓</kbd> move <kbd>Enter</kbd> open <kbd>Esc</kbd> close</span></p></div>';
    document.body.appendChild(dlg);
    input = dlg.querySelector('input'); list = dlg.querySelector('ul'); status = dlg.querySelector('.cmdk-status');
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
      else if (e.key === 'Home') { active = 0; mark(); }
      else if (e.key === 'End') { active = shown.length - 1; mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) go(shown[active]); }
    });
    dlg.querySelector('.cmdk-x').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('cmdk-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  }
  function open() {
    if (!dlg) build();
    if (dlg.open) return;
    lastFocus = document.activeElement;
    input.value = '';
    render();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('cmdk-open');
    input.focus();
  }
  function close() { if (dlg && dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); dlg && dlg.open ? close() : open(); }
    else if (e.key === '/' && !typing && !(dlg && dlg.open)) { e.preventDefault(); open(); }
  });
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll('[data-cmdk-open]').forEach(function (b) {
    b.addEventListener('click', open);
    var k = b.querySelector('kbd'); if (k) k.textContent = mac ? '⌘K' : 'Ctrl K';
  });
})();
