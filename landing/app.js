/* ادامه دارد… — landing interactions. No external dependencies. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Every outbound link is a gateway to a section of Liara. */
  const L = {
    auth: 'https://console.liara.ir/auth',
    ticket: 'https://console.liara.ir/tickets/create',
    mirrors: 'https://liara.ir/mirrors/',
    mirror: (k) => `https://liara.ir/mirrors/${k}/`,
    paas: 'https://docs.liara.ir/paas/about/',
    db: 'https://liara.ir/products/cloud-database/',
    storage: 'https://liara.ir/products/object-storage/',
    vps: 'https://liara.ir/products/cloud-server/',
    woo: 'https://liara.ir/products/woocommerce-hosting/',
    backup: 'https://docs.liara.ir/paas/disks/restore-backup-using-ftp',
    cli: 'https://docs.liara.ir/references/cli/about/',
    pricing: 'https://liara.ir/pricing/',
    status: 'https://liara.online/',
  };
  const isLiara = (u) => /(^|\.)liara\.(ir|online)$/.test(u.hostname);
  // Adds campaign UTM tags and opens Liara links in a new tab.
  const decorate = (root = document) => $$('a[href^="http"]', root).forEach((a) => {
    const u = new URL(a.href);
    if (!isLiara(u) || u.searchParams.has('utm_campaign')) return;
    u.searchParams.set('utm_source', 'edame-darad');
    u.searchParams.set('utm_medium', 'landing');
    u.searchParams.set('utm_campaign', 'edame-darad');
    if (a.dataset.track) u.searchParams.set('utm_content', a.dataset.track);
    a.href = u.toString();
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Analytics hook (ready for any tag manager, sends nothing by itself) ---------- */
  window.dataLayer = window.dataLayer || [];
  const track = (event, data = {}) => window.dataLayer.push({ event, ...data });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (t) track('click', { id: t.dataset.track });
  });

  /* ---------- Proof: count requests to other hosts ---------- */
  const countExternal = () => {
    const ext = performance.getEntriesByType('resource').filter((r) => {
      try { return new URL(r.name, location.href).host !== location.host; } catch { return false; }
    });
    $('#ext-count').textContent = ext.length ? fa(ext.length) : 'صفر';
    if (ext.length) $('#proof').classList.add('bad');
  };
  addEventListener('load', () => setTimeout(countExternal, 300));

  /* ---------- Hero terminal: the episode in 8 lines ---------- */
  const SCRIPT = [
    ['p', '$ ', 'npm install'],
    ['e', '', 'npm ERR! code ETIMEDOUT'],
    ['e', '', 'npm ERR! request to registry.npmjs.org failed'],
    ['k', '', '# ادامه دارد…'],
    ['p', '$ ', 'npm config set registry https://package-mirror.liara.ir/repository/npm/ --global'],
    ['p', '$ ', 'npm install'],
    ['ok', '', '✓ added 312 packages in 9s'],
    ['ok', '', '✓ ادامه داره.'],
  ];
  const typer = $('#typer');
  const visual = $('.hero-visual');
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const line = ([cls, prompt, text]) => cls === 'p'
    ? `<span class="t-p">${prompt}</span>${esc(text)}`
    : `<span class="t-${cls}${/[؀-ۿ]/.test(text) ? ' t-fa' : ''}">${esc(text)}</span>`;

  async function play() {
    if (reduced) { typer.innerHTML = SCRIPT.map(line).join('\n'); visual.classList.add('ok'); return; }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (;;) {
      visual.classList.remove('ok');
      let done = '';
      for (const l of SCRIPT) {
        if (l[0] === 'p') {
          for (let i = 1; i <= l[2].length; i += 2) {
            typer.innerHTML = done + `<span class="t-p">${l[1]}</span>${esc(l[2].slice(0, i))}<span class="caret"></span>`;
            await sleep(22);
          }
          done += line(l) + '\n';
          await sleep(350);
        } else {
          done += line(l) + '\n';
          typer.innerHTML = done + '<span class="caret"></span>';
          await sleep(l[0] === 'k' ? 1300 : 550);
        }
        if (l[2] === '✓ ادامه داره.') visual.classList.add('ok');
      }
      await sleep(4500);
    }
  }
  play();

  /* ---------- Mirror commands ---------- */
  const CMDS = {
    npm: { label: 'npm', title: 'npm', code: 'npm config set registry https://package-mirror.liara.ir/repository/npm/ --global\nnpm config get registry' },
    pip: { label: 'PyPI', title: 'pip  (Windows: setx PIP_INDEX_URL "…")', code: 'export PIP_INDEX_URL=https://package-mirror.liara.ir/repository/pypi/simple' },
    docker: { label: 'Docker Hub', title: '/etc/docker/daemon.json', code: '{\n  "registry-mirrors": [\n    "https://docker-mirror.liara.ir"\n  ]\n}\n\n# then:\nsudo systemctl daemon-reload\nsudo systemctl restart docker' },
  };
  const showCmd = (k) => {
    $('#code-box').textContent = CMDS[k].code;
    $('#code-title').textContent = CMDS[k].title;
    $$('.tabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === k)));
    const g = $('#cmd-guide');
    const slug = { npm: 'npm', pip: 'pypi', docker: 'docker' }[k];
    g.href = L.mirror(slug);
    g.dataset.track = 'mirror_guide_' + slug;
    g.textContent = `راهنمای میرور ${CMDS[k].label} در لیارا ←`;
    decorate(g.parentElement);
  };
  $$('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => { showCmd(b.dataset.tab); track('tab', { id: b.dataset.tab }); }));
  showCmd('npm');

  const copyText = async (text, btn, label) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    const old = btn.textContent; btn.textContent = label || 'کپی شد ✓';
    setTimeout(() => (btn.textContent = old), 1600);
  };
  $('#copy-btn').addEventListener('click', (e) => copyText($('#code-box').textContent, e.currentTarget));

  /* ---------- Business type ---------- */
  const BIZ = {
    shop: {
      name: 'فروشگاه اینترنتی',
      stack: [
        ['هاست ووکامرس', 'سایت فروشگاه روی دیتاسنتر داخل ایران', L.woo],
        ['دیتابیس ابری', 'سفارش‌ها و مشتری‌ها کنار اپ', L.db],
        ['ذخیره‌سازی ابری', 'عکس محصولات بدون CDN خارجی', L.storage],
        ['بکاپ رایگان', 'تا ۱۰ برابر فضای پلن', L.backup],
      ],
      check: [
        ['درگاه پرداخت', 'مطمئن شو درگاهت داخلیه و تو سناریوی قطعی تستش کن'],
        ['پنل پیامک و ایمیل', 'پیامک تأیید و فاکتور از سرویس داخلی'],
        ['افزونه‌ها و قالب', 'فونت و اسکریپت‌هایی که از خارج لود می‌شن'],
      ],
    },
    api: {
      name: 'وب‌اپ و API',
      stack: [
        ['میرورها', 'npm، PyPI، Docker Hub، Go و Composer داخل ایران', L.mirrors],
        ['پلتفرم (PaaS)', 'استقرار با liara deploy در کمتر از ۵ دقیقه', L.paas],
        ['دیتابیس ابری', 'PostgreSQL، MySQL، MongoDB، Redis', L.db],
        ['ذخیره‌سازی ابری', 'آپلودها و فایل‌های استاتیک', L.storage],
      ],
      check: [
        ['CI/CD', 'پایپ‌لاینی که از GitHub Actions یا رجیستری خارجی می‌کشه'],
        ['APIهای خارجی', 'نقشه، OAuth، هوش مصنوعی، سرویس‌های ابری خارجی'],
        ['ایمیج‌های پایه', 'base imageها رو از میرور بکش و نسخه رو پین کن'],
      ],
    },
    org: {
      name: 'سامانه‌ی سازمانی',
      stack: [
        ['سرور مجازی ابری', 'کنترل کامل، همه‌ی پلن‌ها در ایران', L.vps],
        ['دیتابیس ابری', 'SQL Server، PostgreSQL و…', L.db],
        ['بکاپ و پایش', 'بازیابی قابل‌تست و پایش شبانه‌روزی', L.backup],
        ['میرورهای لینوکس', 'به‌روزرسانی Ubuntu، Debian و… بدون اینترنت بین‌الملل', L.mirror('ubuntu')],
      ],
      check: [
        ['لایسنس و فعال‌سازی', 'نرم‌افزارهایی که برای کار به سرور خارجی زنگ می‌زنن'],
        ['احراز هویت', 'ورود با سرویس‌های خارجی (SSO)'],
        ['برنامه‌ی تداوم', 'سند مکتوب: چه کسی، چه کاری، در چه ترتیبی'],
      ],
    },
  };
  let biz = 'shop';
  const renderBiz = () => {
    const b = BIZ[biz];
    const li = ([t, d, href], i) => `<li><div>${href ? `<a class="biz-link" href="${href}" data-track="biz_${biz}_${i}">${t} ←</a>` : `<b>${t}</b>`}<span>${d}</span></div></li>`;
    $('#biz-panel').innerHTML = `
      <div class="biz-col"><h3>راهکار لیارا برای ${b.name}</h3><ul>${b.stack.map(li).join('')}</ul></div>
      <div class="biz-col check"><h3>اینا رو جدا بررسی کن</h3><ul>${b.check.map(([t, d]) => li([t, d])).join('')}</ul>
        <a class="link-more" href="${L.ticket}" data-track="biz_${biz}_ticket">برای بررسی، از پشتیبانی لیارا بپرس ←</a></div>`;
    decorate($('#biz-panel'));
    $$('.biz-pick [data-biz]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.biz === biz)));
  };
  $$('.biz-pick [data-biz]').forEach((x) => x.addEventListener('click', () => { biz = x.dataset.biz; renderBiz(); track('biz', { id: biz }); }));
  renderBiz();

  /* ---------- Readiness quiz ---------- */
  const Q = [
    {
      q: 'پکیج‌ها (npm، pip، Composer) و ایمیج‌های داکرت از کجا نصب می‌شن؟',
      o: [['از میرور داخلی، مثل میرور لیارا', 20], ['مستقیم از مخزن‌های خارجی', 0], ['نمی‌دونم', 0]],
      fix: { t: 'پکیج‌ها رو روی میرور ایرانی ببر', d: 'یه خط تنظیم برای npm، pip و داکر؛ ریسکش تقریباً صفره.', a: L.mirrors, al: 'میرورهای لیارا' },
    },
    {
      q: 'اپ و دیتابیست کجا میزبانی می‌شن؟',
      o: [['هر دو داخل ایران', 20], ['یکی داخل، یکی خارج', 10], ['هر دو خارج از ایران', 0]],
      fix: { t: 'اپ و دیتابیس رو کنار هم، داخل ایران بیار', d: 'یه نسخه‌ی آزمایشی روی پلتفرم و دیتابیس ابری لیارا بالا بیار.', a: L.paas, al: 'آشنایی با پلتفرم لیارا' },
    },
    {
      q: 'فونت، اسکریپت و فایل‌های استاتیک سایتت از کجا لود می‌شن؟',
      o: [['همه از سرور خودم', 20], ['بعضی‌هاش از CDN خارجی', 10], ['نمی‌دونم', 0]],
      fix: { t: 'وابستگی‌های فرانت رو بیار خونه', d: 'فونت و اسکریپت رو روی سرور خودت بذار؛ فایل‌ها و تصاویر رو روی ذخیره‌سازی ابری.', a: L.storage, al: 'ذخیره‌سازی ابری لیارا' },
    },
    {
      q: 'بکاپ داری؟ بازیابی‌اش رو تا حالا تست کردی؟',
      o: [['بکاپ داریم و بازیابی رو تست کردیم', 20], ['بکاپ داریم، ولی تست نکردیم', 10], ['بکاپ منظم نداریم', 0]],
      fix: { t: 'بکاپ بگیر و یک بار بازیابی کن', d: 'بکاپ لیارا تا ۱۰ برابر فضای پلن رایگانه؛ بکاپی که تست نشده، بکاپ نیست.', a: L.backup, al: 'راهنمای بازیابی بکاپ' },
    },
    {
      q: 'وابستگی‌هات به APIهای خارجی (پرداخت، نقشه، پیامک، لاگین، هوش مصنوعی) رو می‌شناسی؟',
      o: [['لیست داریم و جایگزین چیدیم', 20], ['می‌دونیم چی‌ان، جایگزین نداریم', 10], ['بررسی نکردیم', 0]],
      fix: { t: 'لیست وابستگی‌های خارجی رو بنویس', d: 'برای هر کدوم یه جایگزین داخلی یا حالت «کار با امکانات محدود» تعریف کن.', a: L.ticket, al: 'مشورت با پشتیبانی لیارا' },
    },
  ];
  const DRILL = { t: 'یک «تمرین قطعی» اجرا کن', d: 'با پرداخت ساعتی لیارا یه محیط آزمایشی بساز، دسترسی بین‌الملل رو فرضاً ببند و ببین چی می‌لنگه.', a: L.pricing, al: 'تعرفه‌های ساعتی لیارا' };

  const stage = $('#q-stage');
  const bar = $('#q-bar');
  let answers = [];

  const renderQ = (i) => {
    bar.style.width = `${(i / Q.length) * 100}%`;
    const item = Q[i];
    stage.innerHTML = `
      <div class="q-count">سؤال ${fa(i + 1)} از ${fa(Q.length)}</div>
      <div class="q-title" id="q-title">${item.q}</div>
      <div class="q-opts" role="group" aria-labelledby="q-title">
        ${item.o.map(([t], k) => `<button data-k="${k}">${t}</button>`).join('')}
      </div>
      ${i > 0 ? '<button class="q-back">→ سؤال قبلی</button>' : ''}`;
    $$('.q-opts button', stage).forEach((b) => b.addEventListener('click', () => {
      answers[i] = +b.dataset.k;
      if (i === 0) track('quiz_start');
      i + 1 < Q.length ? renderQ(i + 1) : renderResult();
    }));
    const back = $('.q-back', stage);
    if (back) back.addEventListener('click', () => renderQ(i - 1));
    if (i > 0) $('.q-opts button', stage).focus({ preventScroll: true });
  };

  const renderResult = () => {
    bar.style.width = '100%';
    const score = answers.reduce((s, k, i) => s + Q[i].o[k][1], 0);
    const level = score >= 80
      ? { h: 'تو آماده‌ای؛ قصه ادامه داره.', p: 'هسته‌ی کارت به اینترنت بین‌الملل وابسته نیست. حالا وقت تمرین و نگه‌داشتن این آمادگیه.', c: 'var(--teal)' }
      : score >= 40
        ? { h: 'نیمه‌راهی؛ چند قدم تا ادامه.', p: 'بخشی از کار آماده‌ست، ولی چند نقطه هنوز می‌تونه وسط قطعی متوقفت کنه.', c: 'var(--amber)' }
        : { h: 'هنوز وابسته‌ای؛ ولی قسمت بعدی دست توئه.', p: 'خبر خوب: بیشترِ این قدم‌ها چند ساعت کار دارن، نه چند ماه.', c: 'var(--red)' };

    // Order: open items → business-specific item → drill → items already done.
    const all = Q.map((q, i) => ({ ...q.fix, done: q.o[answers[i]][1] === 20 }));
    const extra = biz === 'shop'
      ? [{ t: 'درگاه پرداخت و پیامک رو تو سناریوی قطعی تست کن', d: 'بیشترین ضرر فروشگاه‌ها از همین دو نقطه‌ست.', a: L.woo, al: 'هاست ووکامرس لیارا', done: false }]
      : [];
    const todo = [...all.filter((x) => !x.done), ...extra, { ...DRILL, done: false }, ...all.filter((x) => x.done)];

    const kitText = `کیت ادامه‌ی من — امتیاز آمادگی: ${fa(score)} از ۱۰۰\n` +
      todo.map((x, i) => `${x.done ? '✓' : '☐'} ${fa(i + 1)}. ${x.t} — ${x.d}`).join('\n') +
      `\n\n#ادامه_دارد · اینترنت ممکنه قطع بشه، مسیرت نه.`;

    stage.innerHTML = `
      <div class="result-top">
        <div class="ring" style="--p:${score};--c:${level.c}"><b>${fa(score)}</b></div>
        <div><div class="q-count">کیت ادامه‌ی ${BIZ[biz].name}</div><h3>${level.h}</h3><p>${level.p}</p></div>
      </div>
      <div class="kit">
        ${todo.map((x, i) => `
          <div class="kit-item ${x.done ? 'done' : ''}">
            <span class="n">${x.done ? '✓' : fa(i + 1)}</span>
            <div><b>${x.t}</b><p>${x.done ? 'این یکی رو داری؛ فقط مرتب تستش کن.' : x.d}</p>
            ${!x.done && x.a ? `<a href="${x.a}" data-track="kit_${i}">${x.al} ←</a>` : ''}</div>
          </div>`).join('')}
      </div>
      <div class="result-actions">
        <a class="btn" href="${L.auth}" data-track="quiz_result_${score}">ثبت‌نام و شروع روی لیارا</a>
        <button class="btn btn-ghost" id="copy-kit">کپی کیت ادامه</button>
        <button class="btn btn-ghost" id="restart">دوباره</button>
      </div>
      <p class="disclaimer">این امتیاز یک خودارزیابی سریعه؛ ارزیابی تخصصی یا تضمین دسترس‌پذیری نیست. سناریوی واقعی کارت رو حتماً تست کن.</p>`;
    decorate(stage);
    $('#copy-kit').addEventListener('click', (e) => { copyText(kitText, e.currentTarget); track('kit_copy'); });
    $('#restart').addEventListener('click', () => { answers = []; renderQ(0); });
    track('quiz_complete', { score, biz });
  };

  // Business choice also tailors the quiz result.
  renderQ(0);
  decorate();
})();
