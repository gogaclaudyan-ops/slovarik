'use strict';
/* =========================================================================
   APP.JS — Интерфейс и движок упражнений Словарика 2.0
   ========================================================================= */

const app = document.getElementById('app');

function setTheme(pid) {
  document.body.className = pid === 'nastya' ? 't-nastya' : pid === 'andrey' ? 't-andrey' : '';
  const mode = pid === 'nastya' && S.profiles.nastya ? (S.profiles.nastya.world.roomTime || 'day') : 'day';
  document.body.dataset.roomTime = pid === 'nastya' ? mode : '';
  if (typeof BG_FX !== 'undefined') BG_FX.setMode(pid || 'home', mode);
}

function go(screen, arg) {
  if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) { }
  if (screen === 'home') {
    document.querySelectorAll('.confetti').forEach(el => el.remove());
    const tEl = document.getElementById('toast'); if (tEl) tEl.hidden = true;
  }
  cur.screen = screen; cur.active = false;
  setTheme(['home', 'parent', 'pin'].includes(screen) ? null : cur.pid);
  const map = {
    home: renderHome, kid: renderKid, session: renderTask, pairs: startPairs,
    blitz: startBlitz, words: renderWords, awards: renderAwards,
    parent: renderParent, pin: renderPin, shop: renderCozyShop, gacha: renderGacha
  };
  (map[screen] || renderHome)(arg);
  app.classList.remove('screen-enter');
  void app.offsetWidth;
  app.classList.add('screen-enter');
  window.scrollTo(0, 0);
}

/* ---------- Главная: выбор профиля ---------- */
function renderHome() {
  const ps = [S.profiles.nastya, S.profiles.andrey];
  app.innerHTML = `
    <div class="home-header center">
      <h1>Словарик-тренажёр <span class="ver-badge">v${CFG.version}</span></h1>
      <p class="muted">Выбери своего героя и отправляйся в приключение!</p>
    </div>
    <div class="profiles">
      ${ps.map(p => {
        const g = goalState(p), st = streak(p);
        const isSbr = p.id === 'andrey';
        const tag = isSbr
          ? '<div class="world-tag sbr">Steel Ball Run · Аниме-гонка</div>'
          : '<div class="world-tag cozy">Уютное кафе и Питомцы</div>';
        const heroMedallion = isSbr
          ? `<div class="home-medallion sbr">${renderGyroSvg('idle', 98)}</div>`
          : `<div class="home-medallion cozy">${renderPetSvg(p.world.activePet, 'idle', 98)}</div>`;
        const worldStat = isSbr
          ? `Артефакты <b>${(p.world.artifacts || []).length}/9</b> · Spin <b>×${p.world.spinBest || 0}</b>`
          : `<b>${p.world.gems || 0}</b> кристаллов · Питомцев <b>${(p.world.pets || []).length}/${COZY_PETS.length}</b>`;
        return `<div class="card profile ${p.id}" data-p="${p.id}">
          ${heroMedallion}
          <h2>${p.name}</h2>
          ${tag}
          <div class="muted small">${p.grade} класс · Уровень ${level(p.xp)}</div>
          <div class="small home-world-stat">${worldStat}</div>
          <div style="margin:12px 0">
            <div class="bar ${g.done ? 'okc' : ''}"><i style="width:${g.pct}%"></i></div>
            <div class="small muted" style="margin-top:6px">Сегодня: ${g.min} из ${p.set.goalMin} мин · Серия ${st} ${plural(st, 'день', 'дня', 'дней')}</div>
          </div>
          <div class="home-cta shine-btn">${isSbr ? 'Погнали в заезд →' : 'Зайти в кафе →'}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="center">
      <button class="btn ghost btn-ico" id="toParent">${UI_ICO.parent}<span>Для родителей</span></button>
    </div>`;
  app.querySelectorAll('[data-p]').forEach(el => el.onclick = () => {
    playPop();
    const pid = el.dataset.p;
    if (KID_PIN[pid]) { cur.pid = pid; go('pin', { target: 'kid', pid }); return; }
    cur.pid = pid; go('kid');
  });
  document.getElementById('toParent').onclick = () => go('pin', { target: 'parent' });
}

/* ---------- Экран ребёнка (игровое лобби) ---------- */
function renderKid() {
  const p = P(), g = goalState(p), st = streak(p), lv = level(p.xp);
  const en = enDeck(p), ru = ruDeck(p), td = today();
  const dueEn = en.filter(x => { const c = p.cards[x.id]; return c && c.b > 0 && c.due && c.due <= td; }).length;
  const dueRu = ru.filter(x => { const c = p.cards[x.id]; return c && c.b > 0 && c.due && c.due <= td; }).length;
  const newEn = en.filter(x => isNew(p, x.id)).length;
  const newRu = ru.filter(x => isNew(p, x.id)).length;
  const badAll = Object.entries(p.cards).filter(([id, c]) => c.bad > 0 && c.b < LEARNED_BOX && ITEM[id]).length;
  const xpFrom = xpForLevel(lv), xpTo = xpForLevel(lv + 1);
  const xpPct = Math.min(100, Math.round((p.xp - xpFrom) / (xpTo - xpFrom) * 100));
  const isSbr = p.id === 'andrey';

  app.innerHTML = `<div class="kid-lobby">
    <div class="topbar">
      <button class="icon-btn" id="back" title="Сменить профиль" aria-label="Сменить профиль">${UI_ICO.back}</button>
      <div class="title">${p.name}</div>
      <div class="spacer"></div>
      <span class="pill stat-pill">${UI_ICO.fire}<span>${st}</span></span>
      <span class="pill stat-pill">${UI_ICO.star}<span>${p.xp}</span></span>
      <button class="icon-btn sound-btn" id="sndBtn" title="Звук" aria-label="Звук">${isSoundOn() ? UI_ICO.soundOn : UI_ICO.soundOff}</button>
    </div>

    ${isSbr ? renderSbrHero(p) : renderCozyHero(p)}

    <div class="section-title">Главные тренировки</div>
    <div class="play-hero-grid">
      <button class="play-card en-card shine-btn" id="tEn">
        <div class="play-ico">${isSbr ? UI_ICO.sbrHorse : UI_ICO.en}</div>
        <div class="play-copy">
          <b>${isSbr ? 'Заезд: Английский' : 'Английский'}</b>
          <span>${dueEn ? `Повторить: ${dueEn}` : `Новых: ${newEn}`}</span>
        </div>
      </button>
      <button class="play-card ru-card shine-btn" id="tRu">
        <div class="play-ico">${isSbr ? UI_ICO.sbrSpin : UI_ICO.ru}</div>
        <div class="play-copy">
          <b>${isSbr ? 'Вращение: Русский' : 'Словарные слова'}</b>
          <span>${dueRu ? `Повторить: ${dueRu}` : `Новых: ${newRu}`}</span>
        </div>
      </button>
    </div>

    <div class="section-title">${isSbr ? 'Режимы и дуэли' : 'Игры и задания'}</div>
    <div class="game-grid">
      <button class="gcard" id="tEnNew">
        <div class="gcard-ico">${UI_ICO.enNew}</div>
        <b>Новые слова</b>
        <span>Английский · ${newEn}</span>
      </button>
      <button class="gcard" id="tEnRev">
        <div class="gcard-ico">${UI_ICO.enRev}</div>
        <b>Повторение</b>
        <span>${dueEn ? dueEn + ' ждут' : 'Закрепить'}</span>
      </button>
      <button class="gcard" id="tRuPhoto">
        <div class="gcard-ico">${UI_ICO.photo}</div>
        <b>Фото-диктант</b>
        <span>Запомни образ</span>
      </button>
      <button class="gcard" id="tRuFix">
        <div class="gcard-ico">${UI_ICO.fix}</div>
        <b>Найди ошибку</b>
        <span>Хитрые слова</span>
      </button>
      <button class="gcard" id="gPairs">
        <div class="gcard-ico">${UI_ICO.pairs}</div>
        <b>Найди пары</b>
        <span>Память + перевод</span>
      </button>
      <button class="gcard" id="gBlitz">
        <div class="gcard-ico">${UI_ICO.blitz}</div>
        <b>Блиц 60 сек</b>
        <span>Рекорд: ${p.bestBlitz || 0}</span>
      </button>
      <button class="gcard gcard-wide ${isSbr && badAll ? 'boss-tile' : ''}" id="gMistakes">
        <div class="gcard-ico">${isSbr ? UI_ICO.duel : UI_ICO.heal}</div>
        <div>
          <b>${isSbr ? 'Дуэль всадников (ошибки)' : 'Работа над ошибками'}</b>
          <span>${badAll ? badAll + ' трудных слов ждут реванша' : 'Ошибок нет — отличная форма!'}</span>
        </div>
      </button>
    </div>

    <div class="card goal-card" style="margin-top:16px">
      <div class="goal">
        <div class="ring ${g.done ? 'ring-done' : ''}" style="--p:${g.pct}"><div>${g.pct}%<small>цель дня</small></div></div>
        <div style="flex:1;min-width:190px">
          <h3>${g.done ? 'Цель дня выполнена!' : 'План на сегодня'}</h3>
          <div class="small muted">Время: <b>${g.min}</b> из ${p.set.goalMin} мин · Тренировок: <b>${g.ses}</b> из ${p.set.goalSessions}</div>
          <div style="margin-top:8px" class="small muted">Уровень ${lv} (${p.xp - xpFrom}/${xpTo - xpFrom} XP)</div>
          <div class="bar" style="margin-top:4px"><i style="width:${xpPct}%"></i></div>
        </div>
      </div>
      ${renderDailyQuests(p)}
    </div>

    <nav class="game-dock" aria-label="Навигация">
      <button type="button" class="dock-btn active" id="dockHome">${UI_ICO.home}<span>Мир</span></button>
      <button type="button" class="dock-btn" id="toWords">${UI_ICO.words}<span>Слова (${learnedCount(p)})</span></button>
      <button type="button" class="dock-btn" id="toAwards">${UI_ICO.awards}<span>Награды (${Object.keys(p.ach).length})</span></button>
    </nav>
  </div>`;

  document.getElementById('back').onclick = () => { cur.pid = null; go('home'); };
  document.getElementById('sndBtn').onclick = e => {
    const on = toggleSound();
    e.currentTarget.innerHTML = on ? UI_ICO.soundOn : UI_ICO.soundOff;
    e.currentTarget.dataset.sound = on ? 'on' : 'off';
    toast(on ? 'Звуки включены' : 'Звуки выключены', 1500);
  };
  document.getElementById('dockHome').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('tEn').onclick = () => startSession('en', 'mix');
  document.getElementById('tEnNew').onclick = () => startSession('en', 'new');
  document.getElementById('tEnRev').onclick = () => startSession('en', 'rev');
  document.getElementById('tRu').onclick = () => startSession('ru', 'mix');
  document.getElementById('tRuPhoto').onclick = () => startSession('ru', 'photo');
  document.getElementById('tRuFix').onclick = () => startSession('ru', 'fix');
  document.getElementById('gPairs').onclick = () => go('pairs');
  document.getElementById('gBlitz').onclick = () => go('blitz');
  document.getElementById('gMistakes').onclick = () => startSession('all', 'mistakes');
  document.getElementById('toWords').onclick = () => go('words');
  document.getElementById('toAwards').onclick = () => go('awards');
  const shopBtn = document.getElementById('openShop');
  if (shopBtn) shopBtn.onclick = () => go('shop');
  const gachaBtn = document.getElementById('openGacha');
  if (gachaBtn) gachaBtn.onclick = () => go('gacha');
  if (isSbr) bindSbrHero(app, p);
  else bindCozyRoom(app, p);
}

/* ---------- Настя: Магазин уюта ---------- */
function renderCozyShop() {
  const p = P();
  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button>
      <div class="title">Магазин уюта</div>
      <div class="spacer"></div>
      <span class="pill stat-pill">${UI_ICO.gem}<span>${p.world.gems || 0}</span></span>
    </div>
    <div class="cozy-stage" id="cozyHero">
      <div class="room-speech" id="roomSpeech">Украшай своё кафе — нажми на предметы в комнате, чтобы проверить их!</div>
      <div class="cozy-room-wrap" id="cozyRoomWrap">${renderCozyRoomSvg(p)}</div>
    </div>
    <div class="shop-grid">
      ${COZY_ITEMS.map(it => {
        const owned = (p.world.room || []).includes(it.id);
        return `<div class="shop-item ${owned ? 'owned' : ''}">
          <div class="em">${it.em}</div>
          <b>${esc(it.name)}</b>
          <div style="margin-top:8px">
            ${owned
              ? '<span class="status-ok small">В комнате</span>'
              : `<button class="btn small btn-ico" data-buy="${it.id}">${UI_ICO.gem}<span>${it.price}</span></button>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  document.getElementById('back').onclick = () => go('kid');
  bindCozyRoom(app, p);
  app.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    const it = COZY_ITEMS.find(x => x.id === b.dataset.buy);
    if (!it) return;
    if ((p.world.gems || 0) < it.price) { toast('Пока не хватает кристаллов — пройди тренировку!'); return; }
    p.world.gems -= it.price;
    p.world.room.push(it.id);
    p.world.t = Date.now();
    save(); confetti(18); playFanfare();
    if (typeof BG_FX !== 'undefined') BG_FX.burst(window.innerWidth / 2, window.innerHeight * 0.35, 18);
    toast(`${it.name} теперь в твоей комнате!`);
    renderCozyShop();
  });
}

/* ---------- Настя: Волшебные капсулы с питомцами ---------- */
function renderGacha(revealed) {
  const p = P();
  const caps = p.world.freeCapsules || 0;
  const cost = 120;
  const stageHtml = revealed
    ? `<div class="gacha-reveal pop">
        <div class="reveal-rays ${revealed.pet.rarity}">${renderPetSvg(revealed.pet.id, 'excited', 124)}</div>
        <span class="rarity ${revealed.pet.rarity}">${RARITY_RU[revealed.pet.rarity]}</span>
        <h2 style="margin:6px 0">${revealed.isNewPet ? '🎉 Новый питомец!' : '✨ Звёздная повторка!'}</h2>
        <div style="font-weight:800;font-size:1.15rem;margin-bottom:4px">${esc(revealed.pet.name)}</div>
        <p class="muted small">${revealed.isNewPet ? esc(revealed.pet.phrase) : 'Повторный питомец подарил тебе +50 💎!'}</p>
        <div style="margin-top:12px">
          <button class="btn ok" id="claimPet">💖 Супер! Взять с собой</button>
        </div>
      </div>`
    : `<div class="gacha-egg" id="gachaEgg">🥚✨</div>
      <h2>Открой капсулу с питомцем!</h2>
      <p class="muted small">Бесплатные капсулы даются за выполнение цели дня и идеальные тренировки</p>
      <div style="margin-top:14px">
        ${caps > 0
          ? `<button class="btn gold" id="openNow">🎁 Открыть бесплатную капсулу (${caps})</button>`
          : `<button class="btn" id="openNow">💎 Открыть за ${cost} кристаллов</button>`}
      </div>`;

  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button>
      <div class="title">Волшебные капсулы</div>
      <div class="spacer"></div>
      <span class="pill stat-pill">${UI_ICO.gem}<span>${p.world.gems || 0}</span></span>
    </div>
    <div class="gacha-box" id="gachaStage">${stageHtml}</div>
    <h3>Твои питомцы (${p.world.pets.length}/${COZY_PETS.length}) — нажми, чтобы взять на тренировку:</h3>
    <div class="shop-grid">
      ${COZY_PETS.map(pet => {
        const has = p.world.pets.includes(pet.id);
        const active = p.world.activePet === pet.id;
        return `<div class="shop-item pet-card ${active ? 'owned' : ''}" style="${has ? 'cursor:pointer' : 'opacity:.48;filter:grayscale(1)'}" data-pet="${has ? pet.id : ''}">
          <div class="pet-card-svg">${renderPetSvg(pet.id, active ? 'happy' : 'idle', 70)}</div>
          <b>${esc(pet.name)}</b><br>
          <span class="rarity ${pet.rarity}">${RARITY_RU[pet.rarity]}</span>
          <div class="small muted">${active ? '💖 Сейчас с тобой' : has ? 'Нажми, чтобы выбрать' : 'Ещё в капсуле'}</div>
        </div>`;
      }).join('')}
    </div>`;
  document.getElementById('back').onclick = () => go('kid');
  const claimBtn = document.getElementById('claimPet');
  if (claimBtn) claimBtn.onclick = () => { playPop(); renderGacha(); };
  const openBtn = document.getElementById('openNow');
  if (openBtn) {
    let opening = false;
    openBtn.onclick = () => {
      if (opening) return;
      if (caps > 0) p.world.freeCapsules--;
      else if ((p.world.gems || 0) >= cost) p.world.gems -= cost;
      else { toast('Не хватает 💎! Выполни тренировку или цель дня.'); return; }
      opening = true;
      openBtn.disabled = true;
      const egg = document.getElementById('gachaEgg');
      if (egg) egg.classList.add('gacha-shaking');
      playGachaCrack();
      const res = rollGachaPet(p);
      setTimeout(() => {
        if (cur.screen !== 'gacha') return;
        confetti(40); playFanfare();
        toast(res.isNewPet ? `🎉 Ура! Выпал новый питомец: ${res.pet.name}!` : `✨ Повторка ${res.pet.name} — возвращаем +50 💎!`, 3400);
        renderGacha(res);
      }, 650);
    };
  }
  app.querySelectorAll('[data-pet]').forEach(el => {
    if (!el.dataset.pet) return;
    el.onclick = () => {
      playPop();
      p.world.activePet = el.dataset.pet;
      p.world.t = Date.now();
      save();
      toast(`💖 ${petById(el.dataset.pet).name} теперь помогает тебе на тренировках!`);
      renderGacha();
    };
  });
}

/* ---------- Планировщик и движок сессии ---------- */
let ses = null;

function enTaskType(box) {
  const sp = canSpeak('en');
  if (box === 0) return 'learn';
  if (box === 1) return Math.random() < .5 ? 'choice_en_ru' : 'choice_ru_en';
  if (box === 2) return sp && Math.random() < .4 ? 'listen' : 'choice_ru_en';
  if (box === 3) return 'tiles';
  if (box === 4) return Math.random() < .5 ? 'tiles' : 'type';
  if (box === 5) return sp && Math.random() < .45 ? 'listen_type' : 'type';
  return sp && Math.random() < .35 ? 'listen_type' : 'type';
}
function ruTaskType(box, item, mode) {
  if (mode === 'photo') return 'ru_photo';
  if (mode === 'fix') return item.t === 's' ? 'ru_choice' : 'ru_fix';
  if (box === 0) return 'ru_learn';
  if (item.t === 's') return box <= 2 ? 'ru_choice' : 'ru_type';
  if (box === 1) return 'ru_choice';
  if (box === 2) return 'ru_gaps';
  if (box === 3) return Math.random() < .5 ? 'ru_gaps' : 'ru_fix';
  if (box === 4) return 'ru_photo';
  if (box === 5) return Math.random() < .5 ? 'ru_photo' : 'ru_type';
  return 'ru_type';
}

function startSession(subj, mode) {
  const p = P(), td = today();
  const isBoss = (p.id === 'andrey' && (mode === 'mistakes' || mode === 'fix'));
  let items = [];
  if (mode === 'mistakes') {
    const pool = Object.entries(p.cards)
      .filter(([id, c]) => c.bad > 0 && c.b < LEARNED_BOX && ITEM[id])
      .sort((a, b) => (b[1].bad - b[1].ok * .3) - (a[1].bad - a[1].ok * .3))
      .slice(0, 10).map(([id]) => ITEM[id]);
    if (!pool.length) { toast('🎉 Трудных слов сейчас нет!'); return; }
    items = pool.map(it => ({ it, subj: it.w !== undefined ? 'ru' : 'en' }));
  } else {
    const deck = deckOf(p, subj);
    if (!deck.length) { toast('В настройках не выбраны темы.'); return; }
    const due = shuffle(deck.filter(x => { const c = p.cards[x.id]; return c && c.b > 0 && c.due && c.due <= td; }));
    const fresh = deck.filter(x => isNew(p, x.id));
    const remNew = Math.max(0, p.set.newPerDay - dayTot(p).nw);
    const chosen = [];
    if (mode === 'new') {
      chosen.push(...fresh.slice(0, Math.min(6, Math.max(3, remNew))));
    } else if (mode === 'rev') {
      chosen.push(...due.slice(0, 10));
      if (chosen.length < 8) chosen.push(...shuffle(deck.filter(x => !isNew(p, x.id) && !chosen.includes(x))).slice(0, 8 - chosen.length));
    } else if (mode === 'photo' || mode === 'fix') {
      const seen = shuffle(deck.filter(x => !isNew(p, x.id)));
      chosen.push(...(seen.length >= 6 ? seen : deck).slice(0, 8));
    } else {
      chosen.push(...due.slice(0, 7));
      const needNew = Math.min(remNew, Math.max(2, 9 - chosen.length), fresh.length);
      chosen.push(...fresh.slice(0, needNew));
      if (chosen.length < 8) {
        const weak = deck.filter(x => !chosen.includes(x) && !isNew(p, x.id))
          .sort((a, b) => (p.cards[a.id].b || 0) - (p.cards[b.id].b || 0));
        chosen.push(...weak.slice(0, 8 - chosen.length));
      }
      if (chosen.length < 6) chosen.push(...fresh.filter(x => !chosen.includes(x)).slice(0, 6 - chosen.length));
    }
    if (!chosen.length) { toast('Все слова пройдены! Выбери «Повторение».'); return; }
    items = chosen.map(it => ({ it, subj }));
  }
  const tasks = [];
  items.forEach(({ it, subj: sj }) => {
    const box = p.cards[it.id]?.b || 0;
    const type = sj === 'en' ? enTaskType(box) : ruTaskType(box, it, mode);
    tasks.push({ it, subj: sj, type, retry: false });
    if (type === 'learn') tasks.push({ it, subj: sj, type: 'choice_en_ru', retry: false, afterLearn: true });
    if (type === 'ru_learn') tasks.push({ it, subj: sj, type: it.t === 's' ? 'ru_choice' : 'ru_gaps', retry: false, afterLearn: true });
  });
  ses = {
    subj, mode, tasks, i: 0, ok: 0, bad: 0, xp: 0, gems: 0,
    combo: 0, comboMax: 0,
    boss: isBoss, bossHp: isBoss ? items.length : 0, bossMaxHp: isBoss ? items.length : 0,
    t0: Date.now(), qStart: Date.now(), respTimes: []
  };
  go('session');
}

function renderTask() {
  if (!ses || ses.i >= ses.tasks.length) { finishSession(); return; }
  cur.active = true;
  ses.qStart = Date.now();
  const t = ses.tasks[ses.i], p = P();
  const pct = Math.round(ses.i / ses.tasks.length * 100);
  const hud = p.id === 'andrey'
    ? (ses.boss ? renderBossHud(ses.bossHp, ses.bossMaxHp, 'idle') : renderSpinHud(ses.combo, 'idle'))
    : renderPetCheer(p, null, 'idle', ses.combo);

  app.innerHTML = `<div class="ex">
    <div class="progress">
      <button class="icon-btn" id="quit" title="Выйти" aria-label="Выйти">${UI_ICO.close}</button>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <span class="small muted">${ses.i + 1}/${ses.tasks.length}</span>
    </div>
    <div id="heroHudWrap">${hud}</div>
    <div class="card prompt pop" id="stage"></div>
    <div id="fb"></div>
  </div>`;
  document.getElementById('quit').onclick = () => { ses = null; go('kid'); };
  const stage = document.getElementById('stage');
  ({
    learn: tLearn, choice_en_ru: tChoice, choice_ru_en: tChoice, listen: tChoice,
    tiles: tTiles, type: tType, listen_type: tType,
    ru_learn: tRuLearn, ru_choice: tRuChoice, ru_gaps: tRuGaps, ru_photo: tRuPhoto, ru_fix: tRuFix, ru_type: tRuType
  })[t.type](stage, t);
}

function grade(t, ok, userAns, rightText) {
  const p = P(), c = touch(card(p, t.it.id)), r = dayRec(p);
  const dt = Math.min(30000, Date.now() - (ses.qStart || Date.now()));
  ses.respTimes.push(dt);
  let gain = 0, gGain = 0;
  if (t.type !== 'learn' && t.type !== 'ru_learn') {
    if (ok) {
      ses.ok++; ses.combo++;
      if (ses.combo > ses.comboMax) ses.comboMax = ses.combo;
      const mult = p.id === 'andrey' ? (ses.combo >= 5 ? 5 : ses.combo >= 3 ? 3 : ses.combo >= 2 ? 2 : 1) : 1;
      gain = (t.retry ? 5 : 10) + (mult > 1 ? mult * 2 : 0);
      ses.xp += gain; p.xp += gain;
      if (typeof BG_FX !== 'undefined') BG_FX.burst(window.innerWidth / 2, window.innerHeight * 0.36, 15);
      if (p.id === 'andrey') {
        if (ses.combo > (p.world.spinBest || 0)) p.world.spinBest = ses.combo;
        if (ses.boss && ses.bossHp > 0) ses.bossHp--;
        if (ses.combo >= 2) showSfx(SBR_SFX[Math.min(SBR_SFX.length - 1, ses.combo - 2)]);
        if (ses.boss) { playHit(); floatReward('💥 -1 HP!', 'hit'); }
        else { beep(true, ses.combo); floatReward(`+${gain} ⭐`, 'xp'); }
      } else {
        gGain = ses.combo >= 3 ? 12 : 8;
        ses.gems += gGain; p.world.gems = (p.world.gems || 0) + gGain;
        beep(true, ses.combo);
        floatReward(`+${gGain} 💎`, 'gem');
      }
      p.world.t = Date.now();
      r.ok++;
      if (!t.retry) {
        if (c.b === 0) r.nw++;
        c.b = Math.min(MAX_BOX, c.b + 1); c.ok++;
        c.due = addDays(today(), INTERVALS[c.b]);
      }
    } else {
      ses.bad++; ses.combo = 0; r.bad++;
      r.errs[t.it.id] = (r.errs[t.it.id] || 0) + 1;
      c.bad++; if (userAns) c.wr = userAns;
      c.b = Math.max(1, Math.min(c.b || 1, 2)); c.due = today();
      if (!t.retry) {
        const easier = t.subj === 'en' ? (t.type === 'type' || t.type === 'listen_type' ? 'tiles' : 'choice_en_ru')
          : (t.it.t === 's' ? 'ru_choice' : 'ru_gaps');
        ses.tasks.splice(Math.min(ses.tasks.length, ses.i + 3), 0, { it: t.it, subj: t.subj, type: easier, retry: true });
      }
      beep(false);
    }
    save();
    const hudWrap = document.getElementById('heroHudWrap');
    if (hudWrap) {
      if (p.id === 'andrey') {
        hudWrap.innerHTML = ses.boss
          ? renderBossHud(ses.bossHp, ses.bossMaxHp, ok ? 'hit' : 'taunt')
          : renderSpinHud(ses.combo, ok ? (ses.combo >= 2 ? 'excited' : 'happy') : 'cheer');
      } else {
        hudWrap.innerHTML = renderPetCheer(
          p,
          ok ? pick(PET_HAPPY_PHRASES) : pick(PET_CHEER_PHRASES),
          ok ? (ses.combo >= 3 ? 'excited' : 'happy') : 'cheer',
          ses.combo
        );
      }
    }
  }
  const PRAISE = p.id === 'andrey'
    ? ['Золотое вращение!', 'Точно в цель!', 'Отличный рывок!', 'Чистая победа!']
    : ['Умничка!', 'Супер!', 'Блестяще!', 'Волшебно!'];
  const fb = document.getElementById('fb');
  const mn = c.mn ? `<div class="mnemo small">💡 Твоя подсказка: ${esc(c.mn)}</div>` : '';
  const wrongDiff = (!ok && t.subj === 'ru' && userAns && rightText)
    ? `<div class="small" style="margin-top:4px">Было: <span class="wrongword">${diffMark(userAns, rightText)}</span></div>` : '';
  fb.innerHTML = `<div class="feedback ${ok ? 'good' : 'badf'} pop">
    <div style="flex:1">
      <div class="big">${ok ? '✅ ' + pick(PRAISE) : '💡 Запомни правильно:'}</div>
      ${rightText ? `<div style="margin-top:4px">${rightText}</div>` : ''}
      ${wrongDiff}${mn}
    </div>
    <button class="btn ${ok ? 'ok' : 'bad'}" id="nextBtn">Дальше →</button>
  </div>`;
  const nb = document.getElementById('nextBtn');
  nb.onclick = () => { ses.i++; renderTask(); };
  nb.focus();
}

/* ---------- Упражнения: Английский ---------- */
function tLearn(el, t) {
  const w = t.it;
  el.innerHTML = `<div class="q">Новое слово — запомни и послушай</div>
    <div class="emoji">${w.e || '✨'}</div>
    <div class="word">${esc(w.en)}</div>
    <div class="tr">[${esc(w.tr)}]</div>
    <div style="font-size:1.35rem;font-weight:700;margin:10px 0">${esc(w.ru)}</div>
    <div class="row" style="justify-content:center;margin:12px 0">
      <button class="btn ghost" id="sp">🔊 Послушать</button>
      <button class="btn ghost" id="spSlow">🐢 Медленно</button>
      ${SR ? '<button class="btn ghost" id="say">🎤 Произнести</button>' : ''}
    </div>
    <div id="sayRes" class="small muted"></div>
    <button class="btn ok big" id="got" style="margin-top:10px">Запомнил — дальше →</button>`;
  speak(w.en, 'en');
  document.getElementById('sp').onclick = () => speak(w.en, 'en', .88);
  document.getElementById('spSlow').onclick = () => speak(w.en, 'en', .55);
  if (SR) document.getElementById('say').onclick = () => listenWord(w.en, document.getElementById('sayRes'));
  document.getElementById('got').onclick = () => {
    const p = P(), c = touch(card(p, w.id));
    if (c.b === 0) { c.b = 1; c.due = today(); dayRec(p).nw++; save(); }
    ses.i++; renderTask();
  };
}

function listenWord(target, out) {
  out.textContent = '🎤 Говори…';
  const check = said => {
    const clean = s => s.toLowerCase().replace(/[^a-z ]/g, '').trim();
    const ok = lev(clean(said), clean(target)) <= Math.max(1, Math.floor(target.length / 5));
    out.innerHTML = ok ? `✅ Отлично! Услышано: «${esc(said)}»` : `Попробуй ещё раз (услышано: «${esc(said)}»)`;
    if (ok) beep(true);
  };
  if (SR === 'android') {
    window._onSr = (ok, txt) => { if (ok) check(txt); else out.textContent = 'Не расслышал — попробуй ещё'; };
    try { AB.listen('en-GB'); } catch (e) { out.textContent = 'Микрофон недоступен'; }
    return;
  }
  try {
    const r = new SR(); r.lang = 'en-GB'; r.interimResults = false;
    r.onresult = e => check(e.results[0][0].transcript);
    r.onerror = () => out.textContent = 'Не расслышал — попробуй ещё';
    r.start();
  } catch (e) { out.textContent = 'Микрофон недоступен'; }
}

function tChoice(el, t) {
  const w = t.it, p = P(), pool = deckOf(p, 'en');
  const enToRu = t.type === 'choice_en_ru' || t.type === 'listen';
  const distract = shuffle(pool.filter(x => x.id !== w.id && (enToRu ? x.ru !== w.ru : x.en !== w.en))).slice(0, 3);
  const opts = shuffle([w, ...distract]);
  el.innerHTML = `<div class="q">${t.type === 'listen' ? 'Послушай и выбери перевод' : enToRu ? 'Выбери перевод' : 'Как это по-английски?'}</div>
    ${t.type === 'listen' ? `<button class="btn" id="sp" style="margin:10px 0">🔊 Послушать слово</button>`
      : `<div class="emoji">${w.e || '📘'}</div><div class="word">${esc(enToRu ? w.en : w.ru)}</div>${enToRu ? `<div class="tr">[${esc(w.tr)}] <button class="btn small ghost" id="sp">🔊</button></div>` : ''}`}
    <div class="opts">${opts.map((o, idx) => `<button class="opt" data-i="${idx}">${esc(enToRu ? o.ru : o.en)}</button>`).join('')}</div>`;
  if (enToRu) { speak(w.en, 'en'); const sb = document.getElementById('sp'); if (sb) sb.onclick = () => speak(w.en, 'en'); }
  let done = false;
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (done) return; done = true;
    const o = opts[+b.dataset.i], ok = o.id === w.id;
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) el.querySelectorAll('.opt')[opts.findIndex(x => x.id === w.id)].classList.add('right');
    if (!enToRu) speak(w.en, 'en');
    grade(t, ok, enToRu ? o.ru : o.en, `<b>${esc(w.en)}</b> [${esc(w.tr)}] — ${esc(w.ru)}`);
  });
}

function tTiles(el, t) {
  const w = t.it, target = w.en.replace(/!/g, ''), letters = [...target];
  let pool = shuffle(letters.map((ch, i) => ({ ch, i, used: false }))), chosen = [];
  el.innerHTML = `<div class="q">Собери английское слово</div>
    <div class="emoji">${w.e || '🧩'}</div>
    <div class="word">${esc(w.ru)}</div>
    <div class="tiles slots" id="slots"></div>
    <div class="tiles" id="pool"></div>
    <div class="row" style="justify-content:center;margin-top:8px">
      <button class="btn ghost small" id="hint">💡 Подсказка</button>
      <button class="btn ghost small" id="clr">Очистить</button>
      <button class="btn ok" id="chk" disabled>Проверить</button>
    </div>`;
  const slotsEl = document.getElementById('slots'), poolEl = document.getElementById('pool'), chk = document.getElementById('chk');
  let usedHint = false;
  function draw() {
    slotsEl.innerHTML = chosen.map((p, k) => `<button class="tl" data-s="${k}">${p.ch === ' ' ? '␣' : esc(p.ch)}</button>`).join('') || '<span class="muted small">Нажимай на буквы ниже</span>';
    poolEl.innerHTML = pool.map((p, k) => `<button class="tl ${p.used ? 'used' : ''}" data-p="${k}">${p.ch === ' ' ? '␣' : esc(p.ch)}</button>`).join('');
    chk.disabled = chosen.length !== letters.length;
    slotsEl.querySelectorAll('.tl').forEach(b => b.onclick = () => { const x = chosen.splice(+b.dataset.s, 1)[0]; x.used = false; draw(); });
    poolEl.querySelectorAll('.tl').forEach(b => b.onclick = () => { const x = pool[+b.dataset.p]; if (x.used) return; x.used = true; chosen.push(x); draw(); });
  }
  draw();
  document.getElementById('clr').onclick = () => { pool.forEach(x => x.used = false); chosen = []; draw(); };
  document.getElementById('hint').onclick = () => {
    usedHint = true;
    const nextCh = letters[chosen.length];
    const found = pool.find(x => !x.used && x.ch === nextCh);
    if (found) { found.used = true; chosen.push(found); draw(); }
  };
  chk.onclick = () => {
    const ans = chosen.map(x => x.ch).join('');
    const ok = ans.toLowerCase() === target.toLowerCase() && !usedHint;
    speak(w.en, 'en');
    chk.disabled = true;
    grade(t, ok, ans, `<b>${esc(w.en)}</b> [${esc(w.tr)}] — ${esc(w.ru)}`);
  };
}

function tType(el, t) {
  const w = t.it, listen = t.type === 'listen_type';
  el.innerHTML = `<div class="q">${listen ? 'Послушай и напиши по-английски' : 'Напиши по-английски'}</div>
    ${listen ? `<button class="btn" id="sp" style="margin:8px 0">🔊 Послушать</button> <button class="btn ghost small" id="spS">🐢</button>`
      : `<div class="emoji">${w.e || '⌨️'}</div><div class="word">${esc(w.ru)}</div>`}
    <div style="margin-top:14px"><input class="answer-input" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Введи слово…"></div>
    <div class="row" style="justify-content:center;margin-top:12px">
      <button class="btn ghost small" id="hint">💡 Первая буква</button>
      <button class="btn ok" id="chk">Проверить</button>
    </div>`;
  const inp = document.getElementById('inp'); inp.focus();
  if (listen) { speak(w.en, 'en'); document.getElementById('sp').onclick = () => speak(w.en, 'en'); document.getElementById('spS').onclick = () => speak(w.en, 'en', .55); }
  document.getElementById('hint').onclick = () => { inp.value = w.en.slice(0, Math.min(w.en.length, (inp.value.length || 0) + 1)); inp.focus(); };
  function check() {
    const raw = inp.value.trim(); if (!raw) return;
    inp.disabled = true; document.getElementById('chk').disabled = true;
    const norm = s => s.toLowerCase().replace(/[!?.,]/g, '').replace(/\s+/g, ' ').trim();
    const ok = norm(raw) === norm(w.en);
    speak(w.en, 'en');
    grade(t, ok, raw, `<b>${esc(w.en)}</b> [${esc(w.tr)}] — ${esc(w.ru)}`);
  }
  document.getElementById('chk').onclick = check;
  inp.onkeydown = e => { if (e.key === 'Enter') check(); };
}

/* ---------- Упражнения: Русский язык ---------- */
function tRuLearn(el, t) {
  const it = t.it, p = P(), c = card(p, it.id), word = ruWordOf(it);
  el.innerHTML = `<div class="q">Запомни словарное слово (${it.g} класс)</div>
    <div class="ruword" style="margin:12px 0">${it.t === 's' ? esc(word) : ruHighlight(it)}</div>
    <div class="muted" style="margin-bottom:8px">Проговори по слогам, как пишется: <b>${esc(syllables(word))}</b></div>
    <div class="row" style="justify-content:center;margin:10px 0">
      ${canSpeak('ru') ? '<button class="btn ghost small" id="sp">🔊 Послушать</button>' : ''}
    </div>
    <div class="mnemo">
      <div class="small"><b>💡 Своя подсказка (необязательно):</b></div>
      <textarea class="mn" id="mn" placeholder="Например: барьер — мягкий, а объявление — твёрдый…">${esc(c.mn || '')}</textarea>
    </div>
    <button class="btn ok big" id="got" style="margin-top:12px">Запомнил — проверить себя →</button>`;
  if (canSpeak('ru')) { speak(word, 'ru'); document.getElementById('sp').onclick = () => speak(word, 'ru', .75); }
  document.getElementById('got').onclick = () => {
    const v = document.getElementById('mn').value.trim();
    if (v) c.mn = v;
    touch(c);
    if (c.b === 0) { c.b = 1; c.due = today(); dayRec(p).nw++; }
    save(); checkAch();
    ses.i++; renderTask();
  };
}

function tRuChoice(el, t) {
  const it = t.it;
  let correct, variants;
  if (it.t === 's') ({ correct, variants } = spaceVariants(it));
  else { correct = ruParse(it).word; variants = shuffle([correct, ...ruWrongVariants(it, 2)]); }
  el.innerHTML = `<div class="q">Какое слово написано правильно?</div>
    <div class="opts" style="grid-template-columns:1fr">${variants.map((v, i) => `<button class="opt" style="font-size:1.35rem" data-i="${i}">${esc(v)}</button>`).join('')}</div>`;
  let done = false;
  el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (done) return; done = true;
    const v = variants[+b.dataset.i], ok = v === correct;
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) el.querySelectorAll('.opt')[variants.indexOf(correct)].classList.add('right');
    grade(t, ok, v, `<span style="font-size:1.25rem;font-weight:800">${it.t === 's' ? esc(correct) : ruHighlight(it)}</span>`);
  });
}

function tRuGaps(el, t) {
  const it = t.it, pr = ruParse(it), gaps = pr.segs.filter(s => s.gap);
  const picks = gaps.map(() => null); let curG = 0;
  function draw() {
    let k = 0, first = true;
    const wordHtml = pr.segs.map(s => {
      if (!s.gap) { let tx = s.t; if (first && pr.cap) tx = tx[0].toUpperCase() + tx.slice(1); first = false; return esc(tx); }
      const gi = k++, v = picks[gi]; first = false;
      const shown = v === null ? '_' : (v === '' ? '∅' : v);
      return `<span class="gap ${gi === curG ? 'cur' : ''} tap" data-g="${gi}">${esc(shown)}</span>`;
    }).join('');
    const opts = shuffle(gaps[curG].opts);
    el.innerHTML = `<div class="q">Вставь пропущенную букву</div>
      <div class="ruword" style="margin:14px 0">${wordHtml}</div>
      <div class="opts">${opts.map(o => `<button class="opt" style="font-size:1.4rem" data-o="${esc(o)}">${o === '' ? 'без буквы' : esc(o)}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-g]').forEach(g => g.onclick = () => { curG = +g.dataset.g; draw(); });
    el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      picks[curG] = b.dataset.o;
      const next = picks.indexOf(null);
      if (next >= 0) { curG = next; draw(); return; }
      const built = ruBuild(pr, picks), ok = built === pr.word;
      grade(t, ok, built, `<span style="font-size:1.25rem;font-weight:800">${ruHighlight(it)}</span>`);
    });
  }
  draw();
}

function tRuPhoto(el, t) {
  const it = t.it, word = ruWordOf(it);
  el.innerHTML = `<div class="q">📸 Запомни слово глазами (3 секунды)</div>
    <div class="ruword" style="margin:24px 0">${it.t === 's' ? esc(word) : ruHighlight(it)}</div>
    <div class="muted small">Проговори по слогам: ${esc(syllables(word))}</div>`;
  const goType = () => {
    clearTimeout(tm);
    el.onclick = null;
    if (cur.screen === 'session' && ses && ses.tasks[ses.i] === t) tRuType(el, t, true);
  };
  const tm = setTimeout(goType, 3200);
  el.onclick = goType;
}

function tRuFix(el, t) {
  const it = t.it, wrong = ruWrongVariants(it, 1)[0] || ruParse(it).word, right = ruParse(it).word;
  el.innerHTML = `<div class="q">🔍 В этом слове спрятана ошибка — напиши правильно!</div>
    <div class="ruword" style="color:var(--bad);margin:10px 0">${esc(wrong)}</div>
    <input class="answer-input" id="inp" autocomplete="off" spellcheck="false" value="${esc(wrong)}">
    <div style="margin-top:12px"><button class="btn ok" id="chk">Исправить</button></div>`;
  const inp = document.getElementById('inp'); inp.focus(); inp.select();
  const goChk = () => {
    const v = inp.value.trim(); if (!v) return;
    inp.disabled = true; document.getElementById('chk').disabled = true;
    const ok = v.toLowerCase() === right.toLowerCase();
    grade(t, ok, v, `<span style="font-size:1.25rem;font-weight:800">${ruHighlight(it)}</span>`);
  };
  document.getElementById('chk').onclick = goChk;
  inp.onkeydown = e => { if (e.key === 'Enter') goChk(); };
}

function tRuType(el, t, fromPhoto) {
  const it = t.it, word = ruWordOf(it);
  el.innerHTML = `<div class="q">${fromPhoto ? 'Теперь напиши слово по памяти' : 'Напиши слово правильно'}</div>
    ${canSpeak('ru') && !fromPhoto ? `<button class="btn" id="sp" style="margin:8px 0">🔊 Послушать слово</button>` : ''}
    ${!fromPhoto && !canSpeak('ru') ? `<div class="ruword" style="margin:10px 0">${esc(word.replace(/[аеёиоуыэюя]/gi, (m, idx) => idx === 0 ? m : '·'))}</div>` : ''}
    <div style="margin-top:14px"><input class="answer-input" id="inp" autocomplete="off" spellcheck="false" placeholder="Напиши слово…"></div>
    <div style="margin-top:12px"><button class="btn ok" id="chk">Проверить</button></div>`;
  if (canSpeak('ru') && !fromPhoto) { speak(word, 'ru', .75); document.getElementById('sp').onclick = () => speak(word, 'ru', .75); }
  const inp = document.getElementById('inp'); inp.focus();
  const goChk = () => {
    const v = inp.value.trim(); if (!v) return;
    inp.disabled = true; document.getElementById('chk').disabled = true;
    const ok = v.toLowerCase() === word.toLowerCase();
    grade(t, ok, v, `<span style="font-size:1.25rem;font-weight:800">${it.t === 's' ? esc(word) : ruHighlight(it)}</span>`);
  };
  document.getElementById('chk').onclick = goChk;
  inp.onkeydown = e => { if (e.key === 'Enter') goChk(); };
}

/* ---------- Завершение сессии ---------- */
function finishSession() {
  const p = P(), r = dayRec(p), s = ses; ses = null;
  const durSec = Math.max(10, Math.round((Date.now() - s.t0) / 1000));
  r.ses++;
  const total = s.ok + s.bad, pct = total ? Math.round(s.ok / total * 100) : 100;
  const stars = pct >= 95 ? 3 : pct >= 75 ? 2 : 1;
  const perfect = total >= 4 && s.bad === 0;
  const bossWin = !!(s.boss && s.bossHp === 0);
  const avgMs = s.respTimes.length ? Math.round(s.respTimes.reduce((a, b) => a + b, 0) / s.respTimes.length) : 0;

  if (bossWin && p.id === 'andrey') {
    p.world.bossWins = (p.world.bossWins || 0) + 1;
    p.xp += 40;
  }
  if (perfect && p.id === 'nastya') {
    p.world.freeCapsules = (p.world.freeCapsules || 0) + 1;
    p.world.gems = (p.world.gems || 0) + 30;
  }
  p.world.t = Date.now();

  logSessionTelemetry(p, {
    subj: s.subj, mode: s.mode, ok: s.ok, bad: s.bad, pct,
    durSec, avgMs, comboMax: s.comboMax, bossWin
  });

  save(); checkGoal(); checkAch({ perfect, comboMax: s.comboMax, bossWin });
  if (stars === 3 || bossWin) { confetti(35); playFanfare(); }

  const worldBonus = p.id === 'andrey'
    ? (bossWin ? '⚔️ Соперник повержен! +40 бонусных ⭐!' : `🌀 Макс. серия вращения: ×${s.comboMax}`)
    : `💎 Заработано кристаллов: +${s.gems}${perfect ? ' + 🎁 Бесплатная капсула за идеальную тренировку!' : ''}`;

  app.innerHTML = `<div class="ex card center pop">
    <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <h1>${bossWin ? '⚔️ Победа в дуэли!' : stars === 3 ? 'Блестяще!' : stars === 2 ? 'Хорошая работа!' : 'Тренировка пройдена!'}</h1>
    <p class="muted">Верно: <b>${s.ok}</b> из ${total} (${pct}%) · +${s.xp} ⭐</p>
    <p style="font-weight:700;color:var(--accent)">${worldBonus}</p>
    <div class="row" style="justify-content:center;margin-top:16px">
      <button class="btn ok" id="again">Ещё тренировку</button>
      <button class="btn ghost" id="home">На главную</button>
    </div>
  </div>`;
  document.getElementById('again').onclick = () => startSession(s.subj, s.mode);
  document.getElementById('home').onclick = () => go('kid');
}

/* ---------- Мини-игры: Пары и Блиц ---------- */
function startPairs() {
  const p = P(), deck = enDeck(p);
  if (deck.length < 6) { toast('Нужно хотя бы 6 слов в теме'); return; }
  const words = shuffle(deck).slice(0, 6);
  const cards = shuffle([
    ...words.map(w => ({ id: w.id, text: w.en, kind: 'en' })),
    ...words.map(w => ({ id: w.id, text: w.ru, kind: 'ru' }))
  ]);
  let open = [], done = new Set(), moves = 0, streakPairs = 0, t0 = Date.now();
  cur.active = true;
  function draw() {
    app.innerHTML = `<div class="ex">
      <div class="topbar"><button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button><div class="title">Найди пары</div><div class="spacer"></div><span class="pill">Ходов: ${moves}</span></div>
      <div class="pairs">${cards.map((c, i) => {
        const isD = done.has(c.id), isO = open.includes(i);
        return `<button class="pc ${isD ? 'done' : isO ? 'open flip-in' : ''}" data-i="${i}">${isD || isO ? esc(c.text) : '?'}</button>`;
      }).join('')}</div>
    </div>`;
    document.getElementById('back').onclick = () => go('kid');
    app.querySelectorAll('.pc').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (done.has(cards[i].id) || open.includes(i) || open.length === 2) return;
      playPop();
      open.push(i);
      if (cards[i].kind === 'en') speak(cards[i].text, 'en');
      draw();
      if (open.length === 2) {
        moves++;
        const [a, b2] = open;
        if (cards[a].id === cards[b2].id) {
          streakPairs++;
          done.add(cards[a].id); open = []; beep(true, streakPairs);
          floatReward(streakPairs >= 2 ? `✨ Пара ×${streakPairs}!` : '✨ Пара!', 'gem');
          if (done.size === words.length) {
            const sec = Math.round((Date.now() - t0) / 1000);
            dayRec(p).games++; p.xp += 30;
            if (p.id === 'nastya') { p.world.gems = (p.world.gems || 0) + 35; p.world.t = Date.now(); }
            save(); checkAch({ pairsFast: sec < 60 }); confetti(25); playFanfare();
            toast(`🎉 Все пары найдены за ${sec} сек! +30 ⭐`, 3200);
            setTimeout(() => go('kid'), 1600);
          } else draw();
        } else {
          streakPairs = 0;
          beep(false);
          setTimeout(() => { open = []; draw(); }, 700);
        }
      }
    });
  }
  draw();
}

function startBlitz() {
  const p = P(), deck = enDeck(p);
  if (deck.length < 4) { toast('Мало слов в теме'); return; }
  let left = 60, score = 0, bCombo = 0, timer = null;
  cur.active = true;
  function nextQ() {
    if (left <= 0) return;
    const w = pick(deck), opts = shuffle([w, ...shuffle(deck.filter(x => x.id !== w.id && x.ru !== w.ru)).slice(0, 3)]);
    app.innerHTML = `<div class="ex">
      <div class="topbar"><button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button><div class="title">Блиц 60 сек</div><div class="spacer"></div><span class="pill timer ${left <= 10 ? 'urgent' : ''}" id="tm">⏱ ${left}</span><span class="pill stat-pill">${UI_ICO.star}<span>${score}</span></span></div>
      <div class="card center pop">
        ${bCombo >= 3 ? `<div class="combo-chip" style="margin-bottom:6px">🔥 Серия ×${bCombo}</div>` : ''}
        <div class="blitz-q">${esc(w.en)}</div>
        <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.ru)}</button>`).join('')}</div>
      </div>
    </div>`;
    document.getElementById('back').onclick = () => { clearInterval(timer); go('kid'); };
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.i].id === w.id;
      if (ok) {
        score++; bCombo++;
        beep(true, bCombo);
        floatReward(bCombo >= 3 ? `🔥 ×${bCombo}` : '+1 ⚡', 'xp');
      } else {
        bCombo = 0;
        beep(false);
      }
      nextQ();
    });
  }
  timer = setInterval(() => {
    left--;
    const tEl = document.getElementById('tm');
    if (tEl) {
      tEl.textContent = '⏱ ' + left;
      if (left <= 10) tEl.classList.add('urgent');
    }
    if (left <= 0) {
      clearInterval(timer);
      dayRec(p).games++; p.xp += score * 2;
      if (p.id === 'nastya') { p.world.gems = (p.world.gems || 0) + score * 2; p.world.t = Date.now(); }
      if (score > (p.bestBlitz || 0)) p.bestBlitz = score;
      save(); checkAch({ blitz: score }); confetti(25); playFanfare();
      app.innerHTML = `<div class="ex card center pop">
        <h1>⚡ Блиц окончен!</h1>
        <p style="font-size:1.5rem">Счёт: <b>${score}</b> · Рекорд: <b>${p.bestBlitz}</b></p>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn ok" id="ag">Ещё раз</button>
          <button class="btn ghost" id="hm">На главную</button>
        </div>
      </div>`;
      document.getElementById('ag').onclick = startBlitz;
      document.getElementById('hm').onclick = () => go('kid');
    }
  }, 1000);
  nextQ();
}

/* ---------- Словарь и Награды ---------- */
function renderWords() {
  const p = P(), en = enDeck(p), ru = ruDeck(p);
  const lvlStr = b => '●'.repeat(Math.min(5, b || 0)) + '○'.repeat(Math.max(0, 5 - (b || 0)));
  app.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button><div class="title">Мои слова</div></div>
    <details class="unit" open><summary>Английский (${en.length})</summary>
      <table class="wl">${en.map(w => `<tr><td><b>${esc(w.en)}</b><div class="small muted">${esc(w.ru)}</div></td><td class="lvl" style="text-align:right">${lvlStr(p.cards[w.id]?.b)}</td></tr>`).join('')}</table>
    </details>
    <details class="unit"><summary>Словарные слова (${ru.length})</summary>
      <table class="wl">${ru.map(w => `<tr><td><b>${esc(ruWordOf(w))}</b> <span class="small muted">${w.g} кл.</span></td><td class="lvl" style="text-align:right">${lvlStr(p.cards[w.id]?.b)}</td></tr>`).join('')}</table>
    </details>`;
  document.getElementById('back').onclick = () => go('kid');
}

function renderAwards() {
  const p = P();
  const extra = p.id === 'andrey'
    ? `<div class="card" style="margin-bottom:14px"><h3>Артефакты Steel Ball Run (${p.world.artifacts.length}/9)</h3>
        <div class="row">${p.world.artifacts.length ? p.world.artifacts.map(a => `<span class="pill">${esc(a)}</span>`).join('') : '<span class="muted small">Пройди этапы гонки (от 70% слов юнита), чтобы открыть артефакты!</span>'}</div></div>`
    : `<div class="card" style="margin-bottom:14px"><h3>Коллекция питомцев (${p.world.pets.length}/${COZY_PETS.length})</h3>
        <div class="row">${p.world.pets.map(id => { const pet = petById(id); return `<span class="pill pet-award-pill">${renderPetSvg(pet.id, 'idle', 26)} ${esc(pet.name)}</span>`; }).join('')}</div></div>`;
  app.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button><div class="title">${p.id === 'andrey' ? 'Трофеи и награды' : 'Альбом наклеек'}</div></div>
    ${extra}
    <div class="badges">${ACH.map(([id, em, name, desc]) => {
      const got = p.ach[id];
      return `<div class="badge ${got ? '' : 'locked'}"><div class="em">${em}</div><b>${name}</b><div class="small muted">${desc}</div>${got ? `<div class="small" style="color:var(--ok);margin-top:4px">${fmtDate(got)}</div>` : ''}</div>`;
    }).join('')}</div>`;
  document.getElementById('back').onclick = () => go('kid');
}

/* ---------- ПИН-код ---------- */
function renderPin(arg) {
  const isKid = arg && arg.target === 'kid';
  const expected = isKid ? KID_PIN[arg.pid] : PARENT_PIN;
  app.innerHTML = `<div class="ex card center" style="margin-top:30px">
    <h2>🔐 ${isKid ? 'Код профиля ' + S.profiles[arg.pid].name : 'Вход для родителей'}</h2>
    <div class="pin"><input type="password" inputmode="numeric" maxlength="4" id="pinInp" style="width:160px;letter-spacing:10px"></div>
    <div class="row" style="justify-content:center">
      <button class="btn ghost" id="cancel">Назад</button>
      <button class="btn ok" id="enter">Войти</button>
    </div>
  </div>`;
  const inp = document.getElementById('pinInp'); inp.focus();
  const check = () => {
    if (inp.value === expected) go(isKid ? 'kid' : 'parent');
    else { inp.classList.add('shake'); inp.value = ''; setTimeout(() => inp.classList.remove('shake'), 350); }
  };
  document.getElementById('enter').onclick = check;
  inp.onkeydown = e => { if (e.key === 'Enter') check(); };
  document.getElementById('cancel').onclick = () => go('home');
}

/* ---------- Панель родителей + AI-дайджест ---------- */
function renderParent() {
  const kidCards = ['nastya', 'andrey'].map(id => {
    const p = S.profiles[id], g = goalState(p), st = streak(p);
    const hard = Object.entries(p.cards).filter(([wid, c]) => c.bad > 0 && ITEM[wid])
      .sort((a, b) => b[1].bad - a[1].bad).slice(0, 6)
      .map(([wid, c]) => { const it = ITEM[wid]; return `${it.w !== undefined ? ruWordOf(it) : it.en} (${c.bad} ош.)`; });
    return `<div class="card" style="margin-bottom:14px">
      <h3>${p.avatar} ${p.name} (${p.grade} кл.) · Уровень ${level(p.xp)}</h3>
      <div class="kpis">
        <div class="kpi"><b>${g.min}/${p.set.goalMin} мин</b><span>Сегодня</span></div>
        <div class="kpi"><b>🔥 ${st}</b><span>Дней подряд</span></div>
        <div class="kpi"><b>${learnedCount(p)}</b><span>Выучено слов</span></div>
        <div class="kpi"><b>${p.id === 'andrey' ? '×' + (p.world.spinBest || 0) : '💎 ' + (p.world.gems || 0)}</b><span>${p.id === 'andrey' ? 'Макс. Spin' : 'Кристаллы'}</span></div>
      </div>
      <div class="small muted"><b>Трудные слова:</b> ${hard.length ? esc(hard.join(', ')) : 'пока нет'}</div>
    </div>`;
  }).join('');

  app.innerHTML = `
    <div class="topbar">
      <button class="icon-btn" id="back" aria-label="Назад">${UI_ICO.back}</button>
      <div class="title">Панель родителей · v${CFG.version}</div>
    </div>
    ${kidCards}
    <div class="card" style="margin-bottom:14px">
      <h3>🤖 Аналитика и развитие с Gemini</h3>
      <p class="small muted">Скачайте компактный AI-дайджест (скорость ответов, сложные слова, активность за 14 дней) и передайте его Gemini для анализа и доработки следующей версии.</p>
      <button class="btn ok" id="dlDigest">🤖 Скачать AI-дайджест для Gemini (.json)</button>
    </div>
    <div class="card">
      <h3>☁️ Онлайн-синхронизация (GitHub)</h3>
      <p id="syncSt" class="small">${syncText()}</p>
      <div class="form">
        <label>Токен GitHub (Contents: Read & Write)
          <input type="password" id="tokInp" value="${esc(ghToken())}" placeholder="github_pat_...">
        </label>
        <div class="row">
          <button class="btn small" id="saveTok">Сохранить и синхронизировать</button>
          <button class="btn small ghost" id="copyLink">🔗 Скопировать ссылку для телефона</button>
        </div>
      </div>
    </div>`;

  document.getElementById('back').onclick = () => go('home');
  document.getElementById('dlDigest').onclick = () => {
    const blob = new Blob([JSON.stringify(buildAiDigest(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `slovarik-ai-digest-${today()}.json`;
    a.click();
    toast('✅ AI-дайджест скачан!');
  };
  document.getElementById('saveTok').onclick = async () => {
    const v = document.getElementById('tokInp').value.trim();
    try { localStorage.setItem(TOKEN_KEY, v); } catch (e) { }
    if (await checkToken()) await syncAll(true);
  };
  document.getElementById('copyLink').onclick = () => {
    const t = ghToken(); if (!t) { toast('Сначала сохраните токен'); return; }
    const url = `${WEB_URL}#k=${encodeURIComponent(t)}`;
    navigator.clipboard?.writeText(url).then(() => toast('🔗 Ссылка скопирована! Откройте её на телефоне ребёнка.'));
  };
}

/* ---------- Учёт активного времени и автосинхронизация ---------- */
let lastTick = Date.now(), lastAct = Date.now();
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => lastAct = Date.now(), { passive: true }));
setInterval(() => {
  const now = Date.now(), dt = Math.round((now - lastTick) / 1000); lastTick = now;
  if (cur.pid && cur.active && !document.hidden && now - lastAct < 60000 && dt > 0 && dt < 20) {
    dayRec(P()).sec += dt; saveSoon(); checkGoal();
  }
}, 5000);
setInterval(() => { if (sync.dirty && !sync.busy) syncAll(); }, 30000);
window.addEventListener('online', () => syncAll());
window.addEventListener('beforeunload', () => saveLocal());

/* ---------- Старт ---------- */
if (typeof BG_FX !== 'undefined') BG_FX.init();
go('home');
if (ghToken()) syncAll();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW:', e));
  });
}
