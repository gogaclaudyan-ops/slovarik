'use strict';
/* =========================================================================
   WORLDS.JS — Игровые вселенные Словарика 2.0
   • Андрей: «Steel Ball Run» (карта 9 этапов, Золотое вращение, аниме-герои, дуэли)
   • Настя: «Cozy-кафе и Питомцы» (комната Toca Boca, кристаллы, гача-капсулы)
   ========================================================================= */

/* ---------- SVG-иллюстрации (работают 100% офлайн) ---------- */
const SVG_ART = {
  gyro: `<svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#1e272e"/>
    <circle cx="50" cy="54" r="24" fill="#ffe0bd" stroke="#1e272e" stroke-width="3"/>
    <path d="M18 36 Q50 18 82 36 L74 44 Q50 32 26 44 Z" fill="#2f3640" stroke="#f6b93b" stroke-width="2.5"/>
    <path d="M28 32 Q50 8 72 32 Z" fill="#353b48" stroke="#1e272e" stroke-width="2.5"/>
    <circle cx="41" cy="53" r="3.5" fill="#00a8ff"/><circle cx="59" cy="53" r="3.5" fill="#00a8ff"/>
    <path d="M40 65 Q50 72 60 65" fill="none" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>
    <circle cx="80" cy="78" r="14" fill="#00b894" stroke="#f6b93b" stroke-width="3"/>
    <path d="M72 78 Q80 68 88 78 Q80 88 72 78" fill="none" stroke="#fff" stroke-width="2"/>
  </svg>`,

  diego: `<svg viewBox="0 0 100 100" width="66" height="66" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#4a0e0e"/>
    <circle cx="50" cy="56" r="23" fill="#ffe0bd" stroke="#1e272e" stroke-width="3"/>
    <path d="M22 42 Q50 14 78 42 Z" fill="#0097e6" stroke="#f6b93b" stroke-width="2.5"/>
    <text x="50" y="34" text-anchor="middle" font-size="13" font-weight="900" fill="#f6b93b">DIO</text>
    <path d="M36 52 L45 55 M64 52 L55 55" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>
    <circle cx="41" cy="57" r="3" fill="#d63031"/><circle cx="59" cy="57" r="3" fill="#d63031"/>
    <path d="M41 68 L59 66" stroke="#1e272e" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  steelBall: `<svg class="spin-ball" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="sb" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#55efc4"/><stop offset="60%" stop-color="#00b894"/><stop offset="100%" stop-color="#006266"/>
    </radialGradient></defs>
    <circle cx="30" cy="30" r="26" fill="url(#sb)" stroke="#f6b93b" stroke-width="4"/>
    <path d="M30 8 A22 22 0 0 1 52 30 A14 14 0 0 1 38 44 A8 8 0 0 1 30 36" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="18" cy="20" r="4" fill="#ffeaa7"/>
  </svg>`
};

/* ---------- АНДРЕЙ: STEEL BALL RUN ---------- */
const SBR_STAGES = [
  { id: 1, name: '1. Пляж Сан-Диего', unit: UNITS7[0], artifact: '🪙 Золотая шпора' },
  { id: 2, name: '2. Пустыня Аризоны', unit: UNITS7[1], artifact: '🧭 Компас всадника' },
  { id: 3, name: '3. Скалистые горы', unit: UNITS7[2], artifact: '🌀 Стальной шар' },
  { id: 4, name: '4. Канзас-Сити', unit: UNITS7[3], artifact: '⚡ Подкова скорости' },
  { id: 5, name: '5. Чикаго', unit: UNITS7[4], artifact: '🦅 Знак сокола' },
  { id: 6, name: '6. Макино-Сити', unit: UNITS7[5], artifact: '🛡️ Щит Вращения' },
  { id: 7, name: '7. Филадельфия', unit: UNITS7[6], artifact: '📜 Карта континента' },
  { id: 8, name: '8. Геттисберг', unit: UNITS7[7], artifact: '🔥 Пламя дуэли' },
  { id: 9, name: '9. Финиш: Манхэттен', unit: UNITS7[8], artifact: '👑 Кубок Steel Ball Run' }
];

const SBR_QUOTES = [
  '«Золотое вращение начинается с точности. Не сбавляй темп!»',
  '«Каждый выученный юнит приближает к финишу в Нью-Йорке!»',
  '«Поймай ритм: серия из 5 верных ответов раскрутит Стальной шар на максимум!»',
  '«Ошибки — это соперники на трассе. Вызови их на дуэль и забери трофей!»'
];

const SBR_SFX = ['ゴゴゴ!', 'SPIN x2!', 'ドドド!', 'GOLDEN RATIO!', 'ORA!!'];

function sbrProgress(p) {
  let curStageIdx = 0;
  const stages = SBR_STAGES.map((st, idx) => {
    const words = EN7.filter(w => w.u === st.unit);
    const done = words.filter(w => (p.cards[w.id]?.b || 0) >= LEARNED_BOX).length;
    const pct = words.length ? Math.round(done / words.length * 100) : 0;
    const cleared = pct >= 70;
    if (cleared && !p.world.artifacts.includes(st.artifact)) {
      p.world.artifacts.push(st.artifact);
      p.world.t = Date.now();
    }
    if (!cleared && curStageIdx === idx) curStageIdx = idx;
    else if (cleared && curStageIdx === idx) curStageIdx = Math.min(SBR_STAGES.length - 1, idx + 1);
    return { ...st, done, total: words.length, pct, cleared };
  });
  return { stages, curStageIdx };
}

function renderSbrHero(p) {
  const { stages, curStageIdx } = sbrProgress(p);
  const curSt = stages[curStageIdx];
  const quote = SBR_QUOTES[(new Date().getDate() + (p.world.bossWins || 0)) % SBR_QUOTES.length];
  return `
  <div class="sbr-hero">
    <div class="sbr-top">
      <div class="sbr-portrait">${SVG_ART.gyro}</div>
      <div style="flex:1;min-width:190px">
        <div class="world-tag sbr">STEEL BALL RUN · ЭТАП ${curSt.id} ИЗ 9</div>
        <h2 style="margin:2px 0;color:#fff">${esc(curSt.name)}</h2>
        <div class="small" style="color:#d2dae2">🌀 Рекорд вращения: <b>x${p.world.spinBest || 0}</b> · ⚔️ Дуэлей выиграно: <b>${p.world.bossWins || 0}</b> · 🏆 Артефакты: <b>${p.world.artifacts.length}/9</b></div>
      </div>
    </div>
    <div class="sbr-quote">${quote}</div>
    <div class="sbr-map">
      ${stages.map((st, i) => `
        <div class="sbr-stage ${st.cleared ? 'done' : i === curStageIdx ? 'cur' : ''}">
          <b>${st.cleared ? '✅' : i === curStageIdx ? '🐎' : '📍'} ${esc(st.name)}</b>
          <span style="color:#d2dae2">${st.done}/${st.total} слов</span>
          <div class="stbar"><i style="width:${st.pct}%"></i></div>
        </div>`).join('')}
    </div>
  </div>`;
}

function renderSpinHud(combo) {
  const mult = combo >= 5 ? 5 : combo >= 3 ? 3 : combo >= 2 ? 2 : 1;
  const cls = combo >= 4 ? 'fast' : combo >= 2 ? 'active' : '';
  return `<div class="spin-hud">
    <div class="spin-ball ${cls}">${SVG_ART.steelBall}</div>
    <div style="flex:1">
      <b>Золотое вращение: ${combo > 0 ? 'серия ' + combo : 'раскрути шар!'}</b>
      <div class="small" style="color:#f6b93b">${mult > 1 ? `Множитель бонуса ×${mult} · ゴゴゴ!` : 'Отвечай подряд без ошибок для комбо'}</div>
    </div>
    <div class="pill" style="background:#f6b93b;color:#1e272e">×${mult}</div>
  </div>`;
}

function renderBossHud(hp, maxHp) {
  const pct = Math.max(0, Math.round(hp / Math.max(1, maxHp) * 100));
  return `<div class="boss-hud">
    <div style="border-radius:10px;overflow:hidden;border:2px solid #f6b93b;flex:none">${SVG_ART.diego}</div>
    <div style="flex:1">
      <b>⚔️ ДУЭЛЬ ВСАДНИКОВ · Соперник: Диего</b>
      <div class="small" style="color:#ffeaa7">Каждый верный ответ наносит удар Стальным шаром!</div>
      <div class="boss-hp-bar"><i style="width:${pct}%"></i></div>
    </div>
    <div style="font-weight:900;font-size:1.1rem">${hp}/${maxHp} HP</div>
  </div>`;
}

/* ---------- НАСТЯ: COZY-КАФЕ И ПИТОМЦЫ (TOCA BOCA / KAWAII) ---------- */
const COZY_PETS = [
  { id: 'capybara', em: '🍊🦫', name: 'Капибара с мандарином', rarity: 'common', phrase: 'Спокойно и уверенно — ты молодец!' },
  { id: 'axolotl', em: '🩷🦎', name: 'Розовый Аксолотль', rarity: 'rare', phrase: 'Буль-буль! Какой классный ответ!' },
  { id: 'unicat', em: '🦄🐱', name: 'Котёнок-единорог', rarity: 'legendary', phrase: 'Волшебство! Ты настоящая звёздочка!' },
  { id: 'redpanda', em: '🦊🍒', name: 'Красная панда', rarity: 'rare', phrase: 'Ура! Ещё одно слово в копилку!' },
  { id: 'corgi', em: '🐶🎀', name: 'Пушистый корги', rarity: 'common', phrase: 'Гав! Я в тебя верю!' },
  { id: 'mochi', em: '🐰🍓', name: 'Зайчик Моти', rarity: 'common', phrase: 'Прыг-скок! Очень здорово!' },
  { id: 'bobacat', em: '🧋🐱', name: 'Боба-котик', rarity: 'rare', phrase: 'Время уютной тренировки!' },
  { id: 'clouddragon', em: '☁️🐉', name: 'Облачный дракончик', rarity: 'legendary', phrase: 'Летим выше облаков!' }
];

const COZY_ITEMS = [
  { id: 'window', em: '🪟', name: 'Окно с облаками', price: 0 },
  { id: 'rug', em: '☁️', name: 'Коврик-облачко', price: 0 },
  { id: 'plant', em: '🪴', name: 'Комнатный цветок', price: 0 },
  { id: 'lights', em: '✨', name: 'Тёплая гирлянда', price: 60 },
  { id: 'boba', em: '🧋', name: 'Стойка с бабл-ти', price: 90 },
  { id: 'cake', em: '🍰', name: 'Витрина с тортиками', price: 110 },
  { id: 'books', em: '📚', name: 'Уютный книжный стеллаж', price: 120 },
  { id: 'neon', em: '💖', name: 'Неоновое сердечко', price: 140 },
  { id: 'plush', em: '🧸', name: 'Большой плюшевый мишка', price: 160 },
  { id: 'moon', em: '🌙', name: 'Ночник-луна', price: 180 }
];

const RARITY_RU = { common: 'Обычный', rare: 'Редкий', legendary: 'Легендарный' };
const petById = id => COZY_PETS.find(x => x.id === id) || COZY_PETS[0];

function renderCozyRoomSvg(p) {
  const has = id => (p.world.room || []).includes(id);
  const pet = petById(p.world.activePet);
  return `<svg class="cozy-room-svg" viewBox="0 0 600 210" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="145" fill="#fff0f7"/>
    <rect y="145" width="600" height="65" fill="#ffe5d9"/>
    <line x1="0" y1="145" x2="600" y2="145" stroke="#f4c6dc" stroke-width="4"/>
    ${has('window') ? `<rect x="235" y="24" width="130" height="82" rx="14" fill="#d6f0ff" stroke="#f8b4d9" stroke-width="5"/>
      <line x1="300" y1="24" x2="300" y2="106" stroke="#f8b4d9" stroke-width="4"/>
      <line x1="235" y1="65" x2="365" y2="65" stroke="#f8b4d9" stroke-width="4"/>
      <text x="255" y="55" font-size="22">☁️</text><text x="318" y="88" font-size="18">☀️</text>` : ''}
    ${has('lights') ? `<path d="M10 18 Q150 48 300 20 Q450 48 590 18" fill="none" stroke="#f6b93b" stroke-width="3"/>
      <text x="65" y="34" font-size="18">✨</text><text x="190" y="36" font-size="18">⭐</text><text x="410" y="36" font-size="18">⭐</text><text x="520" y="34" font-size="18">✨</text>` : ''}
    ${has('neon') ? `<rect x="445" y="36" width="90" height="46" rx="14" fill="#ffe0f0" stroke="#e84393" stroke-width="3"/><text x="490" y="67" text-anchor="middle" font-size="24">💖</text>` : ''}
    ${has('moon') ? `<text x="52" y="70" font-size="34">🌙</text>` : ''}
    ${has('books') ? `<rect x="24" y="80" width="76" height="72" rx="10" fill="#ffd6e7" stroke="#e84393" stroke-width="2.5"/><text x="62" y="124" text-anchor="middle" font-size="34">📚</text>` : ''}
    ${has('rug') ? `<ellipse cx="300" cy="176" rx="120" ry="22" fill="#fff" stroke="#f8b4d9" stroke-width="3"/>` : ''}
    ${has('plant') ? `<text x="128" y="152" font-size="38">🪴</text>` : ''}
    ${has('boba') ? `<text x="410" y="152" font-size="38">🧋</text>` : ''}
    ${has('cake') ? `<text x="472" y="154" font-size="38">🍰</text>` : ''}
    ${has('plush') ? `<text x="180" y="168" font-size="36">🧸</text>` : ''}
    <text x="300" y="168" text-anchor="middle" font-size="44">${pet.em}</text>
  </svg>`;
}

function renderCozyHero(p) {
  const pet = petById(p.world.activePet);
  const caps = p.world.freeCapsules || 0;
  return `
  <div class="cozy-stage">
    <div class="row" style="margin-bottom:10px">
      <div class="world-tag cozy">🎀 Уютное кафе Насти</div>
      <div class="spacer"></div>
      <div class="pill">💎 ${p.world.gems || 0}</div>
      <div class="pill">🐾 ${p.world.pets.length}/${COZY_PETS.length}</div>
    </div>
    ${renderCozyRoomSvg(p)}
    <div class="cozy-actions">
      <span class="pet-chip">${pet.em} ${esc(pet.name)}</span>
      <div class="spacer"></div>
      <button class="btn small" id="openShop">🛋️ Магазин уюта</button>
      <button class="btn small gold" id="openGacha">🎁 Капсула питомца${caps > 0 ? ` (${caps} бесплатно!)` : ''}</button>
    </div>
  </div>`;
}

function renderPetCheer(p, customText) {
  const pet = petById(p.world.activePet);
  return `<div class="pet-cheer">
    <div class="pet-ico">${pet.em}</div>
    <div><b>${esc(pet.name)}</b><div class="small muted">${esc(customText || pet.phrase)}</div></div>
  </div>`;
}

function rollGachaPet(p) {
  const owned = new Set(p.world.pets || []);
  const unowned = COZY_PETS.filter(x => !owned.has(x.id));
  const pool = unowned.length ? unowned : COZY_PETS;
  const r = Math.random();
  let pickPool = pool.filter(x => r > .82 ? x.rarity === 'legendary' : r > .45 ? x.rarity === 'rare' : x.rarity === 'common');
  if (!pickPool.length) pickPool = pool;
  const pet = pick(pickPool);
  const isNewPet = !owned.has(pet.id);
  if (isNewPet) p.world.pets.push(pet.id);
  else p.world.gems = (p.world.gems || 0) + 50;
  p.world.activePet = pet.id;
  p.world.t = Date.now();
  save();
  return { pet, isNewPet };
}
