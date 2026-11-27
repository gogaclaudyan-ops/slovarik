'use strict';
/* =========================================================================
   CORE.JS — Ядро Словарика 2.0
   • Интервальное повторение (система Лейтнера, 8 коробок)
   • Разбор орфограмм русского языка
   • Озвучка и распознавание речи (AndroidBridge + Web Speech API)
   • Расширенная телеметрия и экспорт AI-дайджеста для Gemini
   • Облачная синхронизация с GitHub (обратная совместимость с v1)
   ========================================================================= */

const CFG = window.APP_CONFIG || {
  version: '2.0.2', schemaVersion: 2,
  gh: { owner: 'gogaclaudyan-ops', repo: 'slovarik-data', branch: 'main' },
  webUrl: 'https://gogaclaudyan-ops.github.io/slovarik/',
  parentPin: '8345', kidPin: { nastya: '9999' }
};

const KEY = 'slovarik_trainer_v1'; // сохраняем ключ v1, чтобы не потерять прогресс детей!
const INTERVALS = [0, 0, 1, 2, 4, 7, 14, 30, 60];
const MAX_BOX = 8, LEARNED_BOX = 5;
const PARENT_PIN = CFG.parentPin || '8345';
const KID_PIN = CFG.kidPin || { nastya: '9999' };

/* ---------- утилиты ---------- */
const dstr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dstr(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return dstr(d); };
const fmtDate = s => s ? s.split('-').reverse().join('.') : '';
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; };

function lev(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 9;
  const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/* ---------- словари ---------- */
const UNITS4 = [...new Set(EN4.map(x => x.u))];
const UNITS7 = [...new Set(EN7.map(x => x.u))];
const ITEM = {};
EN4.forEach(x => ITEM[x.id] = x);
EN7.forEach(x => ITEM[x.id] = x);
RU_WORDS.forEach(x => ITEM[x.id] = x);

/* ---------- состояние, миграция v1 -> v2, миры ---------- */
function defaultWorld(id, xp = 0) {
  if (id === 'andrey') {
    return {
      theme: 'sbr',
      spinBest: 0,
      bossWins: 0,
      artifacts: [],
      mentor: 'gyro',
      t: 0
    };
  }
  return {
    theme: 'cozy',
    gems: Math.max(180, Math.floor((xp || 0) / 10)),
    gemsEarned: Math.max(180, Math.floor((xp || 0) / 10)),
    pets: ['capybara'],
    activePet: 'capybara',
    room: ['window', 'rug', 'plant'],
    freeCapsules: 1,
    t: 0
  };
}

function ensureProfileV2(p) {
  if (!p) return;
  p.schemaVer = CFG.schemaVersion || 2;
  if (!p.avatar || p.avatar.includes('\ufffd')) p.avatar = p.id === 'nastya' ? '🌸' : '🐎';
  if (!p.world) p.world = defaultWorld(p.id, p.xp);
  if (p.id === 'nastya') {
    if (!Array.isArray(p.world.pets) || !p.world.pets.length) p.world.pets = ['capybara'];
    if (!p.world.activePet) p.world.activePet = p.world.pets[0];
    if (!Array.isArray(p.world.room)) p.world.room = ['window', 'rug', 'plant'];
    if (typeof p.world.gems !== 'number') p.world.gems = Math.max(180, Math.floor((p.xp || 0) / 10));
    if (typeof p.world.freeCapsules !== 'number') p.world.freeCapsules = 1;
  } else if (p.id === 'andrey') {
    if (!Array.isArray(p.world.artifacts)) p.world.artifacts = [];
    if (typeof p.world.spinBest !== 'number') p.world.spinBest = 0;
    if (typeof p.world.bossWins !== 'number') p.world.bossWins = 0;
  }
  if (!p.telemetry) p.telemetry = { sessionsLog: [], totalHints: 0 };
  if (!Array.isArray(p.telemetry.sessionsLog)) p.telemetry.sessionsLog = [];
}

function defaultProfile(id, name, grade, avatar) {
  const p = {
    id, name, grade, avatar,
    schemaVer: CFG.schemaVersion || 2,
    cards: {}, days: {}, xp: 0, ach: {},
    set: {
      goalMin: grade === 4 ? 15 : 20,
      goalSessions: 2,
      newPerDay: grade === 4 ? 8 : 10,
      enUnits: (grade === 4 ? UNITS4 : UNITS7).slice(),
      ruGrades: grade === 4 ? [1, 2, 3, 4] : [5, 6, 7]
    },
    world: defaultWorld(id, 0),
    telemetry: { sessionsLog: [], totalHints: 0 }
  };
  return p;
}

function loadState() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  if (!s || !s.profiles) {
    s = {
      profiles: {
        nastya: defaultProfile('nastya', 'Настя', 4, '🌸'),
        andrey: defaultProfile('andrey', 'Андрей', 7, '🐎')
      },
      parent: { email: '' }
    };
  }
  s.parent = s.parent || {};
  s.parent.pin = PARENT_PIN;
  Object.values(s.profiles).forEach(p => {
    Object.entries(p.days || {}).forEach(([d, r]) => {
      if (!r.dev) {
        p.days[d] = {
          goal: !!r.goal,
          dev: { old: { sec: r.sec || 0, ses: r.ses || 0, ok: r.ok || 0, bad: r.bad || 0, nw: r.nw || 0, games: r.games || 0, errs: r.errs || {} } }
        };
      }
    });
    ensureProfileV2(p);
  });
  return s;
}

const DEV = (() => {
  let d = null;
  try {
    d = localStorage.getItem('slovarik_dev');
    if (!d) { d = 'd' + Math.random().toString(36).slice(2, 10); localStorage.setItem('slovarik_dev', d); }
  } catch (e) { d = 'nodev'; }
  return d;
})();

let S = loadState();
let cur = { pid: null, screen: 'home', active: false };
let saveTimer = null;

function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('Не удалось сохранить', e); }
}
function save() { saveLocal(); if (typeof sync !== 'undefined') sync.dirty = true; }
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }
const P = () => S.profiles[cur.pid];
const DAY_FIELDS = ['sec', 'ses', 'ok', 'bad', 'nw', 'games'];

function dayObj(p, d = today()) { return p.days[d] || (p.days[d] = { goal: false, dev: {} }); }
function dayRec(p, d = today()) {
  const o = dayObj(p, d);
  return o.dev[DEV] || (o.dev[DEV] = { sec: 0, ses: 0, ok: 0, bad: 0, nw: 0, games: 0, errs: {} });
}
function dayTot(p, d = today()) {
  const o = p.days[d], t = { sec: 0, ses: 0, ok: 0, bad: 0, nw: 0, games: 0, errs: {}, goal: !!(o && o.goal) };
  if (o) Object.values(o.dev || {}).forEach(r => {
    DAY_FIELDS.forEach(k => t[k] += r[k] || 0);
    Object.entries(r.errs || {}).forEach(([k, v]) => t.errs[k] = (t.errs[k] || 0) + v);
  });
  return t;
}
function card(p, id) { return p.cards[id] || (p.cards[id] = { b: 0, due: null, ok: 0, bad: 0 }); }
const touch = c => { c.t = Date.now(); return c; };
const isNew = (p, id) => !p.cards[id] || p.cards[id].b === 0;
const enDeck = p => (p.grade === 4 ? EN4 : EN7).filter(x => p.set.enUnits.includes(x.u));
const ruDeck = p => RU_WORDS.filter(x => p.set.ruGrades.includes(x.g));
const deckOf = (p, subj) => subj === 'en' ? enDeck(p) : ruDeck(p);

/* ---------- телеметрия и AI-дайджест ---------- */
function logSessionTelemetry(p, entry) {
  ensureProfileV2(p);
  p.telemetry.sessionsLog.push({
    date: today(),
    ts: Date.now(),
    appVer: CFG.version,
    ...entry
  });
  if (p.telemetry.sessionsLog.length > 80) {
    p.telemetry.sessionsLog = p.telemetry.sessionsLog.slice(-80);
  }
}

function buildAiDigest() {
  const digest = {
    generatedAt: new Date().toISOString(),
    appVersion: CFG.version,
    profiles: {}
  };
  ['nastya', 'andrey'].forEach(id => {
    const p = S.profiles[id];
    ensureProfileV2(p);
    const daysKeys = Object.keys(p.days).sort().slice(-14);
    const recentDays = daysKeys.map(d => {
      const t = dayTot(p, d);
      return { date: d, min: Math.round(t.sec / 60), ses: t.ses, ok: t.ok, bad: t.bad, nw: t.nw, games: t.games, goal: t.goal };
    });
    const hard = Object.entries(p.cards)
      .filter(([wid, c]) => c.bad > 0 && ITEM[wid])
      .sort((a, b) => (b[1].bad - b[1].ok * 0.25) - (a[1].bad - a[1].ok * 0.25))
      .slice(0, 15)
      .map(([wid, c]) => {
        const it = ITEM[wid];
        return {
          id: wid,
          word: it.w !== undefined ? ruWordOf(it) : `${it.en} (${it.ru})`,
          box: c.b, ok: c.ok, bad: c.bad, lastWrong: c.wr || null, mnemo: c.mn || null
        };
      });
    digest.profiles[id] = {
      name: p.name, grade: p.grade, xp: p.xp, level: level(p.xp), streak: streak(p),
      learnedTotal: learnedCount(p),
      bestBlitz: p.bestBlitz || 0,
      world: p.world,
      recentDays,
      topHardWords: hard,
      recentSessions: (p.telemetry.sessionsLog || []).slice(-20)
    };
  });
  return digest;
}

/* ---------- русский язык: орфограммы ---------- */
const VOW = { 'о': ['о', 'а'], 'а': ['а', 'о'], 'е': ['е', 'и'], 'и': ['и', 'е'], 'я': ['я', 'е'], 'ё': ['ё', 'о'], 'ю': ['ю', 'у'], 'у': ['у', 'о'], 'э': ['э', 'е'], 'ы': ['ы', 'и'] };
function gapOptions(ch, pos, dbl) {
  if (dbl) return [ch + ch, ch];
  if (VOW[ch]) return VOW[ch];
  switch (ch) {
    case 'ь': return ['ь', 'ъ', ''];
    case 'ъ': return ['ъ', 'ь', ''];
    case 'н': return ['н', 'нн'];
    case 'с': return pos === 0 ? ['с', 'з'] : ['с', 'сс'];
    case 'з': return ['з', 'с'];
    case 'г': return ['г', 'к', 'в'];
    case 'ж': return ['ж', 'ш'];
    case 'й': return ['й', 'д'];
    default: return [ch, ''];
  }
}
const ruParseCache = {};
function ruParse(item) {
  if (ruParseCache[item.id]) return ruParseCache[item.id];
  let w = item.w, cap = false;
  if (w[0] === '^') { cap = true; w = w.slice(1); }
  const segs = []; let i = 0;
  const isUp = c => c !== c.toLowerCase();
  while (i < w.length) {
    const c = w[i];
    if (isUp(c)) {
      const lc = c.toLowerCase();
      const dbl = w[i + 1] === c;
      segs.push({ gap: true, ans: dbl ? lc + lc : lc, opts: gapOptions(lc, i, dbl) });
      i += dbl ? 2 : 1;
    } else { segs.push({ gap: false, t: c }); i++; }
  }
  let word = segs.map(s => s.gap ? s.ans : s.t).join('');
  if (cap) word = word[0].toUpperCase() + word.slice(1);
  const r = { segs, word, cap };
  ruParseCache[item.id] = r;
  return r;
}
function ruBuild(p, choices) {
  let k = 0;
  let w = p.segs.map(s => s.gap ? choices[k++] : s.t).join('');
  if (p.cap) w = w[0].toUpperCase() + w.slice(1);
  return w;
}
function ruWrongVariants(item, n = 2) {
  const pr = ruParse(item), gaps = pr.segs.filter(s => s.gap), out = new Set();
  let tries = 0;
  while (out.size < n && tries++ < 40) {
    const ch = gaps.map(g => g.ans);
    const flips = gaps.length > 2 && Math.random() < .4 ? 2 : 1;
    for (let f = 0; f < flips; f++) {
      const gi = Math.random() * gaps.length | 0;
      const alt = gaps[gi].opts.filter(o => o !== gaps[gi].ans);
      if (alt.length) ch[gi] = pick(alt);
    }
    const v = ruBuild(pr, ch);
    if (v !== pr.word) out.add(v);
  }
  return [...out];
}
function ruHighlight(item) {
  const pr = ruParse(item); let first = true;
  return pr.segs.map(s => {
    let t = s.gap ? s.ans : s.t;
    if (first && pr.cap) t = t[0].toUpperCase() + t.slice(1);
    first = false;
    return s.gap ? `<span class="hl">${esc(t || '·')}</span>` : esc(t);
  }).join('');
}
function spaceVariants(item) {
  const correct = item.w.replace('|', ''), set = new Set([correct]);
  if (item.w.includes('|')) { set.add(item.w.replace('|', ' ')); set.add(item.w.replace('|', '-')); }
  else {
    set.add(correct.replace(/[ -]/g, ''));
    if (correct.includes('-')) set.add(correct.replace(/-/g, ' '));
    else set.add(correct.replace(' ', '-'));
  }
  return { correct, variants: shuffle([...set]) };
}
const ruWordOf = item => item.t === 's' ? item.w.replace('|', '') : ruParse(item).word;

function syllables(w) {
  const V = 'аеёиоуыэюя';
  return w.split(' ').map(word => {
    const lw = word.toLowerCase();
    const vi = [...lw].map((c, i) => V.includes(c) ? i : -1).filter(i => i >= 0);
    if (vi.length < 2) return word;
    const cuts = [];
    for (let k = 0; k < vi.length - 1; k++) {
      const a = vi[k], b = vi[k + 1], cl = lw.slice(a + 1, b);
      let cut = a + 1;
      if (cl.length >= 2) {
        if (cl[0] === 'й') cut = a + 2;
        else if ('ьъ'.includes(cl[1])) cut = a + 3;
        else if (cl[0] === cl[1]) cut = a + 2;
        else if ('лмнр'.includes(cl[0])) cut = a + 2;
      } else if (cl === 'й' || cl === 'ь' || cl === 'ъ') cut = a + 2;
      cuts.push(Math.min(cut, b));
    }
    let out = '', prev = 0;
    cuts.forEach(c => { out += word.slice(prev, c) + '-'; prev = c; });
    return out + word.slice(prev);
  }).join(' ');
}

function diffMark(wrong, right) {
  const a = [...wrong], b = [...right.toLowerCase()];
  let s = 0; while (s < a.length && s < b.length && a[s].toLowerCase() === b[s]) s++;
  let e = 0; while (e < a.length - s && e < b.length - s && a[a.length - 1 - e].toLowerCase() === b[b.length - 1 - e]) e++;
  const mid = a.slice(s, a.length - e).join('');
  return esc(a.slice(0, s).join('')) + (mid ? `<span class="wrongch">${esc(mid)}</span>` : `<span class="wrongch">·</span>`) + esc(a.slice(a.length - e).join(''));
}

/* ---------- речь и звуки ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
const voiceFor = lang => voices.find(v => v.lang.replace('_', '-').startsWith(lang === 'en' ? 'en-GB' : 'ru')) || voices.find(v => v.lang.startsWith(lang));
const AB = window.AndroidBridge || null;
const IS_ANDROID = !!AB;
const canSpeak = lang => AB ? (() => { try { return AB.hasTts(lang); } catch (e) { return false; } })() : ('speechSynthesis' in window && !!voiceFor(lang));

function speak(text, lang = 'en', rate) {
  if (AB) { try { AB.speak(text.replace(/!/g, ''), lang, rate || (lang === 'en' ? .85 : .8)); } catch (e) { } return; }
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/!/g, ''));
    const v = voiceFor(lang); if (v) u.voice = v;
    u.lang = lang === 'en' ? 'en-GB' : 'ru-RU';
    u.rate = rate || (lang === 'en' ? .85 : .8);
    speechSynthesis.speak(u);
  } catch (e) { }
}
const SR = (AB && (() => { try { return AB.canListen(); } catch (e) { return false; } })()) ? 'android' : (window.SpeechRecognition || window.webkitSpeechRecognition);

let actx = null;
const SFX_KEY = 'slovarik_sfx';
function isSoundOn() {
  try { return localStorage.getItem(SFX_KEY) !== '0'; } catch (e) { return true; }
}
function toggleSound() {
  const next = !isSoundOn();
  try { localStorage.setItem(SFX_KEY, next ? '1' : '0'); } catch (e) { }
  if (next) playPop();
  return next;
}
function getAudioCtx() {
  if (!isSoundOn()) return null;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}

function beep(good, combo = 1) {
  const ctx = getAudioCtx(); if (!ctx) return;
  try {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const base = scale[Math.min(scale.length - 1, Math.max(0, (combo || 1) - 1))];
    const notes = good ? [base, base * 1.25] : [310, 230];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = good ? 'sine' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(.0001, ctx.currentTime + i * .085);
      g.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + i * .085 + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + i * .085 + .18);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * .085);
      o.stop(ctx.currentTime + i * .085 + .2);
    });
  } catch (e) { }
}

function playPop() {
  const ctx = getAudioCtx(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + .08);
    g.gain.setValueAtTime(.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.14, ctx.currentTime + .015);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .1);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + .11);
  } catch (e) { }
}

function playHit() {
  const ctx = getAudioCtx(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + .14);
    g.gain.setValueAtTime(.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.2, ctx.currentTime + .012);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .16);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + .17);
  } catch (e) { }
}

function playGachaCrack() {
  const ctx = getAudioCtx(); if (!ctx) return;
  try {
    [440, 554.37, 659.25, 880, 1108.73, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, ctx.currentTime + i * .07);
      g.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + i * .07 + .018);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + i * .07 + .24);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * .07);
      o.stop(ctx.currentTime + i * .07 + .25);
    });
  } catch (e) { }
}

function playFanfare() {
  const ctx = getAudioCtx(); if (!ctx) return;
  try {
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, ctx.currentTime + i * .09);
      g.gain.exponentialRampToValueAtTime(.18, ctx.currentTime + i * .09 + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + i * .09 + .25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * .09);
      o.stop(ctx.currentTime + i * .09 + .26);
    });
  } catch (e) { }
}

function toast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  t.innerHTML = msg; t.hidden = false;
  t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.hidden = true, ms);
}

function showSfx(text) {
  const layer = document.getElementById('sfx-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'sfx-pop';
  el.textContent = text;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function floatReward(text, kind = 'xp') {
  const layer = document.getElementById('sfx-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = `float-reward ${kind}`;
  el.textContent = text;
  el.style.left = (42 + Math.random() * 16) + '%';
  el.style.top = (36 + Math.random() * 10) + '%';
  layer.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function confetti(n = 30) {
  const em = cur.pid === 'andrey' ? ['⚡', '⭐', '🐎', '🏆', '🌀'] : ['✨', '⭐', '💎', '🌸', '🎀', '🎉'];
  for (let i = 0; i < n; i++) {
    const e = document.createElement('div');
    e.className = 'confetti';
    e.textContent = pick(em);
    e.style.left = Math.random() * 100 + 'vw';
    e.style.animationDuration = (1.5 + Math.random() * 1.7) + 's';
    e.style.animationDelay = Math.random() * .5 + 's';
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 4000);
  }
}

/* ---------- цели, серии, уровни, награды ---------- */
function goalState(p, d = today()) {
  const r = dayTot(p, d);
  const min = Math.floor(r.sec / 60);
  const pm = Math.min(1, r.sec / (p.set.goalMin * 60)), ps = Math.min(1, r.ses / p.set.goalSessions);
  return { min, ses: r.ses, pct: Math.round((pm + ps) / 2 * 100), done: r.sec >= p.set.goalMin * 60 && r.ses >= p.set.goalSessions };
}
function streak(p) {
  let n = 0, d = today();
  if (!goalState(p, d).done) d = addDays(d, -1);
  while (goalState(p, d).done) { n++; d = addDays(d, -1); }
  return n;
}
const level = xp => Math.floor(Math.sqrt((xp || 0) / 60)) + 1;
const xpForLevel = l => (l - 1) * (l - 1) * 60;
function learnedCount(p) { return Object.values(p.cards).filter(c => c.b >= LEARNED_BOX).length; }

const ACH = [
  ['first', '🚀', 'Первый шаг', 'Пройти первую тренировку'],
  ['goal1', '🎯', 'Цель дня', 'Выполнить дневную норму'],
  ['streak3', '🔥', 'Три дня подряд', 'Норма 3 дня подряд'],
  ['streak7', '🏆', 'Неделя!', 'Норма 7 дней подряд'],
  ['streak30', '👑', 'Месяц силы', 'Норма 30 дней подряд'],
  ['perfect', '💎', 'Без ошибок', 'Тренировка без единой ошибки'],
  ['w25', '🌱', '25 слов', 'Выучить 25 слов'],
  ['w100', '🌳', '100 слов', 'Выучить 100 слов'],
  ['w250', '🌟', '250 слов', 'Выучить 250 слов'],
  ['ok500', '✅', '500 верных', '500 правильных ответов'],
  ['blitz20', '⚡', 'Молния', 'Набрать 20 очков в блице'],
  ['pairs', '🃏', 'Мастер пар', 'Найти все пары меньше чем за 60 секунд'],
  ['mnemo', '💡', 'Изобретатель', 'Придумать 5 своих подсказок'],
  ['lvl5', '⭐', 'Уровень 5', 'Достигнуть 5 уровня'],
  ['spin5', '🌀', 'Золотое вращение', 'Сделать серию 5+ верных ответов подряд'],
  ['boss1', '⚔️', 'Победитель дуэли', 'Победить соперника в работе над ошибками']
];

function checkGoal() {
  const p = P(); if (!p) return;
  const r = dayObj(p);
  if (!r.goal && goalState(p).done) {
    r.goal = true; p.xp += 50;
    if (p.id === 'nastya') {
      p.world.freeCapsules = (p.world.freeCapsules || 0) + 1;
      p.world.gems = (p.world.gems || 0) + 60;
      p.world.t = Date.now();
    } else if (p.id === 'andrey') {
      p.world.t = Date.now();
    }
    save(); confetti(40); playFanfare();
    toast(p.id === 'nastya'
      ? '🎉 Цель дня выполнена! +50 ⭐, +60 💎 и 1 Волшебная капсула!'
      : '🏆 Цель дня выполнена! +50 ⭐ · Рывок на трассе Steel Ball Run!', 3500);
    checkAch();
  }
}

function grant(id) {
  const p = P(); if (!p || p.ach[id]) return;
  p.ach[id] = today();
  const a = ACH.find(x => x[0] === id);
  if (a) setTimeout(() => { toast(`${a[1]} Новая награда: ${a[2]}`, 3200); confetti(20); }, 550);
}

function checkAch(extra = {}) {
  const p = P(); if (!p) return;
  const tots = Object.keys(p.days).map(d => dayTot(p, d));
  const totOk = tots.reduce((s, d) => s + d.ok, 0);
  const L = learnedCount(p), st = streak(p);
  if (tots.some(d => d.ses > 0)) grant('first');
  if (tots.some(d => d.goal)) grant('goal1');
  if (st >= 3) grant('streak3');
  if (st >= 7) grant('streak7');
  if (st >= 30) grant('streak30');
  if (L >= 25) grant('w25');
  if (L >= 100) grant('w100');
  if (L >= 250) grant('w250');
  if (totOk >= 500) grant('ok500');
  if (level(p.xp) >= 5) grant('lvl5');
  if (Object.values(p.cards).filter(c => c.mn).length >= 5) grant('mnemo');
  if (extra.perfect) grant('perfect');
  if (extra.blitz >= 20) grant('blitz20');
  if (extra.pairsFast) grant('pairs');
  if (extra.comboMax >= 5) grant('spin5');
  if (extra.bossWin) grant('boss1');
  save();
}

/* ---------- онлайн-синхронизация через GitHub ---------- */
const GH = CFG.gh;
const TOKEN_KEY = 'slovarik_gh_token';
const WEB_URL = CFG.webUrl;

(function acceptInvite() {
  const m = /[#&]k=([^&]+)/.exec(location.hash || '');
  if (!m) return;
  try { localStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1])); } catch (e) { }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  setTimeout(() => toast('✅ Устройство подключено к онлайн-хранению', 3500), 500);
})();

const sync = { dirty: false, busy: false, lastOk: 0, err: '', pending: false };
const ghToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || window.DEFAULT_GH_TOKEN || ''; }
  catch (e) { return window.DEFAULT_GH_TOKEN || ''; }
};

function b64e(str) {
  const bytes = new TextEncoder().encode(str); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64d(b) {
  const bin = atob(b.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
function stable(o) {
  if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
  if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
  return JSON.stringify(o);
}

async function gh(method, path, body) {
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}` + (method === 'GET' ? `?ref=${GH.branch}&_=${Date.now()}` : '');
  return fetch(url, {
    method, cache: 'no-store',
    headers: { 'Authorization': 'Bearer ' + ghToken(), 'Accept': 'application/vnd.github+json' },
    body: body ? JSON.stringify(body) : undefined
  });
}
function ghError(r) {
  return r.status === 401 ? 'Токен GitHub неверный или истёк'
    : r.status === 403 ? 'У токена нет доступа к репозиторию (нужно право Contents: Read and write)'
    : r.status === 404 ? 'Репозиторий не найден — проверьте доступ токена к ' + GH.repo
    : 'Ошибка GitHub ' + r.status;
}
async function checkToken() {
  try {
    const r = await gh('GET', 'README.md');
    if (r.ok) { sync.err = ''; return true; }
    sync.err = ghError(r);
  } catch (e) { sync.err = 'Нет связи с GitHub'; }
  updSync(); return false;
}
async function pullFile(path) {
  const r = await gh('GET', path);
  if (r.status === 404) {
    const t = await gh('GET', 'README.md');
    if (!t.ok) throw new Error(ghError(t));
    return { sha: null, data: null };
  }
  if (!r.ok) throw new Error(ghError(r));
  const j = await r.json();
  return { sha: j.sha, data: JSON.parse(b64d(j.content)) };
}
async function pushFile(path, data, sha) {
  const r = await gh('PUT', path, {
    message: `${path} · v${CFG.version} · ${new Date().toLocaleString('ru-RU')}`,
    content: b64e(JSON.stringify(data)),
    branch: GH.branch,
    ...(sha ? { sha } : {})
  });
  if (r.status === 409 || r.status === 422) return null;
  if (!r.ok) throw new Error(ghError(r));
  return true;
}

function mergeProfile(L, R) {
  if (!R || !L) return;
  if ((R.rst || 0) > (L.rst || 0)) {
    Object.keys(L).forEach(k => delete L[k]);
    Object.assign(L, JSON.parse(JSON.stringify(R)));
    ensureProfileV2(L);
    return;
  }
  if ((L.rst || 0) > (R.rst || 0)) return;
  for (const [id, rc] of Object.entries(R.cards || {})) {
    const lc = L.cards[id];
    if (!lc) L.cards[id] = rc;
    else if ((rc.t || 0) > (lc.t || 0)) { Object.keys(lc).forEach(k => delete lc[k]); Object.assign(lc, rc); }
  }
  for (const [d, ro] of Object.entries(R.days || {})) {
    const lo = L.days[d] || (L.days[d] = { goal: false, dev: {} });
    lo.goal = !!(lo.goal || ro.goal);
    for (const [dev, rr] of Object.entries(ro.dev || {})) {
      const lr = lo.dev[dev];
      if (!lr) { lo.dev[dev] = rr; continue; }
      DAY_FIELDS.forEach(k => lr[k] = Math.max(lr[k] || 0, rr[k] || 0));
      lr.errs = lr.errs || {};
      for (const [k, v] of Object.entries(rr.errs || {})) lr.errs[k] = Math.max(lr.errs[k] || 0, v);
    }
  }
  L.xp = Math.max(L.xp || 0, R.xp || 0);
  if (R.bestBlitz || L.bestBlitz) L.bestBlitz = Math.max(L.bestBlitz || 0, R.bestBlitz || 0);
  L.ach = L.ach || {};
  for (const [k, v] of Object.entries(R.ach || {})) if (!L.ach[k]) L.ach[k] = v;
  if ((R.setT || 0) > (L.setT || 0)) { L.set = R.set; L.setT = R.setT; }

  // Слияние миров v2
  ensureProfileV2(L);
  if (R.world) {
    if ((R.world.t || 0) > (L.world.t || 0)) {
      L.world = Object.assign({}, L.world, R.world);
    }
    if (L.id === 'nastya') {
      L.world.pets = [...new Set([...(L.world.pets || []), ...(R.world.pets || [])])];
      L.world.room = [...new Set([...(L.world.room || []), ...(R.world.room || [])])];
    } else if (L.id === 'andrey') {
      L.world.artifacts = [...new Set([...(L.world.artifacts || []), ...(R.world.artifacts || [])])];
      L.world.spinBest = Math.max(L.world.spinBest || 0, R.world.spinBest || 0);
      L.world.bossWins = Math.max(L.world.bossWins || 0, R.world.bossWins || 0);
    }
  }
  // Слияние телеметрии
  if (R.telemetry && Array.isArray(R.telemetry.sessionsLog)) {
    const byTs = new Map();
    (L.telemetry.sessionsLog || []).concat(R.telemetry.sessionsLog).forEach(x => byTs.set(x.ts || Math.random(), x));
    L.telemetry.sessionsLog = [...byTs.values()].sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-80);
  }
}

async function syncAll(manual) {
  if (!ghToken()) { if (manual) toast('Сначала введите токен GitHub ниже'); updSync(); return false; }
  if (sync.busy) { sync.pending = true; return false; }
  sync.busy = true; sync.dirty = false; updSync();
  const before = stable(S.profiles);
  let ok = true;
  try {
    for (const id of ['nastya', 'andrey']) {
      const path = `data/${id}.json`;
      for (let attempt = 0; attempt < 4; attempt++) {
        const { sha, data } = await pullFile(path);
        mergeProfile(S.profiles[id], data);
        if (data && stable(data) === stable(S.profiles[id])) break;
        if (await pushFile(path, S.profiles[id], sha)) break;
      }
    }
    sync.lastOk = Date.now(); sync.err = ''; saveLocal();
  } catch (e) {
    ok = false; sync.dirty = true;
    sync.err = (e && e.message && !/fetch|network/i.test(e.message)) ? e.message : 'Нет интернета — данные сохранены на устройстве';
  }
  sync.busy = false; updSync();
  if (manual) toast(ok ? '☁️ Данные обновлены' : '⚠️ ' + sync.err, 3000);
  if (stable(S.profiles) !== before && typeof go === 'function' && ['home', 'kid', 'parent', 'words', 'awards'].includes(cur.screen)) go(cur.screen);
  if (sync.pending) { sync.pending = false; setTimeout(syncAll, 500); }
  return ok;
}

function syncText() {
  if (!ghToken()) return '☁️ Онлайн-хранение не подключено';
  if (sync.busy) return '⏳ Синхронизация…';
  if (sync.err) return `⚠️ ${esc(sync.err)}`;
  if (sync.lastOk) return `☁️ Сохранено онлайн в ${new Date(sync.lastOk).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  return '☁️ Подключено';
}
function updSync() { const el = document.getElementById('syncSt'); if (el) el.innerHTML = syncText(); }
