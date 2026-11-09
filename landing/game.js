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
      </div>`;
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
  /* ---------- Win: an original brick-style figure cheers (score ≥ WIN) ---------- */
  const WIN = 80;
  const FIGURE = `
    <svg class="fig" viewBox="0 0 170 230" aria-hidden="true" focusable="false">
      <ellipse class="fig-shadow" cx="85" cy="222" rx="46" ry="6"/>
      <g class="fig-body">
        <g class="arm arm-l"><rect x="40" y="78" width="16" height="44" rx="7" fill="#13B8A6"/><circle cx="48" cy="126" r="9" fill="#F3C79B"/></g>
        <g class="arm arm-r"><rect x="114" y="78" width="16" height="44" rx="7" fill="#13B8A6"/><circle cx="122" cy="126" r="9" fill="#F3C79B"/></g>
        <path d="M54 74 H116 L124 138 H46 Z" fill="#13B8A6"/>
        <path d="M54 74 H116 L117 82 H53 Z" fill="#5FE0D1" opacity=".55"/>
        <circle cx="74" cy="106" r="5" fill="#0B1224" opacity=".5"/><circle cx="86" cy="106" r="5" fill="#0B1224" opacity=".5"/><circle cx="98" cy="106" r="5" fill="#F4F7FB"/>
        <rect x="76" y="64" width="18" height="12" rx="3" fill="#E2B486"/>
        <rect x="70" y="8" width="30" height="12" rx="4" fill="#E2B486"/>
        <rect x="58" y="16" width="54" height="50" rx="14" fill="#F3C79B"/>
        <ellipse class="eye" cx="74" cy="38" rx="4" ry="5" fill="#141D35"/><ellipse class="eye" cx="96" cy="38" rx="4" ry="5" fill="#141D35"/>
        <path d="M70 48 Q85 62 100 48" stroke="#141D35" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="66" cy="49" r="4" fill="#F06A6A" opacity=".35"/><circle cx="104" cy="49" r="4" fill="#F06A6A" opacity=".35"/>
        <rect x="44" y="136" width="82" height="14" rx="4" fill="#1C2848"/>
        <rect x="46" y="148" width="37" height="58" rx="5" fill="#24304F"/><rect x="87" y="148" width="37" height="58" rx="5" fill="#24304F"/>
        <rect x="44" y="202" width="41" height="14" rx="5" fill="#141D35"/><rect x="85" y="202" width="41" height="14" rx="5" fill="#141D35"/>
      </g>
      <g class="fig-laptop"><rect x="128" y="186" width="38" height="24" rx="3" fill="#24304F" stroke="#13B8A6" stroke-width="2"/><rect x="122" y="210" width="50" height="6" rx="3" fill="#13B8A6"/><path d="M137 199 l5 5 l10 -11" stroke="#5FE0D1" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
    </svg>`;
  const celebrate = () => {
    const wrap = document.createElement('div');
    wrap.className = 'win';
    wrap.innerHTML = `<div class="win-badge">بردی!</div>${FIGURE}`;
    overlay.querySelector('.go-in').prepend(wrap);
    if (reduced) return;
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
    if (score >= WIN) celebrate();
    say(`بازی تمام شد. کار تو ${score} درصد وقت ادامه داشت.${score >= WIN ? ' بردی!' : ''}`);
    track('game_complete', { score, moved });
  };

  const init = () => { layout(); startScreen(); };
  addEventListener('resize', () => { layout(); kick(); });
  (document.fonts ? document.fonts.load(`700 15px ${FONT}`).catch(() => {}) : Promise.resolve()).then(init);
})();
