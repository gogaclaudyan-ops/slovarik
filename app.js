'use strict';
/* =========================================================================
   Словарик-тренажёр для Насти (4 кл.) и Андрея (7 кл.)
   Методики: интервальное повторение (система Лейтнера), активное извлечение,
   двунаправленный перевод, мультисенсорность (звук, картинка, письмо, голос),
   порции по 3–5 слов, перемешивание, повтор ошибок до верного ответа,
   «желательная трудность» (от выбора к письму), мнемо-ассоциации,
   выделение орфограмм, фото-диктант, игры и награды, дневная цель.
   ========================================================================= */

const app = document.getElementById('app');
const KEY = 'slovarik_trainer_v1';
const INTERVALS = [0, 0, 1, 2, 4, 7, 14, 30, 60]; // дни до повтора по номеру «коробки»
const MAX_BOX = 8, LEARNED_BOX = 5;

/* ---------- утилиты ---------- */
const dstr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dstr(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return dstr(d); };
const fmtDate = s => s.split('-').reverse().join('.');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; };

function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  const d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/* ---------- данные ---------- */
const UNITS4 = [...new Set(EN4.map(x => x.u))];
const UNITS7 = [...new Set(EN7.map(x => x.u))];
const ITEM = {};
EN4.forEach(x => ITEM[x.id] = x); EN7.forEach(x => ITEM[x.id] = x); RU_WORDS.forEach(x => ITEM[x.id] = x);

function defaultProfile(id, name, grade, avatar) {
  return {
    id, name, grade, avatar, cards: {}, days: {}, xp: 0, ach: {},
    set: {
      goalMin: grade === 4 ? 15 : 20, goalSessions: 2, newPerDay: grade === 4 ? 8 : 10,
      enUnits: (grade === 4 ? UNITS4 : UNITS7).slice(),
      ruGrades: grade === 4 ? [1, 2, 3, 4] : [5, 6, 7]
    }
  };
}
function loadState() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  if (!s || !s.profiles) s = { profiles: { nastya: defaultProfile('nastya', 'Настя', 4, '🦄'), andrey: defaultProfile('andrey', 'Андрей', 7, '🚀') }, parent: { email: '' } };
  s.parent = s.parent || {}; s.parent.pin = PARENT_PIN;
  // перевод старого формата дней (без устройств) в новый
  Object.values(s.profiles).forEach(p => Object.entries(p.days).forEach(([d, r]) => {
    if (!r.dev) p.days[d] = { goal: !!r.goal, dev: { old: { sec: r.sec || 0, ses: r.ses || 0, ok: r.ok || 0, bad: r.bad || 0, nw: r.nw || 0, games: r.games || 0, errs: r.errs || {} } } };
  }));
  return s;
}
const PARENT_PIN = '8345';
const DEV = (() => { let d = null; try { d = localStorage.getItem('slovarik_dev'); if (!d) { d = 'd' + Math.random().toString(36).slice(2, 10); localStorage.setItem('slovarik_dev', d); } } catch (e) { d = 'nodev'; } return d; })();
let S = loadState();
let saveTimer = null;
function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('Не удалось сохранить', e); } }
function save() { saveLocal(); if (typeof sync !== 'undefined') sync.dirty = true; }
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }

const P = () => S.profiles[cur.pid];
const DAY_FIELDS = ['sec', 'ses', 'ok', 'bad', 'nw', 'games'];
function dayObj(p, d = today()) { return p.days[d] || (p.days[d] = { goal: false, dev: {} }); }
// запись за день для ЭТОГО устройства (данные разных устройств потом складываются)
function dayRec(p, d = today()) { const o = dayObj(p, d); return o.dev[DEV] || (o.dev[DEV] = { sec: 0, ses: 0, ok: 0, bad: 0, nw: 0, games: 0, errs: {} }); }
// сумма за день по всем устройствам
function dayTot(p, d = today()) {
  const o = p.days[d], t = { sec: 0, ses: 0, ok: 0, bad: 0, nw: 0, games: 0, errs: {}, goal: !!(o && o.goal) };
  if (o) Object.values(o.dev || {}).forEach(r => { DAY_FIELDS.forEach(k => t[k] += r[k] || 0); Object.entries(r.errs || {}).forEach(([k, v]) => t.errs[k] = (t.errs[k] || 0) + v); });
  return t;
}
function card(p, id) { return p.cards[id] || (p.cards[id] = { b: 0, due: null, ok: 0, bad: 0 }); }
const touch = c => { c.t = Date.now(); return c; };
const isNew = (p, id) => !p.cards[id] || p.cards[id].b === 0;

const enDeck = p => (p.grade === 4 ? EN4 : EN7).filter(x => p.set.enUnits.includes(x.u));
const ruDeck = p => RU_WORDS.filter(x => p.set.ruGrades.includes(x.g));
const deckOf = (p, subj) => subj === 'en' ? enDeck(p) : ruDeck(p);

/* ---------- русские слова: разбор орфограмм ---------- */
const VOW = { 'о': ['о', 'а'], 'а': ['а', 'о'], 'е': ['е', 'и'], 'и': ['и', 'е'], 'я': ['я', 'е'], 'ё': ['ё', 'о'], 'ю': ['ю', 'у'], 'у': ['у', 'о'], 'э': ['э', 'е'], 'ы': ['ы', 'и'] };
function gapOptions(ch, pos, dbl, word) {
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
    default: return [ch, '']; // непроизносимые: здраВствуй, празДник, лесТница
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
      segs.push({ gap: true, ans: dbl ? lc + lc : lc, opts: gapOptions(lc, i, dbl, w) });
      i += dbl ? 2 : 1;
    } else { segs.push({ gap: false, t: c }); i++; }
  }
  let word = segs.map(s => s.gap ? s.ans : s.t).join('');
  if (cap) word = word[0].toUpperCase() + word.slice(1);
  const r = { segs, word, cap };
  ruParseCache[item.id] = r; return r;
}
function ruBuild(p, choices) { // choices: массив вариантов для пропусков
  let k = 0;
  let w = p.segs.map(s => s.gap ? choices[k++] : s.t).join('');
  if (p.cap) w = w[0].toUpperCase() + w.slice(1);
  return w;
}
function ruWrongVariants(item, n = 2) {
  const pr = ruParse(item); const gaps = pr.segs.filter(s => s.gap); const out = new Set();
  let tries = 0;
  while (out.size < n && tries++ < 40) {
    const ch = gaps.map(g => g.ans);
    const flips = gaps.length > 2 && Math.random() < .4 ? 2 : 1;
    for (let f = 0; f < flips; f++) { const gi = Math.random() * gaps.length | 0; const alt = gaps[gi].opts.filter(o => o !== gaps[gi].ans); ch[gi] = pick(alt); }
    const v = ruBuild(pr, ch); if (v !== pr.word) out.add(v);
  }
  return [...out];
}
function ruHighlight(item) {
  const pr = ruParse(item);
  let first = true;
  return pr.segs.map(s => { let t = s.gap ? s.ans : s.t; if (first && pr.cap) t = t[0].toUpperCase() + t.slice(1); first = false; return s.gap ? `<span class="hl">${esc(t || '·')}</span>` : esc(t); }).join('');
}
function spaceVariants(item) {
  const correct = item.w.replace('|', '');
  const set = new Set([correct]);
  if (item.w.includes('|')) { set.add(item.w.replace('|', ' ')); set.add(item.w.replace('|', '-')); }
  else {
    set.add(correct.replace(/[ -]/g, ''));
    if (correct.includes('-')) set.add(correct.replace(/-/g, ' ')); else set.add(correct.replace(' ', '-'));
  }
  return { correct, variants: shuffle([...set]) };
}
const ruWordOf = item => item.t === 's' ? item.w.replace('|', '') : ruParse(item).word;

/* ---------- речь ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
const voiceFor = lang => voices.find(v => v.lang.replace('_', '-').startsWith(lang === 'en' ? 'en-GB' : 'ru')) || voices.find(v => v.lang.startsWith(lang));
const AB = window.AndroidBridge || null; // мост к Android (озвучка, микрофон, «поделиться»)
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

/* ---------- звуки ---------- */
let actx = null;
function beep(good) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = good ? [660, 880] : [300, 220];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = good ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, actx.currentTime + i * .1);
      g.gain.exponentialRampToValueAtTime(.18, actx.currentTime + i * .1 + .02);
      g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + i * .1 + .18);
      o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * .1); o.stop(actx.currentTime + i * .1 + .2);
    });
  } catch (e) { }
}
function toast(msg, ms = 2600) { const t = document.getElementById('toast'); t.innerHTML = msg; t.hidden = false; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms); }
function confetti(n = 30) {
  const em = ['🎉', '⭐', '✨', '🎈', '🏆', '💫'];
  for (let i = 0; i < n; i++) {
    const e = document.createElement('div'); e.className = 'confetti'; e.textContent = pick(em);
    e.style.left = Math.random() * 100 + 'vw'; e.style.animationDuration = (1.6 + Math.random() * 1.8) + 's'; e.style.animationDelay = Math.random() * .6 + 's';
    document.body.appendChild(e); setTimeout(() => e.remove(), 4200);
  }
}

/* ---------- учёт активного времени ---------- */
let cur = { pid: null, screen: 'home' };
let lastInput = Date.now();
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => lastInput = Date.now(), { passive: true }));
let tickN = 0;
setInterval(() => {
  if (!cur.pid || !cur.active || document.hidden) return;
  if (Date.now() - lastInput > 60000) return; // ребёнок отвлёкся — время не идёт
  const d = dayRec(P()); d.sec++;
  if (++tickN % 10 === 0) { checkGoal(); save(); }
  const el = document.getElementById('liveTime'); if (el) el.textContent = Math.floor(d.sec / 60);
}, 1000);

/* ---------- цели, серии, награды ---------- */
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
function checkGoal() {
  const p = P(); if (!p) return;
  const r = dayObj(p);
  if (!r.goal && goalState(p).done) {
    r.goal = true; p.xp += 50; save();
    confetti(40); beep(true);
    toast('🎉 Цель дня выполнена! +50 ⭐<br>Можно отдыхать или играть дальше');
    checkAch();
  }
}
const level = xp => Math.floor(Math.sqrt(xp / 60)) + 1;
const xpForLevel = l => (l - 1) * (l - 1) * 60;
const ACH = [
  ['first', '🌱', 'Первый шаг', 'Пройти первую тренировку'],
  ['goal1', '🎯', 'Цель дня', 'Выполнить дневную норму'],
  ['streak3', '🔥', 'Три дня подряд', 'Норма 3 дня подряд'],
  ['streak7', '🏅', 'Неделя!', 'Норма 7 дней подряд'],
  ['streak30', '👑', 'Месяц силы', 'Норма 30 дней подряд'],
  ['perfect', '💎', 'Без ошибок', 'Тренировка без единой ошибки'],
  ['w25', '📗', '25 слов', 'Выучить 25 слов'],
  ['w100', '📚', '100 слов', 'Выучить 100 слов'],
  ['w250', '🧠', '250 слов', 'Выучить 250 слов'],
  ['ok500', '✅', '500 верных', '500 правильных ответов'],
  ['blitz20', '⚡', 'Молния', 'Набрать 20 очков в блице'],
  ['pairs', '🃏', 'Мастер пар', 'Найти все пары меньше чем за 60 секунд'],
  ['mnemo', '💡', 'Изобретатель', 'Придумать 5 своих подсказок'],
  ['lvl5', '🚀', 'Уровень 5', 'Достигнуть 5 уровня']
];
function learnedCount(p) { return Object.values(p.cards).filter(c => c.b >= LEARNED_BOX).length; }
function grant(id) {
  const p = P(); if (p.ach[id]) return;
  p.ach[id] = today(); const a = ACH.find(x => x[0] === id);
  setTimeout(() => { toast(`${a[1]} Новая награда: <b>${a[2]}</b>`, 3200); confetti(20); }, 600);
}
function checkAch(extra = {}) {
  const p = P(); if (!p) return;
  const tots = Object.keys(p.days).map(d => dayTot(p, d));
  const totOk = tots.reduce((s, d) => s + d.ok, 0);
  const L = learnedCount(p), st = streak(p);
  if (tots.some(d => d.ses > 0)) grant('first');
  if (tots.some(d => d.goal)) grant('goal1');
  if (st >= 3) grant('streak3'); if (st >= 7) grant('streak7'); if (st >= 30) grant('streak30');
  if (L >= 25) grant('w25'); if (L >= 100) grant('w100'); if (L >= 250) grant('w250');
  if (totOk >= 500) grant('ok500');
  if (level(p.xp) >= 5) grant('lvl5');
  if (Object.values(p.cards).filter(c => c.mn).length >= 5) grant('mnemo');
  if (extra.perfect) grant('perfect'); if (extra.blitz >= 20) grant('blitz20'); if (extra.pairsFast) grant('pairs');
  save();
}

/* ---------- навигация ---------- */
function setTheme() { document.body.className = cur.pid ? 't-' + cur.pid : ''; }
function go(screen, opts = {}) {
  stopTimers();
  cur.screen = screen; cur.active = false; Object.assign(cur, opts);
  setTheme(); window.scrollTo(0, 0);
  ({ home: renderHome, kid: renderKid, words: renderWords, awards: renderAwards, parent: renderParent, pin: renderPin }[screen] || renderHome)();
}
let timers = [];
let gen = 0; // номер текущего экрана: отложенные действия старого экрана игнорируются
function stopTimers() { gen++; timers.forEach(t => clearInterval(t)); timers = []; try { if (AB) AB.stopSpeak(); else speechSynthesis.cancel(); } catch (e) { } }
addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

/* ---------- экран выбора ребёнка ---------- */
function renderHome() {
  cur.pid = null; setTheme();
  const cards = ['nastya', 'andrey'].map(id => {
    const p = S.profiles[id], g = goalState(p);
    return `<div class="card profile ${id}" data-pid="${id}">
      <div class="ava">${p.avatar}</div><h2>${esc(p.name)}</h2>
      <div class="muted">${p.grade} класс · уровень ${level(p.xp)} · 🔥 ${streak(p)}</div>
      <div style="margin:14px 0 6px" class="bar ${g.done ? 'okc' : ''}"><i style="width:${g.pct}%"></i></div>
      <div class="small muted">Сегодня: ${g.min} из ${p.set.goalMin} мин · ${g.ses} из ${p.set.goalSessions} трен. ${g.done ? '✅' : ''}</div>
    </div>`;
  }).join('');
  app.innerHTML = `
    <div class="center" style="margin-top:10px"><h1>📚 Словарик-тренажёр</h1>
    <div class="muted">Английские слова и словарные слова по русскому — по учебникам</div></div>
    <div class="profiles">${cards}</div>
    <div class="center"><button class="btn ghost" id="toParent">👨‍👩‍👧 Для родителей</button></div>
    <div class="small center" id="syncSt" style="margin-top:14px">${syncText()}</div>`;
  app.querySelectorAll('[data-pid]').forEach(el => el.onclick = () => go('kid', { pid: el.dataset.pid }));
  document.getElementById('toParent').onclick = () => go('pin');
}

/* ---------- главная ребёнка ---------- */
function dueCount(p, subj) { const t = today(); return deckOf(p, subj).filter(x => { const c = p.cards[x.id]; return c && c.b > 0 && c.due <= t; }).length; }
function newLeft(p, subj) { const r = dayTot(p); const left = Math.max(0, p.set.newPerDay - (r.nw || 0)); const avail = deckOf(p, subj).filter(x => isNew(p, x.id)).length; return Math.min(left, avail); }
function renderKid() {
  const p = P(), g = goalState(p), L = level(p.xp);
  const toNext = xpForLevel(L + 1) - p.xp, lvlPct = Math.round((p.xp - xpForLevel(L)) / (xpForLevel(L + 1) - xpForLevel(L)) * 100);
  const enDue = dueCount(p, 'en'), ruDue = dueCount(p, 'ru');
  const remainMin = Math.max(0, p.set.goalMin - g.min), remainSes = Math.max(0, p.set.goalSessions - g.ses);
  const hasSpace = ruDeck(p).some(x => x.t === 's');
  const tile = (id, em, title, sub, main) => `<button class="card tile ${main ? 'main' : ''}" data-go="${id}"><div class="em">${em}</div><div><b>${title}</b><span>${sub}</span></div></button>`;
  app.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" data-go="back" title="Назад">⬅️</button>
    <div class="title">${p.avatar} Привет, ${esc(p.name)}!</div><div class="spacer"></div>
    <span class="pill" title="Уровень">🏆 ${L}</span><span class="pill" title="Звёзды">⭐ ${p.xp}</span><span class="pill" title="Дней подряд">🔥 ${streak(p)}</span>
  </div>
  <div class="card goal">
    <div class="ring" style="--p:${g.pct}"><div>${g.done ? '✅' : g.pct + '%'}<small>цель дня</small></div></div>
    <div style="flex:1">
      <h3>${g.done ? 'Норма на сегодня выполнена! 🎉' : 'Цель на сегодня'}</h3>
      <div>⏱ Занимался(ась): <b><span id="liveTime">${g.min}</span> из ${p.set.goalMin} мин</b></div>
      <div>🏋️ Тренировок: <b>${g.ses} из ${p.set.goalSessions}</b></div>
      ${g.done ? '' : `<div class="small muted" style="margin-top:4px">Осталось: ${remainMin ? remainMin + ' мин' : ''}${remainMin && remainSes ? ' и ' : ''}${remainSes ? remainSes + ' ' + plural(remainSes, 'тренировка', 'тренировки', 'тренировок') : ''}</div>`}
      <div class="small muted" style="margin-top:8px">Уровень ${L}: ещё ${toNext} ⭐ до следующего</div>
      <div class="bar" style="height:8px"><i style="width:${lvlPct}%"></i></div>
    </div>
  </div>
  <div class="section-title">Главное — тренировка дня</div>
  <div class="menu">
    ${tile('trainEn', '💂', 'Английский: тренировка', `${enDue} на повтор · ${newLeft(p, 'en')} новых`, true)}
    ${tile('trainRu', '✍️', 'Русский: словарные слова', `${ruDue} на повтор · ${newLeft(p, 'ru')} новых`, true)}
  </div>
  <div class="section-title">Игры с английскими словами</div>
  <div class="menu">
    ${tile('gPairs', '🃏', 'Найди пары', 'Тренируем память на скорость')}
    ${tile('gBlitz', '⚡', 'Блиц 60 секунд', 'Верно или неверно?')}
    ${tile('gTiles', '🧩', 'Собери слово', 'Из букв — по-английски')}
    ${tile('gListen', '🎧', 'Слушай и выбирай', 'Тренируем слух')}
    ${tile('gWrite', '⌨️', 'Напиши перевод', 'С русского на английский')}
    ${tile('gMistakes', '🩹', 'Работа над ошибками', 'Слова, в которых ошибался')}
  </div>
  <div class="section-title">Игры по русскому</div>
  <div class="menu">
    ${tile('rGaps', '🔤', 'Вставь букву', 'Ловим трудные места')}
    ${tile('rChoice', '🕵️', 'Найди верное слово', 'Где написано правильно?')}
    ${tile('rPhoto', '📸', 'Фото-диктант', 'Запомни слово и напиши')}
    ${hasSpace ? tile('rSpace', '↔️', 'Слитно или раздельно', 'Наречия и предлоги') : ''}
    ${canSpeak('ru') ? tile('rDict', '🗣️', 'Диктант', 'Слушай и пиши') : ''}
  </div>
  <div class="section-title">Ещё</div>
  <div class="menu">
    ${tile('words', '📖', 'Мои слова', 'Все слова, уровни и мои подсказки')}
    ${tile('awards', '🏆', 'Награды', `${Object.keys(p.ach).length} из ${ACH.length} получено`)}
  </div>`;
  app.querySelectorAll('[data-go]').forEach(el => el.onclick = () => kidAction(el.dataset.go));
}
function kidAction(a) {
  const p = P();
  if (a === 'back') return go('home');
  if (a === 'words') return go('words', { wtab: cur.wtab || 'en' });
  if (a === 'awards') return go('awards');
  if (a === 'trainEn') return startSession(buildDaily(p, 'en'), { title: 'Тренировка: английский', subj: 'en', daily: true });
  if (a === 'trainRu') return startSession(buildDaily(p, 'ru'), { title: 'Тренировка: русский', subj: 'ru', daily: true });
  if (a === 'gPairs') return startPairs();
  if (a === 'gBlitz') return startBlitz();
  const learnedOrAll = (subj, n, filter) => {
    let pool = deckOf(p, subj).filter(x => !isNew(p, x.id) && (!filter || filter(x)));
    if (pool.length < n) pool = pool.concat(shuffle(deckOf(p, subj).filter(x => isNew(p, x.id) && (!filter || filter(x)))).slice(0, n - pool.length));
    return shuffle(pool).slice(0, n);
  };
  const game = (subj, type, title, n = 10, filter) => {
    const items = learnedOrAll(subj, n, filter);
    if (!items.length) return toast('Здесь пока нет слов 🙂');
    startSession(items.map(x => ({ type, id: x.id })), { title, subj, game: true });
  };
  if (a === 'gTiles') return game('en', 'tiles', 'Собери слово');
  if (a === 'gListen') return game('en', canSpeak('en') ? 'listen' : 'choiceEnRu', 'Слушай и выбирай');
  if (a === 'gWrite') return game('en', 'typeRuEn', 'Напиши перевод');
  if (a === 'gMistakes') {
    const items = [...deckOf(p, 'en'), ...deckOf(p, 'ru')].filter(x => p.cards[x.id] && p.cards[x.id].bad > 0)
      .sort((a, b) => (p.cards[b.id].bad / (p.cards[b.id].ok + 1)) - (p.cards[a.id].bad / (p.cards[a.id].ok + 1))).slice(0, 12);
    if (!items.length) return toast('Ошибок пока нет — так держать! 💪');
    return startSession(shuffle(items).map(x => ({ type: taskTypeFor(p, x), id: x.id })), { title: 'Работа над ошибками', subj: 'mix', game: true });
  }
  if (a === 'rGaps') return game('ru', 'ruGaps', 'Вставь букву', 10, x => x.t === 'l');
  if (a === 'rChoice') return game('ru', 'ruChoice', 'Найди верное слово', 10, x => x.t === 'l');
  if (a === 'rPhoto') return game('ru', 'ruPhoto', 'Фото-диктант', 8, x => x.t === 'l');
  if (a === 'rSpace') return game('ru', 'ruSpace', 'Слитно или раздельно', 10, x => x.t === 's');
  if (a === 'rDict') return game('ru', 'ruDict', 'Диктант', 8, x => x.t === 'l');
}

/* ---------- построение тренировки дня ---------- */
function taskTypeFor(p, item) {
  const c = p.cards[item.id] || { b: 0 };
  const b = c.b;
  if (item.w !== undefined) { // русский
    if (item.t === 's') return 'ruSpace';
    if (b <= 1) return 'ruChoice';
    if (b === 2) return 'ruGaps';
    if (b === 3) return 'ruPhoto';
    return canSpeak('ru') ? pick(['ruDict', 'ruGaps', 'ruPhoto']) : pick(['ruPhoto', 'ruGaps']);
  }
  if (b <= 1) return 'choiceEnRu';
  if (b === 2) return canSpeak('en') ? pick(['choiceRuEn', 'listen']) : 'choiceRuEn';
  if (b === 3) return 'tiles';
  if (b === 4) return 'typeRuEn';
  return canSpeak('en') ? pick(['typeRuEn', 'listenType', 'typeRuEn']) : 'typeRuEn';
}
function buildDaily(p, subj) {
  const t = today(), deck = deckOf(p, subj);
  const due = shuffle(deck.filter(x => { const c = p.cards[x.id]; return c && c.b > 0 && c.due <= t; }))
    .sort((a, b) => p.cards[a.id].b - p.cards[b.id].b).slice(0, 12);
  const news = deck.filter(x => isNew(p, x.id)).slice(0, Math.min(5, newLeft(p, subj)));
  const learnType = subj === 'en' ? 'learn' : (x => x.t === 's' ? 'ruLearnS' : 'ruLearn');
  const tasks = []; const reviews = due.map(x => ({ type: taskTypeFor(p, x), id: x.id }));
  for (let i = 0; i < news.length; i += 3) {
    const chunk = news.slice(i, i + 3);
    chunk.forEach(x => tasks.push({ type: typeof learnType === 'function' ? learnType(x) : learnType, id: x.id }));
    const checks = chunk.map(x => ({ type: subj === 'en' ? 'choiceEnRu' : (x.t === 's' ? 'ruSpace' : 'ruChoice'), id: x.id, check: true }));
    tasks.push(...shuffle(checks.concat(reviews.splice(0, 3))));
  }
  tasks.push(...reviews);
  // если повторять нечего — повторяем самые «слабые» слова, чтобы тренировка всё равно состоялась
  if (tasks.length < 8) {
    const inQ = new Set(tasks.map(x => x.id));
    const extra = deck.filter(x => !inQ.has(x.id) && p.cards[x.id] && p.cards[x.id].b > 0)
      .sort((a, b) => p.cards[a.id].b - p.cards[b.id].b || (p.cards[b.id].bad - p.cards[a.id].bad)).slice(0, 8 - tasks.length);
    tasks.push(...shuffle(extra).map(x => ({ type: taskTypeFor(p, x), id: x.id })));
  }
  if (tasks.length < 8) { // совсем новичок и лимит новых исчерпан — берём следующие слова
    const inQ = new Set(tasks.map(x => x.id));
    const more = deck.filter(x => !inQ.has(x.id)).slice(0, 8 - tasks.length);
    more.forEach(x => tasks.push({ type: subj === 'en' ? 'learn' : (x.t === 's' ? 'ruLearnS' : 'ruLearn'), id: x.id }));
  }
  return tasks;
}

/* ---------- движок сессии ---------- */
let sess = null;
function startSession(tasks, opts) {
  if (!tasks.length) return toast('Нет слов для тренировки — попроси родителей включить разделы');
  stopTimers();
  sess = { tasks, i: 0, ok: 0, bad: 0, answered: 0, xp: 0, retried: new Set(), wrongIds: new Set(), ...opts };
  cur.screen = 'session'; cur.active = true;
  renderTask();
}
function sessHeader() {
  const total = sess.tasks.length;
  return `<div class="progress"><button class="icon-btn" id="quit" title="Выйти">✖️</button>
    <div class="bar"><i style="width:${Math.round(sess.i / total * 100)}%"></i></div>
    <span class="pill">✅ ${sess.ok}</span></div>`;
}
function bindQuit() {
  document.getElementById('quit').onclick = () => {
    if (sess.answered >= 6 && !sess.game && !confirm('Выйти? Тренировка засчитается, если ответить хотя бы на 6 заданий — у тебя уже ' + sess.answered + '. Выйти?')) return;
    if (sess.answered < 6 && sess.answered > 0 && !confirm('Выйти? Тренировка ещё не засчитана (нужно хотя бы 6 ответов).')) return;
    finishSession(true);
  };
}
function nextTask() { sess.i++; if (sess.i >= sess.tasks.length) finishSession(); else renderTask(); }

function grade(id, correct, opts = {}) {
  const p = P(), c = touch(card(p, id)), d = dayRec(p);
  sess.answered++;
  if (correct) {
    sess.ok++; d.ok++; c.ok++;
    const firstTry = !sess.retried.has(id);
    const gain = opts.hint ? 2 : (firstTry ? 10 : 4);
    p.xp += gain; sess.xp += gain;
    if (opts.hint) { c.due = addDays(today(), 1); }
    else if (firstTry) { c.b = Math.min(MAX_BOX, Math.max(1, c.b + 1)); c.due = addDays(today(), INTERVALS[c.b]); }
    else { c.b = Math.max(1, c.b); c.due = addDays(today(), 1); }
    c.last = today();
  } else {
    sess.bad++; d.bad++; c.bad++;
    d.errs[id] = (d.errs[id] || 0) + 1;
    c.b = Math.max(1, c.b - 2); c.due = today();
    sess.wrongIds.add(id);
    p.xp += 1; sess.xp += 1;
    // повтор до верного ответа: вернуть слово через 3 задания в более лёгком виде
    if (!sess.retried.has(id) || (sess.tasks.filter(t => t.id === id).length < 3)) {
      sess.retried.add(id);
      const item = ITEM[id];
      const easier = item.w !== undefined ? (item.t === 's' ? 'ruSpace' : 'ruChoice') : 'choiceEnRu';
      const pos = Math.min(sess.tasks.length, sess.i + 3);
      sess.tasks.splice(pos, 0, { type: opts.retryType || easier, id, retry: true });
    }
  }
  saveSoon();
}

function finishSession(quit) {
  const p = P(), d = dayRec(p);
  cur.active = false;
  const counted = sess.answered >= 6;
  if (counted) { d.ses++; if (sess.game) d.games++; }
  const total = sess.ok + sess.bad;
  const acc = total ? Math.round(sess.ok / total * 100) : 0;
  const perfect = counted && sess.bad === 0 && sess.answered >= 8;
  if (perfect) { p.xp += 20; sess.xp += 20; }
  save(); checkGoal(); checkAch({ perfect });
  if (quit && !counted) return go('kid');
  const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
  const g = goalState(p);
  const wrong = [...sess.wrongIds].map(id => ITEM[id]);
  app.innerHTML = `<div class="ex center">
    <div class="card pop" style="padding:28px">
      <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <h1>${stars === 3 ? 'Великолепно!' : stars === 2 ? 'Отлично!' : stars === 1 ? 'Хорошая работа!' : 'Ты молодец, что тренируешься!'}</h1>
      <p>Правильных ответов: <b>${sess.ok}</b> из <b>${total}</b> (${acc}%)<br>Получено: <b>+${sess.xp} ⭐</b>${perfect ? ' (бонус за тренировку без ошибок!)' : ''}</p>
      ${counted ? `<p class="status-ok">Тренировка засчитана ✅</p>` : `<p class="muted">Тренировка не засчитана — нужно хотя бы 6 ответов</p>`}
      <p>Сегодня: ${g.min} из ${p.set.goalMin} мин · ${g.ses} из ${p.set.goalSessions} трен. ${g.done ? '— норма выполнена! 🎉' : ''}</p>
      ${wrong.length ? `<div class="mnemo"><b>Повтори эти слова:</b><br>${wrong.map(x => x.w !== undefined ? ruHighlight(x) : `<b>${esc(x.en)}</b> — ${esc(x.ru)}`).join('<br>')}</div>` : ''}
      <div class="row" style="justify-content:center;margin-top:18px">
        ${sess.daily ? `<button class="btn" id="again">🔁 Ещё тренировка</button>` : ''}
        <button class="btn ghost" id="home">🏠 В меню</button>
      </div>
    </div></div>`;
  if (stars >= 2) confetti(stars * 12);
  document.getElementById('home').onclick = () => go('kid');
  const ag = document.getElementById('again');
  if (ag) ag.onclick = () => startSession(buildDaily(p, sess.subj), { title: sess.title, subj: sess.subj, daily: true });
}

/* ---------- отрисовка заданий ---------- */
function renderTask() {
  const t = sess.tasks[sess.i], item = ITEM[t.id];
  let type = t.type;
  if ((type === 'listen' || type === 'listenType') && !canSpeak('en')) type = type === 'listen' ? 'choiceEnRu' : 'typeRuEn';
  if (type === 'ruDict' && !canSpeak('ru')) type = 'ruPhoto';
  const R = {
    learn: tLearn, choiceEnRu: tChoice, choiceRuEn: tChoice, listen: tChoice, tiles: tTiles, typeRuEn: tType, listenType: tType,
    ruLearn: tRuLearn, ruLearnS: tRuLearn, ruChoice: tRuChoice, ruSpace: tRuChoice, ruGaps: tRuGaps, ruPhoto: tRuPhoto, ruDict: tRuPhoto
  }[type];
  R(item, type, t);
}
function feedback(correct, html, onNext, autoMs) {
  const box = document.getElementById('fb');
  box.className = 'feedback pop ' + (correct ? 'good' : 'badf');
  box.innerHTML = `<div style="flex:1">${html}</div><button class="btn ${correct ? 'ok' : ''}" id="nextBtn">Дальше ➜</button>`;
  beep(correct);
  const nb = document.getElementById('nextBtn');
  const my = gen;
  let done = false; const next = () => { if (done) return; done = true; document.removeEventListener('keydown', kh); if (gen !== my || cur.screen !== 'session') return; onNext(); };
  const kh = e => { if (e.key === 'Enter') { e.preventDefault(); next(); } };
  nb.onclick = next; setTimeout(() => document.addEventListener('keydown', kh), 150);
  nb.focus({ preventScroll: true });
  if (autoMs) setTimeout(next, autoMs);
}
const praise = () => pick(['Верно! 🎉', 'Молодец! ⭐', 'Супер! 🚀', 'Точно! ✅', 'Так держать! 💪', 'Отлично! 🌟']);
function mnemoBlock(item) { const c = P().cards[item.id]; return c && c.mn ? `<div class="mnemo">💡 <b>Моя подсказка:</b> ${esc(c.mn)}</div>` : ''; }

/* знакомство с английским словом */
function tLearn(item) {
  const c = card(P(), item.id);
  app.innerHTML = `<div class="ex">${sessHeader()}
   <div class="card prompt pop">
     <div class="q">Новое слово — посмотри, послушай, повтори вслух</div>
     <div class="emoji">${item.e || '📘'}</div>
     <div class="word">${esc(item.en)}</div>
     ${item.tr ? `<div class="tr">[${esc(item.tr)}]</div>` : ''}
     <div style="font-size:1.4rem;margin-top:10px">${esc(item.ru)}</div>
     <div class="row" style="justify-content:center;margin-top:14px">
       <button class="btn ghost" id="say">🔊 Послушать</button>
       ${SR ? `<button class="btn ghost" id="rec">🎤 Скажи сам(а)</button>` : ''}
     </div>
     <div id="recRes" class="small" style="margin-top:6px"></div>
     <div class="mnemo"><b>💡 Придумай ассоциацию</b> <span class="small muted">(картинку, похожее русское слово, смешную историю — так запоминается в 2 раза лучше)</span>
       <textarea class="mn" id="mn" placeholder="Например: «cousin» — «кузен», двоюродный брат">${esc(c.mn || '')}</textarea></div>
     <button class="btn big" style="margin-top:14px" id="got">Запомнил(а)! ➜</button>
   </div><div id="fb"></div></div>`;
  bindQuit();
  setTimeout(() => speak(item.en), 300);
  document.getElementById('say').onclick = () => speak(item.en);
  const rec = document.getElementById('rec');
  if (rec) rec.onclick = () => listenSpeech(item.en, document.getElementById('recRes'));
  document.getElementById('got').onclick = () => {
    const mn = document.getElementById('mn').value.trim(); if (mn) c.mn = mn; else delete c.mn;
    touch(c); if (c.b === 0) { c.b = 1; c.due = today(); dayRec(P()).nw++; }
    P().xp += 3; sess.xp += 3; saveSoon(); nextTask();
  };
}
function listenSpeech(target, out) {
  const onAlts = raw => {
    const alts = raw.map(normEn);
    const okk = alts.some(a => a === normEn(target) || lev(a, normEn(target)) <= 1);
    out.innerHTML = okk ? '<span class="status-ok">Отличное произношение! 👏</span>' : raw.length ? `Услышал: «${esc(raw[0])}». Попробуй ещё раз 🙂` : 'Не расслышал, попробуй ещё раз 🙂';
    if (okk) { P().xp += 2; saveSoon(); }
  };
  if (SR === 'android') { out.textContent = '🎙 Говори...'; window.onSpeechResult = onAlts; try { AB.listen('en-GB'); } catch (e) { out.textContent = 'Микрофон недоступен 🙁'; } return; }
  try {
    const r = new SR(); r.lang = 'en-GB'; r.maxAlternatives = 5;
    out.textContent = '🎙 Говори...';
    r.onresult = e => onAlts([...e.results[0]].map(a => a.transcript));
    r.onerror = () => out.textContent = 'Микрофон недоступен 🙁';
    r.start();
  } catch (e) { out.textContent = 'Распознавание речи недоступно'; }
}

/* выбор перевода */
function distractors(item, field, n = 3) {
  const p = P(), pool = item.w !== undefined ? [] : (p.grade === 4 ? EN4 : EN7);
  const same = shuffle(pool.filter(x => x.u === item.u && x.id !== item.id)), other = shuffle(pool.filter(x => x.u !== item.u));
  const out = [], seen = new Set([item[field].toLowerCase()]);
  for (const x of same.concat(other)) { const v = x[field]; if (!seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(x); } if (out.length >= n) break; }
  return out;
}
function tChoice(item, type) {
  const toRu = type !== 'choiceRuEn';
  const field = toRu ? 'ru' : 'en';
  const opts = shuffle([item, ...distractors(item, field)]);
  const q = type === 'listen' ? `<div class="q">Послушай и выбери перевод</div><button class="btn" id="say" style="font-size:2rem;padding:18px 28px">🔊</button>`
    : toRu ? `<div class="q">Как переводится?</div><div class="emoji">${item.e || ''}</div><div class="word">${esc(item.en)}</div><button class="btn ghost small" id="say">🔊</button>`
      : `<div class="q">Как сказать по-английски?</div><div class="emoji">${item.e || ''}</div><div class="word">${esc(item.ru)}</div>`;
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">${q}
     <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o[field])}</button>`).join('')}</div>
     </div><div id="fb"></div></div>`;
  bindQuit();
  const sayB = document.getElementById('say'); if (sayB) sayB.onclick = () => speak(item.en);
  if (type === 'listen' || (toRu && P().grade === 4)) setTimeout(() => speak(item.en), 250);
  let answered = false;
  const choose = i => {
    if (answered) return; answered = true;
    const o = opts[i], ok = o.id === item.id;
    const btns = app.querySelectorAll('.opt');
    btns.forEach((b, j) => { if (opts[j].id === item.id) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
    grade(item.id, ok);
    if (!toRu) speak(item.en);
    feedback(ok, ok ? `<div class="big">${praise()}</div><div>${esc(item.en)} — ${esc(item.ru)}</div>` :
      `<div class="big">Почти!</div><div>Правильно: <b>${esc(item.en)}</b> — ${esc(item.ru)}</div>${mnemoBlock(item)}`, nextTask, ok ? 1300 : 0);
  };
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
  keyChoice(opts.length, choose);
}
function keyChoice(n, fn) {
  const h = e => { const k = +e.key; if (k >= 1 && k <= n) { document.removeEventListener('keydown', h); fn(k - 1); } };
  document.addEventListener('keydown', h);
  const prev = sess.tasks[sess.i]; const iv = setInterval(() => { if (!sess || sess.tasks[sess.i] !== prev || cur.screen !== 'session') { document.removeEventListener('keydown', h); clearInterval(iv); } }, 300);
}

/* собери слово из букв */
function tTiles(item) {
  const phrase = item.en.includes(' ');
  const parts = phrase ? item.en.split(' ') : item.en.split('');
  const order = shuffle(parts.map((t, i) => ({ t, i })));
  let picked = [];
  const draw = () => {
    app.querySelector('#slots').innerHTML = picked.map((k, j) => `<button class="tl" data-j="${j}">${esc(order[k].t)}</button>`).join('') || '<span class="muted">нажимай на ' + (phrase ? 'слова' : 'буквы') + ' по порядку</span>';
    app.querySelector('#pool').innerHTML = order.map((o, k) => `<button class="tl ${picked.includes(k) ? 'used' : ''}" data-k="${k}">${esc(o.t)}</button>`).join('');
    app.querySelectorAll('#pool .tl').forEach(b => b.onclick = () => { const k = +b.dataset.k; if (picked.includes(k)) return; picked.push(k); draw(); if (picked.length === order.length) check(); });
    app.querySelectorAll('#slots .tl').forEach(b => b.onclick = () => { picked.splice(+b.dataset.j, 1); draw(); });
  };
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">
     <div class="q">Собери по-английски</div><div class="emoji">${item.e || ''}</div><div class="word">${esc(item.ru)}</div>
     <div class="tiles slots" id="slots"></div><div class="tiles" id="pool"></div>
     <div class="row" style="justify-content:center"><button class="btn ghost small" id="hint">💡 Подсказка</button><button class="btn ghost small" id="clr">⌫ Стереть</button></div>
     </div><div id="fb"></div></div>`;
  bindQuit(); draw();
  let hint = false;
  document.getElementById('clr').onclick = () => { picked = []; draw(); };
  document.getElementById('hint').onclick = () => {
    hint = true; // ставим следующую правильную деталь
    const need = picked.length; const k = order.findIndex((o, idx) => !picked.includes(idx) && o.t === parts[need]);
    picked = picked.filter((pk, j) => order[pk].t === parts[j]).slice(0, need);
    if (k >= 0 && picked.length === need) picked.push(k);
    draw(); if (picked.length === order.length) check();
  };
  let done = false;
  function check() {
    if (done) return; done = true;
    const ans = picked.map(k => order[k].t).join(phrase ? ' ' : '');
    const ok = ans === item.en;
    grade(item.id, ok, { hint });
    speak(item.en);
    feedback(ok, ok ? `<div class="big">${praise()}</div><div>${esc(item.en)} [${esc(item.tr)}]</div>` : `<div class="big">Не совсем</div><div>Правильно: <b>${esc(item.en)}</b></div>${mnemoBlock(item)}`, nextTask, ok ? 1400 : 0);
  }
}

/* напиши перевод */
function normEn(s) { return s.toLowerCase().replace(/[’`]/g, "'").replace(/[.!?,;:"]/g, '').replace(/\s+/g, ' ').trim(); }
const stripSoft = s => s.replace(/\b(my|a|an|the|to|somebody|someone|something)\b/g, '').replace(/\s+/g, ' ').trim();
function checkEn(input, target) {
  const a = normEn(input), b = normEn(target);
  if (!a) return 0;
  if (a === b || stripSoft(a) === stripSoft(b)) return 2;
  if (b.length >= 5 && lev(a, b) <= 1) return 1; // опечатка
  return 0;
}
function tType(item, type) {
  const listen = type === 'listenType';
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">
    ${listen ? `<div class="q">Послушай и напиши слово по-английски</div><button class="btn" id="say" style="font-size:2rem;padding:18px 28px">🔊</button>`
      : `<div class="q">Напиши по-английски</div><div class="emoji">${item.e || ''}</div><div class="word">${esc(item.ru)}</div>`}
    <div style="margin-top:16px"><input class="answer-input" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="пиши здесь…"></div>
    <div id="hintBox" class="small muted" style="margin-top:8px;min-height:1.2em"></div>
    <div class="row" style="justify-content:center;margin-top:10px">
      <button class="btn ghost small" id="hint">💡 Подсказка</button><button class="btn" id="chk">Проверить ✓</button>
    </div></div><div id="fb"></div></div>`;
  bindQuit();
  const inp = document.getElementById('inp'); inp.focus();
  const sayB = document.getElementById('say');
  if (sayB) { sayB.onclick = () => speak(item.en); setTimeout(() => speak(item.en), 250); }
  let hint = 0;
  document.getElementById('hint').onclick = () => {
    hint++;
    const c = P().cards[item.id];
    const mask = item.en.split('').map((ch, i) => ch === ' ' ? '  ' : (i < hint ? ch : '_')).join(' ');
    document.getElementById('hintBox').innerHTML = `${esc(mask)}${listen ? ' — ' + esc(item.ru) : ''}${c && c.mn ? '<br>💡 ' + esc(c.mn) : ''}`;
    inp.focus();
  };
  let done = false;
  const check = () => {
    if (done) return; if (!inp.value.trim()) { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); return; }
    done = true; inp.disabled = true;
    const r = checkEn(inp.value, item.en), ok = r > 0;
    grade(item.id, ok, { hint: hint > 0, retryType: 'tiles' });
    speak(item.en);
    feedback(ok, ok ? `<div class="big">${praise()}</div><div>${r === 1 ? `Небольшая опечатка — правильно: <b>${esc(item.en)}</b>` : esc(item.en) + ' — ' + esc(item.ru)}</div>`
      : `<div class="big">Ошибка</div><div>Ты написал(а): <s>${esc(inp.value)}</s><br>Правильно: <b>${esc(item.en)}</b> [${esc(item.tr)}] — ${esc(item.ru)}</div>${mnemoBlock(item)}`, nextTask, ok && r === 2 ? 1300 : 0);
  };
  document.getElementById('chk').onclick = check;
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } };
}

/* ---------- русский язык ---------- */
function tRuLearn(item, type) {
  const isS = item.t === 's';
  const word = ruWordOf(item);
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">
    <div class="q">Новое словарное слово — запомни, как оно пишется</div>
    <div class="ruword" style="margin:18px 0">${isS ? `<span class="hl">${esc(word)}</span>` : ruHighlight(item)}</div>
    <div class="muted">${isS ? 'Запомни: пишется ' + (word.includes(' ') ? '<b>раздельно</b>' : word.includes('-') ? '<b>через дефис</b>' : '<b>слитно</b>') : 'Трудные буквы выделены. Произнеси слово по слогам так, как оно пишется (орфографическое проговаривание).'}</div>
    ${!isS ? `<div class="muted small" style="margin-top:8px">По слогам: <b>${esc(syllables(word))}</b></div>` : ''}
    <div class="row" style="justify-content:center;margin-top:12px">${canSpeak('ru') ? '<button class="btn ghost" id="say">🔊 Послушать</button>' : ''}</div>
    <div class="mnemo"><b>💡 Придумай подсказку</b> <span class="small muted">(например: «кАрандаш — кАрта», «вОрОна — вОрОтник»)</span>
    <textarea class="mn" id="mn">${esc((P().cards[item.id] || {}).mn || '')}</textarea></div>
    <button class="btn big" style="margin-top:14px" id="got">Запомнил(а)! ➜</button>
  </div><div id="fb"></div></div>`;
  bindQuit();
  const sb = document.getElementById('say'); if (sb) sb.onclick = () => speak(word, 'ru');
  document.getElementById('got').onclick = () => {
    const c = card(P(), item.id); const mn = document.getElementById('mn').value.trim(); if (mn) c.mn = mn; else delete c.mn;
    touch(c); if (c.b === 0) { c.b = 1; c.due = today(); dayRec(P()).nw++; }
    P().xp += 3; sess.xp += 3; saveSoon(); nextTask();
  };
}
function syllables(w) { // простое деление на слоги для проговаривания
  const V = 'аеёиоуыэюя';
  return w.split(' ').map(word => {
    const lw = word.toLowerCase();
    const vi = [...lw].map((c, i) => V.includes(c) ? i : -1).filter(i => i >= 0);
    if (vi.length < 2) return word;
    const cuts = [];
    for (let k = 0; k < vi.length - 1; k++) {
      const a = vi[k], b = vi[k + 1], cl = lw.slice(a + 1, b);
      let cut = a + 1; // по умолчанию — открытый слог (ма-ли-на)
      if (cl.length >= 2) {
        if (cl[0] === 'й') cut = a + 2;                                   // май-ка
        else if ('ьъ'.includes(cl[1])) cut = a + 3;                       // тель-ный
        else if (cl[0] === cl[1]) cut = a + 2;                            // ван-на, клас-сик
        else if ('лмнр'.includes(cl[0])) cut = a + 2;                     // кар-та, пор-тфель
      } else if (cl === 'й' || cl === 'ь' || cl === 'ъ') cut = a + 2;
      if (cl.length >= 1 && 'ьъ'.includes(cl[cl.length - 1]) && cut <= b - 1 && cl.length === 2 && 'ьъ'.includes(cl[1])) cut = a + 3;
      cuts.push(Math.min(cut, b));
    }
    let out = '', prev = 0;
    cuts.forEach(c => { out += word.slice(prev, c) + '-'; prev = c; });
    return out + word.slice(prev);
  }).join(' ');
}
function tRuChoice(item, type) {
  const isS = item.t === 's';
  let correct, variants;
  if (isS) ({ correct, variants } = spaceVariants(item));
  else { correct = ruParse(item).word; variants = shuffle([correct, ...ruWrongVariants(item, 2)]); }
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">
    <div class="q">${isS ? 'Как правильно пишется?' : 'Где слово написано без ошибки?'}</div>
    <div class="opts" style="grid-template-columns:1fr">${variants.map((v, i) => `<button class="opt" style="font-size:1.4rem" data-i="${i}">${esc(v)}</button>`).join('')}</div>
    </div><div id="fb"></div></div>`;
  bindQuit();
  let answered = false;
  const choose = i => {
    if (answered) return; answered = true;
    const ok = variants[i] === correct;
    app.querySelectorAll('.opt').forEach((b, j) => { if (variants[j] === correct) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
    grade(item.id, ok);
    feedback(ok, ok ? `<div class="big">${praise()}</div>` : `<div class="big">Запомни!</div><div class="ruword" style="font-size:1.6rem">${isS ? esc(correct) : ruHighlight(item)}</div>${mnemoBlock(item)}`, nextTask, ok ? 1100 : 0);
  };
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
  keyChoice(variants.length, choose);
}
function tRuGaps(item) {
  const pr = ruParse(item); const gaps = pr.segs.filter(s => s.gap);
  const optsPer = gaps.map(g => shuffle(g.opts));
  const ans = []; let curG = 0, wrongAny = false;
  const draw = () => {
    let k = 0, first = true;
    const html = pr.segs.map(s => {
      let t;
      if (s.gap) { const idx = k++; t = idx < ans.length ? (ans[idx] || '·') : (idx === curG ? '?' : '_'); if (first && pr.cap && idx < ans.length) t = t.toUpperCase(); first = false; const bad = idx < ans.length && ans[idx] !== gaps[idx].ans; return `<span class="gap ${idx === curG ? 'cur' : ''}" ${bad ? 'style="color:var(--bad);border-color:var(--bad)"' : ''}>${esc(t)}</span>`; }
      t = s.t; if (first && pr.cap) t = t.toUpperCase(); first = false; return esc(t);
    }).join('');
    app.querySelector('#rw').innerHTML = html;
    app.querySelector('#gopts').innerHTML = curG < gaps.length ? optsPer[curG].map((o, i) => `<button class="opt" style="font-size:1.6rem;min-width:90px" data-i="${i}">${o === '' ? '—' : esc(o)}</button>`).join('') : '';
    app.querySelectorAll('#gopts .opt').forEach(b => b.onclick = () => choose(+b.dataset.i));
  };
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">
    <div class="q">Вставь пропущенную букву</div><div class="ruword" id="rw" style="margin:18px 0"></div>
    <div class="row" id="gopts" style="justify-content:center"></div>${gaps.some(g => g.opts.includes('')) ? '<div class="small muted" style="margin-top:8px">«—» значит «здесь буква не нужна»</div>' : ''}
    </div><div id="fb"></div></div>`;
  bindQuit(); draw();
  function choose(i) {
    const v = optsPer[curG][i];
    if (v !== gaps[curG].ans) { wrongAny = true; }
    ans.push(v); curG++; draw();
    if (curG >= gaps.length) {
      const ok = !wrongAny;
      grade(item.id, ok);
      if (canSpeak('ru')) speak(pr.word, 'ru');
      feedback(ok, ok ? `<div class="big">${praise()}</div><div class="ruword" style="font-size:1.5rem">${ruHighlight(item)}</div>` :
        `<div class="big">Есть ошибка</div><div>Правильно: <span class="ruword" style="font-size:1.6rem">${ruHighlight(item)}</span></div>${mnemoBlock(item)}`, nextTask, ok ? 1300 : 0);
    }
  }
}
function tRuPhoto(item, type) {
  const word = ruParse(item).word;
  const dict = type === 'ruDict';
  const showMs = Math.max(2500, word.length * 260);
  app.innerHTML = `<div class="ex">${sessHeader()}<div class="card prompt pop">
    <div class="q">${dict ? 'Послушай и напиши слово' : 'Сфотографируй слово глазами — потом оно исчезнет!'}</div>
    <div class="ruword" id="rw" style="margin:18px 0;min-height:1.3em">${dict ? '<button class="btn" id="say" style="font-size:2rem;padding:16px 26px">🔊</button>' : ruHighlight(item)}</div>
    <div id="wr" ${dict ? '' : 'hidden'}><input class="answer-input" id="inp" autocomplete="off" spellcheck="false" placeholder="напиши слово">
    <div class="row" style="justify-content:center;margin-top:10px"><button class="btn" id="chk">Проверить ✓</button></div></div>
    </div><div id="fb"></div></div>`;
  bindQuit();
  const inp = document.getElementById('inp');
  if (dict) { const sb = document.getElementById('say'); sb.onclick = () => speak(word, 'ru'); setTimeout(() => speak(word, 'ru'), 300); inp.focus(); }
  else {
    const myT = sess.i, myG = gen;
    const t = setTimeout(() => { if (gen !== myG || sess.i !== myT || !document.getElementById('rw')) return; document.getElementById('rw').innerHTML = '<span class="muted">🙈 Теперь напиши по памяти</span>'; document.getElementById('wr').hidden = false; inp.focus(); }, showMs);
    timers.push(t);
  }
  let done = false;
  const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const check = () => {
    if (done || !inp.value.trim()) return; done = true; inp.disabled = true;
    const ok = norm(inp.value) === norm(word);
    grade(item.id, ok, { retryType: 'ruGaps' });
    feedback(ok, ok ? `<div class="big">${praise()}</div><div class="ruword" style="font-size:1.5rem">${ruHighlight(item)}</div>` :
      `<div class="big">Ошибка</div><div>Ты написал(а): <s>${esc(inp.value)}</s><br>Правильно: <span class="ruword" style="font-size:1.6rem">${ruHighlight(item)}</span></div>${mnemoBlock(item)}`, nextTask, ok ? 1300 : 0);
  };
  document.getElementById('chk').onclick = check;
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } };
}

/* ---------- игра «Найди пары» ---------- */
function startPairs() {
  const p = P();
  let pool = enDeck(p).filter(x => !isNew(p, x.id));
  if (pool.length < 6) pool = pool.concat(enDeck(p).filter(x => isNew(p, x.id)).slice(0, 6 - pool.length));
  const items = shuffle(pool).slice(0, 6);
  const cards = shuffle(items.flatMap(x => [{ id: x.id, side: 'en', t: x.en }, { id: x.id, side: 'ru', t: x.ru }]));
  stopTimers(); const my = gen;
  cur.screen = 'game'; cur.active = true;
  let open = [], done = new Set(), moves = 0, errors = 0; const t0 = Date.now(); let lock = false;
  const draw = () => {
    app.innerHTML = `<div class="ex"><div class="progress"><button class="icon-btn" id="q">✖️</button><div class="title" style="flex:1;font-weight:700">🃏 Найди пары: слово + перевод</div>
      <span class="pill">⏱ <span id="tm">0</span> с</span><span class="pill">Ходы: ${moves}</span></div>
      <div class="pairs">${cards.map((c, i) => `<button class="pc ${done.has(c.id) ? 'done' : open.includes(i) ? 'open' : ''}" data-i="${i}">${done.has(c.id) || open.includes(i) ? esc(c.t) : '?'}</button>`).join('')}</div></div>`;
    document.getElementById('q').onclick = () => go('kid');
    app.querySelectorAll('.pc').forEach(b => b.onclick = () => flip(+b.dataset.i));
    document.getElementById('tm').textContent = Math.round((Date.now() - t0) / 1000);
  };
  timers.push(setInterval(() => { const e = document.getElementById('tm'); if (e) e.textContent = Math.round((Date.now() - t0) / 1000); }, 1000));
  function flip(i) {
    if (lock || open.includes(i) || done.has(cards[i].id)) return;
    open.push(i); if (cards[i].side === 'en') speak(cards[i].t);
    if (open.length === 2) {
      moves++;
      const [a, b] = open.map(k => cards[k]);
      if (a.id === b.id) { done.add(a.id); open = []; beep(true); const d = dayRec(p); d.ok++; p.xp += 3; touch(card(p, a.id)).ok++; }
      else { errors++; lock = true; beep(false); setTimeout(() => { if (gen !== my) return; open = []; lock = false; draw(); }, 900); }
    }
    draw();
    if (done.size === items.length) {
      const sec = Math.round((Date.now() - t0) / 1000);
      const d = dayRec(p); d.ses++; d.games++; p.xp += 15; save(); checkGoal(); checkAch({ pairsFast: sec < 60 });
      stopTimers(); cur.active = false; const my2 = gen;
      setTimeout(() => {
        if (gen !== my2) return;
        app.innerHTML = `<div class="ex center"><div class="card pop" style="padding:28px"><div class="stars">🃏</div><h1>Все пары найдены!</h1>
         <p>Время: <b>${sec} с</b> · ходов: <b>${moves}</b> · промахов: ${errors}<br>+${15 + items.length * 3} ⭐ · игра засчитана как тренировка ✅</p>
         <div class="row" style="justify-content:center"><button class="btn" id="again">🔁 Ещё раз</button><button class="btn ghost" id="home">🏠 В меню</button></div></div></div>`;
        confetti(25);
        document.getElementById('again').onclick = startPairs; document.getElementById('home').onclick = () => go('kid');
      }, 500);
    }
  }
  draw();
}

/* ---------- игра «Блиц» ---------- */
function startBlitz() {
  const p = P();
  let pool = enDeck(p).filter(x => !isNew(p, x.id));
  if (pool.length < 8) pool = pool.concat(enDeck(p).filter(x => isNew(p, x.id)).slice(0, 12));
  stopTimers();
  cur.screen = 'game'; cur.active = true;
  let left = 60, score = 0, total = 0, q = null; const wrong = [];
  const newQ = () => {
    const item = pick(pool), truth = Math.random() < .5;
    const other = truth ? item : (distractors(item, 'ru', 1)[0] || item);
    q = { item, shown: other.ru, truth: other.id === item.id };
    document.getElementById('bq').innerHTML = `${esc(item.en)}<div style="font-size:1.1rem;color:var(--muted);margin:6px 0">=</div>${esc(q.shown)}`;
  };
  app.innerHTML = `<div class="ex"><div class="progress"><button class="icon-btn" id="q">✖️</button><div class="title" style="flex:1;font-weight:700">⚡ Блиц: верно или неверно?</div>
    <span class="pill timer">⏱ <span id="tl">60</span></span><span class="pill">Очки: <b id="sc">0</b></span></div>
    <div class="card prompt"><div class="blitz-q" id="bq"></div>
    <div class="opts"><button class="btn ok big" id="yes">✓ Верно <span class="small">(←)</span></button><button class="btn bad big" id="no">✗ Неверно <span class="small">(→)</span></button></div></div></div>`;
  document.getElementById('q').onclick = () => { document.removeEventListener('keydown', kh); go('kid'); };
  const answer = v => {
    if (left <= 0) return; total++;
    const ok = v === q.truth;
    if (ok) { score++; dayRec(p).ok++; } else { dayRec(p).bad++; wrong.push(q.item); touch(card(p, q.item.id)).bad++; }
    beep(ok); document.getElementById('sc').textContent = score;
    const card_ = app.querySelector('.prompt'); card_.classList.remove('pop', 'shake'); void card_.offsetWidth; card_.classList.add(ok ? 'pop' : 'shake');
    newQ();
  };
  const myB = gen;
  const kh = e => { if (gen !== myB) { document.removeEventListener('keydown', kh); return; } if (e.key === 'ArrowLeft') answer(true); if (e.key === 'ArrowRight') answer(false); };
  document.addEventListener('keydown', kh);
  document.getElementById('yes').onclick = () => answer(true);
  document.getElementById('no').onclick = () => answer(false);
  newQ();
  timers.push(setInterval(() => {
    left--; const e = document.getElementById('tl'); if (e) e.textContent = left;
    if (left <= 0) {
      stopTimers(); document.removeEventListener('keydown', kh); cur.active = false;
      const d = dayRec(p); if (total >= 6) { d.ses++; d.games++; } p.xp += score * 2; save(); checkGoal(); checkAch({ blitz: score });
      const best = Math.max(score, p.bestBlitz || 0), rec = score > (p.bestBlitz || 0); p.bestBlitz = best; save();
      app.innerHTML = `<div class="ex center"><div class="card pop" style="padding:28px"><div class="stars">⚡</div><h1>${score} ${plural(score, 'очко', 'очка', 'очков')}!</h1>
        <p>${rec ? '🏆 Новый рекорд!' : 'Рекорд: ' + best} · ответов: ${total}<br>+${score * 2} ⭐ ${total >= 6 ? '· засчитано как тренировка ✅' : ''}</p>
        ${wrong.length ? `<div class="mnemo"><b>Запомни:</b><br>${[...new Set(wrong)].map(x => `<b>${esc(x.en)}</b> — ${esc(x.ru)}`).join('<br>')}</div>` : ''}
        <div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="again">🔁 Ещё раз</button><button class="btn ghost" id="home">🏠 В меню</button></div></div></div>`;
      if (rec) confetti(30);
      document.getElementById('again').onclick = startBlitz; document.getElementById('home').onclick = () => go('kid');
    }
  }, 1000));
}

/* ---------- мои слова ---------- */
function lvlStars(c) { const b = c ? c.b : 0; if (!b) return '<span class="muted">новое</span>'; return '🟢'.repeat(Math.min(5, b)) + (b >= LEARNED_BOX ? ' ✔' : ''); }
function renderWords() {
  const p = P(), tab = cur.wtab || 'en';
  const groups = {};
  if (tab === 'en') enDeck(p).forEach(x => (groups[x.u] = groups[x.u] || []).push(x));
  else ruDeck(p).forEach(x => { const k = x.g + ' класс' + (x.t === 's' ? ' — слитно/раздельно' : ''); (groups[k] = groups[k] || []).push(x); });
  const L = Object.values(groups).flat();
  const learned = L.filter(x => (p.cards[x.id] || {}).b >= LEARNED_BOX).length;
  app.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">⬅️</button><div class="title">📖 Мои слова</div><div class="spacer"></div>
    <button class="btn small ${tab === 'en' ? '' : 'ghost'}" data-t="en">💂 Английский</button><button class="btn small ${tab === 'ru' ? '' : 'ghost'}" data-t="ru">✍️ Русский</button></div>
    <div class="card"><b>Выучено: ${learned} из ${L.length}</b><div class="bar okc" style="margin-top:8px"><i style="width:${L.length ? learned / L.length * 100 : 0}%"></i></div>
    <div class="small muted" style="margin-top:6px">🟢 — уровень запоминания (слово выучено на 5 уровне). Нажми ✏️, чтобы записать свою подсказку-ассоциацию.</div></div>
    ${Object.entries(groups).map(([g, items], gi) => {
    const gl = items.filter(x => (p.cards[x.id] || {}).b >= LEARNED_BOX).length;
    return `<details class="unit" ${gi === 0 ? 'open' : ''}><summary>${esc(g)} <span class="muted small">— ${gl}/${items.length}</span></summary><table class="wl">${items.map(x => {
      const c = p.cards[x.id];
      return tab === 'en' ? `<tr><td style="width:36px">${x.e || ''}</td><td><b>${esc(x.en)}</b><div class="small muted">${x.tr ? '[' + esc(x.tr) + ']' : ''}</div></td><td>${esc(x.ru)}${c && c.mn ? `<div class="small">💡 ${esc(c.mn)}</div>` : ''}</td><td class="lvl">${lvlStars(c)}</td>
        <td style="white-space:nowrap"><button class="btn ghost small" data-say="${x.id}">🔊</button> <button class="btn ghost small" data-mn="${x.id}">✏️</button></td></tr>`
        : `<tr><td style="font-size:1.2rem">${x.t === 's' ? esc(ruWordOf(x)) : ruHighlight(x)}${c && c.mn ? `<div class="small">💡 ${esc(c.mn)}</div>` : ''}</td><td class="lvl">${lvlStars(c)}</td><td style="white-space:nowrap">${canSpeak('ru') ? `<button class="btn ghost small" data-say="${x.id}">🔊</button> ` : ''}<button class="btn ghost small" data-mn="${x.id}">✏️</button></td></tr>`;
    }).join('')}</table></details>`;
  }).join('')}`;
  document.getElementById('bk').onclick = () => go('kid');
  app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => go('words', { wtab: b.dataset.t }));
  app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { const x = ITEM[b.dataset.say]; x.w !== undefined ? speak(ruWordOf(x), 'ru') : speak(x.en); });
  app.querySelectorAll('[data-mn]').forEach(b => b.onclick = () => {
    const c = card(p, b.dataset.mn); const v = prompt('Твоя подсказка-ассоциация для этого слова:', c.mn || '');
    if (v === null) return; touch(c); if (v.trim()) c.mn = v.trim(); else delete c.mn; save(); checkAch(); go('words', { wtab: tab });
  });
}
function renderAwards() {
  const p = P();
  app.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">⬅️</button><div class="title">🏆 Награды</div><div class="spacer"></div><span class="pill">⭐ ${p.xp} · уровень ${level(p.xp)}</span></div>
   <div class="badges">${ACH.map(a => `<div class="badge ${p.ach[a[0]] ? '' : 'locked'}"><div class="em">${a[1]}</div><b>${a[2]}</b><div class="small muted">${a[3]}</div>${p.ach[a[0]] ? `<div class="small">${fmtDate(p.ach[a[0]])}</div>` : ''}</div>`).join('')}</div>
   <p class="muted center" style="margin-top:20px">Рекорд блица: ${p.bestBlitz || 0} · выучено слов: ${learnedCount(p)}</p>`;
  document.getElementById('bk').onclick = () => go('kid');
}

/* ---------- родители ---------- */
function renderPin() {
  cur.pid = null; setTheme();
  app.innerHTML = `<div class="ex center"><div class="card" style="padding:28px">
    <h2>👨‍👩‍👧 Раздел для родителей</h2>
    <p class="muted">Введите PIN-код</p>
    <div class="pin">${[0, 1, 2, 3].map(i => `<input type="password" inputmode="numeric" maxlength="1" data-i="${i}">`).join('')}</div>
    <div id="pinMsg" class="small status-bad" style="min-height:1.2em"></div>
    <button class="btn ghost" id="bk">⬅️ Назад</button></div></div>`;
  const ins = [...app.querySelectorAll('.pin input')]; ins[0].focus();
  ins.forEach((el, i) => {
    el.oninput = () => { el.value = el.value.replace(/\D/g, ''); if (el.value && i < 3) ins[i + 1].focus(); if (ins.every(x => x.value)) submit(); };
    el.onkeydown = e => { if (e.key === 'Backspace' && !el.value && i > 0) ins[i - 1].focus(); };
  });
  function submit() {
    const v = ins.map(x => x.value).join('');
    if (v === PARENT_PIN) { go('parent'); syncAll(); }
    else { document.getElementById('pinMsg').textContent = 'Неверный PIN'; ins.forEach(x => x.value = ''); ins[0].focus(); }
  }
  document.getElementById('bk').onclick = () => go('home');
}
function hardWords(p, n = 8) {
  return Object.entries(p.cards).filter(([id, c]) => c.bad > 0 && ITEM[id])
    .sort((a, b) => (b[1].bad - b[1].ok * .3) - (a[1].bad - a[1].ok * .3)).slice(0, n)
    .map(([id, c]) => { const x = ITEM[id]; return { t: x.w !== undefined ? ruWordOf(x) : `${x.en} — ${x.ru}`, bad: c.bad, ok: c.ok }; });
}
function childSummary(p, d = today()) {
  const r = dayTot(p, d);
  const g = goalState(p, d), tot = r.ok + r.bad;
  return { r, g, tot, acc: tot ? Math.round(r.ok / tot * 100) : 0 };
}
function reportText(d = today()) {
  const lines = [`📚 Словарик-тренажёр — отчёт за ${fmtDate(d)}`, ''];
  ['nastya', 'andrey'].forEach(id => {
    const p = S.profiles[id], s = childSummary(p, d);
    const errs = Object.keys(s.r.errs || {}).map(k => ITEM[k]).filter(Boolean).map(x => x.w !== undefined ? ruWordOf(x) : x.en);
    lines.push(`${p.avatar} ${p.name} (${p.grade} кл.): ${s.g.done ? '✅ норма выполнена' : '❌ норма НЕ выполнена'}`);
    lines.push(`• Время занятий: ${s.g.min} мин из ${p.set.goalMin}`);
    lines.push(`• Тренировок: ${s.r.ses} из ${p.set.goalSessions}${s.r.games ? ' (из них игр: ' + s.r.games + ')' : ''}`);
    lines.push(`• Ответов: ${s.tot}, верных ${s.r.ok} (${s.acc}%) · новых слов: ${s.r.nw}`);
    lines.push(`• Выучено всего: ${learnedCount(p)} · дней подряд: ${streak(p)}`);
    if (errs.length) lines.push(`• Ошибки сегодня: ${[...new Set(errs)].slice(0, 12).join(', ')}`);
    lines.push('');
  });
  return lines.join('\n');
}
function renderParent() {
  cur.pid = null; setTheme();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const block = id => {
    const p = S.profiles[id], s = childSummary(p);
    const mx = Math.max(p.set.goalMin, ...days.map(d => Math.floor(dayTot(p, d).sec / 60)));
    const units = p.grade === 4 ? UNITS4 : UNITS7;
    const enTotal = enDeck(p).length, ruTotal = ruDeck(p).length;
    const enL = enDeck(p).filter(x => (p.cards[x.id] || {}).b >= LEARNED_BOX).length, ruL = ruDeck(p).filter(x => (p.cards[x.id] || {}).b >= LEARNED_BOX).length;
    const hw = hardWords(p);
    return `<div class="card" style="margin-bottom:18px">
      <div class="row"><h2 style="margin:0">${p.avatar} ${esc(p.name)} · ${p.grade} класс</h2><div class="spacer"></div>
      <span class="${s.g.done ? 'status-ok' : 'status-bad'}">${s.g.done ? '✅ Норма на сегодня выполнена' : '⏳ Норма пока не выполнена'}</span></div>
      <div class="kpis">
        <div class="kpi"><b>${s.g.min} / ${p.set.goalMin}</b><span>минут сегодня</span></div>
        <div class="kpi"><b>${s.r.ses} / ${p.set.goalSessions}</b><span>тренировок сегодня</span></div>
        <div class="kpi"><b>${s.tot ? s.acc + '%' : '—'}</b><span>верных ответов (${s.r.ok} из ${s.tot})</span></div>
        <div class="kpi"><b>${s.r.nw}</b><span>новых слов сегодня</span></div>
        <div class="kpi"><b>🔥 ${streak(p)}</b><span>дней подряд с нормой</span></div>
        <div class="kpi"><b>${enL}/${enTotal}</b><span>англ. слов выучено</span></div>
        <div class="kpi"><b>${ruL}/${ruTotal}</b><span>словарных слов выучено</span></div>
        <div class="kpi"><b>${dueCount(p, 'en') + dueCount(p, 'ru')}</b><span>слов ждут повторения</span></div>
      </div>
      <h3>Минуты за 14 дней <span class="small muted">(зелёный — норма выполнена)</span></h3>
      <div class="chart">${days.map(d => { const r = dayTot(p, d); const m = Math.floor(r.sec / 60); return `<div class="col" title="${fmtDate(d)}: ${m} мин, трен.: ${r.ses || 0}"><span class="small" style="font-size:.6rem">${m || ''}</span><i class="${r.goal ? 'met' : ''}" style="height:${m / mx * 100}%"></i></div>`; }).join('')}</div>
      <div class="chart-labels">${days.map(d => `<span>${d.slice(8)}</span>`).join('')}</div>
      ${hw.length ? `<h3 style="margin-top:16px">Трудные слова</h3><div class="small">${hw.map(h => `${esc(h.t)} <span class="muted">(ошибок: ${h.bad})</span>`).join(' · ')}</div>` : ''}
      <details style="margin-top:16px"><summary><b>⚙️ Настройки: ${esc(p.name)}</b></summary>
      <div class="form" style="margin-top:12px" data-pid="${id}">
        <div class="row">
          <label>Минут в день (минимум)<input type="number" min="5" max="120" name="goalMin" value="${p.set.goalMin}"></label>
          <label>Тренировок в день (минимум)<input type="number" min="1" max="10" name="goalSessions" value="${p.set.goalSessions}"></label>
          <label>Новых слов в день<input type="number" min="0" max="40" name="newPerDay" value="${p.set.newPerDay}"></label>
        </div>
        <div><b>Разделы английского</b> <span class="small muted">(отметьте пройденные и текущие разделы учебника)</span>
          <div class="checks">${units.map(u => `<label><input type="checkbox" name="enUnits" value="${esc(u)}" ${p.set.enUnits.includes(u) ? 'checked' : ''}>${esc(u)}</label>`).join('')}</div></div>
        <div><b>Словарные слова по русскому — классы</b>
          <div class="checks">${[1, 2, 3, 4, 5, 6, 7].map(g => `<label><input type="checkbox" name="ruGrades" value="${g}" ${p.set.ruGrades.includes(g) ? 'checked' : ''}>${g} класс (${RU_WORDS.filter(x => x.g === g).length})</label>`).join('')}</div></div>
        <div class="row"><button class="btn" data-save="${id}">💾 Сохранить</button><button class="btn ghost small" data-reset="${id}">🗑 Сбросить прогресс</button></div>
      </div></details>
    </div>`;
  };
  app.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">⬅️</button><div class="title">👨‍👩‍👧 Отчёт для родителей · ${fmtDate(today())}</div><div class="spacer"></div><button class="btn ghost small" id="syncNow">🔄 Обновить</button></div>
    <div class="small center" id="syncSt" style="margin:-6px 0 12px">${syncText()}</div>
    ${block('nastya')}${block('andrey')}
    <div class="card" style="margin-bottom:18px">
      <h3>📤 Отчёт за сегодня</h3>
      <textarea class="mn" id="rep" style="min-height:220px;font-family:inherit" readonly>${esc(reportText())}</textarea>
      <div class="row" style="margin-top:10px">
        <button class="btn" id="copy">📋 Скопировать</button>
        ${(IS_ANDROID || navigator.share) ? '<button class="btn" id="share">📲 Поделиться (Telegram, WhatsApp…)</button>' : ''}
        <button class="btn ghost" id="mail">✉️ Открыть письмо</button>
      </div>
      <div class="form" style="margin-top:14px"><label>E-mail для письма с отчётом<input type="email" id="email" value="${esc(S.parent.email || '')}" placeholder="например, mama@example.com"></label></div>
    </div>
    <div class="card">
      <h3>☁️ Онлайн-хранение на GitHub</h3>
      <p class="small muted">Прогресс обоих детей хранится в приватном репозитории <b>github.com/${GH.owner}/${GH.repo}</b> и автоматически синхронизируется между всеми телефонами, планшетами и компьютерами. Если интернета нет, занятия сохраняются на устройстве и отправятся, когда связь появится.</p>
      <div class="form"><label>Токен доступа GitHub (вводится один раз на каждом устройстве)
        <input type="password" id="tok" autocomplete="off" placeholder="${ghToken() ? 'токен сохранён на этом устройстве' : 'github_pat_…'}"></label></div>
      <div class="row" style="margin-top:10px"><button class="btn" id="saveTok">💾 Сохранить и проверить</button>${ghToken() ? '<button class="btn ghost small" id="delTok">Удалить токен с устройства</button>' : ''}</div>
      ${ghToken() ? `<h3 style="margin-top:20px">📱 Подключить другое устройство (iPhone, компьютер)</h3>
      <p class="small muted">Отправьте ссылку в личном сообщении (например, жене в Telegram). Её нужно открыть в Safari, дальше всё подключится само. Не пересылайте ссылку посторонним: в ней ключ доступа к данным.</p>
      <div class="row"><button class="btn" id="invite">📲 Отправить ссылку для iPhone</button><button class="btn ghost" id="inviteCopy">📋 Скопировать ссылку</button></div>` : ''}
      ${IS_ANDROID ? '' : `<h3 style="margin-top:20px">💾 Резервная копия</h3>
      <div class="row"><button class="btn ghost" id="exp">⬇️ Сохранить копию в файл</button><label class="btn ghost">⬆️ Загрузить копию<input type="file" id="imp" accept=".json" hidden></label></div>`}
    </div>`;
  document.getElementById('bk').onclick = () => go('home');
  document.getElementById('syncNow').onclick = () => syncAll(true);
  app.querySelectorAll('[data-save]').forEach(b => b.onclick = () => {
    const id = b.dataset.save, f = app.querySelector(`.form[data-pid="${id}"]`), p = S.profiles[id];
    const num = (n, lo, hi) => Math.min(hi, Math.max(lo, parseInt(f.querySelector(`[name=${n}]`).value) || lo));
    p.set.goalMin = num('goalMin', 5, 120); p.set.goalSessions = num('goalSessions', 1, 10); p.set.newPerDay = num('newPerDay', 0, 40);
    p.set.enUnits = [...f.querySelectorAll('[name=enUnits]:checked')].map(x => x.value);
    p.set.ruGrades = [...f.querySelectorAll('[name=ruGrades]:checked')].map(x => +x.value);
    p.setT = Date.now();
    save(); toast('Настройки сохранены ✅'); renderParent(); syncAll();
  });
  app.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => {
    const p = S.profiles[b.dataset.reset];
    if (!confirm(`Удалить весь прогресс: ${p.name}? Это нельзя отменить — данные удалятся и на сервере.`)) return;
    const fresh = defaultProfile(p.id, p.name, p.grade, p.avatar); fresh.set = p.set; fresh.setT = Date.now(); fresh.rst = Date.now();
    S.profiles[p.id] = fresh; save(); renderParent(); syncAll();
  });
  document.getElementById('copy').onclick = async () => {
    const t = document.getElementById('rep');
    if (IS_ANDROID) { try { AB.copy(t.value); } catch (e) { } }
    else { try { await navigator.clipboard.writeText(t.value); } catch (e) { t.select(); document.execCommand('copy'); } }
    toast('Отчёт скопирован 📋');
  };
  const sh = document.getElementById('share');
  if (sh) sh.onclick = () => {
    const title = 'Отчёт: занятия детей ' + fmtDate(today());
    if (IS_ANDROID) { try { AB.share(title, reportText()); } catch (e) { } }
    else navigator.share({ title, text: reportText() }).catch(() => { });
  };
  document.getElementById('email').onchange = e => { S.parent.email = e.target.value.trim(); saveLocal(); };
  document.getElementById('mail').onclick = () => {
    const em = S.parent.email || '';
    location.href = `mailto:${encodeURIComponent(em)}?subject=${encodeURIComponent('Отчёт: занятия детей ' + fmtDate(today()))}&body=${encodeURIComponent(reportText())}`;
  };
  document.getElementById('saveTok').onclick = async () => {
    const v = document.getElementById('tok').value.trim();
    if (v) { try { localStorage.setItem(TOKEN_KEY, v); } catch (e) { } }
    if (!ghToken()) return toast('Вставьте токен');
    const ok = await checkToken();
    toast(ok ? '✅ Подключено к GitHub' : '⚠️ ' + sync.err, 3500);
    if (ok) { await syncAll(true); renderParent(); }
  };
  const invLink = () => WEB_URL + '#k=' + encodeURIComponent(ghToken());
  const inv = document.getElementById('invite');
  if (inv) inv.onclick = () => {
    const text = 'Словарик-тренажёр: отчёты о занятиях Насти и Андрея. Откройте ссылку в Safari, затем «Поделиться» → «На экран Домой»:\n' + invLink();
    if (IS_ANDROID) { try { AB.share('Словарик для iPhone', text); } catch (e) { } }
    else if (navigator.share) navigator.share({ title: 'Словарик', text }).catch(() => { });
    else toast('Нажмите «Скопировать ссылку»');
  };
  const invc = document.getElementById('inviteCopy');
  if (invc) invc.onclick = async () => {
    if (IS_ANDROID) { try { AB.copy(invLink()); } catch (e) { } }
    else { try { await navigator.clipboard.writeText(invLink()); } catch (e) { } }
    toast('Ссылка скопирована 📋');
  };
  const dt = document.getElementById('delTok');
  if (dt) dt.onclick = () => { if (!confirm('Удалить токен с этого устройства? Синхронизация остановится.')) return; try { localStorage.removeItem(TOKEN_KEY); } catch (e) { } renderParent(); };
  const exp = document.getElementById('exp');
  if (exp) exp.onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `slovarik-kopiya-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const imp = document.getElementById('imp');
  if (imp) imp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { const d = JSON.parse(rd.result); if (!d.profiles || !d.profiles.nastya) throw 0; if (!confirm('Добавить данные из файла к текущему прогрессу?')) return; ['nastya', 'andrey'].forEach(id => mergeProfile(S.profiles[id], d.profiles[id])); save(); toast('Данные загружены ✅'); renderParent(); syncAll(); }
      catch (err) { alert('Это не похоже на файл копии тренажёра'); }
    };
    rd.readAsText(f);
  };
}

/* ---------- онлайн-синхронизация через GitHub ---------- */
const GH = { owner: 'gogaclaudyan-ops', repo: 'slovarik-data', branch: 'main' };
const TOKEN_KEY = 'slovarik_gh_token';
const WEB_URL = 'https://gogaclaudyan-ops.github.io/slovarik/';
// Ссылка-приглашение: ключ передаётся в #-части адреса (на сервер она не отправляется), сохраняется и сразу стирается из адреса
(function acceptInvite() {
  const m = /[#&]k=([^&]+)/.exec(location.hash || '');
  if (!m) return;
  try { localStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1])); } catch (e) { }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  setTimeout(() => toast('✅ Устройство подключено к онлайн-хранению', 3500), 500);
})();
const sync = { dirty: false, busy: false, lastOk: 0, err: '', pending: false };
const ghToken = () => { try { return localStorage.getItem(TOKEN_KEY) || window.DEFAULT_GH_TOKEN || ''; } catch (e) { return window.DEFAULT_GH_TOKEN || ''; } };
function b64e(str) { const bytes = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
function b64d(b) { const bin = atob(b.replace(/\s/g, '')); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); }
function stable(o) { // JSON с отсортированными ключами — чтобы сравнивать данные
  if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
  if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
  return JSON.stringify(o);
}
async function gh(method, path, body) {
  const url = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}` + (method === 'GET' ? `?ref=${GH.branch}&_=${Date.now()}` : '');
  return fetch(url, { method, cache: 'no-store', headers: { 'Authorization': 'Bearer ' + ghToken(), 'Accept': 'application/vnd.github+json' }, body: body ? JSON.stringify(body) : undefined });
}
function ghError(r) { return r.status === 401 ? 'Токен GitHub неверный или истёк' : r.status === 403 ? 'У токена нет доступа к репозиторию (нужно право Contents: Read and write)' : r.status === 404 ? 'Репозиторий не найден — проверьте доступ токена к ' + GH.repo : 'Ошибка GitHub ' + r.status; }
async function checkToken() {
  try { const r = await gh('GET', 'README.md'); if (r.ok) { sync.err = ''; return true; } sync.err = ghError(r); }
  catch (e) { sync.err = 'Нет связи с GitHub'; }
  updSync(); return false;
}
async function pullFile(path) {
  const r = await gh('GET', path);
  if (r.status === 404) {
    const t = await gh('GET', 'README.md'); if (!t.ok) throw new Error(ghError(t));
    return { sha: null, data: null };
  }
  if (!r.ok) throw new Error(ghError(r));
  const j = await r.json(); return { sha: j.sha, data: JSON.parse(b64d(j.content)) };
}
async function pushFile(path, data, sha) {
  const r = await gh('PUT', path, { message: `${path} · ${new Date().toLocaleString('ru-RU')}`, content: b64e(JSON.stringify(data)), branch: GH.branch, ...(sha ? { sha } : {}) });
  if (r.status === 409 || r.status === 422) return null; // файл изменился на другом устройстве — повторим
  if (!r.ok) throw new Error(ghError(r));
  return true;
}
// Объединение: ничего не теряется, даже если дети занимались на разных устройствах
function mergeProfile(L, R) {
  if (!R || !L) return;
  if ((R.rst || 0) > (L.rst || 0)) { Object.keys(L).forEach(k => delete L[k]); Object.assign(L, JSON.parse(JSON.stringify(R))); return; } // прогресс сброшен родителем на другом устройстве
  if ((L.rst || 0) > (R.rst || 0)) return; // сброс сделан здесь — серверную версию заменим
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
      lr.errs = lr.errs || {}; for (const [k, v] of Object.entries(rr.errs || {})) lr.errs[k] = Math.max(lr.errs[k] || 0, v);
    }
  }
  L.xp = Math.max(L.xp || 0, R.xp || 0);
  if (R.bestBlitz || L.bestBlitz) L.bestBlitz = Math.max(L.bestBlitz || 0, R.bestBlitz || 0);
  L.ach = L.ach || {}; for (const [k, v] of Object.entries(R.ach || {})) if (!L.ach[k]) L.ach[k] = v;
  if ((R.setT || 0) > (L.setT || 0)) { L.set = R.set; L.setT = R.setT; }
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
        if (data && stable(data) === stable(S.profiles[id])) break; // на сервере всё актуально
        if (await pushFile(path, S.profiles[id], sha)) break;
      }
    }
    sync.lastOk = Date.now(); sync.err = '';
    saveLocal();
  } catch (e) { ok = false; sync.dirty = true; sync.err = (e && e.message && !/fetch|network/i.test(e.message)) ? e.message : 'Нет интернета — данные сохранены на устройстве'; }
  sync.busy = false; updSync();
  if (manual) toast(ok ? '☁️ Данные обновлены' : '⚠️ ' + sync.err, 3000);
  // если пришли новые данные — перерисовать экран, где они видны (не во время упражнения)
  if (stable(S.profiles) !== before && ['home', 'kid', 'parent', 'words', 'awards'].includes(cur.screen)) go(cur.screen);
  if (sync.pending) { sync.pending = false; setTimeout(syncAll, 500); }
  return ok;
}
function syncText() {
  if (!ghToken()) return '<span class="muted">☁️ Онлайн-хранение не подключено</span>';
  if (sync.busy) return '<span class="muted">⏳ Синхронизация…</span>';
  if (sync.err) return `<span class="status-bad">⚠️ ${esc(sync.err)}</span>`;
  if (sync.lastOk) return `<span class="status-ok">☁️ Сохранено онлайн в ${new Date(sync.lastOk).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>`;
  return '<span class="muted">☁️ Подключено</span>';
}
function updSync() { const el = document.getElementById('syncSt'); if (el) el.innerHTML = syncText(); }
// фоновая отправка: раз в минуту, если что-то изменилось; раз в 3 минуты — проверка новых данных
let lastPull = 0;
setInterval(() => {
  if (!ghToken() || document.hidden) return;
  if (sync.dirty || Date.now() - lastPull > 180000) { lastPull = Date.now(); syncAll(); }
}, 60000);
document.addEventListener('visibilitychange', () => { if (document.hidden && sync.dirty) syncAll(); if (!document.hidden && Date.now() - lastPull > 30000) { lastPull = Date.now(); syncAll(); } });
addEventListener('online', () => syncAll());

/* ---------- Android: кнопка «Назад» и сворачивание ---------- */
window.androidBack = () => {
  if (cur.screen === 'home') { try { AB.exit(); } catch (e) { } return; }
  if (cur.screen === 'session') { const q = document.getElementById('quit'); if (q) q.click(); else go('kid'); return; }
  if (cur.screen === 'game') return go('kid');
  if (['words', 'awards'].includes(cur.screen)) return go('kid');
  go('home');
};
window.onAndroidPause = () => { save(); if (ghToken()) syncAll(); };

/* ---------- старт ---------- */
go('home');
lastPull = Date.now(); syncAll();
