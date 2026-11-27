'use strict';
/* =========================================================================
   FX.JS — Живой анимированный фон (Canvas), частицы при касании и
   гладкий набор SVG-иконок для игрового интерфейса (100% офлайн)
   ========================================================================= */

/* ---------- Гладкие игровые SVG-иконки вместо рубленных эмодзи ---------- */
const UI_ICO = {
  back: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4a1 1 0 01-1-1v-3a1 1 0 011-1z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.8 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4a1 1 0 01-1-1v-3a1 1 0 011-1z" fill="currentColor" opacity=".6"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  fire: `<svg viewBox="0 0 24 24" class="ui-ico ico-fire"><path d="M12.6 2.5c.4 3.4-2.1 5.1-2.1 7.6 0 1.3.9 2.2 2 2.2 1.6 0 2.5-1.5 2.4-3.2 2.8 1.9 4.4 4.7 4.4 7.5A7.3 7.3 0 0112 23a7.3 7.3 0 01-7.3-7.3c0-4.3 3.4-7.9 7.9-13.2z" fill="#ff7675"/><path d="M12.2 11.2c.2 1.6-1 2.4-1 3.7 0 1 .7 1.6 1.5 1.6 1 0 1.6-.9 1.6-2 1.5 1.1 2.3 2.6 2.3 4.1A4.6 4.6 0 0112 23a4.6 4.6 0 01-4.6-4.6c0-2.5 2-4.6 4.8-7.2z" fill="#ffd166"/></svg>`,
  star: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M12 2.4l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.2l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z" fill="#ffd166" stroke="#f39c12" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  gem: `<svg viewBox="0 0 24 24" class="ui-ico"><polygon points="6.5,4 17.5,4 22,10 12,21.5 2,10" fill="#74c0fc" stroke="#339af0" stroke-width="1.3" stroke-linejoin="round"/><polygon points="12,4 17.5,10 12,21.5 6.5,10" fill="#a5d8ff" opacity=".8"/><polygon points="6.5,4 12,10 17.5,4" fill="#fff" opacity=".65"/></svg>`,
  en: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gEn" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4facfe"/><stop offset="100%" stop-color="#00f2fe"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gEn)"/><circle cx="24" cy="24" r="13" fill="none" stroke="#fff" stroke-width="2.6"/><ellipse cx="24" cy="24" rx="6.5" ry="13" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 20h24M12 28h24" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="16" cy="11" rx="8" ry="3.5" fill="#fff" opacity=".32" transform="rotate(-18 16 11)"/></svg>`,
  enNew: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gNew" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd166"/><stop offset="100%" stop-color="#ff9f43"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gNew)"/><path d="M24 10l3.2 8.8L36 22l-8.8 3.2L24 34l-3.2-8.8L12 22l8.8-3.2z" fill="#fff"/><path d="M35 10l1.4 3.6L40 15l-3.6 1.4L35 20l-1.4-3.6L30 15l3.6-1.4z" fill="#fff" opacity=".85"/><circle cx="14" cy="34" r="2.6" fill="#fff" opacity=".8"/></svg>`,
  enRev: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gRev" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#00b894"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gRev)"/><path d="M34 21a10.5 10.5 0 00-18.8-4.2M14 27a10.5 10.5 0 0018.8 4.2" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M34 14v7h-7M14 34v-7h7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ru: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gRu" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff758f"/><stop offset="100%" stop-color="#c9184a"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gRu)"/><path d="M33.5 12.5c-7 1-14 7.5-17.5 16.5l-2 6 6-2c9-3.5 15.5-10.5 16.5-17.5a3 3 0 00-3-3z" fill="#fff"/><path d="M16 32l12-12" stroke="#ff758f" stroke-width="2.4" stroke-linecap="round"/><circle cx="15" cy="15" r="2.5" fill="#ffe5ec"/></svg>`,
  photo: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gPh" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gPh)"/><rect x="11" y="17" width="26" height="19" rx="6" fill="#fff"/><path d="M18 17l2.5-4h7l2.5 4" fill="#fff"/><circle cx="24" cy="26.5" r="5.5" fill="#6c5ce7"/><circle cx="25.8" cy="24.8" r="1.8" fill="#fff"/><circle cx="32" cy="21" r="1.7" fill="#ff758f"/></svg>`,
  fix: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gFx" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#48dbfb"/><stop offset="100%" stop-color="#0abde3"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gFx)"/><circle cx="22" cy="22" r="9.5" fill="#fff" opacity=".28" stroke="#fff" stroke-width="3.2"/><path d="M29 29l7 7" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M18.5 22l2.4 2.4 4.8-4.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pairs: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gPr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f78fb3"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gPr)"/><rect x="11" y="13" width="16" height="21" rx="4.5" fill="#fff" opacity=".68" transform="rotate(-10 19 23)"/><rect x="20" y="14" width="16" height="21" rx="4.5" fill="#fff" transform="rotate(8 28 24)"/><path d="M28 20l1.6 3.2 3.5.5-2.5 2.4.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.4 3.5-.5z" fill="#e84393"/></svg>`,
  blitz: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gBl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#f39c12"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gBl)"/><polygon points="27,9 14,26 23,26 20,39 34,21 25,21" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  duel: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gDl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#b33939"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gDl)"/><path d="M14 14l20 20M34 14L14 34" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><path d="M12 20l8-8M36 20l-8-8" stroke="#ffd166" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#ffd166"/></svg>`,
  heal: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gHl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff9ff3"/><stop offset="100%" stop-color="#f368e0"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gHl)"/><path d="M24 35s-11-6.8-11-14.5C13 16 16.5 13 20 13c2 0 3.3 1 4 2.5.7-1.5 2-2.5 4-2.5 3.5 0 7 3 7 7.5C35 28.2 24 35 24 35z" fill="#fff"/><path d="M24 19v8M20 23h8" stroke="#f368e0" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  words: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gWd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#70a1ff"/><stop offset="100%" stop-color="#5352ed"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gWd)"/><path d="M12 15.5c4-1.5 8.5-1 12 1.5 3.5-2.5 8-3 12-1.5v17.5c-4-1.5-8.5-1-12 1.5-3.5-2.5-8-3-12-1.5z" fill="#fff"/><path d="M24 17v17" stroke="#5352ed" stroke-width="2.2"/></svg>`,
  awards: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gAw" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd166"/><stop offset="100%" stop-color="#e67e22"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gAw)"/><path d="M17 13h14v9a7 7 0 01-14 0z" fill="#fff"/><path d="M17 15h-4v3a4 4 0 004 4M31 15h4v3a4 4 0 01-4 4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M24 29v5M19 35h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
  shop: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M4 10l1.5-5h13L20 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0M6 12v7h12v-7" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  gacha: `<svg viewBox="0 0 24 24" class="ui-ico"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 12h17" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>`,
  parent: `<svg viewBox="0 0 24 24" class="ui-ico"><rect x="5" y="10.5" width="14" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" class="ui-ico"><circle cx="12" cy="12" r="4.8" fill="#ffb703"/><path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" stroke="#ffb703" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  sunset: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M5 17h14" stroke="#ff758f" stroke-width="2.2" stroke-linecap="round"/><path d="M7 17a5 5 0 0110 0" fill="#ff9f68"/><path d="M12 5v2.5M6.2 8.2l1.8 1.8M17.8 8.2L16 10" stroke="#ff9f68" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M18 14.5A6.8 6.8 0 019.5 6a6.8 6.8 0 108.5 8.5z" fill="#ffd166" stroke="#f39c12" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="0 0 24 24" class="ui-ico"><path d="M4 11l8-6.5L20 11v8.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9.5 21v-6h5v6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  sbrHorse: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gHs" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00d2d3"/><stop offset="100%" stop-color="#0b7dda"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gHs)"/><circle cx="24" cy="24" r="13" fill="none" stroke="#ffeaa7" stroke-width="2.8" stroke-dasharray="6 4"/><circle cx="24" cy="24" r="8" fill="#00b894" stroke="#fff" stroke-width="2.4"/><path d="M24 18a6 6 0 016 6 4 4 0 01-4 4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  sbrSpin: `<svg viewBox="0 0 48 48" class="tile-svg"><defs><linearGradient id="gSp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f6b93b"/><stop offset="100%" stop-color="#e55039"/></linearGradient></defs><rect width="48" height="48" rx="16" fill="url(#gSp)"/><path d="M24 11c7.2 0 13 5.8 13 13s-5.8 13-13 13-13-5.8-13-13c0-5 3.6-9 8.5-9 4 0 7 3 7 6.8 0 3-2.3 5.2-5 5.2-2.2 0-3.8-1.6-3.8-3.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>`
};

/* ---------- Живой Canvas-фон + интерактивные частицы при касании ---------- */
const BG_FX = (() => {
  let canvas = null, ctx = null, W = 0, H = 0, dpr = 1, raf = 0;
  let theme = 'home', mood = 'day';
  let orbs = [], sparks = [];
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function themePalette() {
    if (theme === 'nastya') {
      if (mood === 'night') return { bg: ['#2c1f4a', '#422c6b'], orbs: ['#ff9ff3', '#ffd166', '#a29bfe', '#74b9ff'], tap: ['#ff9ff3', '#ffd166', '#fff'] };
      if (mood === 'sunset') return { bg: ['#ffe3d8', '#f9d8f0'], orbs: ['#ff9f68', '#ff758f', '#ffd166', '#c77dff'], tap: ['#ff758f', '#ffd166', '#ff9f68'] };
      return { bg: ['#fff0f7', '#eef2ff'], orbs: ['#ff9ff3', '#ffc2d1', '#ffd166', '#a5d8ff'], tap: ['#ff4d6d', '#ffd166', '#ff8fab', '#74c0fc'] };
    }
    if (theme === 'andrey') {
      return { bg: ['#dceeff', '#edf5ff'], orbs: ['#00a8ff', '#f6b93b', '#00b894', '#74b9ff'], tap: ['#f6b93b', '#00b894', '#00a8ff', '#fff'] };
    }
    return { bg: ['#f2eeff', '#fff2f9'], orbs: ['#a29bfe', '#ff9ff3', '#74b9ff', '#ffd166'], tap: ['#6c5ce7', '#ff758f', '#ffd166', '#00b894'] };
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedOrbs() {
    const pal = themePalette();
    orbs = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * (W || 420),
      y: Math.random() * (H || 800),
      r: i < 5 ? 42 + Math.random() * 58 : 4 + Math.random() * 9,
      vx: theme === 'andrey' ? (0.45 + Math.random() * 0.75) : ((Math.random() - .5) * 0.35),
      vy: theme === 'andrey' ? (-0.25 - Math.random() * 0.4) : (-0.18 - Math.random() * 0.35),
      col: pal.orbs[i % pal.orbs.length],
      big: i < 5,
      ph: Math.random() * Math.PI * 2,
      kind: i % 3
    }));
  }

  function drawStar(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * r * .36, Math.sin(a + Math.PI / 4) * r * .36);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHeart(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, s * .35);
    ctx.bezierCurveTo(-s, -s * .35, -s * .55, -s * 1.15, 0, -s * .45);
    ctx.bezierCurveTo(s * .55, -s * 1.15, s, -s * .35, 0, s * .35);
    ctx.fill();
    ctx.restore();
  }

  function tick(ts) {
    if (!ctx || document.hidden) { raf = 0; return; }
    ctx.clearRect(0, 0, W, H);
    const t = ts * 0.001;

    for (const o of orbs) {
      o.x += o.vx;
      o.y += o.vy;
      if (o.y < -o.r - 20) { o.y = H + o.r + 10; o.x = Math.random() * W; }
      if (o.x > W + o.r + 20) o.x = -o.r - 10;
      if (o.x < -o.r - 20) o.x = W + o.r + 10;

      ctx.save();
      if (o.big) {
        const g = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r);
        g.addColorStop(0, o.col);
        g.addColorStop(1, 'transparent');
        ctx.globalAlpha = theme === 'nastya' && mood === 'night' ? .22 : .16;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const pulse = 0.45 + 0.55 * Math.sin(t * 2.1 + o.ph);
        ctx.globalAlpha = (theme === 'andrey' ? .35 : .42) * pulse;
        ctx.fillStyle = o.col;
        if (theme === 'andrey' && o.kind === 0) {
          ctx.translate(o.x, o.y);
          ctx.rotate(-0.45);
          ctx.fillRect(-o.r * 1.6, -1.5, o.r * 3.2, 3);
        } else if (o.kind === 1) {
          drawStar(o.x, o.y, o.r * 1.15, t * .6 + o.ph);
        } else {
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r * .65, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08;
      s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.col;
      if (s.shape === 'heart') drawHeart(s.x, s.y, s.r * (0.6 + s.life * .5));
      else if (s.shape === 'star') drawStar(s.x, s.y, s.r * (0.7 + s.life * .5), s.rot += 0.08);
      else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (reduced || raf || !ctx) return;
    raf = requestAnimationFrame(tick);
  }

  function burst(x, y, count = 8) {
    if (reduced || !ctx) return;
    const pal = themePalette().tap;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - .5) * .6;
      const spd = 1.6 + Math.random() * 3.4;
      sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        r: 4.5 + Math.random() * 4.5,
        life: 1,
        decay: 0.025 + Math.random() * 0.02,
        rot: Math.random() * Math.PI,
        col: pal[i % pal.length],
        shape: theme === 'nastya' ? (i % 2 ? 'heart' : 'star') : (i % 2 ? 'star' : 'dot')
      });
    }
    if (sparks.length > 90) sparks = sparks.slice(-90);
    start();
  }

  function init() {
    canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    resize();
    seedOrbs();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    window.addEventListener('pointerdown', e => burst(e.clientX, e.clientY, 7), { passive: true });
    start();
  }

  function setMode(newTheme, newMood = 'day') {
    const changed = theme !== newTheme || mood !== newMood;
    theme = newTheme || 'home';
    mood = newMood || 'day';
    if (changed && ctx) seedOrbs();
  }

  return { init, setMode, burst };
})();
