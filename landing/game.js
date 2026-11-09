/* «تمرین قطعی» — a 45-second outage drill for the landing page.
   Dependencies arrive one by one on lanes from «اینترنت بین‌الملل» to «کار تو».
   Tapping a lane moves it to Liara (inside Iran); lanes still on the international
   link stop during outages. Score = share of lane-time that kept running.
   Canvas 2D, no external dependencies. */
(() => {
  'use strict';
  const E = window.edame;
  const box = document.getElementById('game-box');
  if (!E || !box) return;
  const { fa, track, decorate, tween, L } = E;
  const cv = box.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const overlay = document.getElementById('game-overlay');
  const live = document.getElementById('game-live');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const C = { bg: '#0B1224', navy7: '#1C2848', navy6: '#24304F', dim: '#3A4A70', teal: '#13B8A6', teal3: '#5FE0D1', amber: '#F6B94C', ice: '#F4F7FB', muted: '#8A97B5', red: '#F06A6A' };
  const FONT = '"Vazirmatn", Tahoma, sans-serif';
  const MONO = 'Consolas, "Cascadia Mono", Menlo, monospace';
  // Only things Liara actually provides (mirrors, database, storage, backup, email).
  const DEPS = [['npm', 1], ['PyPI', 1], ['Docker', 1], ['دیتابیس', 0], ['فایل‌ها', 0], ['Composer', 1], ['بکاپ', 0], ['ایمیل', 0]];
  const ARRIVE = [0, 0, 5, 10, 15, 20, 25, 30]; // second each lane appears
  const MAX = DEPS.length;
  const DURATION = 45;
  const MIGRATE = 0.7; // seconds a move takes

  /* ---------- Layout ---------- */
  let W = 0, H = 0, G = {};
  const layout = () => {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 560;
    const top = 104;
    G = { narrow, top, laneH: (H - top - 16) / MAX, xExt: narrow ? 30 : 74, xApp: W - (narrow ? 30 : 74), xMid: Math.round(W * (narrow ? 0.38 : 0.42)) };
  };
  const laneY = (i) => G.top + G.laneH * (i + 0.5);

  /* ---------- State ---------- */
  let S;
  const fresh = (demo) => {
    const s = { t: 0, lanes: [], packets: [], parts: [], floats: [], o: { phase: 'calm', t: 0, next: 4, dur: 0 }, up: 0, total: 0, delivered: 0, shake: 0, running: false, done: false, demo };
    return s;
  };
  const addLane = (s, on = false) => {
    const i = s.lanes.length;
    s.lanes.push({ i, name: DEPS[i][0], latin: !!DEPS[i][1], on, mig: -1, spawn: Math.random() * 0.6, born: s.t, hit: 0 });
  };
  const burst = (x, y, color, n, spread = 1) => {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = (40 + Math.random() * 120) * spread;
      S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, age: 0, color });
    }
  };
  const float = (x, y, text, color, mono) => S.floats.push({ x, y, text, color, mono, age: 0 });
  const say = (msg) => { if (live) live.textContent = msg; };

  /* ---------- Update ---------- */
  const update = (dt) => {
    const s = S;
    s.t += dt;
    if (!s.demo) while (s.lanes.length < MAX && s.t >= ARRIVE[s.lanes.length]) addLane(s);

    // Outage cycle: calm → warn (1.1s) → down (2.4–3.6s) → calm; gaps shrink over time.
    const o = s.o;
    o.t += dt;
    if (!s.demo) {
      if (o.phase === 'calm' && s.t >= o.next) { o.phase = 'warn'; o.t = 0; say('قطعی در راه است'); }
      else if (o.phase === 'warn' && o.t >= 1.1) {
        o.phase = 'down'; o.t = 0; o.dur = 3 + Math.random() * 1.5 + s.t * 0.03;
        if (!reduced) s.shake = 9;
        // Data already travelling over the international link is lost.
        s.packets = s.packets.filter((p) => {
          if (p.src !== 'ext' || p.lane.on) return true;
          burst(p.x, laneY(p.lane.i), C.red, 6, 0.6);
          return false;
        });
        s.lanes.forEach((l) => { if (!l.on) float((G.xExt + G.xMid) / 2, laneY(l.i) - 16, 'ETIMEDOUT', C.red, true); });
      } else if (o.phase === 'down' && o.t >= o.dur) {
        o.phase = 'calm'; o.t = 0;
        o.next = s.t + Math.max(1.4, 3.8 - s.t * 0.06) + Math.random() * 1.2;
      }
    }
    const down = o.phase === 'down';

    const speed = Math.max(220, W * 0.4);
    s.lanes.forEach((l) => {
      if (l.mig >= 0) {
        l.mig += dt / MIGRATE;
        if (l.mig >= 1) {
          l.mig = -1; l.on = true;
          burst(G.xMid, laneY(l.i), C.teal3, 18);
          float(G.xMid, laneY(l.i) - 18, 'منتقل شد', C.teal3, false);
        }
      }
      const ok = l.on || !down;
      if (s.running) { s.total += dt; if (ok) s.up += dt; }
      l.spawn -= dt;
      if (l.spawn <= 0) {
        l.spawn = 0.5 + Math.random() * 0.6;
        if (ok) s.packets.push({ lane: l, src: l.on ? 'in' : 'ext', x: l.on ? G.xMid + 12 : G.xExt + 10 });
      }
    });

    s.packets = s.packets.filter((p) => {
      p.x += speed * dt;
      if (p.x < G.xApp - 12) return true;
      s.delivered++; p.lane.hit = 1;
      return false;
    });
    s.lanes.forEach((l) => (l.hit = Math.max(0, l.hit - dt * 4)));
    s.parts = s.parts.filter((q) => { q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 160 * dt; return q.age < q.life; });
    s.floats = s.floats.filter((f) => { f.age += dt; f.y -= 26 * dt; return f.age < 1.2; });
    s.shake = Math.max(0, s.shake - dt * 30);

    if (s.running && s.t >= DURATION) finish();
  };

  /* ---------- Draw ---------- */
  const text = (str, x, y, { size = 15, weight = 700, color = C.ice, align = 'center', mono = false, alpha = 1 } = {}) => {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
    ctx.direction = mono ? 'ltr' : 'rtl';
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  };
  const line = (x1, y, x2, color, width, dash) => {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.restore();
  };
  const dot = (x, y, r, fill, glow) => {
    ctx.save();
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 14; }
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  const pill = (x, y, label, bg, fg) => {
    ctx.save();
    ctx.font = `800 15px ${FONT}`;
    const w = ctx.measureText(label).width + 34, h = 34;
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.restore();
    text(label, x, y + 1, { size: 15, weight: 800, color: fg });
  };

  const draw = () => {
    const s = S, o = s.o, down = o.phase === 'down', warn = o.phase === 'warn';
    const blink = Math.floor(s.t * 6) % 2 === 0;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (s.shake) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);

    // Liara column (inside Iran)
    ctx.save();
    ctx.fillStyle = 'rgba(19,184,166,.07)'; ctx.strokeStyle = 'rgba(19,184,166,.35)'; ctx.lineWidth = 1.5;
    const colW = G.narrow ? 46 : 64;
    ctx.beginPath(); ctx.roundRect(G.xMid - colW / 2, G.top - 30, colW, H - G.top + 18, 14); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Column headings
    const hy = G.narrow ? G.top - 18 : G.top - 46;
    const fs = G.narrow ? 12.5 : 15;
    text(G.narrow ? 'بین‌الملل' : 'اینترنت بین‌الملل', G.xExt - (G.narrow ? 6 : 0), hy, { size: fs, color: down ? C.red : C.muted, align: G.narrow ? 'left' : 'center' });
    text(G.narrow ? 'لیارا' : 'لیارا · داخل ایران', G.xMid, hy, { size: fs, color: C.teal3 });
    text('کار تو', G.xApp, hy, { size: fs, color: C.ice });

    // HUD
    const left = Math.max(0, Math.ceil(DURATION - s.t));
    const pct = s.total ? Math.round((s.up / s.total) * 100) : 100;
    if (!s.demo) {
      text(`زمان: ${fa(left)}`, W - 18, 26, { size: 16, weight: 800, align: 'right', color: left <= 5 && blink ? C.amber : C.ice });
      text(`ادامه: ${fa(pct)}٪`, 18, 26, { size: 16, weight: 800, align: 'left', color: pct >= 80 ? C.teal3 : pct >= 60 ? C.amber : C.red });
      if (warn && blink) pill(W / 2, G.narrow ? 56 : 26, 'قطعی در راه…', C.amber, C.bg);
      if (down) pill(W / 2, G.narrow ? 56 : 26, 'قطعی! اینترنت بین‌الملل قطعه', C.red, C.bg);
    }

    // Lanes
    s.lanes.forEach((l) => {
      const y = laneY(l.i);
      const a = Math.min(1, (s.t - l.born) / 0.4);
      ctx.save(); ctx.globalAlpha = a;
      const ok = l.on || !down;
      // International segment
      if (l.on) line(G.xExt, y, G.xMid - 14, 'rgba(58,74,112,.35)', 2, [3, 7]);
      else if (down) {
        line(G.xExt, y, G.xMid - 14, C.red, 2.5, [8, 7]);
        const cx = (G.xExt + G.xMid) / 2, r = 6;
        ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - r, y - r); ctx.lineTo(cx + r, y + r); ctx.moveTo(cx + r, y - r); ctx.lineTo(cx - r, y + r); ctx.stroke(); ctx.restore();
      } else line(G.xExt, y, G.xMid - 14, warn && blink ? C.amber : C.dim, 2.5);
      // Inside segment
      if (l.on) { ctx.save(); ctx.shadowColor = C.teal; ctx.shadowBlur = 10; line(G.xMid + 14, y, G.xApp, C.teal, 3); ctx.restore(); }
      else line(G.xMid + 14, y, G.xApp, down ? 'rgba(58,74,112,.5)' : C.dim, 2.5);
      // End nodes
      dot(G.xExt, y, 5, l.on ? C.dim : down ? C.red : C.muted);
      dot(G.xApp, y, 7 + l.hit * 3, ok ? C.teal : C.red, ok ? C.teal : C.red);
      // Label
      const lx = G.xApp - (G.narrow ? 16 : 22);
      text(l.name, lx, y - (G.narrow ? 14 : 15), { size: G.narrow ? 13 : 14.5, weight: 700, mono: l.latin, align: 'right', color: ok ? C.ice : C.red });
      // Switch on the Liara column
      if (l.on) dot(G.xMid, y, 11, C.teal, C.teal);
      else {
        const pulse = 1 + 0.12 * Math.sin(s.t * (warn ? 14 : 5));
        ctx.save();
        ctx.fillStyle = C.navy7; ctx.strokeStyle = warn ? C.amber : C.teal3; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(G.xMid, y, 11 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        if (l.mig >= 0) {
          ctx.save(); ctx.strokeStyle = C.teal3; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(G.xMid, y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * l.mig); ctx.stroke(); ctx.restore();
        } else text('+', G.xMid, y + 1, { size: 16, weight: 900, color: warn ? C.amber : C.teal3 });
      }
      ctx.restore();
    });

    // Packets
    s.packets.forEach((p) => dot(p.x, laneY(p.lane.i), 4.5, p.src === 'in' ? C.teal3 : C.ice, p.src === 'in' ? C.teal : null));
    // Particles and floating labels
    s.parts.forEach((q) => { ctx.save(); ctx.globalAlpha = 1 - q.age / q.life; dot(q.x, q.y, 2.5, q.color); ctx.restore(); });
    s.floats.forEach((f) => text(f.text, f.x, f.y, { size: 13, weight: 800, mono: f.mono, color: f.color, alpha: 1 - f.age / 1.2 }));

    // Red vignette during the outage
    if (down) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(240,106,106,0)'); g.addColorStop(1, 'rgba(240,106,106,.18)');
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    ctx.restore();
  };

  /* ---------- Loop ---------- */
  let last = 0, raf = 0, visible = true;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt); draw();
    if ((S.running || S.demo || S.parts.length) && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }).observe(box);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  /* ---------- Input ---------- */
  const move = (i) => {
    const l = S.running && S.lanes[i];
    if (l && !l.on && l.mig < 0) l.mig = 0;
  };
  cv.addEventListener('pointerdown', (e) => {
    if (!S.running) return;
    const r = cv.getBoundingClientRect();
    const i = Math.floor((e.clientY - r.top - G.top) / G.laneH);
    if (i >= 0) move(i);
  });
  document.addEventListener('keydown', (e) => {
    if (!S.running || !visible) return;
    const d = '۱۲۳۴۵۶۷۸'.indexOf(e.key) + 1 || +e.key;
    if (d >= 1 && d <= MAX) { e.preventDefault(); move(d - 1); }
  });

  /* ---------- Screens ---------- */
  const startScreen = () => {
    S = fresh(true);
    addLane(S); addLane(S, true); addLane(S);
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="go-in">
        <div class="go-legend"><span><i style="background:${C.ice}"></i>داده از خارج</span><span><i style="background:${C.teal3}"></i>داده از لیارا</span><span><i style="background:${C.red}"></i>قطعی</span></div>
        <h3>وابستگی‌ها یکی‌یکی می‌رسن؛ قطعی هم.</h3>
        <p>روی هر خط ضربه بزن تا به لیارا داخل ایران منتقل بشه. خطی که منتقل نشده، وسط قطعی متوقف می‌شه.</p>
        <button class="btn" id="game-start">شروع بازی</button>
        <small>روی دسکتاپ کلیدهای ۱ تا ۸ هم کار می‌کنن.</small>
      </div>
      <div class="walker" aria-hidden="true"><div class="walk">${FIG_WALK()}</div></div>`;
    overlay.querySelector('#game-start').addEventListener('click', start);
    kick();
  };
  const start = () => {
    S = fresh(false);
    S.running = true;
    overlay.hidden = true;
    say('بازی شروع شد');
    track('game_start');
    kick();
    cv.focus?.();
  };
  /* ---------- The campaign hero: an original brick-style martial-arts figure ----------
     Spiky amber hair with glowing teal tips, teal gi, navy belt and wristbands,
     «ادامه دارد…» three-dot emblem. Three scenes:
       walk  – start screen, paces left and right;
       win   – score ≥ WIN: fists up, teal aura, confetti;
       lose  – score < WIN: hair droops, sits and cries, a puddle spreads. */
  const WIN = 80;
  const SKIN = '#F3C79B', SKIN2 = '#E2B486', INK = '#141D35', GI = '#13B8A6', GI2 = '#0E8578', NAVY = '#24304F', BELT = '#1C2848';
  let uid = 0;
  const HAIR_UP = (id) => `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FE0D1"/><stop offset=".32" stop-color="#F6B94C"/><stop offset="1" stop-color="#E39A2D"/></linearGradient></defs>
    <path class="hair" fill="url(#${id})" stroke="#C9801F" stroke-width="2" stroke-linejoin="round" d="M53 40 L36 32 L52 26 L33 6 L58 11 L52 -12 L73 4 L80 -24 L90 2 L106 -16 L106 6 L130 -4 L117 18 L136 21 L117 28 L118 40 L111 30 L104 25 L98 32 L92 23 L85 31 L78 23 L71 31 L65 25 L59 33 Z"/>`;
  const HAIR_DOWN = (id) => `
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FC9C4"/><stop offset=".3" stop-color="#D2A456"/><stop offset="1" stop-color="#B98436"/></linearGradient></defs>
    <path class="hair" fill="url(#${id})" stroke="#9A6B25" stroke-width="2" stroke-linejoin="round" d="M53 52 C48 20 66 6 86 6 C106 6 124 20 117 52 L112 60 L108 34 L101 31 L95 35 L89 29 L83 35 L77 29 L71 35 L65 31 L62 34 L59 60 Z"/>`;
  const head = (face, hair, dy = 0) => `
    <g transform="translate(0 ${dy})">
      <rect x="76" y="62" width="18" height="14" rx="3" fill="${SKIN2}"/>
      <rect x="58" y="16" width="54" height="50" rx="14" fill="${SKIN}"/>
      <circle cx="65" cy="52" r="4" fill="#F06A6A" opacity=".3"/><circle cx="105" cy="52" r="4" fill="#F06A6A" opacity=".3"/>
      ${face}
      ${hair(`hair${++uid}`)}
    </g>`;
  const brows = (l, r) => `<path d="${l} ${r}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
  const FACE_READY = `${brows('M66 33 L80 37', 'M104 33 L90 37')}
    <ellipse class="eye" cx="74" cy="43" rx="3.6" ry="4.6" fill="${INK}"/><ellipse class="eye" cx="96" cy="43" rx="3.6" ry="4.6" fill="${INK}"/>
    <path d="M74 52 H96 Q95 60 85 60 Q75 60 74 52 Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M75 55.5 H95" stroke="${INK}" stroke-width="1.5"/>`;
  const FACE_WIN = `${brows('M66 32 Q73 27 80 32', 'M90 32 Q97 27 104 32')}
    <ellipse class="eye" cx="74" cy="42" rx="3.6" ry="4.6" fill="${INK}"/><ellipse class="eye" cx="96" cy="42" rx="3.6" ry="4.6" fill="${INK}"/>
    <path d="M70 50 Q85 68 100 50 Z" fill="${INK}"/><path d="M72 51 H98 L96 55 H74 Z" fill="#fff"/><ellipse cx="85" cy="61" rx="6" ry="2.5" fill="#F06A6A"/>`;
  const TEAR = 'M0 -5 C3 0 4 3 0 6 C-4 3 -3 0 0 -5 Z';
  const FACE_SAD = `${brows('M66 35 L79 31', 'M104 35 L91 31')}
    <path d="M68 43 Q74 38 80 43 M90 43 Q96 38 102 43" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <ellipse class="wail" cx="85" cy="56" rx="8" ry="6" fill="${INK}"/><ellipse cx="85" cy="59" rx="4.5" ry="2.5" fill="#F06A6A"/>
    <g transform="translate(74 46)"><path class="tear tl" d="${TEAR}"/><path class="tear tl d2" d="${TEAR}"/><path class="tear tl d3" d="${TEAR}"/></g>
    <g transform="translate(96 46)"><path class="tear tr" d="${TEAR}"/><path class="tear tr d2" d="${TEAR}"/><path class="tear tr d3" d="${TEAR}"/></g>`;
  // Gi top with V-neck, emblem and knotted belt; y = shoulder line.
  const GI_TOP = (y) => `
    <path d="M54 ${y} H116 L124 ${y + 64} H46 Z" fill="${GI}"/>
    <path d="M68 ${y} L85 ${y + 24} L102 ${y} Z" fill="${NAVY}"/>
    <path d="M66 ${y} L85 ${y + 26} L104 ${y}" stroke="${GI2}" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <path d="M58 ${y + 30} Q66 ${y + 38} 62 ${y + 48} M112 ${y + 30} Q104 ${y + 38} 108 ${y + 48}" stroke="${GI2}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
    <circle cx="103" cy="${y + 33}" r="9" fill="#F4F7FB"/>
    <circle cx="98.5" cy="${y + 33}" r="2.2" fill="${NAVY}"/><circle cx="103" cy="${y + 33}" r="2.2" fill="${NAVY}"/><circle cx="107.5" cy="${y + 33}" r="2.2" fill="${GI}"/>
    <rect x="46" y="${y + 52}" width="78" height="10" rx="3" fill="${BELT}"/>
    <path d="M83 ${y + 60} L75 ${y + 86} L82 ${y + 87} L87 ${y + 62} Z M87 ${y + 60} L95 ${y + 86} L88 ${y + 87} L83 ${y + 62} Z" fill="${BELT}"/>
    <rect x="79" y="${y + 49}" width="12" height="15" rx="4" fill="#111A30"/>`;
  const arm = (side, y) => {
    const x = side === 'l' ? 40 : 114, hx = side === 'l' ? 48 : 122;
    return `<g class="arm arm-${side}"><rect x="${x}" y="${y + 4}" width="16" height="42" rx="7" fill="${GI}"/><rect x="${x - 1}" y="${y + 36}" width="18" height="9" rx="3" fill="${BELT}"/><circle cx="${hx}" cy="${y + 52}" r="9" fill="${SKIN}"/></g>`;
  };
  const LEGS = `
    <rect x="44" y="136" width="82" height="14" rx="4" fill="${NAVY}"/>
    <g class="leg leg-l"><rect x="46" y="146" width="37" height="58" rx="5" fill="${NAVY}"/><rect x="44" y="200" width="41" height="14" rx="5" fill="${INK}"/></g>
    <g class="leg leg-r"><rect x="87" y="146" width="37" height="58" rx="5" fill="${NAVY}"/><rect x="85" y="200" width="41" height="14" rx="5" fill="${INK}"/></g>`;
  const BASE = `<ellipse class="fig-shadow" cx="85" cy="226" rx="58" ry="5"/><rect x="34" y="212" width="102" height="12" rx="4" fill="#3A4A70"/><rect x="34" y="212" width="102" height="4" rx="2" fill="#4D5E88"/>`;
  const FIG_WALK = () => `
    <svg class="fig fig-walk" viewBox="0 0 170 230" aria-hidden="true" focusable="false">
      <ellipse class="fig-shadow" cx="85" cy="222" rx="40" ry="5"/>
      <g class="fig-body">${LEGS}${arm('l', 74)}${arm('r', 74)}${GI_TOP(74)}${head(FACE_READY, HAIR_UP)}</g>
    </svg>`;
  const FIG_WIN = () => `
    <svg class="fig fig-win" viewBox="0 0 170 230" aria-hidden="true" focusable="false">
      <defs><radialGradient id="aura${++uid}"><stop offset=".35" stop-color="rgba(95,224,209,.55)"/><stop offset="1" stop-color="rgba(19,184,166,0)"/></radialGradient></defs>
      <ellipse class="aura" cx="85" cy="100" rx="92" ry="128" fill="url(#aura${uid})"/>
      ${BASE}
      <g class="fig-body">${LEGS}${arm('l', 74)}${arm('r', 74)}${GI_TOP(74)}${head(FACE_WIN, HAIR_UP)}</g>
      <g><rect x="140" y="194" width="30" height="20" rx="3" fill="${NAVY}" stroke="${GI}" stroke-width="2"/><rect x="136" y="214" width="38" height="5" rx="2.5" fill="${GI}"/><path d="M147 204 l4 4 l8 -9" stroke="#5FE0D1" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
    </svg>`;
  const FIG_LOSE = () => `
    <svg class="fig fig-lose" viewBox="0 0 170 230" aria-hidden="true" focusable="false">
      <g class="puddle"><ellipse cx="85" cy="212" rx="104" ry="15" fill="rgba(79,163,224,.45)"/><ellipse cx="85" cy="212" rx="104" ry="15" fill="none" stroke="rgba(124,196,242,.7)" stroke-width="2"/><ellipse cx="52" cy="208" rx="30" ry="3.5" fill="rgba(200,232,252,.55)"/><ellipse cx="128" cy="216" rx="16" ry="2.5" fill="rgba(200,232,252,.4)"/></g>
      <ellipse class="ripple" cx="85" cy="212" rx="40" ry="6"/>
      <ellipse class="ripple r2" cx="85" cy="212" rx="40" ry="6"/>
      <g class="fig-body">
        ${arm('l', 104)}${arm('r', 104)}${GI_TOP(104)}
        <rect x="46" y="176" width="37" height="18" rx="4" fill="${NAVY}"/><rect x="87" y="176" width="37" height="18" rx="4" fill="${NAVY}"/>
        <rect x="40" y="190" width="45" height="18" rx="7" fill="${INK}"/><rect x="85" y="190" width="45" height="18" rx="7" fill="${INK}"/>
        <g class="sob">${head(FACE_SAD, HAIR_DOWN, 30)}</g>
      </g>
      <g><rect x="134" y="184" width="32" height="21" rx="3" fill="${NAVY}" stroke="#F06A6A" stroke-width="2"/><rect x="129" y="205" width="42" height="5" rx="2.5" fill="#3A4A70"/><path d="M145 190 l10 10 M155 190 l-10 10" stroke="#F06A6A" stroke-width="3" stroke-linecap="round"/></g>
    </svg>`;
  const endScene = (win) => {
    const wrap = document.createElement('div');
    wrap.className = `win ${win ? 'is-win' : 'is-lose'}`;
    wrap.innerHTML = `<div class="win-badge">${win ? 'بردی!' : 'ای وای…'}</div>${win ? FIG_WIN() : FIG_LOSE()}`;
    overlay.querySelector('.go-in').prepend(wrap);
    if (reduced || !win) return;
    const colors = [C.teal, C.teal3, C.amber, C.ice];
    const rain = document.createElement('div');
    rain.className = 'confetti';
    rain.innerHTML = Array.from({ length: 34 }, (_, k) => {
      const left = Math.random() * 100, delay = Math.random() * 0.9, dur = 1.8 + Math.random() * 1.4, rot = Math.random() * 720 - 360;
      return `<i style="left:${left}%;background:${colors[k % 4]};animation-delay:${delay}s;animation-duration:${dur}s;--r:${rot}deg"></i>`;
    }).join('');
    overlay.append(rain);
    setTimeout(() => rain.remove(), 4500);
  };

  const finish = () => {
    S.running = false; S.done = true;
    const score = Math.round((S.up / S.total) * 100);
    const moved = S.lanes.filter((l) => l.on).length;
    const msg = score >= 90 ? 'تقریباً هیچ قطعی‌ای کارت رو متوقف نکرد. قصه ادامه داشت.'
      : score >= 70 ? 'بیشتر وقت‌ها ادامه داشت؛ چند وابستگی دیر منتقل شدن.'
        : 'قطعی‌ها کار رو زیاد متوقف کردن. خبر خوب: تو دنیای واقعی می‌شه از امروز آماده شد.';
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="go-in">
        <div class="go-score" style="color:${score >= 80 ? C.teal : score >= 60 ? C.amber : C.red}"><b>${fa(0)}</b>٪</div>
        <h3>کار تو ${fa(score)}٪ وقت ادامه داشت.</h3>
        <p>${msg}<br><span class="muted">${fa(moved)} از ${fa(S.lanes.length)} وابستگی منتقل شد | ${fa(S.delivered)} درخواست رسید</span></p>
        <span class="dots go-dots"><i></i><i></i><i></i></span>
        <div class="go-actions">
          <a class="btn" href="#quiz" data-track="game_to_quiz">تست آمادگی واقعی</a>
          <a class="btn btn-ghost" href="${L.auth}" data-track="game_signup_${score}">ثبت‌نام روی لیارا</a>
          <button class="btn btn-ghost" id="game-again" data-track="game_again">دوباره</button>
        </div>
        <p class="go-note">این یه بازیه؛ برای ارزیابی کار واقعی‌ات، تست آمادگی رو بزن.</p>
      </div>`;
    decorate(overlay);
    const b = overlay.querySelector('.go-score b');
    if (reduced) b.textContent = fa(score);
    else tween(1100, (e) => (b.textContent = fa(Math.round(score * e))));
    overlay.querySelector('#game-again').addEventListener('click', start);
    endScene(score >= WIN);
    say(`بازی تمام شد. کار تو ${score} درصد وقت ادامه داشت.${score >= WIN ? ' بردی!' : ' این بار نشد؛ دوباره امتحان کن.'}`);
    track('game_complete', { score, moved });
  };

  const init = () => { layout(); startScreen(); };
  addEventListener('resize', () => { layout(); kick(); });
  (document.fonts ? document.fonts.load(`700 15px ${FONT}`).catch(() => {}) : Promise.resolve()).then(init);
})();
