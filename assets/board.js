/* 自定义战术板 —— 无依赖交互引擎 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1050, H = 698, PAD = 25;
  var IW = W - PAD * 2, IH = H - PAD * 2;
  var $ = function (id) { return document.getElementById(id); };
  var px = function (x) { return PAD + x * IW; };
  var py = function (y) { return PAD + y * IH; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  var FORMATIONS = {
    '4-4-2': [[1, .06, .50], [2, .20, .14], [3, .17, .37], [4, .17, .63], [5, .20, .86], [6, .42, .12], [7, .38, .38], [8, .38, .62], [9, .42, .88], [10, .62, .42], [11, .62, .58]],
    '4-3-3': [[1, .06, .50], [2, .22, .14], [3, .18, .36], [4, .18, .64], [5, .22, .86], [6, .36, .50], [7, .42, .30], [8, .42, .70], [9, .62, .12], [10, .68, .50], [11, .62, .88]],
    '4-2-3-1': [[1, .06, .50], [2, .20, .14], [3, .17, .38], [4, .17, .62], [5, .20, .86], [6, .34, .40], [7, .34, .60], [8, .52, .16], [9, .52, .50], [10, .52, .84], [11, .66, .50]],
    '3-5-2': [[1, .06, .50], [2, .16, .30], [3, .16, .50], [4, .16, .70], [5, .36, .10], [6, .36, .30], [7, .36, .50], [8, .36, .70], [9, .36, .90], [10, .60, .42], [11, .60, .58]],
    '5-3-2': [[1, .06, .50], [2, .20, .10], [3, .16, .32], [4, .16, .50], [5, .16, .68], [6, .20, .90], [7, .36, .30], [8, .36, .50], [9, .36, .70], [10, .58, .42], [11, .58, .58]],
    '4-1-4-1': [[1, .06, .50], [2, .20, .14], [3, .17, .38], [4, .17, .62], [5, .20, .86], [6, .32, .50], [7, .46, .14], [8, .46, .38], [9, .46, .62], [10, .46, .86], [11, .62, .50]],
    '3-4-3': [[1, .06, .50], [2, .16, .28], [3, .16, .50], [4, .16, .72], [5, .36, .12], [6, .36, .38], [7, .36, .62], [8, .36, .88], [9, .60, .22], [10, .64, .50], [11, .60, .78]]
  };

  var EXPORT_CSS = [
    '.bp-dot{stroke:#fff;stroke-width:2.2}',
    '.bp.home .bp-dot{fill:#e8505b}',
    '.bp.away .bp-dot{fill:#3d8bfd}',
    '.bp-num{fill:#fff;font-size:12px;font-weight:700;font-family:Arial,"Microsoft YaHei",sans-serif}',
    '.bp-name{fill:#fff;font-size:10.5px;font-weight:600;font-family:Arial,"Microsoft YaHei",sans-serif;paint-order:stroke;stroke:#072117;stroke-width:3px}',
    '.bp.hi .bp-dot{stroke:#ffd166;stroke-width:5}',
    '.sh-text{fill:#fff;font-size:22px;font-weight:700;font-family:Arial,"Microsoft YaHei",sans-serif;paint-order:stroke;stroke:#072117;stroke-width:5px}'
  ].join('');

  /* ---------------- 状态 ---------------- */
  var st = null;
  var tool = 'move';
  var sel = null;          // {team:'h'|'a', idx:n}
  var drag = null;
  var undoStack = [], redoStack = [];
  var ballSvg, shapesG, playersG, tempG;

  function blankTeam(name, color, form, mirror) {
    var f = FORMATIONS[form] || FORMATIONS['4-4-2'];
    return {
      name: name,
      color: color,
      form: form,
      players: f.map(function (p) {
        return { n: p[0], x: mirror ? 1 - p[1] : p[1], y: p[2], name: '' };
      })
    };
  }

  function defaultState() {
    return {
      t: '我的战术板',
      h: blankTeam('红队', '#e8505b', '4-4-2', false),
      a: blankTeam('蓝队', '#3d8bfd', '4-4-2', true),
      b: [.5, .5],
      showNames: true,
      shapes: []
    };
  }

  /* ---------------- 序列化（存档 / 分享 / 导入导出） ---------------- */
  function serialize() {
    var pack = function (t) {
      return { n: t.name, c: t.color, f: t.form, p: t.players.map(function (p) { return [p.n, +p.x.toFixed(4), +p.y.toFixed(4), p.name || '']; }) };
    };
    return {
      v: 1, t: st.t, z: st.showNames ? 1 : 0,
      h: pack(st.h), a: pack(st.a),
      b: [+st.b[0].toFixed(4), +st.b[1].toFixed(4)],
      s: st.shapes.map(function (s) { return s.slice(0); })
    };
  }

  function hydrate(o) {
    if (!o || !o.h || !o.a) return false;
    var unpack = function (t, mirrorDefault) {
      return {
        name: t.n || '球队', color: t.c || '#e8505b', form: t.f || '4-4-2',
        players: (t.p || []).map(function (p) { return { n: p[0], x: p[1], y: p[2], name: p[3] || '' }; })
      };
    };
    st = {
      t: o.t || '我的战术板',
      h: unpack(o.h), a: unpack(o.a),
      b: [o.b[0], o.b[1]],
      showNames: o.z !== 0,
      shapes: (o.s || []).map(function (s) { return s.slice(0); })
    };
    if ($('board-title')) $('board-title').value = st.t;
    return true;
  }

  /* ---------------- 球场 ---------------- */
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildPitch(svg) {
    var g = el('g', { 'class': 'pitch' }, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#0b3327' }, g);
    for (var i = 0; i < 10; i++) {
      el('rect', { x: PAD + i * IW / 10, y: PAD, width: IW / 10, height: IH, fill: i % 2 ? '#0d3a2b' : '#0f4030' }, g);
    }
    var line = function (x1, y1, x2, y2, op) {
      el('line', { x1: px(x1), y1: py(y1), x2: px(x2), y2: py(y2), stroke: '#fff', 'stroke-opacity': op || .5, 'stroke-width': 2 }, g);
    };
    el('rect', { x: px(0), y: py(0), width: IW, height: IH, fill: 'none', stroke: '#fff', 'stroke-opacity': .55, 'stroke-width': 2.5 }, g);
    line(.5, 0, .5, 1, .45);
    el('circle', { cx: px(.5), cy: py(.5), r: .0871 * IW, fill: 'none', stroke: '#fff', 'stroke-opacity': .45, 'stroke-width': 2 }, g);
    el('circle', { cx: px(.5), cy: py(.5), r: 4, fill: '#fff', 'fill-opacity': .8 }, g);
    [0, 1].forEach(function (side) {
      var bx = side === 1 ? 1 - 0.157 : 0;
      el('rect', { x: px(bx), y: py(.2037), width: .157 * IW, height: .5926 * IH, fill: 'none', stroke: '#fff', 'stroke-opacity': .5, 'stroke-width': 2 }, g);
      var gx = side === 1 ? 1 - 0.0524 : 0;
      el('rect', { x: px(gx), y: py(.3653), width: .0524 * IW, height: .2694 * IH, fill: 'none', stroke: '#fff', 'stroke-opacity': .45, 'stroke-width': 2 }, g);
      var spot = side === 1 ? 1 - .1048 : .1048;
      el('circle', { cx: px(spot), cy: py(.5), r: 3.5, fill: '#fff', 'fill-opacity': .8 }, g);
      el('rect', { x: side === 1 ? W - PAD : PAD - 12, y: py(.44), width: 12, height: .12 * IH, fill: '#e8f4ee', 'fill-opacity': .35, stroke: '#fff', 'stroke-opacity': .5 }, g);
      var r = .0871 * IW;
      var dy = Math.sqrt(Math.pow(9.15 / 68, 2) - Math.pow(5.5 / 68, 2));
      var edge = side === 1 ? 1 - .157 : .157;
      el('path', {
        d: 'M ' + px(edge) + ' ' + py(.5 - dy) + ' A ' + r + ' ' + r + ' 0 0 ' + (side === 1 ? 1 : 0) + ' ' + px(edge) + ' ' + py(.5 + dy),
        fill: 'none', stroke: '#fff', 'stroke-opacity': .4, 'stroke-width': 2
      }, g);
    });
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    var svg = $('board');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {}, svg);
    var m = el('marker', { id: 'bArrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#ffd166' }, m);

    buildPitch(svg);
    shapesG = el('g', { 'class': 'shapes' }, svg);
    var ballG = el('g', { 'class': 'ball' }, svg);
    el('circle', { r: 8, fill: '#fff', stroke: '#11271f', 'stroke-width': 2.5 }, ballG);
    el('circle', { r: 2.5, fill: '#11271f' }, ballG);
    ballSvg = ballG;
    playersG = el('g', { 'class': 'players' }, svg);
    tempG = el('g', { 'class': 'temp' }, svg);

    drawShapes();
    drawPlayers();
    placeBall();
  }

  function drawPlayers() {
    while (playersG.firstChild) playersG.removeChild(playersG.firstChild);
    ['h', 'a'].forEach(function (team) {
      var t = st[team];
      t.players.forEach(function (p, i) {
        var g = el('g', { 'class': 'bp ' + (team === 'h' ? 'home' : 'away'), 'data-team': team, 'data-idx': i }, playersG);
        el('circle', { r: 12, 'class': 'bp-dot', style: 'fill:' + t.color }, g);
        var num = el('text', { 'class': 'bp-num', 'text-anchor': 'middle', dy: '4' }, g);
        num.textContent = String(p.n);
        if (st.showNames && p.name) {
          var nm = el('text', { 'class': 'bp-name', 'text-anchor': 'middle', dy: '26' }, g);
          nm.textContent = p.name;
        }
        g.setAttribute('transform', 'translate(' + px(p.x).toFixed(2) + ',' + py(p.y).toFixed(2) + ')');
        if (sel && sel.team === team && sel.idx === i) g.classList.add('hi');
      });
    });
  }

  function drawShapes() {
    while (shapesG.firstChild) shapesG.removeChild(shapesG.firstChild);
    st.shapes.forEach(function (s) {
      var type = s[0];
      if (type === 'a' || type === 'p') {
        el('line', {
          x1: px(s[1]), y1: py(s[2]), x2: px(s[3]), y2: py(s[4]),
          stroke: '#ffd166', 'stroke-width': 3.4, 'stroke-linecap': 'round',
          'stroke-dasharray': type === 'p' ? '10 8' : 'none',
          'marker-end': 'url(#bArrow)'
        }, shapesG);
      } else if (type === 'z') {
        var x = Math.min(s[1], s[3]), y = Math.min(s[2], s[4]);
        el('rect', {
          x: px(x), y: py(y), width: Math.abs(s[3] - s[1]) * IW, height: Math.abs(s[4] - s[2]) * IH,
          fill: 'rgba(255,209,102,0.10)', stroke: 'rgba(255,209,102,0.6)', 'stroke-width': 2.5,
          'stroke-dasharray': '8 7', rx: 8
        }, shapesG);
      } else if (type === 'c') {
        var cx = (s[1] + s[3]) / 2, cy = (s[2] + s[4]) / 2;
        el('ellipse', {
          cx: px(cx), cy: py(cy), rx: Math.abs(s[3] - s[1]) * IW / 2, ry: Math.abs(s[4] - s[2]) * IH / 2,
          fill: 'none', stroke: 'rgba(255,209,102,0.75)', 'stroke-width': 2.5, 'stroke-dasharray': '8 7'
        }, shapesG);
      } else if (type === 't') {
        var tx = el('text', { 'class': 'sh-text', x: px(s[1]), y: py(s[2]), 'text-anchor': 'middle' }, shapesG);
        tx.textContent = s[3];
      }
    });
  }

  function placeBall() {
    ballSvg.setAttribute('transform', 'translate(' + px(st.b[0]).toFixed(2) + ',' + py(st.b[1]).toFixed(2) + ')');
  }

  /* ---------------- 坐标 / 命中 ---------------- */
  function toSvg(evt) {
    var svg = $('board');
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var m = svg.getScreenCTM();
    if (!m) return null;
    var p = pt.matrixTransform(m.inverse());
    return { sx: p.x, sy: p.y, x: clamp((p.x - PAD) / IW, 0, 1), y: clamp((p.y - PAD) / IH, 0, 1) };
  }

  function hitPlayer(p) {
    var best = null, bestD = 1e9;
    ['h', 'a'].forEach(function (team) {
      st[team].players.forEach(function (pl, i) {
        var d = Math.hypot(px(pl.x) - p.sx, py(pl.y) - p.sy);
        if (d < 20 && d < bestD) { bestD = d; best = { team: team, idx: i }; }
      });
    });
    return best;
  }

  function distToSeg(px1, py1, px2, py2, x, y) {
    var dx = px2 - px1, dy = py2 - py1;
    var len = dx * dx + dy * dy;
    var t = len ? clamp(((x - px1) * dx + (y - py1) * dy) / len, 0, 1) : 0;
    return Math.hypot(x - (px1 + t * dx), y - (py1 + t * dy));
  }

  function hitShape(p) {
    for (var i = st.shapes.length - 1; i >= 0; i--) {
      var s = st.shapes[i];
      if (s[0] === 'a' || s[0] === 'p') {
        if (distToSeg(px(s[1]), py(s[2]), px(s[3]), py(s[4]), p.sx, p.sy) < 12) return i;
      } else if (s[0] === 'z') {
        var x1 = Math.min(s[1], s[3]), x2 = Math.max(s[1], s[3]);
        var y1 = Math.min(s[2], s[4]), y2 = Math.max(s[2], s[4]);
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return i;
      } else if (s[0] === 'c') {
        var cx = (s[1] + s[3]) / 2, cy = (s[2] + s[4]) / 2;
        var rx = Math.abs(s[3] - s[1]) / 2 || .001, ry = Math.abs(s[4] - s[2]) / 2 || .001;
        var v = Math.pow((p.x - cx) / rx, 2) + Math.pow((p.y - cy) / ry, 2);
        if (Math.abs(v - 1) < 0.35) return i;
      } else if (s[0] === 't') {
        if (Math.hypot(px(s[1]) - p.sx, py(s[2]) - p.sy) < 40) return i;
      }
    }
    return -1;
  }

  /* ---------------- 交互 ---------------- */
  function bind() {
    var svg = $('board');
    svg.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      var p = toSvg(e);
      if (!p) return;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { }

      if (tool === 'erase') {
        var si = hitShape(p);
        if (si >= 0) { pushUndo(); st.shapes.splice(si, 1); render(); }
        return;
      }
      if (tool === 'text') {
        var txt = ($('text-input').value || '').trim();
        if (!txt) { flash('先在右侧填一句话，再点到球场上'); return; }
        pushUndo();
        st.shapes.push(['t', p.x, p.y, txt]);
        render(); afterChange();
        return;
      }
      if (tool === 'arrow' || tool === 'pass' || tool === 'zone' || tool === 'circle') {
        drag = { kind: 'shape', type: tool, from: p, last: p };
        return;
      }
      // move
      var hit = hitPlayer(p);
      if (hit) {
        sel = hit; drag = { kind: 'player', team: hit.team, idx: hit.idx };
        pushUndo(); drawPlayers(); syncPlayerPanel();
        return;
      }
      if (Math.hypot(px(st.b[0]) - p.sx, py(st.b[1]) - p.sy) < 20) {
        drag = { kind: 'ball' }; pushUndo();
        return;
      }
      sel = null; drawPlayers(); syncPlayerPanel();
    });

    svg.addEventListener('pointermove', function (e) {
      var p = toSvg(e);
      if (!p) return;
      if (!drag) return;
      if (drag.kind === 'player') {
        var pl = st[drag.team].players[drag.idx];
        pl.x = p.x; pl.y = p.y;
        var node = playersG.querySelector('[data-team="' + drag.team + '"][data-idx="' + drag.idx + '"]');
        if (node) node.setAttribute('transform', 'translate(' + px(pl.x).toFixed(2) + ',' + py(pl.y).toFixed(2) + ')');
      } else if (drag.kind === 'ball') {
        st.b = [p.x, p.y]; placeBall();
      } else if (drag.kind === 'shape') {
        drag.last = p;
        previewShape(drag);
      }
    });

    var finish = function () {
      if (!drag) return;
      if (drag.kind === 'shape') {
        var a = drag.from, b = drag.last;
        var type = drag.type === 'arrow' ? 'a' : drag.type === 'pass' ? 'p' : drag.type === 'zone' ? 'z' : 'c';
        var d = Math.hypot(px(a.x) - px(b.x), py(a.y) - py(b.y));
        if (d > 12) { st.shapes.push([type, +a.x.toFixed(4), +a.y.toFixed(4), +b.x.toFixed(4), +b.y.toFixed(4)]); }
        drag = null;
        render(); afterChange();
        return;
      }
      drag = null;
      render(); afterChange();
    };
    svg.addEventListener('pointerup', finish);
    svg.addEventListener('pointercancel', finish);

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    });
  }

  function previewShape(d) {
    while (tempG.firstChild) tempG.removeChild(tempG.firstChild);
    var a = d.from, b = d.last;
    if (d.type === 'arrow' || d.type === 'pass') {
      el('line', {
        x1: px(a.x), y1: py(a.y), x2: px(b.x), y2: py(b.y), stroke: '#ffd166', 'stroke-width': 3.4,
        'stroke-dasharray': d.type === 'pass' ? '10 8' : 'none', opacity: .85, 'marker-end': 'url(#bArrow)'
      }, tempG);
    } else if (d.type === 'zone') {
      el('rect', {
        x: px(Math.min(a.x, b.x)), y: py(Math.min(a.y, b.y)),
        width: Math.abs(b.x - a.x) * IW, height: Math.abs(b.y - a.y) * IH,
        fill: 'rgba(255,209,102,0.10)', stroke: 'rgba(255,209,102,0.6)', 'stroke-width': 2.5, 'stroke-dasharray': '8 7'
      }, tempG);
    } else {
      el('ellipse', {
        cx: px((a.x + b.x) / 2), cy: py((a.y + b.y) / 2),
        rx: Math.abs(b.x - a.x) * IW / 2, ry: Math.abs(b.y - a.y) * IH / 2,
        fill: 'none', stroke: 'rgba(255,209,102,0.75)', 'stroke-width': 2.5, 'stroke-dasharray': '8 7'
      }, tempG);
    }
  }

  /* ---------------- 历史 ---------------- */
  function snapshot() { return JSON.stringify(serialize()); }
  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
    updateHistoryUI();
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    hydrate(JSON.parse(undoStack.pop()));
    render(); syncPanel(); afterChange(false);
    updateHistoryUI();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    hydrate(JSON.parse(redoStack.pop()));
    render(); syncPanel(); afterChange(false);
    updateHistoryUI();
  }
  function updateHistoryUI() {
    if ($('btn-undo')) $('btn-undo').disabled = !undoStack.length;
    if ($('btn-redo')) $('btn-redo').disabled = !redoStack.length;
  }

  /* ---------------- 面板同步 ---------------- */
  function syncPlayerPanel() {
    var on = !!sel;
    ['p-num', 'p-name'].forEach(function (id) { $(id).disabled = !on; });
    if (!on) { $('p-num').value = ''; $('p-name').value = ''; $('p-label').textContent = '未选中球员'; return; }
    var p = st[sel.team].players[sel.idx];
    $('p-num').value = p.n;
    $('p-name').value = p.name || '';
    $('p-label').textContent = (sel.team === 'h' ? st.h.name : st.a.name) + ' · 第 ' + (sel.idx + 1) + ' 人';
  }

  function syncPanel() {
    $('team-h-name').value = st.h.name;
    $('team-a-name').value = st.a.name;
    $('team-h-color').value = st.h.color;
    $('team-a-color').value = st.a.color;
    $('form-h').value = st.h.form;
    $('form-a').value = st.a.form;
    $('board-title').value = st.t;
    $('chk-names').checked = st.showNames;
    syncPlayerPanel();
  }

  /* ---------------- 存档 ---------------- */
  var KEY_AUTO = 'fb_board_auto';
  var KEY_SLOT = 'fb_board_slot_';

  function afterChange(autosave) {
    if (autosave !== false) {
      try { localStorage.setItem(KEY_AUTO, JSON.stringify(serialize())); } catch (e) { }
    }
    updateShare();
  }

  function loadAuto() {
    try {
      var raw = localStorage.getItem(KEY_AUTO);
      if (raw) return hydrate(JSON.parse(raw));
    } catch (e) { }
    return false;
  }

  /* ---------------- 分享 ---------------- */
  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(str)));
  }

  function updateShare() {
    try {
      var hash = '#b=' + b64encode(JSON.stringify(serialize()));
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + hash);
    } catch (e) { }
  }

  function readHash() {
    var m = location.hash.match(/b=([A-Za-z0-9\-_]+)/);
    if (!m) return false;
    try { return hydrate(JSON.parse(b64decode(m[1]))); } catch (e) { return false; }
  }

  /* ---------------- 导出 ---------------- */
  function exportPNG() {
    var svg = $('board').cloneNode(true);
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    var style = document.createElementNS(NS, 'style');
    style.textContent = EXPORT_CSS;
    var defs = document.createElementNS(NS, 'defs');
    defs.appendChild(style);
    svg.insertBefore(defs, svg.firstChild);
    var data = new XMLSerializer().serializeToString(svg);
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = W * 2; c.height = H * 2;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (st.t || 'tactics-board').replace(/\s+/g, '-') + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        flash('已导出 PNG');
      }, 'image/png');
    };
    img.onerror = function () { flash('导出失败，换个浏览器试试'); };
    img.src = url;
  }

  function exportJSON() {
    var blob = new Blob([JSON.stringify(serialize(), null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (st.t || 'tactics-board').replace(/\s+/g, '-') + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    flash('已导出 JSON');
  }

  /* ---------------- 提示 ---------------- */
  var flashTimer = 0;
  function flash(msg) {
    var n = $('board-toast');
    if (!n) return;
    n.textContent = msg;
    n.classList.add('on');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { n.classList.remove('on'); }, 2200);
  }

  /* ---------------- 工具切换 ---------------- */
  function setTool(t) {
    tool = t;
    document.querySelectorAll('.toolbtn').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tool') === t);
    });
    var hint = {
      move: '拖动球员或足球；点一下球员可以改号码和名字',
      arrow: '按住拖动，画一条跑动箭头',
      pass: '按住拖动，画一条虚线传球',
      zone: '按住拖动，框出一块区域',
      circle: '按住拖动，圈住一片区域',
      text: '先填文字，再点到球场上',
      erase: '点一下要删掉的线、框或文字'
    };
    $('tool-hint').textContent = hint[t] || '';
    $('board').style.cursor = t === 'move' ? 'default' : 'crosshair';
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    st = defaultState();
    if (!readHash()) loadAuto();
    render();
    syncPanel();
    afterChange(false);
    updateHistoryUI();
    bind();
    setTool('move');

    document.querySelectorAll('.toolbtn').forEach(function (b) {
      b.addEventListener('click', function () { setTool(b.getAttribute('data-tool')); });
    });

    $('form-h').addEventListener('change', function () {
      pushUndo();
      st.h.form = this.value;
      st.h.players = FORMATIONS[this.value].map(function (p) { return { n: p[0], x: p[1], y: p[2], name: '' }; });
      render(); afterChange();
    });
    $('form-a').addEventListener('change', function () {
      pushUndo();
      st.a.form = this.value;
      st.a.players = FORMATIONS[this.value].map(function (p) { return { n: p[0], x: 1 - p[1], y: p[2], name: '' }; });
      render(); afterChange();
    });
    $('team-h-name').addEventListener('input', function () { st.h.name = this.value || '球队'; afterChange(); });
    $('team-a-name').addEventListener('input', function () { st.a.name = this.value || '球队'; afterChange(); });
    $('team-h-color').addEventListener('input', function () { st.h.color = this.value; drawPlayers(); afterChange(); });
    $('team-a-color').addEventListener('input', function () { st.a.color = this.value; drawPlayers(); afterChange(); });
    $('board-title').addEventListener('input', function () { st.t = this.value; afterChange(); });
    $('chk-names').addEventListener('change', function () { st.showNames = this.checked; drawPlayers(); afterChange(); });

    $('p-num').addEventListener('input', function () {
      if (!sel) return;
      var v = parseInt(this.value, 10);
      st[sel.team].players[sel.idx].n = isNaN(v) ? 0 : clamp(v, 0, 99);
      drawPlayers(); afterChange();
    });
    $('p-name').addEventListener('input', function () {
      if (!sel) return;
      st[sel.team].players[sel.idx].name = this.value.slice(0, 6);
      drawPlayers(); afterChange();
    });

    $('btn-undo').addEventListener('click', undo);
    $('btn-redo').addEventListener('click', redo);
    $('btn-clear-shapes').addEventListener('click', function () {
      pushUndo(); st.shapes = []; sel = null; render(); syncPanel(); afterChange(); flash('已清空线条');
    });
    $('btn-reset').addEventListener('click', function () {
      pushUndo();
      st.h.players = FORMATIONS[st.h.form].map(function (p) { return { n: p[0], x: p[1], y: p[2], name: '' }; });
      st.a.players = FORMATIONS[st.a.form].map(function (p) { return { n: p[0], x: 1 - p[1], y: p[2], name: '' }; });
      st.shapes = []; st.b = [.5, .5]; sel = null;
      render(); syncPanel(); afterChange(); flash('已重置站位');
    });
    $('btn-new').addEventListener('click', function () {
      if (!confirm('清空当前战术板，新建一块空板？')) return;
      pushUndo();
      undoStack.length = 0; redoStack.length = 0;
      st = defaultState(); render(); syncPanel(); afterChange(); updateHistoryUI(); flash('新建了一块空板');
    });

    $('btn-save').addEventListener('click', function () {
      var slot = $('slot').value;
      try {
        localStorage.setItem(KEY_SLOT + slot, JSON.stringify(serialize()));
        flash('已保存到本地存档 ' + slot);
      } catch (e) { flash('保存失败：浏览器存储不可用'); }
    });
    $('btn-load').addEventListener('click', function () {
      var slot = $('slot').value;
      try {
        var raw = localStorage.getItem(KEY_SLOT + slot);
        if (!raw) { flash('存档 ' + slot + ' 还是空的'); return; }
        pushUndo(); hydrate(JSON.parse(raw)); render(); syncPanel(); afterChange(); flash('已读取存档 ' + slot);
      } catch (e) { flash('读取失败'); }
    });
    $('btn-png').addEventListener('click', exportPNG);
    $('btn-json').addEventListener('click', exportJSON);
    $('btn-share').addEventListener('click', function () {
      var url = location.href;
      var done = function () { flash('链接已复制，发给队友就能打开同一块板'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('复制这个链接：', url); });
      } else {
        window.prompt('复制这个链接：', url);
      }
    });
    $('file-json').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var o = JSON.parse(fr.result);
          pushUndo(); hydrate(o); render(); syncPanel(); afterChange(); flash('已导入 JSON');
        } catch (e) { flash('这个文件读不出来'); }
      };
      fr.readAsText(f);
      this.value = '';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
