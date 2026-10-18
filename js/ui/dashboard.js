/* ==========================================================================
   dashboard.js — the home screen: welcome + search + cube, numbers & charts,
   "This Year In My Life", and recent activity. All of it reads from
   data/sections/home.js.
   ========================================================================== */
(function () {
  'use strict';
  var RDW = window.RDW; var h = RDW.h;
  var KEY = 'home';
  var DEFAULT_WELCOME = 'Welcome.';
  var RECENT = [{ id: 'projects', label: 'Projects' }, { id: 'milestones', label: 'Milestones' }, { id: 'achievements', label: 'Achievements' }];

  function doc() { return RDW.store.get(KEY) || { metrics: [], recent: {}, thisYear: {} }; }
  function has(v) { return String(v === undefined || v === null ? '' : v).trim() !== ''; }

  function widget(id, title, body) {
    return h('section', { class: 'block block--widget', id: 'b-' + id, 'data-block': id, 'aria-labelledby': 'bt-' + id },
      h('div', { class: 'block-head' }, h('h2', { class: 'block-title', id: 'bt-' + id }, title)), h('div', { class: 'block-body' }, body));
  }

  /* ---- the cube ------------------------------------------------------------------- */
  function cube() {
    var site = RDW.site || {};
    var wanted = (site.hero && site.hero.cubeFaces) || [];
    var secs = RDW.nav.list(false).filter(function (s) { return s.id !== 'home'; });
    var faces = wanted.map(function (id) { return secs.filter(function (s) { return s.id === id; })[0]; }).filter(Boolean);
    secs.forEach(function (s) { if (faces.length < 6 && faces.indexOf(s) === -1) faces.push(s); });
    faces = faces.slice(0, 6);
    if (faces.length < 2) return null;
    var names = ['front', 'right', 'back', 'left', 'top', 'bottom'];
    var st = { rx: -18, ry: 28, vy: 0, drag: false, moved: 0, hover: false, last: null, captured: false };
    var cubeEl = h('div', { class: 'cube' });
    names.forEach(function (n, i) {
      var s = faces[i % faces.length];
      cubeEl.appendChild(h('button', { type: 'button', class: 'cube-face cube-face--' + n, 'aria-label': 'Open ' + s.title,
        onClick: function (ev) { if (st.moved > 6) { ev.preventDefault(); return; } RDW.sfx.play('click'); RDW.router.go(s.id); } },
        h('span', { class: 'cube-glyph', 'aria-hidden': 'true' }, s.glyph), h('span', { class: 'cube-name' }, s.title)));
    });
    var scene = h('div', { class: 'cube-scene', role: 'group', tabindex: '0', 'aria-label': 'Shortcut cube. Drag it or use the arrow keys to turn it. Each face opens a section.' }, cubeEl);
    function apply() { cubeEl.style.transform = 'rotateX(' + st.rx + 'deg) rotateY(' + st.ry + 'deg)'; }
    apply();
    scene.addEventListener('pointerdown', function (e) { st.drag = true; st.moved = 0; st.captured = false; st.last = [e.clientX, e.clientY]; });
    scene.addEventListener('pointermove', function (e) {
      if (!st.drag) return;
      var dx = e.clientX - st.last[0], dy = e.clientY - st.last[1]; st.last = [e.clientX, e.clientY];
      st.moved += Math.abs(dx) + Math.abs(dy);
      if (st.moved > 6 && !st.captured) { st.captured = true; try { scene.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } }
      st.ry += dx * 0.6; st.rx = RDW.clamp(st.rx - dy * 0.6, -80, 80); st.vy = dx * 0.6; apply();
    });
    var end = function () { st.drag = false; setTimeout(function () { st.moved = 0; }, 0); };
    scene.addEventListener('pointerup', end); scene.addEventListener('pointercancel', end);
    scene.addEventListener('pointerenter', function () { st.hover = true; }); scene.addEventListener('pointerleave', function () { st.hover = false; });
    scene.addEventListener('keydown', function (e) {
      var step = 20;
      if (e.key === 'ArrowLeft') st.ry -= step; else if (e.key === 'ArrowRight') st.ry += step;
      else if (e.key === 'ArrowUp') st.rx = RDW.clamp(st.rx + step, -80, 80); else if (e.key === 'ArrowDown') st.rx = RDW.clamp(st.rx - step, -80, 80);
      else return;
      e.preventDefault(); apply();
    });
    (function tick() {
      if (!scene.isConnected) return;
      if (!st.drag) {
        if (Math.abs(st.vy) > 0.02) { st.ry += st.vy; st.vy *= 0.93; }
        else if (RDW.motionOK() && !st.hover && RDW.settings.get('tilt') !== 'off') st.ry += 0.22;
        apply();
      }
      requestAnimationFrame(tick);
    })();
    return scene;
  }

  /* ---- hero ----------------------------------------------------------------------- */
  function hero(d) {
    var welcome = has(d.welcome) ? d.welcome : DEFAULT_WELCOME;
    var input = h('input', { type: 'search', id: 'hero-search', placeholder: 'Search everything…', autocomplete: 'off', spellcheck: 'false', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': 'hero-results', 'aria-autocomplete': 'list' });
    var results = h('div', { class: 'results', id: 'hero-results', role: 'listbox', 'aria-label': 'Search results', hidden: true });
    setTimeout(function () { RDW.search.attach({ input: input, results: results }); }, 0);
    var c = cube();
    return h('section', { class: 'block block--widget hero', id: 'b-dash-welcome', 'data-block': 'dash-welcome', 'aria-labelledby': 'bt-dash-welcome' },
      h('div', { class: 'hero-main' },
        h('p', { class: 'hero-date' }, RDW.fmt.date(new Date())),
        h('h2', { class: 'hero-welcome block-title', id: 'bt-dash-welcome' }, RDW.rich(welcome)),
        h('p', { class: 'hero-id' }, h('strong', null, (RDW.site && RDW.site.name) || ''), (RDW.site && RDW.site.alias) ? h('span', { class: 'muted' }, ' · also known as ' + RDW.site.alias) : null),
        h('div', { class: 'hero-search' }, h('label', { for: 'hero-search', class: 'sr-only' }, 'Search every section'), input, results)),
      c ? h('div', { class: 'hero-cube' }, c, h('p', { class: 'hero-cube-hint muted', 'aria-hidden': 'true' }, 'Drag to spin')) : null);
  }

  /* ---- numbers & charts ------------------------------------------------------------- */
  function numbers(d) {
    var metrics = (d.metrics || []).filter(function (m) { return m && has(m.label); });
    var box = h('div', { class: 'numbers' });
    if (!metrics.length) { box.appendChild(h('p', { class: 'empty' }, 'No numbers yet. Add some in data/sections/home.js.')); return box; }
    var tabs = [
      { id: 'totals', label: 'Totals', build: RDW.charts.totals }, { id: 'trend', label: 'Trend', build: RDW.charts.trend },
      { id: 'mix', label: 'Mix', build: RDW.charts.mix }, { id: 'rhythm', label: 'By period', build: RDW.charts.rhythm }, { id: 'goals', label: 'Goals', build: RDW.charts.goals }
    ];
    var list = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Chart type' });
    var panels = h('div', { class: 'tabpanels' });
    var made = {}, current = RDW.storage.get('numbersTab', 'totals');
    if (!tabs.some(function (t) { return t.id === current; })) current = 'totals';

    function show(id, focus) {
      current = id; RDW.storage.set('numbersTab', id);
      RDW.$$('[role=tab]', list).forEach(function (b) { var on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      tabs.forEach(function (t) {
        var p = RDW.$('#tp-' + t.id, panels); if (!p) return; p.hidden = t.id !== id;
        if (t.id === id && !made[t.id]) { made[t.id] = true; p.appendChild(t.build(metrics)); }
      });
    }
    tabs.forEach(function (t, i) {
      list.appendChild(h('button', { type: 'button', role: 'tab', class: 'tab', id: 'tab-' + t.id, 'data-tab': t.id, 'aria-controls': 'tp-' + t.id, onClick: function () { RDW.sfx.play('click'); show(t.id); },
        onKeydown: function (e) {
          var k = e.key, n = tabs.length;
          if (k === 'ArrowRight') show(tabs[(i + 1) % n].id, true); else if (k === 'ArrowLeft') show(tabs[(i - 1 + n) % n].id, true);
          else if (k === 'Home') show(tabs[0].id, true); else if (k === 'End') show(tabs[n - 1].id, true); else return;
          e.preventDefault();
        } }, t.label));
      panels.appendChild(h('div', { role: 'tabpanel', id: 'tp-' + t.id, 'aria-labelledby': 'tab-' + t.id, hidden: true, tabindex: '0', class: 'tabpanel' }));
    });
    box.appendChild(RDW.charts.patternDefs());
    if (!RDW.charts.hasData(metrics)) box.appendChild(h('p', { class: 'empty' }, 'Every number is still zero, so the charts have nothing to show.'));
    box.appendChild(list); box.appendChild(panels);
    setTimeout(function () { show(current); }, 0);   // after it is in the page, so charts can measure themselves
    return box;
  }

  /* ---- this year -------------------------------------------------------------------- */
  function thisYear(d) {
    var now = new Date(), year = String(now.getFullYear());
    var ty = d.thisYear || {};
    var wrap = h('div', { class: 'thisyear' });
    var start = new Date(now.getFullYear(), 0, 1), end = new Date(now.getFullYear() + 1, 0, 1);
    var pct = Math.round((now - start) / (end - start) * 100);
    wrap.appendChild(h('div', { class: 'ty-top' },
      h('span', { class: 'ty-year' }, year),
      h('div', { class: 'ty-progress', role: 'meter', 'aria-label': 'Year progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, h('i', { style: { width: pct + '%' } })),
      h('span', { class: 'muted ty-pct' }, pct + '%')));
    var any = false;
    if (has(ty.headline)) { any = true; wrap.appendChild(h('p', { class: 'ty-headline' }, RDW.rich(ty.headline))); }
    var rows = (d.metrics || []).map(function (m) { return { m: m, v: RDW.charts.valueFor(m, year) }; }).filter(function (r) { return r.v > 0; });
    if (rows.length) { any = true; wrap.appendChild(h('div', { class: 'stats-grid' }, rows.map(function (r) { return h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, RDW.fmt.number(r.v)), h('span', { class: 'stat-label' }, r.m.label), r.m.unit ? h('span', { class: 'stat-note muted' }, r.m.unit) : null); }))); }
    var hl = RDW.asArray(ty.highlights).filter(has);
    if (hl.length) { any = true; wrap.appendChild(h('ul', { class: 'bullets' }, hl.map(function (x) { return h('li', null, RDW.rich(x)); }))); }
    // pull the preview fields from the matching year page, if there is one
    var years = RDW.store.get('years');
    var page = years && (years.pages || []).filter(function (p) { return String(p.year) === year && !p.hidden; })[0];
    if (page) {
      var prev = (page.blocks || []).filter(function (b) { return b.id === 'year-preview'; })[0];
      var filled = prev && (prev.items || []).filter(function (i) { return has(i.value); });
      if (filled && filled.length) { any = true; wrap.appendChild(h('dl', { class: 'kv' }, filled.map(function (i) { return h('div', { class: 'kv-row' }, h('dt', null, i.label), h('dd', null, RDW.rich(i.value))); }))); }
      wrap.appendChild(h('p', null, h('button', { type: 'button', class: 'btn btn--small', onClick: function () { RDW.router.go('years', { page: page.id }); } }, 'Open the ' + year + ' page')));
    }
    if (!any) wrap.appendChild(h('p', { class: 'empty' }, 'Nothing written about this year yet.'));
    return wrap;
  }

  /* ---- recent ------------------------------------------------------------------------- */
  function recent(d) {
    var r = d.recent || {};
    var box = h('div', { class: 'recent' });
    var list = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Recent activity' });
    var body = h('div', { class: 'tabpanel', role: 'tabpanel', tabindex: '0' });
    var cur = RDW.storage.get('recentTab', 'projects');
    if (!RECENT.some(function (t) { return t.id === cur; })) cur = 'projects';
    function show(id, focus) {
      cur = id; RDW.storage.set('recentTab', id);
      RDW.$$('[role=tab]', list).forEach(function (b) { var on = b.dataset.tab === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      RDW.clear(body);
      var label = RECENT.filter(function (x) { return x.id === id; })[0].label;
      var items = (r[id] || []).filter(function (x) { return has(x.title); }).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 8);
      body.setAttribute('aria-label', label);
      if (!items.length) { body.appendChild(h('p', { class: 'empty' }, 'No ' + label.toLowerCase() + ' listed yet.')); return; }
      var ul = h('ul', { class: 'recent-list' });
      items.forEach(function (it) {
        ul.appendChild(h('li', { class: 'recent-item' }, h('div', { class: 'recent-top' }, h('strong', null, RDW.rich(it.title)), has(it.status) ? h('span', { class: 'tag' }, it.status) : null, has(it.date) ? h('span', { class: 'muted' }, RDW.fmt.nice(it.date)) : null),
          has(it.note) ? h('p', { class: 'muted' }, RDW.rich(it.note)) : null));
      });
      body.appendChild(ul);
    }
    RECENT.forEach(function (t, i) {
      list.appendChild(h('button', { type: 'button', role: 'tab', class: 'tab', 'data-tab': t.id, onClick: function () { RDW.sfx.play('click'); show(t.id); },
        onKeydown: function (e) { var n = RECENT.length; if (e.key === 'ArrowRight') show(RECENT[(i + 1) % n].id, true); else if (e.key === 'ArrowLeft') show(RECENT[(i - 1 + n) % n].id, true); else return; e.preventDefault(); } }, t.label));
    });
    box.appendChild(list); box.appendChild(body); show(cur);
    return box;
  }

  /* ---- public ----------------------------------------------------------------------- */
  RDW.dashboard = {
    menuItems: function () {
      return [{ id: 'dash-welcome', title: 'Welcome' }, { id: 'dash-numbers', title: 'Numbers & charts' }, { id: 'dash-thisyear', title: 'This Year In My Life' }, { id: 'dash-recent', title: 'Recent activity' }];
    },
    render: function (d) {
      var frag = document.createDocumentFragment();
      frag.appendChild(hero(d));
      frag.appendChild(widget('dash-numbers', 'Numbers & charts', numbers(d)));
      frag.appendChild(h('div', { class: 'dash-row' },
        widget('dash-thisyear', 'This Year In My Life', thisYear(d)),
        widget('dash-recent', 'Recent activity', recent(d))));
      return frag;
    },
    searchEntries: function () {
      var d = doc(), out = [];
      var sec = RDW.nav.find('home'); var title = sec ? sec.title : 'Home';
      var base = { sectionId: 'home', sectionTitle: title, pageId: null, pageTitle: '', group: '' };
      out.push(Object.assign({}, base, { blockId: 'dash-welcome', title: 'Welcome', raw: RDW.plain(d.welcome || DEFAULT_WELCOME) }));
      out.push(Object.assign({}, base, { blockId: 'dash-numbers', title: 'Numbers & charts', raw: (d.metrics || []).map(function (m) { return m.label + ' ' + (m.group || '') + ' ' + (m.unit || ''); }).join(' · ') }));
      var ty = d.thisYear || {};
      out.push(Object.assign({}, base, { blockId: 'dash-thisyear', title: 'This Year In My Life', raw: RDW.plain([ty.headline].concat(ty.highlights || []).join(' · ')) }));
      var rr = [];
      RECENT.forEach(function (t) { ((d.recent || {})[t.id] || []).forEach(function (i) { rr.push(RDW.plain([i.title, i.status, i.note].join(' '))); }); });
      out.push(Object.assign({}, base, { blockId: 'dash-recent', title: 'Recent activity', raw: rr.join(' · ') }));
      return out;
    }
  };
  RDW.search.addSource(function () { return RDW.dashboard.searchEntries(); });
})();
